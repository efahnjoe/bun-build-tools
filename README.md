# Bun build tools

**Note: This project is written in TypeScript and only supports the `Bun` untime environment.**

**Note: We use `tsc` by default to generate `.d.ts` declaration files.**

This directory contains a set of build tools tailored for [Bun](https://bun.sh), a fast JavaScript runtime and package manager.

To streamline your development process, we provide two pre-configured default build configurations for Bun.

## Install

Install the package as a dev dependency:

```bash
bun add bun-build-tools -D
```

## Usage

We usage `fast-glob` to find all files in the `src` directory.

And, we use `node:fs/promises` to remove the `out` directory before building.

1. Library Mode (--lib)

Use this mode when building a library.

Command: 
```bash
bun-build --lib --src ./src --out ./out
```

This is a default configuration for Bun in library mode.

Equivalent to:

```bash
rm -rf ./out

bun build --entrypoints ./index.ts /
 --outdir ./out /
 --entry-naming [dir]/[name].mjs /
 --format esm /
 --splitting /
 --target node /
 --sourcemap=none /

tsc --emitDeclarationOnly --outDir ./out
```

2. Bundle Mode (--bundle)

Use this mode when bundling a web-ready application or script.

Command:
```bash
bun-build --bundle --src ./src --out ./out
```

Equivalent to:
```bash
rm -rf ./out

bun build --entrypoints ./index.ts /
 ---outdir ./out /
 --outfile ./out/bundle.mjs /
 --entry-naming [dir]/[name].mjs /
 --format esm /
 --minify /
 --splitting /
 --target browser /
 --sourcemap=none /

tsc --emitDeclarationOnly --outDir ./out
```

## Features of the Default Configurations

- Minification enabled via --minify
- Code splitting enabled via --splitting
- ES Module output via --format esm
- No sourcemaps for faster builds (--sourcemap=none)
- Output naming pattern: [dir]/[name].mjs

## Output Structure

Depending on the mode, the output will be structured as follows:

- Library Mode: Outputs multiple files in the ./out directory, preserving folder structure.
- Bundle Mode: Outputs a single file bundle.mjs in the ./out directory.

## Precautions

### No .d.ts Declaration Files Generated?

If you notice that no `.d.ts` declaration files are being generated under the outDir, don't panic — this may be due to how TypeScript handles incremental builds.

If your tsconfig.json includes:

```json
{
  "compilerOptions": {
    "incremental": true
  }
}
```

TypeScript may be using cached build information and skipping some outputs like `.d.ts` files.

```bash
rm -rf tsconfig.tsbuildinfo
```

Then run your build command again. This should restore correct declaration file generation.

## Need Customization?

Dont't Worry!

We are trying to incorporate advanced grammar.

For advanced use cases or custom build logic, consider writing your own script using the [Bun API](https://bun.com/docs/bundler) directly.