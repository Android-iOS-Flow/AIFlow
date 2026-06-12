"""Logging dùng chung + một ring-buffer giữ log gần nhất cho dashboard hiển thị.

Cross-platform: chỉ dùng thư viện chuẩn, chạy y hệt trên Windows & Termux.
"""
from __future__ import annotations

import logging
import sys
from collections import deque
from threading import Lock
from typing import Deque

_CONFIGURED = False
_LEVEL = logging.INFO

# Bộ đệm vòng các dòng log gần nhất — controller/web đọc để render dashboard.
_RING: Deque[dict] = deque(maxlen=500)
_RING_LOCK = Lock()


class _RingHandler(logging.Handler):
    """Đẩy mỗi bản ghi log vào ring-buffer (an toàn đa luồng)."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            entry = {
                "time": self.formatter.formatTime(record) if self.formatter else "",
                "level": record.levelname,
                "name": record.name,
                "msg": record.getMessage(),
            }
        except Exception:  # noqa: BLE001 — không bao giờ để logging làm sập app
            return
        with _RING_LOCK:
            _RING.append(entry)


def _configure() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s | %(message)s", "%H:%M:%S")

    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(fmt)

    ring = _RingHandler()
    ring.setFormatter(fmt)

    root = logging.getLogger("remote")
    root.setLevel(_LEVEL)
    root.addHandler(stream)
    root.addHandler(ring)
    root.propagate = False
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Trả về logger con dưới namespace 'remote'."""
    _configure()
    return logging.getLogger(f"remote.{name}")


def recent_logs(limit: int = 200) -> list[dict]:
    """Lấy các dòng log gần nhất (cho dashboard)."""
    with _RING_LOCK:
        items = list(_RING)
    return items[-limit:]
