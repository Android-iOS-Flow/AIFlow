"""AblyTrigger — lắng nghe lệnh 'Run' từ web app trên kênh Ably (mặc định 'flow-run').

Web app publish event `run` với payload `{flowId, name, at}` (xem Flow/Run/RunButton).
Để tránh phụ thuộc SDK `ably` (async-only, nặng trên Termux), ở đây dùng **Ably SSE**
qua `requests` — chỉ cần thư viện đã có sẵn, chạy giống nhau trên Windows & Termux.

Tài liệu SSE: GET https://realtime.ably.io/sse?v=1.2&channels=<ch>&key=<apiKey>
"""
from __future__ import annotations

import json
import threading
import time
from typing import Any, Callable

import requests

from app.utils.logging import get_logger

log = get_logger("ably")

_SSE_URL = "https://realtime.ably.io/sse"
_RUN_EVENT = "run"


class AblyTrigger:
    def __init__(self, api_key: str, channel: str, on_run: Callable[[dict], None]):
        self.api_key = api_key
        self.channel = channel or "flow-run"
        self.on_run = on_run
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._resp: requests.Response | None = None
        self.running = False

    def start(self) -> bool:
        if not self.api_key:
            log.warning("Chưa cấu hình Ably API key -> không bật trigger Run.")
            return False
        if self.running:
            return True
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        self.running = True
        log.info("Ably trigger: lắng nghe kênh '%s' (event '%s').", self.channel, _RUN_EVENT)
        return True

    def stop(self) -> None:
        self._stop.set()
        self.running = False
        if self._resp is not None:
            try:
                self._resp.close()
            except Exception:  # noqa: BLE001
                pass
        log.info("Ably trigger: đã dừng.")

    # --- vòng lặp kết nối + tự reconnect --------------------------------
    def _loop(self) -> None:
        backoff = 1
        while not self._stop.is_set():
            try:
                self._connect_and_stream()
                backoff = 1  # reset sau khi kết nối thành công
            except Exception as e:  # noqa: BLE001
                if self._stop.is_set():
                    break
                log.warning("Ably SSE mất kết nối: %s — thử lại sau %ds", e, backoff)
                self._stop.wait(backoff)
                backoff = min(backoff * 2, 30)

    def _connect_and_stream(self) -> None:
        params = {"v": "1.2", "channels": self.channel, "key": self.api_key}
        self._resp = requests.get(_SSE_URL, params=params, stream=True, timeout=(10, 65))
        self._resp.raise_for_status()

        data_lines: list[str] = []
        for raw in self._resp.iter_lines(decode_unicode=True):
            if self._stop.is_set():
                return
            if raw is None:
                continue
            line = raw.rstrip("\r")
            if line == "":
                # Hết một message SSE -> xử lý.
                if data_lines:
                    self._handle_data("\n".join(data_lines))
                    data_lines = []
                continue
            if line.startswith(":"):
                continue  # heartbeat / comment
            if line.startswith("data:"):
                data_lines.append(line[5:].lstrip())

    def _handle_data(self, data: str) -> None:
        try:
            msg = json.loads(data)
        except json.JSONDecodeError:
            return
        # Bao SSE của Ably: thực thể có thể là message hoặc envelope chứa message.
        message = msg.get("data", msg) if isinstance(msg, dict) else msg
        if not isinstance(message, dict):
            return
        name = message.get("name")
        if name != _RUN_EVENT:
            return
        payload = message.get("data", {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                pass
        log.info("Ably: nhận lệnh Run -> %r", payload)
        try:
            self.on_run(payload if isinstance(payload, dict) else {"raw": payload})
        except Exception as e:  # noqa: BLE001
            log.error("Xử lý lệnh Run lỗi: %s", e)
