#!/usr/bin/env python3
"""零号大坝情报板 · 本地静态服务器（仅绑定 127.0.0.1）。

用法：
    python server.py
    python server.py --port 4173 --no-open
"""

from __future__ import annotations

import argparse
import contextlib
import socket
import sys
import threading
import urllib.request
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = 4173


class LocalHTTPServer(ThreadingHTTPServer):
    """Windows 下必须关闭地址复用，防止同一端口启动两个实例。"""

    allow_reuse_address = False
    daemon_threads = True


class LocalHandler(SimpleHTTPRequestHandler):
    """静态文件处理器：加本地安全响应头，不缓存页面。"""

    server_version = "DamIntelBoard/1.0"

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "img-src 'self' data:; "
            "style-src 'self' 'unsafe-inline'; "
            "script-src 'self'; "
            "connect-src 'self'; "
            "base-uri 'none'; "
            "form-action 'none'; "
            "frame-ancestors 'none'",
        )
        super().end_headers()

    def log_message(self, fmt: str, *args: object) -> None:
        # 只保留简洁的本地访问日志，方便知道服务还在运行。
        sys.stdout.write(f"  [{self.log_date_time_string()}] {fmt % args}\n")
        sys.stdout.flush()


def port_available(port: int) -> bool:
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        try:
            sock.bind(("127.0.0.1", port))
        except OSError:
            return False
    return True


def is_existing_instance(port: int) -> bool:
    """识别端口上是否已经跑着本工具，避免重复启动导致存档源变化。"""
    url = f"http://127.0.0.1:{port}/"
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "DamIntelBoard/1.0"})
        with urllib.request.urlopen(request, timeout=0.9) as response:
            body = response.read(4096)
            return response.status == 200 and b"DAM INTEL BOARD" in body
    except Exception:
        return False


def make_server(port: int) -> tuple[ThreadingHTTPServer, int]:
    handler = partial(LocalHandler, directory=str(ROOT))
    try:
        server = LocalHTTPServer(("127.0.0.1", port), handler)
    except OSError as error:
        raise RuntimeError(f"无法监听 127.0.0.1:{port}（{error}）") from error
    return server, port


def main() -> int:
    parser = argparse.ArgumentParser(description="零号大坝情报板本地服务器")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="起始端口，默认 4173")
    parser.add_argument("--no-open", action="store_true", help="不要自动打开浏览器")
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        with contextlib.suppress(Exception):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    preferred = max(1024, min(args.port, 65500))

    if not port_available(preferred) and is_existing_instance(preferred):
        url = f"http://127.0.0.1:{preferred}/"
        print()
        print("  检测到零号大坝情报板已经在运行。")
        print(f"  现有地址 : {url}")
        print("  已在运行时不重复启动，避免产生新的本地存档源。")
        print()
        if not args.no_open:
            webbrowser.open(url)
        return 0

    if not port_available(preferred):
        print(f"\n  端口 {preferred} 已被其他程序占用。")
        print("  为保证浏览器本地存档地址稳定，不会自动改用其他端口。")
        print("  请关闭占用该端口的程序后重试；")
        print(f"  或手动指定新端口：python server.py --port 4180（新端口与旧编成不互通）")
        return 1

    try:
        server, port = make_server(preferred)
    except RuntimeError as error:
        print(f"\n启动失败：{error}")
        return 1

    url = f"http://127.0.0.1:{port}/"
    print()
    print("  ┌────────────────────────────────────────────┐")
    print("  │  零号大坝 · 情报板 / DAM INTEL BOARD       │")
    print("  └────────────────────────────────────────────┘")
    print(f"  本地地址 : {url}")
    print("  数据位置 : 当前浏览器 localStorage（不上传）")
    print("  停止服务 : 在这个窗口按 Ctrl+C")
    print()

    if not args.no_open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  正在停止本地服务…")
    finally:
        server.server_close()
        print("  已停止。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
