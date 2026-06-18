import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
SCREENSHOTS_DIR = os.path.join(RESULTS_DIR, "screenshots")
REPORTS_DIR = os.path.join(RESULTS_DIR, "reports")

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

GHERKIN_DIR = os.path.join(RESULTS_DIR, "gherkin")
os.makedirs(GHERKIN_DIR, exist_ok=True)

BBV_API_BASE = os.getenv("BBV_API_BASE", "http://localhost:8000/api")
BBV_FRONTEND_BASE = os.getenv("BBV_FRONTEND_BASE", "http://localhost:5173")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "")

AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
