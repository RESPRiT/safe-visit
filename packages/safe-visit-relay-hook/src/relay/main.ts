import { visitUrl, write } from "kolmafia";
import { appendScriptToHead } from "./utils.js";

export const hookPath = "safe-visit/hook.js" as const;
export const safeVisitPath = "safe-visit/index.js" as const;
export function main() {
  const page = visitUrl();
  write(appendScriptToHead(page, hookPath));
}
