/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useState } from "react";

type AnnouncementKind = "polite" | "assertive";

export function useScreenReaderAnnouncement() {
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<AnnouncementKind>("polite");

  const announce = useCallback((msg: string, priority: AnnouncementKind = "polite") => {
    setMessage(msg);
    setKind(priority);
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(id);
  }, [message]);

  return { message, kind, announce };
}

export function AriaLiveRegion({
  message,
  kind = "polite",
}: {
  message: string;
  kind?: AnnouncementKind;
}) {
  return (
    <div
      aria-live={kind}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {message}
    </div>
  );
}
