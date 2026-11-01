#!/usr/bin/env python3
"""Load generator for the web shop, chapter 5.4.

Several threads request the shop as fast as it answers and print requests per second, errors and
response times every ten seconds.

    python3 load.py http://webshop.velo.svc.cluster.local/ --workers 20 --seconds 300
"""
import argparse
import threading
import time
import urllib.error
import urllib.request

lock = threading.Lock()
stats = {"ok": 0, "error": 0, "times": []}


def worker(url, end):
    while time.time() < end:
        start = time.perf_counter()
        try:
            with urllib.request.urlopen(url, timeout=10) as answer:
                answer.read()
            key = "ok"
        except (urllib.error.URLError, OSError):
            key = "error"
        with lock:
            stats[key] += 1
            stats["times"].append(time.perf_counter() - start)


def main():
    parser = argparse.ArgumentParser(description="Load generator for the web shop")
    parser.add_argument("url")
    parser.add_argument("--workers", type=int, default=10)
    parser.add_argument("--seconds", type=int, default=120)
    args = parser.parse_args()
    end = time.time() + args.seconds
    threads = [threading.Thread(target=worker, args=(args.url, end), daemon=True) for _ in range(args.workers)]
    for thread in threads:
        thread.start()
    while time.time() < end:
        time.sleep(10)
        with lock:
            ok, error, times = stats["ok"], stats["error"], sorted(stats["times"])
            stats.update(ok=0, error=0, times=[])
        p95 = times[int(len(times) * 0.95)] if times else 0
        print(f"{ok / 10:7.1f} req/s  {error:5d} errors  p95 {p95 * 1000:6.0f} ms", flush=True)
    for thread in threads:
        thread.join()


if __name__ == "__main__":
    main()
