#!/usr/bin/env bash
set -euo pipefail

# Ajusta estas rutas si tu proyecto está en otra carpeta
ROOT_PROJECT_DIR="../react-editor"   # ruta al proyecto original
REPRO_DIR="."                        # ejecuta desde dentro de zustand-repro

echo "1) Leyendo devDependencies del proyecto original..."
cd "$ROOT_PROJECT_DIR"
if [ ! -f package.json ]; then
  echo "No encuentro package.json en $ROOT_PROJECT_DIR"
  exit 1
fi

# Saca sólo las keys de devDependencies
mapfile -t DEVDEPS < <(node -e "const p=require('./package.json'); console.log(Object.keys(p.devDependencies || {}).join('\n'))")

cd "$REPRO_DIR"
echo "Limpiando state previo..."
rm -rf node_modules package-lock.json

# instala dependencias base (ya están instaladas si seguiste los pasos)
npm ci

# Crear un directorio de logs local y seguro
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
NPM_LOG="$LOG_DIR/npm_install.log"
TSC_LOG="$LOG_DIR/tsc.log"

echo "Comenzando prueba de devDependencies (uno por uno). Esto puede tardar."
for dep in "${DEVDEPS[@]}"; do
  echo
  echo "----------------------------------------------"
  echo "Probando: $dep"
  echo "Instalando $dep as devDependency..."
  npm i --no-audit --no-fund -D "$dep" >"$NPM_LOG" 2>&1 || true

  echo "Ejecutando build (tsc)..."
  npm run build >"$TSC_LOG" 2>&1
  BUILD_EXIT_CODE=$?

  if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "OK: $dep NO rompe el build."
    # desinstalar para probar el siguiente
    npm uninstall -D "$dep" >/dev/null 2>&1 || true
  else
    echo "FAILED: $dep rompió el build. Recolectando logs..."
    echo "---- Contenido de $TSC_LOG ----"
    cat "$TSC_LOG"
    echo "---- Contenido de $NPM_LOG ----"
    cat "$NPM_LOG"
    echo
    echo "El paquete problemático parece ser: $dep"
    echo "Los logs se conservaron en el directorio $LOG_DIR"
    echo "No desinstalo $dep para que puedas inspeccionar node_modules si quieres."
    exit 0
  fi
done

echo
echo "Ningún devDependency individual rompió el build por sí solo."
echo "Siguiente paso: probar combinaciones o usar búsqueda binaria (script binario)."
exit 0
