from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(
        min_length=1,
        max_length=2000,
        help_text="Mensaje del usuario para el asistente financiero",
    )
    conversation_id = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="ID de conversación para mantener historial (opcional)",
    )


class ChatResponseSerializer(serializers.Serializer):
    reply = serializers.CharField(
        help_text="Respuesta del asistente financiero en español",
    )
    conversation_id = serializers.CharField(
        help_text="ID de la conversación actual",
    )
