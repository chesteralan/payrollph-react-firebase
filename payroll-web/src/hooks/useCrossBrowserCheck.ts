import { useState, useEffect } from "react";

export function useCrossBrowserCheck() {
  const [results, setResults] = useState<Record<string, boolean>>({
    chrome: false,
    firefox: false,
    safari: false,
    edge: false,
    mobile: false,
    touch: false,
    webp: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const canvas = document.createElement("canvas");
    let webp = false;
    if (canvas.getContext?.("2d")) {
      webp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setResults({
      chrome: /chrome/i.test(ua) && !/edge|opr/i.test(ua),
      firefox: /firefox/i.test(ua),
      safari: /safari/i.test(ua) && !/chrome/i.test(ua),
      edge: /edge/i.test(ua),
      mobile: /mobile|android|iphone|ipad/i.test(ua),
      touch: "ontouchstart" in window,
      webp,
    });
  }, []);

  return results;
}
