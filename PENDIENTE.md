# Tareas Pendientes del Proyecto PacificoWeb

Esta es una lista de tareas de mantenimiento y optimización que han surgido durante el desarrollo y que deben ser abordadas cuando haya oportunidad.

### 1. Actualizar Dependencias con Advertencias

Durante el build en Vercel, `npm` ha mostrado advertencias sobre paquetes obsoletos (`deprecated`).
- `inflight@1.0.6`
- `node-domexception@1.0.0`
- `glob@7.2.3`

**Acción:** Investigar y actualizar estos paquetes a sus versiones más recientes y soportadas para mejorar la seguridad y el rendimiento. Se puede usar `npm outdated` para ver qué paquetes necesitan actualización.

### 2. Optimizar el Tamaño de los Chunks de Vite

El build de Vite muestra una advertencia sobre chunks de JavaScript que superan los 500 kB.
- `(!) Some chunks are larger than 500 kB after minification.`

**Acción:** Investigar las estrategias de "code splitting" que Vite ofrece. Esto se puede hacer con `import()` dinámicos en el código de React o configurando `build.rollupOptions.output.manualChunks` en el archivo `vite.config.ts` para dividir el código en trozos más pequeños, mejorando los tiempos de carga inicial de la página.

### 3. Actualizar `baseline-browser-mapping`

Vite también sugiere actualizar este paquete para asegurar datos precisos sobre la compatibilidad de navegadores.
- `[baseline-browser-mapping] The data in this module is over two months old. To ensure accurate Baseline data, please update: npm i baseline-browser-mapping@latest -D`

**Acción:** Ejecutar el comando `npm i baseline-browser-mapping@latest -D` en el workspace `react-editor`.

---

### 4. Migrar Endpoints de API Restantes a Serverless

Tras la refactorización a una arquitectura serverless, el núcleo del flujo de pago y autenticación ha sido migrado. Sin embargo, para restaurar la funcionalidad completa del panel de administración y otras áreas del proyecto, los siguientes endpoints del antiguo backend de Express deben ser recreados como funciones serverless individuales dentro de la carpeta `/api`.

**Archivos de Rutas a Migrar (de la antigua carpeta `backend/api/`):**
- `admin.js`
- `chat.js`
- `orders.js`
- `statistics.js`
- `uploads.js`
- `user.js`
- `riel.js` (parcialmente migrado, faltan los endpoints de activación y analíticas).

**Acción:** Para cada endpoint en los archivos mencionados, crear un archivo correspondiente en la carpeta `/api` (ej. `/api/admin/users.js`) y adaptar la lógica de Express al formato de una función serverless de Vercel (`export default function handler(req, res) { ... }`), similar a como se hizo con `/api/auth/register.js`.
