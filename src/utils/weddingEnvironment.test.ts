import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEDDING_CANOPY_TREES,
  WEDDING_CYPRESS_TREES,
  WEDDING_GARDEN_SHRUBS,
  WEDDING_LAWN_BASE_Y,
  WEDDING_NORTH_PATH_STONES,
  distanceToWeddingCourtyard,
  groundHeightAt,
  isInsideMuseumFootprint,
  isInsideOtherMuseumWing,
  isOnWeddingTerrace,
  isWeddingAtmosphereActive,
} from './weddingEnvironment';

test('isWeddingAtmosphereActive enables daylight strictly inside Wedding Hall or on its entry walk', () => {
  assert.equal(isWeddingAtmosphereActive('wedding', null), true);
  assert.equal(isWeddingAtmosphereActive('gallery', [-26.5, 0, -38.8]), true);
  assert.equal(isWeddingAtmosphereActive('gallery', null), false);
  assert.equal(isWeddingAtmosphereActive('gallery', [-9.6, 0, -31.1]), false);
  assert.equal(isWeddingAtmosphereActive('garden', null), false);
  assert.equal(isWeddingAtmosphereActive('exterior', null), false);
});

test('Wedding courtyard terrain stays strictly flat right around terrace & breezeway', () => {
  assert.equal(groundHeightAt(-26.5, -51.0), WEDDING_LAWN_BASE_Y);
  assert.equal(groundHeightAt(-40.5, -67.5), WEDDING_LAWN_BASE_Y);
  assert.equal(groundHeightAt(-26.5, -75.0), WEDDING_LAWN_BASE_Y);
  assert.equal(groundHeightAt(-47.0, -51.0), WEDDING_LAWN_BASE_Y);
  assert.equal(distanceToWeddingCourtyard(-26.5, -51.0), 0);
  assert.ok(distanceToWeddingCourtyard(-45.5, -51.0) >= 4.9);
});

test('Distant countryside hills rise naturally in North & West horizons without entering other museum wings', () => {
  const northHillY = groundHeightAt(-26.5, -135.0);
  const westHillY = groundHeightAt(-115.0, -51.0);
  const nwHillY = groundHeightAt(-105.0, -125.0);

  assert.ok(northHillY > 5.0, `Expected distant north hill height > 5m, got ${northHillY}`);
  assert.ok(westHillY > 5.0, `Expected distant west hill height > 5m, got ${westHillY}`);
  assert.ok(nwHillY > 8.0, `Expected distant NW hill height > 8m, got ${nwHillY}`);

  // Other museum wings stay completely clear of hill terrain
  assert.equal(groundHeightAt(0, -21.5), WEDDING_LAWN_BASE_Y); // PhotoGallery
  assert.equal(groundHeightAt(0, -47.5), WEDDING_LAWN_BASE_Y); // MemoryTheatre
  assert.equal(groundHeightAt(26.5, -38.0), WEDDING_LAWN_BASE_Y); // MemoryGarden
  assert.equal(groundHeightAt(-26.5, -21.5), WEDDING_LAWN_BASE_Y); // SecretRoom
  assert.equal(groundHeightAt(-44.8, -21.5), WEDDING_LAWN_BASE_Y); // PrivateMemoryChamber
  assert.equal(groundHeightAt(0, 14.0), WEDDING_LAWN_BASE_Y); // MuseumExterior
});

test('No destination-wedding trees, shrubs, or stepping stones clip into Wedding terrace or any museum room', () => {
  for (const tree of WEDDING_CYPRESS_TREES) {
    assert.equal(
      isOnWeddingTerrace(tree.x, tree.z, 0.3),
      false,
      `Cypress (${tree.x}, ${tree.z}) overlaps Wedding terrace`
    );
    assert.equal(
      isInsideOtherMuseumWing(tree.x, tree.z, 0.4),
      false,
      `Cypress (${tree.x}, ${tree.z}) overlaps another museum room`
    );
  }

  for (const tree of WEDDING_CANOPY_TREES) {
    assert.equal(
      isInsideMuseumFootprint(tree.x, tree.z, 1.0),
      false,
      `Canopy tree (${tree.x}, ${tree.z}) overlaps museum footprint`
    );
  }

  for (const shrub of WEDDING_GARDEN_SHRUBS) {
    assert.equal(
      isOnWeddingTerrace(shrub.x, shrub.z, 0.2),
      false,
      `Shrub (${shrub.x}, ${shrub.z}) overlaps Wedding terrace`
    );
    assert.equal(
      isInsideOtherMuseumWing(shrub.x, shrub.z, 0.2),
      false,
      `Shrub (${shrub.x}, ${shrub.z}) overlaps another museum room`
    );
  }

  for (const stone of WEDDING_NORTH_PATH_STONES) {
    assert.equal(
      isInsideMuseumFootprint(stone.x, stone.z, 0),
      false,
      `Path stone (${stone.x}, ${stone.z}) overlaps museum footprint`
    );
  }
});
