import type { MuseumRoom } from './museumLayout';

export type AudioZoneId = 'gallery' | 'theatre' | 'garden' | 'dance';

export interface ChordMeasure {
  bassMidi: number;
  padMidis: readonly number[];
  arpMidis: readonly number[];
  melodyMidis: ReadonlyArray<number | null>;
}

export interface ZoneTrackSpec {
  id: AudioZoneId;
  title: string;
  subtitle: string;
  tempoBpm: number;
  stepsPerChord: number;
  baseGain: number;
  padCutoffHz: number;
  chords: readonly ChordMeasure[];
}

export const CROSSFADE_DURATION_SECONDS = 2.2;
export const TOGGLE_FADE_SECONDS = 0.65;

export function roomToAudioZone(room: MuseumRoom, isDancing = false): AudioZoneId {
  if (isDancing) return 'dance';
  switch (room) {
    case 'cinema':
      return 'theatre';
    case 'garden':
      return 'garden';
    case 'exterior':
    case 'entrance':
    case 'gallery':
    default:
      return 'gallery';
  }
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function computeEqualPowerCrossfade(t: number): { fromGain: number; toGain: number } {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    fromGain: Math.cos(clamped * Math.PI * 0.5),
    toGain: Math.sin(clamped * Math.PI * 0.5),
  };
}

export function computeZoneMixGains(
  activeZone: AudioZoneId,
  isMusicPlaying: boolean,
  isMuted: boolean
): Record<AudioZoneId, number> {
  if (!isMusicPlaying || isMuted) {
    return { gallery: 0, theatre: 0, garden: 0, dance: 0 };
  }
  return {
    gallery: activeZone === 'gallery' ? 1 : 0,
    theatre: activeZone === 'theatre' ? 1 : 0,
    garden: activeZone === 'garden' ? 1 : 0,
    dance: activeZone === 'dance' ? 1 : 0,
  };
}

/**
 * Four bespoke romantic instrumental progressions:
 * - gallery: Warm felt piano waltz + chamber strings in F Major (72 BPM, 3/4 feel)
 * - theatre: Sweeping velvet cinema strings + singing cello in Ab Major (58 BPM, 4/4 feel)
 * - garden: Nocturnal harp & celesta reverie in D Major (64 BPM, 4/4 feel)
 * - dance: Intimate ballroom waltz in C Major (84 BPM, 3/4 feel)
 */
export const AUDIO_TRACKS: Record<AudioZoneId, ZoneTrackSpec> = {
  gallery: {
    id: 'gallery',
    title: 'Waltz of Golden Frames',
    subtitle: 'Felt Piano & Chamber Strings in F Major',
    tempoBpm: 72,
    stepsPerChord: 6,
    baseGain: 0.78,
    padCutoffHz: 950,
    chords: [
      {
        bassMidi: 41,
        padMidis: [53, 57, 60, 64],
        arpMidis: [53, 60, 65, 64, 60, 57],
        melodyMidis: [69, null, 72, null, 74, 72],
      },
      {
        bassMidi: 45,
        padMidis: [52, 57, 60, 64],
        arpMidis: [52, 57, 64, 60, 57, 52],
        melodyMidis: [76, null, null, 74, 72, null],
      },
      {
        bassMidi: 46,
        padMidis: [53, 58, 62, 65],
        arpMidis: [50, 58, 62, 65, 62, 58],
        melodyMidis: [74, null, 77, null, 76, 74],
      },
      {
        bassMidi: 48,
        padMidis: [55, 58, 60, 64],
        arpMidis: [52, 55, 60, 64, 60, 55],
        melodyMidis: [72, null, null, 69, 67, null],
      },
      {
        bassMidi: 50,
        padMidis: [53, 57, 60, 62],
        arpMidis: [50, 57, 62, 65, 62, 57],
        melodyMidis: [74, null, 72, null, 69, null],
      },
      {
        bassMidi: 46,
        padMidis: [53, 58, 62, 65],
        arpMidis: [53, 58, 62, 65, 62, 58],
        melodyMidis: [70, null, 74, null, 72, 70],
      },
      {
        bassMidi: 43,
        padMidis: [55, 58, 62, 65],
        arpMidis: [55, 58, 62, 67, 62, 58],
        melodyMidis: [69, null, 70, null, 72, null],
      },
      {
        bassMidi: 48,
        padMidis: [55, 60, 64, 67],
        arpMidis: [52, 55, 60, 64, 60, 55],
        melodyMidis: [67, null, 70, null, 69, null],
      },
    ],
  },
  theatre: {
    id: 'theatre',
    title: 'Velvet Cinema Nocturne',
    subtitle: 'Romantic Cello & Sweeping Strings in Ab Major',
    tempoBpm: 58,
    stepsPerChord: 4,
    baseGain: 0.82,
    padCutoffHz: 820,
    chords: [
      {
        bassMidi: 44,
        padMidis: [56, 60, 63, 67],
        arpMidis: [56, 63, 68, 63],
        melodyMidis: [72, null, 75, null],
      },
      {
        bassMidi: 48,
        padMidis: [55, 60, 63, 67],
        arpMidis: [55, 60, 67, 63],
        melodyMidis: [79, null, 77, 75],
      },
      {
        bassMidi: 49,
        padMidis: [56, 61, 65, 68],
        arpMidis: [56, 61, 65, 68],
        melodyMidis: [77, null, 80, null],
      },
      {
        bassMidi: 51,
        padMidis: [55, 58, 63, 68],
        arpMidis: [55, 58, 63, 67],
        melodyMidis: [75, null, 73, 72],
      },
      {
        bassMidi: 41,
        padMidis: [53, 56, 60, 63],
        arpMidis: [53, 60, 63, 68],
        melodyMidis: [75, null, 72, null],
      },
      {
        bassMidi: 49,
        padMidis: [56, 61, 65, 68],
        arpMidis: [56, 61, 65, 68],
        melodyMidis: [73, null, 75, 77],
      },
      {
        bassMidi: 46,
        padMidis: [53, 58, 61, 65],
        arpMidis: [53, 58, 65, 61],
        melodyMidis: [73, null, 72, null],
      },
      {
        bassMidi: 51,
        padMidis: [55, 58, 63, 67],
        arpMidis: [55, 58, 63, 67],
        melodyMidis: [70, null, 72, null],
      },
    ],
  },
  garden: {
    id: 'garden',
    title: 'Moonlight Garden Reverie',
    subtitle: 'Acoustic Harp, Celesta & Nocturnal Strings in D Major',
    tempoBpm: 64,
    stepsPerChord: 4,
    baseGain: 0.78,
    padCutoffHz: 1120,
    chords: [
      {
        bassMidi: 50,
        padMidis: [57, 62, 66, 69],
        arpMidis: [54, 62, 66, 69],
        melodyMidis: [78, null, 81, null],
      },
      {
        bassMidi: 47,
        padMidis: [54, 59, 62, 66],
        arpMidis: [54, 59, 66, 71],
        melodyMidis: [78, null, 74, null],
      },
      {
        bassMidi: 43,
        padMidis: [55, 59, 62, 66],
        arpMidis: [55, 59, 62, 67],
        melodyMidis: [76, null, 78, 79],
      },
      {
        bassMidi: 45,
        padMidis: [55, 57, 61, 64],
        arpMidis: [55, 61, 64, 69],
        melodyMidis: [76, null, 73, null],
      },
      {
        bassMidi: 42,
        padMidis: [54, 57, 61, 64],
        arpMidis: [54, 57, 64, 69],
        melodyMidis: [74, null, 76, null],
      },
      {
        bassMidi: 47,
        padMidis: [54, 59, 62, 66],
        arpMidis: [54, 59, 62, 69],
        melodyMidis: [74, null, 71, null],
      },
      {
        bassMidi: 43,
        padMidis: [55, 59, 62, 66],
        arpMidis: [55, 59, 66, 71],
        melodyMidis: [74, null, 76, 78],
      },
      {
        bassMidi: 45,
        padMidis: [55, 57, 61, 64],
        arpMidis: [55, 61, 64, 67],
        melodyMidis: [73, null, 74, null],
      },
    ],
  },
  dance: {
    id: 'dance',
    title: 'Moonlit Waltz Together',
    subtitle: 'Romantic Ballroom Piano & Strings in C Major',
    tempoBpm: 84,
    stepsPerChord: 6,
    baseGain: 0.84,
    padCutoffHz: 1080,
    chords: [
      {
        bassMidi: 48,
        padMidis: [55, 60, 64, 67],
        arpMidis: [52, 60, 64, 67, 64, 60],
        melodyMidis: [72, null, 76, null, 79, 76],
      },
      {
        bassMidi: 45,
        padMidis: [57, 60, 64, 67],
        arpMidis: [52, 57, 64, 67, 64, 57],
        melodyMidis: [76, null, 74, null, 72, null],
      },
      {
        bassMidi: 41,
        padMidis: [53, 57, 60, 64],
        arpMidis: [53, 57, 60, 65, 64, 60],
        melodyMidis: [77, null, 76, null, 74, 72],
      },
      {
        bassMidi: 43,
        padMidis: [55, 59, 62, 65],
        arpMidis: [55, 59, 62, 67, 65, 62],
        melodyMidis: [74, null, null, 71, 72, null],
      },
    ],
  },
};
