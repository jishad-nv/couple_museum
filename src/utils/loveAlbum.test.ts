import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAlbumSpreads,
  isGardenSeatAlbumAvailable,
  selectAlbumPhotos,
} from './loveAlbum';
import { DEFAULT_MUSEUM_PHOTOS, type MuseumPhotoItem } from './museumContentTypes';
import {
  GARDEN_BENCH_POSITIONS,
  THEATRE_VIP_SEAT_POS,
  WEDDING_GUEST_SEATS,
} from './museumLayout';

test('selectAlbumPhotos filters tagged or album photos and sorts strictly by albumPage then sortOrder', () => {
  const custom: MuseumPhotoItem[] = [
    { ...DEFAULT_MUSEUM_PHOTOS[0], id: 'p-late', albumPage: 5, sortOrder: 1 },
    { ...DEFAULT_MUSEUM_PHOTOS[1], id: 'p-early', albumPage: 2, sortOrder: 4 },
    { ...DEFAULT_MUSEUM_PHOTOS[2], id: 'p-album-target', roomTarget: 'album', albumPage: null, sortOrder: 3 },
    { ...DEFAULT_MUSEUM_PHOTOS[3], id: 'p-excluded', roomTarget: 'garden', albumPage: null, sortOrder: 1 },
  ];

  const selected = selectAlbumPhotos(custom);
  assert.deepEqual(
    selected.map((p) => p.id),
    ['p-early', 'p-late', 'p-album-target']
  );
});

test('selectAlbumPhotos falls back to all photos when none have albumPage or roomTarget album', () => {
  const untagged = DEFAULT_MUSEUM_PHOTOS.slice(0, 3).map((p) => ({
    ...p,
    roomTarget: 'gallery' as const,
    albumPage: null,
  }));
  const selected = selectAlbumPhotos(untagged);
  assert.equal(selected.length, 3);
});

test('buildAlbumSpreads pairs consecutive photos into left and right pages cleanly', () => {
  const sample = DEFAULT_MUSEUM_PHOTOS.slice(0, 5);
  const spreads = buildAlbumSpreads(sample);
  assert.equal(spreads.length, 3);
  assert.equal(spreads[0].leftPageNumber, 1);
  assert.equal(spreads[0].rightPageNumber, 2);
  assert.equal(spreads[0].leftPage?.id, sample[0].id);
  assert.equal(spreads[0].rightPage?.id, sample[1].id);
  assert.equal(spreads[2].leftPage?.id, sample[4].id);
  assert.equal(spreads[2].rightPage, null);
});

test('isGardenSeatAlbumAvailable shows VIEW ALBUM only when seated in the Garden seating area', () => {
  const bench1 = GARDEN_BENCH_POSITIONS[0];
  const bench2 = GARDEN_BENCH_POSITIONS[1];

  // Seated on either garden bench inside Garden shows the button
  assert.equal(
    isGardenSeatAlbumAvailable({
      currentRoom: 'garden',
      isSitting: true,
      sittingBenchPosition: bench1.position,
      modalOpen: false,
    }),
    true
  );
  assert.equal(
    isGardenSeatAlbumAvailable({
      currentRoom: 'garden',
      isSitting: true,
      sittingBenchPosition: bench2.position,
      modalOpen: false,
    }),
    true
  );

  // Standing in Garden (even right next to a bench) must NOT show the seated VIEW ALBUM button
  assert.equal(
    isGardenSeatAlbumAvailable({
      currentRoom: 'garden',
      isSitting: false,
      sittingBenchPosition: null,
      playerPosition: { x: bench1.position[0], z: bench1.position[2] },
      modalOpen: false,
    }),
    false
  );

  // Sitting far from garden benches or with a modal open must NOT show the button
  assert.equal(
    isGardenSeatAlbumAvailable({
      currentRoom: 'garden',
      isSitting: true,
      sittingBenchPosition: [26.5, 0, -38.0],
      modalOpen: false,
    }),
    false
  );
  assert.equal(
    isGardenSeatAlbumAvailable({
      currentRoom: 'garden',
      isSitting: true,
      sittingBenchPosition: bench1.position,
      modalOpen: true,
    }),
    false
  );

  // Sitting in Cinema or Wedding Hall must NOT show the Garden VIEW ALBUM button
  assert.equal(
    isGardenSeatAlbumAvailable({
      currentRoom: 'cinema',
      isSitting: true,
      sittingBenchPosition: THEATRE_VIP_SEAT_POS,
      modalOpen: false,
    }),
    false
  );
  assert.equal(
    isGardenSeatAlbumAvailable({
      currentRoom: 'wedding',
      isSitting: true,
      sittingBenchPosition: WEDDING_GUEST_SEATS[0].position,
      modalOpen: false,
    }),
    false
  );
});
