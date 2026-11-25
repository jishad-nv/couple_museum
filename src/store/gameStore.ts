import { create } from 'zustand';
import * as THREE from 'three';
import {
  INITIAL_GUESTBOOK_ENTRIES,
  addGuestbookEntry,
  createGuestbookEntry,
  type GuestbookEntry,
  type GuestbookStamp,
} from '../utils/guestbook';
import type { MemoryItem } from '../utils/memoryArt';
import {
  DANCE_SPOT_POS,
  PRIVATE_CHAMBER_ARRIVAL_POS,
  PRIVATE_CHAMBER_RETURN_POS,
  SECRET_ARRIVAL_POS,
  SECRET_RETURN_POS,
  WEDDING_ALTAR_CENTER,
  WEDDING_ARRIVAL_POS,
  WEDDING_RETURN_POS,
  clampCameraDistance,
  clampCameraPitch,
  type MuseumRoom,
} from '../utils/museumLayout';
import { buildAlbumSpreads } from '../utils/loveAlbum';
import {
  DEFAULT_BRIDE_OUTFIT,
  DEFAULT_GROOM_OUTFIT,
  type BrideOutfitConfig,
  type GroomOutfitConfig,
  type WeddingStage,
} from '../utils/weddingAttire';
import {
  DEFAULT_MUSEUM_MUSIC,
  DEFAULT_MUSEUM_PHOTOS,
  DEFAULT_MUSEUM_SETTINGS,
  DEFAULT_MUSEUM_TEXTS,
  DEFAULT_MUSEUM_VIDEOS,
  textsArrayToMap,
  type MuseumContentBundle,
  type MuseumMusicTrack,
  type MuseumPhotoItem,
  type MuseumSettings,
  type MuseumTextEntry,
  type MuseumVideoItem,
} from '../utils/museumContentTypes';
import {
  DEFAULT_PRIVATE_MEMORIES,
  DEFAULT_SECRET_PROGRESS,
  DEFAULT_SECRET_QUIZ_QUESTIONS,
  type PrivateMemoryItem,
  type SecretMysteryProgress,
  type SecretQuizQuestion,
} from '../utils/secretMystery';
import {
  computeProposalPositions,
  isProposalBusy,
  isSuitableProposalLocation,
  type ProposalStage,
} from '../utils/proposal';
import {
  fetchMuseumContent,
  logoutAdmin,
  postGuestbookNote,
  postSecretProgress,
  type AdminUserSummary,
} from '../utils/apiClient';

const isAutostart =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('autostart') === '1';

export interface JoystickInput {
  x: number;
  y: number;
}

export interface ContextualAction {
  id: string;
  label: string;
  icon?: string;
  keyHint?: string;
  onClick: () => void;
  isPrimary?: boolean;
}

export type CoupleSequenceType = 'none' | 'hug' | 'kiss' | 'sit_transition' | 'stand_transition';

export interface ScriptedWalkRequest {
  target: [number, number, number];
  facing: number;
  onArrive?:
    | 'none'
    | 'sit_cinema'
    | 'sit_garden'
    | 'sit_secret'
    | 'sit_wedding'
    | 'dance_together'
    | 'wedding_aisle';
  benchPos?: [number, number, number];
  benchRot?: number;
}

export interface GameState {
  // Dynamic CMS Museum Content
  photos: MuseumPhotoItem[];
  videos: MuseumVideoItem[];
  texts: MuseumTextEntry[];
  textsMap: Record<string, string>;
  musicTracks: MuseumMusicTrack[];
  museumSettings: MuseumSettings;
  contentLoaded: boolean;

  // Player
  playerPosition: THREE.Vector3;
  playerRotation: number;
  isMoving: boolean;
  isRunning: boolean;
  isJumping: boolean;

  // Partner (Companion)
  partnerPosition: THREE.Vector3;
  partnerRotation: number;
  isHoldingHands: boolean;
  isWalkingTogether: boolean;
  activeCoupleSequence: CoupleSequenceType;
  sequenceProgress: number;
  isDancing: boolean;
  dancePhase: number;

  // Scripted smooth walk
  scriptedWalk: ScriptedWalkRequest | null;

  // Sitting
  isSitting: boolean;
  sittingBenchPosition: [number, number, number] | null;
  sittingBenchRotation: number;

  // Camera
  cameraMode: 'third-person' | 'first-person';
  cameraDistance: number;
  cameraAngleX: number;
  cameraAngleY: number;

  // Rooms
  currentRoom: MuseumRoom;
  visitedRooms: Set<string>;

  // Doors
  isMainDoorOpen: boolean;
  isTheatreDoorOpen: boolean;
  isGardenDoorOpen: boolean;
  isSecretDoorOpen: boolean;
  isWeddingDoorOpen: boolean;

  // Secret Room Mystery & Private Chamber & Wedding Ceremony Experience
  secretQuiz: SecretQuizQuestion[];
  privateMemories: PrivateMemoryItem[];
  secretProgress: SecretMysteryProgress;
  showDoYouLoveMeModal: boolean;
  showLoveQuizModal: boolean;
  loveQuizSkipIntro: boolean;
  showKeyRewardPrompt: boolean;
  isPrivateDoorOpen: boolean;
  keyUnlockAnimActive: boolean;
  secretKeyUnlockAnimActive: boolean;
  nearbyPrivateMemory: PrivateMemoryItem | null;
  activePrivateMemory: PrivateMemoryItem | null;
  showPrivateMemoryModal: boolean;
  secretHintBanner: string | null;
  showSecretLetterModal: boolean;
  secretLetterIndex: number;
  weddingStage: WeddingStage;
  weddingPhase: number;
  weddingPhotoFlash: boolean;
  brideOutfit: BrideOutfitConfig;
  groomOutfit: GroomOutfitConfig;
  weddingBannerMessage: string | null;

  // Proposal Sequence & Responsive Toolbar State
  proposalStage: ProposalStage;
  proposalAnchor: {
    proposer: [number, number, number];
    partner: [number, number, number];
    proposerFacing: number;
    partnerFacing: number;
  } | null;
  showProposalModal: boolean;
  proposalAccepted: boolean;
  coupleToolbarHidden: boolean;

  // Interaction
  nearbyInteractable: string | null;
  nearbyMemory: MemoryItem | null;
  nearbyBench: { id: string; label: string; position: [number, number, number]; rotation: number } | null;
  activeInteraction: string | null;
  contextualActions: ContextualAction[];

  // Cinema
  videoUrl: string;
  cinemaPlaying: boolean;
  cinemaTime: number;
  cinemaDuration: number;
  cinemaReplayToken: number;

  // UI & Modals
  isLoading: boolean;
  loadingProgress: number;
  showPhotoViewer: boolean;
  currentPhoto: string | null;
  currentPhotoMessage: string | null;
  activeMemory: MemoryItem | null;
  showLoveAlbum: boolean;
  albumSpreadIndex: number;
  showVideoPlayer: boolean;
  showGuestbookModal: boolean;
  guestbookEntries: GuestbookEntry[];
  isMusicPlaying: boolean;
  isMuted: boolean;
  showControls: boolean;

  // Admin Session (strictly in-memory token — never persisted to Web Storage)
  showAdminLogin: boolean;
  showAdminPanel: boolean;
  adminToken: string | null;
  adminUser: AdminUserSummary | null;

  // Mobile
  isMobile: boolean;
  joystickInput: JoystickInput;

  // Character
  characterAction: string;
  companionAction: string;

  // Backend hydration
  loadMuseumContent: () => Promise<void>;
  applyMuseumBundle: (bundle: MuseumContentBundle) => void;

  // Actions
  setPlayerPosition: (pos: THREE.Vector3) => void;
  setPlayerRotation: (rot: number) => void;
  setPartnerPosition: (pos: THREE.Vector3) => void;
  setPartnerRotation: (rot: number) => void;
  setIsMoving: (moving: boolean) => void;
  setIsRunning: (running: boolean) => void;
  setIsJumping: (jumping: boolean) => void;

  // Couple & Dance actions
  setIsHoldingHands: (holding: boolean) => void;
  toggleHoldHands: () => void;
  setIsWalkingTogether: (walking: boolean) => void;
  toggleWalkTogether: () => void;
  startCoupleSequence: (seq: CoupleSequenceType) => void;
  setSequenceProgress: (prog: number) => void;
  endCoupleSequence: () => void;
  startDanceMode: () => void;
  activateDanceInPlace: () => void;
  stopDanceMode: () => void;
  setDancePhase: (phase: number) => void;

  // Proposal actions
  startProposal: () => void;
  setProposalStage: (stage: ProposalStage) => void;
  acceptProposal: () => void;
  declineProposal: () => void;
  finishProposal: () => void;
  setCoupleToolbarHidden: (hidden: boolean) => void;
  toggleCoupleToolbarHidden: () => void;

  // Scripted walk
  startScriptedWalk: (req: ScriptedWalkRequest) => void;
  clearScriptedWalk: () => void;

  // Sitting actions
  sitDown: (benchPos: [number, number, number], benchRot?: number) => void;
  standUp: () => void;

  // Doors & Theatre actions
  setMainDoorOpen: (open: boolean) => void;
  setTheatreDoorOpen: (open: boolean) => void;
  toggleTheatreDoor: () => void;
  setGardenDoorOpen: (open: boolean) => void;
  setSecretDoorOpen: (open: boolean) => void;
  setWeddingDoorOpen: (open: boolean) => void;
  enterSecretRoom: () => void;
  exitSecretRoom: () => void;
  setShowDoYouLoveMeModal: (show: boolean) => void;
  confirmDoYouLoveMeYes: () => void;
  setShowLoveQuizModal: (show: boolean, skipIntro?: boolean) => void;
  completeLoveQuiz: () => void;
  collectGoldenKey: () => void;
  unlockOrEnterPrivateChamber: () => void;
  exitPrivateChamberToSecret: () => void;
  exitToMuseumFromPrivateChamber: () => void;
  setNearbyPrivateMemory: (item: PrivateMemoryItem | null) => void;
  openPrivateMemory: (item: PrivateMemoryItem) => void;
  closePrivateMemory: () => void;
  setSecretHintBanner: (msg: string | null) => void;
  setShowSecretLetterModal: (show: boolean) => void;
  setSecretLetterIndex: (index: number) => void;
  enterWeddingHall: () => void;
  exitWeddingHall: () => void;
  startWeddingCeremony: () => void;
  walkWeddingAisle: () => void;
  exchangeWeddingVows: () => void;
  hugAtWedding: () => void;
  celebrateWedding: () => void;
  setWeddingStage: (stage: WeddingStage) => void;
  setWeddingPhase: (phase: number) => void;
  setVideoUrl: (url: string) => void;
  setCinemaPlaying: (playing: boolean) => void;
  setCinemaTime: (time: number) => void;
  replayCinema: () => void;

  // Contextual actions
  setContextualActions: (actions: ContextualAction[]) => void;
  clearContextualActions: () => void;

  // Standard setters
  setCameraMode: (mode: 'third-person' | 'first-person') => void;
  setCameraDistance: (dist: number) => void;
  setCameraAngle: (x: number, y: number) => void;
  setCurrentRoom: (room: MuseumRoom) => void;
  setNearbyInteractable: (id: string | null) => void;
  setNearbyMemory: (memory: MemoryItem | null) => void;
  setNearbyBench: (
    bench: { id: string; label: string; position: [number, number, number]; rotation: number } | null
  ) => void;
  setActiveInteraction: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setShowPhotoViewer: (show: boolean) => void;
  setCurrentPhoto: (photo: string | null, message?: string | null) => void;
  openMemory: (memory: MemoryItem | null) => void;
  openAlbumFromMemory: (memory?: MemoryItem | null) => void;
  setShowLoveAlbum: (show: boolean) => void;
  setAlbumSpreadIndex: (index: number) => void;
  setShowVideoPlayer: (show: boolean) => void;
  setShowGuestbookModal: (show: boolean) => void;
  addGuestbookNote: (author: string, message: string, stamp?: GuestbookStamp) => GuestbookEntry;
  submitGuestbookNote: (author: string, message: string, stamp?: GuestbookStamp) => Promise<GuestbookEntry>;
  setIsMusicPlaying: (playing: boolean) => void;
  toggleMusic: () => void;
  toggleMute: () => void;
  setShowControls: (show: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setJoystickInput: (input: JoystickInput) => void;
  setCharacterAction: (action: string) => void;
  setCompanionAction: (action: string) => void;

  // Admin actions
  setShowAdminLogin: (show: boolean) => void;
  setShowAdminPanel: (show: boolean) => void;
  setAdminSession: (token: string | null, user: AdminUserSummary | null) => void;
  signOutAdmin: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Dynamic Museum Content Defaults (hydrated immediately from /api/museum-content)
  photos: DEFAULT_MUSEUM_PHOTOS,
  videos: DEFAULT_MUSEUM_VIDEOS,
  texts: DEFAULT_MUSEUM_TEXTS,
  textsMap: textsArrayToMap(DEFAULT_MUSEUM_TEXTS),
  musicTracks: DEFAULT_MUSEUM_MUSIC,
  museumSettings: DEFAULT_MUSEUM_SETTINGS,
  contentLoaded: false,

  // Player starts outside the Grand Museum Exterior facing North (-Z, rotation = Math.PI)
  playerPosition: new THREE.Vector3(-0.38, 0, 12.5),
  playerRotation: Math.PI,
  isMoving: false,
  isRunning: false,
  isJumping: false,

  // Partner stands beside the player holding hands
  partnerPosition: new THREE.Vector3(0.38, 0, 12.5),
  partnerRotation: Math.PI,
  isHoldingHands: true,
  isWalkingTogether: true,
  activeCoupleSequence: 'none',
  sequenceProgress: 0,
  isDancing: false,
  dancePhase: 0,

  scriptedWalk: null,

  // Sitting
  isSitting: false,
  sittingBenchPosition: null,
  sittingBenchRotation: 0,

  // Camera starts behind the couple looking toward the museum facade
  cameraMode: 'third-person',
  cameraDistance: 5.4,
  cameraAngleX: 0,
  cameraAngleY: 0.14,

  // Rooms
  currentRoom: 'exterior',
  visitedRooms: new Set(['exterior']),

  // Doors
  isMainDoorOpen: false,
  isTheatreDoorOpen: false,
  isGardenDoorOpen: false,
  isSecretDoorOpen: false,
  isWeddingDoorOpen: false,

  // Secret Room Mystery & Private Chamber & Wedding Ceremony
  secretQuiz: DEFAULT_SECRET_QUIZ_QUESTIONS,
  privateMemories: DEFAULT_PRIVATE_MEMORIES,
  secretProgress: DEFAULT_SECRET_PROGRESS,
  showDoYouLoveMeModal: false,
  showLoveQuizModal: false,
  loveQuizSkipIntro: false,
  showKeyRewardPrompt: false,
  isPrivateDoorOpen: false,
  keyUnlockAnimActive: false,
  secretKeyUnlockAnimActive: false,
  nearbyPrivateMemory: null,
  activePrivateMemory: null,
  showPrivateMemoryModal: false,
  secretHintBanner: null,
  showSecretLetterModal: false,
  secretLetterIndex: 0,
  weddingStage: 'idle',
  weddingPhase: 0,
  weddingPhotoFlash: false,
  brideOutfit: DEFAULT_BRIDE_OUTFIT,
  groomOutfit: DEFAULT_GROOM_OUTFIT,
  weddingBannerMessage: null,

  // Proposal Sequence & Responsive Toolbar State
  proposalStage: 'idle',
  proposalAnchor: null,
  showProposalModal: false,
  proposalAccepted: false,
  coupleToolbarHidden: false,

  // Interaction
  nearbyInteractable: null,
  nearbyMemory: null,
  nearbyBench: null,
  activeInteraction: null,
  contextualActions: [],

  // Theatre
  videoUrl: '/videos/memories.mp4',
  cinemaPlaying: false,
  cinemaTime: 0,
  cinemaDuration: 24,
  cinemaReplayToken: 0,

  // UI
  isLoading: !isAutostart,
  loadingProgress: isAutostart ? 100 : 0,
  showPhotoViewer: false,
  currentPhoto: null,
  currentPhotoMessage: null,
  activeMemory: null,
  showLoveAlbum: false,
  albumSpreadIndex: 0,
  showVideoPlayer: false,
  showGuestbookModal: false,
  guestbookEntries: INITIAL_GUESTBOOK_ENTRIES,
  isMusicPlaying: DEFAULT_MUSEUM_SETTINGS.musicEnabled,
  isMuted: false,
  showControls: false,

  // Admin Session (in-memory only)
  showAdminLogin: false,
  showAdminPanel: false,
  adminToken: null,
  adminUser: null,

  // Mobile
  isMobile: false,
  joystickInput: { x: 0, y: 0 },

  // Character
  characterAction: 'idle',
  companionAction: 'idle',

  loadMuseumContent: async () => {
    try {
      const bundle = await fetchMuseumContent();
      get().applyMuseumBundle(bundle);
    } catch {
      set({ contentLoaded: true });
    }
  },

  applyMuseumBundle: (bundle) => {
    const activeTheatreVideo =
      bundle.videos.find((v) => v.isTheatreActive) ?? bundle.videos[0] ?? null;
    set((s) => ({
      photos: bundle.photos,
      videos: bundle.videos,
      texts: bundle.texts,
      textsMap: textsArrayToMap(bundle.texts),
      musicTracks: bundle.musicTracks,
      museumSettings: bundle.settings,
      videoUrl: activeTheatreVideo ? activeTheatreVideo.videoSrc : s.videoUrl,
      isMusicPlaying: bundle.settings.musicEnabled,
      guestbookEntries:
        bundle.guestbookEntries && bundle.guestbookEntries.length > 0
          ? bundle.guestbookEntries
          : s.guestbookEntries,
      secretQuiz:
        bundle.secretQuiz && bundle.secretQuiz.length > 0 ? bundle.secretQuiz : s.secretQuiz,
      privateMemories:
        bundle.privateMemories && bundle.privateMemories.length > 0
          ? bundle.privateMemories
          : s.privateMemories,
      secretProgress: bundle.secretProgress ?? s.secretProgress,
      isSecretDoorOpen: bundle.secretProgress
        ? bundle.secretProgress.secretDoorUnlocked
          ? s.isSecretDoorOpen
          : false
        : s.isSecretDoorOpen,
      isPrivateDoorOpen: bundle.secretProgress
        ? bundle.secretProgress.secondDoorUnlocked
          ? s.isPrivateDoorOpen
          : false
        : s.isPrivateDoorOpen,
      showKeyRewardPrompt: bundle.secretProgress?.keyCollected ? false : s.showKeyRewardPrompt,
      contentLoaded: true,
    }));
  },

  // Actions — mutate playerPosition vector in place to avoid 60Hz React re-renders
  setPlayerPosition: (pos) => {
    get().playerPosition.copy(pos);
  },
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setPartnerPosition: (pos) => {
    get().partnerPosition.copy(pos);
  },
  setPartnerRotation: (rot) => set({ partnerRotation: rot }),
  setIsMoving: (moving) => {
    if (get().isMoving !== moving) set({ isMoving: moving });
  },
  setIsRunning: (running) => {
    if (get().isRunning !== running) set({ isRunning: running });
  },
  setIsJumping: (jumping) => {
    if (get().isJumping !== jumping) set({ isJumping: jumping });
  },

  // Couple & Dance
  setIsHoldingHands: (holding) => {
    if (isProposalBusy(get().proposalStage)) return;
    set({ isHoldingHands: holding });
  },
  toggleHoldHands: () => {
    if (isProposalBusy(get().proposalStage)) return;
    set((s) => ({ isHoldingHands: !s.isHoldingHands }));
  },
  setIsWalkingTogether: (walking) => {
    if (isProposalBusy(get().proposalStage)) return;
    set({ isWalkingTogether: walking });
  },
  toggleWalkTogether: () => {
    if (isProposalBusy(get().proposalStage)) return;
    set((s) => ({ isWalkingTogether: !s.isWalkingTogether }));
  },

  startCoupleSequence: (seq) => {
    if (isProposalBusy(get().proposalStage)) return;
    set({
      activeCoupleSequence: seq,
      sequenceProgress: 0,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      scriptedWalk: null,
      characterAction: seq === 'hug' || seq === 'kiss' ? seq : 'idle',
      companionAction: seq === 'hug' || seq === 'kiss' ? seq : 'idle',
    });
  },
  setSequenceProgress: (prog) => set({ sequenceProgress: prog }),
  endCoupleSequence: () =>
    set({
      activeCoupleSequence: 'none',
      sequenceProgress: 0,
      characterAction: get().isSitting ? 'sit' : get().isDancing ? 'dance' : 'idle',
      companionAction: get().isSitting ? 'sit' : get().isDancing ? 'dance' : 'idle',
    }),

  startDanceMode: () => {
    const s = get();
    if (isProposalBusy(s.proposalStage)) return;
    // Ensure closed room doorways don't block the couple walking to the Dance Pavilion
    const openMain = s.currentRoom === 'exterior' ? true : s.isMainDoorOpen;
    const openTheatre = s.currentRoom === 'cinema' ? true : s.isTheatreDoorOpen;
    const openGarden = s.currentRoom === 'garden' ? true : s.isGardenDoorOpen;

    set({
      isMainDoorOpen: openMain,
      isTheatreDoorOpen: openTheatre,
      isGardenDoorOpen: openGarden,
      isSitting: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
      isDancing: false,
      isMusicPlaying: s.museumSettings.musicEnabled,
      scriptedWalk: {
        target: DANCE_SPOT_POS,
        facing: Math.PI,
        onArrive: 'dance_together',
      },
    });
  },

  activateDanceInPlace: () =>
    set({
      scriptedWalk: null,
      isSitting: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
      isDancing: true,
      isMoving: false,
      isRunning: false,
      characterAction: 'dance',
      companionAction: 'dance',
    }),

  stopDanceMode: () => {
    const s = get();
    if (!s.isDancing && s.scriptedWalk?.onArrive !== 'dance_together') return;
    set({
      isDancing: false,
      scriptedWalk: s.scriptedWalk?.onArrive === 'dance_together' ? null : s.scriptedWalk,
      characterAction: 'idle',
      companionAction: 'idle',
    });
  },

  setDancePhase: (phase) => {
    if (Math.abs(get().dancePhase - phase) > 0.01) set({ dancePhase: phase });
  },

  // Proposal Sequence Actions
  startProposal: () => {
    const s = get();
    if (isProposalBusy(s.proposalStage)) return;
    if (
      !isSuitableProposalLocation(s.currentRoom, s.playerPosition, {
        isSitting: s.isSitting,
        isDancing: s.isDancing,
        proposalStage: s.proposalStage,
        activeCoupleSequence: s.activeCoupleSequence,
        secretRoomUnlocked: s.secretProgress.secretDoorUnlocked,
      })
    ) {
      return;
    }
    const anchor = computeProposalPositions(s.playerPosition, s.playerRotation, 0.98);
    set({
      proposalStage: 'approaching',
      proposalAnchor: anchor,
      showProposalModal: false,
      isHoldingHands: false,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      scriptedWalk: null,
      activeCoupleSequence: 'none',
      isMoving: true,
      characterAction: 'walk',
      companionAction: 'walk',
    });
  },

  setProposalStage: (stage) => {
    const s = get();
    if (stage === 'awaiting_answer') {
      set({
        proposalStage: 'awaiting_answer',
        showProposalModal: true,
        isMoving: false,
        characterAction: 'propose_kneel',
        companionAction: 'propose_surprised',
      });
    } else if (stage === 'kneeling') {
      set({
        proposalStage: 'kneeling',
        isMoving: false,
        characterAction: 'propose_kneel',
        companionAction: 'propose_surprised',
      });
    } else if (stage === 'embracing') {
      const baseAnchor = s.proposalAnchor ?? computeProposalPositions(s.playerPosition, s.playerRotation, 0.98);
      const midX = (baseAnchor.proposer[0] + baseAnchor.partner[0]) * 0.5;
      const midZ = (baseAnchor.proposer[2] + baseAnchor.partner[2]) * 0.5;
      const dirX = Math.sin(baseAnchor.proposerFacing);
      const dirZ = Math.cos(baseAnchor.proposerFacing);
      set({
        proposalStage: 'embracing',
        proposalAnchor: {
          proposer: [midX - dirX * 0.25, 0, midZ - dirZ * 0.25],
          partner: [midX + dirX * 0.25, 0, midZ + dirZ * 0.25],
          proposerFacing: baseAnchor.proposerFacing,
          partnerFacing: baseAnchor.partnerFacing,
        },
        characterAction: 'propose_embrace',
        companionAction: 'propose_embrace',
      });
    } else if (stage === 'celebrating') {
      set({
        proposalStage: 'celebrating',
        characterAction: 'celebrate',
        companionAction: 'celebrate',
      });
    } else if (stage === 'idle') {
      set({
        proposalStage: 'idle',
        proposalAnchor: null,
        showProposalModal: false,
        characterAction: 'idle',
        companionAction: 'idle',
      });
    } else {
      set({ proposalStage: stage });
    }
  },

  acceptProposal: () =>
    set({
      showProposalModal: false,
      proposalAccepted: true,
      proposalStage: 'accepted_standing',
      characterAction: 'propose_stand',
      companionAction: 'propose_accept',
      secretHintBanner: 'She said YES! Forever begins right here ❤️',
    }),

  declineProposal: () => {
    set({
      showProposalModal: false,
      proposalStage: 'idle',
      proposalAnchor: null,
      characterAction: 'idle',
      companionAction: 'idle',
      secretHintBanner: 'Keep exploring the museum together — ask again whenever the moment feels right ♡',
    });
    setTimeout(() => {
      if (get().secretHintBanner?.startsWith('Keep exploring the museum')) {
        set({ secretHintBanner: null });
      }
    }, 3600);
  },

  finishProposal: () =>
    set({
      proposalStage: 'idle',
      proposalAnchor: null,
      showProposalModal: false,
      characterAction: 'idle',
      companionAction: 'idle',
      secretHintBanner: null,
    }),

  setCoupleToolbarHidden: (hidden) => set({ coupleToolbarHidden: hidden }),
  toggleCoupleToolbarHidden: () => set((s) => ({ coupleToolbarHidden: !s.coupleToolbarHidden })),

  // Scripted walk
  startScriptedWalk: (req) => {
    if (isProposalBusy(get().proposalStage)) return;
    set({
      scriptedWalk: req,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
    });
  },
  clearScriptedWalk: () => set({ scriptedWalk: null }),

  // Sitting
  sitDown: (benchPos, benchRot = 0) => {
    if (isProposalBusy(get().proposalStage)) return;
    set({
      isSitting: true,
      isDancing: false,
      sittingBenchPosition: benchPos,
      sittingBenchRotation: benchRot,
      scriptedWalk: null,
      activeCoupleSequence: 'none',
      characterAction: 'sit',
      companionAction: 'sit',
    });
  },
  standUp: () =>
    set({
      isSitting: false,
      sittingBenchPosition: null,
      characterAction: 'idle',
      companionAction: 'idle',
    }),

  // Doors & Theatre
  setMainDoorOpen: (open) => set({ isMainDoorOpen: open }),
  setTheatreDoorOpen: (open) => set({ isTheatreDoorOpen: open }),
  toggleTheatreDoor: () => set((s) => ({ isTheatreDoorOpen: !s.isTheatreDoorOpen })),
  setGardenDoorOpen: (open) => set({ isGardenDoorOpen: open }),
  setSecretDoorOpen: (open) => set({ isSecretDoorOpen: open }),
  setWeddingDoorOpen: (open) => set({ isWeddingDoorOpen: open }),

  enterSecretRoom: () => {
    const s = get();
    if (!s.secretProgress.secretDoorUnlocked) {
      if (!s.secretProgress.keyCollected) {
        set({
          isSecretDoorOpen: false,
          scriptedWalk: null,
          secretHintBanner: !s.secretProgress.yesConfirmed
            ? 'Secret Room is locked! Approach the Quiz Master nearby to begin the Love Test and earn the Golden Key.'
            : !s.secretProgress.quizCompleted
            ? 'Secret Room is locked! Complete the 5-question Love Test with the Quiz Master first.'
            : 'Secret Room is locked! Open the glowing Reward Box nearby and collect your Golden Key.',
        });
        setTimeout(() => {
          if (get().secretHintBanner?.startsWith('Secret Room is locked!')) {
            set({ secretHintBanner: null });
          }
        }, 4500);
        return;
      }

      // Key is collected! Play Golden Key unlocking animation, persist unlock, open door, then walk in naturally
      if (s.secretKeyUnlockAnimActive) return;
      set({
        secretKeyUnlockAnimActive: true,
        isSecretDoorOpen: false,
        scriptedWalk: null,
        secretHintBanner: 'Unlocking Our Secret Room with your Golden Key...',
      });
      setTimeout(() => {
        set((cur) => ({
          secretKeyUnlockAnimActive: false,
          isSecretDoorOpen: true,
          isSitting: false,
          isDancing: false,
          sittingBenchPosition: null,
          activeCoupleSequence: 'none',
          secretHintBanner: 'Our Secret Room Unlocked ❤️',
          secretProgress: {
            ...cur.secretProgress,
            secretDoorUnlocked: true,
            updatedAt: Date.now(),
          },
          scriptedWalk: {
            target: SECRET_ARRIVAL_POS,
            facing: Math.PI / 2,
          },
        }));
        void postSecretProgress({ secretDoorUnlocked: true })
          .then((prog) => set({ secretProgress: prog }))
          .catch(() => {});
        setTimeout(() => {
          if (get().secretHintBanner === 'Our Secret Room Unlocked ❤️') {
            set({ secretHintBanner: null });
          }
        }, 3600);
      }, 1350);
      return;
    }

    set({
      isSecretDoorOpen: true,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
      scriptedWalk: {
        target: SECRET_ARRIVAL_POS,
        facing: Math.PI / 2,
      },
    });
  },

  exitSecretRoom: () =>
    set({
      isSecretDoorOpen: true,
      isSitting: false,
      sittingBenchPosition: null,
      showSecretLetterModal: false,
      showLoveQuizModal: false,
      scriptedWalk: {
        target: SECRET_RETURN_POS,
        facing: -Math.PI / 2,
      },
    }),

  setShowDoYouLoveMeModal: (show) => set({ showDoYouLoveMeModal: show }),

  confirmDoYouLoveMeYes: () => {
    set((s) => ({
      showDoYouLoveMeModal: false,
      showLoveQuizModal: !s.secretProgress.quizCompleted,
      loveQuizSkipIntro: false,
      isSecretDoorOpen: false,
      secretProgress: {
        ...s.secretProgress,
        yesConfirmed: true,
        updatedAt: Date.now(),
      },
    }));
    void postSecretProgress({ yesConfirmed: true })
      .then((prog) => set({ secretProgress: prog }))
      .catch(() => {});
  },

  setShowLoveQuizModal: (show, skipIntro = false) =>
    set({ showLoveQuizModal: show, loveQuizSkipIntro: Boolean(skipIntro) }),

  completeLoveQuiz: () => {
    set((s) => ({
      showLoveQuizModal: false,
      showKeyRewardPrompt: !s.secretProgress.keyCollected,
      isSecretDoorOpen: false,
      secretHintBanner: !s.secretProgress.keyCollected
        ? 'The Reward Box opened! Collect the Golden Key before unlocking the Secret Room.'
        : null,
      secretProgress: {
        ...s.secretProgress,
        quizCompleted: true,
        updatedAt: Date.now(),
      },
    }));
    void postSecretProgress({ quizCompleted: true })
      .then((prog) => set({ secretProgress: prog }))
      .catch(() => {});
  },

  collectGoldenKey: () => {
    set((s) => ({
      showKeyRewardPrompt: false,
      isSecretDoorOpen: false,
      secretHintBanner:
        'Golden Key collected! Approach the Secret Room entrance and select UNLOCK SECRET ROOM.',
      secretProgress: {
        ...s.secretProgress,
        quizCompleted: true,
        keyCollected: true,
        updatedAt: Date.now(),
      },
    }));
    void postSecretProgress({ quizCompleted: true, keyCollected: true })
      .then((prog) => set({ secretProgress: prog }))
      .catch(() => {});
    setTimeout(() => {
      if (get().secretHintBanner?.startsWith('Golden Key collected!')) {
        set({ secretHintBanner: null });
      }
    }, 5200);
  },

  unlockOrEnterPrivateChamber: () => {
    const s = get();
    if (!s.secretProgress.keyCollected) {
      set({
        secretHintBanner:
          'This door is sealed. Answer the 5-question Love Test with the Quiz Master and collect the golden key from the chest first!',
      });
      setTimeout(() => {
        if (get().secretHintBanner?.startsWith('This door is sealed.')) {
          set({ secretHintBanner: null });
        }
      }, 4500);
      return;
    }

    if (!s.secretProgress.secondDoorUnlocked) {
      if (s.keyUnlockAnimActive) return;
      set({
        keyUnlockAnimActive: true,
        secretHintBanner: 'Unlocking the hidden chamber with your Golden Key...',
      });
      setTimeout(() => {
        set((cur) => ({
          keyUnlockAnimActive: false,
          isPrivateDoorOpen: true,
          isSitting: false,
          sittingBenchPosition: null,
          secretHintBanner: 'Welcome to Our Private Memories ❤️',
          secretProgress: {
            ...cur.secretProgress,
            secondDoorUnlocked: true,
            chamberDiscovered: true,
            updatedAt: Date.now(),
          },
          scriptedWalk: {
            target: PRIVATE_CHAMBER_ARRIVAL_POS,
            facing: Math.PI / 2,
          },
        }));
        void postSecretProgress({ secondDoorUnlocked: true, chamberDiscovered: true })
          .then((prog) => set({ secretProgress: prog }))
          .catch(() => {});
        setTimeout(() => {
          if (get().secretHintBanner === 'Welcome to Our Private Memories ❤️') {
            set({ secretHintBanner: null });
          }
        }, 3800);
      }, 1400);
      return;
    }

    set({
      isPrivateDoorOpen: true,
      isSitting: false,
      sittingBenchPosition: null,
      scriptedWalk: {
        target: PRIVATE_CHAMBER_ARRIVAL_POS,
        facing: Math.PI / 2,
      },
    });
  },

  exitPrivateChamberToSecret: () =>
    set({
      isPrivateDoorOpen: true,
      isSitting: false,
      sittingBenchPosition: null,
      showPrivateMemoryModal: false,
      activePrivateMemory: null,
      scriptedWalk: {
        target: PRIVATE_CHAMBER_RETURN_POS,
        facing: -Math.PI / 2,
      },
    }),

  exitToMuseumFromPrivateChamber: () =>
    set({
      isPrivateDoorOpen: true,
      isSecretDoorOpen: true,
      isSitting: false,
      sittingBenchPosition: null,
      showPrivateMemoryModal: false,
      activePrivateMemory: null,
      scriptedWalk: {
        target: SECRET_RETURN_POS,
        facing: -Math.PI / 2,
      },
    }),

  setNearbyPrivateMemory: (item) => {
    if (get().nearbyPrivateMemory?.id !== item?.id) {
      set({ nearbyPrivateMemory: item });
    }
  },

  openPrivateMemory: (item) =>
    set({
      activePrivateMemory: item,
      showPrivateMemoryModal: true,
    }),

  closePrivateMemory: () =>
    set({
      showPrivateMemoryModal: false,
      activePrivateMemory: null,
    }),

  setSecretHintBanner: (msg) => set({ secretHintBanner: msg }),

  setShowSecretLetterModal: (show) => set({ showSecretLetterModal: show }),
  setSecretLetterIndex: (index) => set({ secretLetterIndex: Math.max(0, index) }),

  enterWeddingHall: () => {
    set({
      isWeddingDoorOpen: true,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
      weddingPhotoFlash: false,
      weddingStage: 'ready',
      weddingBannerMessage: 'Welcome to Our Wedding Day — Press Start Wedding to begin',
      scriptedWalk: {
        target: WEDDING_ARRIVAL_POS,
        facing: Math.PI,
      },
    });
  },

  exitWeddingHall: () =>
    set({
      isWeddingDoorOpen: true,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
      weddingPhotoFlash: false,
      weddingStage: 'idle',
      weddingBannerMessage: null,
      scriptedWalk: {
        target: WEDDING_RETURN_POS,
        facing: 0.68,
      },
    }),

  startWeddingCeremony: () =>
    set({
      isHoldingHands: true,
      isWalkingTogether: true,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
      weddingPhotoFlash: false,
      weddingStage: 'aisle_walk',
      weddingBannerMessage: 'Walking hand in hand down the floral aisle...',
      scriptedWalk: {
        target: [WEDDING_ALTAR_CENTER[0], 0, WEDDING_ALTAR_CENTER[2] + 0.3],
        facing: Math.PI,
        onArrive: 'wedding_aisle',
      },
    }),

  walkWeddingAisle: () =>
    set({
      isHoldingHands: true,
      isWalkingTogether: true,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
      weddingPhotoFlash: false,
      weddingStage: 'aisle_walk',
      weddingBannerMessage: 'Walking together beneath the morning blooms...',
      scriptedWalk: {
        target: [WEDDING_ALTAR_CENTER[0], 0, WEDDING_ALTAR_CENTER[2] + 0.3],
        facing: Math.PI,
        onArrive: 'wedding_aisle',
      },
    }),

  exchangeWeddingVows: () =>
    set({
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      scriptedWalk: null,
      activeCoupleSequence: 'none',
      weddingPhotoFlash: false,
      isHoldingHands: true,
      weddingStage: 'vows',
      weddingBannerMessage: '“With this ring and all my heart, I choose you today and always.”',
    }),

  hugAtWedding: () =>
    set({
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      scriptedWalk: null,
      activeCoupleSequence: 'none',
      weddingPhotoFlash: false,
      weddingStage: 'hug',
      weddingBannerMessage: 'Sealed with a heartfelt embrace beneath the wedding arch',
      characterAction: 'hug',
      companionAction: 'hug',
    }),

  celebrateWedding: () => {
    set({
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      scriptedWalk: null,
      activeCoupleSequence: 'none',
      weddingPhotoFlash: false,
      weddingStage: 'celebrating',
      weddingPhase: 0,
      weddingBannerMessage: 'Just Married! Celebrate together beneath falling red rose petals',
      characterAction: 'celebrate',
      companionAction: 'celebrate',
    });
    setTimeout(() => {
      if (get().currentRoom === 'wedding' && get().weddingStage === 'celebrating') {
        set({ weddingPhotoFlash: true });
        setTimeout(() => {
          set({ weddingPhotoFlash: false });
        }, 2100);
      }
    }, 1500);
  },

  setWeddingStage: (stage) => set({ weddingStage: stage }),
  setWeddingPhase: (phase) => {
    if (Math.abs(get().weddingPhase - phase) > 0.01) set({ weddingPhase: phase });
  },

  setVideoUrl: (url) => set({ videoUrl: url }),
  setCinemaPlaying: (playing) => set({ cinemaPlaying: playing }),
  setCinemaTime: (time) => set({ cinemaTime: time }),
  replayCinema: () =>
    set((s) => ({
      cinemaTime: 0,
      cinemaPlaying: true,
      cinemaReplayToken: s.cinemaReplayToken + 1,
    })),

  // Contextual actions
  setContextualActions: (actions) => set({ contextualActions: actions }),
  clearContextualActions: () => set({ contextualActions: [] }),

  // Camera & rooms
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCameraDistance: (dist) => set({ cameraDistance: clampCameraDistance(dist) }),
  setCameraAngle: (x, y) => set({ cameraAngleX: x, cameraAngleY: clampCameraPitch(y) }),
  setCurrentRoom: (room) => {
    const prev = get().currentRoom;
    if (prev === room) return;
    set((state) => {
      const enteringWedding = room === 'wedding' && state.weddingStage === 'idle';
      const leavingWedding = prev === 'wedding' && room !== 'wedding';
      return {
        currentRoom: room,
        visitedRooms: new Set([...state.visitedRooms, room]),
        weddingPhotoFlash: leavingWedding ? false : state.weddingPhotoFlash,
        weddingStage: leavingWedding
          ? 'idle'
          : enteringWedding
          ? 'ready'
          : state.weddingStage,
        weddingBannerMessage: leavingWedding
          ? null
          : enteringWedding && !state.weddingBannerMessage
          ? 'Welcome to Our Wedding Day — Press Start Wedding to begin'
          : state.weddingBannerMessage,
      };
    });
  },
  setNearbyInteractable: (id) => {
    if (get().nearbyInteractable !== id) set({ nearbyInteractable: id });
  },
  setNearbyMemory: (memory) => {
    if (get().nearbyMemory?.id !== memory?.id) set({ nearbyMemory: memory });
  },
  setNearbyBench: (bench) => {
    if (get().nearbyBench?.id !== bench?.id) set({ nearbyBench: bench });
  },
  setActiveInteraction: (id) => set({ activeInteraction: id }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setShowPhotoViewer: (show) => set({ showPhotoViewer: show }),
  setCurrentPhoto: (photo, message = null) =>
    set({
      currentPhoto: photo,
      currentPhotoMessage: message,
      activeMemory: photo === null ? null : get().activeMemory,
      showPhotoViewer: photo !== null,
    }),
  openMemory: (memory) =>
    set({
      activeMemory: memory,
      currentPhoto: memory ? memory.photoSrc : null,
      currentPhotoMessage: memory ? memory.description : null,
      showPhotoViewer: memory !== null,
    }),
  openAlbumFromMemory: (memory = null) => {
    const spreads = buildAlbumSpreads(get().photos);
    let targetSpread = 0;
    if (memory) {
      const idx = spreads.findIndex(
        (sp) =>
          sp.leftPage?.id === memory.id ||
          sp.rightPage?.id === memory.id ||
          sp.leftPage?.photoSrc === memory.photoSrc ||
          sp.rightPage?.photoSrc === memory.photoSrc
      );
      if (idx >= 0) targetSpread = idx;
    }
    set({
      showPhotoViewer: false,
      showVideoPlayer: false,
      albumSpreadIndex: targetSpread,
      showLoveAlbum: true,
    });
  },
  setShowLoveAlbum: (show) => set({ showLoveAlbum: show }),
  setAlbumSpreadIndex: (index) => set({ albumSpreadIndex: Math.max(0, index) }),
  setShowVideoPlayer: (show) => set({ showVideoPlayer: show }),
  setShowGuestbookModal: (show) => set({ showGuestbookModal: show }),
  addGuestbookNote: (author, message, stamp = '♡') => {
    const newEntry = createGuestbookEntry(author, message, stamp);
    set((state) => ({
      guestbookEntries: addGuestbookEntry(state.guestbookEntries, newEntry),
    }));
    return newEntry;
  },
  submitGuestbookNote: async (author, message, stamp = '♡') => {
    try {
      const saved = await postGuestbookNote(author, message, stamp);
      set((state) => ({
        guestbookEntries: addGuestbookEntry(state.guestbookEntries, saved),
      }));
      return saved;
    } catch {
      return get().addGuestbookNote(author, message, stamp);
    }
  },
  setIsMusicPlaying: (playing) => set({ isMusicPlaying: playing }),
  toggleMusic: () => set((state) => ({ isMusicPlaying: !state.isMusicPlaying })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setShowControls: (show) => set({ showControls: show }),
  setIsMobile: (mobile) => set({ isMobile: mobile }),
  setJoystickInput: (input) => set({ joystickInput: input }),
  setCharacterAction: (action) => {
    if (get().characterAction !== action) set({ characterAction: action });
  },
  setCompanionAction: (action) => {
    if (get().companionAction !== action) set({ companionAction: action });
  },

  // Admin actions
  setShowAdminLogin: (show) => set({ showAdminLogin: show }),
  setShowAdminPanel: (show) => set({ showAdminPanel: show }),
  setAdminSession: (token, user) => set({ adminToken: token, adminUser: user }),
  signOutAdmin: async () => {
    const token = get().adminToken;
    set({ adminToken: null, adminUser: null, showAdminPanel: false });
    await logoutAdmin(token);
  },
}));

if (typeof window !== 'undefined') {
  (window as unknown as { __LOVE_MUSEUM_STORE__?: typeof useGameStore }).__LOVE_MUSEUM_STORE__ =
    useGameStore;
}
