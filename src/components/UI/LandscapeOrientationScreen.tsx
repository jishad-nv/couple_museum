import { useState } from 'react';
import { COLORS } from '../../utils/constants';
import { tryLockLandscapeOrientation, type OrientationLockResult } from '../../utils/orientation';

export default function LandscapeOrientationScreen() {
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [isTryingLock, setIsTryingLock] = useState(false);

  const handleRequestLandscape = async () => {
    if (isTryingLock) return;
    setIsTryingLock(true);
    const result: OrientationLockResult = await tryLockLandscapeOrientation();
    setIsTryingLock(false);
    if (result === 'denied' || result === 'unsupported') {
      setLockNotice('Automatic rotation lock is not available here — please turn your phone sideways.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-prompt-title"
      data-testid="landscape-orientation-screen"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        background:
          'radial-gradient(circle at 50% 24%, rgba(124, 52, 86, 0.24), transparent 55%), linear-gradient(145deg, #1b0b1d 0%, #0b0b24 54%, #180c1c 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'calc(24px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) calc(24px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))',
        zIndex: 20000,
        fontFamily: 'Georgia, serif',
        color: '#fbf3e7',
        textAlign: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(92vw, 380px)',
          background: 'linear-gradient(155deg, rgba(36, 18, 34, 0.88), rgba(18, 12, 28, 0.92))',
          border: `1px solid rgba(200, 165, 90, 0.42)`,
          borderRadius: 24,
          padding: '32px 24px 28px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.72)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: COLORS.gold,
          }}
        >
          ✦ Our Love Museum ✦
        </div>

        {/* Animated Phone Portrait -> Landscape Rotation Illustration */}
        <div
          aria-hidden="true"
          data-testid="phone-rotation-illustration"
          style={{
            position: 'relative',
            width: 116,
            height: 92,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0',
          }}
        >
          {/* Curved gold rotation guide arrow */}
          <svg
            width="108"
            height="86"
            viewBox="0 0 108 86"
            fill="none"
            style={{ position: 'absolute', inset: 0, margin: 'auto', opacity: 0.72 }}
          >
            <path
              d="M24 22 C34 8, 66 8, 82 24"
              stroke="#e5c882"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
            <path
              d="M74 25 L83 25 L82 16"
              stroke="#e5c882"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Rotating minimalist phone frame */}
          <div className="phone-rotate-anim">
            <div
              style={{
                width: 38,
                height: 66,
                borderRadius: 8,
                border: `2px solid ${COLORS.goldLight}`,
                background: 'linear-gradient(160deg, rgba(200, 165, 90, 0.16), rgba(32, 18, 44, 0.9))',
                boxShadow: '0 0 22px rgba(200, 165, 90, 0.25)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  width: 12,
                  height: 2,
                  borderRadius: 2,
                  background: 'rgba(232, 206, 138, 0.7)',
                }}
              />
              <span style={{ color: '#f3b7c8', fontSize: 13, lineHeight: 1 }}>♡</span>
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  width: 8,
                  height: 2,
                  borderRadius: 2,
                  background: 'rgba(232, 206, 138, 0.55)',
                }}
              />
            </div>
          </div>
        </div>

        <h1
          id="landscape-prompt-title"
          style={{
            margin: 0,
            fontSize: 21,
            fontWeight: 500,
            lineHeight: 1.35,
            color: '#fff6e8',
            letterSpacing: 0.4,
          }}
        >
          Please rotate your phone to landscape
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: 'rgba(248, 236, 224, 0.76)',
            maxWidth: 290,
          }}
        >
          Turn your device sideways to explore our rooms, couple moments, and memories in full panoramic view.
        </p>

        <button
          type="button"
          data-testid="btn-try-landscape-lock"
          onClick={handleRequestLandscape}
          disabled={isTryingLock}
          style={{
            marginTop: 2,
            padding: '10px 20px',
            borderRadius: 999,
            border: `1px solid rgba(200, 165, 90, 0.55)`,
            background: 'rgba(200, 165, 90, 0.14)',
            color: COLORS.goldLight,
            fontSize: 12.5,
            letterSpacing: 0.9,
            fontFamily: 'Georgia, serif',
            cursor: 'pointer',
          }}
        >
          {isTryingLock ? 'Switching...' : 'Enter Landscape Mode'}
        </button>

        {lockNotice && (
          <p
            data-testid="landscape-lock-notice"
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.45,
              color: '#f2d49b',
              opacity: 0.9,
            }}
          >
            {lockNotice}
          </p>
        )}
      </div>
    </div>
  );
}
