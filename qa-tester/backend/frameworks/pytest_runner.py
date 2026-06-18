import subprocess
import sys
import os
import json


def run_pytest(target_dir: str = None) -> dict:
    base_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend")
    project_dir = os.path.abspath(base_dir)

    if not os.path.exists(os.path.join(project_dir, "pytest.ini")):
        return {
            "framework": "pytest",
            "status": "skipped",
            "detail": "pytest.ini no encontrado en backend/. El backend no está disponible o no configurado.",
        }

    result = subprocess.run(
        [sys.executable, "-m", "pytest", "--json-report", "--tb=short", "-q"],
        capture_output=True, text=True, timeout=120, cwd=project_dir,
    )
    return {
        "framework": "pytest",
        "status": "completed",
        "returncode": result.returncode,
        "stdout": result.stdout[-2000:] if result.stdout else "",
        "stderr": result.stderr[-2000:] if result.stderr else "",
        "passed": result.returncode == 0,
    }
