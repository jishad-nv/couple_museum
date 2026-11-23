import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';

export default function HUD() {
  const {
    currentRoom,
    nearbyInteractable,
    isMusicPlaying,
    isMuted,
    toggleMusic,
    toggleMute,
    cameraMode,
    setCameraMode,
    isMobile,
    showControls,
    setShowControls,
  } = useGameStore();

  const roomNames: Record<string, string> = {
    entrance: '🏛️ Entrance Hall',
    gallery: '🖼️ Photo Gallery',
    romantic: '💕 Romantic Corner',
    cinema: '🎬 Memory Theatre',
    garden: '🌸 Memory Garden',
  };

  return (
    <div className="ui-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 50 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '15px 20px',
      }}>
        {/* Room name */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          padding: '8px 16px',
          borderRadius: 20,
          color: '#fff',
          fontSize: 14,
          fontFamily: 'Georgia, serif',
          letterSpacing: 1,
          border: '1px solid rgba(200,165,90,0.3)',
        }}>
          {roomNames[currentRoom] || currentRoom}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: 8,
          pointerEvents: 'auto',
        }}>
          {/* Music toggle */}
          <button
            onClick={toggleMusic}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >
            {isMusicPlaying ? '♫' : '♪'}
          </button>

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Camera mode toggle */}
          <button
            onClick={() => setCameraMode(cameraMode === 'third-person' ? 'first-person' : 'third-person')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >
            {cameraMode === 'third-person' ? '👁' : '👤'}
          </button>

          {/* Controls help */}
          {!isMobile && (
            <button
              onClick={() => setShowControls(!showControls)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
            >
              ?
            </button>
          )}
        </div>
      </div>

      {/* Controls help overlay */}
      {showControls && !isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          padding: '15px 20px',
          borderRadius: 12,
          color: '#fff',
          fontSize: 12,
          lineHeight: 1.8,
          pointerEvents: 'auto',
          border: '1px solid rgba(200,165,90,0.3)',
        }}>
          <div style={{ color: COLORS.gold, marginBottom: 8, fontSize: 13, fontWeight: 'bold' }}>Controls</div>
          <div>WASD — Move</div>
          <div>Mouse — Camera</div>
          <div>Scroll — Zoom</div>
          <div>Space — Jump</div>
          <div>Shift — Run</div>
          <div>E — Interact</div>
        </div>
      )}

      {/* Interaction prompt */}
      {nearbyInteractable && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? 130 : 40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          padding: '10px 24px',
          borderRadius: 25,
          color: '#fff',
          fontSize: 14,
          border: `1px solid rgba(200,165,90,0.4)`,
          fontFamily: 'Georgia, serif',
          letterSpacing: 0.5,
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <span style={{ color: COLORS.gold }}>[E]</span> Interact
        </div>
      )}
    </div>
  );
}
