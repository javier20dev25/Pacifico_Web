# Plan: Estabilizar Despliegue en Vercel y API de Registro

Este plan detalla los pasos para diagnosticar y solucionar los problemas de despliegue de la API en Vercel.

---

## Fase 1: Diagnóstico y Configuración Inicial [checkpoint: 28d1e77]

El objetivo de esta fase es identificar la causa raíz de los errores 404 en Vercel y establecer un endpoint de prueba funcional.

- [x] Tarea: Analizar en profundidad los logs de ejecución y de solicitud de Vercel para encontrar pistas sobre los errores 404 en las rutas /api/*. (537b385)
- [x] Tarea: Revisar exhaustivamente el archivo `vercel.json` para identificar y corregir posibles errores de configuración en las reescrituras (`rewrites`) o enrutamientos. (c871f37)
- [x] Tarea: Verificar que todas las variables de entorno necesarias (como `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.) estén correctamente definidas y accesibles en el entorno de producción de Vercel.
- [x] Tarea: Crear un nuevo endpoint de API de prueba mínimo (ej. `api/hello.js`) que simplemente devuelva un estado 200 con un mensaje JSON. Desplegar y usarlo como base para validar la configuración de enrutamiento.
- [x] Tarea: Conductor - Verificación Manual del Usuario 'Fase 1: Diagnóstico y Configuración Inicial' (Protocolo en workflow.md)

---

## Fase 2: Implementación de Arreglos

Con un diagnóstico claro, esta fase se centra en aplicar las correcciones necesarias al código y la configuración.

- [ ] Tarea: Escribir una prueba de integración que falle (TDD) para el endpoint de registro (`/api/auth/register`), simulando una solicitud de creación de usuario y esperando una respuesta 201.
- [ ] Tarea: Modificar la configuración del servidor Express y/o la estructura de archivos para que sea totalmente compatible con la arquitectura serverless de Vercel.
- [ ] Tarea: Ajustar el endpoint de registro existente (`api/auth/register.js`) para asegurar que maneja correctamente las solicitudes y respuestas en el entorno de Vercel y que la prueba de integración pase.
- [ ] Tarea: Conductor - Verificación Manual del Usuario 'Fase 2: Implementación de Arreglos' (Protocolo en workflow.md)

---

## Fase 3: Verificación End-to-End y Limpieza

El objetivo es validar que el flujo completo de registro funciona en producción y dejar el entorno limpio.

- [ ] Tarea: Escribir un script de prueba automatizado (usando Node.js/fetch o similar) que realice una solicitud POST real al endpoint de registro desplegado en producción en Vercel.
- [ ] Tarea: Ejecutar el script y verificar que (1) la API devuelve un código de estado 201 y (2) un nuevo usuario es creado correctamente en la tabla `auth.users` de Supabase.
- [ ] Tarea: Escribir y ejecutar un script para eliminar cualquier usuario de prueba creado durante el proceso de verificación de la base de datos de Supabase.
- [ ] Tarea: Conductor - Verificación Manual del Usuario 'Fase 3: Verificación End-to-End y Limpieza' (Protocolo en workflow.md)
