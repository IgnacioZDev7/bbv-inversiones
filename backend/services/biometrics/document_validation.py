import re
import logging
from django.conf import settings
import boto3

logger = logging.getLogger(__name__)


def _get_rekognition_client():
    return boto3.client(
        'rekognition',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_DEFAULT_REGION,
    )


def extract_ci_data(image_bytes: bytes) -> dict:
    """
    Extrae CI, nombres y apellidos de un carnet de identidad boliviano
    usando Amazon Rekognition detect_text.
    """
    client = _get_rekognition_client()
    response = client.detect_text(Image={'Bytes': image_bytes})

    lines = [
        t['DetectedText'].strip()
        for t in response.get('TextDetections', [])
        if t['Type'] == 'LINE' and t['DetectedText'].strip()
    ]

    raw_text = '\n'.join(lines)
    logger.info("Rekognition detect_text raw output:\n%s", raw_text)

    ci = None
    for line in lines:
        match = re.search(r'(\d{5,10})', line)
        if match:
            ci = match.group(1)
            break

    return {
        'ci': ci,
        'raw_text': raw_text,
    }


def validate_document(image_bytes: bytes, user) -> dict:
    """Valida los datos extraídos del carnet contra el usuario autenticado."""
    extracted = extract_ci_data(image_bytes)

    has_text = bool(extracted['raw_text'].strip())
    if not has_text:
        return {
            'valid': False,
            'ci_match': False,
            'name_match': False,
            'message': 'No se pudo leer el texto del documento. Asegúrate de que la foto sea clara y frontal.',
            'extracted': {
                'ci': None,
                'nombres': None,
                'apellidos': None,
            },
        }

    ci_match = bool(
        extracted['ci'] and user.ci and extracted['ci'] == user.ci
    )

    name_match = False
    if user.nombre:
        raw_upper = extracted['raw_text'].upper()
        user_parts = (
            f"{user.nombre} {user.apellido_paterno or ''} "
            f"{user.apellido_materno or ''}"
        ).upper().split()
        user_parts = [p for p in user_parts if len(p) > 2]
        matches = sum(1 for p in user_parts if p in raw_upper)
        name_match = matches >= max(2, len(user_parts) // 2)

    if ci_match and name_match:
        valid = True
        message = 'Documento validado correctamente.'
    elif ci_match:
        valid = False
        message = 'El CI coincide pero el nombre no. Verifica tus datos o contacta a soporte.'
    elif name_match:
        valid = False
        message = 'El nombre coincide pero el CI no. Verifica el número de tu carnet.'
    else:
        valid = False
        message = 'Los datos del documento no coinciden con tu perfil registrado.'

    return {
        'valid': valid,
        'ci_match': ci_match,
        'name_match': name_match,
        'message': message,
        'extracted': {
            'ci': extracted['ci'],
            'nombres': None,
            'apellidos': None,
        },
    }
