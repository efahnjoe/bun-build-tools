#!/bin/bash

OUT_DIR="lib"

rm -rf "$OUT_DIR"
echo "Clean up"

mkdir -p "$OUT_DIR"

echo "Building..."

bun build ./src/index.js ./src/build.ts \
 --target bun \
 --outdir "$OUT_DIR" \
 --format esm \
 --external '*' \

echo "Building types..."
tsc --emitDeclarationOnly --outDir "$OUT_DIR"

echo "Done"