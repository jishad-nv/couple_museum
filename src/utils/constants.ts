import * as THREE from 'three';
import type { MemoryItem } from './memoryArt';

// Player
export const PLAYER_SPEED = 4.2;
export const PLAYER_RUN_SPEED = 7.0;
export const PLAYER_JUMP_FORCE = 4.8;
export const PLAYER_HEIGHT = 1.75;
export const PLAYER_RADIUS = 0.3;

// Camera
export const CAMERA_DEFAULT_DISTANCE = 4.4;
export const CAMERA_MIN_DISTANCE = 2.4;
export const CAMERA_MAX_DISTANCE = 6.2;
export const CAMERA_SMOOTHNESS = 0.12;
export const CAMERA_HEIGHT_OFFSET = 1.65;

// Room dimensions
export const WALL_HEIGHT = 5.5;
export const WALL_THICKNESS = 0.32;
export const DOOR_WIDTH = 3.0;
export const DOOR_HEIGHT = 3.8;

// Room sizes (kept for compatibility with existing helpers)
export const ENTRANCE_SIZE = { width: 14, depth: 8.5 };
export const GALLERY_SIZE = { width: 34, depth: 34 };
export const ROMANTIC_SIZE = { width: 14, depth: 12 };
export const CINEMA_SIZE = { width: 16, depth: 18 };
export const GARDEN_SIZE = { width: 28, depth: 28 };

// Colors
export const COLORS = {
  wallWhite: '#f4eee6',
  wallWarm: '#ebe1d2',
  floorMarble: '#e7ded1',
  floorMarbleDark: '#c4b8a8',
  ceiling: '#faf7f2',
  gold: '#c8a55a',
  goldLight: '#e8d58a',
  rosePink: '#e8a0b0',
  warmLight: '#ffe4c4',
  ambient: '#ffeedd',
  gardenGrass: '#284a26',
  gardenSky: '#091124',
  woodBrown: '#7c5828',
  velvetRed: '#8b1f3b',
  cinemaDark: '#1c1524',
};

// Materials
export const MARBLE_COLOR = new THREE.Color(COLORS.floorMarble);
export const WALL_COLOR = new THREE.Color(COLORS.wallWhite);
export const WARM_WALL_COLOR = new THREE.Color(COLORS.wallWarm);

// Interaction
export const INTERACTION_DISTANCE = 3.2;

export const GALLERY_SECTIONS: ReadonlyArray<MemoryItem['section']> = [
  'Our First Memories',
  'Our First Holidays Together',
  'Special Moments',
  'Beautiful Memories',
  'Forever Together',
];

// Curated memories mounted around the circular gallery (15 frames across 5 sections)
export const GALLERY_MEMORIES: MemoryItem[] = [
  // 1. Our First Memories
  {
    id: 'mem-1',
    title: 'Where It All Began',
    section: 'Our First Memories',
    date: 'Spring Evening',
    description: 'The quiet corner table where a quick coffee turned into four hours of effortless laughter.',
    photoSrc: '/photos/photo1.jpg',
    palette: ['#3d233a', '#9c5268', '#f0b898'],
    motif: 'sunrise',
  },
  {
    id: 'mem-2',
    title: 'Walk Home in the Rain',
    section: 'Our First Memories',
    date: 'First Month',
    description: 'Sharing one small umbrella under glowing streetlights, neither of us wanting the night to end.',
    photoSrc: '/photos/photo2.jpg',
    palette: ['#1b2845', '#4c658e', '#c8a55a'],
    motif: 'rain',
  },
  {
    id: 'mem-3',
    title: 'Sunday Morning Playlists',
    section: 'Our First Memories',
    date: 'Early Days',
    description: 'Warm croissants, soft vinyl music, and discovering how naturally our worlds fit together.',
    photoSrc: '/photos/photo3.jpg',
    palette: ['#5c374c', '#ce6a85', '#ffcab1'],
    motif: 'roses',
  },

  // 2. Our First Holidays Together
  {
    id: 'mem-4',
    title: 'Golden Coast Sunset',
    section: 'Our First Holidays Together',
    date: 'First Summer Trip',
    description: 'Barefoot along the tide line watching amber waves reflect the last pink light of dusk.',
    photoSrc: '/photos/photo4.jpg',
    palette: ['#2b2d5c', '#c96480', '#ffd094'],
    motif: 'beach',
  },
  {
    id: 'mem-5',
    title: 'Mountain Train Window',
    section: 'Our First Holidays Together',
    date: 'Autumn Escape',
    description: 'Passing mist-covered valleys hand in hand, planning a hundred more journeys just like this.',
    photoSrc: '/photos/photo5.jpg',
    palette: ['#2c3e50', '#8f5d46', '#e6b88a'],
    motif: 'autumn',
  },
  {
    id: 'mem-6',
    title: 'Harbor Lantern Night',
    section: 'Our First Holidays Together',
    date: 'Holiday Eve',
    description: 'Paper lanterns drifting above the water while we made silent wishes for the years ahead.',
    photoSrc: '/photos/photo6.jpg',
    palette: ['#141b33', '#3f3d6b', '#f2b866'],
    motif: 'lanterns',
  },

  // 3. Special Moments
  {
    id: 'mem-7',
    title: 'The Day I Knew',
    section: 'Special Moments',
    date: 'Under the Stars',
    description: 'Looking up at a clear midnight sky and realizing home was never a place—it was you.',
    photoSrc: '/photos/photo7.jpg',
    palette: ['#0f172a', '#312e81', '#a78bfa'],
    motif: 'stars',
  },
  {
    id: 'mem-8',
    title: 'Our First Anniversary',
    section: 'Special Moments',
    date: 'One Year',
    description: 'Candlelight, handwritten letters, and celebrating every tiny ritual we built together.',
    photoSrc: '/photos/photo8.jpg',
    palette: ['#3b182c', '#8b2252', '#e8c488'],
    motif: 'roses',
  },
  {
    id: 'mem-9',
    title: 'Midnight Rooftop Dance',
    section: 'Special Moments',
    date: 'City Lights',
    description: 'Slow dancing above the quiet skyline with no music except the rhythm of our laughter.',
    photoSrc: '/photos/photo9.jpg',
    palette: ['#181c36', '#4a3b6e', '#e8a0b0'],
    motif: 'stars',
  },

  // 4. Beautiful Memories
  {
    id: 'mem-10',
    title: 'Cherry Blossom Path',
    section: 'Beautiful Memories',
    date: 'April Afternoon',
    description: 'Petals drifting across our shoulders as we wandered without checking the time.',
    photoSrc: '/photos/photo10.jpg',
    palette: ['#4b2e47', '#b56588', '#fbd3df'],
    motif: 'roses',
  },
  {
    id: 'mem-11',
    title: 'Golden Hour Portraits',
    section: 'Beautiful Memories',
    date: 'Late Summer',
    description: 'Warm sunlight catching your smile—my favorite photograph from our favorite afternoon.',
    photoSrc: '/photos/photo11.jpg',
    palette: ['#54332a', '#b86f4c', '#ffe2a8'],
    motif: 'sunrise',
  },
  {
    id: 'mem-12',
    title: 'Autumn Leaves & Tea',
    section: 'Beautiful Memories',
    date: 'October Walk',
    description: 'Two warm mugs on a park bench surrounded by amber maples and quiet conversation.',
    photoSrc: '/photos/photo12.jpg',
    palette: ['#42261e', '#9c4b2f', '#ebb96e'],
    motif: 'autumn',
  },

  // 5. Forever Together
  {
    id: 'mem-13',
    title: 'Hand in Hand Always',
    section: 'Forever Together',
    date: 'Every Season',
    description: 'Through every season and every mile, holding your hand remains my safest place.',
    photoSrc: '/photos/photo13.jpg',
    palette: ['#241c38', '#6f4268', '#e8c28e'],
    motif: 'arch',
  },
  {
    id: 'mem-14',
    title: 'Our Future Garden',
    section: 'Forever Together',
    date: 'Looking Ahead',
    description: 'Dreaming of quiet mornings, blooming trees, and growing old together with gentle joy.',
    photoSrc: '/photos/photo14.jpg',
    palette: ['#1d352d', '#4f7a5a', '#f0d8a8'],
    motif: 'sunrise',
  },
  {
    id: 'mem-15',
    title: 'Forever & Always',
    section: 'Forever Together',
    date: 'Timeless Promise',
    description: 'A museum built of every smile, every trip, and every quiet promise yet to come.',
    photoSrc: '/photos/photo15.jpg',
    palette: ['#2e1529', '#7d3055', '#f2cf88'],
    motif: 'stars',
  },
];

// Small hanging photo memories suspended from garden tree branches
export const GARDEN_HANGING_MEMORIES: MemoryItem[] = [
  {
    id: 'garden-mem-1',
    title: 'Under the Blossom Canopy',
    section: 'Garden Memories',
    date: 'Garden Keepsake I',
    description: 'Hanging beneath warm garden string lights—every breeze carries a memory we cherish.',
    photoSrc: '/photos/garden1.jpg',
    palette: ['#273b2c', '#638c6d', '#f5d8b8'],
    motif: 'roses',
  },
  {
    id: 'garden-mem-2',
    title: 'Beside the Waterfall',
    section: 'Garden Memories',
    date: 'Garden Keepsake II',
    description: 'Soft water ripples and starlight gold, reminding us to pause and savor the moment.',
    photoSrc: '/photos/garden2.jpg',
    palette: ['#1e2f3d', '#4e788e', '#f4d399'],
    motif: 'lanterns',
  },
  {
    id: 'garden-mem-3',
    title: 'Moonlit Blossom Promise',
    section: 'Garden Memories',
    date: 'Garden Keepsake III',
    description: 'Where flowers bloom beneath the midnight sky and our favorite songs play softly.',
    photoSrc: '/photos/garden3.jpg',
    palette: ['#3d2336', '#8d4c6b', '#f7c5cc'],
    motif: 'stars',
  },
  {
    id: 'garden-mem-4',
    title: 'Golden Coast Sunset',
    section: 'Garden Memories',
    date: 'Garden Keepsake IV',
    description: 'Amber waves and quiet evening footsteps preserved under the boughs.',
    photoSrc: '/photos/photo4.jpg',
    palette: ['#2b2d5c', '#c96480', '#ffd094'],
    motif: 'beach',
  },
  {
    id: 'garden-mem-5',
    title: 'Lanterns Over Harbor',
    section: 'Garden Memories',
    date: 'Garden Keepsake V',
    description: 'Floating golden lights mirrored across still midnight water.',
    photoSrc: '/photos/photo6.jpg',
    palette: ['#141b33', '#3f3d6b', '#f2b866'],
    motif: 'lanterns',
  },
  {
    id: 'garden-mem-6',
    title: 'Cherry Blossom Path',
    section: 'Garden Memories',
    date: 'Garden Keepsake VI',
    description: 'Soft pink petals drifting gently down onto our evening walk.',
    photoSrc: '/photos/photo10.jpg',
    palette: ['#4b2e47', '#b56588', '#fbd3df'],
    motif: 'roses',
  },
];

// Backward-compatible photo config reference
export const PHOTO_CONFIG = GALLERY_MEMORIES.map((m, idx) => ({
  id: m.id,
  src: m.photoSrc,
  message: m.title,
  position: [0, 2.5, idx] as [number, number, number],
}));

// Video config
export const VIDEO_CONFIG = {
  title: 'Our First Holidays Together',
  src: '/videos/memories.mp4',
  poster: '/videos/poster.jpg',
};
