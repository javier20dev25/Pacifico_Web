#!/usr/bin/env bash
set -euo pipefail

ROOT_PROJECT_DIR="../react-editor"
REPRO_DIR="."

cd "$ROOT_PROJECT_DIR"
mapfile -t ALL_DEPS < <(node -e "const p=require('./package.json'); console.log(Object.keys(p.devDependencies || {}).join('\n'))")
cd "$REPRO_DIR"

function test_subset() {
  local subset=($@)
  echo "Instalando subset: ${subset[*]:0:6}... (total ${#subset[@]})"
  rm -rf node_modules package-lock.json
  npm ci >/dev/null 2>&1 || true

  # Crear un directorio de logs local y seguro
  LOG_DIR="logs"
  mkdir -p "$LOG_DIR"
  NPM_LOG="$LOG_DIR/npm_install.log"
  TSC_LOG="$LOG_DIR/tsc.log"

  if [ ${#subset[@]} -gt 0 ]; then
    npm i -D "${subset[@]}" >"$NPM_LOG" 2>&1 || true
  fi

  if npx tsc --project tsconfig.json --noEmit >"$TSC_LOG" 2>&1; then
    return 0
  else
    echo "--- BUILD FAILED with subset: ${subset[*]} ---"
    echo "--- TSC Log ---"
    cat "$TSC_LOG"
    echo "--- NPM Log ---"
    cat "$NPM_LOG"
    return 1
  fi
}

# recursive bisect
function bisect_list() {
  local -n arr=$1
  local n=${#arr[@]}
  if [ $n -eq 0 ]; then
    return 1
  fi
  echo "Bisecting list of length $n"
  if test_subset "${arr[@]}"; then
    echo "Subset of ${n} dependencies OK -> no culprit within this subset"
    return 0
  fi

  if [ $n -eq 1 ]; then
    echo "FOUND culprit: ${arr[0]}"
    return 0
  fi

  local mid=$((n/2))
  local left=( "${arr[@]:0:mid}" )
  local right=( "${arr[@]:mid}" )

  echo "Testing LEFT half (size ${#left[@]})..."
  bisect_list left || true
  echo "Testing RIGHT half (size ${#right[@]})..."
  bisect_list right || true
}

# run
bisect_list ALL_DEPS
echo "Done bisecting."
