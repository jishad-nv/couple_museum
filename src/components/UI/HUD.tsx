import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';
import { roomToAudioZone } from '../../utils/audioZones';
import {
  resolveAssignedZoneTrack,
  unlockBackgroundAudio,
} from '../../audio/BackgroundAudioManager';
import {
  ENTRANCE_ARRIVAL_POS,
  THEATRE_ARRIVAL_POS,
  GARDEN_ARRIVAL_POS,
} from '../../utils/museumLayout';

const ROOM_LABELS: Record<string, string> = {
  exterior: 'Museum Forecourt',
  entrance: 'Entrance Hall',
  gallery: 'Circular Gallery',
  cinema: 'Memory Theatre',
  garden: 'Beauty of Garden',
};

const sideButtonBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  width: '100%',
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(200, 165, 90, 0.34)',
  background: 'linear-gradient(135deg, rgba(28, 17, 34, 0.88), rgba(18, 12, 24, 0.82))',
  color: '#f8f2e8',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.7,
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.42)',
  textAlign: 'left',
  transition: 'transform 0.15s ease, border-color 0.15s ease, background 0.15s ease',
};

export default function HUD() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);
  const nearbyMemory = useGameStore((s) => s.nearbyMemory);
  const nearbyBench = useGameStore((s) => s.nearbyBench);
  const isMainDoorOpen = useGameStore((s) => s.isMainDoorOpen);
  const isTheatreDoorOpen = useGameStore((s) => s.isTheatreDoorOpen);
  const isGardenDoorOpen = useGameStore((s) => s.isGardenDoorOpen);
  const isHoldingHands = useGameStore((s) => s.isHoldingHands);
  const isWalkingTogether = useGameStore((s) => s.isWalkingTogether);
  const isSitting = useGameStore((s) => s.isSitting);
  const isDancing = useGameStore((s) => s.isDancing);
  const scriptedWalk = useGameStore((s) => s.scriptedWalk);
  const activeCoupleSequence = useGameStore((s) => s.activeCoupleSequence);
  const cinemaPlaying = useGameStore((s) => s.cinemaPlaying);

  const isMusicPlaying = useGameStore((s) => s.isMusicPlaying);
  const isMuted = useGameStore((s) => s.isMuted);
  const musicTracks = useGameStore((s) => s.musicTracks);
  const museumSettings = useGameStore((s) => s.museumSettings);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const isMobile = useGameStore((s) => s.isMobile);
  const showControls = useGameStore((s) => s.showControls);
  const showGuestbookModal = useGameStore((s) => s.showGuestbookModal);
  const showPhotoViewer = useGameStore((s) => s.showPhotoViewer);
  const showVideoPlayer = useGameStore((s) => s.showVideoPlayer);
  const showLoveAlbum = useGameStore((s) => s.showLoveAlbum);
  const showAdminLogin = useGameStore((s) => s.showAdminLogin);
  const showAdminPanel = useGameStore((s) => s.showAdminPanel);
  const adminToken = useGameStore((s) => s.adminToken);

  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setShowControls = useGameStore((s) => s.setShowControls);
  const setMainDoorOpen = useGameStore((s) => s.setMainDoorOpen);
  const setTheatreDoorOpen = useGameStore((s) => s.setTheatreDoorOpen);
  const setGardenDoorOpen = useGameStore((s) => s.setGardenDoorOpen);
  const startScriptedWalk = useGameStore((s) => s.startScriptedWalk);
  const openMemory = useGameStore((s) => s.openMemory);
  const setShowLoveAlbum = useGameStore((s) => s.setShowLoveAlbum);
  const setShowGuestbookModal = useGameStore((s) => s.setShowGuestbookModal);
  const toggleHoldHands = useGameStore((s) => s.toggleHoldHands);
  const toggleWalkTogether = useGameStore((s) => s.toggleWalkTogether);
  const startCoupleSequence = useGameStore((s) => s.startCoupleSequence);
  const startDanceMode = useGameStore((s) => s.startDanceMode);
  const stopDanceMode = useGameStore((s) => s.stopDanceMode);
  const standUp = useGameStore((s) => s.standUp);
  const setCinemaPlaying = useGameStore((s) => s.setCinemaPlaying);
  const replayCinema = useGameStore((s) => s.replayCinema);
  const setShowVideoPlayer = useGameStore((s) => s.setShowVideoPlayer);
  const setShowAdminLogin = useGameStore((s) => s.setShowAdminLogin);
  const setShowAdminPanel = useGameStore((s) => s.setShowAdminPanel);

  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Discreet private keyboard shortcut (Ctrl+Shift+A / Cmd+Shift+A) for Curator access
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyA') {
        const el = e.target as HTMLElement | null;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
          return;
        }
        e.preventDefault();
        const s = useGameStore.getState();
        if (s.adminToken) {
          s.setShowAdminPanel(!s.showAdminPanel);
        } else {
          s.setShowAdminLogin(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const compact = isMobile || isNarrow;
  const modalOpen =
    showGuestbookModal ||
    showPhotoViewer ||
    showVideoPlayer ||
    showLoveAlbum ||
    showAdminLogin ||
    showAdminPanel;
  const activeZone = roomToAudioZone(currentRoom, isDancing);
  const activeTrack = resolveAssignedZoneTrack(activeZone, musicTracks, museumSettings);
  const danceQueued = isDancing || scriptedWalk?.onArrive === 'dance_together';

  const handleOpenMainDoor = () => {
    unlockBackgroundAudio();
    setMainDoorOpen(true);
    startScriptedWalk({
      target: ENTRANCE_ARRIVAL_POS,
      facing: Math.PI,
    });
  };

  const handleOpenTheatre = () => {
    unlockBackgroundAudio();
    setTheatreDoorOpen(true);
    startScriptedWalk({
      target: THEATRE_ARRIVAL_POS,
      facing: Math.PI,
    });
  };

  const handleOpenGarden = () => {
    unlockBackgroundAudio();
    setGardenDoorOpen(true);
    startScriptedWalk({
      target: GARDEN_ARRIVAL_POS,
      facing: 1.9,
    });
  };

  const handleSitTogether = () => {
    if (!nearbyBench) return;
    startScriptedWalk({
      target: nearbyBench.position,
      facing: nearbyBench.rotation,
      onArrive: nearbyBench.id.startsWith('cinema') ? 'sit_cinema' : 'sit_garden',
      benchPos: nearbyBench.position,
      benchRot: nearbyBench.rotation,
    });
  };

  const handleDanceButton = () => {
    unlockBackgroundAudio();
    if (danceQueued) {
      stopDanceMode();
    } else {
      startDanceMode();
    }
  };

  const openCuratorAccess = () => {
    if (adminToken) {
      setShowAdminPanel(true);
    } else {
      setShowAdminLogin(true);
    }
  };

  return (
    <div
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Top Bar: Room Indicator & Global Audio / Camera Toggles */}
      {!modalOpen && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: compact ? '12px 12px' : '16px 22px',
          }}
        >
          <div
            data-testid="room-badge"
            style={{
              background: 'linear-gradient(135deg, rgba(26, 16, 32, 0.86), rgba(16, 10, 22, 0.8))',
              padding: compact ? '7px 13px' : '8px 18px',
              borderRadius: 20,
              color: '#f8f1e5',
              fontSize: compact ? 12 : 13,
              fontFamily: 'Georgia, serif',
              letterSpacing: 1,
              border: '1px solid rgba(200, 165, 90, 0.36)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            <span style={{ color: COLORS.gold, marginRight: 8 }}>✦</span>
            {isDancing ? 'Moonlit Waltz' : ROOM_LABELS[currentRoom] || currentRoom}
          </div>

          <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
            <button
              type="button"
              data-testid="btn-toggle-music"
              aria-label={
                isMusicPlaying
                  ? `Pause background music (${activeTrack.title})`
                  : `Play background music (${activeTrack.title})`
              }
              title={`${activeTrack.title} — ${activeTrack.subtitle}`}
              onClick={() => {
                unlockBackgroundAudio();
                toggleMusic();
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background:
                  isMusicPlaying && !isMuted
                    ? 'rgba(72, 48, 24, 0.9)'
                    : 'rgba(20, 13, 28, 0.84)',
                border:
                  isMusicPlaying && !isMuted
                    ? `1px solid ${COLORS.gold}`
                    : '1px solid rgba(200, 165, 90, 0.3)',
                color: '#f7efd8',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {isMusicPlaying ? '♫' : '♪'}
            </button>

            <button
              type="button"
              data-testid="btn-toggle-mute"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              onClick={() => {
                unlockBackgroundAudio();
                toggleMute();
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(20, 13, 28, 0.84)',
                border: '1px solid rgba(200, 165, 90, 0.3)',
                color: '#f7efd8',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            <button
              type="button"
              aria-label={
                cameraMode === 'third-person'
                  ? 'Switch to first-person camera'
                  : 'Switch to third-person camera'
              }
              onClick={() =>
                setCameraMode(cameraMode === 'third-person' ? 'first-person' : 'third-person')
              }
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(20, 13, 28, 0.84)',
                border: '1px solid rgba(200, 165, 90, 0.3)',
                color: '#f7efd8',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {cameraMode === 'third-person' ? '👁' : '👤'}
            </button>

            {!compact && (
              <button
                type="button"
                aria-label={showControls ? 'Hide controls help' : 'Show controls help'}
                onClick={() => setShowControls(!showControls)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(20, 13, 28, 0.84)',
                  border: '1px solid rgba(200, 165, 90, 0.3)',
                  color: '#f7efd8',
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                ?
              </button>
            )}
          </div>
        </div>
      )}

      {/* Side-of-Screen Floating Contextual & Couple Dock */}
      {!modalOpen && (
        <aside
          aria-label="Interaction Actions"
          data-testid="side-action-dock"
          style={{
            position: 'fixed',
            right: compact ? 10 : 20,
            top: compact ? 62 : '50%',
            transform: compact ? 'none' : 'translateY(-50%)',
            width: compact ? 172 : 228,
            display: 'flex',
            flexDirection: 'column',
            gap: compact ? 7 : 9,
            pointerEvents: 'auto',
            zIndex: 65,
          }}
        >
          {nearbyInteractable === 'main-door' && !isMainDoorOpen && (
            <button
              type="button"
              data-testid="btn-open-museum-door"
              onClick={handleOpenMainDoor}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(164, 118, 46, 0.92), rgba(112, 72, 24, 0.92))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff9eb',
                fontSize: compact ? 11 : 12,
              }}
            >
              <span>OPEN MUSEUM</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyInteractable === 'theatre-door' && !isTheatreDoorOpen && (
            <button
              type="button"
              data-testid="btn-open-theatre"
              onClick={handleOpenTheatre}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(139, 31, 59, 0.92), rgba(82, 16, 36, 0.92))',
                border: `1px solid ${COLORS.gold}`,
                color: '#fff6ea',
              }}
            >
              <span>OPEN THEATRE</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyInteractable === 'garden-door' && !isGardenDoorOpen && (
            <button
              type="button"
              data-testid="btn-open-garden"
              onClick={handleOpenGarden}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(48, 96, 56, 0.92), rgba(28, 60, 34, 0.92))',
                border: '1px solid #9bd8a6',
                color: '#f2fff5',
              }}
            >
              <span>OPEN GARDEN</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyInteractable === 'love-album' && (
            <button
              type="button"
              data-testid="btn-open-love-album"
              onClick={() => setShowLoveAlbum(true)}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(140, 44, 78, 0.94), rgba(82, 22, 46, 0.94))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff8ec',
              }}
            >
              <span>OPEN OUR ALBUM</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyInteractable === 'dance-spot' && !isDancing && (
            <button
              type="button"
              data-testid="btn-dance-pavilion"
              onClick={handleDanceButton}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(164, 118, 46, 0.92), rgba(105, 65, 25, 0.92))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff9eb',
              }}
            >
              <span>MOONLIT DANCE</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyMemory && (
            <button
              type="button"
              data-testid="btn-view-memory"
              onClick={() => openMemory(nearbyMemory)}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(164, 118, 46, 0.92), rgba(105, 65, 25, 0.92))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff8e8',
              }}
            >
              <span>VIEW MEMORY</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyInteractable === 'guestbook' && (
            <button
              type="button"
              data-testid="btn-sign-guestbook"
              onClick={() => setShowGuestbookModal(true)}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(145, 106, 44, 0.9), rgba(85, 58, 22, 0.9))',
                border: `1px solid ${COLORS.goldLight}`,
              }}
            >
              <span>SIGN GUESTBOOK</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyBench && !isSitting && (
            <button
              type="button"
              data-testid="btn-sit-together"
              onClick={handleSitTogether}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(128, 44, 78, 0.92), rgba(74, 22, 46, 0.92))',
                border: '1px solid #f0b6c8',
              }}
            >
              <span>SIT TOGETHER</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>♡</span>
            </button>
          )}

          {isSitting && (
            <button
              type="button"
              data-testid="btn-stand-up"
              onClick={standUp}
              style={{
                ...sideButtonBase,
                border: `1px solid ${COLORS.gold}`,
              }}
            >
              <span>STAND UP</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>WASD</span>
            </button>
          )}

          {/* Cinema Film Controls inside Memory Theatre */}
          {(currentRoom === 'cinema' || nearbyInteractable === 'cinema-screen') && (
            <div
              style={{
                background: 'rgba(20, 12, 26, 0.86)',
                border: '1px solid rgba(200, 165, 90, 0.34)',
                borderRadius: 12,
                padding: compact ? 8 : 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.42)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: COLORS.goldLight,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: 'Georgia, serif',
                }}
              >
                Memory Film
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  data-testid="btn-cinema-play-pause"
                  onClick={() => setCinemaPlaying(!cinemaPlaying)}
                  style={{ ...sideButtonBase, padding: '7px 10px', justifyContent: 'center', fontSize: 11 }}
                >
                  {cinemaPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  type="button"
                  data-testid="btn-cinema-replay"
                  onClick={replayCinema}
                  style={{ ...sideButtonBase, padding: '7px 10px', justifyContent: 'center', fontSize: 11 }}
                >
                  REPLAY
                </button>
              </div>
              <button
                type="button"
                data-testid="btn-cinema-fullscreen"
                onClick={() => setShowVideoPlayer(true)}
                style={{ ...sideButtonBase, padding: '7px 10px', justifyContent: 'center', fontSize: 11 }}
              >
                THEATRE SCREEN VIEW
              </button>
            </div>
          )}

          {/* Couple Interaction Group */}
          <div
            style={{
              background: 'rgba(20, 12, 26, 0.82)',
              border: '1px solid rgba(200, 165, 90, 0.28)',
              borderRadius: 12,
              padding: compact ? 8 : 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.38)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#d9c39a',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontFamily: 'Georgia, serif',
              }}
            >
              Couple Moments
            </div>

            <button
              type="button"
              data-testid="btn-hold-hands"
              onClick={toggleHoldHands}
              style={{
                ...sideButtonBase,
                padding: compact ? '7px 10px' : '8px 12px',
                fontSize: 11,
                borderColor: isHoldingHands ? '#f0b2c4' : 'rgba(200, 165, 90, 0.26)',
                background: isHoldingHands
                  ? 'rgba(130, 44, 72, 0.55)'
                  : 'rgba(32, 20, 38, 0.72)',
              }}
            >
              <span>HOLD HANDS</span>
              <span style={{ fontSize: 11 }}>{isHoldingHands ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="btn-walk-together"
              onClick={toggleWalkTogether}
              style={{
                ...sideButtonBase,
                padding: compact ? '7px 10px' : '8px 12px',
                fontSize: 11,
                borderColor: isWalkingTogether ? COLORS.gold : 'rgba(200, 165, 90, 0.26)',
                background: isWalkingTogether
                  ? 'rgba(130, 96, 40, 0.45)'
                  : 'rgba(32, 20, 38, 0.72)',
              }}
            >
              <span>WALK TOGETHER</span>
              <span style={{ fontSize: 11 }}>{isWalkingTogether ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="btn-dance-together"
              onClick={handleDanceButton}
              style={{
                ...sideButtonBase,
                padding: compact ? '7px 10px' : '8px 12px',
                fontSize: 11,
                borderColor: danceQueued ? COLORS.goldLight : 'rgba(200, 165, 90, 0.28)',
                background: danceQueued
                  ? 'linear-gradient(135deg, rgba(164, 118, 46, 0.78), rgba(114, 48, 72, 0.78))'
                  : 'rgba(32, 20, 38, 0.72)',
                color: '#fff8ec',
              }}
            >
              <span>{danceQueued ? 'STOP DANCING' : 'DANCE TOGETHER'}</span>
              <span style={{ fontSize: 11 }}>{danceQueued ? '♫' : '✧'}</span>
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                data-testid="btn-hug"
                onClick={() => startCoupleSequence('hug')}
                style={{
                  ...sideButtonBase,
                  padding: '8px 6px',
                  justifyContent: 'center',
                  fontSize: 11,
                  borderColor:
                    activeCoupleSequence === 'hug' ? '#ff9eb8' : 'rgba(200, 165, 90, 0.28)',
                }}
              >
                HUG
              </button>
              <button
                type="button"
                data-testid="btn-kiss"
                onClick={() => startCoupleSequence('kiss')}
                style={{
                  ...sideButtonBase,
                  padding: '8px 6px',
                  justifyContent: 'center',
                  fontSize: 11,
                  borderColor:
                    activeCoupleSequence === 'kiss' ? '#ff9eb8' : 'rgba(200, 165, 90, 0.28)',
                }}
              >
                KISS
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Controls Help Card */}
      {showControls && !compact && !modalOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'rgba(18, 12, 24, 0.9)',
            padding: '14px 18px',
            borderRadius: 12,
            color: '#f5efe6',
            fontSize: 12,
            lineHeight: 1.75,
            pointerEvents: 'auto',
            border: '1px solid rgba(200, 165, 90, 0.32)',
            zIndex: 70,
          }}
        >
          <div style={{ color: COLORS.gold, marginBottom: 6, fontSize: 13, fontWeight: 'bold' }}>
            Controls
          </div>
          <div>WASD / Arrows — Move</div>
          <div>Mouse Drag — Look Around</div>
          <div>Scroll — Zoom (Clamped)</div>
          <div>Shift — Run · Space — Jump</div>
          <div>E — Interact / Open Door / Album</div>
        </div>
      )}

      {/* Discreet private corner hotspot for museum curator login (no public Admin branding) */}
      {!modalOpen && (
        <button
          type="button"
          data-testid="hidden-admin-trigger"
          aria-label="Curator access"
          onClick={openCuratorAccess}
          style={{
            position: 'fixed',
            bottom: 12,
            left: 12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '1px solid rgba(200, 165, 90, 0.45)',
            background: 'rgba(22, 14, 28, 0.72)',
            color: COLORS.goldLight,
            fontSize: 10,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.14,
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 45,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.65';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.14';
          }}
        >
          ✦
        </button>
      )}
    </div>
  );
}
