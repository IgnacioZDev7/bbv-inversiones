# Documentación Sprint 1 - Backend BBV Inversiones

## Módulo: Completar Perfil y Onboarding

### Endpoints

#### 1. Ver Perfil Propio
**Ruta:** `GET /api/usuarios/me/`  
**Descripción:** Retorna la información completa del usuario autenticado.  
**Campo clave:** `profile_complete` (boolean). Indica si el usuario ya cargó su CI, Celular y Apellido Paterno.

#### 2. Actualizar Perfil Propio (General)
**Ruta:** `PATCH /api/usuarios/me/`  
**Descripción:** Permite actualización parcial de campos básicos.

#### 3. Completar Perfil (Onboarding)
**Ruta:** `PATCH /api/usuarios/me/completar_perfil/`  
**Descripción:** Endpoint especializado para la primera carga de datos críticos.  
**Body requerido:**
```json
{
  "ci": "1234567",
  "celular": "77777777",
  "apellido_paterno": "Vargas",
  "apellido_materno": "Opcional"
}
```
**Validaciones:**
- `ci`: Único en el sistema. Obligatorio.
- `celular`: Mínimo 7 caracteres. Obligatorio.
- `apellido_paterno`: Obligatorio.

### Flujo OAuth Google
1. El usuario se registra con Google.
2. `CustomSocialAccountAdapter` mapea `first_name` -> `nombre` y `last_name` -> `apellido_paterno`.
3. El usuario se crea con `ci=null`.
4. La API retorna `profile_complete: false`.
5. El frontend debe redirigir a `/completar-perfil` si `profile_complete` es `false`.

### Pruebas Unitarias
Ejecutadas con `pytest`. Cobertura:
- Obtención de perfil.
- Completitud de perfil para usuarios OAuth.
- Validación de unicidad de CI.
- Validación de campos obligatorios.
