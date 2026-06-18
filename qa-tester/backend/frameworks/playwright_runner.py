import subprocess
import sys
import os
import json


def run_e2e_tests() -> dict:
    test_script = os.path.join(os.path.dirname(__file__), "playwright_e2e.py")
    result = subprocess.run(
        [sys.executable, test_script],
        capture_output=True, text=True, timeout=120,
    )
    try:
        data = json.loads(result.stdout.strip())
    except (json.JSONDecodeError, ValueError):
        data = {"status": "error", "detail": result.stderr[:500]}

    return {
        "framework": "playwright",
        "status": data.get("status", "error"),
        "detail": data,
        "screenshots": data.get("screenshots", []),
        "passed": data.get("status") == "passed",
    }
