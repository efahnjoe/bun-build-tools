#!/bin/bash

OUT_DIR="lib"
CLI_NAME="bun-build"

rm -rf "$OUT_DIR"
echo "Clean up"

mkdir -p "$OUT_DIR"

echo "Building..."
bun build ./src/index.ts --target bun --compile --minify --sourcemap --outfile "$OUT_DIR/$CLI_NAME" --format esm --external fast-glob --external path --external minimist
echo "Done"