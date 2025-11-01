# Roadmap del Proyecto: PacíficoWeb

Este documento describe las próximas mejoras y optimizaciones planificadas para el proyecto, una vez alcanzada la estabilidad funcional de la v1.0.

---

## Versión 1.1: Mejoras Técnicas y de Experiencia de Usuario (UX)

El objetivo de esta versión es refinar la base funcional, optimizar el rendimiento y mejorar la interacción del usuario con el editor de la tienda.

### Checklist de Tareas

#### Backend y Arquitectura
- [ ] **Optimizar Rutas de Storage:**
  - **Tarea:** Modificar el script de subida en `/backend/api/uploads.js` para evitar la duplicación del prefijo `imagenes/` en la ruta del archivo guardado.
  - **Objetivo:** Lograr rutas más limpias como `tiendas/<userId>/<filename>.jpg` en lugar de `imagenes/tiendas/...`.

- [ ] **Normalizar URLs en la Base de Datos:**
  - **Tarea:** Guardar únicamente la ruta relativa del archivo (`tiendas/<userId>/<filename>.jpg`) en la columna `data` de la base de datos, en lugar de la URL pública completa.
  - **Objetivo:** Reducir el almacenamiento de datos y hacer la aplicación más flexible a cambios de dominio o de configuración de Storage. La URL pública se reconstruiría en el frontend (`viewer_template.html`) al momento de renderizar, usando `supabase.storage.from('...').getPublicUrl(path)`.

- [ ] **Configurar Variable de Entorno para Frontend:**
  - **Tarea:** Añadir una variable `FRONTEND_URL` en el archivo `.env` y configurarla en el entorno de producción (Render).
  - **Objetivo:** Generar enlaces absolutos y correctos para la función "Compartir", independientemente de si la app corre en `localhost` o en el dominio de producción.

#### Frontend y Experiencia de Usuario (UX)
- [ ] **Mejorar Feedback Visual en la Subida de Archivos:**
  - **Tarea:** Implementar una barra de progreso o un indicador visual más detallado en el editor mientras se suben las imágenes.
  - **Objetivo:** Darle al usuario una mejor retroalimentación del estado de la subida, especialmente si los archivos son grandes o la conexión es lenta.

- [ ] **Implementar Auto-Guardado (Borradores):**
  - **Tarea:** Añadir una función de auto-guardado en el editor que persista los cambios locales (en `localStorage`) cada cierto tiempo.
  - **Objetivo:** Evitar que el usuario pierda su trabajo si cierra accidentalmente la pestaña o hay un error antes de guardar manualmente.

- [ ] **Añadir Botón de "Vista Previa Pública":**
  - **Tarea:** Agregar un botón en el editor que abra una nueva pestaña con la URL pública de la tienda (`/store/:slug`).
  - **Objetivo:** Permitir al usuario ver su tienda exactamente como la vería un cliente, sin tener que ir al dashboard.

- [ ] **Control de Caché para Imágenes:**
  - **Tarea:** Investigar y aplicar cabeceras de control de caché para las imágenes servidas desde Supabase Storage.
  - **Objetivo:** Mejorar los tiempos de carga para visitantes recurrentes, haciendo que el navegador no tenga que descargar las imágenes cada vez.
