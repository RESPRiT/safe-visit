import { appendLoadingDiv } from "./dom";
import { canVisitUrl, findHrefRoot, notifyUser, visitUrl } from "./utils";

const linkWhitelist = [
  "#",
  "KoLmafia/logout",
  "awesomemenu.php",
  "adminmail.php",
  "mchat.php",
  "static.php",
  // external links
  "http://",
  "https://",
] as const;

let locked = false;

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
          console.error("10s timeout waiting for mafia, proceeding unsafely")
        );
      }
    }
    check(80, true);
  });
}

// We use the MouseEvent type, but this logic also works for key input
async function handleInput(e: MouseEvent) {
  // Always prevent link visits when locked
  if (locked) return e.preventDefault();

  // Check if event is dead or stale
  if (e.defaultPrevented) return;
  if (e.target === null) return;

  // Check if input is left-click (or keyboard equivalent)
  if (e.button !== 0) return;

  // Check if clicked element (or parent) has a link/href
  const a = findHrefRoot(e.target as Node);
  if (a === null) return;

  // Check if link should be ignored via whitelisted
  if (linkWhitelist.some((s) => a.getAttribute("href")?.includes(s))) return;

  // Finally, prevent link visit, wait until safe, then visit link
  e.preventDefault();
  await waitUntilCanVisit();
  visitUrl(a.href);
}

const attachHandler = (frame: HTMLFrameElement) => {
  if (frame.contentDocument === null)
    throw new Error(`Cannot find document for ${frame.name}`);
  frame.contentDocument.addEventListener("click", handleInput, true);
};

const attachHandlers = () => {
  const frames = document.querySelectorAll("frame");
  frames.forEach((frame) => {
    // re-attach handler whenever frame content is reloaded
    //  sometimes, this is redundant (i.e. "new event" banners)
    //  but, that's OK, because the listener is not double-added
    frame.addEventListener("load", () => attachHandler(frame));
    attachHandler(frame);
  });

  return () =>
    [...frames].forEach((f) =>
      f.contentDocument?.removeEventListener("click", handleInput, true)
    );
};

attachHandlers();
notifyUser();
console.log("[safe-visit] Script is now active");
