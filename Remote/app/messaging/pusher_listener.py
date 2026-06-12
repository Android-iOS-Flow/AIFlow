"""PusherListener — hiện thực node `pusherListen` (REMOTE_SPEC.md mục 5.2).

Đăng ký Pusher (websocket) qua lib `pysher` (tùy chọn). Mỗi sự kiện gọi `on_event(payload)`;
Executor sẽ spawn một lượt task song song. Subscription sống tới khi .stop().
"""
from __future__ import annotations

import json
from typing import Any, Callable

from app.utils.logging import get_logger

log = get_logger("pusher")


class PusherListener:
    def __init__(self, app_key: str, cluster: str, channel: str, event: str,
                 on_event: Callable[[Any], None]):
        self.app_key = app_key
        self.cluster = cluster
        self.channel = channel
        self.event = event
        self.on_event = on_event
        self._pusher = None

    def start(self) -> bool:
        """Khởi động listener. Trả False nếu thiếu lib / cấu hình (đã log)."""
        if not self.app_key or not self.channel or not self.event:
            log.warning("pusherListen thiếu appKey/channel/event -> bỏ qua.")
            return False
        try:
            import pysher  # type: ignore
        except ImportError:
            log.warning("Node pusherListen cần 'pysher' (pip install -r requirements-optional.txt). "
                        "Bỏ qua listener cho channel '%s'.", self.channel)
            return False

        try:
            self._pusher = pysher.Pusher(self.app_key, cluster=self.cluster or None)

            def _connected(_data: Any) -> None:
                ch = self._pusher.subscribe(self.channel)
                ch.bind(self.event, self._handle)
                log.info("Pusher: subscribe '%s' bind '%s'", self.channel, self.event)

            self._pusher.connection.bind("pusher:connection_established", _connected)
            self._pusher.connect()
            log.info("Pusher: đang kết nối (cluster=%s)…", self.cluster)
            return True
        except Exception as e:  # noqa: BLE001
            log.error("Khởi động Pusher lỗi: %s", e)
            return False

    def _handle(self, data: Any) -> None:
        payload = data
        if isinstance(data, str):
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                payload = data
        log.info("Pusher event '%s' nhận payload: %r", self.event, payload)
        try:
            self.on_event(payload)
        except Exception as e:  # noqa: BLE001
            log.error("Xử lý sự kiện Pusher lỗi: %s", e)

    def stop(self) -> None:
        if self._pusher is not None:
            try:
                self._pusher.disconnect()
            except Exception:  # noqa: BLE001
                pass
            self._pusher = None
            log.info("Pusher: đã ngắt kết nối '%s'.", self.channel)
