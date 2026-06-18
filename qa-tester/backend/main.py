import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import json

from config import RESULTS_DIR

from engines.functional import (
    run_unit_tests, run_integration_tests, run_system_tests, run_acceptance_tests,
)
from engines.non_functional import (
    run_load_test, run_stress_test, run_performance_test,
    run_volume_test, run_stability_test, run_robustness_test,
)
from engines.black_box import (
    run_equivalence_partitioning, run_boundary_value,
    run_decision_table, run_state_transition, run_use_case_tests,
)
from engines.white_box import run_statement_coverage, run_decision_coverage

from frameworks.pytest_runner import run_pytest
from frameworks.playwright_runner import run_e2e_tests
from frameworks.locust_runner import run_locust
from frameworks.robot_runner import run_robot_tests

from report_generator import generate_pdf_report
from email_sender import send_report_email
from agent import analyze_test_results, ask_agent
from gherkin_generator import generate_gherkin, list_gherkin_files, get_gherkin_path
from system_monitor import get_system_stats
from history_logger import log_execution, get_history
from engines.functional import run_unit_tests, run_integration_tests
from engines.non_functional import run_load_test, run_stress_test, run_performance_test

app = FastAPI(title="QA Tester - BBV Inversiones", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailRequest(BaseModel):
    to_email: str
    pdf_path: str


class AgentQuestion(BaseModel):
    question: str
    context: Optional[dict] = None


class ReportFromResults(BaseModel):
    results: dict


# ── HEALTH CHECK ───────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "qa-tester"}


# ── SYSTEM MONITOR ────────────────────────────────────────

@app.get("/api/system/stats")
def system_stats():
    return get_system_stats()


# ── TEST CASE CATALOG ──────────────────────────────────────

@app.get("/api/test-cases")
def get_test_cases(tipo: Optional[str] = None, subtipo: Optional[str] = None):
    from test_data.test_cases import TEST_CASES
    results = TEST_CASES
    if tipo:
        results = [tc for tc in results if tc["tipo"] == tipo]
    if subtipo:
        results = [tc for tc in results if tc["subtipo"] == subtipo]
    return {"total": len(results), "test_cases": results}


# ── EXECUTE TESTS ─────────────────────────────────────────

@app.post("/api/execute/functional")
def execute_functional(subtipos: Optional[str] = None):
    engine_map = {
        "unitarias": run_unit_tests,
        "integracion": run_integration_tests,
        "sistema": run_system_tests,
        "aceptacion": run_acceptance_tests,
    }
    if subtipos:
        selected = [s.strip() for s in subtipos.split(",")]
        results = {}
        for s in selected:
            if s in engine_map:
                results[s] = engine_map[s]()
        return results

    return {
        "unitarias": run_unit_tests(),
        "integracion": run_integration_tests(),
        "sistema": run_system_tests(),
        "aceptacion": run_acceptance_tests(),
    }


@app.post("/api/execute/non-functional")
def execute_non_functional(subtipos: Optional[str] = None):
    engine_map = {
        "carga": run_load_test,
        "estres": run_stress_test,
        "rendimiento": run_performance_test,
        "volumen": run_volume_test,
        "estabilidad": run_stability_test,
        "robustez": run_robustness_test,
    }
    if subtipos:
        selected = [s.strip() for s in subtipos.split(",")]
        return {s: engine_map[s]() for s in selected if s in engine_map}

    return {
        "carga": run_load_test(),
        "estres": run_stress_test(),
        "rendimiento": run_performance_test(),
        "volumen": run_volume_test(),
        "estabilidad": run_stability_test(),
        "robustez": run_robustness_test(),
    }


@app.post("/api/execute/black-box")
def execute_black_box(tecnicas: Optional[str] = None):
    engine_map = {
        "particion_de_equivalencias": run_equivalence_partitioning,
        "analisis_de_valores_limite": run_boundary_value,
        "tabla_de_decisiones": run_decision_table,
        "transicion_de_estados": run_state_transition,
        "casos_de_uso": run_use_case_tests,
    }
    if tecnicas:
        selected = [s.strip() for s in tecnicas.split(",")]
        return {s: engine_map[s]() for s in selected if s in engine_map}

    return {
        "particion_de_equivalencias": run_equivalence_partitioning(),
        "analisis_de_valores_limite": run_boundary_value(),
        "tabla_de_decisiones": run_decision_table(),
        "transicion_de_estados": run_state_transition(),
        "casos_de_uso": run_use_case_tests(),
    }


@app.post("/api/execute/white-box")
def execute_white_box(tecnicas: Optional[str] = None):
    engine_map = {
        "cobertura_de_sentencia": run_statement_coverage,
        "cobertura_de_decision": run_decision_coverage,
    }
    if tecnicas:
        selected = [s.strip() for s in tecnicas.split(",")]
        return {s: engine_map[s]() for s in selected if s in engine_map}

    return {
        "cobertura_de_sentencia": run_statement_coverage(),
        "cobertura_de_decision": run_decision_coverage(),
    }


@app.post("/api/execute/all")
def execute_all():
    return {
        "funcionales": execute_functional(),
        "no_funcionales": execute_non_functional(),
        "caja_negra": execute_black_box(),
        "caja_blanca": execute_white_box(),
    }


# ── FRAMEWORK RUNNERS ─────────────────────────────────────

@app.post("/api/frameworks/pytest")
def framework_pytest():
    return run_pytest()


@app.post("/api/frameworks/playwright")
def framework_playwright():
    return run_e2e_tests()


@app.post("/api/frameworks/locust")
def framework_locust(users: int = 10, run_time: str = "30s"):
    return run_locust(users=users, run_time=run_time)


@app.post("/api/frameworks/robot")
def framework_robot():
    return run_robot_tests()


# ── REPORT ────────────────────────────────────────────────

# ── GHERKIN FEATURES ─────────────────────────────────────

@app.post("/api/gherkin/generate")
def gherkin_generate(categoria: Optional[str] = None):
    result = generate_gherkin(categoria)
    if result.get("success"):
        log_execution("gherkin_generate", gherkin_filename=result["combined"]["filename"])
    return result


@app.get("/api/gherkin/list")
def gherkin_list():
    return {"files": list_gherkin_files()}


@app.get("/api/gherkin/download/{filename}")
def gherkin_download(filename: str):
    from fastapi.responses import Response
    fpath = get_gherkin_path(filename)
    if not fpath:
        raise HTTPException(status_code=404, detail="Feature file no encontrado")
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


# ── REPORT ────────────────────────────────────────────────

@app.post("/api/report/generate")
def generate_report():
    test_results = execute_all()
    pdf_path = generate_pdf_report(test_results)
    fname = os.path.basename(pdf_path)
    log_execution("report_generate", results=test_results, pdf_filename=fname)
    return {"success": True, "pdf_path": pdf_path, "filename": fname}


@app.post("/api/report/generate-from-results")
def generate_report_from_results(req: ReportFromResults):
    pdf_path = generate_pdf_report(req.results)
    fname = os.path.basename(pdf_path)
    log_execution("report_generate", results=req.results, pdf_filename=fname)
    return {"success": True, "pdf_path": pdf_path, "filename": fname}


@app.post("/api/report/send-email")
def send_email(req: EmailRequest):
    result = send_report_email(req.pdf_path, req.to_email)
    if result.get("success"):
        log_execution("email_sent", pdf_filename=os.path.basename(req.pdf_path), email_to=req.to_email)
    return result


@app.get("/api/report/list")
def list_reports():
    from config import REPORTS_DIR
    files = sorted(
        [f for f in os.listdir(REPORTS_DIR) if f.endswith(".pdf")],
        reverse=True,
    )
    return {"reports": files}


@app.get("/api/report/download/{filename}")
def download_report(filename: str):
    from config import REPORTS_DIR
    from fastapi.responses import Response
    filepath = os.path.join(REPORTS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    with open(filepath, "rb") as f:
        content = f.read()
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


# ── HISTORY ───────────────────────────────────────────────

@app.get("/api/history")
def execution_history(limit: int = 50):
    return {"history": get_history(limit)}


# ── AGENTE QA ─────────────────────────────────────────────

@app.post("/api/agent/analyze")
def agent_analyze():
    test_results = execute_all()
    analysis = analyze_test_results(test_results)
    return {"analysis": analysis}


@app.post("/api/agent/ask")
def agent_ask(req: AgentQuestion):
    import re as _re

    question_lower = req.question.lower()
    test_results = None
    email_sent = None
    pdf_path = None

    if "gherkin" in question_lower or "feature" in question_lower:
        gherkin_result = generate_gherkin()
        answer_data = {
            "gherkin": gherkin_result,
            "mensaje": f"Features Gherkin generados: {gherkin_result['combined']['filename']} con {gherkin_result['total_features']} features y {gherkin_result['combined']['scenarios']} escenarios"
        }
        return {"answer": json.dumps(answer_data, indent=2), "gherkin_result": gherkin_result}

    palabras_ejecutar = ["ejecuta", "corre", "proba", "ejecutar", "correr", "probar", "run", "test"]
    if any(p in question_lower for p in palabras_ejecutar):
        if "carga" in question_lower or "load" in question_lower:
            test_results = {"Prueba de Carga": run_load_test()}
        elif "estrés" in question_lower or "stress" in question_lower:
            test_results = {"Prueba de Estrés": run_stress_test()}
        elif "rendimiento" in question_lower or "performance" in question_lower:
            test_results = {"Prueba de Rendimiento": run_performance_test()}
        elif "unitaria" in question_lower or "unit" in question_lower:
            test_results = {"Pruebas Unitarias": run_unit_tests()}
        elif "integración" in question_lower or "integracion" in question_lower or "integration" in question_lower:
            test_results = {"Pruebas de Integración": run_integration_tests()}
        elif "playwright" in question_lower:
            from frameworks.playwright_runner import run_e2e_tests
            test_results = {"Playwright E2E": run_e2e_tests()}
        else:
            test_results = execute_all()

        email_match = _re.search(r"[\w.+-]+@[\w-]+\.[\w.+-]+", req.question)
        palabras_email = ["envía", "envia", "envialo", "envíalo", "enviar", "mandar", "email", "correo"]
        if email_match and any(p in question_lower for p in palabras_email):
            try:
                pdf_path = generate_pdf_report(test_results)
                to_email = email_match.group()
                result = send_report_email(pdf_path, to_email)
                email_sent = {"to": to_email, "success": result["success"], "detail": result.get("detail", "")}
            except Exception as e:
                email_sent = {"to": email_match.group(), "success": False, "detail": str(e)}

    answer = ask_agent(req.question, test_results)
    return {
        "answer": answer,
        "test_results": test_results,
        "email_sent": email_sent,
        "pdf_path": pdf_path,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
