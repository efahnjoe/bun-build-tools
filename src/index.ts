#!/usr/bin/env bun
import minimist from "minimist";
import { bunBuild } from "./build";
import type { Options } from './build'

const showHelp = () => {
  console.log(`
Usage: bun-build [options]
See: https://github.com/efahnjoe/bun-build-tools#readme
Bun Api: https://bun.com/docs/bundler

Options:
  --help           Show this help message
  --lib            Build in library mode (default)
  --bundle         Build in bundle mode
  --target         The intended execution environment for the bundle (default: "bun")
  --src,           Package directory (default: "./src")
  --out,           Output directory (default: "./out")
  --tsc,           Use TypeScript (default: false)
  --naming,        Customizes the generated file names (default: "[dir]/[name].mjs")
  --format         Specifies the module format to be used in the generated bundles (default: "esm")
  --splitting,     Whether to enable code splitting (default: true)
  --external,      External dependencies (default: ["*"])
  --sourcemap,     Specifies the type of sourcemap to generate (default: none)
  --minify,        Whether to enable minification (default: false)
`);
}

if (import.meta.main) {
  (async () => {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      showHelp();
      process.exit(0);
    }

    const options = minimist(args, {
      boolean: ["lib", "bundle", "tsc", "help"],
      string: ["target", "src", "out", "naming", "format", "splitting", "external", "sourcemap", "minify"],
      default: {
        lib: false,
        bundle: false,
        target: "bun",
        src: "src",
        out: "out",
        tsc: false,
        naming: "[dir]/[name].mjs",
        format: "esm",
        splitting: true,
        external: ["*"],
        sourcemap: "none",
        minify: false,
        help: false,
      },
    });

    if (options.help) {
      showHelp();
      process.exit(0);
    }

    let mode: "lib" | "bundle" | undefined;
    if (options.lib) {
      mode = "lib" as const;
    } else if (options.bundle) {
      mode = "bundle" as const;
    } else {
      mode = void 0;
    }

    const opts: Options = {
      mode,
      src: options.src,
      out: options.out,
      tsc: options.tsc,
      target: options.target,
      naming: options.naming,
      format: options.format,
      splitting: options.splitting,
      external: options.external,
      sourcemap: options.sourcemap,
      minify: options.minify
    }

    try {
      await bunBuild(opts);
      console.log("Build complete.");
    } catch (error) {
      console.error("Build failed:", error);
      process.exit(1);
    }
  })();
}

export default bunBuild;