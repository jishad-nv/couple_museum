import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { unlockBackgroundAudio } from '../audio/BackgroundAudioManager';
import { tryLockLandscapeOrientation } from '../utils/orientation';
import { computeLoadingReadiness } from '../utils/loadingReadiness';

function deterministicParticle(i: number) {
  const h1 = Math.abs(Math.sin(i * 12.9898 + 1.7) * 43758.5453) % 1;
  const h2 = Math.abs(Math.sin(i * 78.233 + 3.1) * 29431.1357) % 1;
  const h3 = Math.abs(Math.sin(i * 39.425 + 7.3) * 19283.7412) % 1;
  return {
    leftPct: h1 * 100,
    topPct: h2 * 100,
    driftY: -25 - h3 * 45,
    duration: 3.5 + h3 * 3.5,
    delay: h1 * 2.5,
  };
}

export default function LoadingScreen() {
  const isLoading = useGameStore((s) => s.isLoading);
  const isMobile = useGameStore((s) => s.isMobile);
  const isPortrait = useGameStore((s) => s.isPortrait);
  const setIsLoading = useGameStore((s) => s.setIsLoading);
  const textsMap = useGameStore((s) => s.textsMap);
  const contentStatus = useGameStore((s) => s.contentStatus);
  const contentError = useGameStore((s) => s.contentError);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const retryLoadMuseumContent = useGameStore((s) => s.retryLoadMuseumContent);

  const [isShortViewport, setIsShortViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight < 500 : false
  );

  const particles = useMemo(
    () => Array.from({ length: 24 }, (_, i) => deterministicParticle(i)),
    []
  );

  const orientationBlocked = isMobile && isPortrait;
  const loadingTitle = textsMap.loading_title || 'OUR LOVE';
  const loadingSubtitle = textsMap.loading_subtitle || 'MUSEUM';
  const loadingTagline = textsMap.loading_tagline || 'A JOURNEY THROUGH OUR MEMORIES';

  const readiness = computeLoadingReadiness({
    contentStatus,
    sceneReady,
    contentError,
  });

  useEffect(() => {
    const syncHeight = () => setIsShortViewport(window.innerHeight < 500);
    window.addEventListener('resize', syncHeight);
    return () => window.removeEventListener('resize', syncHeight);
  }, []);

  const handleEnter = () => {
    if (!readiness.canEnter) return;
    unlockBackgroundAudio();
    if (isMobile) {
      void tryLockLandscapeOrientation();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading || !readiness.canEnter || orientationBlocked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        unlockBackgroundAudio();
        setIsLoading(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLoading, readiness.canEnter, orientationBlocked, setIsLoading]);

  if (orientationBlocked) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="museum-splash"
          data-testid="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            background:
              'radial-gradient(circle at 50% 38%, rgba(42, 22, 46, 0.94), rgba(11, 13, 28, 0.97) 70%, rgba(7, 10, 22, 0.99))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px env(safe-area-inset-right) 24px env(safe-area-inset-left)',
            zIndex: 10000,
            fontFamily: 'Georgia, serif',
            pointerEvents: isLoading ? 'auto' : 'none',
          }}
        >
          {/* Subtle golden floating particles */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {particles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  y: [0, p.driftY, 0],
                  opacity: [0, 0.42, 0],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                }}
                style={{
                  position: 'absolute',
                  left: `${p.leftPct}%`,
                  top: `${p.topPct}%`,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#c8a55a',
                }}
              />
            ))}
          </div>

          {/* Logo / Title */}
          <motion.div
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
          >
            <div
              style={{
                fontSize: isShortViewport ? 36 : 58,
                color: '#d8b467',
                marginBottom: isShortViewport ? 6 : 14,
              }}
            >
              ♡
            </div>
            <h1
              style={{
                fontSize: isShortViewport ? 28 : 42,
                color: '#c8a55a',
                fontWeight: 300,
                letterSpacing: isShortViewport ? 5 : 8,
                marginBottom: isShortViewport ? 4 : 8,
                textShadow: '0 0 30px rgba(200,165,90,0.3)',
              }}
            >
              {loadingTitle}
            </h1>
            <h2
              style={{
                fontSize: isShortViewport ? 14 : 18,
                color: 'rgba(255,255,255,0.58)',
                fontWeight: 300,
                letterSpacing: isShortViewport ? 8 : 12,
                marginBottom: isShortViewport ? 22 : 44,
              }}
            >
              {loadingSubtitle}
            </h2>
          </motion.div>

          {/* Real Readiness Progress / Enter / Retry */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{
              width: isShortViewport ? 280 : 320,
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
            }}
          >
            {readiness.isError ? (
              <div
                data-testid="loading-error-box"
                style={{
                  background: 'rgba(38, 16, 26, 0.85)',
                  border: '1px solid rgba(232, 130, 148, 0.45)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <p style={{ color: '#ffd8df', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                  {readiness.statusLabel}
                </p>
                <button
                  type="button"
                  data-testid="btn-retry-loading"
                  onClick={() => void retryLoadMuseumContent()}
                  style={{
                    padding: '10px 32px',
                    background: 'rgba(200,165,90,0.16)',
                    border: '1px solid #c8a55a',
                    color: '#f5dfa6',
                    fontSize: 13,
                    fontFamily: 'Georgia, serif',
                    letterSpacing: 3,
                    cursor: 'pointer',
                    borderRadius: 24,
                  }}
                >
                  RETRY
                </button>
              </div>
            ) : !readiness.canEnter ? (
              <>
                <div
                  style={{
                    width: '100%',
                    height: 3,
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ width: `${Math.min(readiness.percent, 100)}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #c8a55a, #e8d58a)',
                      borderRadius: 2,
                    }}
                  />
                </div>
                <p
                  data-testid="loading-status-label"
                  style={{
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.58)',
                    fontSize: 11.5,
                    marginTop: 14,
                    letterSpacing: 2,
                  }}
                >
                  {readiness.statusLabel}
                </p>
              </>
            ) : (
              <motion.button
                type="button"
                data-start="true"
                data-testid="btn-enter-museum"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleEnter}
                style={{
                  display: 'block',
                  margin: '0 auto',
                  padding: isShortViewport ? '11px 40px' : '14px 48px',
                  background: 'rgba(200,165,90,0.1)',
                  border: '1px solid #c8a55a',
                  color: '#ebd08d',
                  fontSize: isShortViewport ? 15 : 16,
                  fontFamily: 'Georgia, serif',
                  letterSpacing: 4,
                  cursor: 'pointer',
                  borderRadius: 30,
                  transition: 'all 0.25s ease',
                  boxShadow: '0 0 24px rgba(200, 165, 90, 0.22)',
                }}
              >
                ENTER
              </motion.button>
            )}
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 0.6 }}
            style={{
              position: 'absolute',
              bottom: isShortViewport ? 12 : 28,
              color: '#fff',
              fontSize: isShortViewport ? 10 : 11,
              letterSpacing: 3,
              pointerEvents: 'none',
            }}
          >
            {loadingTagline}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
