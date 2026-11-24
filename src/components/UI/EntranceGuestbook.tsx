import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  formatGuestbookTime,
  getRecentGuestbookEntries,
} from '../../utils/guestbook';
import { COLORS } from '../../utils/constants';

export default function EntranceGuestbook() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const guestbookEntries = useGameStore((s) => s.guestbookEntries);
  const showGuestbookModal = useGameStore((s) => s.showGuestbookModal);
  const showPhotoViewer = useGameStore((s) => s.showPhotoViewer);
  const showVideoPlayer = useGameStore((s) => s.showVideoPlayer);
  const showLoveAlbum = useGameStore((s) => s.showLoveAlbum);
  const showAdminLogin = useGameStore((s) => s.showAdminLogin);
  const showAdminPanel = useGameStore((s) => s.showAdminPanel);
  const setShowGuestbookModal = useGameStore((s) => s.setShowGuestbookModal);
  const isMobile = useGameStore((s) => s.isMobile);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (
    currentRoom !== 'entrance' ||
    showGuestbookModal ||
    showPhotoViewer ||
    showVideoPlayer ||
    showLoveAlbum ||
    showAdminLogin ||
    showAdminPanel
  ) {
    return null;
  }

  const compact = isMobile || isNarrow;
  const recentEntries = getRecentGuestbookEntries(guestbookEntries, compact ? 2 : 3);

  return (
    <section
      aria-label="Entrance Guestbook"
      data-testid="entrance-guestbook"
      className="ui-overlay"
      style={{
        position: 'fixed',
        top: compact ? 58 : 66,
        left: compact ? 10 : 20,
        width: compact ? 'min(260px, calc(100vw - 194px))' : 316,
        background: 'rgba(24, 14, 28, 0.88)',
        border: '1px solid rgba(200, 165, 90, 0.42)',
        borderRadius: 12,
        boxShadow: '0 14px 34px rgba(0, 0, 0, 0.45)',
        padding: isCollapsed ? '8px 12px' : compact ? '10px 12px' : '14px 16px',
        color: '#f7f1e6',
        fontFamily: 'Georgia, Times New Roman, serif',
        zIndex: 60,
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: COLORS.gold, fontSize: 14 }} aria-hidden="true">
            ✦
          </span>
          <h2
            style={{
              fontSize: compact ? 13 : 14,
              fontWeight: 600,
              letterSpacing: 0.8,
              color: '#f5e7c4',
              margin: 0,
            }}
          >
            Guestbook
          </h2>
          <span
            data-testid="guestbook-total-count"
            style={{
              fontSize: 11,
              color: '#d8c59e',
              background: 'rgba(200, 165, 90, 0.14)',
              border: '1px solid rgba(200, 165, 90, 0.28)',
              borderRadius: 10,
              padding: '1px 7px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {guestbookEntries.length} {guestbookEntries.length === 1 ? 'note' : 'notes'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Show recent guestbook notes' : 'Hide recent guestbook notes'}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(200, 165, 90, 0.3)',
            borderRadius: 6,
            color: '#e6d3a7',
            fontSize: 11,
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(245, 231, 196, 0.68)',
              marginTop: 4,
              marginBottom: compact ? 7 : 10,
            }}
          >
            Recent notes left in the Entrance Hall
          </p>

          {recentEntries.length === 0 ? (
            <div
              style={{
                padding: '12px 10px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed rgba(200, 165, 90, 0.3)',
                fontSize: 12,
                color: 'rgba(247, 241, 230, 0.72)',
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              No notes yet. Be the first visitor to sign!
            </div>
          ) : (
            <ul
              data-testid="recent-guestbook-list"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: compact ? 6 : 8,
                marginBottom: compact ? 8 : 12,
                maxHeight: compact ? 132 : 250,
                overflowY: 'auto',
              }}
            >
              {recentEntries.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    background: 'rgba(255, 248, 236, 0.06)',
                    border: '1px solid rgba(200, 165, 90, 0.22)',
                    borderRadius: 8,
                    padding: compact ? '6px 8px' : '8px 10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: compact ? 11 : 12,
                        fontWeight: 600,
                        color: COLORS.gold,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span aria-hidden="true">{entry.stamp}</span>
                      <span>{entry.author}</span>
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'rgba(247, 241, 230, 0.55)',
                        flexShrink: 0,
                      }}
                    >
                      {formatGuestbookTime(entry.createdAt)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: compact ? 11 : 12,
                      lineHeight: 1.35,
                      color: '#f3ece0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {entry.message}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowGuestbookModal(true)}
            style={{
              width: '100%',
              padding: compact ? '7px 12px' : '9px 14px',
              borderRadius: 8,
              background: 'rgba(200, 165, 90, 0.2)',
              border: `1px solid ${COLORS.gold}`,
              color: '#fff4d6',
              fontSize: compact ? 12 : 13,
              fontWeight: 600,
              letterSpacing: 0.6,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Leave a Note
          </button>
        </>
      )}
    </section>
  );
}
