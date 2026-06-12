"""DeviceDriver — lớp trừu tượng nền tảng (REMOTE_SPEC.md mục 6).

Executor KHÔNG gọi adb trực tiếp; nó gọi interface này. Mọi method đồng bộ (blocking)
để đơn giản & chạy tốt trên Termux; tính song song do executor quản bằng thread.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional


class DeviceDriver(ABC):
    @abstractmethod
    def tap(self, x: float, y: float) -> None: ...

    @abstractmethod
    def swipe(self, x1: float, y1: float, x2: float, y2: float, duration_ms: int) -> None: ...

    @abstractmethod
    def input_text(self, text: str, selector: Optional[str] = None) -> None: ...

    @abstractmethod
    def keyevent(self, key: str) -> None:  # 'HOME' | 'BACK'
        ...

    @abstractmethod
    def screenshot(self, filename: str) -> str:  # trả về path
        ...

    @abstractmethod
    def find_element(self, selector: str, timeout_ms: int) -> Optional[dict]:
        """Trả {'x','y','w','h'} nếu thấy, None nếu không."""
        ...

    @abstractmethod
    def app(self, action: str, pkg: str, permission: Optional[str] = None) -> Any:
        """action: open|close|kill|grant|info. 'info' trả object."""
        ...

    @abstractmethod
    def run_command(self, command: str, args: Optional[str] = None) -> str:
        """adbCommand -> stdout."""
        ...

    # Hook tùy chọn: kiểm tra thiết bị sẵn sàng (UI hiển thị trạng thái).
    def health(self) -> dict:
        return {"ok": True, "detail": self.__class__.__name__}
