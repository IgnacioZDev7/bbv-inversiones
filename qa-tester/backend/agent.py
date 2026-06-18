import json
import os
from config import GROQ_API_KEY

try:
    from groq import Groq
except ImportError:
    Groq = None


SYSTEM_PROMPT = """
Eres un agente especializado en QA y testing de software para el proyecto BBV Inversiones,
un sistema de análisis financiero basado en la Bolsa Boliviana de Valores.

Tus funciones:
1. Analizar resultados de pruebas y explicar fallos en lenguaje claro
2. Sugerir qué pruebas ejecutar según los módulos del sistema
3. Interpretar métricas de rendimiento y carga
4. Recomendar mejoras en la cobertura de pruebas
5. Responder preguntas técnicas sobre el proceso de QA

También puedes ejecutar pruebas automáticamente cuando el usuario lo solicite.

Sé conciso, técnico y directo. Responde en español.
"""


def _ask(prompt: str) -> str:
    if not GROQ_API_KEY or Groq is None:
        return "Agente no disponible. Revisá GROQ_API_KEY en el .env"

    client = Groq(api_key=GROQ_API_KEY)
    try:
        r = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        return r.choices[0].message.content
    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower():
            return _local_fallback(prompt)
        return f"Error: {err}"


def _local_fallback(prompt: str) -> str:
    q = prompt.lower()

    if "recomienda" in q or "tipos de prueba" in q:
        return (
            "Para un sistema financiero como BBV Inversiones:\n\n"
            "🔹 **Funcionales**: Unitarias (cálculo de indicadores), Integración (API endpoints), Sistema (flujos completos), Aceptación (dashboard)\n"
            "🔹 **No funcionales**: Carga (100 usuarios), Estrés (50 req/s), Rendimiento (<500ms)\n"
            "🔹 **Caja Negra**: Partición de equivalencias, Valores límite, Tabla de decisiones, Estados, Casos de uso\n"
            "🔹 **Caja Blanca**: Cobertura de sentencia (endpoints), Cobertura de decisión (ramas lógicas)"
        )
    if "cobertura" in q:
        return (
            "Cobertura actual del QA Tester:\n"
            "• 15 casos funcionales (unitarias, integración, sistema, aceptación)\n"
            "• 6 casos no funcionales (carga, estrés, rendimiento, volumen, estabilidad, robustez)\n"
            "• Técnicas de caja negra y blanca implementadas\n"
            "• Para mejorarla, agregá más casos para: biometría, pipeline ETL y chat"
        )

    return (
        "No puedo responder con IA ahora (cuota excedida), pero tengo estas opciones:\n"
        "• Preguntá 'qué pruebas recomiendas'\n"
        "• Preguntá 'cómo mejorar la cobertura'\n"
        "• Pedí 'ejecuta pruebas de integración' o 'corre pruebas de carga'"
    )


def analyze_test_results(test_results: dict) -> str:
    prompt = f"""Analiza estos resultados de pruebas del BBV Inversiones y dame:
1. Resumen ejecutivo
2. Fallos principales y posibles causas
3. Recomendaciones

Resultados:
{json.dumps(test_results, indent=2, default=str)[:6000]}
"""
    return _ask(prompt)


def ask_agent(question: str, test_results: dict = None) -> str:
    ctx = ""
    if test_results:
        flat = []
        for cat, data in test_results.items():
            if isinstance(data, dict):
                passed = str(data).count("True")
                failed = str(data).count("False")
                flat.append(f"{cat}: {passed + failed} pruebas, {passed} pasaron, {failed} fallaron")
        ctx = "\n".join(flat) if flat else json.dumps(test_results, default=str)[:2000]

    prompt = f"""Pregunta del usuario: {question}

Contexto de pruebas ejecutadas:
{ctx or "Sin pruebas ejecutadas aún"}
"""
    return _ask(prompt)
