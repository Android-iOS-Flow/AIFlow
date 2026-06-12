"""AdbDriver — adapter ADB mặc định (REMOTE_SPEC.md mục 6).

Chạy `adb` qua subprocess nên giống nhau trên Windows & Termux (chỉ khác đường dẫn adb).
findElement: selector ảnh -> OpenCV template matching (nếu có opencv); selector text/id ->
uiautomator dump. Cả hai best-effort, thiếu opencv vẫn không sập.
"""
from __future__ import annotations

import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from typing import Any, Optional

from app.config import abs_path
from app.engine.drivers.base import DeviceDriver
from app.utils.logging import get_logger
from app.utils.platform import find_adb

log = get_logger("driver.adb")

_IMAGE_EXT = (".png", ".jpg", ".jpeg", ".bmp", ".webp")


class AdbError(RuntimeError):
    pass


class AdbDriver(DeviceDriver):
    def __init__(self, adb_path: str = "", serial: str = "", screenshot_dir: str = "screenshots"):
        resolved = find_adb(adb_path or None)
        if not resolved:
            log.warning("Không tìm thấy 'adb'. Cài platform-tools hoặc đặt ADB_PATH. "
                        "Các lệnh sẽ lỗi cho tới khi có adb.")
        self.adb = resolved or "adb"
        self.serial = serial
        self.screenshot_dir = abs_path(screenshot_dir)
        os.makedirs(self.screenshot_dir, exist_ok=True)

    # --- lõi gọi adb ----------------------------------------------------
    def _base(self) -> list[str]:
        cmd = [self.adb]
        if self.serial:
            cmd += ["-s", self.serial]
        return cmd

    def _run(self, args: list[str], timeout: int = 30, binary: bool = False) -> Any:
        cmd = self._base() + args
        log.debug("$ %s", " ".join(cmd))
        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                timeout=timeout,
                check=False,
            )
        except FileNotFoundError as e:
            raise AdbError(f"Không chạy được adb ({self.adb}): {e}") from e
        except subprocess.TimeoutExpired as e:
            raise AdbError(f"adb timeout sau {timeout}s: {' '.join(args)}") from e
        if proc.returncode != 0:
            err = proc.stderr.decode("utf-8", "replace").strip()
            raise AdbError(f"adb lỗi (code {proc.returncode}): {err or ' '.join(args)}")
        return proc.stdout if binary else proc.stdout.decode("utf-8", "replace")

    def _shell(self, args: list[str], timeout: int = 30) -> str:
        return self._run(["shell", *args], timeout=timeout)

    # --- thao tác cơ bản ------------------------------------------------
    def tap(self, x: float, y: float) -> None:
        self._shell(["input", "tap", str(int(x)), str(int(y))])

    def swipe(self, x1: float, y1: float, x2: float, y2: float, duration_ms: int) -> None:
        self._shell(["input", "swipe", str(int(x1)), str(int(y1)), str(int(x2)),
                     str(int(y2)), str(int(duration_ms))])

    def input_text(self, text: str, selector: Optional[str] = None) -> None:
        # selector: best-effort focus trước (cần uiautomator để chính xác). ADB cơ bản chỉ gõ text.
        if selector:
            el = self.find_element(selector, 3000)
            if el:
                self.tap(el["x"] + el["w"] / 2, el["y"] + el["h"] / 2)
        # ADB input text: thay khoảng trắng bằng %s, escape ký tự đặc biệt.
        safe = _escape_adb_text(text)
        self._shell(["input", "text", safe])

    def keyevent(self, key: str) -> None:
        code = {"HOME": "3", "BACK": "4"}.get(key.upper(), key)
        self._shell(["input", "keyevent", str(code)])

    def screenshot(self, filename: str) -> str:
        raw = self._run(["exec-out", "screencap", "-p"], timeout=30, binary=True)
        # adb đôi khi chèn \r — chuẩn hoá CRLF của shell Android (hiếm với exec-out, vẫn phòng).
        path = os.path.join(self.screenshot_dir, os.path.basename(filename) or "screenshot.png")
        with open(path, "wb") as f:
            f.write(raw)
        log.info("Đã lưu ảnh: %s", path)
        return path

    def app(self, action: str, pkg: str, permission: Optional[str] = None) -> Any:
        if action == "open":
            return self._shell(["monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"])
        if action == "close":
            return self._shell(["am", "force-stop", pkg])
        if action == "kill":
            return self._shell(["am", "kill", pkg])
        if action == "grant":
            if not permission:
                raise AdbError("action=grant cần 'permission'")
            return self._shell(["pm", "grant", pkg, permission])
        if action == "info":
            out = self._shell(["dumpsys", "package", pkg], timeout=30)
            return _parse_package_info(out, pkg)
        raise AdbError(f"managerApp action không hợp lệ: {action}")

    def run_command(self, command: str, args: Optional[str] = None) -> str:
        parts = command.split()
        if args:
            parts += args.split()
        return self._run(parts, timeout=60)

    def health(self) -> dict:
        try:
            out = self._run(["devices"], timeout=10)
            lines = [l for l in out.splitlines()[1:] if l.strip() and "\tdevice" in l]
            return {"ok": bool(lines), "detail": out.strip(), "adb": self.adb}
        except AdbError as e:
            return {"ok": False, "detail": str(e), "adb": self.adb}

    # --- findElement ----------------------------------------------------
    def find_element(self, selector: str, timeout_ms: int) -> Optional[dict]:
        deadline = time.monotonic() + max(timeout_ms, 0) / 1000.0
        is_image = selector.lower().endswith(_IMAGE_EXT)
        attempts = 0
        while True:
            attempts += 1
            try:
                el = self._match_image(selector) if is_image else self._match_ui(selector)
            except Exception as e:  # noqa: BLE001
                log.warning("find_element lỗi: %s", e)
                el = None
            if el:
                return el
            if time.monotonic() >= deadline:
                return None
            time.sleep(0.4)

    def _match_ui(self, selector: str) -> Optional[dict]:
        """uiautomator dump -> tìm node theo resource-id / text / content-desc."""
        xml = self._dump_ui()
        if not xml:
            return None
        try:
            root = ET.fromstring(xml)
        except ET.ParseError:
            return None
        want = selector.lstrip("#")
        for node in root.iter("node"):
            attrs = node.attrib
            if (want in (attrs.get("resource-id", ""))
                    or attrs.get("text") == selector
                    or attrs.get("content-desc") == selector):
                bounds = _parse_bounds(attrs.get("bounds", ""))
                if bounds:
                    return bounds
        return None

    def _dump_ui(self) -> str:
        # Dump ra stdout (nhiều ROM hỗ trợ '/dev/tty'); fallback dump file rồi cat.
        try:
            out = self._shell(["uiautomator", "dump", "/dev/tty"], timeout=20)
            if "<hierarchy" in out:
                return out[out.index("<hierarchy"):]
        except AdbError:
            pass
        try:
            self._shell(["uiautomator", "dump", "/sdcard/uidump.xml"], timeout=20)
            return self._shell(["cat", "/sdcard/uidump.xml"], timeout=20)
        except AdbError:
            return ""

    def _match_image(self, selector: str) -> Optional[dict]:
        """Template matching bằng OpenCV (tùy chọn). Thiếu opencv -> cảnh báo, trả None."""
        try:
            import cv2  # type: ignore
            import numpy as np  # type: ignore
        except ImportError:
            log.warning("findElement theo ảnh cần opencv-python + numpy "
                        "(pip install -r requirements-optional.txt). Bỏ qua '%s'.", selector)
            return None

        tpl_path = abs_path(selector)
        if not os.path.isfile(tpl_path):
            log.warning("Không thấy file ảnh mẫu: %s", tpl_path)
            return None

        raw = self._run(["exec-out", "screencap", "-p"], timeout=30, binary=True)
        screen = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
        template = cv2.imread(tpl_path, cv2.IMREAD_COLOR)
        if screen is None or template is None:
            return None
        res = cv2.matchTemplate(screen, template, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(res)
        if max_val < 0.8:  # ngưỡng khớp; có thể đưa ra Settings sau
            return None
        h, w = template.shape[:2]
        return {"x": int(max_loc[0]), "y": int(max_loc[1]), "w": int(w), "h": int(h)}


# --- helpers ------------------------------------------------------------
def _escape_adb_text(text: str) -> str:
    s = str(text)
    s = s.replace(" ", "%s")
    for ch in ['"', "'", "&", "<", ">", "|", ";", "(", ")", "`", "$"]:
        s = s.replace(ch, "\\" + ch)
    return s


_BOUNDS_RE = re.compile(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")


def _parse_bounds(bounds: str) -> Optional[dict]:
    m = _BOUNDS_RE.search(bounds or "")
    if not m:
        return None
    x1, y1, x2, y2 = (int(g) for g in m.groups())
    return {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1}


def _parse_package_info(dump: str, pkg: str) -> dict:
    """Rút vài trường hữu ích từ `dumpsys package` (best-effort)."""
    info: dict[str, Any] = {"package": pkg}
    ver = re.search(r"versionName=(\S+)", dump)
    if ver:
        info["versionName"] = ver.group(1)
    code = re.search(r"versionCode=(\d+)", dump)
    if code:
        info["versionCode"] = int(code.group(1))
    info["installed"] = "Unable to find package" not in dump and bool(dump.strip())
    return info
