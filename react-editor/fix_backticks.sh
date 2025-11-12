#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# 🧹 Limpieza automática de backticks problemáticos (Vite/Babel)
# Autor: Astaroth Script Edition
# ============================================================

echo "🔍 Buscando archivos con backticks..."

# Buscar todos los archivos .tsx, .ts, .js y .jsx
FILES=$(grep -RIl '`' ./react-editor/src | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$FILES" ]; then
  echo "✅ No se encontraron backticks en los archivos del frontend."
  exit 0
fi

echo "🧠 Archivos detectados:"
echo "$FILES"
echo "------------------------------------------------------------"
sleep 1

for f in $FILES; do
  echo "🪄 Limpiando: $f"

  # 1. Reemplazar los casos más comunes de alert(`texto ${var}`)
  sed -i -E \
    "s/alert\(\`([^$]+)\$\{([^}]+)\}([^`]*)\`\)/alert('\1' + (\2) + '\3')/g" "$f"

  # 2. Reemplazar console.log(`texto ${var}`)
  sed -i -E \
    "s/console\.log\(\`([^$]+)\$\{([^}]+)\}([^`]*)\`\)/console.log('\1' + (\2) + '\3')/g" "$f"

  # 3. Reemplazar cadenas sin interpolación (solo texto)
  sed -i -E \
    "s/`([^\\\`]+)`/"\1"/g" "$f"

done

echo "✨ Limpieza completada."
echo "👉 Ahora reinicia el servidor con: npm run dev"
