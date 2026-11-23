import { create } from 'zustand';
import * as THREE from 'three';

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

export interface GameState {
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
  currentRoom: string;
  visitedRooms: Set<string>;

  // Interaction
  nearbyInteractable: string | null;
  activeInteraction: string | null;
  contextualActions: ContextualAction[];

  // Theatre
  isTheatreDoorOpen: boolean;
  videoUrl: string;

  // UI
  isLoading: boolean;
  loadingProgress: number;
  showPhotoViewer: boolean;
  currentPhoto: string | null;
  currentPhotoMessage: string | null;
  showVideoPlayer: boolean;
  isMusicPlaying: boolean;
  isMuted: boolean;
  showControls: boolean;

  // Mobile
  isMobile: boolean;
  joystickInput: JoystickInput;

  // Character
  characterAction: string;
  companionAction: string;

  // Actions
  setPlayerPosition: (pos: THREE.Vector3) => void;
  setPlayerRotation: (rot: number) => void;
  setPartnerPosition: (pos: THREE.Vector3) => void;
  setPartnerRotation: (rot: number) => void;
  setIsMoving: (moving: boolean) => void;
  setIsRunning: (running: boolean) => void;
  setIsJumping: (jumping: boolean) => void;

  // Couple actions
  setIsHoldingHands: (holding: boolean) => void;
  toggleHoldHands: () => void;
  setIsWalkingTogether: (walking: boolean) => void;
  toggleWalkTogether: () => void;
  startCoupleSequence: (seq: CoupleSequenceType) => void;
  setSequenceProgress: (prog: number) => void;
  endCoupleSequence: () => void;

  // Sitting actions
  sitDown: (benchPos: [number, number, number], benchRot?: number) => void;
  standUp: () => void;

  // Theatre actions
  setTheatreDoorOpen: (open: boolean) => void;
  toggleTheatreDoor: () => void;
  setVideoUrl: (url: string) => void;

  // Contextual actions
  setContextualActions: (actions: ContextualAction[]) => void;
  clearContextualActions: () => void;

  // Standard setters
  setCameraMode: (mode: 'third-person' | 'first-person') => void;
  setCameraDistance: (dist: number) => void;
  setCameraAngle: (x: number, y: number) => void;
  setCurrentRoom: (room: string) => void;
  setNearbyInteractable: (id: string | null) => void;
  setActiveInteraction: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setShowPhotoViewer: (show: boolean) => void;
  setCurrentPhoto: (photo: string | null, message?: string | null) => void;
  setShowVideoPlayer: (show: boolean) => void;
  toggleMusic: () => void;
  toggleMute: () => void;
  setShowControls: (show: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setJoystickInput: (input: JoystickInput) => void;
  setCharacterAction: (action: string) => void;
  setCompanionAction: (action: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Player
  playerPosition: new THREE.Vector3(0, 0, 0),
  playerRotation: 0,
  isMoving: false,
  isRunning: false,
  isJumping: false,

  // Partner
  partnerPosition: new THREE.Vector3(0.9, 0, 0),
  partnerRotation: 0,
  isHoldingHands: true,
  isWalkingTogether: true,
  activeCoupleSequence: 'none',
  sequenceProgress: 0,

  // Sitting
  isSitting: false,
  sittingBenchPosition: null,
  sittingBenchRotation: 0,

  // Camera
  cameraMode: 'third-person',
  cameraDistance: 5,
  cameraAngleX: 0,
  cameraAngleY: 0.3,

  // Rooms
  currentRoom: 'entrance',
  visitedRooms: new Set(['entrance']),

  // Interaction
  nearbyInteractable: null,
  activeInteraction: null,
  contextualActions: [],

  // Theatre
  isTheatreDoorOpen: false,
  videoUrl: '/videos/memories.mp4',

  // UI
  isLoading: true,
  loadingProgress: 0,
  showPhotoViewer: false,
  currentPhoto: null,
  currentPhotoMessage: null,
  showVideoPlayer: false,
  isMusicPlaying: false,
  isMuted: false,
  showControls: false,

  // Mobile
  isMobile: false,
  joystickInput: { x: 0, y: 0 },

  // Character
  characterAction: 'idle',
  companionAction: 'idle',

  // Actions
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setPartnerPosition: (pos) => set({ partnerPosition: pos }),
  setPartnerRotation: (rot) => set({ partnerRotation: rot }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setIsRunning: (running) => set({ isRunning: running }),
  setIsJumping: (jumping) => set({ isJumping: jumping }),

  // Couple
  setIsHoldingHands: (holding) => set({ isHoldingHands: holding }),
  toggleHoldHands: () => set((s) => ({ isHoldingHands: !s.isHoldingHands })),
  setIsWalkingTogether: (walking) => set({ isWalkingTogether: walking }),
  toggleWalkTogether: () => set((s) => ({ isWalkingTogether: !s.isWalkingTogether })),
  startCoupleSequence: (seq) => set({ activeCoupleSequence: seq, sequenceProgress: 0 }),
  setSequenceProgress: (prog) => set({ sequenceProgress: prog }),
  endCoupleSequence: () =>
    set({
      activeCoupleSequence: 'none',
      sequenceProgress: 0,
      characterAction: get().isSitting ? 'sit' : 'idle',
      companionAction: get().isSitting ? 'sit' : 'idle',
    }),

  // Sitting
  sitDown: (benchPos, benchRot = 0) =>
    set({
      isSitting: true,
      sittingBenchPosition: benchPos,
      sittingBenchRotation: benchRot,
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

  // Theatre
  setTheatreDoorOpen: (open) => set({ isTheatreDoorOpen: open }),
  toggleTheatreDoor: () => set((s) => ({ isTheatreDoorOpen: !s.isTheatreDoorOpen })),
  setVideoUrl: (url) => set({ videoUrl: url }),

  // Contextual actions
  setContextualActions: (actions) => set({ contextualActions: actions }),
  clearContextualActions: () => set({ contextualActions: [] }),

  // Camera & rooms
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCameraDistance: (dist) => set({ cameraDistance: Math.max(2, Math.min(12, dist)) }),
  setCameraAngle: (x, y) => set({ cameraAngleX: x, cameraAngleY: Math.max(-0.5, Math.min(1.2, y)) }),
  setCurrentRoom: (room) =>
    set((state) => ({
      currentRoom: room,
      visitedRooms: new Set([...state.visitedRooms, room]),
    })),
  setNearbyInteractable: (id) => set({ nearbyInteractable: id }),
  setActiveInteraction: (id) => set({ activeInteraction: id }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setShowPhotoViewer: (show) => set({ showPhotoViewer: show }),
  setCurrentPhoto: (photo, message = null) =>
    set({ currentPhoto: photo, currentPhotoMessage: message, showPhotoViewer: photo !== null }),
  setShowVideoPlayer: (show) => set({ showVideoPlayer: show }),
  toggleMusic: () => set((state) => ({ isMusicPlaying: !state.isMusicPlaying })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setShowControls: (show) => set({ showControls: show }),
  setIsMobile: (mobile) => set({ isMobile: mobile }),
  setJoystickInput: (input) => set({ joystickInput: input }),
  setCharacterAction: (action) => set({ characterAction: action }),
  setCompanionAction: (action) => set({ companionAction: action }),
}));
