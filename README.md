# Pacífico Web

![GitHub Workflow Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

Una plataforma web integral diseñada para la gestión de tiendas, procesamiento de pedidos y asistencia inteligente mediante IA. Pacífico Web ofrece un dashboard intuitivo para que los usuarios administren sus negocios en línea de manera eficiente.

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Variables de Entorno](#variables-de-entorno)
- [Despliegue](#despliegue)
- [Contribución](#contribución)
- [Licencia](#licencia)
- [Contacto](#contacto)

## Características

-   **Dashboard de Usuario:** Vista general y gestión de tiendas.
-   **Gestión de Tiendas:** Creación, edición y eliminación de tiendas con slugs amigables.
-   **Procesamiento de Pedidos:** Herramienta para procesar y guardar pedidos de WhatsApp.
-   **Asistente de IA:** Chat interactivo para soporte y automatización de tareas.
-   **Autenticación Segura:** Sistema de login y registro de usuarios.
-   **Integración con Supabase:** Para base de datos y autenticación.

## Tecnologías Utilizadas

**Frontend:**
-   HTML5, CSS3 (Tailwind CSS)
-   JavaScript (Vanilla JS)
-   SweetAlert2 para alertas y notificaciones.

**Backend:**
-   Node.js
-   Express.js
-   Supabase (Base de datos, Autenticación)
-   JWT para autenticación.

## Instalación

Sigue estos pasos para configurar el proyecto localmente:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/javier20dev25/Pacífico_Web.git
    cd Pacífico_Web/pacificoweb
    ```

2.  **Instalar dependencias del backend:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del directorio `pacificoweb` con las siguientes variables:
    ```
    SUPABASE_URL=tu_url_supabase
    SUPABASE_KEY=tu_clave_anon_supabase
    JWT_SECRET=una_clave_secreta_fuerte_para_jwt
    ```
    Puedes obtener `SUPABASE_URL` y `SUPABASE_KEY` desde tu proyecto Supabase. `JWT_SECRET` debe ser una cadena de texto larga y aleatoria.

4.  **Configurar Supabase (si es necesario):**
    Asegúrate de que tu base de datos Supabase esté configurada con las tablas necesarias para usuarios, tiendas y pedidos. Puedes usar el script `setup_supabase.js` como referencia o ejecutarlo si es necesario (asegúrate de entender lo que hace antes de ejecutarlo en producción).

5.  **Iniciar el servidor:**
    ```bash
    npm start
    ```
    El servidor se ejecutará en `http://localhost:3000` (o el puerto configurado).

## Uso

1.  **Acceder al Dashboard:** Abre tu navegador y ve a `http://localhost:3000/login.html` para iniciar sesión o registrarte.
2.  **Gestionar Tiendas:** Desde el dashboard, puedes crear nuevas tiendas, editarlas o eliminarlas. Cada tienda tendrá un enlace público basado en su "slug".
3.  **Procesar Pedidos:** Utiliza la sección de "Gestor de Pedidos" para pegar mensajes de WhatsApp y procesarlos automáticamente.
4.  **Asistente de IA:** Interactúa con el asistente de IA para obtener ayuda o automatizar tareas.

## Estructura del Proyecto

```
.
├── backend/
│   ├── api/             # Endpoints de la API (admin, auth, chat, user)
│   ├── middleware/      # Middleware de Express
│   └── services/        # Servicios (ej. email)
├── public/
│   ├── css/             # Archivos CSS
│   ├── js/              # Archivos JavaScript del frontend
│   ├── admin.html       # Página de administración
│   ├── dashboard.html   # Dashboard principal del usuario
│   ├── login.html       # Página de login
│   ├── styles.css       # Estilos globales
│   └── viewer_template.html # Plantilla para la vista pública de tiendas
├── templates/           # Plantillas HTML (si se usan con un motor de plantillas)
├── .env                 # Variables de entorno
├── package.json         # Dependencias y scripts del proyecto
├── server.js            # Archivo principal del servidor Express
├── check_table.js       # Script para verificar tablas (ej. Supabase)
├── setup_supabase.js    # Script para configurar Supabase
└── README.md            # Este archivo
```

## Scripts Disponibles

-   `npm start`: Inicia el servidor Express.
-   `npm run dev`: (Si existe un script de desarrollo, por ejemplo con nodemon)
-   `node setup_supabase.js`: Ejecuta el script de configuración de Supabase (usar con precaución).

## Variables de Entorno

Las variables de entorno se cargan desde el archivo `.env`. Asegúrate de configurarlas correctamente para el funcionamiento del proyecto.

-   `SUPABASE_URL`: URL de tu proyecto Supabase.
-   `SUPABASE_KEY`: Clave `anon` de tu proyecto Supabase.
-   `JWT_SECRET`: Clave secreta para firmar y verificar tokens JWT.

## Despliegue

Este proyecto puede ser desplegado en cualquier plataforma que soporte Node.js y Express.js (ej. Vercel, Heroku, DigitalOcean, AWS EC2). Asegúrate de configurar las variables de entorno en tu entorno de despliegue.

## Contribución

¡Las contribuciones son bienvenidas! Si deseas contribuir, por favor sigue estos pasos:

1.  Haz un "fork" del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios y asegúrate de que el código pase las pruebas.
4.  Haz commit de tus cambios (`git commit -m 'feat: Añadir nueva funcionalidad X'`).
5.  Sube tu rama (`git push origin feature/nueva-funcionalidad`).
6.  Abre un Pull Request detallando tus cambios.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Para cualquier pregunta o soporte, puedes contactar a [Tu Nombre/Email/GitHub Profile].