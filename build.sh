#!/bin/bash

rm -rf "$OUT_DIR"
echo "Clean up"

mkdir -p "$OUT_DIR"

echo "Building..."

bun build ./src/index.js ./src/build.ts \
 --target bun \
 --outdir ./lib \
 --format esm \
 --external '*' \

echo "Done"