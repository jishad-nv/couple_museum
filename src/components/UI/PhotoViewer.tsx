import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export default function PhotoViewer() {
  const { showPhotoViewer, currentPhoto, currentPhotoMessage, setCurrentPhoto } =
    useGameStore();

  if (!showPhotoViewer) return null;

  return (
    <AnimatePresence>
      {showPhotoViewer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="ui-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
          onClick={() => setCurrentPhoto(null)}
        >
          {/* Photo display */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'relative',
              maxWidth: '80vw',
              maxHeight: '70vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Frame border */}
            <div
              style={{
                padding: 12,
                background: 'linear-gradient(135deg, #c8a55a, #e8d58a, #c8a55a)',
                borderRadius: 4,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Inner mat */}
              <div
                style={{
                  padding: 20,
                  background: '#faf8f5',
                }}
              >
                {/* Photo placeholder (shows colored rectangle since we don't have real photos) */}
                <div
                  style={{
                    width: '60vw',
                    maxWidth: 600,
                    height: '45vh',
                    maxHeight: 450,
                    background: 'linear-gradient(135deg, #e8a0b0, #d4a5b5, #c8a0c0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                  }}
                >
                  <div style={{
                    textAlign: 'center',
                    color: '#fff',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>♡</div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>
                      Place your photo at<br />
                      <code style={{ fontSize: 12, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 3 }}>
                        {currentPhoto}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Message */}
          {currentPhotoMessage && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{
                marginTop: 30,
                fontSize: 20,
                color: '#c8a55a',
                fontStyle: 'italic',
                textAlign: 'center',
                fontFamily: 'Georgia, serif',
                letterSpacing: 1,
              }}
            >
              "{currentPhotoMessage}"
            </motion.p>
          )}

          {/* Close hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.6 }}
            style={{
              position: 'absolute',
              bottom: 30,
              color: '#fff',
              fontSize: 14,
            }}
          >
            Click anywhere to close
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
