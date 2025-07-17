#!/usr/bin/env bun
import { build, spawn } from 'bun';
import fg from 'fast-glob';
import { join } from 'path';
import { rm } from 'node:fs/promises';
import type { BuildConfig } from 'bun';

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

const buildPackage = async (mode: string, packageDir: string, outDir: string, config?: BuildConfig) => {
  if (!["lib", "bundle"].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  const entrypoints = fg.sync(["**/*.ts", "!**/node_modules/**", "!**/*.d.ts"], { cwd: packageDir, });

  if (entrypoints.length === 0) {
    console.error("No .ts files found.");
    process.exit(1);
  }

  const fullEntrypoints = entrypoints.map((file) => join(packageDir, file));

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

  const baseConfig = {
    root: packageDir,
    entrypoints: fullEntrypoints,
    outdir: outDir,
    naming: "[dir]/[name].mjs",
    splitting: true,
    format: "esm" as const,
    external: ["*"],
    sourcemap: "none" as const,
  };

  let buildConfig: Bun.BuildConfig;

  if (mode === "lib") {
    buildConfig = {
      ...baseConfig,
      minify: false,
      target: "node",
    };
  } else {
    buildConfig = {
      ...baseConfig,
      minify: true,
      target: "browser",
    };
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
 * @param {string} packageDir 
 * @param {string} outDir 
 * @param {Bun.BuildConfig} config 
 * 
 * @example
 * ```
 * import { bunBuild } from 'bun-build-tool';
 * 
 * await bunBuild('lib', 'src', 'dist', {})
 * ```
 */
export const bunBuild = async (mode: string, packageDir: string, outDir: string, config?: BuildConfig) => {
  try {
    await cleanDist(outDir)
    await buildPackage(mode, packageDir, outDir, config);
    await buildTsc(packageDir, outDir);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}