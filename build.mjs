/* global console */
import esbuild from "esbuild";
import babel from "esbuild-plugin-babel";
import process from "process";

const args = process.argv.slice(2);
const watch = args.some((a) => a === "--watch" || a === "-w");

const watchPlugin = {
  name: "watch",
  setup(build) {
    if (!watch) return;
    build.onEnd((result) => {
      const date = new Date();
      console.log(
        `[${date.toISOString()}] Build ${
          result.errors.length ? "failed" : "succeeded"
        }.`
      );
    });
  },
};

const context = await esbuild.context({
  entryPoints: {
    peak: "src/peak.ts",
    hillbot: "src/hillbot.ts",
  },
  bundle: true,
  minifySyntax: true,
  platform: "node",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  plugins: [babel(), watchPlugin],
  outdir: "dist/scripts/peak",
  loader: { ".json": "text" },
  inject: ["./kolmafia-polyfill.js"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

const relayContext = await esbuild.context({
  entryPoints: {
    peevpee: "src/relay/peevpee.ts",
    main: "src/relay/main.ts",
  },
  bundle: true,
  minifySyntax: true,
  platform: "node",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  plugins: [babel(), watchPlugin],
  outdir: "dist/relay",
  loader: { ".json": "text" },
  inject: ["./kolmafia-polyfill.js"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

const webContext = await esbuild.context({
  entryPoints: {
    hall: "src/relay/assets/hall.ts",
    hook: "src/relay/assets/hook.ts",
    safeVisit: "src/relay/assets/safeVisit.ts",
  },
  bundle: true,
  minifySyntax: true,
  platform: "browser",
  target: ["ESNext"],
  mainFields: ["browser", "module", "main"],
  conditions: ["browser"],
  alias: { kolmafia: "tome-kolmafia-mock" },
  plugins: [watchPlugin],
  loader: { ".ts": "ts" },
  outdir: "dist/relay/peak/assets",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

// Initial build(s)
await context.rebuild();
await relayContext.rebuild();
await webContext.rebuild();

if (watch) {
  await Promise.all([
    context.watch(),
    relayContext.watch(),
    webContext.watch(),
  ]);
} else {
  context.dispose();
  relayContext.dispose();
  webContext.dispose();
}
