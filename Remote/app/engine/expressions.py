"""Đánh giá biểu thức `condition`/`loop.while` AN TOÀN — KHÔNG dùng eval() trần (spec mục 9).

Chỉ cho phép: literal, tên biến (lấy từ context), so sánh, and/or/not, toán tử số học cơ bản.
Hỗ trợ cú pháp kiểu JS quen thuộc với người dùng web: true/false/null, ==, !=, &&, ||, !.
"""
from __future__ import annotations

import ast
import operator
import re
from typing import Any

from app.models.context import Context

# Toán tử được phép.
_BIN_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
}
_CMP_OPS = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
}


def _normalize(expr: str) -> str:
    """Đổi cú pháp JS -> Python để ast hiểu được."""
    s = expr
    # && || !  ->  and / or / not  (cẩn thận không đụng != và ==)
    s = s.replace("&&", " and ").replace("||", " or ")
    s = re.sub(r"!(?!=)", " not ", s)  # ! không theo sau bởi = -> not
    # true/false/null (đứng riêng) -> True/False/None
    s = re.sub(r"\btrue\b", "True", s)
    s = re.sub(r"\bfalse\b", "False", s)
    s = re.sub(r"\bnull\b", "None", s)
    return s.strip()  # tránh "unexpected indent" do khoảng trắng đầu chuỗi sau khi thay thế


def _eval(node: ast.AST, names: dict[str, Any]) -> Any:
    if isinstance(node, ast.Expression):
        return _eval(node.body, names)
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name):
        return names.get(node.id)
    if isinstance(node, ast.BoolOp):
        vals = [_eval(v, names) for v in node.values]
        if isinstance(node.op, ast.And):
            return all(vals)
        return any(vals)
    if isinstance(node, ast.UnaryOp):
        val = _eval(node.operand, names)
        if isinstance(node.op, ast.Not):
            return not val
        if isinstance(node.op, ast.USub):
            return -val
        if isinstance(node.op, ast.UAdd):
            return +val
    if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
        return _BIN_OPS[type(node.op)](_eval(node.left, names), _eval(node.right, names))
    if isinstance(node, ast.Compare):
        left = _eval(node.left, names)
        for op, comparator in zip(node.ops, node.comparators):
            right = _eval(comparator, names)
            if type(op) not in _CMP_OPS:
                raise ValueError(f"Toán tử so sánh không hỗ trợ: {type(op).__name__}")
            if not _CMP_OPS[type(op)](left, right):
                return False
            left = right
        return True
    raise ValueError(f"Cú pháp không cho phép trong biểu thức: {type(node).__name__}")


def eval_expr(expr: Any, ctx: Context) -> bool:
    """Đánh giá biểu thức boolean trên context.vars/globals. Lỗi -> False (kèm log)."""
    if expr in (None, "", True, False):
        return bool(expr)
    try:
        tree = ast.parse(_normalize(str(expr)), mode="eval")
        result = _eval(tree, ctx.snapshot_names())
        return bool(result)
    except Exception as e:  # noqa: BLE001 — biểu thức người dùng nhập, không để sập task
        ctx.log(f"[warn] biểu thức lỗi '{expr}': {e} -> False")
        return False
