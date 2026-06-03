"""
Servicio de verificación facial utilizando Amazon Rekognition sin S3.

Flujo:
1. Lee bytes de las imágenes recibidas (UploadedFile)
2. Compara rostros mediante Rekognition CompareFaces con Image Bytes
3. Retorna porcentaje de similitud y resultado de verificación

Requisitos:
- boto3
- Variables de entorno AWS_* configuradas en settings.py
"""

import logging
from django.conf import settings
import boto3

logger = logging.getLogger(__name__)


def _get_rekognition_client():
    """Retorna cliente de Rekognition configurado con credenciales del proyecto."""
    return boto3.client(
        'rekognition',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_DEFAULT_REGION,
    )


def compare_faces(source_bytes: bytes, target_bytes: bytes, similarity_threshold: float = 80) -> dict:
    """
    Compara dos rostros usando Rekognition CompareFaces con bytes directamente.

    Args:
        source_bytes: bytes de la imagen fuente (carnet)
        target_bytes: bytes de la imagen destino (selfie)
        similarity_threshold: umbral mínimo de similitud (0-100)

    Returns:
        dict con:
            - similarity (float): porcentaje de similitud del mejor match
            - matched (bool): True si similarity >= threshold
            - bounding_box (dict | None): coordenadas del rostro en target
    """
    client = _get_rekognition_client()

    response = client.compare_faces(
        SourceImage={'Bytes': source_bytes},
        TargetImage={'Bytes': target_bytes},
        SimilarityThreshold=similarity_threshold,
    )

    face_matches = response.get('FaceMatches', [])
    if not face_matches:
        logger.info("CompareFaces: sin coincidencias")
        return {'similarity': 0.0, 'matched': False, 'bounding_box': None}

    best = max(face_matches, key=lambda f: f['Similarity'])
    result = {
        'similarity': round(best['Similarity'], 2),
        'matched': best['Similarity'] >= similarity_threshold,
        'bounding_box': best['Face'].get('BoundingBox'),
    }
    logger.info("CompareFaces: similitud=%s%%", result['similarity'])
    return result


def verify_identity(carnet_image, selfie_image, similarity_threshold=80):
    """
    Flujo completo de verificación biométrica sin S3:
    1. Lee bytes de ambas imágenes
    2. Compara rostros directamente con Rekognition

    Args:
        carnet_image: UploadedFile — foto del documento de identidad
        selfie_image: UploadedFile — selfie en vivo
        similarity_threshold: umbral para considerar verificado

    Returns:
        dict con:
            - verified (bool)
            - similarity (float)
            - message (str)
    """
    try:
        carnet_image.seek(0)
        source_bytes = carnet_image.read()

        selfie_image.seek(0)
        target_bytes = selfie_image.read()

        result = compare_faces(source_bytes, target_bytes, similarity_threshold)

        return {
            'verified': result['matched'],
            'similarity': result['similarity'],
            'message': (
                'Identidad verificada correctamente.'
                if result['matched']
                else 'Los rostros no coinciden con el nivel de confianza requerido.'
            ),
        }
    except Exception as e:
        logger.error("Error en verify_identity: %s", str(e))
        raise
