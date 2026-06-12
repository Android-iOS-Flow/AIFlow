"""Executor — duyệt graph theo REMOTE_SPEC.md mục 3 & 7.

- entry `start`   : chạy ngay.
- entry `pusherListen`: đăng ký daemon; mỗi sự kiện spawn một lượt task SONG SONG.
- condition/switch: rẽ nhánh theo sourceHandle.
- loop            : lặp sub-flow phía sau.
Mỗi field đi qua resolve_value trước khi dùng. Lệnh UI toàn cục bọc trong mutex để
các task song song không đụng độ (spec mục 9).
"""
from __future__ import annotations

import time
from threading import Event, Lock, Semaphore, Thread
from typing import Any, Optional

from app.engine.drivers.base import DeviceDriver
from app.engine.expressions import eval_expr
from app.models.context import Context, resolve_path, resolve_value
from app.models.flow import FlowDocument, FlowEdge, FlowNode
from app.utils.logging import get_logger

log = get_logger("engine")

MAX_STEPS = 10_000

# Node không sinh hành động vật lý (xử lý ở walk hoặc là entry/no-op).
_NO_ACTION = {"start", "end", "condition", "switch", "loop", "pusherListen"}

# Lệnh thao tác UI toàn cục -> cần critical-section khi chạy song song.
_GLOBAL_UI = {"tap", "swipe", "inputText", "home", "back"}


class Executor:
    def __init__(self, doc: FlowDocument, driver: DeviceDriver, max_parallel: int = 4):
        self.doc = doc
        self.driver = driver
        self._sem = Semaphore(max(1, max_parallel))
        self._ui_lock = Lock()
        self._stop = Event()
        self._threads: list[Thread] = []
        self._listeners: list[Any] = []  # đối tượng listener có .stop()
        self._active = 0
        self._active_lock = Lock()

    # --- API công khai --------------------------------------------------
    def run(self, block: bool = True) -> None:
        """Start flow execution. block=True: run entry start sequentially (CLI/one-shot).
        block=False: spawn thread for each entry start (daemon/web)."""
        entries = self.doc.entries()
        if not entries:
            log.warning("Flow has no entry nodes to run.")
        for entry in entries:
            if entry.type == "pusherListen":
                self._register_pusher(entry)
            elif block:
                self._task(entry.id, payload=None)
            else:
                self._spawn(entry.id, payload=None)

    def has_listeners(self) -> bool:
        return bool(self._listeners)

    def active_tasks(self) -> int:
        with self._active_lock:
            return self._active

    def stop(self) -> None:
        self._stop.set()
        for lis in self._listeners:
            try:
                lis.stop()
            except Exception:  # noqa: BLE001
                pass
        self._listeners.clear()

    # --- spawn task (song song) ----------------------------------------
    def _spawn(self, node_id: str, payload: Any) -> Thread:
        t = Thread(target=self._task, args=(node_id, payload), daemon=True)
        t.start()
        self._threads.append(t)
        return t

    def _task(self, node_id: str, payload: Any) -> None:
        with self._sem:  # limit max parallelism
            with self._active_lock:
                self._active += 1
            try:
                ctx = self._make_ctx(payload)
                self.walk(node_id, ctx)
            except Exception as e:  # noqa: BLE001
                log.error("Task starting from %s failed: %s", node_id, e)
            finally:
                with self._active_lock:
                    self._active -= 1

    def _make_ctx(self, payload: Any) -> Context:
        return Context(
            globals=dict(self.doc.globals_map()),
            vars={},
            payload=payload,
            log=lambda m: log.info("%s", m),
        )

    # --- pusherListen ---------------------------------------------------
    def _register_pusher(self, node: FlowNode) -> None:
        from app.messaging.pusher_listener import PusherListener  # import muộn (lib tùy chọn)

        outs = self.doc.out_edges(node.id)
        next_target = outs[0].target if outs else None
        if not next_target:
            log.warning("pusherListen %s has no outgoing edges -> skipping.", node.id)
            return

        def on_event(payload: Any) -> None:
            # Each event = 1 independent task, runs in parallel (doesn't block listener).
            self._spawn(next_target, payload)

        listener = PusherListener(
            app_key=str(resolve_value(node.values.get("appKey"), self._make_ctx(None))),
            cluster=str(resolve_value(node.values.get("cluster"), self._make_ctx(None))),
            channel=str(resolve_value(node.values.get("channel"), self._make_ctx(None))),
            event=str(resolve_value(node.values.get("event"), self._make_ctx(None))),
            on_event=on_event,
        )
        if listener.start():
            self._listeners.append(listener)

    # --- duyệt graph ----------------------------------------------------
    def walk(self, node_id: str, ctx: Context) -> None:
        current: Optional[str] = node_id
        steps = 0
        while current and steps < MAX_STEPS and not self._stop.is_set():
            steps += 1
            node = self.doc.node(current)
            if node is None:
                break
            if node.type == "end":
                break

            try:
                self.exec_node(node, ctx)
            except Exception as e:  # noqa: BLE001 — node error shouldn't kill entire task
                log.error("Node %s (%s) failed: %s", node.id, node.type, e)
                break

            outs = self.doc.out_edges(node.id)
            if node.type == "condition":
                branch = "true" if eval_expr(node.values.get("expression"), ctx) else "false"
                current = _target_for(outs, branch)
            elif node.type == "switch":
                value = str(resolve_path(node.values.get("source"), ctx))
                current = _target_for(outs, value) or _target_for(outs, "default")
            elif node.type == "loop":
                self._run_loop(node, outs, ctx)
                break  # sub-flow tự kết thúc tại 'end'
            else:
                current = outs[0].target if outs else None

        if steps >= MAX_STEPS:
            log.warning("Reached %d steps limit (suspected cycle) — stopping branch.", MAX_STEPS)

    def _run_loop(self, node: FlowNode, outs: list[FlowEdge], ctx: Context) -> None:
        next_target = outs[0].target if outs else None
        if not next_target:
            return
        mode = str(resolve_value(node.values.get("mode"), ctx) or "count")
        if mode == "count":
            times = int(_num(resolve_value(node.values.get("count"), ctx)) or 0)
            for _ in range(times):
                if self._stop.is_set():
                    break
                self.walk(next_target, ctx)
        else:  # while
            guard = 0
            while (not self._stop.is_set()
                   and guard < MAX_STEPS
                   and eval_expr(node.values.get("condition"), ctx)):
                guard += 1
                self.walk(next_target, ctx)

    # --- thực thi 1 node -> driver -------------------------------------
    def exec_node(self, node: FlowNode, ctx: Context) -> None:
        t = node.type
        if t in _NO_ACTION:
            return
        v = node.values

        def rv(key: str, default: Any = None) -> Any:
            return resolve_value(v.get(key, default), ctx)

        if t == "managerApp":
            action = str(rv("action"))
            pkg = str(rv("package"))
            perm = rv("permission")
            result = self.driver.app(action, pkg, str(perm) if perm else None)
            if action == "info":
                ctx.vars["appInfo"] = result
            return

        if t == "tap":
            self._ui(lambda: self.driver.tap(_num(rv("x")), _num(rv("y"))))
            return

        if t == "swipe":
            self._ui(lambda: self.driver.swipe(
                _num(rv("x1")), _num(rv("y1")), _num(rv("x2")), _num(rv("y2")),
                int(_num(rv("duration")) or 300)))
            return

        if t == "inputText":
            text = rv("text")
            selector = rv("selector")
            self._ui(lambda: self.driver.input_text(
                "" if text is None else str(text),
                str(selector) if selector else None))
            return

        if t == "wait":
            ms = int(_num(rv("ms")) or 0)
            self._sleep(ms)
            return

        if t == "findElement":
            selector = str(rv("selector") or "")
            timeout = int(_num(rv("timeout")) or 5000)
            el = self.driver.find_element(selector, timeout)
            ctx.vars["foundElement"] = el is not None
            ctx.vars["lastElement"] = el
            ctx.log(f"findElement '{selector}' -> {'FOUND ' + str(el) if el else 'NOT FOUND'}")
            return

        if t == "screenshot":
            filename = str(rv("filename") or "screenshot.png")
            path = self.driver.screenshot(filename)
            ctx.vars["lastScreenshot"] = path
            return

        if t == "home":
            self._ui(lambda: self.driver.keyevent("HOME"))
            return

        if t == "back":
            self._ui(lambda: self.driver.keyevent("BACK"))
            return

        if t == "adbCommand":
            command = str(rv("command") or "")
            args = rv("args")
            out = self.driver.run_command(command, str(args) if args else None)
            ctx.vars["lastCommandOutput"] = out
            return

        log.warning("Unsupported node type: %s (id=%s) — skipping.", t, node.id)

    # --- tiện ích -------------------------------------------------------
    def _ui(self, fn) -> None:
        """Bọc thao tác UI toàn cục trong critical-section (tránh đụng độ song song)."""
        with self._ui_lock:
            fn()

    def _sleep(self, ms: int) -> None:
        # Ngủ theo lát để còn phản ứng khi stop().
        end = time.monotonic() + ms / 1000.0
        while time.monotonic() < end and not self._stop.is_set():
            time.sleep(min(0.1, end - time.monotonic()))


def _target_for(edges: list[FlowEdge], handle: str) -> Optional[str]:
    for e in edges:
        if e.source_handle == handle:
            return e.target
    return None


def _num(v: Any) -> float:
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).strip())
    except (TypeError, ValueError):
        return 0.0
