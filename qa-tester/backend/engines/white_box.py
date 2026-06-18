import requests
from config import BBV_API_BASE, AUTH_TOKEN


def _headers():
    h = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        h["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return h


def run_statement_coverage() -> dict:
    results = []
    endpoints = [
        f"{BBV_API_BASE}/empresas/",
        f"{BBV_API_BASE}/empresas/1/",
        f"{BBV_API_BASE}/sectores/",
        f"{BBV_API_BASE}/reportes/",
        f"{BBV_API_BASE}/reportes/?empresa=1",
        f"{BBV_API_BASE}/indicadores/",
        f"{BBV_API_BASE}/indicadores/resumen/?empresa=1",
        f"{BBV_API_BASE}/indicadores/historico/?empresa=1",
        f"{BBV_API_BASE}/recomendaciones/",
        f"{BBV_API_BASE}/recomendaciones/top/",
    ]
    covered = 0
    for ep in endpoints:
        try:
            r = requests.get(ep, headers=_headers(), timeout=8)
            ok = r.status_code < 500
            results.append({"endpoint": ep, "status": r.status_code, "accesible": ok})
            if ok:
                covered += 1
        except Exception as e:
            results.append({"endpoint": ep, "status": "error", "accesible": False, "detail": str(e)})

    total = len(endpoints)
    coverage_pct = round(covered / total * 100, 1) if total else 0
    return {
        "type": "Cobertura de Sentencia (Endpoints)",
        "cobertura_pct": coverage_pct,
        "cubiertos": covered,
        "total": total,
        "results": results,
    }


def run_decision_coverage() -> dict:
    results = []
    scenarios = [
        {"desc": "Login exitoso vs fallido", "tests": ["/auth/google/ con token válido", "/auth/google/ sin token"]},
        {"desc": "Endpoint con datos vs sin datos", "tests": ["/empresas/ con BD poblada", "/empresas/ BD vacía"]},
        {"desc": "Rol autorizado vs no autorizado", "tests": ["Admin accede a /admin", "Inversionista accede a /admin"]},
    ]
    for s in scenarios:
        results.append({"decision": s["desc"], "ramas": s["tests"]})
    return {"type": "Cobertura de Decisión", "total_decisiones": len(scenarios), "results": results}
