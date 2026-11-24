import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAlbumSpreads, selectAlbumPhotos } from './loveAlbum';
import { DEFAULT_MUSEUM_PHOTOS, type MuseumPhotoItem } from './museumContentTypes';

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
