import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { getMemoryArtworkDataUrl } from '../../utils/memoryArt';
import { COLORS } from '../../utils/constants';

export default function PhotoViewer() {
  const showPhotoViewer = useGameStore((s) => s.showPhotoViewer);
  const currentPhoto = useGameStore((s) => s.currentPhoto);
  const currentPhotoMessage = useGameStore((s) => s.currentPhotoMessage);
  const activeMemory = useGameStore((s) => s.activeMemory);
  const setCurrentPhoto = useGameStore((s) => s.setCurrentPhoto);

  const artworkUrl = useMemo(() => {
    if (!activeMemory) return '';
    return getMemoryArtworkDataUrl(activeMemory);
  }, [activeMemory]);

  useEffect(() => {
    if (!showPhotoViewer) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentPhoto(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPhotoViewer, setCurrentPhoto]);

  if (!showPhotoViewer) return null;

  const title = activeMemory?.title ?? 'Cherished Memory';
  const section = activeMemory?.section ?? 'Our Love Museum';
  const date = activeMemory?.date ?? '';
  const description = activeMemory?.description ?? currentPhotoMessage ?? '';

  return (
    <AnimatePresence>
      {showPhotoViewer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          data-testid="photo-viewer-modal"
          className="ui-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 6, 14, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            zIndex: 1150,
          }}
          onClick={() => setCurrentPhoto(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(92vw, 720px)',
              background: 'rgba(26, 16, 30, 0.96)',
              border: `1px solid ${COLORS.gold}`,
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
              fontFamily: 'Georgia, serif',
              color: '#f8f2e6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Header */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    color: COLORS.gold,
                    marginBottom: 4,
                  }}
                >
                  {section}
                  {date ? ` · ${date}` : ''}
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#fff6e4' }}>
                  {title}
                </h2>
              </div>

              <button
                type="button"
                data-testid="btn-close-photo-viewer"
                onClick={() => setCurrentPhoto(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  background: 'rgba(200, 165, 90, 0.16)',
                  border: `1px solid ${COLORS.gold}`,
                  color: '#fff4d6',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Close ✕
              </button>
            </div>

            {/* Framed Enlarged Photograph */}
            <div
              style={{
                width: '100%',
                padding: 8,
                background: 'linear-gradient(135deg, #c8a55a, #e8d58a, #c8a55a)',
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <div style={{ padding: 10, background: '#faf6ee', borderRadius: 2 }}>
                {artworkUrl ? (
                  <img
                    src={artworkUrl}
                    alt={title}
                    style={{
                      display: 'block',
                      width: '100%',
                      maxHeight: '52vh',
                      objectFit: 'cover',
                      borderRadius: 2,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #3a2338, #9c5268)',
                      color: '#fff',
                    }}
                  >
                    {currentPhoto}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: '#ebdfc9',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  maxWidth: 580,
                }}
              >
                "{description}"
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
