"""Nguồn cấp FlowDocument: từ file JSON cục bộ hoặc Supabase REST (spec mục 11)."""
from __future__ import annotations

import json
from typing import Any

import requests

from app.models.flow import FlowDocument
from app.utils.logging import get_logger

log = get_logger("repo")


class FlowRepository:
    """Tải FlowDocument theo flowId (Supabase) hoặc đường dẫn file."""

    def __init__(self, supabase_url: str = "", publishable_key: str = "", timeout: int = 15):
        self.supabase_url = supabase_url.rstrip("/")
        self.publishable_key = publishable_key
        self.timeout = timeout

    def from_file(self, path: str) -> FlowDocument:
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        doc = FlowDocument.from_dict(raw)
        _warn(doc)
        return doc

    def from_dict(self, raw: dict[str, Any]) -> FlowDocument:
        doc = FlowDocument.from_dict(raw)
        _warn(doc)
        return doc

    def from_supabase(self, flow_id: str) -> FlowDocument:
        """Đọc 1 flow công khai qua REST: GET /rest/v1/flows?id=eq.<id>&select=document."""
        if not self.supabase_url or not self.publishable_key:
            raise RuntimeError("Chưa cấu hình Supabase URL / publishable key (vào Settings).")
        url = f"{self.supabase_url}/rest/v1/flows"
        params = {"id": f"eq.{flow_id}", "select": "document,name"}
        headers = {
            "apikey": self.publishable_key,
            "Authorization": f"Bearer {self.publishable_key}",
        }
        log.info("Tải flow %s từ Supabase…", flow_id)
        resp = requests.get(url, params=params, headers=headers, timeout=self.timeout)
        resp.raise_for_status()
        rows = resp.json()
        if not rows:
            raise RuntimeError(f"Flow '{flow_id}' không tồn tại hoặc không công khai (is_public=false).")
        document = rows[0].get("document")
        if not document:
            raise RuntimeError(f"Flow '{flow_id}' không có trường document.")
        doc = FlowDocument.from_dict(document)
        _warn(doc)
        return doc


def _warn(doc: FlowDocument) -> None:
    for w in doc.validate():
        log.warning("Flow: %s", w)
