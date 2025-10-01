const safeVisitPath = "safe-visit/index.js" as const;

(function hookToWebpage() {
  if (window.top === null)
    throw new Error("Can't access the full window, probably a CORS issue");

  const script = window.document.createElement("script");
  script.setAttribute("src", safeVisitPath);

  const head = window.top.document.head;
  if (
    [...head.children].some(
      (el) =>
        el.tagName === "SCRIPT" && el.getAttribute("src") === safeVisitPath
    )
  )
    return;

  head.insertBefore(script, null);
  console.log("Succesfully hooked into relay browser!");
})();
