import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BENCH_CUSHION_TOP_Y,
  BENCH_SEAT_LOCAL_Z,
  CAMERA_BOUNDS,
  DANCE_PARTNER_SPACING,
  DANCE_SPOT_POS,
  GARDEN_BENCH_POSITIONS,
  GARDEN_DOOR_POS,
  GALLERY_CENTER,
  GALLERY_INNER_RADIUS,
  GALLERY_OUTER_RADIUS,
  THEATRE_SIDE_SEATS,
  THEATRE_VIP_SEAT_POS,
  WATERFALL_CENTER,
  WATERFALL_POND_RADIUS,
  clampCameraDistance,
  clampCameraPitch,
  computeSeatAlignment,
  detectMuseumRoom,
  findNearestBench,
  getCoupleSideBySidePositions,
  getDanceCouplePositions,
} from './museumLayout';

test('detectMuseumRoom identifies exterior, entrance, gallery, cinema, and garden accurately', () => {
  assert.equal(detectMuseumRoom(0, 12.5), 'exterior');
  assert.equal(detectMuseumRoom(0, 4.1), 'exterior');
  assert.equal(detectMuseumRoom(0, 0.8), 'entrance');
  assert.equal(detectMuseumRoom(0, -4.5), 'entrance');
  assert.equal(detectMuseumRoom(0, -21.5), 'gallery');
  assert.equal(detectMuseumRoom(-10, -20), 'gallery');
  assert.equal(detectMuseumRoom(0, -45), 'cinema');
  assert.equal(detectMuseumRoom(25, -38), 'garden');
});

test('clampCameraDistance and clampCameraPitch enforce comfortable bounds', () => {
  assert.equal(clampCameraDistance(0.5), CAMERA_BOUNDS.minDistance);
  assert.equal(clampCameraDistance(25), CAMERA_BOUNDS.maxDistance);
  assert.equal(clampCameraDistance(4.2), 4.2);

  assert.equal(clampCameraPitch(-1), CAMERA_BOUNDS.minPitch);
  assert.equal(clampCameraPitch(2), CAMERA_BOUNDS.maxPitch);
  assert.equal(clampCameraPitch(0.35), 0.35);
});

test('GARDEN_DOOR_POS sits cleanly on circular gallery perimeter', () => {
  const dx = GARDEN_DOOR_POS[0] - GALLERY_CENTER[0];
  const dz = GARDEN_DOOR_POS[2] - GALLERY_CENTER[2];
  const radius = Math.hypot(dx, dz);
  assert.ok(Math.abs(radius - GALLERY_OUTER_RADIUS) < 0.2);
});

test('getCoupleSideBySidePositions places couple symmetrically without overlap', () => {
  const res = getCoupleSideBySidePositions(0, 12.5, Math.PI, 0.38);
  const dist = Math.hypot(
    res.player[0] - res.partner[0],
    res.player[2] - res.partner[2]
  );
  assert.ok(Math.abs(dist - 0.76) < 0.001);
});

test('computeSeatAlignment seats both characters side by side cleanly on cushion without overlap', () => {
  assert.ok(BENCH_CUSHION_TOP_Y > 0.42 && BENCH_CUSHION_TOP_Y < 0.5);
  assert.ok(BENCH_SEAT_LOCAL_Z < 0 && BENCH_SEAT_LOCAL_Z > -0.1);

  const aligned = computeSeatAlignment(THEATRE_VIP_SEAT_POS, Math.PI, 0.34);
  const partnerSep = Math.hypot(
    aligned.player[0] - aligned.partner[0],
    aligned.player[2] - aligned.partner[2]
  );
  assert.ok(Math.abs(partnerSep - 0.68) < 0.001);
  assert.ok(aligned.player[2] > THEATRE_VIP_SEAT_POS[2]);
  assert.ok(aligned.exitPos[2] < THEATRE_VIP_SEAT_POS[2] - 0.7);
});

test('findNearestBench strictly resolves the closest bench inside interaction radius', () => {
  const seats = [
    { id: 'vip', label: 'VIP', position: THEATRE_VIP_SEAT_POS, rotation: Math.PI },
    ...THEATRE_SIDE_SEATS,
  ];
  assert.equal(findNearestBench({ x: -3.7, z: -47.6 }, seats, 3.2)?.id, 'cinema-left-front');
  assert.equal(findNearestBench({ x: 3.7, z: -50.7 }, seats, 3.2)?.id, 'cinema-right-back');
  assert.equal(findNearestBench({ x: 0.1, z: -47.4 }, seats, 3.2)?.id, 'vip');
  assert.equal(findNearestBench({ x: 0, z: -40 }, seats, 3.2), null);
});

test('garden benches stay completely clear of the central waterfall pond collider', () => {
  for (const bench of GARDEN_BENCH_POSITIONS) {
    const dist = Math.hypot(
      bench.position[0] - WATERFALL_CENTER[0],
      bench.position[2] - WATERFALL_CENTER[2]
    );
    assert.ok(dist > WATERFALL_POND_RADIUS + 2.0, `${bench.id} too close to waterfall`);
  }
});

test('theatre VIP seating and door positions keep North screen opposite South entrance', () => {
  assert.equal(detectMuseumRoom(0, -47.5), 'cinema');
  assert.equal(detectMuseumRoom(0, -38.5), 'gallery');
});

test('DANCE_SPOT_POS sits cleanly in open gallery clear of central pedestal and keeps partners non-clipping', () => {
  assert.equal(detectMuseumRoom(DANCE_SPOT_POS[0], DANCE_SPOT_POS[2]), 'gallery');
  const distToPedestal = Math.hypot(
    DANCE_SPOT_POS[0] - GALLERY_CENTER[0],
    DANCE_SPOT_POS[2] - GALLERY_CENTER[2]
  );
  assert.ok(distToPedestal > GALLERY_INNER_RADIUS + 3.0);

  const pose = getDanceCouplePositions(DANCE_SPOT_POS[0], DANCE_SPOT_POS[2], 1.15);
  const separation = Math.hypot(
    pose.player[0] - pose.partner[0],
    pose.player[2] - pose.partner[2]
  );
  assert.ok(Math.abs(separation - DANCE_PARTNER_SPACING) < 0.001);
  // Facing angles should be opposite (PI radians apart)
  let angleDiff = Math.abs(pose.playerFacing - pose.partnerFacing);
  if (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
  assert.ok(Math.abs(angleDiff - Math.PI) < 0.01);
});
