# Informe de Funcionalidad y Solución de Problemas

Este documento detalla los problemas encontrados durante el desarrollo, el proceso de diagnóstico y las soluciones implementadas para alcanzar el estado funcional actual de la aplicación.

## 1. Problemas Iniciales

La aplicación presentaba dos problemas críticos interrelacionados que impedían la correcta gestión de las tiendas:

1.  **Error al Guardar con Imágenes Nuevas:** Al intentar guardar una tienda después de añadir o cambiar una imagen (logo o de producto), la operación fallaba con un error `MulterError: Field value too long` en el backend. Esto indicaba que el payload enviado excedía los límites esperados por el middleware `multer`.

2.  **Imágenes No se Visualizaban:** En la página pública de la tienda (`/store/:slug`), las imágenes existentes no se mostraban. En su lugar, aparecía el ícono de imagen rota del navegador. Curiosamente, al hacer clic derecho y "Descargar imagen", el archivo se descargaba correctamente, lo que sugería que la URL era válida pero la visualización estaba bloqueada.

3.  **Cambios de Datos no se Reflejaban:** Después de guardar cambios en los datos de la tienda (como el nombre o la descripción), al visitar la URL pública, a menudo se seguía viendo la versión antigua de los datos.

## 2. Proceso de Diagnóstico y Soluciones

El camino hacia la solución fue un proceso iterativo de diagnóstico y corrección.

### A. El Error `MulterError`

- **Hipótesis Inicial:** El error se debía a que las imágenes, previsualizadas en el cliente como `Data URL` (una cadena de texto base64 muy larga), se estaban incluyendo incorrectamente en el payload JSON (`storeData`) enviado al backend junto con los archivos de imagen.
- **Solución Implementada:** Se refactorizó completamente el flujo de guardado:
    1.  **Desacoplamiento:** Se separó la subida de archivos del guardado de datos.
    2.  **Subida Individual:** El frontend ahora sube cada imagen (logo y productos) de forma individual a un endpoint dedicado (`/api/uploads/upload-image`) que devuelve la URL pública final de Supabase.
    3.  **Payload Limpio:** Una vez subidas todas las imágenes, el frontend construye un payload JSON limpio que contiene únicamente las URLs devueltas por el servidor (no `File` ni `Data URL`).
    4.  **Guardado Final:** Este payload JSON se envía al endpoint principal (`/api/user/store-data`), que fue simplificado para no usar `multer` y solo aceptar `application/json`.

### B. La No Visualización de Imágenes

- **Hipótesis 1 (URL Incorrecta):** Se pensó que la función `getPublicImageUrl` no construía bien las URLs. Se corrigió un error en `server.js` donde no se inyectaba la `url` base de Supabase en la configuración de la plantilla.
- **Hipótesis 2 (CSP):** A pesar de que las URLs eran correctas (confirmado por la capacidad de descargarlas), seguían sin mostrarse. El diagnóstico final apuntó a una **Política de Seguridad de Contenido (CSP)** demasiado restrictiva, gestionada por el middleware `helmet`.
- **Solución Implementada:** Se modificó la configuración de `helmet` en `server.js` para añadir la directiva `img-src`, permitiendo explícitamente al navegador cargar imágenes desde el dominio de Supabase (`*.supabase.co`).

### C. Cambios no Reflejados (Problema de Caché)

- **Hipótesis Final:** Se determinó que el navegador (especialmente Chrome) estaba sirviendo una versión en caché de la página de la tienda. Como la URL (`/store/mi-tienda`) no cambiaba, el navegador no veía la necesidad de solicitar la nueva versión con los datos actualizados.
- **Solución Implementada (Cache Busting):** Se implementó una técnica de "invalidación de caché".
    1.  **Generación de URL Única:** Tanto al guardar la tienda como al cargar los datos iniciales en el editor, se modifica la `shareableUrl` para añadirle un parámetro de consulta único basado en el timestamp actual.
    2.  **Ejemplo:** `http://.../mi-tienda` se convierte en `http://.../mi-tienda?v=1764033023208`.
    3.  **Efecto:** Este parámetro `v` (de "versión") hace que para el navegador la URL sea siempre nueva, forzándolo a descartar la caché y solicitar la página actualizada directamente desde el servidor. **No se actualiza ningún token**, simplemente se hace que la URL sea única.

## 3. Estado Actual

La aplicación se encuentra en un estado **estable y funcional** con respecto a la gestión de tiendas:

-   **Guardado Robusto:** Los datos de la tienda y las imágenes se guardan de forma fiable sin errores.
-   **Visualización Correcta:** Todas las imágenes, tanto nuevas como antiguas, se muestran correctamente en la tienda pública.
-   **Actualización Inmediata:** Cualquier cambio realizado en el editor se refleja inmediatamente al visitar la URL de la tienda, gracias a la estrategia de "cache busting".
-   **Código Limpio:** El código de la plantilla `viewer_template.html` fue refactorizado y limpiado después de un intenso proceso de depuración.
