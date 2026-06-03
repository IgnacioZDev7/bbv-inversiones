"""
Serializadores para los endpoints biométricos.

Define la estructura de entrada/salida de:
- POST /api/biometrics/verify/   (verificación facial)
- POST /api/biometrics/liveness/ (detección de actividad)
"""

from rest_framework import serializers


class VerifyIdentitySerializer(serializers.Serializer):
    """
    Recibe dos imágenes: foto del carnet de identidad y selfie en vivo.

    Campos:
        carnet_image: archivo de imagen (JPEG/PNG) del documento
        selfie_image: archivo de imagen (JPEG/PNG) de la selfie
    """
    carnet_image = serializers.ImageField(
        allow_empty_file=False,
        help_text="Fotografía del carnet de identidad (JPEG/PNG)",
    )
    selfie_image = serializers.ImageField(
        allow_empty_file=False,
        help_text="Selfie en vivo para comparación (JPEG/PNG)",
    )

    def validate_carnet_image(self, value):
        """Valida que la imagen del carnet no exceda 10 MB."""
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La imagen del carnet no debe exceder 10 MB.")
        return value

    def validate_selfie_image(self, value):
        """Valida que la selfie no exceda 10 MB."""
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La selfie no debe exceder 10 MB.")
        return value


class VerifyIdentityResponseSerializer(serializers.Serializer):
    """
    Respuesta del endpoint de verificación facial.

    Campos:
        verified (bool): True si la similitud supera el umbral
        similarity (float): porcentaje de similitud (0-100)
        message (str): mensaje descriptivo del resultado
    """
    verified = serializers.BooleanField()
    similarity = serializers.FloatField()
    message = serializers.CharField()


class LivenessSerializer(serializers.Serializer):
    """
    Recibe una selfie para análisis de actividad (liveness).

    Campos:
        selfie_image: archivo de imagen (JPEG/PNG) de la selfie
    """
    selfie_image = serializers.ImageField(
        allow_empty_file=False,
        help_text="Selfie para detección de actividad (JPEG/PNG)",
    )

    def validate_selfie_image(self, value):
        """Valida que la selfie no exceda 10 MB."""
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La selfie no debe exceder 10 MB.")
        return value


class LivenessResponseSerializer(serializers.Serializer):
    """
    Respuesta del endpoint de detección de actividad.

    Campos:
        alive (bool): True si se confirma actividad (rostro, ojos abiertos, pose frontal)
        confidence (float): score de confianza compuesto (0-100)
        details (list): lista de chequeos individuales con resultado
    """
    alive = serializers.BooleanField()
    confidence = serializers.FloatField()
    details = serializers.ListField(child=serializers.DictField(), required=False)
