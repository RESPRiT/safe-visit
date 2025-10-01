import { remoteFunctions } from "./utils";

async function canVisitUrl(): Promise<boolean> {
  const res = await remoteFunctions([
    "currentRound",
    "inMultiFight",
    "choiceFollowsFight",
    "handlingChoice",
  ]);
  if (res === null) throw new Error("canVisitUrl() should not return null");

  return res.every((ret) => !ret);
}

async function waitForMafia() {
  // **SETUP HANDLER FOR LISTENER**
  console.log("Creating wait handler!");
  async function handler(e: MouseEvent) {
    // STEP 1: CONDITIONAL CLICK HIJACKING
    console.log("Handler triggered");
    if (e.defaultPrevented) return;
    if (e.target === null) return;

    const findHrefRoot = (node: Node) => {
      console.log("Looking for relevant element");
      // We have to do this to get types because of ~realms~:
      // Basically, the <frames> have their own constructors for
      //  things like Window, etc., which breaks typechecks,
      //  so you need to access their realm-local constructors
      const w: Window & typeof globalThis =
        node.ownerDocument?.defaultView || window;

      while (node !== null && !(node instanceof w.Document)) {
        if (
          node instanceof w.HTMLAnchorElement ||
          node instanceof w.HTMLAreaElement
        ) {
          console.log("Element found!", node);
          return node;
        }
        if (!(node instanceof w.Node))
          throw new Error("Root node of target isn't a document");

        node = node.parentNode as Node;
      }

      return null;
    };
    // I think I can assume Node type for click events on a <frame>
    const a = findHrefRoot(e.target as Node);
    if (a === null) return;

    const linkWhitelist = [
      "#",
      "/KoLmafia/logout",
      "awesomemenu.php",
      "adminmail.php",
      "mchat.php",
      "static.php",
      "http://", // external links
      "https://",
    ];
    // if we check a.href, it will return the full URL and include http(s),
    // so, we check the attribute manually via getAttribute, instead
    if (linkWhitelist.some((s) => a.getAttribute("href")?.includes(s))) return;
    if (e.button !== 0) return; // only trigger on left-click

    e.preventDefault();

    // STEP 2: DELAY FUNCTION
    async function waitUntilCanVisit() {
      return new Promise((resolve, reject) => {
        const start = Date.now();

        async function check() {
          const canVisit = await canVisitUrl();
          console.log("Polling...", Date.now() - start, canVisit);
          if (canVisit) {
            clearInterval(timer);
            resolve(Date.now() - start);
          } else if (Date.now() - start >= 10000) {
            clearInterval(timer);
            reject(new Error("Timeout waiting for mafia"));
          }
        }

        const timer = setInterval(check, 100);
        console.log("Seeing if we should wait");
        check();
      });
    }
    await waitUntilCanVisit();

    // STEP 3: VISIT LINK
    console.log("Done waiting, visiting link");
    const frame: HTMLFrameElement | null = document.querySelector(
      "frame[name=mainpane]"
    );
    console.log(document);
    if (frame === null || frame.contentWindow === null)
      throw new Error("Could not find mainpane window");
    frame.contentWindow.location.href = a.href;
  }

  const attachHandler = (frame: HTMLFrameElement) => {
    if (frame.contentDocument === null)
      throw new Error(`Cannot find document for ${frame.name}`);

    if (frame.contentDocument.URL !== "about:blank") {
      console.log("Adding click event", frame);
      frame.contentDocument.addEventListener("click", handler, true);
    } else {
      console.log("Adding load event", frame);
      frame.addEventListener(
        "load",
        () => {
          console.log("loaded!", frame, frame.contentDocument);
          frame.contentDocument?.addEventListener("click", handler, true);
        },
        { once: true }
      );
    }
  };

  // **ATTACH HANDLER TO FRAMES**
  const frames = document.querySelectorAll("frame");
  for (const frame of frames) {
    console.log(
      "Attaching listener and observer",
      frame,
      frame.contentDocument,
      frame.contentWindow
    );
    // re-attach handler whenever frame content is reloaded
    frame.addEventListener("load", () => attachHandler(frame));
    attachHandler(frame);
  }

  // **CONICALLY RETURN UN-LISTEN CALLBACK**
  return () =>
    [...frames].forEach((f) =>
      f.contentDocument?.removeEventListener("click", handler, true)
    );
}

window.addEventListener(
  "load",
  () => {
    console.log("Window loaded");
  },
  { once: true }
);

waitForMafia();
