import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';

export default function GenderSelectionModal() {
  const playerGender = useGameStore((s) => s.playerGender);
  const hasAnsweredGenderPrompt = useGameStore((s) => s.hasAnsweredGenderPrompt);
  const showGenderModal = useGameStore((s) => s.showGenderModal);
  const setPlayerGender = useGameStore((s) => s.setPlayerGender);
  const setShowGenderModal = useGameStore((s) => s.setShowGenderModal);

  const isOpen = showGenderModal || !hasAnsweredGenderPrompt;
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gender-selection-title"
      data-testid="gender-selection-modal"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(14, 9, 18, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(94vw, 460px)',
          maxHeight: 'calc(100dvh - 28px)',
          overflowY: 'auto',
          background: '#FBF7EE',
          color: '#261B19',
          borderRadius: 14,
          border: `1.5px solid ${COLORS.gold}`,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.58)',
          padding: '24px 26px 22px',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: '#8C6828',
            marginBottom: 8,
          }}
        >
          Our Love Museum · Visitor Profile
        </div>

        <h2
          id="gender-selection-title"
          style={{
            margin: '0 0 10px',
            fontSize: 'clamp(20px, 3.6vw, 25px)',
            fontWeight: 500,
            color: '#221715',
            lineHeight: 1.3,
          }}
        >
          Are you playing as the Girl or the Boy?
        </h2>

        <p
          style={{
            margin: '0 0 20px',
            fontSize: 13.5,
            lineHeight: 1.55,
            color: '#5C4B48',
          }}
        >
          Choose who arranges and gives custom bouquets during your visit. You can change this anytime in settings.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <button
            type="button"
            data-testid="btn-select-girl"
            onClick={() => setPlayerGender('girl')}
            style={{
              padding: '15px 14px',
              borderRadius: 12,
              border:
                playerGender === 'girl'
                  ? '2px solid #9E2A4B'
                  : '1px solid rgba(158, 42, 75, 0.34)',
              background:
                playerGender === 'girl'
                  ? 'linear-gradient(160deg, #FDF0F3, #F8DCE4)'
                  : '#FFFDF8',
              color: '#3B1823',
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 6px 18px rgba(42, 18, 28, 0.08)',
            }}
          >
            <span style={{ fontSize: 22 }} aria-hidden="true">✿</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Girl</span>
            <span style={{ fontSize: 11.5, color: '#6E4652' }}>
              Creates &amp; gives to Boy
            </span>
          </button>

          <button
            type="button"
            data-testid="btn-select-boy"
            onClick={() => setPlayerGender('boy')}
            style={{
              padding: '15px 14px',
              borderRadius: 12,
              border:
                playerGender === 'boy'
                  ? '2px solid #2A436B'
                  : '1px solid rgba(42, 67, 107, 0.34)',
              background:
                playerGender === 'boy'
                  ? 'linear-gradient(160deg, #EFF4FC, #DDE8F7)'
                  : '#FFFDF8',
              color: '#19263D',
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 6px 18px rgba(24, 34, 54, 0.08)',
            }}
          >
            <span style={{ fontSize: 22 }} aria-hidden="true">❦</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Boy</span>
            <span style={{ fontSize: 11.5, color: '#465875' }}>
              Creates &amp; gives to Girl
            </span>
          </button>
        </div>

        {hasAnsweredGenderPrompt && (
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              data-testid="btn-close-gender-modal"
              onClick={() => setShowGenderModal(false)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: '1px solid rgba(110, 90, 74, 0.32)',
                background: 'transparent',
                color: '#5C4B48',
                fontSize: 12.5,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
              }}
            >
              Keep Current Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
