#!/usr/bin/env bash
set -euo pipefail

echo "Install dev dependencies..."
npm install --save-dev typescript ts-node-dev @types/node eslint \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin

echo "Ensure tsconfig.json exists (use provided template)."

echo "List JS files under src:"
find src -type f -name "*.js" || true

echo "Initial type check (noEmit):"
npx tsc -p tsconfig.json --noEmit || true

echo "Recommended: run ts-migrate or manually rename files from .js to .ts and fix types progressively."
echo "Example rename (manual): git mv src/foo.js src/foo.ts"