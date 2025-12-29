# Estado Actual del Sistema

## Frontend
Vercel sirve una página de bienvenida antigua que permite solicitar una cuenta Riel manualmente. Esta página, aunque obsoleta, debe conservarse como una alternativa para pagos no digitales.

## Backend
El proyecto funciona en el entorno local, pero presenta errores 404 en producción (Vercel) al ejecutar acciones como el registro de usuarios. Esto sugiere problemas con la configuración de las funciones serverless, el enrutamiento (`vercel.json`) o la conexión con la base de datos. Parte de la migración de Express a Serverless aún no se ha completado.

# Problema Principal
La discrepancia entre el entorno local y producción impide el funcionamiento del flujo de registro. La incertidumbre sobre el enrutamiento de Vercel y la conexión a Supabase es el principal bloqueo.

# Cambio de Enfoque Estratégico
El proyecto transita de un modelo de operación manual a una startup SaaS con automatización completa.

# Nuevo Flujo Deseado (Objetivo Principal)

## 1. Nueva Página Principal (Landing Page)
Será la entrada principal al producto. Debe presentar el servicio y mostrar claramente los planes.

## 2. Planes Ofrecidos
- **Plan Riel (Gratuito):** Creación de cuenta 100% automática al completar el formulario.
- **Plan Emprendedor (De pago):** Flujo de pago automatizado.
- **Plan Oro Business (De pago):** Flujo de pago automatizado.

## 3. Flujo de Creación de Cuentas
Independientemente del plan, se solicitarán los siguientes datos para almacenar en Supabase:
- Nombre completo
- Fecha de nacimiento
- Correo electrónico
- Número de WhatsApp

### Flujo de Planes de Pago
1. El usuario selecciona un plan y completa el formulario.
2. Es redirigido a PayPal para realizar el pago.
3. Un webhook de PayPal notifica al servidor.
4. El servidor verifica el pago, crea la cuenta y activa el plan correspondiente de forma automática.

## 4. Inicio de Sesión Unificado
La nueva landing page debe tener un botón de "Iniciar Sesión" que funcione para todos los tipos de cuenta (nuevas, antiguas, gratuitas y de pago).

## 5. Analítica
Desde el inicio, se deben registrar eventos clave en Supabase para entender el uso y el público objetivo:
- Solicitudes y creaciones de cuenta.
- Pagos (exitosos y fallidos).
- Errores en el flujo.

# Consideraciones Técnicas
- **Sin Contenedores:** No se usará Docker. Todo el ciclo de desarrollo se realizará desde Android + Termux.
- **Robustez:** El sistema debe tener logs claros y fallar de manera explícita, evitando errores silenciosos para construir una base sólida y escalable.