"""Phát hiện nền tảng & dò đường dẫn adb — điểm khác biệt Windows vs Termux gói gọn ở đây."""
from __future__ import annotations

import os
import shutil
import sys


def is_termux() -> bool:
    """Đoán xem có đang chạy trong Termux (Android) không."""
    prefix = os.environ.get("PREFIX", "")
    return "com.termux" in prefix or os.path.isdir("/data/data/com.termux")


def is_windows() -> bool:
    return sys.platform.startswith("win")


def platform_name() -> str:
    if is_termux():
        return "termux"
    if is_windows():
        return "windows"
    return sys.platform


# Các vị trí adb hay gặp ngoài PATH (best-effort, không bắt buộc đúng hết).
_COMMON_ADB_PATHS = [
    "/data/data/com.termux/files/usr/bin/adb",  # Termux: pkg install android-tools
    "/usr/bin/adb",
    "/usr/local/bin/adb",
    os.path.expanduser("~/platform-tools/adb"),
    os.path.expanduser("~/Android/Sdk/platform-tools/adb"),
    os.path.expanduser("~/AppData/Local/Android/Sdk/platform-tools/adb.exe"),
    r"C:\platform-tools\adb.exe",
]


def find_adb(explicit: str | None = None) -> str | None:
    """Tìm executable adb. Ưu tiên đường dẫn người dùng cấu hình, rồi PATH, rồi vị trí phổ biến.

    Trả về None nếu không tìm thấy (caller nên cảnh báo, không sập).
    """
    if explicit:
        if os.path.isfile(explicit):
            return explicit
        found = shutil.which(explicit)
        if found:
            return found
    on_path = shutil.which("adb")
    if on_path:
        return on_path
    for p in _COMMON_ADB_PATHS:
        if os.path.isfile(p):
            return p
    return None
