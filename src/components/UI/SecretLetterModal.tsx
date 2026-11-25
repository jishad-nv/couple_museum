import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';
import { SECRET_ROMANTIC_LETTERS } from '../../utils/weddingAttire';

export default function SecretLetterModal() {
  const showSecretLetterModal = useGameStore((s) => s.showSecretLetterModal);
  const secretLetterIndex = useGameStore((s) => s.secretLetterIndex);
  const setShowSecretLetterModal = useGameStore((s) => s.setShowSecretLetterModal);
  const setSecretLetterIndex = useGameStore((s) => s.setSecretLetterIndex);

  if (!showSecretLetterModal) return null;

  const total = SECRET_ROMANTIC_LETTERS.length;
  const safeIndex = Math.max(0, Math.min(total - 1, secretLetterIndex));
  const letter = SECRET_ROMANTIC_LETTERS[safeIndex];

  return (
    <div
      data-testid="secret-letter-modal"
      role="dialog"
      aria-label="Our Secret Room Letters"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(12, 6, 14, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      <div
        style={{
          width: 'min(540px, 100%)',
          borderRadius: 18,
          background: 'linear-gradient(160deg, #2d1822, #1d1017)',
          border: `1px solid ${COLORS.gold}`,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          padding: '26px 26px 22px',
          color: '#f8efe5',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: 1.8,
              color: COLORS.goldLight,
              textTransform: 'uppercase',
            }}
          >
            Our Secret Room · Letter {safeIndex + 1} of {total}
          </span>
          <button
            type="button"
            data-testid="btn-close-secret-letter"
            onClick={() => setShowSecretLetterModal(false)}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid rgba(200, 165, 90, 0.4)',
              background: 'rgba(46, 24, 34, 0.9)',
              color: '#f7ead8',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>

        <h2 style={{ margin: '10px 0 4px', fontSize: 22, color: '#fff6ea', fontWeight: 600 }}>
          {letter.title}
        </h2>
        <div style={{ fontSize: 12, color: '#e3b2c0', marginBottom: 16 }}>{letter.date}</div>

        <div
          style={{
            background: 'rgba(248, 236, 218, 0.96)',
            color: '#342029',
            borderRadius: 12,
            padding: '20px 22px',
            border: '1px solid rgba(188, 148, 82, 0.5)',
            lineHeight: 1.75,
            fontSize: 15,
            fontStyle: 'italic',
          }}
        >
          <p style={{ margin: '0 0 14px' }}>“{letter.body}”</p>
          <div style={{ textAlign: 'right', fontStyle: 'normal', fontSize: 13, fontWeight: 600, color: '#6b3248' }}>
            — Forever Yours
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            data-testid="btn-prev-secret-letter"
            onClick={() => setSecretLetterIndex((safeIndex - 1 + total) % total)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid rgba(200, 165, 90, 0.36)',
              background: 'rgba(44, 24, 34, 0.85)',
              color: '#f7ede0',
              fontSize: 12,
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
            }}
          >
            ← Previous Letter
          </button>
          <button
            type="button"
            data-testid="btn-next-secret-letter"
            onClick={() => setSecretLetterIndex((safeIndex + 1) % total)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: `1px solid ${COLORS.gold}`,
              background: 'linear-gradient(135deg, rgba(154, 108, 44, 0.9), rgba(102, 66, 24, 0.9))',
              color: '#fff8ec',
              fontSize: 12,
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
            }}
          >
            Next Letter →
          </button>
        </div>
      </div>
    </div>
  );
}
