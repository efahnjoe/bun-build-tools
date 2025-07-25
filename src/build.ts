#!/usr/bin/env bun
import { build, spawn } from 'bun';
import fg from 'fast-glob';
import { join } from 'path';
import { rm } from 'node:fs/promises';
import type { BuildConfig } from 'bun';

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
   * Files to ignore
   * @flag --ignore
   */
  ignore?: string | string[] | undefined;
  /**
   * Output directory
   * @default "./out"
   * @flag --out
   */
  out: string;
  /** 
   * Enable TypeScript compilation
   * @default true
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

const cleanDist = async (outDir: string) => {
  const files = await fg([`${outDir}/**/*`, `${outDir}/**/.*`, `!${outDir}`], {
    onlyFiles: false,
    markDirectories: true,
    dot: true,
  });

  for (const file of files.sort((a, b) => b.length - a.length)) {
    await rm(file, { recursive: true, force: true });
  }

  console.log(`Cleared output directory: ${outDir}`);
}

const buildPackage = async (opts: Options) => {
  const {
    mode,
    src = "src",
    ignore = undefined,
    out = "out",
    format = "esm",
    target = "bun",
    naming = "[dir]/[name].mjs",
    splitting = true,
    external = ["*"],
    sourcemap = "none",
    minify = false,
  } = opts || {}

  if (mode && !["lib", "bundle"].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  let ignorePatterns: string[] = [];

  const safeIgnore: string[] =
    ignore === undefined
      ? [] // if ignore is not provided, use an empty array
      : Array.isArray(ignore)
        ? ignore.filter((item): item is string => Boolean(item)) // filter out falsy values
        : [ignore].filter(Boolean); // convert to array if it's a string, then filter out falsy values

  if (safeIgnore.length > 0) {
    ignorePatterns = safeIgnore.map((pattern) => `!${pattern}`);
  }

  const patterns = [
    "**/*.ts",
    "!**/node_modules/**",
    "!**/*.d.ts",
    ...ignorePatterns || [],
  ];

  const entrypoints = fg.sync(patterns, { cwd: src, });

  if (entrypoints.length === 0) {
    console.error("No .ts files found.");
    process.exit(1);
  }

  const fullEntrypoints = entrypoints.map((file) => join(src, file));

  const packageJson = await Bun.file(join(process.cwd(), "package.json")).json();

  const packageName = packageJson.name;

  if (!packageName) {
    console.error("package.json is missing a name field.");
    process.exit(1);

  }

  const packageVersion = packageJson.version;

  if (!packageVersion) {
    console.error("package.json is missing a version field.");
    process.exit(1);
  }

  const baseConfig: BuildConfig = {
    root: src,
    entrypoints: fullEntrypoints,
    outdir: out,
    naming,
    external,
    format,
    splitting,
    sourcemap,
    minify,
  }

  let buildConfig: Bun.BuildConfig;

  if (mode === "lib") {
    buildConfig = {
      ...baseConfig,
      minify: false,
      target: "node",
    };
  } else if (mode === "bundle") {
    buildConfig = {
      ...baseConfig,
      minify: true,
      target: "browser",
    };
  } else {
    buildConfig = {
      ...baseConfig,
      target,
    }
  }

  const result = await build(buildConfig);

  if (result.success) {
    console.log(`${packageName} v${packageVersion} build successful`);
  } else {
    console.error(`${packageName} v${packageVersion} build failed`);
    for (const message of result.logs) {
      console.error(message);
    }
    process.exit(1);
  }
}

const buildTsc = async (packageDir: string, outDir: string) => {
  const tscPath = join(process.cwd(), "node_modules/.bin/tsc");
  const outputPath = join(process.cwd(), outDir);

  console.log("Building TypeScript...");
  const proc = spawn([tscPath, "--emitDeclarationOnly", "--outDir", outputPath], {
    cwd: packageDir,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`tsc exited with code ${exitCode}`);
  }

  console.log("Typescript completed");
}

/**
 * 
 * @param {Options} opts 
 * 
 * @example
 * ```
 * import { bunBuild } from 'bun-build-tool';
 * 
 * await bunBuild({'lib', 'src', 'dist'})
 * ```
 */
export const bunBuild = async (opts: Options) => {
  try {
    await cleanDist(opts.out)
    await buildPackage(opts);

    let shouldBuildTsc = false;
    if (opts.mode !== undefined) {
      // When the mode exists, the execution only occurs if tsc is not false.
      shouldBuildTsc = opts.tsc !== false;
    } else {
      // When the mode does not exist, it completely depends on the value of tsc.
      shouldBuildTsc = !!opts.tsc;
    }

    if (shouldBuildTsc) {
      await buildTsc(opts.src, opts.out);
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}