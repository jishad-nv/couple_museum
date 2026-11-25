import type {
  PrivateMemoryItem,
  SecretMysteryProgress,
  SecretQuizQuestion,
} from './secretMystery.ts';

export type MemorySection =
  | 'Our First Memories'
  | 'Our First Holidays Together'
  | 'Special Moments'
  | 'Beautiful Memories'
  | 'Forever Together'
  | 'Garden Memories';

export type MemoryMotif =
  | 'sunrise'
  | 'beach'
  | 'lanterns'
  | 'roses'
  | 'stars'
  | 'rain'
  | 'autumn'
  | 'arch';

export type PhotoRoomTarget = 'gallery' | 'garden' | 'album' | 'secret';

export type MusicZoneTarget = 'gallery' | 'theatre' | 'garden' | 'dance' | 'secret' | 'wedding' | 'playlist';

export interface MuseumPhotoItem {
  id: string;
  title: string;
  section: MemorySection;
  date: string;
  description: string;
  photoSrc: string;
  palette: [string, string, string];
  motif: MemoryMotif;
  roomTarget: PhotoRoomTarget;
  albumPage: number | null;
  sortOrder: number;
}

export interface MuseumVideoItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  videoSrc: string;
  posterSrc: string;
  isTheatreActive: boolean;
  isStoryVideo: boolean;
  sortOrder: number;
}

export interface MuseumTextEntry {
  key: string;
  label: string;
  category: 'Museum' | 'Album' | 'Theatre' | 'Garden' | 'Dance';
  value: string;
}

export interface MuseumMusicTrack {
  id: string;
  title: string;
  subtitle: string;
  zone: MusicZoneTarget;
  audioSrc: string; // Empty string => built-in procedural score; '/api/media/music/...' => uploaded file
  volume: number;
  sortOrder: number;
  isBuiltIn: boolean;
}

export interface MuseumSettings {
  musicEnabled: boolean;
  musicVolume: number;
  defaultMusicTrackId: string;
  galleryMusicTrackId: string;
  theatreMusicTrackId: string;
  gardenMusicTrackId: string;
  danceMusicTrackId: string;
  secretMusicTrackId?: string;
  weddingMusicTrackId?: string;
}

export interface MuseumGuestbookEntry {
  id: string;
  author: string;
  message: string;
  stamp: '♡' | '✦' | '❀' | '★';
  createdAt: number;
}

export interface MuseumContentBundle {
  photos: MuseumPhotoItem[];
  videos: MuseumVideoItem[];
  texts: MuseumTextEntry[];
  musicTracks: MuseumMusicTrack[];
  settings: MuseumSettings;
  guestbookEntries?: MuseumGuestbookEntry[];
  secretQuiz?: SecretQuizQuestion[];
  privateMemories?: PrivateMemoryItem[];
  secretProgress?: SecretMysteryProgress;
}

export const DEFAULT_MUSEUM_TEXTS: MuseumTextEntry[] = [
  { key: 'exterior_title', label: 'Grand Facade Title', category: 'Museum', value: 'OUR LOVE MUSEUM' },
  { key: 'loading_title', label: 'Welcome Heading', category: 'Museum', value: 'OUR LOVE' },
  { key: 'loading_subtitle', label: 'Welcome Subheading', category: 'Museum', value: 'MUSEUM' },
  { key: 'loading_tagline', label: 'Welcome Tagline', category: 'Museum', value: 'A JOURNEY THROUGH OUR MEMORIES' },
  { key: 'entrance_archway_title', label: 'Gallery Archway Title', category: 'Museum', value: 'CIRCULAR ROTUNDA GALLERY' },
  { key: 'guestbook_heading', label: 'Guestbook Lectern Label', category: 'Museum', value: '✦ Guestbook ✦' },
  { key: 'album_cover_title', label: 'Love Album Title', category: 'Album', value: 'Our Love Story' },
  { key: 'album_cover_subtitle', label: 'Love Album Subtitle', category: 'Album', value: 'A Living Chronicle of Us' },
  { key: 'album_pedestal_caption', label: 'Album Pedestal Plaque', category: 'Album', value: 'OUR LOVE ALBUM' },
  { key: 'theatre_door_title', label: 'Theatre Door Marquee', category: 'Theatre', value: 'MEMORY THEATRE' },
  { key: 'theatre_film_heading', label: 'Theatre Screen Heading', category: 'Theatre', value: 'Our First Holidays Together' },
  { key: 'garden_door_title', label: 'Garden Door Marquee', category: 'Garden', value: 'BEAUTY OF GARDEN' },
  { key: 'garden_welcome_text', label: 'Garden Dedication Note', category: 'Garden', value: 'Moonlit Garden of Memories' },
  { key: 'dance_spot_title', label: 'Dance Pavilion Title', category: 'Dance', value: 'MOONLIT WALTZ' },
  { key: 'secret_room_title', label: 'Secret Room Title', category: 'Museum', value: 'OUR SECRET ROOM' },
  { key: 'private_chamber_title', label: 'Private Chamber Title', category: 'Museum', value: 'OUR PRIVATE MEMORIES' },
  { key: 'wedding_door_title', label: 'Wedding Hall Marquee', category: 'Museum', value: 'OUR WEDDING DAY' },
];

export const DEFAULT_MUSEUM_VIDEOS: MuseumVideoItem[] = [
  {
    id: 'vid-1',
    title: 'Our First Holidays Together',
    subtitle: 'Golden Coast Dusk · Misty Valleys · Harbor Starlight',
    description: 'Highlights from our first trips together—golden sunsets, coastal walks, and mountain train mornings.',
    videoSrc: '/videos/memories.mp4',
    posterSrc: '/videos/poster.jpg',
    isTheatreActive: true,
    isStoryVideo: true,
    sortOrder: 1,
  },
];

export const DEFAULT_MUSEUM_MUSIC: MuseumMusicTrack[] = [
  {
    id: 'track-gallery',
    title: 'Waltz of Golden Frames',
    subtitle: 'Felt Piano & Chamber Strings in F Major',
    zone: 'gallery',
    audioSrc: '',
    volume: 0.78,
    sortOrder: 1,
    isBuiltIn: true,
  },
  {
    id: 'track-theatre',
    title: 'Velvet Cinema Nocturne',
    subtitle: 'Romantic Cello & Sweeping Strings in Ab Major',
    zone: 'theatre',
    audioSrc: '',
    volume: 0.82,
    sortOrder: 2,
    isBuiltIn: true,
  },
  {
    id: 'track-garden',
    title: 'Moonlight Garden Reverie',
    subtitle: 'Acoustic Harp, Celesta & Nocturnal Strings in D Major',
    zone: 'garden',
    audioSrc: '',
    volume: 0.78,
    sortOrder: 3,
    isBuiltIn: true,
  },
  {
    id: 'track-dance',
    title: 'Moonlit Waltz Together',
    subtitle: 'Romantic Ballroom Piano & Strings in C Major',
    zone: 'dance',
    audioSrc: '',
    volume: 0.84,
    sortOrder: 4,
    isBuiltIn: true,
  },
  {
    id: 'track-secret',
    title: 'Candlelit Secret Sanctuary',
    subtitle: 'Whispered Felt Piano & Warm Celesta in Eb Major',
    zone: 'secret',
    audioSrc: '',
    volume: 0.76,
    sortOrder: 5,
    isBuiltIn: true,
  },
  {
    id: 'track-wedding',
    title: 'Morning Vows & Forever March',
    subtitle: 'Sunlit Wedding Harp, Strings & Piano in G Major',
    zone: 'wedding',
    audioSrc: '',
    volume: 0.85,
    sortOrder: 6,
    isBuiltIn: true,
  },
];

export const DEFAULT_MUSEUM_SETTINGS: MuseumSettings = {
  musicEnabled: true,
  musicVolume: 0.72,
  defaultMusicTrackId: 'track-gallery',
  galleryMusicTrackId: 'track-gallery',
  theatreMusicTrackId: 'track-theatre',
  gardenMusicTrackId: 'track-garden',
  danceMusicTrackId: 'track-dance',
  secretMusicTrackId: 'track-secret',
  weddingMusicTrackId: 'track-wedding',
};

export const DEFAULT_MUSEUM_PHOTOS: MuseumPhotoItem[] = [
  {
    id: 'mem-1',
    title: 'Where It All Began',
    section: 'Our First Memories',
    date: 'Spring Evening',
    description: 'The quiet corner table where a quick coffee turned into four hours of effortless laughter.',
    photoSrc: '/photos/photo1.jpg',
    palette: ['#3d233a', '#9c5268', '#f0b898'],
    motif: 'sunrise',
    roomTarget: 'gallery',
    albumPage: 1,
    sortOrder: 1,
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
    roomTarget: 'gallery',
    albumPage: 2,
    sortOrder: 2,
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
    roomTarget: 'gallery',
    albumPage: 3,
    sortOrder: 3,
  },
  {
    id: 'mem-4',
    title: 'Golden Coast Sunset',
    section: 'Our First Holidays Together',
    date: 'First Summer Trip',
    description: 'Barefoot along the tide line watching amber waves reflect the last pink light of dusk.',
    photoSrc: '/photos/photo4.jpg',
    palette: ['#2b2d5c', '#c96480', '#ffd094'],
    motif: 'beach',
    roomTarget: 'gallery',
    albumPage: 4,
    sortOrder: 4,
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
    roomTarget: 'gallery',
    albumPage: 5,
    sortOrder: 5,
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
    roomTarget: 'gallery',
    albumPage: 6,
    sortOrder: 6,
  },
  {
    id: 'mem-7',
    title: 'The Day I Knew',
    section: 'Special Moments',
    date: 'Under the Stars',
    description: 'Looking up at a clear midnight sky and realizing home was never a place—it was you.',
    photoSrc: '/photos/photo7.jpg',
    palette: ['#0f172a', '#312e81', '#a78bfa'],
    motif: 'stars',
    roomTarget: 'gallery',
    albumPage: 7,
    sortOrder: 7,
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
    roomTarget: 'gallery',
    albumPage: 8,
    sortOrder: 8,
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
    roomTarget: 'gallery',
    albumPage: 9,
    sortOrder: 9,
  },
  {
    id: 'mem-10',
    title: 'Cherry Blossom Path',
    section: 'Beautiful Memories',
    date: 'April Afternoon',
    description: 'Petals drifting across our shoulders as we wandered without checking the time.',
    photoSrc: '/photos/photo10.jpg',
    palette: ['#4b2e47', '#b56588', '#fbd3df'],
    motif: 'roses',
    roomTarget: 'gallery',
    albumPage: 10,
    sortOrder: 10,
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
    roomTarget: 'gallery',
    albumPage: 11,
    sortOrder: 11,
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
    roomTarget: 'gallery',
    albumPage: 12,
    sortOrder: 12,
  },
  {
    id: 'mem-13',
    title: 'Hand in Hand Always',
    section: 'Forever Together',
    date: 'Every Season',
    description: 'Through every season and every mile, holding your hand remains my safest place.',
    photoSrc: '/photos/photo13.jpg',
    palette: ['#241c38', '#6f4268', '#e8c28e'],
    motif: 'arch',
    roomTarget: 'gallery',
    albumPage: 13,
    sortOrder: 13,
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
    roomTarget: 'gallery',
    albumPage: 14,
    sortOrder: 14,
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
    roomTarget: 'gallery',
    albumPage: 15,
    sortOrder: 15,
  },
  {
    id: 'garden-mem-1',
    title: 'Under the Blossom Canopy',
    section: 'Garden Memories',
    date: 'Garden Keepsake I',
    description: 'Hanging beneath warm garden string lights—every breeze carries a memory we cherish.',
    photoSrc: '/photos/garden1.jpg',
    palette: ['#273b2c', '#638c6d', '#f5d8b8'],
    motif: 'roses',
    roomTarget: 'garden',
    albumPage: 16,
    sortOrder: 16,
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
    roomTarget: 'garden',
    albumPage: 17,
    sortOrder: 17,
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
    roomTarget: 'garden',
    albumPage: 18,
    sortOrder: 18,
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
    roomTarget: 'garden',
    albumPage: null,
    sortOrder: 19,
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
    roomTarget: 'garden',
    albumPage: null,
    sortOrder: 20,
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
    roomTarget: 'garden',
    albumPage: null,
    sortOrder: 21,
  },
];

export function textsArrayToMap(texts: MuseumTextEntry[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of texts) {
    map[item.key] = item.value;
  }
  return map;
}
