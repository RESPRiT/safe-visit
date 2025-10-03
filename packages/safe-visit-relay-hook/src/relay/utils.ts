export function appendScriptToHead(html: string, src: string) {
  const scriptEl = `<script src="${src}"></script>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${scriptEl}</head>`);
  }

  throw new Error("No <head> element found");
}
