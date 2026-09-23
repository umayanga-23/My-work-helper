import { useEffect, useRef } from 'react';

export interface UseLiveSyncOptions {
  /**
   * Interval in milliseconds for periodic background refresh.
   * Default: 12000 (12 seconds)
   */
  intervalMs?: number;
  /**
   * Whether auto-sync is currently active.
   * Default: true
   */
  enabled?: boolean;
  /**
   * Revalidate immediately when the user switches back to this browser tab.
   * Default: true
   */
  revalidateOnFocus?: boolean;
}

/**
 * useLiveSync - Automatic background polling and window-focus data synchronization.
 * 
 * Ensures that if a task, note, or resource is added or updated from another device
 * (such as a mobile phone or another browser tab), this browser automatically updates
 * without requiring the user to manually refresh the page.
 */
export function useLiveSync(
  syncFn: () => Promise<void> | void,
  options: UseLiveSyncOptions = {}
) {
  const {
    intervalMs = 12000,
    enabled = true,
    revalidateOnFocus = true,
  } = options;

  const syncFnRef = useRef(syncFn);
  syncFnRef.current = syncFn;
  const isSyncingRef = useRef(false);

  const runSync = async () => {
    if (!enabled || isSyncingRef.current) return;
    // Don't waste network/CPU if the user's tab is minimized or hidden
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    try {
      isSyncingRef.current = true;
      await syncFnRef.current();
    } catch (err) {
      // Quiet background sync catch - network blips are ignored
    } finally {
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Periodic background timer (only executes when document is visible)
    const timer = setInterval(() => {
      runSync();
    }, intervalMs);

    // 2. Revalidate when tab becomes active / window receives focus
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        runSync();
      }
    };

    if (revalidateOnFocus) {
      window.addEventListener('focus', handleFocusOrVisible);
      document.addEventListener('visibilitychange', handleFocusOrVisible);
    }

    return () => {
      clearInterval(timer);
      if (revalidateOnFocus) {
        window.removeEventListener('focus', handleFocusOrVisible);
        document.removeEventListener('visibilitychange', handleFocusOrVisible);
      }
    };
  }, [enabled, intervalMs, revalidateOnFocus]);
}
