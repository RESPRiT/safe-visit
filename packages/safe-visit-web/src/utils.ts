import { remoteFunctions, remoteProperties } from "./api";

// DOM helpers

export const findHrefRoot = (node: Node) => {
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

export const visitUrl = (href: string) => {
  const frame: HTMLFrameElement | null = document.querySelector(
    "frame[name=mainpane]"
  );
  if (frame === null || frame.contentWindow === null)
    throw new Error("Could not find mainpane window");
  frame.contentWindow.location.href = href; // setting href visits link
};

// API helpers

// https://github.com/loathers/libram/blob/9e23d8614fafcbf45631dc1634553e12524b3802/src/lib.ts#L936
export async function canVisitUrl(): Promise<boolean> {
  const res = await remoteFunctions([
    "currentRound",
    "inMultiFight",
    "choiceFollowsFight",
    "handlingChoice",
  ]);
  if (res === null) throw new Error("canVisitUrl() should not return null");
  return res.every((ret) => !ret);
}

export async function notifyUser() {
  const prefs = await remoteProperties([
    "_safeVisitSessionNotify",
    "safeVisitNotify",
  ]);

  const notify = !prefs.some((p) => p === "false");
  if (notify) {
    remoteFunctions(
      ["printHtml", "setProperty"],
      [
        [
          `<span color="orange">If you are seeing this message, safe-visit is active in your relay browser. When enabled, safe-visit adds 10-20ms (0.01 seconds) of latency to browser actions. To prevent this message from appearing again, use the following command:</span>
        
          set safeVisitNotify = false
          `,
        ],
        ["_safeVisitSessionNotify", "false"],
      ]
    );
  }
  return notify;
}
