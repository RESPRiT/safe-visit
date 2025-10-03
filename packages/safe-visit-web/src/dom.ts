const loadingDiv = (function createLoadingDiv() {
  const ret = document.createElement("div");
  ret.id = "safe-visit-loader";
  Object.assign(ret.style, {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    backgroundColor: "hsl(from cyan h s l / 0.5)",
  });

  return ret;
})();

export function appendLoadingDiv() {
  const frame = document.querySelector("frame[name=mainpane]");
  if (frame === null) throw new Error("Could not find mainpane");

  const root = (frame as HTMLFrameElement).contentDocument?.querySelector(
    "html"
  );
  root?.appendChild(loadingDiv);
}
