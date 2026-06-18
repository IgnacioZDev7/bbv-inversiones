import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, grey, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from config import REPORTS_DIR, SCREENSHOTS_DIR


def _flatten_results(data, depth=0):
    items = []
    if isinstance(data, dict):
        if "results" in data and isinstance(data["results"], list):
            for r in data["results"]:
                items.append(r)
                if "results" in r and isinstance(r["results"], list):
                    items.extend(r["results"])
        for v in data.values():
            if isinstance(v, (dict, list)):
                items.extend(_flatten_results(v, depth + 1))
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                if "passed" in item:
                    items.append(item)
                items.extend(_flatten_results(item, depth + 1))
    return items


def _count(data):
    flat = _flatten_results(data)
    total = len(flat)
    passed = sum(1 for r in flat if r.get("passed"))
    return total, passed, flat


def generate_pdf_report(test_results: dict, title: str = "Reporte de Pruebas - BBV Inversiones") -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"reporte_pruebas_{timestamp}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    title_s = ParagraphStyle("T", parent=styles["Title"], fontSize=18, spaceAfter=4, textColor=HexColor("#1a237e"))
    sub_s = ParagraphStyle("S", parent=styles["Normal"], fontSize=9, textColor=grey, spaceAfter=16)
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=13, spaceBefore=12, spaceAfter=6, textColor=HexColor("#1a237e"))
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=10, spaceBefore=8, spaceAfter=4, textColor=HexColor("#283593"))
    normal = ParagraphStyle("N", parent=styles["Normal"], fontSize=8, spaceAfter=2)
    pgreen = ParagraphStyle("PG", parent=normal, textColor=HexColor("#2e7d32"), fontSize=8)
    pred = ParagraphStyle("PR", parent=normal, textColor=HexColor("#c62828"), fontSize=8)

    elements = []
    elements.append(Paragraph("BBV Inversiones", title_s))
    elements.append(Paragraph(f"Reporte de Pruebas Automatizadas", sub_s))
    elements.append(Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", normal))
    elements.append(Spacer(1, 10))

    all_flat = _flatten_results(test_results)
    global_total = len(all_flat)
    global_passed = sum(1 for r in all_flat if r.get("passed"))

    for category, data in test_results.items():
        if not isinstance(data, dict):
            continue
        elements.append(Paragraph(str(category).replace("_", " ").title(), h1))
        cat_total, cat_passed, flat = _count({category: data})

        if not flat:
            elements.append(Paragraph("Sin resultados para esta categoría.", normal))
            continue

        table_data = [["ID", "Nombre", "Resultado", "Detalle"]]
        for r in flat:
            tid = r.get("id", r.get("tc_id", ""))
            tname = r.get("titulo", r.get("desc", r.get("test", "")))
            ok = r.get("passed", False)
            detail = str(r.get("detail", r.get("status", "")))[:60]
            status_t = "PASÓ" if ok else "FALLÓ"
            st = pgreen if ok else pred
            table_data.append([
                Paragraph(str(tid)[:10], normal),
                Paragraph(str(tname)[:45], normal),
                Paragraph(status_t, st),
                Paragraph(detail, normal),
            ])

        if len(table_data) > 1:
            t = Table(table_data, colWidths=[35, 130, 50, 170], repeatRows=1)
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1a237e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), white),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e0e0e0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f5f5f5")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            elements.append(t)

        if data.get("avg_response_ms"):
            elements.append(Paragraph(f"Promedio: {data['avg_response_ms']}ms | Máx: {data.get('max_response_ms', '')}ms | Error: {data.get('error_rate_pct', '')}%", normal))
        if data.get("cobertura_pct") is not None:
            elements.append(Paragraph(f"Cobertura: {data['cobertura_pct']}% ({data.get('cubiertos', 0)}/{data.get('total', 0)})", normal))
        elements.append(Spacer(1, 6))

    elements.append(PageBreak())
    elements.append(Paragraph("Resumen Global", h1))
    st = Table([
        ["Total de pruebas", str(global_total)],
        ["Pasaron", str(global_passed)],
        ["Fallaron", str(global_total - global_passed)],
        ["Tasa de éxito", f"{round(global_passed / global_total * 100, 1) if global_total else 0}%"],
    ], colWidths=[180, 100])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1a237e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e0e0e0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f5f5f5")]),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
    ]))
    elements.append(st)

    screenshots = sorted([f for f in os.listdir(SCREENSHOTS_DIR) if f.endswith(".png")])
    if screenshots:
        elements.append(Spacer(1, 16))
        elements.append(Paragraph("Capturas de Pantalla", h1))
        for sf in screenshots[:4]:
            try:
                img = Image(os.path.join(SCREENSHOTS_DIR, sf), width=450, height=240)
                elements.append(img)
                elements.append(Paragraph(sf, normal))
                elements.append(Spacer(1, 6))
            except Exception:
                pass

    doc.build(elements)
    return filepath
