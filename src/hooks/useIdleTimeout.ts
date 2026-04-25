import { useEffect, useEffectEvent } from "react";

const DEFAULT_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart"];

export function useIdleTimeout(
  timeoutMs: number,
  onTimeout: () => void,
  enabled = true,
) {
  const handleTimeout = useEffectEvent(onTimeout);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let timeoutId = window.setTimeout(() => {
      handleTimeout();
    }, timeoutMs);

    const restartTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleTimeout();
      }, timeoutMs);
    };

    DEFAULT_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, restartTimer, { passive: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      DEFAULT_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, restartTimer);
      });
    };
  }, [enabled, handleTimeout, timeoutMs]);
}
