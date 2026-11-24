import { useEffect, useState, type FormEvent } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  bootstrapAdmin,
  fetchAdminStatus,
  loginAdmin,
} from '../../utils/apiClient';
import { COLORS } from '../../utils/constants';

export default function AdminLoginModal() {
  const showAdminLogin = useGameStore((s) => s.showAdminLogin);
  const adminToken = useGameStore((s) => s.adminToken);
  const setShowAdminLogin = useGameStore((s) => s.setShowAdminLogin);
  const setShowAdminPanel = useGameStore((s) => s.setShowAdminPanel);
  const setAdminSession = useGameStore((s) => s.setAdminSession);

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!showAdminLogin) return;
    let cancelled = false;
    setCheckingStatus(true);
    setErrorMsg(null);

    fetchAdminStatus(adminToken)
      .then((status) => {
        if (cancelled) return;
        if (status.authenticated && status.admin) {
          setShowAdminLogin(false);
          setShowAdminPanel(true);
          return;
        }
        setSetupRequired(status.setupRequired);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg('Unable to reach curator authentication service.');
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingStatus(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showAdminLogin, adminToken, setShowAdminLogin, setShowAdminPanel]);

  useEffect(() => {
    if (!showAdminLogin) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAdminLogin(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAdminLogin, setShowAdminLogin]);

  if (!showAdminLogin) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
    setShowAdminLogin(false);
  };

  const handleBootstrap = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bootstrapAdmin(username.trim(), email.trim(), password);
      setAdminSession(res.token, res.admin);
      setPassword('');
      setConfirmPassword('');
      setShowAdminLogin(false);
      setShowAdminPanel(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create curator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your username/email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAdmin(identifier.trim(), password);
      setAdminSession(res.token, res.admin);
      setPassword('');
      setShowAdminLogin(false);
      setShowAdminPanel(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(200, 165, 90, 0.36)',
    background: '#24182d',
    color: '#fdf7ec',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="curator-auth-title"
      data-testid="admin-login-modal"
      className="ui-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 6, 14, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1250,
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(94vw, 440px)',
          background: '#170f1d',
          border: `1px solid ${COLORS.gold}`,
          borderRadius: 16,
          padding: '24px 26px',
          color: '#f8f1e5',
          fontFamily: 'Georgia, serif',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.78)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
            borderBottom: '1px solid rgba(200, 165, 90, 0.24)',
            paddingBottom: 12,
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
              Private Access
            </div>
            <h2
              id="curator-auth-title"
              style={{ margin: '3px 0 0', fontSize: 20, color: '#fff7e6', fontWeight: 500 }}
            >
              {checkingStatus
                ? 'Checking Curator Status...'
                : setupRequired
                ? 'Claim Curator Account'
                : 'Curator Sign In'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close curator access dialog"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(200, 165, 90, 0.35)',
              color: '#f7efe3',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            data-testid="admin-auth-error"
            style={{
              background: 'rgba(180, 48, 72, 0.25)',
              border: '1px solid #f07b8a',
              color: '#ffd6dd',
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {errorMsg}
          </div>
        )}

        {checkingStatus ? (
          <p style={{ fontSize: 13, color: 'rgba(248, 241, 229, 0.72)' }}>
            Verifying museum curator configuration...
          </p>
        ) : setupRequired ? (
          <form onSubmit={handleBootstrap} noValidate data-testid="admin-bootstrap-form">
            <p
              style={{
                fontSize: 12.5,
                lineHeight: 1.5,
                color: 'rgba(248, 241, 229, 0.78)',
                marginTop: 0,
                marginBottom: 14,
              }}
            >
              Create your private museum curator login to manage photos, videos, text, and music.
            </p>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="admin-setup-username" style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#e8d7b3' }}>
                Username
              </label>
              <input
                id="admin-setup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="curator"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="admin-setup-email" style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#e8d7b3' }}>
                Email Address
              </label>
              <input
                id="admin-setup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="admin-setup-password" style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#e8d7b3' }}>
                Password (min 8 chars)
              </label>
              <input
                id="admin-setup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="admin-setup-confirm" style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#e8d7b3' }}>
                Confirm Password
              </label>
              <input
                id="admin-setup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              data-testid="btn-admin-bootstrap-submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 10,
                border: `1px solid ${COLORS.goldLight}`,
                background: COLORS.gold,
                color: '#1b1020',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'inherit',
                cursor: isSubmitting ? 'wait' : 'pointer',
              }}
            >
              {isSubmitting ? 'Creating Curator Studio...' : 'Create Curator Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} noValidate data-testid="admin-login-form">
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="admin-login-identifier" style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#e8d7b3' }}>
                Username or Email
              </label>
              <input
                id="admin-login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="curator or you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="admin-login-password" style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#e8d7b3' }}>
                Password
              </label>
              <input
                id="admin-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              data-testid="btn-admin-login-submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 10,
                border: `1px solid ${COLORS.goldLight}`,
                background: COLORS.gold,
                color: '#1b1020',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'inherit',
                cursor: isSubmitting ? 'wait' : 'pointer',
              }}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
