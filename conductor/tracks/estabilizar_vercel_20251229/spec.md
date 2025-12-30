# Spec: Estabilizar Despliegue en Vercel y API de Registro

## 1. Visión General

El objetivo de este track es diagnosticar y resolver los problemas de despliegue en Vercel que actualmente causan errores 404 en las rutas de la API, impidiendo el funcionamiento del registro de usuarios en el entorno de producción. El resultado final debe ser una API de registro de usuarios completamente funcional y estable en Vercel.

## 2. Requisitos Funcionales

- **RF-001:** La ruta de la API para el registro de usuarios (ej. `/api/auth/register`) debe ser accesible públicamente en el entorno de Vercel sin devolver un error 404.
- **RF-002:** Una solicitud `POST` a la ruta de registro con datos de usuario válidos (nombre, email, etc.) debe resultar en la creación de un nuevo usuario en la base de datos de Supabase.
- **RF-003:** La API debe devolver una respuesta JSON exitosa (ej. status 201) tras un registro exitoso.
- **RF-004:** La API debe devolver respuestas de error JSON apropiadas (ej. status 400, 409) para solicitudes inválidas (datos faltantes, email duplicado).

## 3. Criterios de Aceptación

- **CA-001:** Se puede ejecutar un script de prueba (o una solicitud cURL/Postman) contra la URL de producción de la API de registro y recibir una respuesta 201.
- **CA-002:** Después de una solicitud de registro exitosa, se puede verificar que el nuevo registro de usuario existe en la tabla `auth.users` de Supabase.
- **CA-003:** Los logs de Vercel para la función de registro no muestran errores de ejecución (solo logs de solicitud/respuesta).
- **CA-004:** La configuración de enrutamiento en `vercel.json` está correctamente definida para dirigir las solicitudes de `/api/**` a las funciones serverless correspondientes.
