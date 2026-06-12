"""RunnerService — điều phối: tải flow, chạy engine, quản trigger Ably & vòng đời.

Đây là CONTROLLER cốt lõi (không dính Flask) — web.py và run.py đều gọi qua nó.
"""
from __future__ import annotations

import threading
from typing import Any, Optional

from app.engine.drivers import make_driver
from app.engine.executor import Executor
from app.messaging.ably_trigger import AblyTrigger
from app.models.flow import FlowDocument
from app.models.flow_repository import FlowRepository
from app.models.settings import Settings
from app.utils.logging import get_logger

log = get_logger("runner")


class RunnerService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._executors: list[Executor] = []
        self._executors_lock = threading.Lock()
        self._trigger: Optional[AblyTrigger] = None
        self._last_run: dict[str, Any] = {}

    # --- repo theo settings hiện tại ------------------------------------
    def _repo(self) -> FlowRepository:
        return FlowRepository(self.settings.supabase_url, self.settings.supabase_publishable_key)

    # --- chạy flow ------------------------------------------------------
    def run_document(self, doc: FlowDocument, block: bool = False, label: str = "") -> Executor:
        driver = make_driver(self.settings)
        ex = Executor(doc, driver, max_parallel=self.settings.max_parallel_tasks)
        with self._executors_lock:
            self._executors.append(ex)
        self._last_run = {
            "label": label,
            "nodes": len(doc.nodes),
            "entries": [e.id for e in doc.entries()],
            "has_listeners": False,
        }
        log.info("Running flow '%s' (%d nodes)…", label or "(unnamed)", len(doc.nodes))
        ex.run(block=block)
        self._last_run["has_listeners"] = ex.has_listeners()
        if block and not ex.has_listeners():
            self._remove(ex)
        return ex

    def run_flow_by_id(self, flow_id: str, block: bool = False) -> None:
        doc = self._repo().from_supabase(flow_id)
        self.run_document(doc, block=block, label=f"id:{flow_id}")

    def run_flow_from_file(self, path: str, block: bool = True) -> None:
        doc = self._repo().from_file(path)
        self.run_document(doc, block=block, label=f"file:{path}")

    # --- trigger Ably ("Run" từ web app) --------------------------------
    def start_trigger(self) -> bool:
        if self._trigger and self._trigger.running:
            return True

        def on_run(payload: dict) -> None:
            flow_id = payload.get("flowId") or payload.get("flow") or payload.get("id")
            if not flow_id:
                log.warning("Run command missing flowId: %r", payload)
                return
            try:
                self.run_flow_by_id(str(flow_id), block=False)
            except Exception as e:  # noqa: BLE001
                log.error("Running flow %s from trigger failed: %s", flow_id, e)

        self._trigger = AblyTrigger(self.settings.ably_api_key, self.settings.ably_channel, on_run)
        return self._trigger.start()

    def stop_trigger(self) -> None:
        if self._trigger:
            self._trigger.stop()
            self._trigger = None

    def trigger_running(self) -> bool:
        return bool(self._trigger and self._trigger.running)

    # --- trạng thái cho dashboard ---------------------------------------
    def status(self) -> dict[str, Any]:
        with self._executors_lock:
            active = sum(ex.active_tasks() for ex in self._executors)
            listeners = sum(1 for ex in self._executors if ex.has_listeners())
            n_exec = len(self._executors)
        driver = make_driver(self.settings)
        try:
            health = driver.health()
        except Exception as e:  # noqa: BLE001
            health = {"ok": False, "detail": str(e)}
        return {
            "trigger_running": self.trigger_running(),
            "active_tasks": active,
            "executors": n_exec,
            "listeners": listeners,
            "driver": self.settings.driver,
            "device": health,
            "last_run": self._last_run,
            "adb_scan_interval": self.settings.adb_scan_interval,
        }

    def _remove(self, ex: Executor) -> None:
        with self._executors_lock:
            if ex in self._executors:
                self._executors.remove(ex)

    # --- tắt sạch -------------------------------------------------------
    def shutdown(self) -> None:
        self.stop_trigger()
        with self._executors_lock:
            execs = list(self._executors)
        for ex in execs:
            ex.stop()
        log.info("RunnerService shut down.")
