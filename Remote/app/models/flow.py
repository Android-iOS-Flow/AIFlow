"""FlowDocument & các thực thể graph — phản chiếu hợp đồng dữ liệu trong REMOTE_SPEC.md mục 2.

Đây là MODEL thuần: chỉ parse/validate/truy vấn graph, không biết gì về driver hay web.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Iterable

# FieldValue = literal | {"$global": name} | {"$var": name}  (xem spec mục 2)
FieldValue = Any


@dataclass
class GlobalVar:
    name: str
    value: Any
    description: str = ""


@dataclass
class FlowNode:
    id: str
    type: str
    values: dict[str, FieldValue] = field(default_factory=dict)
    label: str = ""

    @property
    def is_entry_candidate(self) -> bool:
        # 'pusherListen' là entry "thường trực"; xác định entry thực tế ở FlowDocument.entries().
        return True


@dataclass
class FlowEdge:
    id: str
    source: str
    target: str
    source_handle: str | None = None  # chỉ condition/switch dùng


@dataclass
class FlowDocument:
    version: int = 1
    nodes: list[FlowNode] = field(default_factory=list)
    edges: list[FlowEdge] = field(default_factory=list)
    globals: list[GlobalVar] = field(default_factory=list)

    # --- chỉ mục tra cứu nhanh (dựng 1 lần) -------------------------------
    def __post_init__(self) -> None:
        self._by_id: dict[str, FlowNode] = {n.id: n for n in self.nodes}
        self._out: dict[str, list[FlowEdge]] = {}
        for e in self.edges:
            self._out.setdefault(e.source, []).append(e)
        self._targets: set[str] = {e.target for e in self.edges}

    def node(self, node_id: str) -> FlowNode | None:
        return self._by_id.get(node_id)

    def out_edges(self, node_id: str) -> list[FlowEdge]:
        """Cạnh đi ra khỏi node, giữ nguyên thứ tự xuất hiện (spec mục 3.2)."""
        return self._out.get(node_id, [])

    def entries(self) -> list[FlowNode]:
        """Entry = node không có edge nào trỏ tới (spec mục 3.1)."""
        return [n for n in self.nodes if n.id not in self._targets]

    def globals_map(self) -> dict[str, Any]:
        return {g.name: g.value for g in self.globals}

    # --- nạp từ JSON -----------------------------------------------------
    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "FlowDocument":
        """Dựng FlowDocument từ JSON đã parse. Bỏ qua field hiển thị (position, animated...)."""
        if not isinstance(raw, dict):
            raise ValueError("FlowDocument phải là object JSON")

        nodes: list[FlowNode] = []
        for n in raw.get("nodes", []) or []:
            data = n.get("data", {}) or {}
            node_type = data.get("type") or n.get("type")
            if not n.get("id") or not node_type:
                raise ValueError(f"Node thiếu id hoặc type: {n!r}")
            nodes.append(
                FlowNode(
                    id=str(n["id"]),
                    type=str(node_type),
                    values=dict(data.get("values", {}) or {}),
                    label=str(data.get("label", "")),
                )
            )

        edges: list[FlowEdge] = []
        for e in raw.get("edges", []) or []:
            if not e.get("source") or not e.get("target"):
                # Edge hỏng -> bỏ qua thay vì sập cả flow.
                continue
            edges.append(
                FlowEdge(
                    id=str(e.get("id", f"{e['source']}->{e['target']}")),
                    source=str(e["source"]),
                    target=str(e["target"]),
                    source_handle=e.get("sourceHandle"),
                )
            )

        globals_: list[GlobalVar] = []
        for g in raw.get("globals", []) or []:
            if "name" not in g:
                continue
            globals_.append(
                GlobalVar(name=str(g["name"]), value=g.get("value"), description=str(g.get("description", "")))
            )

        return cls(version=int(raw.get("version", 1)), nodes=nodes, edges=edges, globals=globals_)

    def validate(self) -> list[str]:
        """Trả về danh sách cảnh báo (không ném lỗi). Rỗng = sạch."""
        warnings: list[str] = []
        if not self.nodes:
            warnings.append("Flow rỗng: không có node nào.")
        if not self.entries():
            warnings.append("Không tìm thấy node entry (mọi node đều có cạnh vào) — có thể có chu trình.")
        ids = {n.id for n in self.nodes}
        for e in self.edges:
            if e.target not in ids:
                warnings.append(f"Edge {e.id} trỏ tới node không tồn tại: {e.target}")
            if e.source not in ids:
                warnings.append(f"Edge {e.id} xuất phát từ node không tồn tại: {e.source}")
        return warnings


def list_required_vars(doc: FlowDocument) -> set[str]:
    """Quét toàn bộ node liệt kê các tên `$var` mà tool remote cần cấp (spec mục 4.1)."""
    names: set[str] = set()

    def scan(v: Any) -> None:
        if isinstance(v, dict) and "$var" in v:
            names.add(str(v["$var"]))

    for n in doc.nodes:
        for val in n.values.values():
            scan(val)
    return names


def iter_nodes_of_type(doc: FlowDocument, node_type: str) -> Iterable[FlowNode]:
    return (n for n in doc.nodes if n.type == node_type)
