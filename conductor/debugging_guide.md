# Guía de Depuración para Vercel (CLI y API)

Esta guía se ha desarrollado a partir de la experiencia de depuración de problemas de despliegue y API en Vercel, especialmente en entornos de monorepo o cuando la CLI de Vercel se comporta de forma inesperada.

---

## Pre-requisitos:

1.  **Instalar `jq`:**
    *   En Termux: `pkg install jq`
    *   En sistemas basados en Debian/Ubuntu: `sudo apt-get install jq`
    *   En macOS: `brew install jq`

2.  **Crear un Personal Access Token de Vercel:**
    *   Ve a [https://vercel.com/account/tokens](https://vercel.com/account/tokens).
    *   Crea un nuevo token con permisos de `Full Access`.

3.  **Exportar el token en tu sesión:**
    *   `export VERCEL_TOKEN="<TU_TOKEN_REAL>"` (reemplaza `<TU_TOKEN_REAL>` con el token que acabas de crear).
    *   **Importante:** Para que el token persista entre sesiones de Termux, añádelo a tu archivo de configuración de shell (e.g., `echo 'export VERCEL_TOKEN="TU_TOKEN"' >> ~/.bashrc` o `~/.zshrc`).

---

## Pasos de Diagnóstico:

### Paso 1: Confirmar Identidad y Acceso al Equipo

*   **Propósito:** Asegurarse de que el token tiene acceso al equipo deseado.
*   **Comando:**
    ```bash
    TEAM_SLUG="javier20dev25s-projects" # Confirma que este es el slug correcto de tu equipo
    TEAM_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v1/teams" \
      | jq -r --arg slug "$TEAM_SLUG" '.teams[] | select(.slug==$slug) | .id')
    echo "TEAM_ID=$TEAM_ID"
    ```
*   **Análisis:** Si `TEAM_ID` está vacío o no es un valor válido, el `VERCEL_TOKEN` es inválido o no tienes acceso al equipo.

### Paso 2: Obtener el ID del Proyecto

*   **Propósito:** Confirmar el `PROJECT_ID` exacto para el nombre de tu proyecto.
*   **Comando (usa el `TEAM_ID` obtenido del Paso 1):
    ```bash
    # Si TEAM_ID no está en tu entorno, defínelo aquí: TEAM_ID="<ID_DEL_EQUIPO_DEL_PASO_1>"
    PROJECT_NAME="pacifico-editor" # Confirma que este es el nombre de proyecto correcto
    PROJECT_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects?teamId=$TEAM_ID" \
      | jq -r --arg name "$PROJECT_NAME" '.projects[] | select(.name==$name) | .id')
    echo "PROJECT_ID=$PROJECT_ID"
    ```
*   **Análisis:** Si `PROJECT_ID` está vacío, el `PROJECT_NAME` es incorrecto o no tienes acceso al proyecto dentro de ese equipo.

### Paso 3: Listar Despliegues y sus URLs/Estados

*   **Propósito:** Ver el estado y las URLs de todos los despliegues recientes, incluyendo sus IDs y hashes de commit. Esto es CRÍTICO para identificar el despliegue a inspeccionar.
*   **Comando (usa el `TEAM_ID` y `PROJECT_ID` obtenidos):
    ```bash
    # Si no están en tu entorno, defínelos aquí:
    # TEAM_ID="<ID_DEL_EQUIPO>"
    # PROJECT_ID="<ID_DEL_PROYECTO>"
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
      "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&teamId=$TEAM_ID" \
      | jq '.deployments[] | {uid, url, state, createdAt, commit: .meta.githubCommitSha}'
    ```
*   **Análisis:** Busca el despliegue más reciente (`createdAt`), su `uid` (que es el `DEPLOYMENT_ID` real) y su `url`. Identifica si está `READY` o `ERROR`.

### Paso 4: Obtener Logs Detallados de un Despliegue Específico (Logs de Construcción)

*   **Propósito:** Obtener logs de *construcción* para diagnosticar errores de build. Ten en cuenta que este endpoint (`/events`) devuelve principalmente logs de *construcción*, no de tiempo de ejecución de las solicitudes HTTP.
*   **Comando (usa el `uid` - `DEPLOYMENT_ID` - del despliegue del Paso 3):
    ```bash
    # Si DEPLOYMENT_ID no está en tu entorno, defínelo aquí: DEPLOYMENT_ID="<ID_DEL_DESPLIEGUE>"
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
      "https://api.vercel.com/v2/deployments/$DEPLOYMENT_ID/events?direction=forward&limit=500" \
      | jq . 
    ```
*   **Análisis:**
    *   Busca entradas con `type: "stderr"` para errores.
    *   Busca mensajes como "error", "failed", "missing", errores de `npm`.

### Paso 5: Probar Endpoints de API Directamente (Verificación de Enrutamiento y Variables de Entorno)

*   **Propósito:** Confirmar si las rutas de la API funcionan y si las variables de entorno están accesibles en tiempo de ejecución.
*   **Comando (usando la `url` del despliegue del Paso 3):
    ```bash
    # Reemplaza con la URL completa del despliegue:
    DEPLOYMENT_URL="pacifico-editor-o8cwtrket-javier20dev25s-projects.vercel.app" # O la URL de tu despliegue más reciente

    # Para verificar un endpoint de prueba simple como /api/test-env
    curl -i "https://$DEPLOYMENT_URL/api/test-env"

    # Para verificar la API de registro (ej. esperando un 400 o 500 si falta el cuerpo o las credenciales)
    curl -i -X POST -H "Content-Type: application/json" -d '{}' "https://$DEPLOYMENT_URL/api/auth/register"
    ```
*   **Análisis:**
    *   Un `HTTP/2 200` o `201`: el enrutamiento y la invocación de la función funcionan.
    *   Un `HTTP/2 404`: el endpoint no se encontró (problema de `vercel.json` o que la función no se desplegó).
    *   Un `HTTP/2 500`: un error en la lógica de la función (puede ser por variables de entorno faltantes o errores de código).
    *   Inspecciona el cuerpo de la respuesta para mensajes de error específicos (como los de `api/test-env` que te informan sobre las variables de entorno).

### Paso 6: Obtener Logs de Runtime desde la CLI (si la CLI funciona)

*   **Propósito:** Obtener los logs de *tiempo de ejecución* de las solicitudes HTTP (lo que normalmente se ve en el dashboard de Vercel). Este paso puede fallar en despliegues con muchos logs.
*   **Comando (usando la `url` del despliegue del Paso 3):
    ```bash
    DEPLOYMENT_URL_FULL="https://<URL_COMPLETA_DEL_DESPLIEGUE>"
    npx -y vercel@latest logs "$DEPLOYMENT_URL_FULL" --token "$VERCEL_TOKEN" | head -n 500
    ```
*   **Análisis:** Busca solicitudes que terminaron en `404` o `500` y cualquier mensaje de error asociado.

---
