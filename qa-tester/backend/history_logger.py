import os
import json
from datetime import datetime
from config import RESULTS_DIR

HISTORY_FILE = os.path.join(RESULTS_DIR, "execution_history.json")


def _load() -> list:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _save(history: list):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


def _summarize_results(data) -> dict:
    total = 0
    passed = 0
    categories = []

    def walk(obj, depth=0):
        nonlocal total, passed
        if isinstance(obj, dict):
            if "passed" in obj:
                total += 1
                if obj["passed"]:
                    passed += 1
            if "results" in obj and isinstance(obj["results"], list):
                for r in obj["results"]:
                    walk(r, depth + 1)
            for v in obj.values():
                if isinstance(v, (dict, list)):
                    walk(v, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                walk(item, depth + 1)

    if isinstance(data, dict):
        for key, val in data.items():
            categories.append(str(key).replace("_", " ").title())
            walk(val)

    return {
        "total": total,
        "passed": passed,
        "failed": total - passed,
        "categories": categories,
    }


def log_execution(
    source: str,
    results: dict = None,
    pdf_filename: str = None,
    gherkin_filename: str = None,
    email_to: str = None,
):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "source": source,
        "pdf_filename": pdf_filename,
        "gherkin_filename": gherkin_filename,
        "email_to": email_to,
    }
    if results:
        entry["results_summary"] = _summarize_results(results)

    history = _load()
    history.insert(0, entry)
    _save(history)
    return entry


def get_history(limit: int = 50) -> list:
    return _load()[:limit]
