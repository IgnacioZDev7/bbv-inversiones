"""
Vistas para los endpoints biométricos.

Implementa:
- POST /api/biometrics/verify/   → verificación facial (carnet vs selfie)
- POST /api/biometrics/liveness/ → detección de actividad (liveness)
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, extend_schema_view

from api.serializers.biometrics import (
    VerifyIdentitySerializer,
    VerifyIdentityResponseSerializer,
    LivenessSerializer,
    LivenessResponseSerializer,
)
from services.biometrics.facial_verification import verify_identity
from services.biometrics.liveness_detection import detect_liveness

logger = logging.getLogger(__name__)


VERIFY_REQUEST_SCHEMA = {
    'multipart/form-data': {
        'type': 'object',
        'properties': {
            'carnet_image': {
                'type': 'string',
                'format': 'binary',
                'description': 'Fotografía del carnet de identidad (JPEG/PNG)',
            },
            'selfie_image': {
                'type': 'string',
                'format': 'binary',
                'description': 'Selfie en vivo para comparación (JPEG/PNG)',
            },
        },
        'required': ['carnet_image', 'selfie_image'],
    },
}


@extend_schema_view(
    post=extend_schema(
        summary="Verificar identidad biométrica",
        description=(
            "Compara la foto del carnet de identidad con una selfie en vivo "
            "utilizando Amazon Rekognition CompareFaces. "
            "Las imágenes se envían directamente como multipart/form-data."
        ),
        request=VERIFY_REQUEST_SCHEMA,
        responses={200: VerifyIdentityResponseSerializer, 400: None},
    ),
)
class VerifyIdentityView(APIView):
    """
    POST /api/biometrics/verify/

    Recibe `carnet_image` y `selfie_image` (multipart/form-data).
    Retorna nivel de similitud y resultado de verificación.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyIdentitySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = verify_identity(
                carnet_image=serializer.validated_data['carnet_image'],
                selfie_image=serializer.validated_data['selfie_image'],
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error en VerifyIdentityView: %s", str(e))
            return Response(
                {'error': 'Error al procesar la verificación biométrica. Intente nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


LIVENESS_REQUEST_SCHEMA = {
    'multipart/form-data': {
        'type': 'object',
        'properties': {
            'selfie_image': {
                'type': 'string',
                'format': 'binary',
                'description': 'Selfie para detección de actividad (JPEG/PNG)',
            },
        },
        'required': ['selfie_image'],
    },
}


@extend_schema_view(
    post=extend_schema(
        summary="Detección de actividad (liveness)",
        description=(
            "Analiza una selfie para determinar si corresponde a una persona real y viva "
            "utilizando Amazon Rekognition DetectFaces. "
            "Verifica presencia de rostro, ojos abiertos y pose frontal."
        ),
        request=LIVENESS_REQUEST_SCHEMA,
        responses={200: LivenessResponseSerializer, 400: None},
    ),
)
class LivenessDetectionView(APIView):
    """
    POST /api/biometrics/liveness/

    Recibe `selfie_image` (multipart/form-data).
    Retorna si la persona está viva y el nivel de confianza.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LivenessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = detect_liveness(
                selfie_image=serializer.validated_data['selfie_image'],
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error en LivenessDetectionView: %s", str(e))
            return Response(
                {'error': 'Error al procesar la detección de actividad. Intente nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
