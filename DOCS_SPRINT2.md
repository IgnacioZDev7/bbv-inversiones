# Documentación Sprint 2 - Analytics & IA

## Módulo: Simulador de Inversiones

### Endpoints

#### 1. Ejecutar Simulación
**Ruta:** `POST /api/simulator/execute/`  
**Descripción:** Ejecuta una simulación de inversión proyectada basada en la volatilidad del patrimonio histórico de la empresa.  
**Body:**
```json
{
  "empresa_id": 53,
  "monto": 10000,
  "horizonte": 5
}
```
**Respuesta:** Proyecciones en tres escenarios (conservador, moderado, agresivo) con retorno estimado y ROI.

#### 2. Historial de Simulaciones
**Ruta:** `GET /api/simulator/`  
**Descripción:** Retorna el historial de simulaciones realizadas por el usuario autenticado.

---

## Módulo: Recomendaciones IA

### Endpoints

#### 1. Top Recomendaciones
**Ruta:** `GET /api/recomendaciones/top/`  
**Descripción:** Retorna un ranking de empresas clasificadas por su salud financiera.  
**Clasificaciones:**
- `RECOMENDADA`: Score >= 80.
- `OBSERVAR`: Score entre 50 y 79.
- `RIESGO ALTO`: Score < 50.

---

## Metodología Matemática

### Simulación Monte Carlo Simplificada
1. Se extrae la serie histórica de `total_patrimonio`.
2. Se calcula el rendimiento porcentual entre periodos.
3. Se obtiene el **CAGR** (Tasa de crecimiento anual compuesta) y la **Volatilidad** (desviación estándar).
4. Se proyecta el valor futuro: $VF = Capital \times (1 + CAGR \pm \sigma)^T$.

### Score de Recomendación
- **Liquidez (30%)**: Basado en `LIQ_CORR`.
- **Solvencia (40%)**: Basado en `END` (Endeudamiento).
- **Crecimiento (30%)**: Basado en la tendencia del patrimonio.
