"""
Servicio de detección de actividad (liveness) utilizando Amazon Rekognition sin S3.

Valida que la imagen contenga un rostro real mediante:
- Detección de rostro (FaceDetails presente)
- Ojos abiertos (EyeOpen)
- Pose frontal (Yaw dentro de ±15°, Pitch dentro de ±15°)

Retorna un score de confianza compuesto.

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


def detect_liveness(selfie_image) -> dict:
    """
    Analiza una selfie para determinar si corresponde a una persona real y viva.

    Usa Rekognition DetectFaces con atributos ALL vía bytes directos (sin S3):
    - Presencia de al menos un rostro
    - Ojos abiertos (EyeOpen)
    - Pose frontal (Yaw y Pitch dentro de rangos aceptables)

    Args:
        selfie_image: UploadedFile — selfie a analizar

    Returns:
        dict con:
            - alive (bool): True si supera todas las validaciones
            - confidence (float): score compuesto 0-100
            - details (list): lista de chequeos individuales
    """
    selfie_image.seek(0)
    image_bytes = selfie_image.read()

    client = _get_rekognition_client()

    try:
        response = client.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['ALL'],
        )

        face_details = response.get('FaceDetails', [])
        checks = []

        if not face_details:
            logger.info("Liveness: rostro no detectado")
            return {
                'alive': False,
                'confidence': 0.0,
                'details': [{'check': 'face_detected', 'passed': False, 'reason': 'No se detectó ningún rostro.'}],
            }

        face = face_details[0]
        confidence = float(face.get('Confidence', 0))

        eyes_open = face.get('EyesOpen', {})
        eyes_open_value = eyes_open.get('Value', False)
        eyes_open_conf = eyes_open.get('Confidence', 0)
        eyes_ok = eyes_open_value and eyes_open_conf >= 50
        checks.append({
            'check': 'eyes_open',
            'passed': eyes_ok,
            'confidence': round(eyes_open_conf, 2),
        })

        pose = face.get('Pose', {})
        yaw = abs(pose.get('Yaw', 0))
        pitch = abs(pose.get('Pitch', 0))
        pose_frontal = yaw <= 20 and pitch <= 20
        checks.append({
            'check': 'frontal_pose',
            'passed': pose_frontal,
            'yaw': round(pose.get('Yaw', 0), 2),
            'pitch': round(pose.get('Pitch', 0), 2),
        })

        all_passed = all(c['passed'] for c in checks)
        if all_passed:
            composite = round(min(confidence, 100), 2)
        else:
            failed_count = sum(1 for c in checks if not c['passed'])
            composite = round(max(0, confidence - (failed_count * 15)), 2)

        logger.info(
            "Liveness: ojos=%s pose=%s score=%s%%",
            eyes_ok, pose_frontal, composite,
        )

        return {
            'alive': all_passed,
            'confidence': composite,
            'details': checks,
        }

    except Exception as e:
        logger.error("Error en detect_liveness: %s", str(e))
        raise


def verify_head_poses(image_front: bytes, image_left: bytes, image_right: bytes) -> dict:
    """
    Verifica que 3 imágenes capturen poses de cabeza distintas
    (frente, izquierda, derecha) usando Rekognition DetectFaces.

    Args:
        image_front: bytes de la foto mirando al frente
        image_left: bytes de la foto mirando a la izquierda
        image_right: bytes de la foto mirando a la derecha

    Returns:
        dict con:
            - poses_valid (bool): True si las 3 poses son válidas
            - yaws (list): [yaw_front, yaw_left, yaw_right]
            - message (str): mensaje descriptivo
    """
    client = _get_rekognition_client()
    yaws: list[float | None] = []

    for label, img_bytes in [('front', image_front), ('left', image_left), ('right', image_right)]:
        try:
            response = client.detect_faces(
                Image={'Bytes': img_bytes},
                Attributes=['ALL'],
            )
            faces = response.get('FaceDetails', [])
            if not faces:
                logger.warning("verify_head_poses: rostro no detectado en %s", label)
                yaws.append(None)
            else:
                yaw = faces[0].get('Pose', {}).get('Yaw', 0)
                yaws.append(round(yaw, 2))
        except Exception as e:
            logger.error("verify_head_poses: error en %s: %s", label, str(e))
            yaws.append(None)

    if any(y is None for y in yaws):
        return {
            'poses_valid': False,
            'yaws': yaws,
            'message': 'No se pudo detectar el rostro en una o más capturas.',
        }

    front_ok = abs(yaws[0]) <= 15
    left_ok = yaws[1] <= -15
    right_ok = yaws[2] >= 15

    if front_ok and left_ok and right_ok:
        logger.info("verify_head_poses: válidas — yaws=%s", yaws)
        return {
            'poses_valid': True,
            'yaws': yaws,
            'message': 'Poses de cabeza verificadas correctamente.',
        }

    logger.warning("verify_head_poses: inválidas — yaws=%s", yaws)
    return {
        'poses_valid': False,
        'yaws': yaws,
        'message': (
            f'Las poses de cabeza no son válidas. '
            f'Ángulos detectados: frente={yaws[0]}°, izquierda={yaws[1]}°, derecha={yaws[2]}°. '
            f'Asegúrate de girar la cabeza en cada captura.'
        ),
    }
