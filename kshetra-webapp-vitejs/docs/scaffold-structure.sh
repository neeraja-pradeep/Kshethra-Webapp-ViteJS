#!/usr/bin/env bash
#
# scaffold-structure.sh
# Creates the enterprise feature-first Clean Architecture folder structure
# (React + Vite, TanStack Query + Zustand).
#
# Usage:
#   Inside an existing React + Vite project:
#     ./scaffold-structure.sh                          # base structure only
#     ./scaffold-structure.sh auth orders              # + one folder set per feature
#
#   Create a brand-new project AND scaffold it (no prompts, no dev server):
#     ./scaffold-structure.sh --create my-app auth orders
#
# It also installs the standard stack libraries (TanStack Query, Zustand, Axios,
# Zod, React Router). Skip the install with:  SKIP_INSTALL=1 ./scaffold-structure.sh
#
# Safe to re-run: it only creates missing folders, never overwrites existing files.

set -euo pipefail

# --- create mode: scaffold a new Vite project first ---------------------------
if [ "${1:-}" = "--create" ]; then
  PROJECT_NAME="${2:-}"
  if [ -z "$PROJECT_NAME" ]; then
    echo "⚠️  --create needs a project name:  ./scaffold-structure.sh --create my-app [features...]"
    exit 1
  fi
  shift 2   # remaining args are feature names

  if [ -e "$PROJECT_NAME" ]; then
    echo "⚠️  '$PROJECT_NAME' already exists here — refusing to overwrite."
    exit 1
  fi

  echo "🚀 Creating Vite project: $PROJECT_NAME (react-ts, non-interactive)"
  npm create vite@latest "$PROJECT_NAME" -- --template react-ts --no-interactive

  cd "$PROJECT_NAME"
  echo "📦 Installing base dependencies..."
  npm install
fi

# --- locate the project root (where package.json lives) -----------------------
ROOT="$(pwd)"
if [ ! -f "$ROOT/package.json" ]; then
  echo "⚠️  No package.json found in $ROOT"
  echo "    Run this script from the root of your React + Vite project,"
  echo "    or use:  ./scaffold-structure.sh --create <project-name> [features...]"
  exit 1
fi

SRC="$ROOT/src"

# .gitkeep keeps otherwise-empty folders tracked by git.
make_dir() {
  local dir="$1"
  mkdir -p "$dir"
  if [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
    touch "$dir/.gitkeep"
  fi
}

echo "📁 Scaffolding structure under: $SRC"

# --- app/ : composition root (wiring only) -----------------------------------
make_dir "$SRC/app/providers"
make_dir "$SRC/app/router"

# --- core/ : cross-cutting concerns ------------------------------------------
make_dir "$SRC/core/api"
make_dir "$SRC/core/error"
make_dir "$SRC/core/config"
make_dir "$SRC/core/storage"

# --- shared/ : reusable across features --------------------------------------
make_dir "$SRC/shared/ui"
make_dir "$SRC/shared/hooks"
make_dir "$SRC/shared/lib"

# --- features/ ----------------------------------------------------------------
make_dir "$SRC/features"

scaffold_feature() {
  local feature="$1"
  local base="$SRC/features/$feature"
  echo "   → feature: $feature"

  # A) domain (DECLARE)
  make_dir "$base/domain/entities"
  make_dir "$base/domain/repositories"

  # B) infrastructure (DEFINE)
  make_dir "$base/infrastructure/data-sources/remote"
  make_dir "$base/infrastructure/data-sources/local"
  make_dir "$base/infrastructure/repositories"

  # C) application (CALL)
  make_dir "$base/application/usecases"
  make_dir "$base/application/queries"
  make_dir "$base/application/store"

  # D) presentation (DISPLAY)
  make_dir "$base/presentation/components"
  make_dir "$base/presentation/screens"
}

if [ "$#" -gt 0 ]; then
  for feature in "$@"; do
    scaffold_feature "$feature"
  done
else
  echo "   (no feature names passed — base structure only)"
  echo "   Tip: ./scaffold-structure.sh <feature1> <feature2> ... to scaffold features."
fi

# --- install standard stack libraries ----------------------------------------
STACK_DEPS="@tanstack/react-query zustand axios zod react-router-dom"

if [ "${SKIP_INSTALL:-0}" = "1" ]; then
  echo "⏭️  SKIP_INSTALL=1 — skipping library install."
else
  echo "📦 Installing stack libraries: $STACK_DEPS"
  if command -v npm >/dev/null 2>&1; then
    npm install $STACK_DEPS
  else
    echo "⚠️  npm not found — skipping install. Run manually:"
    echo "    npm install $STACK_DEPS"
  fi
fi

echo "✅ Done."
