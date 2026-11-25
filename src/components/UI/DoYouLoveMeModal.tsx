import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';
import { pickNextNoButtonPosition } from '../../utils/secretMystery';

const YES_RECT = { x: 24, y: 52, width: 118, height: 46 };
const NO_SIZE = { width: 112, height: 46 };

export default function DoYouLoveMeModal() {
  const showDoYouLoveMeModal = useGameStore((s) => s.showDoYouLoveMeModal);
  const setShowDoYouLoveMeModal = useGameStore((s) => s.setShowDoYouLoveMeModal);
  const confirmDoYouLoveMeYes = useGameStore((s) => s.confirmDoYouLoveMeYes);

  const stageRef = useRef<HTMLDivElement>(null);
  const [noPos, setNoPos] = useState({ x: 204, y: 52 });
  const [escapeCount, setEscapeCount] = useState(0);
  const [confirmedPhase, setConfirmedPhase] = useState(false);

  useEffect(() => {
    if (showDoYouLoveMeModal) {
      setNoPos({ x: 204, y: 52 });
      setEscapeCount(0);
      setConfirmedPhase(false);
    }
  }, [showDoYouLoveMeModal]);

  if (!showDoYouLoveMeModal) return null;

  const escapeNoButton = () => {
    if (confirmedPhase) return;
    const rect = stageRef.current?.getBoundingClientRect();
    const stageW = rect?.width && rect.width > 200 ? rect.width : 360;
    const stageH = rect?.height && rect.height > 100 ? rect.height : 156;
    const next = pickNextNoButtonPosition(
      noPos,
      stageW,
      stageH,
      NO_SIZE.width,
      NO_SIZE.height,
      YES_RECT
    );
    setNoPos(next);
    setEscapeCount((c) => c + 1);
  };

  const handleYesClick = () => {
    if (confirmedPhase) return;
    setConfirmedPhase(true);
    setTimeout(() => {
      confirmDoYouLoveMeYes();
    }, 950);
  };

  const playfulNotes = [
    'Only one honest answer unlocks this door…',
    'Nice try—that button refuses to be pressed! ♡',
    'Still running away from NO… try YES ❤️',
    'Your heart already knows the right choice!',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="do-you-love-me-title"
      data-testid="do-you-love-me-modal"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 5, 16, 0.84)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        zIndex: 1200,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(94vw, 460px)',
          background: 'linear-gradient(155deg, #271324 0%, #170d1b 100%)',
          border: `1.5px solid ${COLORS.gold}`,
          borderRadius: 20,
          padding: '26px 26px 24px',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.78)',
          color: '#fcf3e6',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {!confirmedPhase && (
          <button
            type="button"
            data-testid="btn-love-close"
            aria-label="Close secret room question"
            onClick={() => setShowDoYouLoveMeModal(false)}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid rgba(200, 165, 90, 0.35)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#f5e6cc',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ✕
          </button>
        )}

        <div
          style={{
            fontSize: 11,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: COLORS.goldLight,
            marginBottom: 8,
          }}
        >
          ✦ Secret Room Entrance ✦
        </div>

        <h2
          id="do-you-love-me-title"
          style={{
            margin: '0 0 8px',
            fontSize: 27,
            fontWeight: 500,
            color: '#fff6ea',
            letterSpacing: 0.6,
          }}
        >
          DO YOU LOVE ME? ❤️
        </h2>

        <p
          style={{
            margin: '0 0 16px',
            fontSize: 13.5,
            lineHeight: 1.5,
            color: confirmedPhase ? '#ffd3df' : 'rgba(248, 236, 224, 0.78)',
            minHeight: 22,
          }}
        >
          {confirmedPhase
            ? 'Always & forever ❤️ Beginning the 5-Question Love Test…'
            : playfulNotes[Math.min(escapeCount, playfulNotes.length - 1)]}
        </p>

        {confirmedPhase ? (
          <div
            data-testid="love-confirmed-animation"
            style={{
              height: 156,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'rgba(196, 56, 98, 0.16)',
              borderRadius: 14,
              border: '1px solid rgba(244, 152, 180, 0.48)',
            }}
          >
            <div style={{ fontSize: 40, lineHeight: 1 }}>❤️ ✨ ❤️</div>
            <div style={{ fontSize: 15, color: '#fff3da', letterSpacing: 0.8 }}>
              Your heart answered YES — ready for the Love Quiz!
            </div>
          </div>
        ) : (
          <div
            ref={stageRef}
            data-testid="love-popup-stage"
            style={{
              position: 'relative',
              width: '100%',
              height: 156,
              borderRadius: 14,
              background: 'rgba(255, 245, 235, 0.04)',
              border: '1px solid rgba(200, 165, 90, 0.22)',
              overflow: 'hidden',
            }}
          >
            {/* Stationary YES Button */}
            <button
              type="button"
              data-testid="btn-love-yes"
              onClick={handleYesClick}
              style={{
                position: 'absolute',
                left: YES_RECT.x,
                top: YES_RECT.y,
                width: YES_RECT.width,
                height: YES_RECT.height,
                borderRadius: 12,
                border: `1.5px solid ${COLORS.goldLight}`,
                background: 'linear-gradient(135deg, #c73c68, #8c1f45)',
                color: '#fff9f2',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(199, 60, 104, 0.42)',
                zIndex: 2,
              }}
            >
              YES ❤️
            </button>

            {/* Playfully Escaping NO Button */}
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-love-no"
              onMouseEnter={escapeNoButton}
              onMouseMove={escapeNoButton}
              onPointerEnter={escapeNoButton}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                escapeNoButton();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                escapeNoButton();
              }}
              onFocus={(e) => {
                e.currentTarget.blur();
                escapeNoButton();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                escapeNoButton();
              }}
              style={{
                position: 'absolute',
                left: noPos.x,
                top: noPos.y,
                width: NO_SIZE.width,
                height: NO_SIZE.height,
                borderRadius: 12,
                border: '1px solid rgba(212, 188, 178, 0.36)',
                background: 'rgba(46, 30, 44, 0.9)',
                color: '#e8d7d9',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: 'not-allowed',
                transition:
                  'left 0.17s cubic-bezier(0.22, 1, 0.36, 1), top 0.17s cubic-bezier(0.22, 1, 0.36, 1)',
                userSelect: 'none',
                zIndex: 3,
              }}
            >
              NO 💔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
