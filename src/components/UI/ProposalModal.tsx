import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';

export default function ProposalModal() {
  const showProposalModal = useGameStore((s) => s.showProposalModal);
  const acceptProposal = useGameStore((s) => s.acceptProposal);
  const declineProposal = useGameStore((s) => s.declineProposal);

  if (!showProposalModal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
      data-testid="proposal-modal"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(12, 6, 18, 0.08) 0%, rgba(12, 6, 18, 0.25) 55%, rgba(12, 6, 18, 0.62) 100%)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px 16px max(26px, env(safe-area-inset-bottom))',
        zIndex: 1200,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(94vw, 430px)',
          background: 'linear-gradient(155deg, rgba(40, 18, 36, 0.96) 0%, rgba(22, 12, 26, 0.96) 100%)',
          border: `1.5px solid ${COLORS.goldLight}`,
          borderRadius: 20,
          padding: '22px 24px 20px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.72)',
          color: '#fcf3e6',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: COLORS.goldLight,
            marginBottom: 8,
          }}
        >
          ✦ A Moment Forever ✦
        </div>

        <h2
          id="proposal-modal-title"
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(22px, 5vw, 28px)',
            fontWeight: 500,
            color: '#fff8ee',
            letterSpacing: 0.5,
          }}
        >
          Will you marry me? ❤️
        </h2>

        <p
          style={{
            margin: '0 0 18px',
            fontSize: 13.5,
            lineHeight: 1.5,
            color: 'rgba(248, 236, 224, 0.82)',
          }}
        >
          With this ring, every memory we&apos;ve built is only our beginning.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            data-testid="btn-proposal-yes"
            onClick={acceptProposal}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 12,
              border: `1.5px solid ${COLORS.goldLight}`,
              background: 'linear-gradient(135deg, #c73c68, #8c1f45)',
              color: '#fff9f2',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(199, 60, 104, 0.42)',
            }}
          >
            YES ❤️
          </button>

          <button
            type="button"
            data-testid="btn-proposal-no"
            onClick={declineProposal}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 12,
              border: '1px solid rgba(212, 188, 178, 0.36)',
              background: 'rgba(46, 30, 44, 0.9)',
              color: '#e8d7d9',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
            }}
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
