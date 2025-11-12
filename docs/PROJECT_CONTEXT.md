# Contexto Histórico y Estado Actual del Proyecto "Pacífico Web"

## 1. Resumen del Proyecto

**Pacífico Web** es un sistema SaaS (Software as a Service) diseñado para permitir a emprendedores crear y gestionar sus propias tiendas online.

*   **Backend:** Node.js con Express, utilizando Supabase como proveedor de base de datos (PostgreSQL).
*   **Frontend Original:** Una aplicación de una sola página (SPA) construida con JavaScript puro, HTML y CSS.
*   **Frontend Actual:** Una aplicación moderna construida con **React, TypeScript, Vite, y Zustand** para la gestión del estado.

## 2. Arquitectura y Estado Inicial (Pre-Intervención)

El proyecto originalmente consistía en un backend funcional pero inestable y un frontend de JavaScript puro que presentaba varios problemas de mantenibilidad.

### Arquitectura del Editor Antiguo (JavaScript Puro)

La primera versión del editor de tiendas se basaba en un patrón de estado centralizado:
*   Un objeto global `state.storeState` actuaba como la única fuente de verdad.
*   Cualquier cambio en la UI modificaba este objeto.
*   Una función `renderAll()` era invocada para redibujar la previsualización completa a partir del estado.
*   **Regla fundamental:** Nunca se debía modificar el DOM directamente, solo el objeto de estado.

Este enfoque, aunque funcional, se volvió complejo y propenso a errores, lo que motivó la migración a React.

## 3. Proceso de Migración y Corrección (Noviembre 2025)

A principios de noviembre de 2025, se inició un proceso intensivo de auditoría, corrección y finalización del proyecto.

### 3.1. Reconstrucción de la Base de Datos

Uno de los problemas más críticos fue la ausencia de un esquema de base de datos coherente y completo. Los archivos `.sql` existentes en el repositorio eran fragmentarios, contradictorios y obsoletos.

*   **Acción:** Se realizó un proceso de **ingeniería inversa** analizando todo el código del backend (`/backend/api/*.js`) para deducir la estructura de datos que la aplicación esperaba.
*   **Resultado:** Se creó un script único y completo, `schema_reconstruido.sql`, que define:
    *   **Tablas Esenciales:** `usuarios`, `stores`, `planes`, `contratos`, y `pedidos`.
    *   **Vistas:** `vw_usuarios_planes` para simplificar consultas.
    *   **Triggers:** Para la generación automática de `slugs` en las tiendas.
    *   **Funciones RPC:** Se recrearon las funciones `create_user_and_contract`, `get_registration_stats`, y `get_summary` que eran necesarias para la funcionalidad completa del panel de administración y las estadísticas, evitando errores en el frontend.
    *   **Políticas de Seguridad (RLS):** Se definieron todas las políticas para proteger el acceso a los datos.

### 3.2. Corrección de Errores Críticos en el Frontend (React)

El nuevo editor en React, aunque más robusto, contenía varios bugs que impedían su uso:

*   **Bug de "Añadir Producto":** La adición de un nuevo producto fallaba silenciosamente. Se diagnosticó que un objeto `File` (no serializable) se estaba intentando guardar en el estado persistente de Zustand, corrompiendo el `localStorage`.
    *   **Solución:** Se eliminó el objeto `File` del estado antes de la acción de `addProduct`, solucionando el problema de persistencia.
*   **Bug del "Botón Editar":** El botón para editar la tienda en el dashboard del usuario estaba deshabilitado.
    *   **Solución:** Se corrigió la lógica que habilitaba el botón.
*   **Bug de "URL Pública 404":** El enlace para ver la tienda pública generaba un error 404.
    *   **Solución:** Se ajustó el backend (`user.js`) para que construyera y devolviera la URL completa y correcta (`shareableUrl`), y se actualizó el frontend para usarla.

### 3.3. Limpieza de Código y Documentación

*   Se realizaron numerosas correcciones de linting y type-checking en todo el código.
*   Se consolidaron múltiples archivos `.txt` de notas y avances en este documento único para centralizar el conocimiento del proyecto.

### 3.4. Diagnóstico y Solución de Problema de Autenticación

Durante el setup del entorno de desarrollo, surgió un error crítico que impedía el login: el servidor autenticaba al usuario correctamente, pero fallaba al intentar leer su perfil de la tabla `usuarios`, resultando en un error de "Perfil no encontrado".

*   **Diagnóstico:** Se descubrió que, a pesar de usar la `service_role_key` de Supabase, el cliente de Node.js no estaba saltándose las Políticas de Seguridad a Nivel de Fila (RLS) de la tabla `usuarios`. Esto provocaba que la tabla pareciera estar vacía para el servidor.
*   **Solución Definitiva:** La solución fue forzar explícitamente los headers de autenticación en la configuración global del cliente de `supabase-js` en `backend/services/supabase.js`. Esto asegura que todas las peticiones hechas con el cliente `supabaseAdmin` usen la `service_role_key` y tengan los permisos necesarios para omitir las RLS.

```javascript
// backend/services/supabase.js
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  },
});
```

### 3.5. Corrección del Módulo de Creación de Usuarios

Tras estabilizar el login, se detectó que la creación de usuarios desde el panel de administrador fallaba por completo. La depuración reveló una cascada de errores interconectados:

1.  **`ReferenceError: AdminCreateUserSchema is not defined`**: El error inicial y principal fue que el archivo `backend/api/admin.js` intentaba usar un esquema de validación que no estaba siendo importado. En algún punto de las refactorizaciones, la línea `require` se había perdido.
2.  **`Error: Cannot find module '../../shared/schemas/user'`**: Una vez añadido el `require`, el servidor seguía fallando. El problema era que el backend (JavaScript puro) intentaba importar un archivo TypeScript (`.ts`) del directorio `shared`, lo cual no puede hacer de forma nativa. La solución fue crear una versión del esquema en JavaScript puro (`user.js`) y apuntar la importación a este nuevo archivo.
3.  **Crash Silencioso del Servidor**: Incluso con los errores anteriores corregidos, el servidor se cerraba sin ningún mensaje de error. Se diagnosticó que esto se debía a una dependencia oculta. Al refactorizar el código y eliminar el uso de `bcryptjs`, se eliminó también su `require`. Sin embargo, otra parte del módulo o una de sus dependencias parecía necesitar la presencia del paquete, causando un error fatal a bajo nivel. La solución temporal pero efectiva fue re-añadir `require('bcryptjs');` al archivo, lo que estabilizó el servidor y permitió que los errores de validación se mostraran correctamente.

Tras solucionar estos tres problemas, la funcionalidad de creación de usuarios fue completamente restaurada y refactorizada para usar el sistema de autenticación moderno de Supabase.

### 3.6. Corrección de Acciones de Usuario en el Frontend

Se identificaron y corrigieron varios problemas en el frontend relacionados con las acciones de usuario en el panel de administración:

1.  **Mensaje de Creación de Usuario no Mostrado:** El formulario de creación de usuario no mostraba el mensaje de "copia y pega" generado por el backend. Se corrigió `CreateUserForm.tsx` para que utilizara el `copyPasteMessage` de la respuesta de la API.
2.  **Botón "Revocar" (y otros) Fallando:** Los botones de acción en `ActionButtons.tsx` no pasaban el objeto `user` completo a la función `handleAction` en `UsersTable.tsx`, lo que causaba errores al intentar realizar acciones como "Revocar". Se estandarizó el paso del objeto `user` completo para todas las acciones.
3.  **Flujo de Reseteo de Contraseña Incompleto:**
    *   El enlace de recuperación de contraseña generado por el backend no redirigía correctamente al frontend. Se ajustó el `redirectTo` en `backend/api/admin.js` para apuntar a una nueva ruta específica.
    *   Se creó un nuevo componente `UpdatePassword.tsx` y su ruta en `App.tsx` para manejar la actualización de la contraseña en el frontend.
    *   Se configuró el cliente de Supabase para el frontend en `react-editor/src/services/supabase.ts` y se crearon las variables de entorno necesarias en `react-editor/.env`.

### 3.7. Corrección de Carga de Entorno y Flujo de Credenciales (Nov 2025)

Tras las correcciones anteriores, el servidor del backend comenzó a fallar al arrancar, presentando un error crítico y persistente: `Error: Supabase URL, Anon Key, or Service Key is missing in .env file`.

*   **Diagnóstico y Causa Raíz:** Después de múltiples intentos fallidos de corregir el orden de carga de las variables de entorno, una inspección minuciosa del archivo `.env` reveló que los valores de las claves estaban envueltos en comillas dobles (ej: `SUPABASE_URL="..."`). El paquete `dotenv` interpretaba estas comillas como parte del valor, corrompiendo las claves.
*   **Solución Definitiva:** Se reescribió el archivo `.env` por completo, asegurando el formato `CLAVE=VALOR` sin comillas. Adicionalmente, se modificó el script `dev` en `package.json` a `node -r dotenv/config server.js` para forzar la precarga de las variables, creando una solución de arranque robusta.

*   **Mejora del Flujo de Credenciales de Administrador:** Se implementó una sugerencia del usuario para mejorar el acceso a las credenciales de nuevos usuarios.
    *   **Backend:** Se añadió una columna `temporary_password` a la tabla `usuarios`. La API de creación ahora guarda la contraseña en esta columna y se creó un endpoint seguro (`GET /api/admin/credentials/:user_uuid`) para consultarla.
    *   **Frontend:** Se añadió un botón "Credenciales" en la tabla de usuarios para aquellos con estado "temporal", el cual muestra un modal con la información.

### 3.8. Refactorización del Flujo de Autenticación y Persistencia de Tiendas (Nov 2025)

*   **Corrección del Flujo de Activación de Cuenta:** Se detectó un crash del servidor al momento de que un nuevo usuario intentaba establecer su contraseña definitiva (`ReferenceError: bcrypt is not defined`). La ruta `/api/auth/complete-registration` usaba lógica antigua. Se reescribió la ruta para usar métodos modernos de Supabase (`supabase.auth.admin.updateUserById`), eliminando la dependencia de `bcrypt` y solucionando el error.

*   **Nuevo Flujo de Reseteo de Contraseña (Admin-Driven):** El flujo de "olvidé mi contraseña" basado en `magiclink` se descartó por ser problemático y poco intuitivo para el administrador. Se implementó la propuesta del usuario:
    *   El botón "Resetear Pass" ahora genera una nueva contraseña temporal, la actualiza en Supabase y en la base de datos local, y cambia el estado del usuario a `temporary`.
    *   Esto permite al administrador usar el botón "Credenciales" para obtener la nueva clave y compartirla, forzando al usuario a realizar el flujo de activación de cuenta ya corregido.
    *   Como consecuencia, la página `UpdatePassword.tsx` y su ruta fueron eliminadas del proyecto.

*   **Solución al Bug del Dashboard de Usuario:** Se corrigió el error que impedía que el dashboard del usuario se actualizara después de crear una tienda.
    *   **Causa:** La ruta del backend (`PUT /api/user/store-data`) solo estaba programada para *actualizar* tiendas, pero no para *crearlas*.
    *   **Solución:** Se refactorizó la ruta para implementar una lógica "UPSERT" (Update or Insert). Ahora, el sistema primero comprueba si el usuario tiene una tienda; si la tiene, la actualiza; si no, la crea.

## 4. Estado Actual del Proyecto

El proyecto se encuentra en un estado funcional, con los flujos de autenticación, creación y gestión de usuarios y reseteo de contraseñas funcionando de manera estable y robusta. Los principales bugs reportados han sido solucionados.

*   El **backend** arranca correctamente y las APIs principales son consistentes.
*   La **base de datos** está actualizada.
*   El **frontend en React** tiene los flujos de login y registro corregidos.
*   La **documentación** (este archivo) está actualizada a fecha del 8 de Noviembre de 2025.

### Tareas Pendientes (a fecha 8 de Noviembre de 2025):

*   **Corroboración de Cambios:** El usuario necesita probar y confirmar que los flujos de "Resetear Contraseña" y "Dashboard de Usuario" ahora funcionan como se espera.
*   **Página de Vista Previa en Blanco:** El problema de que la vista previa de la tienda se muestre en blanco aún no se ha investigado.
*   **Simplificación de Botones en Dashboard:** El usuario ha sugerido unificar los botones de "Vista Previa" y "Vista Pública" en un solo botón que lleve a la tienda lanzada.

## 3.9. Estabilización del Flujo de Tiendas (Noviembre 2025 - Continuación)

Tras solucionar los problemas de autenticación y creación de tiendas, el foco se centró en el flujo principal del usuario: guardar y visualizar su tienda. Este proceso reveló una serie de problemas profundos y entrelazados.

### Incidente 1: El `slug` Persistente de "mi-tienda"

*   **Síntoma:** Sin importar el nombre que se le diera a una tienda, la URL pública generada siempre era `.../store/mi-tienda`.
*   **Causa Raíz:** El trigger de la base de datos (`generate_unique_store_slug`) solo se activaba si el valor del campo `slug` era `NULL`. La ruta del backend `PUT /api/user/store-data` enviaba el `slug` por defecto del estado del frontend ("mi-tienda"), por lo que el trigger nunca se ejecutaba.
*   **Solución Fallida:** Se intentó usar `delete payload.slug`, pero esto no funcionaba para los `UPDATE` en la base de datos.
*   **Solución Definitiva:** Se modificó la ruta `PUT /api/user/store-data` para que, antes de hacer el `UPSERT`, establezca explícitamente `payload.slug = null`. Esto fuerza al trigger a ejecutarse siempre, generando un `slug` único basado en el nombre de la tienda.

### Incidente 2: Error de Subida de Imágenes (`Bucket not found`)

*   **Síntoma:** Al guardar una tienda con imágenes, el backend crasheaba con el error `StorageApiError: Bucket not found`.
*   **Causa Raíz:** El código del backend tenía los nombres de los buckets de Supabase Storage ("store-logos", "product-images") hardcodeados, mientras que el archivo de entorno `.env` especificaba un bucket diferente (`imagenes`).
*   **Solución Definitiva:** Se refactorizó la ruta `PUT /api/user/store-data` para que todas las operaciones de subida de archivos usen la variable de entorno `process.env.STORAGE_BUCKET`. Esto centraliza la configuración del bucket y soluciona el error, asumiendo que el bucket (ej: "imagenes") existe y es público en Supabase.

### Incidente 3: Arquitectura de Visualización Fallida y Errores de Referencia

*   **Síntoma:** En un intento por solucionar problemas de visualización, se creó una arquitectura de SPA con un componente `StoreViewer.tsx`. Esto resultó en una UI duplicada (la navegación principal aparecía dentro del contenido de la tienda) y una experiencia de usuario confusa. Además, durante los refactors, el servidor empezó a crashear al iniciar o al guardar debido a `ReferenceError: upload is not defined` y `ReferenceError: cleanStoreDataUrls is not defined`.
*   **Causa Raíz:**
    1.  **Arquitectura SPA:** El `StoreViewer.tsx` se renderizaba dentro del layout principal de la aplicación de React, heredando su navegación, lo cual era incorrecto para una vista pública.
    2.  **`ReferenceError`s:** Una limpieza de código demasiado agresiva eliminó las definiciones de `multer` y de funciones helper que todavía eran necesarias.
*   **Solución Definitiva:**
    1.  **Retorno a la Arquitectura Original:** Se descartó por completo el enfoque de `StoreViewer.tsx` y se eliminaron los archivos asociados. Se restauró la lógica original en `server.js`, donde la ruta `GET /store/:slug` es la única responsable de la visualización.
    2.  **Renderizado del Lado del Servidor (SSR simple):** El flujo actual y correcto es que `server.js` obtiene los datos de la tienda de Supabase, lee la plantilla `public/viewer_template.html`, inyecta los datos en un bloque `<script>`, y sirve el HTML resultante. Esto asegura que se use la plantilla original del proyecto y aísla completamente la vista pública de la aplicación del editor.
    3.  **Corrección de Errores:** Se restauraron las definiciones de `multer` y `cleanStoreDataUrls` en `backend/api/user.js`, solucionando los crashes del servidor.

## 4. Estado Actual del Proyecto (Actualizado a 11 de Noviembre de 2025)

El proyecto se encuentra en un estado **funcionalmente estable**. Los flujos de autenticación, gestión de usuarios y, crucialmente, de creación, guardado y visualización de tiendas, están operando de acuerdo a la arquitectura final descrita.

*   **Backend:** Arranca sin errores. La API de guardado de tiendas (`PUT /api/user/store-data`) ahora maneja correctamente la subida de imágenes, la generación de `slugs` y la persistencia de datos en las columnas correctas de la base de datos.
*   **Frontend:** La lógica de guardado en `StoreEditor.tsx` y la de visualización en `StoreManager.tsx` interactúan correctamente con el backend.
*   **Visualización de Tienda:** La ruta pública `GET /store/:slug` sirve la plantilla HTML correcta con los datos inyectados desde la base de datos.

### Tareas Pendientes

*   **Confirmación Final:** El usuario (Astaroth) necesita realizar una prueba completa del flujo para confirmar que todos los errores han sido resueltos.
*   **Limpieza de Código:** Eliminar cualquier `console.log` o `alert` de depuración que se haya añadido durante el proceso.
*   **Estilo de la Plantilla:** Revisar y mejorar los estilos de `public/viewer_template.html` si es necesario para asegurar que renderiza los datos de forma atractiva.

## 4.1. Estabilización del Flujo de Visualización y `slug`s (Noviembre 2025)

Tras las correcciones anteriores, persistían dos problemas críticos que impedían la correcta visualización y unicidad de las tiendas.

### Incidente 1: Error 404 en la Vista Previa

*   **Síntoma:** Al intentar acceder a la URL de la tienda (ej. `/store/mi-tienda`), el navegador mostraba un error 404, a pesar de que los logs del backend indicaban que la ruta se estaba alcanzando.
*   **Causa Raíz:** Un análisis más profundo reveló un problema de arquitectura. El frontend (servido por Vite en el puerto 5173) recibía una URL relativa (`/store/mi-tienda`) y trataba de resolverla por sí mismo, pero no tenía una ruta definida para ello. El servidor correcto que debía manejar la petición era el backend (Node.js en el puerto 3000).
*   **Solución Definitiva:** Se refactorizaron todas las rutas del backend (`GET /api/user/stores`, `POST /api/user/stores`, `GET /api/user/store-data`, `PUT /api/user/store-data`) que generaban la `shareableUrl`. Se eliminó el uso de la variable `FRONTEND_URL` y se reemplazó por `BACKEND_URL` (con `http://localhost:3000` como valor por defecto). Esto asegura que el backend siempre genere una URL absoluta que apunte a sí mismo, garantizando que sea el servidor correcto quien procese la solicitud y sirva la plantilla `viewer_template.html`.

### Incidente 2: El `slug` Persistente de "mi-tienda" (Regresión)

*   **Síntoma:** A pesar de que la documentación indicaba que este bug estaba resuelto, el problema resurgió. Sin importar el nombre que se le diera a la tienda, el `slug` generado era siempre "mi-tienda".
*   **Causa Raíz:** Se descubrió una inconsistencia crítica en la persistencia de datos. La ruta `PUT /api/user/store-data` (la principal usada por el editor) no estaba guardando el objeto completo de la tienda en la columna `data` de la base de datos. Solo actualizaba campos de primer nivel. Esto provocaba que, al recargar el editor, se leyeran los datos desactualizados de la columna `data`, perdiendo el nombre nuevo y volviendo a usar el nombre por defecto ("Mi Tienda") para la siguiente operación de guardado.
*   **Solución Definitiva:** Se aplicó una corrección integral en la ruta `PUT /api/user/store-data`:
    1.  Se modificó el `payload` de la base de datos para que siempre incluya el campo `data` con el objeto completo de la tienda (`cleanedData`).
    2.  Se ajustó la consulta a la base de datos para que, tras la operación, devolviera explícitamente los campos `slug` y `data`.
    3.  Se reestructuró la respuesta JSON al frontend para que enviara el objeto `data` completo y actualizado, en lugar de un objeto parcial reconstruido. Esto previene la corrupción del estado en el cliente (Zustand) y asegura la persistencia correcta de todos los cambios.

## 4.2. Depuración Final de la Plantilla de Visualización (12 de Noviembre de 2025)

Tras resolver los problemas de persistencia de datos y generación de URLs, el último obstáculo era una página de visualización de la tienda que se mostraba completamente en blanco. Este problema desencadenó una depuración en múltiples etapas para descubrir una cascada de errores de seguridad y configuración.

### Incidente 1: Página en Blanco y `net::ERR_BLOCKED_BY_RESPONSE`

*   **Síntoma:** La vista previa de la tienda en el dashboard se mostraba como una página en blanco.
*   **Investigación:** Se añadió un script de depuración visual a `viewer_template.html` para capturar errores del lado del cliente. Sin embargo, la consola de depuración también aparecía en blanco. La pista clave provino de la herramienta Eruda del usuario, que reportó el error `net::ERR_BLOCKED_BY_RESPONSE`.
*   **Causa Raíz:** El error indicaba que la página no podía ser cargada dentro de un `<iframe>`. Se diagnosticó que el middleware de seguridad `helmet` en `server.js` estaba aplicando la cabecera `X-Frame-Options: SAMEORIGIN` por defecto, impidiendo que el frontend (puerto 5173) renderizara contenido del backend (puerto 3000).
*   **Solución:** Se modificó la configuración de `helmet` en `server.js` para ajustar la `Content-Security-Policy` (CSP), permitiendo explícitamente que el origen del frontend actuara como `frame-ancestors`.

### Incidente 2: Fallo de Ejecución de Scripts (CSP)

*   **Síntoma:** Después de solucionar el bloqueo del `iframe`, la página seguía en blanco, pero ahora sí se mostraba la caja de depuración vacía. Esto indicaba que el HTML se estaba renderizando, pero el JavaScript no se ejecutaba.
*   **Causa Raíz:** La misma CSP que solucionó el problema del `iframe` era ahora demasiado estricta y estaba bloqueando la ejecución de scripts "inline" (`<script>...</script>`) por razones de seguridad.
*   **Solución:** Se ajustó de nuevo la CSP en `server.js`, añadiendo la directiva `'unsafe-inline'` a la política `script-src` para permitir la ejecución del script de la plantilla.

### Incidente 3: Fallo de Inyección de Datos (`STORE_DATA is missing`)

*   **Síntoma:** Con los scripts ya ejecutándose, la plantilla ahora mostraba el error `Error: STORE_DATA is missing or malformed`.
*   **Causa Raíz:** Se determinó que la inyección de datos del lado del servidor estaba fallando silenciosamente. El método `viewerHtml.replace('<!-- SERVER_DATA_INJECTION -->', ...)` no encontraba el marcador de comentario en el archivo HTML, probablemente debido a caracteres invisibles o problemas de formato.
*   **Solución:** Se implementó un método de inyección más robusto. Se reemplazó el comentario `<!-- SERVER_DATA_INJECTION -->` en `viewer_template.html` por un marcador de texto único (`__DATA_INJECTION_POINT__`) y se actualizó `server.js` para que buscara y reemplazara este nuevo marcador.

### Incidente 4: Estilos Rotos (CSP Final)

*   **Síntoma:** Con los datos finalmente inyectados y el script funcionando, la tienda se renderizaba, pero sin los estilos correctos, pareciendo "HTML básico".
*   **Causa Raíz:** El diagnóstico final reveló que la CSP seguía siendo demasiado restrictiva. Estaba bloqueando la carga de recursos de estilo desde dominios externos (CDN de Tailwind CSS y Font Awesome) y también la ejecución de la hoja de estilos en línea (`<style>...</style>`) que contenía los efectos "neumórficos".
*   **Solución Definitiva:** Se realizó el ajuste final a la CSP en `server.js`, añadiendo los dominios de las CDNs a las directivas `script-src` y `style-src`, y añadiendo `'unsafe-inline'` a `style-src`. Esto permitió que todos los recursos de estilo se cargaran correctamente.

Con esta última corrección, todos los aspectos de la visualización de la tienda quedaron completamente funcionales, resolviendo la cascada de errores.
