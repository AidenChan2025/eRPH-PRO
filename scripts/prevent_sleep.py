#!/usr/bin/env python3
"""Keep a macOS workstation awake for a supervised development task.

This is a small, dependency-free wrapper around the built-in ``caffeinate``
command. Stop it with Ctrl-C or let the requested duration expire.
"""

from __future__ import annotations

import argparse
import shutil
import signal
import subprocess
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--hours",
        type=float,
        default=8.0,
        help="number of hours to prevent idle and display sleep (default: 8)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.hours <= 0:
        print("--hours must be greater than zero", file=sys.stderr)
        return 2

    caffeinate = shutil.which("caffeinate")
    if caffeinate is None:
        print("caffeinate was not found; this script requires macOS", file=sys.stderr)
        return 1

    seconds = max(1, round(args.hours * 60 * 60))
    process = subprocess.Popen([caffeinate, "-d", "-i", "-t", str(seconds)])

    def stop(_signum: int, _frame: object) -> None:
        if process.poll() is None:
            process.terminate()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    print(f"Preventing sleep for {args.hours:g} hours (PID {process.pid}). Press Ctrl-C to stop.")
    return process.wait()


if __name__ == "__main__":
    raise SystemExit(main())
