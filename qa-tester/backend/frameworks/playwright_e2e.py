import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import BBV_FRONTEND_BASE, SCREENSHOTS_DIR, AUTH_TOKEN

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print(json.dumps({"status": "skipped", "detail": "playwright no instalado"}))
    sys.exit(0)


PAGES = [
    {"route": "/", "name": "00_home"},
    {"route": "/investor", "name": "01_dashboard_investor"},
    {"route": "/investor/simulations", "name": "02_simulaciones"},
    {"route": "/analyst", "name": "03_dashboard_analyst"},
    {"route": "/analyst/indicators", "name": "04_indicadores"},
    {"route": "/admin", "name": "05_dashboard_admin"},
    {"route": "/admin/companies", "name": "06_empresas"},
    {"route": "/chat", "name": "07_chat"},
    {"route": "/company/1", "name": "08_detalle_empresa"},
]


def run():
    results = []
    screenshots = []

    if not AUTH_TOKEN:
        print(json.dumps({"status": "skipped", "detail": "AUTH_TOKEN no configurado"}))
        sys.exit(0)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})

        page = context.new_page()

        page.goto(BBV_FRONTEND_BASE, timeout=15000)

        page.evaluate(f"localStorage.setItem('accessToken', '{AUTH_TOKEN}')")
        page.evaluate(f"localStorage.setItem('refreshToken', '{AUTH_TOKEN}')")

        for entry in PAGES:
            try:
                url = f"{BBV_FRONTEND_BASE}{entry['route']}"
                page.goto(url, timeout=15000, wait_until="domcontentloaded")
                page.wait_for_timeout(2000)

                ss = os.path.join(SCREENSHOTS_DIR, f"{entry['name']}.png")
                page.screenshot(path=ss, full_page=True)
                screenshots.append(ss)
                results.append({
                    "test": f"Cargar {entry['route']}",
                    "route": entry["route"],
                    "passed": True,
                })
            except Exception as e:
                results.append({
                    "test": f"Cargar {entry['route']}",
                    "route": entry["route"],
                    "passed": False,
                    "error": str(e),
                })

        browser.close()

    status = "passed" if all(r.get("passed") for r in results) else "partial"
    print(json.dumps({"status": status, "results": results, "screenshots": screenshots}))


if __name__ == "__main__":
    run()
