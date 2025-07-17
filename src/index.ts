import { bunBuild } from "./build";
import minimist from "minimist";

const showHelp = () => {
  console.log(`
Usage: bun-build [--lib | --bundle] [options]

Options:
  --help           Show this help message
  --lib            Build in library mode (default)
  --bundle         Build in bundle mode
  --src,           Package directory (default: "./src")
  --out,           Output directory (default: "./out")
`);
}

if (import.meta.main) {
  (async () => {
    const args = process.argv.slice(2);
    const options = minimist(args, {
      boolean: ["lib", "bundle", "help"],
      string: ["src", "out"],
      default: {
        lib: false,
        bundle: false,
        src: "src",
        out: "dist",
        help: false,
      },
    });

    if (options.help) {
      showHelp();
      process.exit(0);
    }

    let mode: string;
    if (options.lib) {
      mode = "lib";
    } else if (options.bundle) {
      mode = "bundle";
    } else {
      console.error("Please specify either --lib or --bundle");
      showHelp();
      process.exit(1);
    }

    const packageDir = options.src;
    const outDir = options.out;
    try {
      await bunBuild(mode, packageDir, outDir);
      // runBuild(mode, packageDir, outDir);
      console.log("Build complete.");
    } catch (error) {
      console.error("Build failed:", error);
      process.exit(1);
    }
  })();
}