import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';
import { getMemoryArtworkDataUrl } from '../../utils/memoryArt';

const KIND_LABELS: Record<string, string> = {
  board: 'Central Memory Board',
  photo: 'Private Photograph',
  letter: 'Handwritten Love Letter',
  message: 'Saved Text & Message',
  code: 'Secret Shared Code',
};

export default function PrivateMemoryViewerModal() {
  const showPrivateMemoryModal = useGameStore((s) => s.showPrivateMemoryModal);
  const activePrivateMemory = useGameStore((s) => s.activePrivateMemory);
  const closePrivateMemory = useGameStore((s) => s.closePrivateMemory);

  if (!showPrivateMemoryModal || !activePrivateMemory) return null;

  const hasImage =
    Boolean(activePrivateMemory.photoSrc) ||
    activePrivateMemory.kind === 'photo' ||
    activePrivateMemory.kind === 'board';

  const imgUrl = hasImage
    ? getMemoryArtworkDataUrl({
        id: activePrivateMemory.id,
        title: activePrivateMemory.title,
        section: 'Special Moments',
        date: activePrivateMemory.dateLabel,
        description: activePrivateMemory.body,
        photoSrc: activePrivateMemory.photoSrc,
        palette: activePrivateMemory.palette,
        motif: activePrivateMemory.motif,
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="private-memory-title"
      data-testid="private-memory-modal"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 5, 14, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        zIndex: 1220,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(95vw, 660px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(160deg, #251322 0%, #150c18 100%)',
          border: `1.5px solid ${COLORS.gold}`,
          borderRadius: 20,
          padding: 26,
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.85)',
          color: '#fbf3e6',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        <button
          type="button"
          data-testid="btn-close-private-memory"
          aria-label="Close private memory"
          onClick={closePrivateMemory}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid rgba(200, 165, 90, 0.4)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#f8ebd4',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ✕
        </button>

        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: COLORS.goldLight,
            marginBottom: 6,
          }}
        >
          ✦ {KIND_LABELS[activePrivateMemory.kind] || 'Private Memory'} ·{' '}
          {activePrivateMemory.dateLabel}
        </div>

        <h2
          id="private-memory-title"
          style={{
            margin: '0 0 4px',
            fontSize: 25,
            fontWeight: 500,
            color: '#fff8ec',
            paddingRight: 36,
          }}
        >
          {activePrivateMemory.title}
        </h2>

        {activePrivateMemory.subtitle && (
          <div
            style={{
              fontSize: 13,
              color: 'rgba(248, 236, 224, 0.7)',
              marginBottom: 16,
              fontStyle: 'italic',
            }}
          >
            {activePrivateMemory.subtitle}
          </div>
        )}

        {imgUrl && (
          <div
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid rgba(200, 165, 90, 0.35)',
              marginBottom: 18,
              background: '#120a14',
            }}
          >
            <img
              src={imgUrl}
              alt={activePrivateMemory.title}
              style={{
                width: '100%',
                maxHeight: 340,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

        <div
          style={{
            background:
              activePrivateMemory.kind === 'letter'
                ? 'rgba(248, 234, 212, 0.96)'
                : 'rgba(255, 248, 238, 0.05)',
            color: activePrivateMemory.kind === 'letter' ? '#331d21' : '#f7ecdc',
            borderRadius: 14,
            padding: '18px 20px',
            border: '1px solid rgba(200, 165, 90, 0.28)',
            fontSize: 15,
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
            marginBottom: 18,
          }}
        >
          {activePrivateMemory.body}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {activePrivateMemory.secretCode ? (
            <div
              data-testid="private-memory-secret-code"
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: `1px solid ${COLORS.gold}`,
                background: 'rgba(200, 165, 90, 0.14)',
                color: COLORS.goldLight,
                fontSize: 12.5,
                letterSpacing: 1.4,
              }}
            >
              🔑 SECRET CODE: <strong>{activePrivateMemory.secretCode}</strong>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={closePrivateMemory}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: `1px solid ${COLORS.gold}`,
              background: COLORS.gold,
              color: '#1b101e',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
            }}
          >
            Return to Private Chamber
          </button>
        </div>
      </div>
    </div>
  );
}
