// @ts-check
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import * as libram from "eslint-plugin-libram";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  { plugins: { libram }, rules: { "libram/verify-constants": "error" } },
  { ignores: ["dist/*"] },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    ignores: ["src/relay/assets/**"],
    plugins: { libram },
    rules: { "libram/verify-constants": "error" },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.rhino.json",
      },
    },
  },
  {
    files: ["src/relay/assets/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.web.json",
      },
    },
    settings: {
      "import/resolver": {
        alias: {
          map: [["kolmafia", "tome-kolmafia-mock/dist"]],
        },
      },
    },
  }
);
