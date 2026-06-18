import requests
from config import BBV_API_BASE, AUTH_TOKEN
from test_data.test_cases import TEST_CASES


def _headers():
    h = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        h["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return h


def run_equivalence_partitioning() -> dict:
    results = []
    tests = [
        {"desc": "Empresa ID válido", "url": f"{BBV_API_BASE}/empresas/1/", "expect": 200},
        {"desc": "Empresa ID inválido (negativo)", "url": f"{BBV_API_BASE}/empresas/-1/", "expect": 404},
        {"desc": "Empresa ID inválido (string)", "url": f"{BBV_API_BASE}/empresas/abc/", "expect": 404},
        {"desc": "Gestión válida", "url": f"{BBV_API_BASE}/reportes/?empresa=1&gestion=2024", "expect": 200},
        {"desc": "Gestión futura", "url": f"{BBV_API_BASE}/reportes/?empresa=1&gestion=2099", "expect": 200},
    ]
    for t in tests:
        try:
            r = requests.get(t["url"], headers=_headers(), timeout=8)
            ok = r.status_code == t["expect"]
            results.append({"desc": t["desc"], "passed": ok, "status": r.status_code, "url": t["url"]})
        except Exception as e:
            results.append({"desc": t["desc"], "passed": False, "error": str(e)})
    return {"type": "Partición de Equivalencias", "total": len(results), "results": results}


def run_boundary_value() -> dict:
    results = []
    tests = [
        {"desc": "Monto mínimo (1)", "url": f"{BBV_API_BASE}/simulator/execute/", "payload": {"empresa": 1, "monto": 1, "anios": 1}, "expect": 200},
        {"desc": "Monto típico (10000)", "url": f"{BBV_API_BASE}/simulator/execute/", "payload": {"empresa": 1, "monto": 10000, "anios": 5}, "expect": 200},
        {"desc": "Monto grande (10M)", "url": f"{BBV_API_BASE}/simulator/execute/", "payload": {"empresa": 1, "monto": 10_000_000, "anios": 30}, "expect": 200},
        {"desc": "Página 1", "url": f"{BBV_API_BASE}/empresas/?page=1", "expect": 200},
        {"desc": "Página negativa", "url": f"{BBV_API_BASE}/empresas/?page=-1", "expect": 200},
    ]
    for t in tests:
        try:
            if "payload" in t:
                r = requests.post(t["url"], json=t["payload"], headers=_headers(), timeout=8)
            else:
                r = requests.get(t["url"], headers=_headers(), timeout=8)
            ok = r.status_code == t["expect"]
            results.append({"desc": t["desc"], "passed": ok, "status": r.status_code})
        except Exception as e:
            results.append({"desc": t["desc"], "passed": False, "error": str(e)})
    return {"type": "Análisis de Valores Límite", "total": len(results), "results": results}


def run_decision_table() -> dict:
    results = []
    scenarios = [
        {"rol": "Administrador", "ruta": "/admin", "esperado": 200},
        {"rol": "Analista", "ruta": "/admin", "esperado": 403},
        {"rol": "Inversionista", "ruta": "/admin", "esperado": 403},
        {"rol": "Auditor", "ruta": "/admin", "esperado": 403},
    ]
    results.append({"info": "Validación de matriz roles vs rutas — requiere frontend (Playwright)", "scenarios": scenarios})
    return {"type": "Tabla de Decisiones", "total": len(scenarios), "results": results}


def run_state_transition() -> dict:
    results = []
    states = [
        {"transicion": "No autenticado → Login", "endpoint": "POST /auth/google/", "expect": "token"},
        {"transicion": "Autenticado → Dashboard", "endpoint": "GET /accounts/me/", "expect": 200},
    ]
    for s in states:
        results.append({"desc": s["transicion"], "info": s["endpoint"]})
    return {"type": "Transición de Estados", "total": len(results), "results": results}


def run_use_case_tests() -> dict:
    results = []
    use_cases = [
        "Inicio de sesión", "Consulta de empresas", "Visualización de indicadores",
        "Ejecución de simulación", "Chat con asistente",
    ]
    for uc in use_cases:
        tcs = [tc["id"] for tc in TEST_CASES if tc.get("modulo") and uc.lower() in tc["modulo"].lower()]
        results.append({"caso_de_uso": uc, "test_cases_asociados": tcs or ["N/A"]})
    return {"type": "Casos de Uso", "total": len(use_cases), "results": results}
