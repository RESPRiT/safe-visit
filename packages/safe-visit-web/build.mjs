/* global console */
import esbuild from "esbuild";
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
    hook: "src/hook.ts",
    index: "src/index.ts",
  },
  bundle: true,
  minifySyntax: true,
  platform: "browser",
  target: ["ESNext"],
  mainFields: ["browser", "module", "main"],
  conditions: ["browser"],
  plugins: [watchPlugin],
  loader: { ".ts": "ts" },
  outdir: "dist/relay/safe-visit",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

// Initial build(s)
await context.rebuild();

if (watch) {
  await Promise.all([context.watch()]);
} else {
  context.dispose();
}
