class IndicatorEngine:
    def calculate(self, datos_limpios):
        """
        Calcula indicadores financieros básicos.
        """

        indicators = {}

        activo_corriente = datos_limpios.get("total_activo_corriente")
        pasivo_corriente = datos_limpios.get("total_pasivo_corriente")

        total_activo = datos_limpios.get("total_activo")
        total_pasivo = datos_limpios.get("total_pasivo")

        # Liquidez Corriente
        if (
            activo_corriente is not None
            and pasivo_corriente is not None
            and pasivo_corriente > 0
        ):
            indicators["liquidez_corriente"] = (
                activo_corriente / pasivo_corriente
            )

        # Endeudamiento (Pasivo / Activo)
        if (
            total_pasivo is not None
            and total_activo is not None
            and total_activo > 0
        ):
            indicators["endeudamiento"] = (
                total_pasivo / total_activo
            )

        return {
            "success": True,
            "indicators": indicators
        }