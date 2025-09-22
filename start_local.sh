#!/bin/bash

# Este script instala las dependencias y arranca el servidor de desarrollo.

echo "\nPASO 1: Asegurándose de que todas las dependencias estén instaladas..."
npm install

echo "\nPASO 2: Iniciando el servidor en modo de desarrollo..."
echo "----------------------------------------------------"
echo "Tu aplicación estará disponible en: http://localhost:3000"
echo "(Presiona Ctrl+C para detener el servidor)"
echo "----------------------------------------------------"

npm run dev
