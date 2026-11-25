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
import {
  isProposalBusy,
  isSuitableProposalLocation,
  shouldShowCoupleToolbar,
} from '../../utils/proposal';

const ROOM_LABELS: Record<string, string> = {
  exterior: 'Museum Forecourt',
  entrance: 'Entrance Hall',
  gallery: 'Circular Gallery',
  cinema: 'Memory Theatre',
  garden: 'Beauty of Garden',
  secret: 'Our Secret Room',
  private_chamber: 'Our Private Memories',
  wedding: 'Our Wedding Day',
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
  const showSecretLetterModal = useGameStore((s) => s.showSecretLetterModal);
  const showDoYouLoveMeModal = useGameStore((s) => s.showDoYouLoveMeModal);
  const showLoveQuizModal = useGameStore((s) => s.showLoveQuizModal);
  const showKeyRewardPrompt = useGameStore((s) => s.showKeyRewardPrompt);
  const showPrivateMemoryModal = useGameStore((s) => s.showPrivateMemoryModal);
  const showProposalModal = useGameStore((s) => s.showProposalModal);
  const proposalStage = useGameStore((s) => s.proposalStage);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const coupleToolbarHidden = useGameStore((s) => s.coupleToolbarHidden);
  const nearbyPrivateMemory = useGameStore((s) => s.nearbyPrivateMemory);
  const secretProgress = useGameStore((s) => s.secretProgress);
  const secretHintBanner = useGameStore((s) => s.secretHintBanner);
  const weddingStage = useGameStore((s) => s.weddingStage);
  const weddingPhotoFlash = useGameStore((s) => s.weddingPhotoFlash);
  const weddingBannerMessage = useGameStore((s) => s.weddingBannerMessage);
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
  const enterSecretRoom = useGameStore((s) => s.enterSecretRoom);
  const exitSecretRoom = useGameStore((s) => s.exitSecretRoom);
  const setShowSecretLetterModal = useGameStore((s) => s.setShowSecretLetterModal);
  const setShowDoYouLoveMeModal = useGameStore((s) => s.setShowDoYouLoveMeModal);
  const setShowLoveQuizModal = useGameStore((s) => s.setShowLoveQuizModal);
  const collectGoldenKey = useGameStore((s) => s.collectGoldenKey);
  const unlockOrEnterPrivateChamber = useGameStore((s) => s.unlockOrEnterPrivateChamber);
  const exitPrivateChamberToSecret = useGameStore((s) => s.exitPrivateChamberToSecret);
  const exitToMuseumFromPrivateChamber = useGameStore((s) => s.exitToMuseumFromPrivateChamber);
  const openPrivateMemory = useGameStore((s) => s.openPrivateMemory);
  const enterWeddingHall = useGameStore((s) => s.enterWeddingHall);
  const exitWeddingHall = useGameStore((s) => s.exitWeddingHall);
  const startWeddingCeremony = useGameStore((s) => s.startWeddingCeremony);
  const walkWeddingAisle = useGameStore((s) => s.walkWeddingAisle);
  const exchangeWeddingVows = useGameStore((s) => s.exchangeWeddingVows);
  const hugAtWedding = useGameStore((s) => s.hugAtWedding);
  const celebrateWedding = useGameStore((s) => s.celebrateWedding);
  const startScriptedWalk = useGameStore((s) => s.startScriptedWalk);
  const openMemory = useGameStore((s) => s.openMemory);
  const openAlbumFromMemory = useGameStore((s) => s.openAlbumFromMemory);
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
  const startProposal = useGameStore((s) => s.startProposal);
  const toggleCoupleToolbarHidden = useGameStore((s) => s.toggleCoupleToolbarHidden);
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
    showSecretLetterModal ||
    showDoYouLoveMeModal ||
    showLoveQuizModal ||
    showPrivateMemoryModal ||
    showProposalModal ||
    showAdminLogin ||
    showAdminPanel;
  const proposalBusy = isProposalBusy(proposalStage);
  const showCoupleControls = shouldShowCoupleToolbar(currentRoom, modalOpen);
  const canPropose = isSuitableProposalLocation(currentRoom, playerPosition, {
    isSitting,
    isDancing,
    proposalStage,
    activeCoupleSequence,
    modalOpen,
    secretRoomUnlocked: secretProgress.secretDoorUnlocked,
  });
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
    const onArrive = nearbyBench.id.startsWith('cinema')
      ? 'sit_cinema'
      : nearbyBench.id.startsWith('secret')
      ? 'sit_secret'
      : nearbyBench.id.startsWith('wedding')
      ? 'sit_wedding'
      : 'sit_garden';
    startScriptedWalk({
      target: nearbyBench.position,
      facing: nearbyBench.rotation,
      onArrive,
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
            padding: compact
              ? 'calc(10px + env(safe-area-inset-top)) calc(10px + env(safe-area-inset-right)) 8px calc(10px + env(safe-area-inset-left))'
              : '16px 22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 10, minWidth: 0 }}>
            <div
              data-testid="room-badge"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 16, 32, 0.86), rgba(16, 10, 22, 0.8))',
                padding: compact ? '6px 10px' : '8px 18px',
                borderRadius: 20,
                color: '#f8f1e5',
                fontSize: compact ? 11 : 13,
                fontFamily: 'Georgia, serif',
                letterSpacing: compact ? 0.4 : 1,
                whiteSpace: 'nowrap',
                border: '1px solid rgba(200, 165, 90, 0.36)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
              }}
            >
              <span style={{ color: COLORS.gold, marginRight: compact ? 5 : 8 }}>✦</span>
              {isDancing ? 'Moonlit Waltz' : ROOM_LABELS[currentRoom] || currentRoom}
            </div>

            {secretProgress.keyCollected && (
              <div
                data-testid="hud-golden-key-badge"
                title={
                  secretProgress.secretDoorUnlocked
                    ? 'Golden Key — Secret Room unlocked'
                    : 'Golden Key collected — approach Secret Room entrance and select UNLOCK SECRET ROOM'
                }
                style={{
                  background: 'linear-gradient(135deg, rgba(114, 78, 24, 0.92), rgba(68, 44, 14, 0.88))',
                  padding: compact ? '5px 8px' : '7px 14px',
                  borderRadius: 18,
                  color: '#fff4cf',
                  fontSize: compact ? 10.5 : 12.5,
                  fontFamily: 'Georgia, serif',
                  letterSpacing: compact ? 0.3 : 0.6,
                  whiteSpace: 'nowrap',
                  border: `1px solid ${COLORS.goldLight}`,
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.38)',
                }}
              >
                🔑 {secretProgress.secretDoorUnlocked ? 'Secret Key' : 'Golden Key'}
              </div>
            )}
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

      {/* Compact Mobile Horizontal Couple Moments Bar + Hide/Show Toggle */}
      {compact && showCoupleControls && (
        coupleToolbarHidden ? (
          <button
            type="button"
            data-testid="btn-show-couple-toolbar"
            aria-label="Show couple moments toolbar"
            onClick={toggleCoupleToolbarHidden}
            style={{
              position: 'fixed',
              top: 'calc(58px + env(safe-area-inset-top))',
              left: 'calc(10px + env(safe-area-inset-left))',
              height: 34,
              padding: '0 12px',
              borderRadius: 12,
              border: '1px solid rgba(200, 165, 90, 0.42)',
              background: 'rgba(22, 14, 28, 0.88)',
              color: '#f8eedc',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Georgia, serif',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4)',
              zIndex: 66,
            }}
          >
            <span>♥ Moments</span>
            <span style={{ fontSize: 10, color: COLORS.goldLight }}>▾</span>
          </button>
        ) : (
          <div
            role="toolbar"
            aria-label="Couple Moments"
            data-testid="mobile-couple-toolbar"
            style={{
              position: 'fixed',
              top: 'calc(58px + env(safe-area-inset-top))',
              left: 'calc(10px + env(safe-area-inset-left))',
              right: 'calc(10px + env(safe-area-inset-right))',
              height: 46,
              padding: '4px 6px',
              borderRadius: 14,
              border: '1px solid rgba(200, 165, 90, 0.36)',
              background: 'rgba(20, 12, 26, 0.88)',
              boxShadow: '0 8px 22px rgba(0, 0, 0, 0.44)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto',
              zIndex: 66,
              scrollbarWidth: 'none',
            }}
          >
            <button
              type="button"
              data-testid="btn-toggle-couple-toolbar"
              aria-label="Hide couple moments toolbar"
              onClick={toggleCoupleToolbarHidden}
              style={{
                flexShrink: 0,
                height: 34,
                padding: '0 9px',
                borderRadius: 10,
                border: '1px solid rgba(200, 165, 90, 0.32)',
                background: 'rgba(38, 22, 42, 0.9)',
                color: COLORS.goldLight,
                fontSize: 10.5,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
              }}
            >
              ▲ Hide
            </button>

            <button
              type="button"
              data-testid="btn-hold-hands"
              disabled={proposalBusy}
              onClick={toggleHoldHands}
              style={{
                flexShrink: 0,
                height: 36,
                padding: '0 10px',
                borderRadius: 10,
                border: isHoldingHands
                  ? '1px solid #f0b2c4'
                  : '1px solid rgba(200, 165, 90, 0.28)',
                background: isHoldingHands
                  ? 'rgba(130, 44, 72, 0.68)'
                  : 'rgba(34, 22, 40, 0.86)',
                color: '#f8f2e8',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: proposalBusy ? 'not-allowed' : 'pointer',
                opacity: proposalBusy ? 0.55 : 1,
              }}
            >
              {isHoldingHands ? '🤝 Holding' : '🤝 Hold'}
            </button>

            <button
              type="button"
              data-testid="btn-walk-together"
              disabled={proposalBusy}
              onClick={toggleWalkTogether}
              style={{
                flexShrink: 0,
                height: 36,
                padding: '0 10px',
                borderRadius: 10,
                border: isWalkingTogether
                  ? `1px solid ${COLORS.gold}`
                  : '1px solid rgba(200, 165, 90, 0.28)',
                background: isWalkingTogether
                  ? 'rgba(130, 96, 40, 0.62)'
                  : 'rgba(34, 22, 40, 0.86)',
                color: '#f8f2e8',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: proposalBusy ? 'not-allowed' : 'pointer',
                opacity: proposalBusy ? 0.55 : 1,
              }}
            >
              {isWalkingTogether ? '🚶 Walking' : '🚶 Walk'}
            </button>

            <button
              type="button"
              data-testid="btn-dance-together"
              disabled={proposalBusy}
              onClick={handleDanceButton}
              style={{
                flexShrink: 0,
                height: 36,
                padding: '0 10px',
                borderRadius: 10,
                border: danceQueued
                  ? `1px solid ${COLORS.goldLight}`
                  : '1px solid rgba(200, 165, 90, 0.28)',
                background: danceQueued
                  ? 'linear-gradient(135deg, rgba(164, 118, 46, 0.85), rgba(114, 48, 72, 0.85))'
                  : 'rgba(34, 22, 40, 0.86)',
                color: '#fff8ec',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: proposalBusy ? 'not-allowed' : 'pointer',
                opacity: proposalBusy ? 0.55 : 1,
              }}
            >
              {danceQueued ? '♫ Stop' : '✧ Dance'}
            </button>

            <button
              type="button"
              data-testid="btn-hug"
              disabled={proposalBusy}
              onClick={() => startCoupleSequence('hug')}
              style={{
                flexShrink: 0,
                height: 36,
                padding: '0 10px',
                borderRadius: 10,
                border:
                  activeCoupleSequence === 'hug'
                    ? '1px solid #ffd28e'
                    : '1px solid rgba(200, 165, 90, 0.28)',
                background:
                  activeCoupleSequence === 'hug'
                    ? 'rgba(136, 84, 34, 0.72)'
                    : 'rgba(34, 22, 40, 0.86)',
                color: '#fff6e8',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: proposalBusy ? 'not-allowed' : 'pointer',
                opacity: proposalBusy ? 0.55 : 1,
              }}
            >
              💛 Hug
            </button>

            <button
              type="button"
              data-testid="btn-kiss"
              disabled={proposalBusy}
              onClick={() => startCoupleSequence('kiss')}
              style={{
                flexShrink: 0,
                height: 36,
                padding: '0 10px',
                borderRadius: 10,
                border:
                  activeCoupleSequence === 'kiss'
                    ? '1px solid #ff9eb8'
                    : '1px solid rgba(200, 165, 90, 0.28)',
                background:
                  activeCoupleSequence === 'kiss'
                    ? 'rgba(146, 40, 74, 0.75)'
                    : 'rgba(34, 22, 40, 0.86)',
                color: '#fff4f8',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: proposalBusy ? 'not-allowed' : 'pointer',
                opacity: proposalBusy ? 0.55 : 1,
              }}
            >
              💋 Kiss
            </button>

            {canPropose && (
              <button
                type="button"
                data-testid="btn-propose"
                onClick={startProposal}
                style={{
                  flexShrink: 0,
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: `1px solid ${COLORS.goldLight}`,
                  background: 'linear-gradient(135deg, #c73c68, #9c6a24)',
                  color: '#fffaf0',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'Georgia, serif',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(199, 60, 104, 0.35)',
                }}
              >
                💍 Propose
              </button>
            )}
          </div>
        )
      )}

      {/* Secret Mystery / Proposal Subtitle Banner */}
      {!modalOpen && secretHintBanner && (
        <div
          data-testid="secret-hint-banner"
          style={{
            position: 'fixed',
            top: compact
              ? showCoupleControls && !coupleToolbarHidden
                ? 'calc(112px + env(safe-area-inset-top))'
                : 'calc(60px + env(safe-area-inset-top))'
              : 66,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 15, 32, 0.94)',
            border: `1px solid ${COLORS.goldLight}`,
            borderRadius: 16,
            padding: compact ? '7px 14px' : '9px 20px',
            color: '#fff5df',
            fontFamily: 'Georgia, serif',
            fontSize: compact ? 11.5 : 13,
            textAlign: 'center',
            maxWidth: 'min(540px, calc(100vw - 36px))',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none',
            zIndex: 56,
          }}
        >
          {secretHintBanner}
        </div>
      )}

      {/* Wedding Ceremony Subtitle Banner */}
      {!modalOpen && currentRoom === 'wedding' && weddingBannerMessage && (
        <div
          data-testid="wedding-banner"
          style={{
            position: 'fixed',
            top: compact ? 'calc(60px + env(safe-area-inset-top))' : 66,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(28, 17, 32, 0.9)',
            border: `1px solid ${COLORS.gold}`,
            borderRadius: 18,
            padding: compact ? '6px 14px' : '8px 20px',
            color: '#fff8ea',
            fontFamily: 'Georgia, serif',
            fontSize: compact ? 11.5 : 13,
            textAlign: 'center',
            maxWidth: 'min(520px, calc(100vw - 40px))',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
            pointerEvents: 'none',
            zIndex: 55,
          }}
        >
          {weddingBannerMessage}
        </div>
      )}

      {/* Side-of-Screen Floating Contextual & Couple Dock */}
      {!modalOpen && (
        <aside
          aria-label="Interaction Actions"
          data-testid="side-action-dock"
          style={{
            position: 'fixed',
            right: compact ? 'calc(10px + env(safe-area-inset-right))' : 20,
            top: compact ? 'calc(112px + env(safe-area-inset-top))' : '50%',
            transform: compact ? 'none' : 'translateY(-50%)',
            width: compact ? 'min(176px, calc(100vw - 20px))' : 228,
            maxHeight: compact ? 'calc(100vh - 280px)' : 'calc(100vh - 96px)',
            overflowY: 'auto',
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

          {nearbyInteractable === 'secret-door' && (
            <button
              type="button"
              data-testid={
                secretProgress.secretDoorUnlocked
                  ? 'btn-enter-secret-room'
                  : 'btn-unlock-secret-room'
              }
              onClick={() => {
                unlockBackgroundAudio();
                enterSecretRoom();
              }}
              style={{
                ...sideButtonBase,
                background: secretProgress.keyCollected
                  ? 'linear-gradient(135deg, rgba(154, 108, 38, 0.96), rgba(96, 62, 18, 0.96))'
                  : 'linear-gradient(135deg, rgba(96, 36, 62, 0.94), rgba(52, 18, 34, 0.94))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff6ee',
              }}
            >
              <span>
                {secretProgress.secretDoorUnlocked
                  ? 'ENTER SECRET ROOM'
                  : 'UNLOCK SECRET ROOM'}
              </span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyInteractable === 'secret-letter' && (
            <button
              type="button"
              data-testid="btn-read-secret-letter"
              onClick={() => setShowSecretLetterModal(true)}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(145, 92, 46, 0.94), rgba(86, 48, 22, 0.94))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff8ec',
              }}
            >
              <span>READ SECRET LETTER</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyInteractable === 'quiz-master' && (
            <div
              data-testid="quiz-master-prompt-card"
              style={{
                background: 'linear-gradient(145deg, rgba(38, 17, 34, 0.95), rgba(22, 11, 24, 0.94))',
                border: `1.5px solid ${COLORS.goldLight}`,
                borderRadius: 12,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: '0 10px 26px rgba(0, 0, 0, 0.48)',
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: '#fff2d8',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.35,
                  textAlign: 'center',
                }}
              >
                {secretProgress.quizCompleted
                  ? 'LOVE TEST COMPLETED ❤️'
                  : 'ARE YOU READY FOR A LITTLE LOVE TEST?'}
              </div>
              <button
                type="button"
                data-testid="btn-start-love-quiz"
                onClick={() => {
                  if (!secretProgress.yesConfirmed) {
                    setShowDoYouLoveMeModal(true);
                  } else {
                    setShowLoveQuizModal(true, true);
                  }
                }}
                style={{
                  ...sideButtonBase,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(176, 124, 46, 0.96), rgba(114, 68, 22, 0.96))',
                  border: `1px solid ${COLORS.goldLight}`,
                  color: '#fffaf0',
                }}
              >
                {secretProgress.quizCompleted ? 'REPLAY QUIZ ❤️' : 'START QUIZ ❤️'}
              </button>
            </div>
          )}

          {(nearbyInteractable === 'reward-box' ||
            (currentRoom === 'gallery' &&
              showKeyRewardPrompt &&
              secretProgress.quizCompleted &&
              !secretProgress.keyCollected)) && (
            <div
              data-testid="reward-key-prompt-card"
              style={{
                background: 'linear-gradient(145deg, rgba(58, 28, 18, 0.95), rgba(32, 16, 12, 0.95))',
                border: `1.5px solid ${COLORS.goldLight}`,
                borderRadius: 12,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: '#ffe8b8',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.35,
                  textAlign: 'center',
                }}
              >
                {secretProgress.keyCollected
                  ? 'GOLDEN KEY COLLECTED ❤️'
                  : secretProgress.quizCompleted
                  ? 'THE REWARD BOX OPENED ❤️'
                  : 'REWARD BOX SEALED — PASS THE QUIZ FIRST'}
              </div>
              {secretProgress.quizCompleted && !secretProgress.keyCollected && (
                <button
                  type="button"
                  data-testid="btn-collect-key"
                  onClick={collectGoldenKey}
                  style={{
                    ...sideButtonBase,
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #c99238, #8c5a18)',
                    border: `1px solid ${COLORS.goldLight}`,
                    color: '#fffaf0',
                  }}
                >
                  COLLECT KEY 🔑
                </button>
              )}
            </div>
          )}

          {nearbyInteractable === 'private-door' && (
            <button
              type="button"
              data-testid="btn-unlock-special-memories"
              onClick={unlockOrEnterPrivateChamber}
              style={{
                ...sideButtonBase,
                background: secretProgress.keyCollected
                  ? 'linear-gradient(135deg, rgba(154, 108, 38, 0.96), rgba(96, 62, 18, 0.96))'
                  : 'linear-gradient(135deg, rgba(56, 30, 50, 0.94), rgba(30, 16, 28, 0.94))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff8ec',
              }}
            >
              <span>UNLOCK SPECIAL MEMORIES</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyPrivateMemory && currentRoom === 'private_chamber' && (
            <button
              type="button"
              data-testid="btn-view-private-memory"
              onClick={() => openPrivateMemory(nearbyPrivateMemory)}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(154, 48, 82, 0.95), rgba(92, 24, 48, 0.95))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff8ec',
              }}
            >
              <span>VIEW: {nearbyPrivateMemory.title.slice(0, 16)}</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {currentRoom === 'secret' && (
            <button
              type="button"
              data-testid="btn-exit-secret-room"
              onClick={exitSecretRoom}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(46, 30, 52, 0.92), rgba(24, 16, 30, 0.92))',
                border: `1px solid ${COLORS.gold}`,
                color: '#f8f0e4',
              }}
            >
              <span>RETURN TO MUSEUM</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>{nearbyInteractable === 'secret-exit' ? '[E]' : '←'}</span>
            </button>
          )}

          {currentRoom === 'private_chamber' && (
            <>
              <button
                type="button"
                data-testid="btn-return-secret-room"
                onClick={exitPrivateChamberToSecret}
                style={{
                  ...sideButtonBase,
                  background: 'linear-gradient(135deg, rgba(68, 30, 54, 0.94), rgba(36, 16, 30, 0.94))',
                  border: `1px solid ${COLORS.goldLight}`,
                  color: '#fff6ea',
                }}
              >
                <span>RETURN TO SECRET ROOM</span>
                <span style={{ fontSize: 10, opacity: 0.85 }}>
                  {nearbyInteractable === 'private-chamber-exit' ? '[E]' : '←'}
                </span>
              </button>
              <button
                type="button"
                data-testid="btn-return-museum-from-chamber"
                onClick={exitToMuseumFromPrivateChamber}
                style={{
                  ...sideButtonBase,
                  background: 'linear-gradient(135deg, rgba(42, 28, 48, 0.92), rgba(22, 14, 28, 0.92))',
                  border: `1px solid ${COLORS.gold}`,
                  color: '#f8f0e4',
                }}
              >
                <span>RETURN TO MUSEUM</span>
                <span style={{ fontSize: 10, opacity: 0.85 }}>⌂</span>
              </button>
            </>
          )}

          {nearbyInteractable === 'wedding-door' && (
            <button
              type="button"
              data-testid="btn-enter-wedding-hall"
              onClick={() => {
                unlockBackgroundAudio();
                enterWeddingHall();
              }}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(176, 128, 54, 0.95), rgba(118, 78, 26, 0.95))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fffbf2',
              }}
            >
              <span>ENTER WEDDING HALL</span>
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

          {nearbyMemory && currentRoom === 'garden' && (
            <button
              type="button"
              data-testid="btn-view-album"
              onClick={() => openAlbumFromMemory(nearbyMemory)}
              style={{
                ...sideButtonBase,
                background: 'linear-gradient(135deg, rgba(140, 44, 78, 0.94), rgba(82, 22, 46, 0.94))',
                border: `1px solid ${COLORS.goldLight}`,
                color: '#fff8ec',
              }}
            >
              <span>VIEW ALBUM</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>[E]</span>
            </button>
          )}

          {nearbyMemory && currentRoom !== 'garden' && (
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

          {/* Destination Wedding Ceremony Controls */}
          {currentRoom === 'wedding' && (
            <div
              data-testid="wedding-ceremony-dock"
              style={{
                background: 'rgba(24, 14, 28, 0.9)',
                border: `1px solid ${COLORS.gold}`,
                borderRadius: 12,
                padding: compact ? 8 : 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: '0 10px 26px rgba(0, 0, 0, 0.44)',
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
                Wedding Ceremony
              </div>

              {(weddingStage === 'idle' || weddingStage === 'ready') && (
                <button
                  type="button"
                  data-testid="btn-start-wedding"
                  onClick={() => {
                    unlockBackgroundAudio();
                    startWeddingCeremony();
                  }}
                  style={{
                    ...sideButtonBase,
                    padding: '9px 11px',
                    fontSize: 11.5,
                    background:
                      'linear-gradient(135deg, rgba(176, 128, 52, 0.96), rgba(120, 76, 26, 0.96))',
                    border: `1px solid ${COLORS.goldLight}`,
                    color: '#fffaf0',
                  }}
                >
                  <span>START WEDDING</span>
                  <span>♡</span>
                </button>
              )}

              <button
                type="button"
                data-testid="btn-wedding-walk"
                onClick={walkWeddingAisle}
                style={{
                  ...sideButtonBase,
                  padding: '8px 11px',
                  fontSize: 11,
                  borderColor:
                    weddingStage === 'aisle_walk' ? COLORS.goldLight : 'rgba(200, 165, 90, 0.3)',
                }}
              >
                <span>WALK TOGETHER</span>
                <span>→</span>
              </button>

              <button
                type="button"
                data-testid="btn-exchange-vows"
                onClick={exchangeWeddingVows}
                style={{
                  ...sideButtonBase,
                  padding: '8px 11px',
                  fontSize: 11,
                  borderColor:
                    weddingStage === 'vows' ? '#f5b8c8' : 'rgba(200, 165, 90, 0.3)',
                  background:
                    weddingStage === 'vows'
                      ? 'rgba(130, 44, 72, 0.65)'
                      : 'rgba(32, 20, 38, 0.78)',
                }}
              >
                <span>EXCHANGE VOWS</span>
                <span>✦</span>
              </button>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  data-testid="btn-wedding-hug"
                  onClick={hugAtWedding}
                  style={{
                    ...sideButtonBase,
                    padding: '8px 6px',
                    justifyContent: 'center',
                    fontSize: 11,
                    borderColor:
                      weddingStage === 'hug' ? '#ff9eb8' : 'rgba(200, 165, 90, 0.3)',
                  }}
                >
                  HUG
                </button>
                <button
                  type="button"
                  data-testid="btn-wedding-celebrate"
                  onClick={celebrateWedding}
                  style={{
                    ...sideButtonBase,
                    padding: '8px 6px',
                    justifyContent: 'center',
                    fontSize: 11,
                    borderColor:
                      weddingStage === 'celebrating' ? COLORS.goldLight : 'rgba(200, 165, 90, 0.3)',
                    background:
                      weddingStage === 'celebrating'
                        ? 'linear-gradient(135deg, rgba(164, 118, 46, 0.85), rgba(114, 48, 72, 0.85))'
                        : 'rgba(32, 20, 38, 0.78)',
                  }}
                >
                  CELEBRATE
                </button>
              </div>

              <button
                type="button"
                data-testid="btn-exit-wedding-hall"
                onClick={exitWeddingHall}
                style={{
                  ...sideButtonBase,
                  padding: '8px 11px',
                  fontSize: 11,
                  border: `1px solid ${COLORS.gold}`,
                }}
              >
                <span>RETURN TO MUSEUM</span>
                <span>←</span>
              </button>
            </div>
          )}

          {/* Desktop Couple Interaction Group (preserved on desktop with Hide/Show toggle + contextual PROPOSE) */}
          {!compact && showCoupleControls && (
            coupleToolbarHidden ? (
              <button
                type="button"
                data-testid="btn-show-couple-toolbar"
                aria-label="Show couple moments toolbar"
                onClick={toggleCoupleToolbarHidden}
                style={{
                  ...sideButtonBase,
                  padding: '9px 12px',
                  fontSize: 11,
                  border: '1px solid rgba(200, 165, 90, 0.36)',
                }}
              >
                <span>♥ COUPLE MOMENTS</span>
                <span style={{ fontSize: 10, color: COLORS.goldLight }}>▾</span>
              </button>
            ) : (
              <div
                data-testid="desktop-couple-toolbar"
                style={{
                  background: 'rgba(20, 12, 26, 0.82)',
                  border: '1px solid rgba(200, 165, 90, 0.28)',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.38)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
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
                    data-testid="btn-toggle-couple-toolbar"
                    aria-label="Hide couple moments toolbar"
                    onClick={toggleCoupleToolbarHidden}
                    style={{
                      border: '1px solid rgba(200, 165, 90, 0.28)',
                      background: 'rgba(38, 22, 42, 0.72)',
                      color: '#e8d8b8',
                      borderRadius: 6,
                      padding: '2px 7px',
                      fontSize: 10,
                      fontFamily: 'Georgia, serif',
                      cursor: 'pointer',
                    }}
                  >
                    Hide
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="btn-hold-hands"
                  disabled={proposalBusy}
                  onClick={toggleHoldHands}
                  style={{
                    ...sideButtonBase,
                    padding: '8px 12px',
                    fontSize: 11,
                    borderColor: isHoldingHands ? '#f0b2c4' : 'rgba(200, 165, 90, 0.26)',
                    background: isHoldingHands
                      ? 'rgba(130, 44, 72, 0.55)'
                      : 'rgba(32, 20, 38, 0.72)',
                    opacity: proposalBusy ? 0.55 : 1,
                    cursor: proposalBusy ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>HOLD HANDS</span>
                  <span style={{ fontSize: 11 }}>{isHoldingHands ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  data-testid="btn-walk-together"
                  disabled={proposalBusy}
                  onClick={toggleWalkTogether}
                  style={{
                    ...sideButtonBase,
                    padding: '8px 12px',
                    fontSize: 11,
                    borderColor: isWalkingTogether ? COLORS.gold : 'rgba(200, 165, 90, 0.26)',
                    background: isWalkingTogether
                      ? 'rgba(130, 96, 40, 0.45)'
                      : 'rgba(32, 20, 38, 0.72)',
                    opacity: proposalBusy ? 0.55 : 1,
                    cursor: proposalBusy ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>WALK TOGETHER</span>
                  <span style={{ fontSize: 11 }}>{isWalkingTogether ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  data-testid="btn-dance-together"
                  disabled={proposalBusy}
                  onClick={handleDanceButton}
                  style={{
                    ...sideButtonBase,
                    padding: '8px 12px',
                    fontSize: 11,
                    borderColor: danceQueued ? COLORS.goldLight : 'rgba(200, 165, 90, 0.28)',
                    background: danceQueued
                      ? 'linear-gradient(135deg, rgba(164, 118, 46, 0.78), rgba(114, 48, 72, 0.78))'
                      : 'rgba(32, 20, 38, 0.72)',
                    color: '#fff8ec',
                    opacity: proposalBusy ? 0.55 : 1,
                    cursor: proposalBusy ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>{danceQueued ? 'STOP DANCING' : 'DANCE TOGETHER'}</span>
                  <span style={{ fontSize: 11 }}>{danceQueued ? '♫' : '✧'}</span>
                </button>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    data-testid="btn-hug"
                    disabled={proposalBusy}
                    onClick={() => startCoupleSequence('hug')}
                    style={{
                      ...sideButtonBase,
                      padding: '8px 6px',
                      justifyContent: 'center',
                      fontSize: 11,
                      borderColor:
                        activeCoupleSequence === 'hug' ? '#ffd28e' : 'rgba(200, 165, 90, 0.28)',
                      opacity: proposalBusy ? 0.55 : 1,
                      cursor: proposalBusy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    HUG
                  </button>
                  <button
                    type="button"
                    data-testid="btn-kiss"
                    disabled={proposalBusy}
                    onClick={() => startCoupleSequence('kiss')}
                    style={{
                      ...sideButtonBase,
                      padding: '8px 6px',
                      justifyContent: 'center',
                      fontSize: 11,
                      borderColor:
                        activeCoupleSequence === 'kiss' ? '#ff9eb8' : 'rgba(200, 165, 90, 0.28)',
                      opacity: proposalBusy ? 0.55 : 1,
                      cursor: proposalBusy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    KISS
                  </button>
                </div>

                {canPropose && (
                  <button
                    type="button"
                    data-testid="btn-propose"
                    onClick={startProposal}
                    style={{
                      ...sideButtonBase,
                      padding: '9px 12px',
                      fontSize: 11.5,
                      border: `1px solid ${COLORS.goldLight}`,
                      background:
                        'linear-gradient(135deg, rgba(186, 54, 96, 0.92), rgba(146, 98, 34, 0.92))',
                      color: '#fffaf0',
                      boxShadow: '0 6px 18px rgba(186, 54, 96, 0.34)',
                    }}
                  >
                    <span>PROPOSE</span>
                    <span>💍</span>
                  </button>
                )}
              </div>
            )
          )}
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
            bottom: compact ? 'auto' : 12,
            top: compact ? 'calc(108px + env(safe-area-inset-top))' : 'auto',
            left: compact ? 'calc(10px + env(safe-area-inset-left))' : 12,
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

      {/* Brief non-blocking wedding photography shutter flash during celebration */}
      {!modalOpen && weddingPhotoFlash && (
        <div
          data-testid="wedding-photo-flash"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 45%, rgba(255,250,242,0.34), rgba(255,250,242,0.06))',
            pointerEvents: 'none',
            zIndex: 80,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: compact ? 132 : 96,
          }}
        >
          <div
            style={{
              background: 'rgba(28, 16, 26, 0.88)',
              border: `1px solid ${COLORS.goldLight}`,
              borderRadius: 14,
              padding: '8px 18px',
              color: '#fff8ec',
              fontFamily: 'Georgia, serif',
              fontSize: 12.5,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            📸 Wedding Portrait Captured!
          </div>
        </div>
      )}
    </div>
  );
}
