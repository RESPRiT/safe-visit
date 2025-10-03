// lots of evil css-in-js here, but that's ok for a one-off
function createLoadingDiv() {
  const ret = document.createElement("div");
  ret.id = "safe-visit-loader";

  Object.assign(ret.style, {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    color: "#222222",
    backgroundColor: "hsl(from cyan h s l / 0.75)",
  });

  // https://fontawesome.com/icons/rotate?f=classic&s=solid&an=spin-pulse
  const spinner = `
  <svg width="2rem" height="2rem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <style>
      @keyframes fa-spin { to { transform: rotate(360deg); } }
      .spin {
        animation: fa-spin 1s steps(8) infinite;
        transform-origin: 50% 50%;
        transform-box: view-box;
      }
    </style>
    <g class="spin">
      <path d="M544.1 256L552 256C565.3 256 576 245.3 576 232L576 88C576 78.3 570.2 69.5 561.2 65.8C552.2 62.1 541.9 64.2 535 71L483.3 122.8C439 86.1 382 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6C143.2 199.5 223.3 128 320 128C364.4 128 405.2 143 437.7 168.3L391 215C384.1 221.9 382.1 232.2 385.8 241.2C389.5 250.2 398.3 256 408 256L544.1 256zM573.5 356.5C576 339 563.8 322.8 546.4 320.3C529 317.8 512.7 330 510.2 347.4C496.9 440.4 416.8 511.9 320.1 511.9C275.7 511.9 234.9 496.9 202.4 471.6L249 425C255.9 418.1 257.9 407.8 254.2 398.8C250.5 389.8 241.7 384 232 384L88 384C74.7 384 64 394.7 64 408L64 552C64 561.7 69.8 570.5 78.8 574.2C87.8 577.9 98.1 575.8 105 569L156.8 517.2C201 553.9 258 576 320 576C449 576 555.7 480.6 573.4 356.5z"/>
    </g>
  </svg>
  `;
  ret.insertAdjacentHTML("beforeend", spinner);

  const timer = document.createElement("i");
  timer.innerText = "Waiting for Mafia\n(0.0s elapsed)";
  Object.assign(ret.style, {
    fontFamily: "Arial, sans-serif",
    fontSize: "1rem",
    textAlign: "center",
    userSelect: "none",
  });
  let elapsedTime = 0;
  const updateTimer = (time: number) => {
    timer.innerText =
      time < 9000
        ? `Waiting for Mafia\n(${(time / 1000).toFixed(1)}s elapsed)`
        : `Waiting has timed out\n(Redirecting soon...)`;

    if (time < 9000) elapsedTime += 100;
    else clearInterval(timerInterval);
  };
  const timerInterval = setInterval(() => updateTimer(elapsedTime), 100);
  ret.appendChild(timer);

  return ret;
}

export function appendLoadingDiv() {
  const frame = document.querySelector("frame[name=mainpane]");
  if (frame === null) throw new Error("Could not find mainpane");

  const root = (frame as HTMLFrameElement).contentDocument?.querySelector(
    "html"
  );
  root?.appendChild(createLoadingDiv());
}
