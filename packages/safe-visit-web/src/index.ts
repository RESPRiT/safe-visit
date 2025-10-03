import { appendLoadingDiv } from "./dom";
import { remoteFunction, remoteFunctions } from "./utils";

let locked = false;

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
  // We use the MouseEvent type, but this logic also works for key input
  async function handler(e: MouseEvent) {
    // STEP 1: CONDITIONAL CLICK HIJACKING
    if (e.defaultPrevented) return;
    if (e.target === null) return;

    const findHrefRoot = (node: Node) => {
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
    //  so, we check the attribute manually via getAttribute, instead
    if (
      linkWhitelist.some(
        (s) =>
          a.getAttribute("href") === null || a.getAttribute("href")?.includes(s)
      )
    )
      return;
    if (e.button !== 0) return; // only trigger on left-click
    e.preventDefault();
    if (locked) return;

    // STEP 2: DELAY FUNCTION
    async function waitUntilCanVisit() {
      return new Promise((resolve) => {
        const start = Date.now();

        async function check(delay: number, first = false) {
          const canVisit = await canVisitUrl();
          if (canVisit) {
            locked = false;
            resolve(Date.now() - start);
          } else if (Date.now() - start < 10000) {
            if (first) appendLoadingDiv();
            locked = true;
            setTimeout(() => check(delay * 2), delay);
          } else {
            locked = false;
            resolve(
              console.error(
                "10s timeout waiting for mafia, proceeding unsafely"
              )
            );
          }
        }

        check(80, true);
      });
    }
    await waitUntilCanVisit();

    // STEP 3: VISIT LINK
    const frame: HTMLFrameElement | null = document.querySelector(
      "frame[name=mainpane]"
    );
    if (frame === null || frame.contentWindow === null)
      throw new Error("Could not find mainpane window");
    frame.contentWindow.location.href = a.href;
  }

  const attachHandler = (frame: HTMLFrameElement) => {
    if (frame.contentDocument === null)
      throw new Error(`Cannot find document for ${frame.name}`);

    frame.contentDocument.addEventListener("click", handler, true);
  };

  // **ATTACH HANDLER TO FRAMES**
  const frames = document.querySelectorAll("frame");
  frames.forEach((frame) => {
    // re-attach handler whenever frame content is reloaded
    //  sometimes, this is redundant (i.e. toast-style pop-ups)
    //  but, that's OK, because the listener is not double-added
    frame.addEventListener("load", () => attachHandler(frame));
    attachHandler(frame);
  });

  console.log("[safe-visit] Script is now active");
  remoteFunction("print", [
    "If you are seeing this message, safe-visit is active in your relay browser. To disable safe-visit, [do X].",
    "orange",
  ]);
  // **CONICALLY RETURN UN-LISTEN CALLBACK**
  return () =>
    [...frames].forEach((f) =>
      f.contentDocument?.removeEventListener("click", handler, true)
    );
}

waitForMafia();
