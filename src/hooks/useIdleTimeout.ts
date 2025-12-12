import { useEffect, useRef } from "react";

interface UseIdleTimeoutOptions {
  /** Timeout in milliseconds before logout (default: 5 minutes) */
  timeout?: number;
  /**
   * How long BEFORE `timeout` to show a warning (default: 60 seconds).
   * Example: timeout=5m, warningBefore=60s => warn at 4m, logout at 5m.
   */
  warningBefore?: number;
  /** Callback when user is logged out due to idle */
  onIdle: () => void;
  /** Optional callback when warning threshold is reached */
  onWarn?: () => void;
  /** Optional callback when user becomes active again (after any activity) */
  onActive?: () => void;
  /** Whether the timeout is enabled */
  enabled?: boolean;
}

/**
 * Simple idle timeout hook - warns (optional) then logs out after inactivity.
 */
export function useIdleTimeout({
  timeout = 5 * 60 * 1000, // 5 minutes
  warningBefore = 60 * 1000, // 60 seconds
  onIdle,
  onWarn,
  onActive,
  enabled = true,
}: UseIdleTimeoutOptions): void {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);
  const onWarnRef = useRef(onWarn);
  const onActiveRef = useRef(onActive);
  const warnedRef = useRef(false);

  // Keep callback ref updated
  onIdleRef.current = onIdle;
  onWarnRef.current = onWarn;
  onActiveRef.current = onActive;

  useEffect(() => {
    if (!enabled) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      idleTimerRef.current = null;
      warnTimerRef.current = null;
      warnedRef.current = false;
      return;
    }

    const resetTimers = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);

      warnedRef.current = false;

      const warnDelay =
        typeof onWarnRef.current === "function" && warningBefore > 0
          ? Math.max(timeout - warningBefore, 0)
          : null;

      if (warnDelay !== null && warnDelay < timeout) {
        warnTimerRef.current = setTimeout(() => {
          warnedRef.current = true;
          onWarnRef.current?.();
        }, warnDelay);
      } else {
        warnTimerRef.current = null;
      }

      idleTimerRef.current = setTimeout(() => {
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
        // If we already warned, any activity should dismiss the warning UI.
        if (warnedRef.current) {
          warnedRef.current = false;
        }
        onActiveRef.current?.();
        resetTimers();
      }
    };

    // Add listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimers();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    };
  }, [enabled, timeout, warningBefore]);
}
