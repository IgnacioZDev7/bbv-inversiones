class DataCleaner:
    def __init__(self, multiplier=1):
        # Los valores ya vienen en su magnitud real
        self.multiplier = multiplier

    def clean(self, raw_data):
        """Valida y limpia los valores extraídos."""
        cleaned = {}

        campos = [
            'total_activo_corriente',
            'total_activo_no_corriente',
            'total_activo',
            'total_pasivo_corriente',
            'total_pasivo_no_corriente',
            'total_pasivo',
            'total_patrimonio'
        ]

        for campo in campos:
            val = raw_data.get(campo)

            if val is not None:
                cleaned[campo] = val * self.multiplier
            else:
                cleaned[campo] = None

        # Validación básica
        if not cleaned.get('total_activo') or cleaned['total_activo'] <= 0:
            return {
                'success': False,
                'error': (
                    'Falla de validación: '
                    'total_activo es nulo o menor/igual a cero.'
                )
            }

        # Validación contable
        total_activo = cleaned.get('total_activo')
        total_pasivo = cleaned.get('total_pasivo')
        total_patrimonio = cleaned.get('total_patrimonio')

        if (
            total_activo is not None and
            total_pasivo is not None and
            total_patrimonio is not None
        ):
            diferencia = abs(
                total_activo -
                (total_pasivo + total_patrimonio)
            )

            # Tolerancia para redondeos
            if diferencia > 1:
                return {
                    'success': False,
                    'error': (
                        f'Balance inconsistente. '
                        f'Activo={total_activo}, '
                        f'Pasivo+Patrimonio={total_pasivo + total_patrimonio}, '
                        f'Diferencia={diferencia}'
                    )
                }

        return {
            'success': True,
            'valores_limpios': cleaned
        }