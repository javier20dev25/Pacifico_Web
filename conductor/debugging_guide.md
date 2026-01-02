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
    curl -i -X POST -H "Content-Type: application/json" -d '{}' "https://://$DEPLOYMENT_URL/api/auth/register"
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

---

## Caso de Estudio: Error 404 en Aplicación Frontend (Monorepo)

Esta sección documenta la solución a un problema común en proyectos monorepo donde la aplicación de frontend (React, en este caso) está en un subdirectorio.

### El Problema

*   **Síntoma:** El despliegue en Vercel se completaba exitosamente (`Build Completed`), y las rutas de la API (`/api/*`) funcionaban, pero todas las páginas del frontend devolvían un error `404 NOT_FOUND`.
*   **Contexto:** La estructura del proyecto es un monorepo con la aplicación de React ubicada en el subdirectorio `react-editor/`.

### El Diagnóstico

1.  **Verificación de la Construcción Local:** Se confirmó que al ejecutar `npm run build` dentro de `react-editor/`, se generaba correctamente un directorio `dist/` con un `index.html` y los assets. Esto descartó un problema en la configuración de Vite/React.

2.  **Inspección del "Output" de Vercel:** Se le pidió al usuario que revisara la pestaña **"Output"** (o "Source") del despliegue en el panel de Vercel.

3.  **Causa Raíz Identificada:** La inspección reveló que Vercel, a pesar de construir el proyecto correctamente, colocaba los archivos de salida (`dist/`) dentro de un directorio con el mismo nombre que el subdirectorio del proyecto. La estructura de salida final en Vercel era:
    ```
    /
    ├── api/
    └── react-editor/
        ├── assets/
        └── index.html
    ```
    El archivo `vercel.json` existente intentaba servir el `index.html` desde la raíz (`/`), pero el archivo no se encontraba ahí, causando el 404.

### La Solución

Se modificó la sección de `routes` en el archivo `vercel.json` para que las rutas apuntaran a la ubicación correcta de los archivos de salida dentro del directorio `react-editor/`.

#### `vercel.json` (Incorrecto)
```json
"routes": [
  { "handle": "filesystem" },
  { "src": "/api/(.*)", "dest": "/api/$1" },
  { "src": "/assets/(.*)", "dest": "/assets/$1" },
  { "src": "/(.*)", "dest": "/index.html" }
]
```

#### `vercel.json` (Corregido)
```json
"routes": [
  { "handle": "filesystem" },
  { "src": "/api/(.*)", "dest": "/api/$1" },
  { "src": "/assets/(.*)", "dest": "/react-editor/assets/$1" },
  { "src": "/(.*)", "dest": "/react-editor/index.html" }
]
```
*   **Explicación de la corrección:**
    *   La ruta de los assets (`/assets/(.*)`) ahora se redirige a `/react-editor/assets/$1`.
    *   La ruta "catch-all" (`/(.*)`) que sirve la aplicación de una sola página (SPA) ahora apunta a `/react-editor/index.html`.

Esta solución resolvió el problema del 404 y permitió que Vercel sirviera la aplicación de React correctamente.

---

## Caso de Estudio 2: Errores Comunes Post-Despliegue (500 y Variables de Entorno)

Una vez que el enrutamiento principal (404) está resuelto, pueden aparecer nuevos errores. Estos son los más comunes en un monorepo con funciones serverless.

### 1. Error 500 con `ERR_MODULE_NOT_FOUND`

*   **Síntoma:** Una ruta de la API devuelve un error `500 Internal Server Error`. El log de la función muestra `Error [ERR_MODULE_NOT_FOUND]: Cannot find module...`
*   **Causa:** La función serverless (ej. `/api/mi-funcion.js`) está intentando importar un módulo o archivo (`import modulo from '../lib/util.js'`) que se encuentra **fuera** del directorio `/api`. El sistema de construcción de Vercel empaqueta cada función de forma aislada y no incluye archivos de niveles superiores.
*   **Solución:** Mover cualquier código compartido (helpers, utilidades, clientes de base de datos) a un subdirectorio **dentro** de `/api`. La convención es usar `api/_lib/` o `api/_utils/`. Luego, actualizar las rutas de importación en las funciones para que sean relativas a su nueva ubicación.
    *   **Ejemplo:**
        *   Mover `lib/supabaseAdmin.js` a `api/_lib/supabaseAdmin.js`.
        *   En `api/riel/preregister.js`, cambiar `import supabase from '../../lib/supabaseAdmin.js'` por `import supabase from '../_lib/supabaseAdmin.js'`.

### 2. La API Funciona Pero Faltan Datos (Variables de Entorno)

*   **Síntoma:** La API responde con un `200 OK` pero la lógica falla, o un endpoint de prueba (`/api/test-env`) muestra `false` para las variables de entorno.
*   **Causa:** Las variables de entorno en Vercel tienen un "alcance" (scope). Por defecto, a menudo se crean solo para el entorno de **Producción**. Los despliegues generados desde ramas (como `feat/mi-rama`) crean un entorno de **Preview**, el cual no hereda automáticamente las variables.
*   **Solución:** En el panel de Vercel, ir a `Settings > Environment Variables`. Para cada variable necesaria, hacer clic en el menú de opciones y asegurarse de que los checkboxes para **todos los entornos** (o al menos `Production` y `Preview`) estén seleccionados. Guardar los cambios. No se necesita un nuevo despliegue para que las variables actualizadas estén disponibles en despliegues futuros.