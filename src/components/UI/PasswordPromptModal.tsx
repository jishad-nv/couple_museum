import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { verifySecretPassword } from '../../utils/apiClient';
import { COLORS } from '../../utils/constants';

export default function PasswordPromptModal() {
  const showPasswordModal = useGameStore((s) => s.showPasswordModal);
  const secretPasswordConfigured = useGameStore((s) => s.secretPasswordConfigured);
  const setShowPasswordModal = useGameStore((s) => s.setShowPasswordModal);
  const unlockOrEnterPrivateChamber = useGameStore((s) => s.unlockOrEnterPrivateChamber);
  const setSecretHintBanner = useGameStore((s) => s.setSecretHintBanner);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!showPasswordModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPasswordModal(false);
        setPassword('');
        setError(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPasswordModal, setShowPasswordModal]);

  if (!showPasswordModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the Secret Room password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const prog = await verifySecretPassword(password.trim());
      useGameStore.setState({ secretProgress: prog });
      setShowPasswordModal(false);
      setPassword('');
      setSecretHintBanner('Password accepted! Entering Our Secret Room...');
      unlockOrEnterPrivateChamber();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Incorrect password.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Secret Room Password"
      data-testid="secret-password-modal"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 6, 16, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1220,
        padding: 20,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'linear-gradient(145deg, rgba(38, 20, 32, 0.99), rgba(20, 11, 26, 0.99))',
          border: `1.5px solid ${COLORS.goldLight}`,
          borderRadius: 22,
          padding: '28px 24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.72)',
          color: '#fdf7ef',
          fontFamily: 'Georgia, serif',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, color: COLORS.gold, marginBottom: 6 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#fff9ed' }}>
            Password-Protected Secret Room
          </h2>
          <p style={{ fontSize: 13, color: '#e0c8b0', marginTop: 6, lineHeight: 1.45 }}>
            Enter the Secret Room password set by the administrator to unlock this door.
          </p>
        </div>

        {!secretPasswordConfigured && (
          <div
            data-testid="secret-password-unconfigured-notice"
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(195, 132, 42, 0.2)',
              border: '1px solid rgba(232, 185, 90, 0.45)',
              color: '#ffe8ba',
              fontSize: 12,
              textAlign: 'center',
              lineHeight: 1.45,
            }}
          >
            No Secret Room password has been configured yet. An administrator must set one in the
            Admin Panel before this room can be unlocked.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="secret-room-password-field"
              style={{ fontSize: 12, fontWeight: 600, color: COLORS.goldLight }}
            >
              Secret Room Password
            </label>
            <input
              id="secret-room-password-field"
              type="password"
              data-testid="secret-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(200, 165, 90, 0.4)',
                background: '#180e22',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              data-testid="secret-password-error"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(180, 40, 60, 0.25)',
                border: '1px solid rgba(240, 100, 120, 0.4)',
                color: '#ffc8d2',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              data-testid="btn-cancel-password"
              onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 10,
                border: '1px solid rgba(200, 165, 90, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#e2d4bc',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="btn-submit-password"
              disabled={busy}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 10,
                border: `1px solid ${COLORS.gold}`,
                background: COLORS.gold,
                color: '#1b1020',
                fontSize: 13,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Verifying...' : 'Unlock Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
