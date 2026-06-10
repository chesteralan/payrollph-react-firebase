import { useEffect } from "react";

export function useMetaTags(tags: Record<string, string>) {
  useEffect(() => {
    const elements: HTMLElement[] = [];
    for (const [name, content] of Object.entries(tags)) {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
      elements.push(el);
    }
    return () => {
      // cleanup: could restore original values
    };
  }, [tags]);
}
