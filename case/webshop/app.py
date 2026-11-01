#!/usr/bin/env python3
"""Web shop of Veloatelier Matte, the container app of the course.

It only needs the standard library. Besides the shop it answers /healthz for Kubernetes and
/metrics in the text format of Prometheus.

    python3 app.py
    PORT=8080 SHOP_NAME="Veloatelier Matte" python3 app.py
    WORK_MS=20 FAIL_PERCENT=5 python3 app.py
"""
import html
import json
import os
import random
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.0.0"
PORT = int(os.environ.get("PORT", "8080"))
SHOP_NAME = os.environ.get("SHOP_NAME", "Veloatelier Matte")
# Extra work per request in milliseconds, part 5 uses it to make the shop slow under load
WORK_MS = int(os.environ.get("WORK_MS", "0"))
# Share of shop requests answered with an error, part 5 uses it to break the service level on purpose
FAIL_PERCENT = float(os.environ.get("FAIL_PERCENT", "0"))

PRODUCTS = [
    {"id": 1, "name": "Stadtvelo Aare", "price": 890},
    {"id": 2, "name": "Gravelbike Gurten", "price": 1690},
    {"id": 3, "name": "Kindervelo Bärli", "price": 340},
    {"id": 4, "name": "Veloservice gross", "price": 149},
]

BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
lock = threading.Lock()
requests = {}
durations = {"buckets": [0] * len(BUCKETS), "sum": 0.0, "count": 0}
started = time.time()


def busy(ms):
    end = time.perf_counter() + ms / 1000
    while time.perf_counter() < end:
        pass


def record(path, code, seconds):
    with lock:
        key = (path, code)
        requests[key] = requests.get(key, 0) + 1
        durations["sum"] += seconds
        durations["count"] += 1
        for i, bound in enumerate(BUCKETS):
            if seconds <= bound:
                durations["buckets"][i] += 1


def metrics():
    lines = [
        "# HELP webshop_info Version of the web shop.",
        "# TYPE webshop_info gauge",
        f'webshop_info{{version="{VERSION}"}} 1',
        "# HELP webshop_requests_total Requests by path and status code.",
        "# TYPE webshop_requests_total counter",
    ]
    with lock:
        for (path, code), count in sorted(requests.items()):
            lines.append(f'webshop_requests_total{{path="{path}",code="{code}"}} {count}')
        lines += [
            "# HELP webshop_request_duration_seconds Time to answer a request.",
            "# TYPE webshop_request_duration_seconds histogram",
        ]
        for bound, count in zip(BUCKETS, durations["buckets"]):
            lines.append(f'webshop_request_duration_seconds_bucket{{le="{bound}"}} {count}')
        lines.append(f'webshop_request_duration_seconds_bucket{{le="+Inf"}} {durations["count"]}')
        lines.append(f"webshop_request_duration_seconds_sum {durations['sum']:.6f}")
        lines.append(f"webshop_request_duration_seconds_count {durations['count']}")
    lines += [
        "# HELP webshop_uptime_seconds Seconds since the start of the process.",
        "# TYPE webshop_uptime_seconds gauge",
        f"webshop_uptime_seconds {time.time() - started:.0f}",
    ]
    return "\n".join(lines) + "\n"


def page():
    rows = "".join(
        f"<tr><td>{html.escape(p['name'])}</td><td>CHF {p['price']}.–</td></tr>" for p in PRODUCTS
    )
    return (
        f"<!doctype html><html lang=\"de-CH\"><head><meta charset=\"utf-8\"><title>{html.escape(SHOP_NAME)}</title></head>"
        f"<body><h1>{html.escape(SHOP_NAME)}</h1><table>{rows}</table>"
        f"<p><small>Version {VERSION}, Pod {html.escape(socket.gethostname())}</small></p></body></html>"
    )


class Handler(BaseHTTPRequestHandler):
    server_version = f"webshop/{VERSION}"

    def do_GET(self):
        start = time.perf_counter()
        path = self.path.split("?", 1)[0]
        if path in ("/", "/api/products") and random.random() * 100 < FAIL_PERCENT:
            busy(WORK_MS)
            print(f"error: simulated failure on {path}", flush=True)
            code, kind, body = 500, "text/plain", "internal error\n"
        elif path == "/":
            busy(WORK_MS)
            code, kind, body = 200, "text/html; charset=utf-8", page()
        elif path == "/api/products":
            busy(WORK_MS)
            code, kind, body = 200, "application/json", json.dumps(PRODUCTS, ensure_ascii=False)
        elif path == "/healthz":
            code, kind, body = 200, "text/plain", "ok\n"
        elif path == "/metrics":
            code, kind, body = 200, "text/plain; version=0.0.4", metrics()
        else:
            path, code, kind, body = "other", 404, "text/plain", "not found\n"
        data = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        if path not in ("/metrics", "/healthz"):
            record(path, code, time.perf_counter() - start)

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} {fmt % args}", flush=True)


if __name__ == "__main__":
    print(f"{SHOP_NAME} {VERSION} listens on port {PORT}", flush=True)
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
