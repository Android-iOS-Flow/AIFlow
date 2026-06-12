"""Execution Context + resolveValue/resolvePath — trái tim của việc lấy đúng dữ liệu field.

Tương ứng REMOTE_SPEC.md mục 4. Mọi field PHẢI đi qua resolve_value trước khi dùng.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class Context:
    """Bối cảnh một lượt chạy (một task). Mỗi sự kiện Pusher tạo Context riêng."""

    globals: dict[str, Any] = field(default_factory=dict)  # nạp từ doc.globals
    vars: dict[str, Any] = field(default_factory=dict)     # node ghi ra + tool bơm vào ($var)
    payload: Any = None                                    # dữ liệu sự kiện Pusher (nếu có)
    log: Callable[[str], None] = print

    def snapshot_names(self) -> dict[str, Any]:
        """Không gian tên để đánh giá biểu thức condition: globals trước, vars ghi đè."""
        ns: dict[str, Any] = {}
        ns.update(self.globals)
        ns.update(self.vars)
        return ns


def resolve_value(v: Any, ctx: Context) -> Any:
    """Resolve một FieldValue về giá trị cụ thể (spec mục 4.1).

    - literal           -> trả nguyên.
    - {"$global": name} -> ưu tiên ctx.vars (node ghi đè) rồi tới ctx.globals.
    - {"$var": name}    -> ctx.vars[name] (tool remote bơm vào); None nếu thiếu (cảnh báo).
    """
    if isinstance(v, dict):
        if "$global" in v:
            name = v["$global"]
            if name in ctx.vars:
                return ctx.vars[name]
            return ctx.globals.get(name)
        if "$var" in v:
            name = v["$var"]
            if name not in ctx.vars:
                ctx.log(f"[warn] $var '{name}' chưa được tool cấp -> None")
            return ctx.vars.get(name)
    return v


def resolve_path(path: Any, ctx: Context) -> Any:
    """Lấy giá trị theo đường dẫn 'payload.command' / 'vars.foo' trên context (spec mục 7).

    Hỗ trợ truy cập cả attribute (payload/vars/globals) lẫn key của dict lồng nhau.
    """
    if not isinstance(path, str):
        return path
    parts = path.split(".")
    # Gốc: cho phép tham chiếu trực tiếp payload/vars/globals, hoặc coi như tên trong vars.
    roots: dict[str, Any] = {
        "payload": ctx.payload,
        "vars": ctx.vars,
        "globals": ctx.globals,
    }
    cur: Any
    if parts[0] in roots:
        cur = roots[parts[0]]
        parts = parts[1:]
    else:
        cur = ctx.snapshot_names()
    for k in parts:
        if cur is None:
            return None
        if isinstance(cur, dict):
            cur = cur.get(k)
        else:
            cur = getattr(cur, k, None)
    return cur
