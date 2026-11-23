import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function LoadingScreen() {
  const { isLoading, setIsLoading } = useGameStore();
  const [progress, setProgress] = useState(0);
  const [showEnter, setShowEnter] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowEnter(true);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleEnter = () => {
    setIsLoading(false);
  };

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #1a0a1a, #0a0a2a, #1a0a1a)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            fontFamily: 'Georgia, serif',
          }}
        >
          {/* Background particles */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                }}
                animate={{
                  y: [null, Math.random() * window.innerHeight],
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
                style={{
                  position: 'absolute',
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
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
          >
            <div style={{
              fontSize: 60,
              marginBottom: 15,
            }}>
              ♡
            </div>
            <h1 style={{
              fontSize: 42,
              color: '#c8a55a',
              fontWeight: 300,
              letterSpacing: 8,
              marginBottom: 8,
              textShadow: '0 0 30px rgba(200,165,90,0.3)',
            }}>
              OUR LOVE
            </h1>
            <h2 style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 300,
              letterSpacing: 12,
              marginBottom: 50,
            }}>
              MUSEUM
            </h2>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              width: 300,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {!showEnter ? (
              <>
                <div style={{
                  width: '100%',
                  height: 2,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}>
                  <motion.div
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #c8a55a, #e8d58a)',
                      borderRadius: 1,
                    }}
                  />
                </div>
                <p style={{
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  marginTop: 15,
                  letterSpacing: 2,
                }}>
                  PREPARING YOUR EXPERIENCE...
                </p>
              </>
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnter}
                style={{
                  display: 'block',
                  margin: '0 auto',
                  padding: '14px 48px',
                  background: 'transparent',
                  border: '1px solid #c8a55a',
                  color: '#c8a55a',
                  fontSize: 16,
                  fontFamily: 'Georgia, serif',
                  letterSpacing: 4,
                  cursor: 'pointer',
                  borderRadius: 30,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(200,165,90,0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                ENTER
              </motion.button>
            )}
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.5 }}
            style={{
              position: 'absolute',
              bottom: 30,
              color: '#fff',
              fontSize: 11,
              letterSpacing: 3,
            }}
          >
            A JOURNEY THROUGH OUR MEMORIES
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
