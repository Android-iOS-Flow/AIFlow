"""Test engine bằng DummyDriver (không cần adb). Chạy: python -m pytest  hoặc  python tests/test_executor.py"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.engine.drivers.dummy import DummyDriver  # noqa: E402
from app.engine.executor import Executor  # noqa: E402
from app.engine.expressions import eval_expr  # noqa: E402
from app.models.context import Context, resolve_path, resolve_value  # noqa: E402
from app.models.flow import FlowDocument  # noqa: E402


def _doc(nodes, edges, globals_=None):
    return FlowDocument.from_dict({"version": 1, "nodes": nodes, "edges": edges, "globals": globals_ or []})


def test_resolve_value_literal_global_var():
    ctx = Context(globals={"u": "alice"}, vars={"dev": "X1"})
    assert resolve_value("plain", ctx) == "plain"
    assert resolve_value({"$global": "u"}, ctx) == "alice"
    assert resolve_value({"$var": "dev"}, ctx) == "X1"
    # node ghi đè global qua vars
    ctx.vars["u"] = "bob"
    assert resolve_value({"$global": "u"}, ctx) == "bob"


def test_resolve_path_payload():
    ctx = Context(payload={"command": "login"})
    assert resolve_path("payload.command", ctx) == "login"
    assert resolve_path("payload.missing", ctx) is None


def test_eval_expr_js_syntax():
    ctx = Context(vars={"foundElement": True, "n": 3})
    assert eval_expr("foundElement == true", ctx) is True
    assert eval_expr("foundElement == false", ctx) is False
    assert eval_expr("n > 2 && n < 5", ctx) is True
    assert eval_expr("!foundElement", ctx) is False


def test_condition_branches_to_false_with_dummy():
    # DummyDriver.find_element luôn None -> foundElement False -> đi nhánh 'false'.
    nodes = [
        {"id": "s", "type": "start", "data": {"type": "start", "label": "", "values": {}}},
        {"id": "f", "type": "findElement", "data": {"type": "findElement", "label": "",
            "values": {"selector": "x.png", "timeout": 10}}},
        {"id": "c", "type": "condition", "data": {"type": "condition", "label": "",
            "values": {"expression": "foundElement == true"}}},
        {"id": "yes", "type": "screenshot", "data": {"type": "screenshot", "label": "",
            "values": {"filename": "yes.png"}}},
        {"id": "no", "type": "screenshot", "data": {"type": "screenshot", "label": "",
            "values": {"filename": "no.png"}}},
        {"id": "e1", "type": "end", "data": {"type": "end", "label": "", "values": {}}},
        {"id": "e2", "type": "end", "data": {"type": "end", "label": "", "values": {}}},
    ]
    edges = [
        {"id": "1", "source": "s", "target": "f"},
        {"id": "2", "source": "f", "target": "c"},
        {"id": "3", "source": "c", "sourceHandle": "true", "target": "yes"},
        {"id": "4", "source": "c", "sourceHandle": "false", "target": "no"},
        {"id": "5", "source": "yes", "target": "e1"},
        {"id": "6", "source": "no", "target": "e2"},
    ]
    doc = _doc(nodes, edges)
    captured = []
    driver = DummyDriver()
    driver.screenshot = lambda fn: captured.append(fn) or fn  # type: ignore
    ex = Executor(doc, driver)
    ex.run(block=True)
    assert captured == ["no.png"]  # đã rẽ đúng nhánh false


def test_switch_routes_by_payload():
    nodes = [
        {"id": "p", "type": "pusherListen", "data": {"type": "pusherListen", "label": "",
            "values": {"appKey": "", "cluster": "", "channel": "", "event": ""}}},
        {"id": "sw", "type": "switch", "data": {"type": "switch", "label": "",
            "values": {"source": "payload.command", "cases": "login,post"}}},
        {"id": "login", "type": "screenshot", "data": {"type": "screenshot", "label": "",
            "values": {"filename": "login.png"}}},
        {"id": "le", "type": "end", "data": {"type": "end", "label": "", "values": {}}},
    ]
    edges = [
        {"id": "1", "source": "p", "target": "sw"},
        {"id": "2", "source": "sw", "sourceHandle": "login", "target": "login"},
        {"id": "3", "source": "login", "target": "le"},
    ]
    doc = _doc(nodes, edges)
    captured = []
    driver = DummyDriver()
    driver.screenshot = lambda fn: captured.append(fn) or fn  # type: ignore
    ex = Executor(doc, driver)
    # gọi walk trực tiếp với payload mô phỏng sự kiện pusher
    ctx = ex._make_ctx({"command": "login"})
    ex.walk("sw", ctx)
    assert captured == ["login.png"]


def test_loop_count_runs_n_times():
    nodes = [
        {"id": "s", "type": "start", "data": {"type": "start", "label": "", "values": {}}},
        {"id": "lp", "type": "loop", "data": {"type": "loop", "label": "",
            "values": {"mode": "count", "count": 3, "condition": ""}}},
        {"id": "t", "type": "tap", "data": {"type": "tap", "label": "", "values": {"x": 1, "y": 2}}},
        {"id": "e", "type": "end", "data": {"type": "end", "label": "", "values": {}}},
    ]
    edges = [
        {"id": "1", "source": "s", "target": "lp"},
        {"id": "2", "source": "lp", "target": "t"},
        {"id": "3", "source": "t", "target": "e"},
    ]
    doc = _doc(nodes, edges)
    taps = []
    driver = DummyDriver()
    driver.tap = lambda x, y: taps.append((x, y))  # type: ignore
    ex = Executor(doc, driver)
    ex.run(block=True)
    assert len(taps) == 3


def _run_all():
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"  [OK] {fn.__name__}")
    print(f"\n{len(fns)} test PASS.")


if __name__ == "__main__":
    _run_all()
