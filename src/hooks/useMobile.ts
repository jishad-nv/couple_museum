import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  detectMobileTouchDevice,
  isPortraitViewport,
  readBrowserViewportSnapshot,
  tryLockLandscapeOrientation,
} from '../utils/orientation';

export function useMobile() {
  const setIsMobile = useGameStore((s) => s.setIsMobile);
  const setIsPortrait = useGameStore((s) => s.setIsPortrait);
  const setJoystickInput = useGameStore((s) => s.setJoystickInput);

  useEffect(() => {
    let rafId = 0;
    let settleTimer = 0;
    let attemptedLock = false;

    const syncViewportState = () => {
      const snap = readBrowserViewportSnapshot();
      const mobile = detectMobileTouchDevice(snap);
      const portrait = isPortraitViewport(snap.width, snap.height);

      setIsMobile(mobile);
      setIsPortrait(portrait);

      if (mobile && portrait) {
        setJoystickInput({ x: 0, y: 0 });
      }

      if (mobile && !attemptedLock) {
        attemptedLock = true;
        void tryLockLandscapeOrientation();
      }
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(syncViewportState);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(syncViewportState, 160);
    };

    syncViewportState();

    window.addEventListener('resize', scheduleSync);
    window.addEventListener('orientationchange', scheduleSync);
    window.visualViewport?.addEventListener('resize', scheduleSync);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('orientationchange', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
    };
  }, [setIsMobile, setIsPortrait, setJoystickInput]);
}
