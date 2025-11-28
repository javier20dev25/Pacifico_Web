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

**Frontend (Moderno):**
-   React 19
-   TypeScript
-   Vite
-   Tailwind CSS
-   React Router DOM (para navegación)
-   Zustand (para manejo de estado)

**Backend:**
-   Node.js
-   Express.js
-   Supabase (Base de datos, Autenticación)
-   JWT para autenticación
-   Helmet, Express-Rate-Limit (Seguridad)

**Calidad de Código:**
-   ESLint
-   Prettier

## Instalación

Sigue estos pasos para configurar el proyecto localmente:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/javier20dev25/Pacífico_Web.git
    cd Pacífico_Web/pacificoweb
    ```

2.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz con las claves de Supabase y JWT. Consulta `.env.example`.

3.  **Instalar dependencias del Backend:**
    ```bash
    npm install
    ```

4.  **Instalar dependencias del Frontend:**
    ```bash
    cd react-editor
    npm install
    cd .. 
    ```

## Flujo de Desarrollo

Para trabajar en el proyecto, necesitas dos terminales abiertas.

1.  **Terminal 1: Iniciar el Backend**
    En la raíz del proyecto (`/pacificoweb`), ejecuta:
    ```bash
    npm run dev
    ```
    El servidor del backend se iniciará en `http://localhost:3000`.

2.  **Terminal 2: Iniciar el Frontend**
    En el directorio del frontend (`/pacificoweb/react-editor`), ejecuta:
    ```bash
    npm run dev
    ```
    Vite te proporcionará una URL local (generalmente `http://localhost:5173`). **Debes usar esta URL para acceder a la aplicación.**

## Estructura del Proyecto

La arquitectura del proyecto está dividida en un backend de Node.js y un frontend moderno de React.

```
.
├── backend/         # Lógica del servidor (API, middleware, servicios)
├── react-editor/    # Aplicación Frontend en React (Vite, TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/     # Componentes de página (Login, Dashboard, etc.)
│   │   └── App.tsx    # Router principal de la aplicación
├── public/          # Archivos estáticos legacy (en proceso de migración)
├── server.js        # Archivo principal del servidor Express
├── package.json     # Dependencias y scripts del Backend
└── README.md
```

## Scripts Disponibles

### Backend (en la raíz)
-   `npm start`: Inicia el servidor para producción.
-   `npm run dev`: Inicia el servidor en modo desarrollo con recarga automática.
-   `npm run format`: Formatea todo el código del backend con Prettier.
-   `npm run lint`: Analiza el código del backend con ESLint.

### Frontend (`/react-editor`)
-   `npm run dev`: Inicia el servidor de desarrollo de Vite.
-   `npm run build`: Compila la aplicación de React para producción.
-   `npm run lint`: Analiza el código del frontend con ESLint.
-   `npm run preview`: Sirve la carpeta `dist` de producción localmente.

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
