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


class DocumentValidationSerializer(serializers.Serializer):
    """
    Recibe la foto del carnet de identidad para extraer y validar datos
    mediante Amazon Textract.

    Campos:
        carnet_image: archivo de imagen (JPEG/PNG) del documento
    """
    carnet_image = serializers.ImageField(
        allow_empty_file=False,
        help_text="Fotografía del carnet de identidad (JPEG/PNG)",
    )

    def validate_carnet_image(self, value):
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La imagen del carnet no debe exceder 10 MB.")
        return value


class DocumentValidationResponseSerializer(serializers.Serializer):
    """
    Respuesta del endpoint de validación documental.

    Campos:
        valid (bool): True si el documento coincide con el perfil del usuario
        ci_match (bool): True si el número de CI coincide
        name_match (bool): True si el nombre/apellido coincide
        message (str): mensaje descriptivo del resultado
        extracted (dict): datos extraídos del documento (ci, nombres, apellidos)
    """
    valid = serializers.BooleanField()
    ci_match = serializers.BooleanField()
    name_match = serializers.BooleanField()
    message = serializers.CharField()
    extracted = serializers.DictField()


class PoseVerificationSerializer(serializers.Serializer):
    """
    Recibe 3 imágenes (frente, izquierda, derecha) para verificar
    que el usuario giró la cabeza en distintas direcciones.

    Campos:
        image_front: foto mirando al frente
        image_left: foto mirando a la izquierda
        image_right: foto mirando a la derecha
    """
    image_front = serializers.ImageField(allow_empty_file=False)
    image_left = serializers.ImageField(allow_empty_file=False)
    image_right = serializers.ImageField(allow_empty_file=False)

    def validate_image_front(self, value):
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La imagen frontal no debe exceder 10 MB.")
        return value

    def validate_image_left(self, value):
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La imagen izquierda no debe exceder 10 MB.")
        return value

    def validate_image_right(self, value):
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La imagen derecha no debe exceder 10 MB.")
        return value


class PoseVerificationResponseSerializer(serializers.Serializer):
    """
    Respuesta del endpoint de verificación de poses.

    Campos:
        poses_valid (bool): True si las 3 poses son válidas
        yaws (list): ángulos Yaw de cada captura
        message (str): mensaje descriptivo
    """
    poses_valid = serializers.BooleanField()
    yaws = serializers.ListField(child=serializers.FloatField(allow_null=True))
    message = serializers.CharField()
