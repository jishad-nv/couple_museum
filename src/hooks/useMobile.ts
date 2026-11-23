import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useMobile() {
  const setIsMobile = useGameStore((s) => s.setIsMobile);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobile(isTouchDevice && isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);
}
