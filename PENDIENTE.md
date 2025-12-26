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