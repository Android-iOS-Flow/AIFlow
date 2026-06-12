#!/usr/bin/env python3
"""Điểm vào của Remote — engine thực thi Flow cho phần mềm điều khiển điện thoại.

Chạy:
    python run.py            # khởi động web UI (cài đặt + dashboard)
    python run.py --run <flowId>     # chạy ngay 1 flow rồi thoát (không mở web)
    python run.py --file <path.json> # chạy 1 flow từ file JSON rồi thoát

MVC:
    models/      dữ liệu + nghiệp vụ (FlowDocument, Context, Settings, repository)
    engine/      executor duyệt graph + DeviceDriver (adb/dummy)
    messaging/   trigger Ably "Run" + node pusherListen
    controllers/ RunnerService điều phối + routes Flask
    views/       template + static cho web UI
"""
from __future__ import annotations

import argparse
import sys

from app.config import load_settings
from app.controllers.runner import RunnerService
from app.utils.logging import get_logger

log = get_logger("main")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="AIFlow Remote engine")
    parser.add_argument("--run", metavar="FLOW_ID", help="Chạy ngay 1 flow công khai từ Supabase rồi thoát")
    parser.add_argument("--file", metavar="PATH", help="Chạy ngay 1 flow từ file JSON rồi thoát")
    parser.add_argument("--driver", help="Ghi đè driver (adb|dummy) cho lần chạy này")
    args = parser.parse_args(argv)

    settings = load_settings()
    if args.driver:
        settings.driver = args.driver

    runner = RunnerService(settings)

    # Chế độ CLI: chạy một lần rồi thoát (tiện cho cron / test trên Termux).
    if args.file:
        runner.run_flow_from_file(args.file)
        return 0
    if args.run:
        runner.run_flow_by_id(args.run)
        return 0

    # Chế độ mặc định: mở web UI. Import muộn để CLI không cần Flask.
    from app.controllers.web import create_app

    flask_app = create_app(runner)
    if settings.auto_start_trigger:
        runner.start_trigger()

    log.info("Web UI: http://%s:%s", settings.host, settings.port)
    try:
        flask_app.run(host=settings.host, port=settings.port, threaded=True)
    except KeyboardInterrupt:
        pass
    finally:
        runner.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
