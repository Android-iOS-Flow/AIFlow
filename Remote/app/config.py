"""Cầu nối cấu hình: nạp .env -> giá trị mặc định -> Settings(config.json).

Đặt riêng để run.py / controller chỉ cần gọi load_settings().
"""
from __future__ import annotations

import os

from app.models.settings import Settings

# Thư mục gốc Remote/ (chứa config.json, .env, screenshots/).
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(ROOT_DIR, "config.json")


def _load_dotenv() -> None:
    """Nạp .env nếu có python-dotenv (tùy chọn). Không có cũng không sao."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(os.path.join(ROOT_DIR, ".env"))


def _env_defaults() -> dict[str, object]:
    """Ánh xạ biến môi trường -> khóa Settings (chỉ làm giá trị mặc định ban đầu)."""
    return {
        "supabase_url": os.environ.get("SUPABASE_URL", ""),
        "supabase_publishable_key": os.environ.get("SUPABASE_PUBLISHABLE_KEY", ""),
        "ably_api_key": os.environ.get("ABLY_API_KEY", ""),
        "ably_channel": os.environ.get("ABLY_CHANNEL", ""),
        "host": os.environ.get("REMOTE_HOST", ""),
        "port": os.environ.get("REMOTE_PORT", ""),
        "adb_path": os.environ.get("ADB_PATH", ""),
        "device_serial": os.environ.get("DEVICE_SERIAL", ""),
        "driver": os.environ.get("DRIVER", ""),
    }


def load_settings() -> Settings:
    _load_dotenv()
    return Settings.load(CONFIG_PATH, env_defaults=_env_defaults())


def abs_path(rel: str) -> str:
    """Đổi đường dẫn tương đối (vd screenshot_dir) thành tuyệt đối dưới ROOT_DIR."""
    if os.path.isabs(rel):
        return rel
    return os.path.join(ROOT_DIR, rel)
