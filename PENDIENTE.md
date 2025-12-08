# PENDIENTES IMPORTANTES

Este documento lista los problemas y tareas que requieren atención inmediata o futura en el proyecto.

## 1. Regresión en el Frontend (Error en el Modal del Carrito)
- **Descripción:** Actualmente, hay una regresión crítica en el frontend que causa un error en la base de datos y/o impide que Eruda funcione correctamente cuando se intenta renderizar el modal del carrito. Esto se ha intentado mitigar con un renderizado forzado para depuración.
- **Acción Pendiente:** Revertir la modificación temporal de `renderCartSummary` en `react-editor/src/cart.summary.js` y encontrar la causa raíz del problema para una solución permanente que no introduzca nuevos errores.

## 2. Problema de 'storeType' en el Editor de React
- **Descripción:** El editor de React está enviando incorrectamente el valor `storeType: "by_order"`, lo que provoca que no se muestren las opciones de envío en el modal del carrito.
- **Acción Pendiente:** Investigar la lógica en el editor de React que define y envía `storeType` para corregir el valor a uno adecuado que permita la visualización de las opciones de envío.

## 3. Visibilidad del Contenido del Modal
- **Descripción:** Se han reportado problemas de visibilidad donde los elementos internos del modal no se muestran correctamente o están ocultos.
- **Acción Pendiente:** Investigar el CSS, la lógica de renderizado o las propiedades de los elementos dentro del modal para asegurar que todo el contenido sea visible y funcione como se espera.
