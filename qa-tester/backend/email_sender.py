import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM


def send_report_email(pdf_path: str, to_email: str) -> dict:
    if not SMTP_USER or not SMTP_PASSWORD:
        return {"success": False, "detail": "SMTP no configurado. Define SMTP_USER y SMTP_PASSWORD en .env"}

    if not os.path.exists(pdf_path):
        return {"success": False, "detail": f"Archivo PDF no encontrado: {pdf_path}"}

    msg = MIMEMultipart()
    msg["From"] = EMAIL_FROM or SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = "Reporte de Pruebas Automatizadas - BBV Inversiones"

    body = MIMEText(
        "Adjunto encontrarás el reporte de pruebas automatizadas del sistema BBV Inversiones.\n\n"
        "Este reporte incluye:\n"
        "- Resultados de pruebas funcionales y no funcionales\n"
        "- Técnicas de caja negra y caja blanca\n"
        "- Capturas de pantalla\n"
        "- Métricas de rendimiento\n\n"
        "Saludos,\nEquipo QA"
    )
    msg.attach(body)

    with open(pdf_path, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())

    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(pdf_path)}")
    msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return {"success": True, "detail": f"Reporte enviado a {to_email}"}
    except Exception as e:
        return {"success": False, "detail": str(e)}
