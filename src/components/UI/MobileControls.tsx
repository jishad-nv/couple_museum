import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { isProposalBusy } from '../../utils/proposal';

export default function MobileControls() {
  const isMobile = useGameStore((s) => s.isMobile);
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
  const showAdminLogin = useGameStore((s) => s.showAdminLogin);
  const showAdminPanel = useGameStore((s) => s.showAdminPanel);

  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 390
  );
  const joystickCenter = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isCompactPhone = viewportWidth <= 420;
  const joystickSize = isCompactPhone ? 46 : 54;
  const actionBtnSize = isCompactPhone ? 52 : 58;

  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setJoystickActive(true);
  }, []);

  const handleJoystickMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!joystickActive) return;

      const touch = e.touches[0];
      let dx = touch.clientX - joystickCenter.current.x;
      let dy = touch.clientY - joystickCenter.current.y;

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
    [joystickActive, joystickSize, setJoystickInput]
  );

  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    setJoystickInput({ x: 0, y: 0 });
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, [setJoystickInput]);

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
    showAdminLogin ||
    showAdminPanel;

  if (!isMobile || modalOpen || isProposalBusy(proposalStage)) return null;

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
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          left: 'calc(14px + env(safe-area-inset-left))',
          width: joystickSize * 2 + 16,
          height: joystickSize * 2 + 16,
          borderRadius: '50%',
          background: 'rgba(20, 12, 26, 0.34)',
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
      >
        <div
          ref={knobRef}
          style={{
            width: isCompactPhone ? 42 : 48,
            height: isCompactPhone ? 42 : 48,
            borderRadius: '50%',
            background: 'rgba(255, 245, 232, 0.42)',
            border: '1.5px solid rgba(255, 255, 255, 0.62)',
            transition: joystickActive ? 'none' : 'transform 0.2s ease',
          }}
        />
      </div>

      {/* Action buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          right: 'calc(14px + env(safe-area-inset-right))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
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
            background: 'rgba(176, 128, 54, 0.56)',
            border: '2px solid rgba(235, 198, 120, 0.85)',
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
            background: 'rgba(24, 16, 32, 0.45)',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
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
