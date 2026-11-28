import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { isProposalBusy } from '../../utils/proposal';

export default function MobileControls() {
  const isMobile = useGameStore((s) => s.isMobile);
  const isPortrait = useGameStore((s) => s.isPortrait);
  const setJoystickInput = useGameStore((s) => s.setJoystickInput);
  const proposalStage = useGameStore((s) => s.proposalStage);
  const showGuestbookModal = useGameStore((s) => s.showGuestbookModal);
  const showPhotoViewer = useGameStore((s) => s.showPhotoViewer);
  const showVideoPlayer = useGameStore((s) => s.showVideoPlayer);
  const showLoveAlbum = useGameStore((s) => s.showLoveAlbum);
  const showSecretLetterModal = useGameStore((s) => s.showSecretLetterModal);
  const showDoYouLoveMeModal = useGameStore((s) => s.showDoYouLoveMeModal);
  const showLoveQuizModal = useGameStore((s) => s.showLoveQuizModal);
  const showPrivateMemoryModal = useGameStore((s) => s.showPrivateMemoryModal);
  const showProposalModal = useGameStore((s) => s.showProposalModal);
  const showPasswordModal = useGameStore((s) => s.showPasswordModal);
  const showAdminLogin = useGameStore((s) => s.showAdminLogin);
  const showAdminPanel = useGameStore((s) => s.showAdminPanel);

  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [viewport, setViewport] = useState(() =>
    typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 844, height: 390 }
  );
  const joystickCenter = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const syncSize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', syncSize);
    window.addEventListener('orientationchange', syncSize);
    return () => {
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('orientationchange', syncSize);
    };
  }, []);

  const isLandscapeMobile = viewport.width > viewport.height && viewport.height <= 520;
  const isCompactPhone = Math.min(viewport.width, viewport.height) <= 420;
  const joystickSize = isLandscapeMobile ? 44 : isCompactPhone ? 46 : 54;
  const actionBtnSize = isCompactPhone ? 50 : 56;

  const updateKnobFromTouch = useCallback(
    (clientX: number, clientY: number) => {
      let dx = clientX - joystickCenter.current.x;
      let dy = clientY - joystickCenter.current.y;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > joystickSize) {
        dx = (dx / dist) * joystickSize;
        dy = (dy / dist) * joystickSize;
      }

      setJoystickInput({ x: dx / joystickSize, y: dy / joystickSize });

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    },
    [joystickSize, setJoystickInput]
  );

  const handleJoystickStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0] || e.touches[0];
      if (!touch) return;
      activeTouchIdRef.current = touch.identifier;
      const rect = joystickRef.current?.getBoundingClientRect();
      if (rect) {
        joystickCenter.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      setJoystickActive(true);
      updateKnobFromTouch(touch.clientX, touch.clientY);
    },
    [updateKnobFromTouch]
  );

  const handleJoystickMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!joystickActive) return;

      const touch =
        Array.from(e.touches).find((t) => t.identifier === activeTouchIdRef.current) ||
        e.touches[0];
      if (!touch) return;
      updateKnobFromTouch(touch.clientX, touch.clientY);
    },
    [joystickActive, updateKnobFromTouch]
  );

  const handleJoystickEnd = useCallback(
    (e?: React.TouchEvent) => {
      if (e && activeTouchIdRef.current !== null) {
        const stillDown = Array.from(e.touches).some(
          (t) => t.identifier === activeTouchIdRef.current
        );
        if (stillDown) return;
      }
      activeTouchIdRef.current = null;
      setJoystickActive(false);
      setJoystickInput({ x: 0, y: 0 });
      if (knobRef.current) {
        knobRef.current.style.transform = 'translate(0px, 0px)';
      }
    },
    [setJoystickInput]
  );

  useEffect(() => {
    if (isPortrait) {
      handleJoystickEnd();
    }
  }, [isPortrait, handleJoystickEnd]);

  const handleInteract = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }));
    }, 100);
  }, []);

  const handleJump = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    }, 150);
  }, []);

  const modalOpen =
    showGuestbookModal ||
    showPhotoViewer ||
    showVideoPlayer ||
    showLoveAlbum ||
    showSecretLetterModal ||
    showDoYouLoveMeModal ||
    showLoveQuizModal ||
    showPrivateMemoryModal ||
    showProposalModal ||
    showPasswordModal ||
    showAdminLogin ||
    showAdminPanel;

  if (!isMobile || isPortrait || modalOpen || isProposalBusy(proposalStage)) return null;

  return (
    <div
      className="ui-overlay"
      data-testid="mobile-controls"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
        zIndex: 80,
        touchAction: 'none',
      }}
    >
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        data-testid="mobile-joystick"
        style={{
          position: 'absolute',
          bottom: isLandscapeMobile
            ? 'calc(12px + env(safe-area-inset-bottom))'
            : 'calc(18px + env(safe-area-inset-bottom))',
          left: 'calc(14px + env(safe-area-inset-left))',
          width: joystickSize * 2 + 16,
          height: joystickSize * 2 + 16,
          borderRadius: '50%',
          background: 'rgba(20, 12, 26, 0.36)',
          border: '1.5px solid rgba(255, 255, 255, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        <div
          ref={knobRef}
          style={{
            width: isLandscapeMobile || isCompactPhone ? 40 : 48,
            height: isLandscapeMobile || isCompactPhone ? 40 : 48,
            borderRadius: '50%',
            background: 'rgba(255, 245, 232, 0.44)',
            border: '1.5px solid rgba(255, 255, 255, 0.64)',
            transition: joystickActive ? 'none' : 'transform 0.2s ease',
          }}
        />
      </div>

      {/* Action buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: isLandscapeMobile
            ? 'calc(12px + env(safe-area-inset-bottom))'
            : 'calc(18px + env(safe-area-inset-bottom))',
          right: 'calc(14px + env(safe-area-inset-right))',
          display: 'flex',
          flexDirection: isLandscapeMobile ? 'row' : 'column',
          alignItems: 'center',
          gap: isLandscapeMobile ? 10 : 12,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          data-testid="btn-mobile-interact"
          aria-label="Interact"
          onClick={handleInteract}
          style={{
            width: actionBtnSize,
            height: actionBtnSize,
            borderRadius: '50%',
            background: 'rgba(176, 128, 54, 0.6)',
            border: '2px solid rgba(235, 198, 120, 0.88)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 'bold',
            cursor: 'pointer',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          E
        </button>

        <button
          type="button"
          data-testid="btn-mobile-jump"
          aria-label="Jump"
          onClick={handleJump}
          style={{
            width: actionBtnSize,
            height: actionBtnSize,
            borderRadius: '50%',
            background: 'rgba(24, 16, 32, 0.48)',
            border: '1.5px solid rgba(255, 255, 255, 0.44)',
            color: '#fff',
            fontSize: 19,
            cursor: 'pointer',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
