import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { buildAlbumSpreads } from '../../utils/loveAlbum';
import { getMemoryArtworkDataUrl } from '../../utils/memoryArt';
import type { MuseumPhotoItem } from '../../utils/museumContentTypes';
import { COLORS } from '../../utils/constants';

export default function LoveAlbumModal() {
  const showLoveAlbum = useGameStore((s) => s.showLoveAlbum);
  const albumSpreadIndex = useGameStore((s) => s.albumSpreadIndex);
  const photos = useGameStore((s) => s.photos);
  const textsMap = useGameStore((s) => s.textsMap);
  const showPhotoViewer = useGameStore((s) => s.showPhotoViewer);

  const setShowLoveAlbum = useGameStore((s) => s.setShowLoveAlbum);
  const setAlbumSpreadIndex = useGameStore((s) => s.setAlbumSpreadIndex);
  const openMemory = useGameStore((s) => s.openMemory);

  const [flipDirection, setFlipDirection] = useState<1 | -1>(1);

  const spreads = useMemo(() => buildAlbumSpreads(photos), [photos]);
  const totalSpreads = spreads.length;
  const clampedIdx = Math.min(albumSpreadIndex, Math.max(0, totalSpreads - 1));
  const currentSpread = spreads[clampedIdx] ?? spreads[0];

  const coverTitle = textsMap.album_cover_title || 'Our Love Story';
  const coverSubtitle = textsMap.album_cover_subtitle || 'A Living Chronicle of Us';

  const goPrev = () => {
    if (clampedIdx > 0) {
      setFlipDirection(-1);
      setAlbumSpreadIndex(clampedIdx - 1);
    }
  };

  const goNext = () => {
    if (clampedIdx < totalSpreads - 1) {
      setFlipDirection(1);
      setAlbumSpreadIndex(clampedIdx + 1);
    }
  };

  useEffect(() => {
    if (!showLoveAlbum || showPhotoViewer) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLoveAlbum(false);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (clampedIdx > 0) {
          setFlipDirection(-1);
          setAlbumSpreadIndex(clampedIdx - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (clampedIdx < totalSpreads - 1) {
          setFlipDirection(1);
          setAlbumSpreadIndex(clampedIdx + 1);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showLoveAlbum, showPhotoViewer, clampedIdx, totalSpreads, setAlbumSpreadIndex, setShowLoveAlbum]);

  if (!showLoveAlbum) return null;

  const renderPage = (photo: MuseumPhotoItem | null, pageNum: number, side: 'left' | 'right') => {
    const imgUrl = photo ? getMemoryArtworkDataUrl(photo) : '';

    return (
      <div
        data-testid={`album-page-${side}`}
        style={{
          flex: '1 1 320px',
          minHeight: 410,
          background:
            side === 'left'
              ? 'linear-gradient(90deg, #F7F2E7 0%, #FBF9F5 88%, #EADFC9 100%)'
              : 'linear-gradient(90deg, #EADFC9 0%, #FBF9F5 12%, #F7F2E7 100%)',
          borderRadius: side === 'left' ? '10px 4px 4px 10px' : '4px 10px 10px 4px',
          padding: '22px 24px 18px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid rgba(200, 165, 90, 0.35)',
          boxShadow:
            side === 'left'
              ? 'inset -10px 0 18px rgba(72, 46, 36, 0.12)'
              : 'inset 10px 0 18px rgba(72, 46, 36, 0.12)',
          color: '#231921',
          fontFamily: 'Georgia, Times New Roman, serif',
        }}
      >
        {/* Decorative Double Border */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            border: '1px solid rgba(200, 165, 90, 0.36)',
            borderRadius: 6,
            pointerEvents: 'none',
          }}
        />

        {photo ? (
          <>
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: '#8f6c32',
                  textAlign: 'center',
                  marginBottom: 10,
                }}
              >
                {photo.section} · {photo.date}
              </div>

              {/* Photo Card with Enlarge Action */}
              <button
                type="button"
                data-testid={`btn-enlarge-album-photo-${side}`}
                onClick={() => openMemory(photo)}
                aria-label={`Enlarge ${photo.title}`}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#ffffff',
                  border: '1px solid rgba(200, 165, 90, 0.5)',
                  borderRadius: 4,
                  boxShadow: '0 8px 20px rgba(45, 24, 38, 0.14)',
                  cursor: 'pointer',
                  display: 'block',
                  position: 'relative',
                  marginBottom: 14,
                }}
              >
                <img
                  src={imgUrl}
                  alt={photo.title}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 215,
                    objectFit: 'cover',
                    borderRadius: 2,
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    right: 14,
                    background: 'rgba(28, 16, 28, 0.84)',
                    color: '#fff4da',
                    fontSize: 10,
                    letterSpacing: 0.7,
                    padding: '4px 9px',
                    borderRadius: 12,
                    border: '1px solid rgba(200, 165, 90, 0.55)',
                  }}
                >
                  ⤢ Enlarge
                </span>
              </button>

              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 19,
                  fontWeight: 600,
                  color: '#2b1824',
                  textAlign: 'center',
                }}
              >
                {photo.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: '#523b49',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                “{photo.description}”
              </p>
            </div>

            <div
              style={{
                marginTop: 14,
                textAlign: 'center',
                fontSize: 11,
                color: '#9b773c',
                letterSpacing: 1.2,
              }}
            >
              — Page {pageNum} —
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 20,
            }}
          >
            <div style={{ fontSize: 32, color: '#c4728a', marginBottom: 10 }}>♡</div>
            <div style={{ fontSize: 18, color: '#3b2131', fontWeight: 600, marginBottom: 6 }}>
              {coverTitle}
            </div>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: '#735364' }}>
              More cherished memories to be written together.
            </div>
            <div style={{ marginTop: 22, fontSize: 11, color: '#9b773c' }}>— Page {pageNum} —</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="love-album-title"
      data-testid="love-album-modal"
      className="ui-overlay"
      onClick={() => setShowLoveAlbum(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 6, 15, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px 14px',
        zIndex: 980,
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(96vw, 960px)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #4b1d32, #2d1120)',
          border: `2px solid ${COLORS.gold}`,
          borderRadius: 16,
          padding: '18px 20px 20px',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.78)',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top Album Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.8,
                textTransform: 'uppercase',
                color: COLORS.goldLight,
              }}
            >
              ✦ {coverSubtitle}
            </div>
            <h2
              id="love-album-title"
              style={{ margin: '2px 0 0', fontSize: 23, color: '#fff7e8', fontWeight: 500 }}
            >
              {coverTitle}
            </h2>
          </div>

          <button
            type="button"
            data-testid="btn-close-love-album"
            onClick={() => setShowLoveAlbum(false)}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              background: 'rgba(200, 165, 90, 0.18)',
              border: `1px solid ${COLORS.gold}`,
              color: '#fff4d6',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Close Album ✕
          </button>
        </div>

        {/* Open Two-Page Book Spread with Page-Turn Animation */}
        <div style={{ perspective: 1400 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={clampedIdx}
              initial={{ opacity: 0.4, rotateY: flipDirection * 18 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0.4, rotateY: flipDirection * -18 }}
              transition={{ duration: 0.34, ease: 'easeOut' }}
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                background: '#3d1729',
                padding: 8,
                borderRadius: 12,
                border: '1px solid rgba(200, 165, 90, 0.45)',
              }}
            >
              {renderPage(currentSpread?.leftPage ?? null, currentSpread?.leftPageNumber ?? 1, 'left')}
              {renderPage(currentSpread?.rightPage ?? null, currentSpread?.rightPageNumber ?? 2, 'right')}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
            gap: 12,
          }}
        >
          <button
            type="button"
            data-testid="btn-album-prev"
            disabled={clampedIdx <= 0}
            onClick={goPrev}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: clampedIdx <= 0 ? 'rgba(255,255,255,0.06)' : 'rgba(200, 165, 90, 0.22)',
              border: `1px solid ${clampedIdx <= 0 ? 'rgba(255,255,255,0.16)' : COLORS.gold}`,
              color: clampedIdx <= 0 ? 'rgba(255,255,255,0.35)' : '#fff4d8',
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: clampedIdx <= 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Previous Page
          </button>

          <div
            data-testid="album-spread-indicator"
            style={{
              fontSize: 13,
              color: COLORS.goldLight,
              letterSpacing: 0.8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Spread {clampedIdx + 1} of {totalSpreads}
          </div>

          <button
            type="button"
            data-testid="btn-album-next"
            disabled={clampedIdx >= totalSpreads - 1}
            onClick={goNext}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background:
                clampedIdx >= totalSpreads - 1 ? 'rgba(255,255,255,0.06)' : 'rgba(200, 165, 90, 0.22)',
              border: `1px solid ${
                clampedIdx >= totalSpreads - 1 ? 'rgba(255,255,255,0.16)' : COLORS.gold
              }`,
              color: clampedIdx >= totalSpreads - 1 ? 'rgba(255,255,255,0.35)' : '#fff4d8',
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: clampedIdx >= totalSpreads - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Next Page →
          </button>
        </div>
      </div>
    </div>
  );
}
