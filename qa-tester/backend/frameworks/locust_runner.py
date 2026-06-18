import subprocess
import sys
import os
import json


def run_locust(users: int = 10, spawn_rate: int = 2, run_time: str = "30s") -> dict:
    locustfile = os.path.join(os.path.dirname(__file__), "locustfile.py")
    result = subprocess.run(
        [
            sys.executable, "-m", "locust", "-f", locustfile,
            "--headless", "-u", str(users), "-r", str(spawn_rate),
            "--run-time", run_time,
            "--host", "http://localhost:8000",
            "--csv", os.path.join(os.path.dirname(__file__), "..", "results", "locust_report"),
        ],
        capture_output=True, text=True, timeout=300,
    )
    return {
        "framework": "locust",
        "status": "completed" if result.returncode == 0 else "error",
        "stdout": result.stdout[-2000:] if result.stdout else "",
        "stderr": result.stderr[-2000:] if result.stderr else "",
        "passed": result.returncode == 0,
    }
