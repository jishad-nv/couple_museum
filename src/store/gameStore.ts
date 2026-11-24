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
  clampCameraDistance,
  clampCameraPitch,
  type MuseumRoom,
} from '../utils/museumLayout';
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
  fetchMuseumContent,
  logoutAdmin,
  postGuestbookNote,
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
  onArrive?: 'none' | 'sit_cinema' | 'sit_garden' | 'dance_together';
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
  setIsHoldingHands: (holding) => set({ isHoldingHands: holding }),
  toggleHoldHands: () => set((s) => ({ isHoldingHands: !s.isHoldingHands })),
  setIsWalkingTogether: (walking) => set({ isWalkingTogether: walking }),
  toggleWalkTogether: () => set((s) => ({ isWalkingTogether: !s.isWalkingTogether })),

  startCoupleSequence: (seq) =>
    set({
      activeCoupleSequence: seq,
      sequenceProgress: 0,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      scriptedWalk: null,
      characterAction: seq === 'hug' || seq === 'kiss' ? seq : 'idle',
      companionAction: seq === 'hug' || seq === 'kiss' ? seq : 'idle',
    }),
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

  // Scripted walk
  startScriptedWalk: (req) =>
    set({
      scriptedWalk: req,
      isSitting: false,
      isDancing: false,
      sittingBenchPosition: null,
      activeCoupleSequence: 'none',
    }),
  clearScriptedWalk: () => set({ scriptedWalk: null }),

  // Sitting
  sitDown: (benchPos, benchRot = 0) =>
    set({
      isSitting: true,
      isDancing: false,
      sittingBenchPosition: benchPos,
      sittingBenchRotation: benchRot,
      scriptedWalk: null,
      activeCoupleSequence: 'none',
      characterAction: 'sit',
      companionAction: 'sit',
    }),
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
    if (get().currentRoom === room) return;
    set((state) => ({
      currentRoom: room,
      visitedRooms: new Set([...state.visitedRooms, room]),
    }));
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
