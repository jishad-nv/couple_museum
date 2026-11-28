import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeProposalPositions,
  isProposalBusy,
  isProposalCelebrationActive,
  isProposalFireworksAllowed,
  isSuitableProposalLocation,
  shouldPlayProposalFlowerAnimation,
  shouldShowCoupleToolbar,
} from './proposal.ts';

test('isSuitableProposalLocation enables proposal only inside unlocked inner Secret Room and guards obstacles/busy states', () => {
  // Gallery, Garden, Pre-Secret Room, Cinema, and Wedding Hall are not valid proposal spots
  assert.equal(isSuitableProposalLocation('gallery', { x: 0, z: -13.5 }, { secretRoomUnlocked: true }), false);
  assert.equal(isSuitableProposalLocation('garden', { x: 18.0, z: -34.0 }, { secretRoomUnlocked: true }), false);
  assert.equal(isSuitableProposalLocation('secret', { x: -24.0, z: -21.5 }, { secretRoomUnlocked: true }), false);
  assert.equal(isSuitableProposalLocation('cinema', { x: 0, z: -47.5 }, { secretRoomUnlocked: true }), false);
  assert.equal(isSuitableProposalLocation('wedding', { x: -26.5, z: -50.0 }, { secretRoomUnlocked: true }), false);

  // Inner Secret Room requires password unlock AND clear floor space away from center board
  assert.equal(
    isSuitableProposalLocation('private_chamber', { x: -41.5, z: -21.5 }, { secretRoomUnlocked: false }),
    false
  );
  assert.equal(
    isSuitableProposalLocation('private_chamber', { x: -41.5, z: -21.5 }, { secretRoomUnlocked: true }),
    true
  );
  // Too close to central memory board
  assert.equal(
    isSuitableProposalLocation('private_chamber', { x: -44.8, z: -21.5 }, { secretRoomUnlocked: true }),
    false
  );

  // Busy states block proposal even inside unlocked inner Secret Room
  assert.equal(
    isSuitableProposalLocation('private_chamber', { x: -41.5, z: -21.5 }, { secretRoomUnlocked: true, isSitting: true }),
    false
  );
  assert.equal(
    isSuitableProposalLocation('private_chamber', { x: -41.5, z: -21.5 }, { secretRoomUnlocked: true, isDancing: true }),
    false
  );
  assert.equal(
    isSuitableProposalLocation('private_chamber', { x: -41.5, z: -21.5 }, { secretRoomUnlocked: true, modalOpen: true }),
    false
  );
  assert.equal(
    isSuitableProposalLocation('private_chamber', { x: -41.5, z: -21.5 }, { secretRoomUnlocked: true, proposalStage: 'kneeling' }),
    false
  );
});

test('computeProposalPositions aligns proposer and partner cleanly facing each other at exact spacing', () => {
  const pose = computeProposalPositions({ x: 2, z: -14 }, 0, 1.0);
  const dx = pose.partner[0] - pose.proposer[0];
  const dz = pose.partner[2] - pose.proposer[2];
  assert.ok(Math.abs(Math.hypot(dx, dz) - 1.0) < 1e-6);
  // Facing angles should be opposite (PI apart)
  const diff = Math.abs(Math.abs(pose.proposerFacing - pose.partnerFacing) - Math.PI);
  assert.ok(diff < 1e-6);
});

test('proposal state helpers lock interruptions and trigger flower celebration only while proposal celebration is active', () => {
  assert.equal(isProposalBusy('idle'), false);
  assert.equal(isProposalBusy('approaching'), true);
  assert.equal(isProposalBusy('kneeling'), true);
  assert.equal(isProposalBusy('awaiting_answer'), true);
  assert.equal(isProposalBusy('embracing'), true);

  assert.equal(isProposalCelebrationActive('idle'), false);
  assert.equal(isProposalCelebrationActive('kneeling'), false);
  assert.equal(isProposalCelebrationActive('awaiting_answer'), false);
  assert.equal(isProposalCelebrationActive('accepted_standing'), true);
  assert.equal(isProposalCelebrationActive('embracing'), true);
  assert.equal(isProposalCelebrationActive('celebrating'), true);

  assert.equal(shouldPlayProposalFlowerAnimation('idle'), false);
  assert.equal(shouldPlayProposalFlowerAnimation('approaching'), false);
  assert.equal(shouldPlayProposalFlowerAnimation('kneeling'), false);
  assert.equal(shouldPlayProposalFlowerAnimation('awaiting_answer'), false);
  assert.equal(shouldPlayProposalFlowerAnimation('accepted_standing'), true);
  assert.equal(shouldPlayProposalFlowerAnimation('embracing'), true);
  assert.equal(shouldPlayProposalFlowerAnimation('celebrating'), true);

  assert.equal(isProposalFireworksAllowed('private_chamber'), false);
  assert.equal(isProposalFireworksAllowed('secret'), false);
});

test('shouldShowCoupleToolbar respects wedding room and modal visibility', () => {
  assert.equal(shouldShowCoupleToolbar('gallery', false), true);
  assert.equal(shouldShowCoupleToolbar('garden', false), true);
  assert.equal(shouldShowCoupleToolbar('wedding', false), false);
  assert.equal(shouldShowCoupleToolbar('gallery', true), false);
});
