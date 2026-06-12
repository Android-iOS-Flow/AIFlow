"""DeviceDriver + adapter. Đổi nền tảng = thêm 1 driver, không sửa executor."""
from __future__ import annotations

from app.engine.drivers.base import DeviceDriver
from app.models.settings import Settings


def make_driver(settings: Settings) -> DeviceDriver:
    """Factory chọn driver theo settings.driver."""
    name = (settings.driver or "adb").lower()
    if name == "dummy":
        from app.engine.drivers.dummy import DummyDriver

        return DummyDriver()
    from app.engine.drivers.adb import AdbDriver

    return AdbDriver(
        adb_path=settings.adb_path,
        serial=settings.device_serial,
        screenshot_dir=settings.screenshot_dir,
    )


__all__ = ["DeviceDriver", "make_driver"]
