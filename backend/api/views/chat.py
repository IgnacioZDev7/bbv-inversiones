"""
Vista para el endpoint de ChatBBV.

Implementa:
- POST /api/chat/ → respuesta inteligente vía Gemini
"""

import logging
import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from api.serializers.chat import ChatRequestSerializer, ChatResponseSerializer
from services.ai.chat_agent import chat_with_gemini

logger = logging.getLogger(__name__)


@extend_schema_view(
    post=extend_schema(
        summary="Enviar mensaje al ChatBBV",
        description=(
            "Envía un mensaje al asistente financiero impulsado por Gemini 2.5 Flash. "
            "El asistente responde exclusivamente sobre análisis financiero "
            "de empresas que cotizan en la BBV."
        ),
        request=ChatRequestSerializer,
        responses={200: ChatResponseSerializer, 400: None},
    ),
)
class ChatView(APIView):
    """
    POST /api/chat/

    Recibe `message` (obligatorio) y `conversation_id` (opcional).
    Retorna `reply` con la respuesta del asistente y `conversation_id`.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.validated_data['message']
        conversation_id = serializer.validated_data.get('conversation_id') or str(uuid.uuid4())

        try:
            reply = chat_with_gemini(message)
            return Response({
                'reply': reply,
                'conversation_id': conversation_id,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error en ChatView: %s", str(e))
            return Response(
                {'error': 'Error al procesar el mensaje. Intente nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
