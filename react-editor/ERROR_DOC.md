# Documentación de Errores y Correcciones en `pacificoweb/react-editor`

**Fecha:** 12 de noviembre de 2025

---

### **Resumen General de la Tarea de Tipado**

El objetivo principal de esta tarea ha sido resolver la gran cantidad de errores de TypeScript presentes en el proyecto `pacificoweb/react-editor`. Estos errores surgían fundamentalmente de la falta de tipado explícito en componentes, estados, props, parámetros de funciones y el manejo de excepciones. La ausencia de estos tipos provocaba mensajes de error como `implicitly has an 'any' type`, `is of type 'unknown'`, `Property 'X' does not exist on type 'never'`, y problemas de asignación de tipos incompatibles, que hacían que la compilación del proyecto fallara.

La estrategia de corrección adoptada ha sido la siguiente:

1.  **Configuración Inicial:** Se verificó y ajustó el `tsconfig.json` del proyecto (`react-editor`) para asegurar una configuración adecuada para React y TypeScript, incluyendo la activación de `jsx: "react-jsx"` y la configuración de `paths` para los alias (`@/*`). También se confirmó la existencia y configuración correcta de `vite.config.ts` para el manejo de alias.
2.  **Instalación de Tipos:** Se instalaron las dependencias de `@types/react`, `@types/react-dom` y `typescript` en el proyecto del editor.
3.  **Corrección Incremental y Sistemática:** Se abordaron los errores archivo por archivo, siguiendo el orden en que `npx tsc` los reportaba. Después de cada conjunto de cambios en un archivo, se re-ejecutaba `npx tsc -p tsconfig.json` para obtener una lista actualizada de errores y enfocar los esfuerzos en los problemas restantes.
4.  **Tipado Explícito:** Se introdujeron interfaces y tipos a medida para cada componente, prop, estado (`useState`) y parámetro de función, eliminando la mayoría de los errores de `any` implícito.
5.  **Manejo Seguro de `unknown`:** Los errores capturados en bloques `catch` se tiparon explícitamente como `unknown` y se realizaron comprobaciones de tipo (`instanceof Error`, `instanceof AxiosError`) para acceder a sus propiedades de forma segura.
6.  **Resolución de Inconsistencias:** Se ajustaron los tipos de retorno de funciones asíncronas para que coincidieran con las expectativas de las props o llamadas (permitiendo `Promise<void>` cuando correspondía) y se corrigieron atributos HTML que esperaban números pero recibían cadenas (`colSpan`).

---

### **Errores Corregidos (Detalle por Archivo)**

| Archivo Fuente | Tipo de Error Principal | Descripción del Problema Original | Corrección Aplicada |
| :------------- | :---------------------- | :-------------------------------- | :------------------ |
| `src/components/ProductModal.tsx` | `TS2339` | Acceso inseguro a `e.target.checked` sin verificar el tipo de elemento `e.target`. | Se añadió una lógica para verificar si el campo es un checkbox y se realizó un type assertion `(e.target as HTMLInputElement).checked` para acceder a la propiedad `checked` de forma segura. |
| `src/components/admin/ActionButtons.tsx` | `TS7031`, `TS7006` | Props (`user`, `onAction`) y parámetros de función (`action`) con tipo `any` implícito. | Se definieron las interfaces `User`, `Action` (unión de literales de cadena) y `ActionButtonsProps`. El componente se tipó con `React.FC<ActionButtonsProps>`. La prop `onAction` se ajustó para manejar funciones asíncronas (`(action, user) => void | Promise<void>`). |
| `src/components/admin/AdminStats.tsx` | `TS7031` | Prop `stats` con tipo `any` implícito. | Se definió la interfaz `AdminStatsProps` detallando la estructura de `stats` (con `temp` y `active` de tipo `number`). El componente se tipó con `React.FC<AdminStatsProps>`. |
| `src/components/admin/CreateUserForm.tsx` | Múltiples `TS7031`, `TS7006`, `TS18046`, `TS2339` | Props (`onUserCreated`), estados (`plans`, `result`), parámetros de eventos (`e`) y errores en `catch` sin tipar. El estado `result` era `null` pero se usaba como objeto. | Se definieron interfaces `Plan` y `ResultData`. Los estados `plans` y `result` se tiparon como `useState<Plan[]>()` y `useState<ResultData | null>()` respectivamente. Los eventos y errores `catch` se tiparon de forma segura utilizando `React.FormEvent` y `instanceof AxiosError`. |
| `src/components/admin/RegistrationChart.tsx` | `TS7006`, `TS2353` | El estado `chartData` se inicializaba como `null` pero se actualizaba con un objeto complejo. Los parámetros en funciones `map` (`s`) tenían tipo `any` implícito. | Se definieron interfaces `Stat` y `ChartData`. El estado `chartData` se tipó como `useState<ChartData | null>()`. Los parámetros de las funciones `map` se tiparon explícitamente como `Stat`. |
| `src/components/admin/UsersTable.tsx` | Múltiples `TS7031`, `TS7006`, `TS18046`, `TS2322`, `TS7053` | Props y parámetros de funciones sin tipar, errores `unknown`, `colSpan` como cadena (`string`) en lugar de número, y acceso inseguro a propiedades de objetos. | Se definieron y **exportaron** (`export`) interfaces `User`, `Credentials` y `Action` (unión de literales). Los componentes `CredentialsModal` y `UsersTable` se tiparon con `React.FC`. Todos los estados y parámetros de funciones internos se tiparon explícitamente. `colSpan` se corrigió a `{number}`. Los errores `catch` se manejaron con `instanceof AxiosError`. |
| `src/components/dashboard/AiChat.tsx` | Múltiples `TS2339`, `TS2345`, `TS18046`, `TS7006` | El estado `messages` se inicializaba como `[]` (inferido como `never[]`). Parámetros de eventos (`e`) y errores en `catch` sin tipar. | Se definió la interfaz `ChatMessage`. El estado `messages` se tipó como `useState<ChatMessage[]>()`. `chatEndRef` se tipó como `React.RefObject<HTMLDivElement>`. `handleKeyPress` y `handleSendMessage` se tiparon de forma segura. Los errores `catch` se manejaron con `instanceof AxiosError`. |
| `src/components/dashboard/OrderProcessor.tsx`| Múltiples `TS7006`, `TS2339`, `TS2345`, `TS2698`, `TS18046` | Props, estados (`processedOrder`), parámetros de funciones y errores en `catch` sin tipar. `processedOrder` era `null` pero se usaba como objeto complejo. `colSpan` como cadena. | Se definieron interfaces `OrderProduct` y `ProcessedOrder`. El estado `processedOrder` se tipó como `useState<ProcessedOrder | null>()`. Todas las funciones de lógica (`parseOrderText`) y manejadores de eventos se tiparon completamente. Los errores `catch` se manejaron con `instanceof Error`. `colSpan` se corrigió a `{number}`. |
| `src/components/dashboard/StoreManager.tsx` | `TS7031`, `TS7006` | Props (`stores`) y parámetro de función (`url`) sin tipar. | Se definieron las interfaces `Store` y `StoreManagerProps`. El componente se tipó con `React.FC<StoreManagerProps>`. El parámetro `url` para `handleShare` se tipó como `string`. |
| `src/components/dashboard/UserInfo.tsx` | `TS7031` | Prop `user` con tipo `any` implícito. | Se definieron las interfaces `User` (con `nombre`, `plan`, `status`) y `UserInfoProps`. El componente se tipó con `React.FC<UserInfoProps>`. |
| `src/components/dashboard/UserStats.tsx` | `TS7006`, `TS7031` | Parámetros de función (`url`) y props (`title`, `value`) sin tipar. | Se definieron interfaces `StatCardProps` y `UserStatsData`. `StatCard` se tipó con `React.FC<StatCardProps>`. El parámetro `url` de `apiClient.get` se tipó como `string`. El error `catch` se tipó como `unknown`. |
| `src/main.tsx` | `TS5097` | Una importación usaba una extensión de archivo (`.tsx`) que no es necesaria o no es compatible con la configuración del bundler/TypeScript. | Se eliminó la extensión `.tsx` de la importación (ej. `import App from './App';`). |
| `src/pages/AdminDashboard.tsx` | `TS7006`, `TS2345` | Parámetro `user` en un `forEach` sin tipar. El estado `error` se inicializaba como `null` pero se le asignaba una cadena. | Se importó el tipo `User` desde `UsersTable`. El estado `users` se tipó como `useState<User[]>()`. El parámetro `user` en `forEach` se tipó como `User`. El estado `error` se tipó como `useState<string | null>()`. |
| `src/pages/Editor.tsx` | `TS2503` | Uso de `JSX.Element` explícito como tipo de retorno de un componente de función de React. | Se eliminó la anotación de tipo `JSX.Element` y se confió en la inferencia de tipos de TypeScript para el componente de función. |
| `src/pages/Home.tsx` | `TS2503` | Uso de `JSX.Element` explícito como tipo de retorno de un componente de función de React. | Se eliminó la anotación de tipo `JSX.Element` y se confió en la inferencia de tipos de TypeScript para el componente de función. |
| `src/pages/Login.tsx` | `TS7031`, `TS7006`, `TS18046` | Props (`visible` en `EyeIcon`), parámetros de eventos (`e` en `onChange`, `onSubmit`) y errores (`err`) en `catch` sin tipar. El estado `tempToken` y `strength` también estaban sin tipar. | Se definieron interfaces `EyeIconProps`, `LoginResponseData`, `CompleteRegistrationResponseData`. El componente `EyeIcon` se tipó con `React.FC<EyeIconProps>`. Los eventos `onChange` se tiparon con `React.ChangeEvent<HTMLInputElement>` y `onSubmit` con `React.FormEvent`. Los errores `catch` se manejaron con `instanceof AxiosError`. Los estados `tempToken` y `strength` se tiparon como `useState<string | null>()` y `useState<string>()` respectivamente. |
| `src/pages/StoreEditor.test.tsx` | `TS7006` | Parámetro `selector` en el mock de `useStore` sin tipar. | Se tipó el parámetro `selector` y el valor de retorno de la función mockeada como `any` para un manejo pragmático dentro del contexto de las pruebas. |

---

### **Errores Pendientes (Estado Actual)**

A partir de la última ejecución de `tsc`, los errores restantes se concentran en los siguientes archivos. **Estos son los puntos que aún requieren atención:**

1.  **`src/pages/StoreEditor.tsx`**:
    *   `TS2339: Property 'logoFile' does not exist on type 'AppState'.`
    *   **Problema:** La propiedad `logoFile` se está utilizando, pero `AppState` (o `StoreDetails` dentro de ella) no la define. Además, el tipo de `logoFile` (que es `File | null`) no es compatible con `logoUrl` (que es `string`).
    *   **Intento Fallido/Consideración:** Ya se corrigió el componente `ProductModal` para que la propiedad `imageFile` sea `File | null`, pero la `AppState` en el store principal no refleja esto para el `logoFile` de la tienda.
    *   **Acción Pendiente y Causa Raíz:** Se necesita modificar la interfaz `StoreDetails` dentro de `src/stores/store.ts` para incluir la propiedad `logoFile?: File | null;` y posiblemente ajustar `logoUrl?: string | null;` para permitir `null` si la URL puede estar ausente.

2.  **`src/pages/UserDashboard.tsx`**:
    *   `TS2345: Argument of type '"No se pudieron cargar los datos del dashboard. Intenta iniciar sesión de nuevo."' is not assignable to parameter of type 'SetStateAction<null>'`
    *   **Problema:** El estado `error` se inicializa como `null`, pero se le intenta asignar una cadena de texto.
    *   **Acción Pendiente:** Tipar el estado `error` como `useState<string | null>(null)` para permitir tanto `null` como `string`.

3.  **`src/stores/store.ts`**:
    *   `TS2345: Argument of type '(state: AppState) => { store: { logoFile: File | null; ... }; }' is not assignable to parameter of type 'AppState | Partial<AppState> | ((state: AppState) => AppState | Partial<AppState>)'.`
    *   `TS2322: Type 'null' is not assignable to type 'string | undefined'.`
    *   **Problema:** Este es el **error central** que afecta a `logoFile`. El `set((state) => ({ store: { ...state.store, logoFile: file } }))` en la acción `setLogoFile`, y posiblemente en `loadInitialData`, está intentando asignar un `File | null` a una propiedad que no está tipada correctamente en `StoreDetails` o `AppState`. Esto también se extiende a `logoUrl` si se intenta asignar `null` a una propiedad `string`.
    *   **Intento Fallido/Consideración:** Las interfaces `StoreDetails` y `Product` ya permiten `logoUrl?: string` y `imageFile?: File | null`. El problema radica en que `AppState` define `store: StoreDetails`, pero las mutaciones del store no están siendo validadas correctamente contra la interfaz `StoreDetails` en todos los lugares.
    *   **Acción Pendiente y Causa Raíz:** **La clave es modificar las interfaces `StoreDetails` y `Product` para ser completamente compatibles** con `File | null` para `logoFile` y `imageFile`, y con `string | null` para `logoUrl` y `imageUrl`, además de ajustar cómo `setLogoFile` y `loadInitialData` actualizan el estado para que coincidan con estos tipos.

---

### **Estado Próximo**

Los errores restantes están interconectados y giran principalmente alrededor de la definición de tipos en `src/stores/store.ts` y cómo esos tipos se utilizan en `StoreEditor.tsx` y `UserDashboard.tsx`. Una vez que las interfaces de `store.ts` estén completamente robustas y reflejen los posibles valores de `File | null` y `string | null`, los errores restantes deberían resolverse o ser muy fáciles de corregir.

Estoy listo para continuar con la corrección cuando regreses. Por ahora, aquí tienes esta documentación.

---

### **Errores Recientes y Soluciones (12 de Noviembre de 2025)**

1.  **Fallo de Compilación del Frontend (`react-editor`)**
    *   **Problema:** Al ejecutar `npm run build` en `react-editor`, se produjo el error `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react'`.
    *   **Causa Raíz:** La dependencia `@vitejs/plugin-react` no estaba listada en las `devDependencies` del archivo `package.json` del proyecto `react-editor`.
    *   **Solución:** Se añadió `"@vitejs/plugin-react": "^5.1.1"` a la sección `devDependencies` en `react-editor/package.json` y se ejecutó `npm install` para instalar la dependencia.

2.  **Error de Linting: `isLoadingCredentials` no utilizado**
    *   **Problema:** La variable `isLoadingCredentials` en `src/components/admin/UsersTable.tsx` se definía pero nunca se usaba.
    *   **Solución:** Se pasó `isLoadingCredentials` como prop al componente `ActionButtons` y se utilizó para deshabilitar el botón "Credenciales" mientras se cargaban las credenciales.

3.  **Error de Linting: `isLaunched` no utilizado**
    *   **Problema:** La variable `isLaunched` en `src/components/dashboard/StoreManager.tsx` se definía pero nunca se usaba.
    *   **Solución:** Se eliminó la declaración de la variable `isLaunched` ya que no era utilizada.

4.  **Error de Linting: `no-explicit-any` en `src/pages/StoreEditor.test.tsx` (inicial)**
    *   **Problema:** Uso de `any` en la función `mockUseStore` y su selector en el mock de Zustand.
    *   **Solución:** Se refactorizó el mock de Zustand para usar la interfaz `AppState` y se definió una interfaz `MockUseStore` para tipar correctamente la función `mockUseStore` y su método `getState`, eliminando el uso de `any`.

5.  **Error de Linting: `viewerHtml` no utilizado**
    *   **Problema:** La importación de `viewerHtml` en `src/pages/StoreEditor.tsx` se definía pero nunca se usaba.
    *   **Solución:** Se eliminó la importación de `viewerHtml`.

6.  **Errores de Linting: `no-explicit-any` y `no-unused-vars` en `src/stores/store.ts`**
    *   **Problema:** Uso de `any` en `sanitizeProductForRuntime` y en el `map` de `onRehydrateStorage`, y el parámetro `state` (luego `_state`) no utilizado en `onRehydrateStorage`.
    *   **Solución:** Se cambió `any` a `Product` en `sanitizeProductForRuntime` y en el `map` de `onRehydrateStorage`. Se eliminó el parámetro `state` (o `_state`) de la función `onRehydrateStorage` ya que no era utilizado.

7.  **Error de Test: `Cannot find package '@testing-library/react'`**
    *   **Problema:** El paquete `@testing-library/react` no se encontraba durante la ejecución de los tests.
    *   **Solución:** Se añadió `@testing-library/react` y `@testing-library/jest-dom` a las `devDependencies` en `react-editor/package.json` y se ejecutó `npm install`.

8.  **Error de Test: `ReferenceError: window is not defined`**
    *   **Problema:** El entorno de tests no tenía un objeto `window` disponible.
    *   **Solución:** Se configuró Vitest para usar el entorno `jsdom` en `react-editor/vite.config.ts`. (Nota: Hubo un error de sintaxis inicial al aplicar esto que fue corregido).

9.  **Error de Test: `[vitest] No "availablePaymentMethods" export is defined`**
    *   **Problema:** El mock de `@/stores/store` en `src/pages/StoreEditor.test.tsx` no exportaba `availablePaymentMethods`.
    *   **Solución:** Se importó `availablePaymentMethods` del módulo real y se incluyó en el objeto de retorno del mock de `vi.mock`.

10. **Error de Test: `vi.mock` con variables de nivel superior**
    *   **Problema:** Variables como `setStoreDetails`, `mockStoreData` y `completeMockState` estaban definidas fuera de la función factory de `vi.mock`, causando un error de inicialización.
    *   **Solución:** Se movieron estas variables dentro de la función factory de `vi.mock` en `src/pages/StoreEditor.test.tsx`.

11. **Error de Test: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name /editar/i`**
    *   **Problema:** El test intentaba hacer clic en un botón "editar" que no existía en el componente `StoreEditor`.
    *   **Solución:** Se eliminó la línea del test que intentaba hacer clic en el botón "editar".

12. **Error de Test: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name /^guardar$/i`**
    *   **Problema:** El test intentaba hacer clic en un botón con el nombre exacto "guardar", pero el botón real se llamaba "Guardar y Publicar Cambios".
    *   **Solución:** Se actualizó el test para buscar el botón con el nombre `/guardar y publicar cambios/i`.

---
### **Resolución de Errores de Test y Tipos (12 de Noviembre de 2025 - Tarde)**

En esta sesión, se abordó una serie de errores persistentes que impedían la compilación y la ejecución de pruebas en el frontend.

1.  **Diagnóstico del Problema Principal: Errores de Tipo y Timeouts**
    *   **Síntoma:** Al ejecutar `npx tsc`, se producía una cascada masiva de errores (`Cannot find name 'React'`, `JSX element implicitly has type 'any'`). Al ejecutar `npm test`, `vitest` fallaba con un error de `Timeout starting forks runner`.
    *   **Investigación:**
        1.  Se modificó `tsconfig.json` para eliminar el array `"types"`, sospechando que restringía la detección de tipos. No funcionó.
        2.  Se reinstalaron las dependencias (`rm -rf node_modules && npm install`) para descartar una instalación corrupta. No funcionó.
        3.  Se intentó forzar la carga de tipos con `"typeRoots"` y un array `"types"` explícito en `tsconfig.json`. Esto cambió el error a `Cannot find type definition file for 'react'`, confirmando que el problema era ambiental y no de configuración.
    *   **Conclusión:** Se determinó que el problema de `tsc` era específico del entorno de ejecución y no un error en el código del proyecto. Se decidió ignorar la cascada de errores de `tsc` y centrarse en los errores de código específicos y en hacer funcionar las pruebas.

2.  **Corrección de Errores de Código Específicos**
    *   **`store.ts`:** Se corrigió un error `Type 'null' is not assignable to 'string | undefined'` modificando la interfaz `StoreDetails` para que `shareableUrl` aceptara `null`.
    *   **`store.test.ts`:** Se solucionó el error `Property 'imageUrl' is missing` añadiendo `imageUrl: null` a todos los objetos `Product` de prueba, alineándolos con la nueva interfaz.
    *   **`supabase.ts`:** Se resolvió el error `Property 'env' does not exist on type 'ImportMeta'` añadiendo la directiva `/// <reference types="vite/client" />` al principio del archivo.

3.  **Diagnóstico y Corrección de la Prueba Unitaria Fallida (`StoreEditor.test.tsx`)**
    *   **Síntoma:** Una vez que las pruebas comenzaron a ejecutarse, una fallaba con `expected "vi.fn()" to be called 1 times, but got 0 times`.
    *   **Investigación:**
        1.  Se corrigió la lógica de la prueba para que hiciera clic en el botón correcto (`"Guardar y Publicar Cambios"`) en lugar de `"Ver Tienda"`.
        2.  La prueba seguía fallando. Un análisis más profundo del componente `StoreEditor.tsx` reveló que la función `handleSave` tenía una guarda que comprobaba la existencia de un `sessionToken` en `localStorage`.
    *   **Solución Definitiva:** Se añadió un mock de `localStorage` en el `beforeEach` del archivo de prueba para simular un token de sesión. Esto permitió que la función `handleSave` se ejecutara por completo, la llamada a la API se realizara y la prueba pasara.

4.  **Lecciones Aprendidas y Qué No Hacer**
    *   **No asumir que las pruebas son correctas:** La prueba de `StoreEditor` tenía una lógica fundamentalmente errónea sobre el comportamiento del componente. Siempre se debe verificar la implementación del componente cuando una prueba falla de forma inesperada.
    *   **Cuidado con las dependencias ocultas:** La función `handleSave` dependía de `localStorage`, pero esto no era obvio desde la firma de la función. Es crucial tener en cuenta el contexto completo (DOM, `localStorage`, etc.) al escribir pruebas unitarias para componentes.
    *   **Los problemas ambientales pueden ser una distracción:** Aunque los errores de `tsc` eran abrumadores, no eran la causa raíz de los fallos en la lógica de la aplicación. Fue más productivo centrarse en los errores de código específicos y en la lógica de las pruebas.

---
### **Actualización: Migración y Depuración de ESLint (12 de Noviembre de 2025 - Continuación)**

Tras la estabilización de las pruebas unitarias, se inició la migración de la configuración de ESLint al nuevo formato `eslint.config.mjs` y la corrección de los errores de linting restantes.

**1. Problema Inicial: Fallo de Linting en CI por Configuración Obsoleta**
*   **Síntoma:** El paso "Run Backend Lint" en GitHub Actions fallaba con el error `ESLint couldn't find an eslint.config.(js|mjs|cjs) file.`
*   **Causa Raíz:** La versión de ESLint en CI (v9+) espera por defecto el nuevo formato `eslint.config.js`, mientras el proyecto usaba `.eslintrc.json`.
*   **Solución Temporal (Hotfix):** Se añadió `ESLINT_USE_FLAT_CONFIG=false` al paso de linting del backend en `.github/workflows/ci.yml`. Esto permitió que ESLint usara la configuración antigua.

**2. Errores de Linting Revelados por el Hotfix**
Una vez que el hotfix permitió que el linter se ejecutara, se revelaron errores reales:
*   **Error Crítico:** `'e' is defined but never used` en `backend/lib/supabaseAdmin.js`.
*   **Advertencias:** Múltiples advertencias de `prettier/prettier` en varios archivos.

**3. Migración a `eslint.config.mjs` (Solución Definitiva)**
Para una solución robusta y a largo plazo, se decidió migrar al nuevo formato de configuración de ESLint:
*   **Backend:** Se creó `eslint.config.mjs` en la raíz del proyecto, adaptando la plantilla proporcionada por el usuario para JavaScript, Prettier y Jest.
*   **Frontend:** Se creó `react-editor/eslint.config.mjs`, adaptando la plantilla para React, TypeScript, React Hooks y Prettier.
*   **Limpieza:** Se eliminaron los archivos `.eslintrc.json` y `.eslintignore` de la raíz.

**4. Problemas Durante la Migración y su Depuración**

*   **Fallo al Ejecutar `npx eslint . --fix` (Error de Módulos):**
    *   **Síntoma:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'eslint-config-prettier'` y otros plugins.
    *   **Causa Raíz:** Los nuevos plugins y configuraciones (`eslint-config-prettier`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `typescript-eslint`) no estaban instalados como dependencias de desarrollo.
    *   **Solución:** Se instalaron las dependencias faltantes en el directorio raíz y en `react-editor` respectivamente.

*   **Fallo al Ejecutar `npx eslint . --fix` (Error de Parsing `sourceType: module`):**
    *   **Síntoma:** `Parsing error: 'import' and 'export' may appear only with 'sourceType: module'` en los archivos `eslint.config.js` (y otros config files).
    *   **Causa Raíz:** Node.js estaba intentando interpretar los archivos de configuración (que usan sintaxis ES Module) como CommonJS, ya que el `package.json` raíz no tiene `"type": "module"`.
    *   **Solución:** Se renombraron `eslint.config.js` a `eslint.config.mjs` (tanto en la raíz como en `react-editor`). La extensión `.mjs` fuerza a Node.js a tratarlos como módulos ES.

*   **Fallo al Ejecutar `npx eslint react-editor --fix` (Errores de `parserOptions.project`):**
    *   **Síntoma:** `ESLint was configured to run on <file> using parserOptions.project: <tsconfigRootDir>/tsconfig.json. However, that TSConfig does not include this file.` para archivos de configuración (`.mjs`, `.js`, `.ts`) y el directorio `dist/`.
    *   **Causa Raíz:** La configuración de ESLint del frontend estaba aplicando el "typed linting" (que usa `tsconfig.json`) a todos los archivos, incluyendo los que no son parte del proyecto TypeScript.
    *   **Solución:** Se reestructuró `react-editor/eslint.config.mjs` para:
        *   Definir `ignores` a nivel global.
        *   Aplicar el "typed linting" (`parserOptions.project`) **solo** a los archivos `src/**/*.{ts,tsx}`.
        *   Tener una configuración separada y más simple para archivos `.js` y `.mjs` que no usan el parser de TypeScript.

**5. Errores de Linting Actuales (Después de la Reestructuración)**

Después de todas las correcciones de configuración, el linter ahora reporta errores de código específicos:

*   **`backend/lib/supabaseAdmin.js`:**
    *   `'_e' is defined but never used` (`no-unused-vars`). Se corrigió renombrando `e` a `_e` en el `catch` block. **(RESUELTO)**

*   **`react-editor/src/components/LogisticsEditor.tsx`, `PaymentEditor.tsx`, `StoreInfoCard.tsx`:**
    *   `'React' is not defined` (`no-undef`). Se corrigió añadiendo `import React from 'react';` a cada archivo. **(RESUELTO)**

*   **`react-editor/src/components/ProductModal.tsx`:**
    *   `'_e' is defined but never used`, `'_field' is defined but never used`, `'_isCheckbox' is defined but never used` (`no-unused-vars`). Estos errores ocurren en las definiciones de tipo de `handleFormChange` en `ByOrderFormProps` y `InStockFormProps`.
    *   **Intentos:** Se intentó prefijar con `_` y luego eliminar los nombres de los parámetros, pero esto último causó errores de parsing.
    *   **Estado Actual:** Se revirtieron los cambios a la versión con `_` prefijado. El linter sigue marcándolos. Se considerará usar `eslint-disable-next-line` si no hay otra solución.

*   **`react-editor/src/components/admin/ActionButtons.tsx`:**
    *   `'_action' is defined but never used`, `'_user' is defined but never used` (`no-unused-vars`). Estos errores ocurren en la definición de tipo de `onAction` en `ActionButtonsProps`.
    *   **Intentos:** Se intentó prefijar con `_` y luego eliminar los nombres de los parámetros, pero esto último causó errores de parsing.
    *   **Estado Actual:** Se revirtieron los cambios a la versión con `_` prefijado. El linter sigue marcándolos. Se considerará usar `eslint-disable-next-line` si no hay otra solución.

*   **`react-editor/src/pages/StoreEditor.test.tsx`:**
    *   `'useStore' is defined but never used` (`no-unused-vars`).
    *   `'importOriginal' is defined but never used` (`no-unused-vars`).
    *   `'AppState' is not defined` (`no-undef`).
    *   `'selector' is defined but never used` (`no-unused-vars`).
    *   `'state' is defined but never used` (`no-unused-vars`).
    *   **Intentos:** Se modificó la importación de `useStore` y se intentó renombrar `selector` a `_selector`. Se eliminó la variable `setStoreDetailsMock`.
    *   **Estado Actual:** Se revirtieron algunos cambios. Los errores de `AppState` y `useStore` persisten debido a la complejidad del mock de Zustand y cómo se manejan las importaciones. Los errores de `selector` y `state` en el mock de `useStore` son particularmente problemáticos y parecen ser falsos positivos o una interacción compleja con el linter.

*   **`react-editor/src/stores/store.ts`:**
    *   Múltiples errores de `no-unused-vars` para parámetros en las definiciones de acciones del store (`store`, `file`, `details`, `products`, `product`, `productId`, `updates`, `cart`, `type`, `data`, `imageFile`).
    *   **Estado Actual:** Pendiente de prefijar con `_` o eliminar si es posible.

**Próximos Pasos (Pendiente):**

1.  **`ProductModal.tsx` y `ActionButtons.tsx`:** Aplicar `// eslint-disable-next-line @typescript-eslint/no-unused-vars` a las líneas problemáticas en las definiciones de tipo.
2.  **`StoreEditor.test.tsx`:**
    *   Re-añadir `import { AppState } from '@/stores/store';`.
    *   Renombrar `importOriginal` a `_importOriginal` en el mock de `vi.mock`.
    *   Aplicar `// eslint-disable-next-line` a los errores persistentes de `selector` y `state` en el mock de `useStore` si no se encuentra una solución más limpia.
    *   Revisar el error de `useStore` no utilizado.
3.  **`store.ts`:** Prefijar con `_` todos los parámetros no utilizados en las definiciones de acciones.

---
---
### **Depuración de Pruebas y "Blindaje" del Store (13 de Noviembre de 2025)**

Durante esta sesión, se abordó la estabilización final del proyecto `react-editor`, resolviendo tanto la causa raíz de la fragilidad de los componentes como los problemas técnicos que impedían la validación a través de pruebas.

**1. Reparación del Entorno de Pruebas (Vitest)**

*   **Problema:** Al ejecutar `npm test`, las pruebas fallaban inmediatamente con el error `Error: [vitest-pool]: Timeout starting forks runner.`.
*   **Diagnóstico:** Este error indicaba que `vitest` no podía crear sus procesos paralelos (`forks`) para ejecutar las pruebas. Se determinó que la causa era el entorno de ejecución con recursos limitados (Termux), que no manejaba bien la paralelización. Los intentos de solucionarlo con flags de línea de comando (`--threads=false`, `--single-thread`) fracasaron debido a incompatibilidades de versión.
*   **Solución:** La solución robusta fue modificar directamente la configuración de Vitest. En `react-editor/vite.config.ts`, se añadió la propiedad `threads: false` al objeto de configuración `test`.
    ```javascript
    // vite.config.ts
    test: {
      // ... otras opciones
      threads: false, // <-- AÑADIDO
    },
    ```
*   **Lección / Qué no hacer:** No depender de flags de CLI para configuraciones críticas del entorno, ya que pueden cambiar o no ser compatibles. Es preferible definir estas configuraciones en el archivo (`vite.config.ts`) para garantizar la consistencia.

**2. Reparación de Prueba Unitaria por Mock Incompleto**

*   **Problema:** Una vez que las pruebas se ejecutaron, la prueba `StoreEditor.test.tsx` falló con el error `Error: [vitest] No "availablePaymentMethods" export is defined on the "@/stores/store" mock.`
*   **Diagnóstico:** El archivo de prueba estaba suplantando (`mocking`) el módulo del store (`@/stores/store`). Sin embargo, el mock solo reemplazaba la exportación `default` (el hook `useStore`), eliminando inadvertidamente todas las demás exportaciones nombradas del módulo, como la constante `availablePaymentMethods` que el componente `PaymentEditor` necesitaba para renderizarse.
*   **Solución:** Se refactorizó el `vi.mock` para utilizar la capacidad de `importOriginal`, que permite acceder al módulo real. Se mantuvieron las exportaciones originales y solo se sobrescribió la exportación `default`.
    ```javascript
    // StoreEditor.test.tsx
    vi.mock('@/stores/store', async (importOriginal) => {
      const actual = await importOriginal(); // Obtiene las exportaciones reales
      // ... lógica del mock ...
      return {
        ...actual, // Re-exporta todo lo del módulo original
        __esModule: true,
        default: mockUseStore, // Sobrescribe solo el hook
      };
    });
    ```
*   **Lección / Qué no hacer:** Nunca asumir que un `vi.mock` preserva las exportaciones no mencionadas. Si un componente bajo prueba depende de múltiples exportaciones de un módulo mockeado, se debe usar el patrón `importOriginal` para asegurar que todas las dependencias estén disponibles.