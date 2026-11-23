import * as THREE from 'three';

// Player
export const PLAYER_SPEED = 4;
export const PLAYER_RUN_SPEED = 7;
export const PLAYER_JUMP_FORCE = 5;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_RADIUS = 0.3;

// Camera
export const CAMERA_DEFAULT_DISTANCE = 5;
export const CAMERA_MIN_DISTANCE = 2;
export const CAMERA_MAX_DISTANCE = 12;
export const CAMERA_SMOOTHNESS = 0.08;
export const CAMERA_HEIGHT_OFFSET = 2;

// Room dimensions
export const WALL_HEIGHT = 5;
export const WALL_THICKNESS = 0.3;
export const DOOR_WIDTH = 2.5;
export const DOOR_HEIGHT = 3.5;

// Room sizes
export const ENTRANCE_SIZE = { width: 16, depth: 12 };
export const GALLERY_SIZE = { width: 20, depth: 14 };
export const ROMANTIC_SIZE = { width: 14, depth: 12 };
export const CINEMA_SIZE = { width: 18, depth: 14 };
export const GARDEN_SIZE = { width: 30, depth: 24 };

// Colors
export const COLORS = {
  wallWhite: '#f5f0eb',
  wallWarm: '#ede5d8',
  floorMarble: '#e8e0d4',
  floorMarbleDark: '#c4b8a8',
  ceiling: '#faf8f5',
  gold: '#c8a55a',
  rosePink: '#e8a0b0',
  warmLight: '#ffe4c4',
  ambient: '#ffeedd',
  gardenGrass: '#6b8f3c',
  gardenSky: '#87ceeb',
  woodBrown: '#8B6914',
  velvetRed: '#8b2252',
};

// Materials
export const MARBLE_COLOR = new THREE.Color(COLORS.floorMarble);
export const WALL_COLOR = new THREE.Color(COLORS.wallWhite);
export const WARM_WALL_COLOR = new THREE.Color(COLORS.wallWarm);

// Interaction
export const INTERACTION_DISTANCE = 3;

// Photos config (users can replace these)
export const PHOTO_CONFIG = [
  { id: 'photo1', src: '/photos/photo1.jpg', message: 'Where it all began...', position: [-8, 2.5, -6.5] as [number, number, number] },
  { id: 'photo2', src: '/photos/photo2.jpg', message: 'Our first adventure together', position: [-4, 2.5, -6.5] as [number, number, number] },
  { id: 'photo3', src: '/photos/photo3.jpg', message: 'The day I knew you were the one', position: [0, 2.5, -6.5] as [number, number, number] },
  { id: 'photo4', src: '/photos/photo4.jpg', message: 'Forever and always', position: [4, 2.5, -6.5] as [number, number, number] },
  { id: 'photo5', src: '/photos/photo5.jpg', message: 'Our love story continues...', position: [8, 2.5, -6.5] as [number, number, number] },
  { id: 'photo6', src: '/photos/photo6.jpg', message: 'Every moment with you is magic', position: [-8, 2.5, 6.5] as [number, number, number] },
  { id: 'photo7', src: '/photos/photo7.jpg', message: 'You make every day beautiful', position: [-4, 2.5, 6.5] as [number, number, number] },
  { id: 'photo8', src: '/photos/photo8.jpg', message: 'Together is my favorite place', position: [4, 2.5, 6.5] as [number, number, number] },
];

// Video config
export const VIDEO_CONFIG = {
  src: '/videos/memories.mp4',
  poster: '/videos/poster.jpg',
};
