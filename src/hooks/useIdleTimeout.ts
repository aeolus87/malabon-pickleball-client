import { useEffect, useRef } from "react";

interface UseIdleTimeoutOptions {
  /** Timeout in milliseconds before logout (default: 5 minutes) */
  timeout?: number;
  /** Callback when user is logged out due to idle */
  onIdle: () => void;
  /** Whether the timeout is enabled */
  enabled?: boolean;
}

/**
 * Simple idle timeout hook - logs out after inactivity period.
 * No warning, just logout.
 */
export function useIdleTimeout({
  timeout = 5 * 60 * 1000, // 5 minutes
  onIdle,
  enabled = true,
}: UseIdleTimeoutOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);

  // Keep callback ref updated
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onIdleRef.current();
      }, timeout);
    };

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle activity detection
    let lastActivity = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) {
        lastActivity = now;
        resetTimer();
      }
    };

    // Add listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, timeout]);
}
