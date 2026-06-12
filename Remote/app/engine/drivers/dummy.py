"""DummyDriver — chỉ ghi log, không điều khiển thiết bị thật.

Dùng để: test executor trên máy không có adb (vd CI), demo flow trên Termux/Windows.
"""
from __future__ import annotations

from typing import Any, Optional

from app.engine.drivers.base import DeviceDriver
from app.utils.logging import get_logger

log = get_logger("driver.dummy")


class DummyDriver(DeviceDriver):
    def tap(self, x: float, y: float) -> None:
        log.info("tap(%s, %s)", x, y)

    def swipe(self, x1: float, y1: float, x2: float, y2: float, duration_ms: int) -> None:
        log.info("swipe(%s,%s -> %s,%s, %sms)", x1, y1, x2, y2, duration_ms)

    def input_text(self, text: str, selector: Optional[str] = None) -> None:
        log.info("input_text(%r, selector=%r)", text, selector)

    def keyevent(self, key: str) -> None:
        log.info("keyevent(%s)", key)

    def screenshot(self, filename: str) -> str:
        log.info("screenshot(%s)", filename)
        return filename

    def find_element(self, selector: str, timeout_ms: int) -> Optional[dict]:
        # Giả lập: luôn "không thấy" để nhánh false được test; đổi tùy ý khi demo.
        log.info("find_element(%r, timeout=%s) -> None (dummy)", selector, timeout_ms)
        return None

    def app(self, action: str, pkg: str, permission: Optional[str] = None) -> Any:
        log.info("app(action=%s, pkg=%s, perm=%s)", action, pkg, permission)
        if action == "info":
            return {"package": pkg, "dummy": True}
        return None

    def run_command(self, command: str, args: Optional[str] = None) -> str:
        log.info("run_command(%r, args=%r)", command, args)
        return ""
