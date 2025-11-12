#!/usr/bin/env bash
set -euo pipefail
echo "🔍 Buscando y corrigiendo backticks en react-editor/src y backend..."

# Archivos objetivo
FILES=$(grep -RIl --include=\*.{ts,tsx,js,jsx} '\`' react-editor/src backend || true)

if [ -z "$FILES" ]; then
  echo "✅ No se encontraron backticks en las rutas objetivo."
  exit 0
fi

echo "$FILES" | while IFS= read -r f; do
  [ -z "$f" ] && continue
  echo "🪄 Procesando: $f"

  # 1) alert(`texto ${var}`)
  sed -i -E "s/alert\(\`([^\\`$]*)\$\{([^}]*)\}([^\\`]*)\`\)/alert('\1' + (\2) + '\3')/g" "$f" || true

  # 2) console.log(`texto ${var}`)
  sed -i -E "s/console\.log\(\`([^\\`$]*)\$\{([^}]*)\}([^\\`]*)\`\)/console.log('\1' + (\2) + '\3')/g" "$f" || true

  # 3) template literals simples (sin ${}) -> "texto"
  # (evita cambiar los que contengan saltos de línea)
  awk 'BEGIN{RS=""; ORS="";} {print}' "$f" | \
    sed -E ':a;N;$!ba;s/`([^$`\n]+)`/"\1"/g' > "$f.tmp" || true
  # si tmp no se generó (por seguridad), no sobreescribir
  if [ -f "$f.tmp" ]; then
    mv "$f.tmp" "$f"
  fi
done

echo "✨ Limpieza completada. Revisa los cambios con git diff o en tus backups."
