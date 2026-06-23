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
    DocumentValidationSerializer,
    DocumentValidationResponseSerializer,
    PoseVerificationSerializer,
    PoseVerificationResponseSerializer,
)
from services.biometrics.facial_verification import verify_identity
from services.biometrics.liveness_detection import detect_liveness, verify_head_poses
from services.biometrics.document_validation import validate_document

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


DOCUMENT_REQUEST_SCHEMA = {
    'multipart/form-data': {
        'type': 'object',
        'properties': {
            'carnet_image': {
                'type': 'string',
                'format': 'binary',
                'description': 'Fotografía del carnet de identidad (JPEG/PNG)',
            },
        },
        'required': ['carnet_image'],
    },
}


@extend_schema_view(
    post=extend_schema(
        summary="Validar documento de identidad",
        description=(
            "Extrae el texto del carnet de identidad usando Amazon Textract "
            "y lo compara con los datos del usuario autenticado."
        ),
        request=DOCUMENT_REQUEST_SCHEMA,
        responses={200: DocumentValidationResponseSerializer, 400: None},
    ),
)
class DocumentValidationView(APIView):
    """
    POST /api/biometrics/validate-document/

    Recibe `carnet_image` (multipart/form-data).
    Retorna validación del documento contra el perfil del usuario.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DocumentValidationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = validate_document(
                image_bytes=serializer.validated_data['carnet_image'].read(),
                user=request.user,
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error en DocumentValidationView: %s", str(e))
            return Response(
                {'error': 'Error al procesar la validación del documento. Intente nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


POSES_REQUEST_SCHEMA = {
    'multipart/form-data': {
        'type': 'object',
        'properties': {
            'image_front': {'type': 'string', 'format': 'binary'},
            'image_left': {'type': 'string', 'format': 'binary'},
            'image_right': {'type': 'string', 'format': 'binary'},
        },
        'required': ['image_front', 'image_left', 'image_right'],
    },
}


@extend_schema_view(
    post=extend_schema(
        summary="Verificar poses de cabeza",
        description=(
            "Recibe 3 imágenes (frente, izquierda, derecha) y verifica "
            "mediante Rekognition que los ángulos Yaw correspondan a "
            "poses de cabeza distintas."
        ),
        request=POSES_REQUEST_SCHEMA,
        responses={200: PoseVerificationResponseSerializer, 400: None},
    ),
)
class PoseVerificationView(APIView):
    """
    POST /api/biometrics/verify-poses/

    Recibe `image_front`, `image_left`, `image_right` (multipart/form-data).
    Retorna si las 3 poses de cabeza son válidas y los Yaw detectados.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PoseVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            v = serializer.validated_data
            result = verify_head_poses(
                image_front=v['image_front'].read(),
                image_left=v['image_left'].read(),
                image_right=v['image_right'].read(),
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error en PoseVerificationView: %s", str(e))
            return Response(
                {'error': 'Error al verificar las poses. Intente nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
