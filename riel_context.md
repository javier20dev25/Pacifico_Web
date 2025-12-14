# Proyecto "Riel" - Resumen de Tareas Pendientes

Este documento resume las tareas restantes para completar la funcionalidad "Riel" del proyecto.

---

## 🗺️ Descripción General del Flujo "Riel"

La funcionalidad "Riel" es una versión simplificada y gratuita del proyecto principal, diseñada como un "gancho" para nuevos usuarios. El flujo involucra tanto al usuario final como al administrador.

### 👥 Flujo del Usuario:

1.  **Descubrimiento y Pre-registro:**
    *   El usuario llega a una nueva **Página de Bienvenida** (que será la página principal de la aplicación).
    *   En esta página, ve un botón "Probar Riel Gratis".
    *   Al hacer clic, se abre un **Modal de Pre-registro** donde el usuario introduce su número de WhatsApp.
    *   Tras registrarse, el sistema guarda una "marca" (cookie/token) en su navegador y redirige al usuario a WhatsApp para enviar un mensaje pre-escrito al administrador.
2.  **Activación y Confirmación:**
    *   El usuario recibe del administrador un **Enlace de Activación** único.
    *   Al abrir el enlace, el sistema verifica la "marca" en su navegador y le presenta una **Página de Confirmación de Teléfono** donde puede verificar o cambiar su número de WhatsApp.
    *   Una vez confirmado, el usuario es redirigido a un **Editor Simplificado "Riel"**.
3.  **Gestión de la Tienda "Riel":**
    *   En el editor, el usuario puede asignar un nombre a su tienda y añadir hasta 15 productos (con imagen, nombre, precio y moneda).
    *   Puede "Lanzar" su tienda, que la hace pública.
    *   Puede "Ver" y "Compartir" la URL de su tienda pública.
    *   Tiene la opción de "Cerrar Sesión".
4.  **Uso de la Tienda Pública:** La tienda se ve como las demás, con su logo, nombre y productos.
5.  **Ciclo de Vida:** La cuenta "Riel" dura 1 mes. Después de esto, la tienda deja de ser visible.

### 🧑‍💻 Flujo del Administrador:

1.  **Recepción de Solicitud:** El administrador recibe el mensaje de WhatsApp del usuario con la solicitud de cuenta Riel.
2.  **Gestión en el Panel Admin:**
    *   El administrador entra a una **nueva sección en el Panel de Administrador** dedicada a "Riel".
    *   Verá una lista de solicitudes de pre-registro pendientes (números de WhatsApp).
    *   Para cada solicitud, tendrá un botón "Crear Cuenta y Generar Enlace".
    *   Al hacer clic, el sistema crea la cuenta Riel, un usuario temporal, asigna el plan Riel y genera un **Enlace de Activación** único.
    *   El administrador copia este enlace y se lo envía al usuario por WhatsApp.
3.  **Control Adicional:** Desde el panel de administrador, se puede eliminar, suspender u ocultar las tiendas Riel, independientemente de su estado.

---

Este proceso de Riel es la antesala a los planes profesionales, diseñado para facilitar la entrada de nuevos comerciantes a la plataforma.

---

## 🚀 Fase 1: Implementación del Frontend para el Usuario "Riel"

### 1.1 Completar la Página de Activación (`react-editor/src/pages/RielActivation.tsx`)

-   **Funcionalidad:** Implementar la lógica para consumir los endpoints de backend `GET /api/riel/verify-token` y `POST /api/riel/complete-activation`.
-   **Interfaz:**
    -   Obtener el `token` de activación de la URL.
    -   Mostrar estados de carga/error/éxito.
    -   Al validar el token, mostrar la UI para confirmar/actualizar el número de WhatsApp.
    -   Al confirmar, llamar a `complete-activation` y redirigir al `/riel/editor`.

### 1.2 Desarrollar el Editor Simplificado "Riel" (`react-editor/src/pages/RielEditor.tsx`)

Este es el componente principal para la gestión de la tienda Riel.

-   **Componentes de UI:**
    -   Campo para el `nombre` de la tienda (con capacidad de actualización).
    -   Campo para el `número de WhatsApp` de la tienda (con capacidad de actualización).
    -   **Gestión de Productos:**
        -   Botón "Añadir Producto" (respetando el límite de 15 productos).
        -   Cada producto añadido crea una tarjeta con:
            -   Subida de imagen (con previsualización).
            -   Campo para el nombre del producto.
            -   Campo para el precio del producto.
            -   Selector de moneda (USD/NIO).
        -   Funcionalidad para editar y eliminar productos existentes.
-   **Lógica de Guardado:**
    -   El botón "Lanzar Tienda" debe guardar todos los datos (nombre, WhatsApp, productos) en la base de datos, utilizando el endpoint `PUT /api/user/store-data` (ya blindado con el límite de productos).
    -   Mostrar un mini-modal de éxito al lanzar la tienda.
-   **Botones de Pie de Página:**
    -   "Ver Tienda": Habilitado tras lanzar la tienda, abre la URL pública de la tienda.
    -   "Compartir Tienda": Habilitado tras lanzar la tienda, usa la Web Share API nativa o un fallback (ej. copiar al portapapeles).
-   **Cerrar Sesión:** Un botón o enlace para que el usuario pueda cerrar su sesión Riel.

---

## 📦 Fase 2: Lógica de Negocio Adicional para "Riel"

### 2.1 Implementación del Tiempo de Vida (1 Mes)

-   **Backend:** Desarrollar la lógica para verificar el tiempo de vida de la cuenta Riel (1 mes desde la activación).
-   **Manejo de Vencimiento:** Implementar acciones cuando la cuenta expire (ej. suspender la tienda, marcar como inactiva) al intentar acceder a ella o mediante un proceso de fondo.

### 2.2 Inicio de Sesión por Número de Teléfono

-   **Frontend:** Crear una interfaz de inicio de sesión alternativa para usuarios Riel que utilizan su número de WhatsApp y el identificador guardado en cookie/local storage (para auto-login o para verificar la identidad).
-   **Backend:** Implementar un endpoint que valide este tipo de inicio de sesión y devuelva un token de sesión.

---

## 🛠️ Fase 3: Refinamientos y Pruebas

-   **Estilo y Diseño:** Ajustar el diseño de las nuevas interfaces para que sean funcionales.
-   **Manejo de Errores:** Asegurar que todos los flujos manejen los errores de forma elegante y amigable para el usuario.
-   **Pruebas de Integración:** Realizar pruebas exhaustivas de todo el flujo de Riel, desde el pre-registro hasta la gestión de la tienda y su caducidad.

---

¡Espero que este resumen detallado sea útil para retomar el proyecto!
