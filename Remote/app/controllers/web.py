"""Web controller (Flask) — VIEW/CONTROLLER cho UI cài đặt + dashboard.

Tách khỏi RunnerService để có thể chạy engine ở chế độ CLI mà không cần Flask.
"""
from __future__ import annotations

import os

from flask import Flask, jsonify, redirect, render_template, request, url_for

from app.controllers.runner import RunnerService
from app.models.settings import Settings
from app.utils.logging import recent_logs
from app.utils.platform import platform_name

_VIEWS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "views")


def create_app(runner: RunnerService) -> Flask:
    app = Flask(
        __name__,
        template_folder=os.path.join(_VIEWS, "templates"),
        static_folder=os.path.join(_VIEWS, "static"),
    )

    # --- Trang ----------------------------------------------------------
    @app.route("/")
    def dashboard():
        return render_template(
            "dashboard.html",
            status=runner.status(),
            platform=platform_name(),
        )

    @app.route("/settings", methods=["GET"])
    def settings_page():
        return render_template(
            "settings.html",
            settings=runner.settings.to_dict(),
            fields=Settings.field_names(),
        )

    @app.route("/settings", methods=["POST"])
    def settings_save():
        runner.settings.update(request.form.to_dict())
        runner.settings.save()
        # Nếu trigger đang chạy, khởi động lại để áp key/kênh mới.
        if runner.trigger_running():
            runner.stop_trigger()
            runner.start_trigger()
        return redirect(url_for("settings_page"))

    # --- Hành động ------------------------------------------------------
    @app.route("/run", methods=["POST"])
    def run_flow():
        flow_id = (request.form.get("flow_id") or "").strip()
        if flow_id:
            try:
                runner.run_flow_by_id(flow_id, block=False)
            except Exception as e:  # noqa: BLE001
                return _flash_error(str(e))
        return redirect(url_for("dashboard"))

    @app.route("/trigger/start", methods=["POST"])
    def trigger_start():
        runner.start_trigger()
        return redirect(url_for("dashboard"))

    @app.route("/trigger/stop", methods=["POST"])
    def trigger_stop():
        runner.stop_trigger()
        return redirect(url_for("dashboard"))

    # --- API (cho JS poll) ---------------------------------------------
    @app.route("/api/status")
    def api_status():
        return jsonify(runner.status())

    @app.route("/api/logs")
    def api_logs():
        return jsonify(recent_logs(limit=int(request.args.get("limit", 200))))

    return app


def _flash_error(msg: str):
    # Đơn giản: trả 400 kèm thông báo (UI hiện tại dùng redirect; có thể nâng cấp flash sau).
    return (render_template_string_error(msg), 400)


def render_template_string_error(msg: str) -> str:
    return (
        "<!doctype html><meta charset='utf-8'>"
        "<body style='font-family:sans-serif;padding:2rem;background:#0b0f17;color:#e5e7eb'>"
        f"<h2>Lỗi</h2><pre style='white-space:pre-wrap'>{msg}</pre>"
        "<a href='/' style='color:#60a5fa'>← Về dashboard</a></body>"
    )
