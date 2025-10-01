import { visitUrl, write } from "kolmafia";
import { appendScriptToHead } from "./utils.js";

const hookPath = "safe-visit/hook.js" as const;
export function main() {
  const page = visitUrl();
  write(appendScriptToHead(page, hookPath));
}
