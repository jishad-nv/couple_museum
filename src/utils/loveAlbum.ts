import type { MuseumPhotoItem } from './museumContentTypes';
import { GARDEN_BENCH_POSITIONS, type MuseumRoom } from './museumLayout';

export interface AlbumSpread {
  spreadIndex: number;
  leftPage: MuseumPhotoItem | null;
  rightPage: MuseumPhotoItem | null;
  leftPageNumber: number;
  rightPageNumber: number;
}

export interface GardenSeatAlbumCheckInput {
  currentRoom: MuseumRoom;
  isSitting: boolean;
  sittingBenchPosition: [number, number, number] | null;
  playerPosition?: { x: number; z: number } | null;
  modalOpen?: boolean;
}

export const GARDEN_BENCH_ALBUM_RADIUS = 2.4;

/**
 * Shows the contextual Garden "VIEW ALBUM" button strictly when the player is in
 * the Garden, actively seated at one of the Garden benches, and no modal is open.
 */
export function isGardenSeatAlbumAvailable(input: GardenSeatAlbumCheckInput): boolean {
  if (input.modalOpen) return false;
  if (input.currentRoom !== 'garden') return false;
  if (!input.isSitting) return false;

  const refPos = input.sittingBenchPosition
    ? { x: input.sittingBenchPosition[0], z: input.sittingBenchPosition[2] }
    : input.playerPosition;
  if (!refPos) return false;

  return GARDEN_BENCH_POSITIONS.some(
    (bench) =>
      Math.hypot(refPos.x - bench.position[0], refPos.z - bench.position[2]) <=
      GARDEN_BENCH_ALBUM_RADIUS
  );
}

/**
 * Selects and orders photos belonging in the central Love Album into clean 2-page spreads.
 * Any photo with a numeric `albumPage` or `roomTarget === 'album'` is included, sorted cleanly
 * by `albumPage` then `sortOrder`. Falls back to all gallery photos if none are explicitly tagged.
 */
export function selectAlbumPhotos(photos: MuseumPhotoItem[]): MuseumPhotoItem[] {
  const tagged = photos.filter((p) => p.albumPage !== null || p.roomTarget === 'album');
  const source = tagged.length > 0 ? tagged : photos;
  return [...source].sort((a, b) => {
    const pageA = a.albumPage ?? 9999;
    const pageB = b.albumPage ?? 9999;
    if (pageA !== pageB) return pageA - pageB;
    return a.sortOrder - b.sortOrder;
  });
}

export function buildAlbumSpreads(photos: MuseumPhotoItem[]): AlbumSpread[] {
  const ordered = selectAlbumPhotos(photos);
  if (ordered.length === 0) {
    return [
      {
        spreadIndex: 0,
        leftPage: null,
        rightPage: null,
        leftPageNumber: 1,
        rightPageNumber: 2,
      },
    ];
  }

  const spreads: AlbumSpread[] = [];
  for (let i = 0; i < ordered.length; i += 2) {
    spreads.push({
      spreadIndex: spreads.length,
      leftPage: ordered[i] ?? null,
      rightPage: ordered[i + 1] ?? null,
      leftPageNumber: i + 1,
      rightPageNumber: i + 2,
    });
  }
  return spreads;
}
