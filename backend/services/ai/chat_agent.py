"""
Servicio de chat inteligente utilizando Google Gemini API.

Flujo:
1. Recibe mensaje del usuario
2. Construye contexto del sistema con datos financieros de BBV
3. Envía a Gemini 2.5 Flash
4. Retorna respuesta en español

Requisitos:
- google-genai
- GEMINI_API_KEY configurada en settings.py
"""

import logging
from django.conf import settings
from google import genai

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
Eres un asistente financiero especializado exclusivamente en el análisis de empresas del Banco BBV (Bolsa Boliviana de Valores).

Tus conocimientos se limitan estrictamente a:

CONTEXTO PERMITIDO:
- Empresas que cotizan en la BBV y sus estados financieros
- Indicadores financieros: liquidez, endeudamiento, solvencia, crecimiento patrimonial
- Ratios financieros: liquidez corriente, endeudamiento, solvencia, apalancamiento
- Análisis de salud financiera de empresas
- Comparaciones entre empresas del mismo sector
- Interpretación de balances, estados de resultados y flujo de caja

REGLAS ESTRICTAS:
1. Responde SIEMPRE en español, con lenguaje claro y profesional
2. LIMÍTATE exclusivamente a temas financieros y empresariales de la BBV
3. Si te preguntan algo fuera de este contexto, responde educadamente que solo puedes ayudar con análisis financiero de empresas de la BBV
4. No proporciones asesoría de inversión personalizada ni recomendaciones de compra/venta
5. No hagas predicciones sobre precios futuros de acciones
6. Basa tus respuestas en principios de análisis financiero generalmente aceptados
7. Sé objetivo y cita los indicadores relevantes cuando sea posible
8. Si no tienes datos suficientes para responder, indícalo claramente
9. Usa un tono formal pero accesible para estudiantes y profesionales

Ejemplos de preguntas que puedes responder:
- ¿Qué empresa tiene mejor liquidez?
- ¿Cómo está el endeudamiento de la Empresa X?
- Compara el endeudamiento de las empresas del sector Y
- ¿Qué indica el ratio de liquidez de la Empresa Z?
- Explica el estado de salud financiera de...
""".strip()


def _get_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def chat_with_gemini(message: str, conversation_history: list | None = None) -> str:
    """
    Envía un mensaje a Gemini 2.5 Flash y retorna la respuesta.

    Args:
        message: texto del usuario
        conversation_history: lista opcional de mensajes previos
            con formato [{'role': 'user'|'model', 'content': str}, ...]

    Returns:
        str: respuesta del modelo en español
    """
    try:
        client = _get_client()
        contents = []

        if conversation_history:
            for msg in conversation_history:
                role = 'user' if msg.get('role') == 'user' else 'model'
                contents.append({
                    'role': role,
                    'parts': [{'text': msg.get('content', '')}],
                })

        contents.append({
            'role': 'user',
            'parts': [{'text': message}],
        })

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config={
                'system_instruction': SYSTEM_PROMPT,
                'temperature': 0.7,
                'max_output_tokens': 1024,
            },
        )

        reply = response.text.strip()
        logger.info("Gemini respondió: %s", reply[:100])
        return reply

    except Exception as e:
        logger.error("Error en chat_with_gemini: %s", str(e))
        return (
            "Lo siento, ocurrió un error al procesar tu consulta. "
            "Por favor, intenta de nuevo más tarde."
        )
