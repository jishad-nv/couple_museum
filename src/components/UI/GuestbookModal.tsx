import { useState, useEffect, type FormEvent } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  GUESTBOOK_STAMPS,
  MAX_AUTHOR_LENGTH,
  MAX_MESSAGE_LENGTH,
  formatGuestbookTime,
  validateGuestbookInput,
  type GuestbookStamp,
} from '../../utils/guestbook';
import { COLORS } from '../../utils/constants';

export default function GuestbookModal() {
  const showGuestbookModal = useGameStore((s) => s.showGuestbookModal);
  const guestbookEntries = useGameStore((s) => s.guestbookEntries);
  const setShowGuestbookModal = useGameStore((s) => s.setShowGuestbookModal);
  const submitGuestbookNote = useGameStore((s) => s.submitGuestbookNote);

  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [stamp, setStamp] = useState<GuestbookStamp>('♡');
  const [authorError, setAuthorError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!showGuestbookModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGuestbookModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuestbookModal, setShowGuestbookModal]);

  if (!showGuestbookModal) return null;

  const handleClose = () => {
    setAuthorError(null);
    setMessageError(null);
    setShowGuestbookModal(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const validation = validateGuestbookInput(author, message);
    setAuthorError(validation.authorError);
    setMessageError(validation.messageError);

    if (!validation.valid) return;

    setIsSubmitting(true);
    try {
      await submitGuestbookNote(author, message, stamp);
      setAuthor('');
      setMessage('');
      setStamp('♡');
      setAuthorError(null);
      setMessageError(null);
      setShowGuestbookModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="ui-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guestbook-modal-title"
      data-testid="guestbook-modal"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(14, 8, 18, 0.84)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1200,
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#1e1324',
          border: `1px solid ${COLORS.gold}`,
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          padding: '22px 24px',
          color: '#f7f1e6',
          fontFamily: 'Georgia, Times New Roman, serif',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            borderBottom: '1px solid rgba(200, 165, 90, 0.25)',
            paddingBottom: 12,
          }}
        >
          <div>
            <h2
              id="guestbook-modal-title"
              style={{
                margin: 0,
                fontSize: 20,
                color: COLORS.gold,
                fontWeight: 500,
                letterSpacing: 1,
              }}
            >
              ✦ Museum Guestbook
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: 'rgba(247, 241, 230, 0.68)',
              }}
            >
              Leave a virtual note for future visitors in the Entrance Hall
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close guestbook"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(200, 165, 90, 0.35)',
              color: '#f7f1e6',
              fontSize: 16,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="guestbook-author"
              style={{
                display: 'block',
                fontSize: 12,
                color: '#e8d7b3',
                marginBottom: 6,
                letterSpacing: 0.4,
              }}
            >
              Your Name
            </label>
            <input
              id="guestbook-author"
              type="text"
              value={author}
              maxLength={MAX_AUTHOR_LENGTH}
              onChange={(e) => {
                setAuthor(e.target.value);
                if (authorError) setAuthorError(null);
              }}
              placeholder="e.g. Maya & Leo"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: authorError
                  ? '1px solid #f07b8a'
                  : '1px solid rgba(200, 165, 90, 0.4)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            {authorError && (
              <p
                role="alert"
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: '#ff9aa8',
                }}
              >
                {authorError}
              </p>
            )}
          </div>

          {/* Stamp selector */}
          <div style={{ marginBottom: 14 }}>
            <span
              id="guestbook-stamp-label"
              style={{
                display: 'block',
                fontSize: 12,
                color: '#e8d7b3',
                marginBottom: 6,
                letterSpacing: 0.4,
              }}
            >
              Choose a Stamp
            </span>
            <div
              role="radiogroup"
              aria-labelledby="guestbook-stamp-label"
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
            >
              {GUESTBOOK_STAMPS.map((option) => {
                const selected = stamp === option.symbol;
                return (
                  <button
                    key={option.symbol}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setStamp(option.symbol)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: selected
                        ? `1px solid ${COLORS.gold}`
                        : '1px solid rgba(200, 165, 90, 0.25)',
                      background: selected
                        ? 'rgba(200, 165, 90, 0.24)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: selected ? '#fff5da' : '#d5c7b2',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span aria-hidden="true">{option.symbol}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message textarea */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <label
                htmlFor="guestbook-message"
                style={{
                  fontSize: 12,
                  color: '#e8d7b3',
                  letterSpacing: 0.4,
                }}
              >
                Your Virtual Note
              </label>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(247, 241, 230, 0.55)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <textarea
              id="guestbook-message"
              rows={3}
              value={message}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => {
                setMessage(e.target.value);
                if (messageError) setMessageError(null);
              }}
              placeholder="Write a memory, kind wish, or favorite room..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: messageError
                  ? '1px solid #f07b8a'
                  : '1px solid rgba(200, 165, 90, 0.4)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            {messageError && (
              <p
                role="alert"
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: '#ff9aa8',
                }}
              >
                {messageError}
              </p>
            )}
          </div>

          {/* Submit / Cancel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: '#ded4c4',
                fontSize: 13,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: `1px solid ${COLORS.gold}`,
                background: COLORS.gold,
                color: '#1b1121',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Pin Note to Guestbook
            </button>
          </div>
        </form>

        {/* Archive of all notes */}
        <div
          style={{
            borderTop: '1px solid rgba(200, 165, 90, 0.25)',
            paddingTop: 14,
          }}
        >
          <h3
            style={{
              margin: '0 0 10px',
              fontSize: 13,
              color: '#e8d7b3',
              fontWeight: 500,
              letterSpacing: 0.6,
            }}
          >
            All Visitor Notes ({guestbookEntries.length})
          </h3>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 190,
              overflowY: 'auto',
            }}
          >
            {guestbookEntries.map((entry) => (
              <li
                key={entry.id}
                style={{
                  background: 'rgba(255, 248, 236, 0.05)',
                  border: '1px solid rgba(200, 165, 90, 0.18)',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.gold }}>
                    {entry.stamp} {entry.author}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(247, 241, 230, 0.55)' }}>
                    {formatGuestbookTime(entry.createdAt)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, color: '#f3ece0' }}>
                  {entry.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
