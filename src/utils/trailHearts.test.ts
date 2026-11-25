import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRAIL_MAX_OPACITY,
  TRAIL_SPAWN_DISTANCE,
  createTrailHeartPool,
  shouldEmitMovementHearts,
  stepTrailHeartPool,
} from './trailHearts';

const BASE_ELIGIBLE = {
  proposalStage: 'idle' as const,
  isSitting: false,
  activeCoupleSequence: 'none',
  currentRoom: 'gallery',
  weddingStage: 'idle',
};

test('shouldEmitMovementHearts allows non-proposal walking and blocks all proposal stages, sitting, and hugs', () => {
  assert.equal(shouldEmitMovementHearts(BASE_ELIGIBLE), true);
  assert.equal(
    shouldEmitMovementHearts({ ...BASE_ELIGIBLE, activeCoupleSequence: 'kiss' }),
    true
  );

  for (const stage of [
    'approaching',
    'kneeling',
    'awaiting_answer',
    'accepted_standing',
    'embracing',
    'celebrating',
  ] as const) {
    assert.equal(
      shouldEmitMovementHearts({ ...BASE_ELIGIBLE, proposalStage: stage }),
      false
    );
  }

  assert.equal(shouldEmitMovementHearts({ ...BASE_ELIGIBLE, isSitting: true }), false);
  assert.equal(
    shouldEmitMovementHearts({ ...BASE_ELIGIBLE, activeCoupleSequence: 'hug' }),
    false
  );
  assert.equal(
    shouldEmitMovementHearts({
      ...BASE_ELIGIBLE,
      currentRoom: 'wedding',
      weddingStage: 'hug',
    }),
    false
  );
});

test('stepTrailHeartPool emits subtle hearts behind moving characters and fades out cleanly when stopped', () => {
  const pool = createTrailHeartPool(12);

  // Initial frame establishes baseline with zero active particles
  const initCount = stepTrailHeartPool(pool, {
    delta: 0.016,
    playerPos: { x: 0, y: 0, z: 0 },
    partnerPos: { x: 0.72, y: 0, z: 0 },
    eligibility: BASE_ELIGIBLE,
  });
  assert.equal(initCount, 0);

  // Move characters forward in -Z over several steps past spawn distance
  let activeCount = 0;
  for (let step = 1; step <= 6; step++) {
    const z = -step * (TRAIL_SPAWN_DISTANCE * 0.45);
    activeCount = stepTrailHeartPool(pool, {
      delta: 0.1,
      playerPos: { x: 0, y: 0, z },
      partnerPos: { x: 0.72, y: 0, z },
      eligibility: BASE_ELIGIBLE,
    });
  }
  assert.ok(activeCount >= 2, 'Expected trailing hearts to spawn when couple walks');

  const activeParticles = pool.particles.filter((p) => p.active);
  for (const p of activeParticles) {
    assert.ok(p.opacity > 0 && p.opacity <= TRAIL_MAX_OPACITY);
    assert.ok(p.scale > 0 && p.scale <= 1.2);
  }

  // Stop moving and advance time past particle lifetime; pool should drain cleanly to 0
  const lastZ = -6 * (TRAIL_SPAWN_DISTANCE * 0.45);
  for (let i = 0; i < 20; i++) {
    activeCount = stepTrailHeartPool(pool, {
      delta: 0.1,
      playerPos: { x: 0, y: 0, z: lastZ },
      partnerPos: { x: 0.72, y: 0, z: lastZ },
      eligibility: BASE_ELIGIBLE,
    });
  }
  assert.equal(activeCount, 0);
});

test('stepTrailHeartPool never spawns new hearts when moving during proposal stages', () => {
  const pool = createTrailHeartPool(12);

  stepTrailHeartPool(pool, {
    delta: 0.016,
    playerPos: { x: 0, y: 0, z: 0 },
    partnerPos: { x: 0.72, y: 0, z: 0 },
    eligibility: { ...BASE_ELIGIBLE, proposalStage: 'approaching' },
  });

  const activeDuringProposal = stepTrailHeartPool(pool, {
    delta: 0.25,
    playerPos: { x: 0, y: 0, z: -1.5 },
    partnerPos: { x: 0.72, y: 0, z: -1.5 },
    eligibility: { ...BASE_ELIGIBLE, proposalStage: 'approaching' },
  });

  assert.equal(activeDuringProposal, 0);
});
