# Bun build tools

**Note: This project is written in TypeScript and only supports the `Bun` runtime environment.**

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

bun build --entrypoints ./index.ts \
 --outdir ./out \
 --entry-naming [dir]/[name].mjs \
 --format esm \
 --splitting \
 --target node \
 --sourcemap=none \

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

bun build --entrypoints ./index.ts \
 ---outdir ./out \
 --outfile ./out/bundle.mjs \
 --entry-naming [dir]/[name].mjs \
 --format esm \
 --minify \
 --splitting \
 --target browser \
 --sourcemap=none \

tsc --emitDeclarationOnly --outDir ./out
```

## Options
Even if the `lib` and `bundle` options are enabled, the default values can still be overridden.

Compatible with most Bun api.

```typescript
/**
 * Build configuration options
 * 
 * Note: CLI flags override default values when provided.
 * Compatible with most Bun build APIs.
 */
export interface Options {
  /** Build mode (not exposed in CLI) */
  mode?: "lib" | "bundle";
  /** 
   * Library mode (default: true)
   * @flag --lib
   */
  lib?: boolean;
  /** 
   * Bundle mode (default: false)
   * @flag --bundle
   */
  bundle?: boolean;
  /** 
   * Target execution environment
   * @default "bun"
   * @flag --target
   */
  target?: "node" | "bun" | "browser";
  /** 
   * Source directory
   * @default "./src"
   * @flag --src
   */
  src: string;
  /** 
   * Output directory
   * @default "./out"
   * @flag --out
   */
  out: string;
  /** 
   * Enable TypeScript compilation
   * @default false
   * @flag --tsc
   */
  tsc?: boolean;
  /** 
   * Output filename pattern
   * @default "[dir]/[name].mjs"
   * @flag --naming
   */
  naming?: string;
  /** 
   * Module format
   * @default "esm"
   * @flag --format
   */
  format?: "esm" | "cjs" | "iife";
  /** 
   * Enable code splitting
   * @default true
   * @flag --splitting
   */
  splitting?: boolean;
  /** 
   * External dependencies
   * @default ["*"]
   * @flag --external
   */
  external?: string[];
  /** 
   * Sourcemap generation type
   * @default "none"
   * @flag --sourcemap
   */
  sourcemap?: boolean | "external" | "none" | "linked" | "inline";
  /** 
   * Enable minification
   * @default false
   * @flag --minify
   */
  minify?: boolean;
}
```

```bash
--help           Show this help message

# Build Modes (mutually exclusive)
--lib            Build in library mode (default)
--bundle         Build in bundle mode

# Core Configuration
--target         The intended execution environment for the bundle (default: "bun")
--src,           Package directory (default: "./src")
--ignore         Ignore files and directories (default: [])
--out,           Output directory (default: "./out")

# Optional Features
--no-tsc         Disable TypeScript (default: enabled)
--naming,        Customizes the generated file names (default: "[dir]/[name].mjs")
--format         Specifies the module format to be used in the generated bundles (default: "esm")
--splitting,     Whether to enable code splitting (default: true)
--external,      External dependencies (default: ["*"])
--sourcemap,     Specifies the type of sourcemap to generate (default: none)
--minify,        Whether to enable minification (default: false)
```

**example:**
```bash
build-tool --src ./src --out ./dist

build-tool --bundle --minify --out ./build

build-tool --naming "[name]-[hash].js" --sourcemap inline

build-tool --lib --no-tsc --ignore "./src/ignore.ts" --ignore "./src/types"
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