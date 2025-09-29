import { print, visitUrl } from "kolmafia";

export function timedVisitUrl(url: string) {
  const start = new Date().getTime();

  const page = visitUrl(url);

  const elapsed = new Date().getTime() - start;
  print(`Spent ${(elapsed / 1000).toFixed(2)}s visiting: ${url}`);

  return page;
}

export function appendScriptToHead(html: string, src: string) {
  const scriptEl = `<script src="${src}"></script>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${scriptEl}</head>`);
  }

  throw new Error("No <head> element found");
}
