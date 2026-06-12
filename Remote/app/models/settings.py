"""Settings model — cài đặt runtime, lưu/đọc từ config.json (web UI chỉnh được).

config.json là NGUỒN CHÍNH lúc chạy; .env chỉ cấp giá trị mặc định ban đầu.
"""
from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field, fields
from typing import Any

# Các khóa bí mật — không hiển thị đầy đủ ra UI/log (chỉ che).
SECRET_KEYS = {"supabase_publishable_key", "ably_api_key"}


@dataclass
class Settings:
    # --- Supabase ---
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    # --- Ably (trigger Run) ---
    ably_api_key: str = ""
    ably_channel: str = "flow-run"
    # --- Web UI ---
    host: str = "127.0.0.1"
    port: int = 8765
    # --- Thiết bị / driver ---
    adb_path: str = ""
    device_serial: str = ""
    driver: str = "adb"  # adb | dummy
    # --- Engine ---
    max_parallel_tasks: int = 4
    screenshot_dir: str = "screenshots"
    auto_start_trigger: bool = False

    # đường dẫn file đang gắn (không serialize)
    _path: str = field(default="", repr=False)

    # --- nạp / lưu ------------------------------------------------------
    @classmethod
    def field_names(cls) -> list[str]:
        return [f.name for f in fields(cls) if not f.name.startswith("_")]

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d.pop("_path", None)
        return d

    def update(self, data: dict[str, Any]) -> None:
        """Cập nhật từ dict (vd form web). Ép kiểu int/bool an toàn, bỏ qua khóa lạ."""
        for name in self.field_names():
            if name not in data:
                continue
            raw = data[name]
            cur = getattr(self, name)
            if isinstance(cur, bool):
                setattr(self, name, _to_bool(raw))
            elif isinstance(cur, int):
                try:
                    setattr(self, name, int(raw))
                except (TypeError, ValueError):
                    pass
            else:
                setattr(self, name, "" if raw is None else str(raw))

    def save(self, path: str | None = None) -> None:
        target = path or self._path
        if not target:
            raise ValueError("Chưa biết đường dẫn để lưu Settings")
        with open(target, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
        self._path = target

    @classmethod
    def load(cls, path: str, env_defaults: dict[str, Any] | None = None) -> "Settings":
        """Đọc config.json; nếu thiếu khóa thì lấy từ env_defaults rồi mặc định dataclass."""
        data: dict[str, Any] = {}
        if env_defaults:
            data.update({k: v for k, v in env_defaults.items() if v not in (None, "")})
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    file_data = json.load(f)
                data.update({k: v for k, v in file_data.items() if not k.startswith("_")})
            except (json.JSONDecodeError, OSError):
                pass
        inst = cls()
        inst.update(data)
        inst._path = path
        return inst

    def masked(self) -> dict[str, Any]:
        """Bản dict để trả ra UI/JSON: che bí mật."""
        d = self.to_dict()
        for k in SECRET_KEYS:
            if d.get(k):
                d[k] = "••••••" + str(d[k])[-4:]
        return d


def _to_bool(v: Any) -> bool:
    if isinstance(v, bool):
        return v
    return str(v).strip().lower() in {"1", "true", "yes", "on", "có"}
