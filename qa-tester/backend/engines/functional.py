import requests
import json
from config import BBV_API_BASE, AUTH_TOKEN
from test_data.test_cases import TEST_CASES


def _headers():
    h = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        h["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return h


def _run_test(tc: dict) -> dict:
    endpoint = tc["endpoint"].split("  |  ")[0].strip()
    method = endpoint.split(" ")[0] if " " in endpoint else "GET"
    path = endpoint.replace(f"{method} ", "")
    url = f"{BBV_API_BASE}{path}"

    try:
        if method == "GET":
            r = requests.get(url, headers=_headers(), timeout=8)
        elif method == "POST":
            payload = tc.get("payload", "N/A")
            data = json.loads(payload) if payload not in ("N/A", "", None) else None
            r = requests.post(url, json=data, headers=_headers(), timeout=8)
        elif method == "PATCH":
            payload = tc.get("payload", "N/A")
            data = json.loads(payload) if payload not in ("N/A", "", None) else None
            r = requests.patch(url, json=data, headers=_headers(), timeout=8)
        else:
            r = requests.get(url, headers=_headers(), timeout=8)

        expected = tc.get("respuesta_esperada", 200)
        if isinstance(expected, int):
            passed = r.status_code == expected
        else:
            passed = r.status_code < 500
        return {
            "id": tc["id"],
            "titulo": tc["titulo"],
            "desc": tc.get("descripcion", ""),
            "passed": passed,
            "status": r.status_code,
            "detail": f"{r.status_code} en {round(r.elapsed.total_seconds() * 1000, 1)}ms",
        }
    except requests.RequestException as e:
        return {
            "id": tc["id"],
            "titulo": tc["titulo"],
            "passed": False,
            "status": "error",
            "detail": str(e),
        }


def run_unit_tests() -> dict:
    results = [_run_test(tc) for tc in TEST_CASES if tc["subtipo"] == "unitarias"]
    return {"type": "Unitarias", "total": len(results), "results": results}


def run_integration_tests() -> dict:
    results = [_run_test(tc) for tc in TEST_CASES if tc["subtipo"] == "integracion"]
    return {"type": "Integración", "total": len(results), "results": results}


def run_system_tests() -> dict:
    results = [_run_test(tc) for tc in TEST_CASES if tc["subtipo"] == "sistema"]
    return {"type": "Sistema", "total": len(results), "results": results}


def run_acceptance_tests() -> dict:
    results = [_run_test(tc) for tc in TEST_CASES if tc["subtipo"] == "aceptacion"]
    return {"type": "Aceptación", "total": len(results), "results": results}
