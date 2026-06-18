import time
import requests
import concurrent.futures
from config import BBV_API_BASE, AUTH_TOKEN
from test_data.test_cases import TEST_CASES


def _headers():
    h = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        h["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return h


def _find_tc(tc_id: str):
    for tc in TEST_CASES:
        if tc["id"] == tc_id:
            return tc
    return None


def run_load_test() -> dict:
    tc = _find_tc("TC-016")

    def req():
        try:
            r = requests.get(f"{BBV_API_BASE}/empresas/", headers=_headers(), timeout=5)
            return (r.status_code == 200, r.elapsed.total_seconds() * 1000)
        except Exception:
            return (False, None)

    errors, times = 0, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as ex:
        for ok, ms in ex.map(lambda _: req(), range(30)):
            if not ok:
                errors += 1
            if ms is not None:
                times.append(ms)

    avg_ms = sum(times) / len(times) if times else 0
    max_ms = max(times) if times else 0
    passed = avg_ms < 2000 and errors == 0

    return {
        "type": "Carga",
        "total": len(times), "errors": errors,
        "avg_response_ms": round(avg_ms, 1), "max_response_ms": round(max_ms, 1),
        "passed": passed,
        "detail": tc["id"] + " - " + tc["titulo"] if tc else "",
    }


def run_stress_test() -> dict:
    tc = _find_tc("TC-017")
    errors = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
        futures = [
            ex.submit(
                lambda: requests.post(
                    f"{BBV_API_BASE}/simulator/execute/", json={"empresa": 1, "monto": 5000, "anios": 3},
                    headers=_headers(), timeout=10,
                ).status_code == 200
            )
            for _ in range(20)
        ]
        for f in concurrent.futures.as_completed(futures):
            if not f.result():
                errors += 1

    passed = errors < 3
    return {
        "type": "Estrés",
        "total": 20, "errors": errors,
        "passed": passed,
        "detail": tc["id"] + " - " + tc["titulo"] if tc else "",
    }


def run_performance_test() -> dict:
    tc = _find_tc("TC-018")
    times = []
    for _ in range(5):
        try:
            r = requests.get(f"{BBV_API_BASE}/indicadores/", params={"empresa": 1}, headers=_headers(), timeout=5)
            times.append(r.elapsed.total_seconds() * 1000)
        except Exception:
            pass
    avg_ms = sum(times) / len(times) if times else 0
    passed = avg_ms < 500
    return {
        "type": "Rendimiento",
        "samples": len(times), "avg_response_ms": round(avg_ms, 1),
        "passed": passed,
        "detail": tc["id"] + " - " + tc["titulo"] if tc else "",
    }


def run_volume_test() -> dict:
    tc = _find_tc("TC-019")
    times = []
    for page in range(1, 4):
        try:
            r = requests.get(f"{BBV_API_BASE}/reportes/", params={"page": page, "page_size": 10}, headers=_headers(), timeout=5)
            times.append(r.elapsed.total_seconds() * 1000)
        except Exception:
            pass
    avg_ms = sum(times) / len(times) if times else 0
    passed = avg_ms < 1000
    return {
        "type": "Volumen",
        "pages": len(times), "avg_response_ms": round(avg_ms, 1),
        "passed": passed,
        "detail": tc["id"] + " - " + tc["titulo"] if tc else "",
    }


def run_stability_test() -> dict:
    tc = _find_tc("TC-020")
    errors = 0
    for i in range(5):
        try:
            r = requests.get(f"{BBV_API_BASE}/empresas/", params={"page_size": 5}, headers=_headers(), timeout=5)
            if r.status_code != 200:
                errors += 1
        except Exception:
            errors += 1
    passed = errors == 0
    return {
        "type": "Estabilidad",
        "samples": 5, "errors": errors,
        "passed": passed,
        "detail": tc["id"] + " - " + tc["titulo"] if tc else "",
    }


def run_robustness_test() -> dict:
    tc = _find_tc("TC-021")
    payloads = [{"invalido": "x"}, {}, None, "texto", {"empresa": -1}]
    urls = [f"{BBV_API_BASE}/chat/", f"{BBV_API_BASE}/simulator/execute/"]
    errors = 0
    results = []
    for url in urls:
        for payload in payloads:
            try:
                r = requests.post(url, json=payload, headers=_headers(), timeout=5)
                ok = r.status_code < 500
                if not ok:
                    errors += 1
                results.append({"url": url, "status": r.status_code, "passed": ok})
            except Exception as e:
                errors += 1
                results.append({"url": url, "error": str(e), "passed": False})
    passed = errors == 0
    return {
        "type": "Robustez",
        "total": len(results), "errors": errors,
        "passed": passed,
        "detail": tc["id"] + " - " + tc["titulo"] if tc else "",
        "results": results,
    }
