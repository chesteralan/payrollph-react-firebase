import { useEffect, useCallback, useMemo } from "react";

type MessageHandler = (data: unknown) => void;

export function useCrossTabSync(channelName: string, onMessage: MessageHandler) {
  const channel = useMemo(
    () =>
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(channelName)
        : null,
    [channelName],
  );

  useEffect(() => {
    if (!channel) return;
    const handler = (e: MessageEvent) => onMessage(e.data);
    channel.addEventListener("message", handler);
    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  }, [channel, onMessage]);

  const send = useCallback(
    (data: unknown) => {
      channel?.postMessage(data);
    },
    [channel],
  );

  return { send };
}
