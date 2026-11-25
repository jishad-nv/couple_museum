import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeProposalPositions,
  isProposalBusy,
  isProposalCelebrationActive,
  isSuitableProposalLocation,
  shouldShowCoupleToolbar,
} from './proposal.ts';

test('isSuitableProposalLocation enables proposal in romantic open rooms and guards obstacles/busy states', () => {
  // Open gallery floor away from central pedestal
  assert.equal(isSuitableProposalLocation('gallery', { x: 0, z: -13.5 }), true);
  // Too close to central album pedestal
  assert.equal(isSuitableProposalLocation('gallery', { x: 0, z: -21.0 }), false);

  // Garden open lawn vs waterfall pond
  assert.equal(isSuitableProposalLocation('garden', { x: 18.0, z: -34.0 }), true);
  assert.equal(isSuitableProposalLocation('garden', { x: 26.5, z: -38.0 }), false);

  // Secret room & Private chamber clear center
  assert.equal(isSuitableProposalLocation('secret', { x: -24.0, z: -21.5 }), true);
  assert.equal(isSuitableProposalLocation('private_chamber', { x: -41.5, z: -21.5 }), true);
  assert.equal(isSuitableProposalLocation('private_chamber', { x: -44.8, z: -21.5 }), false);

  // Disallowed inside cinema, wedding hall, sitting, dancing, or active modal
  assert.equal(isSuitableProposalLocation('cinema', { x: 0, z: -47.5 }), false);
  assert.equal(isSuitableProposalLocation('wedding', { x: -26.5, z: -50.0 }), false);
  assert.equal(isSuitableProposalLocation('gallery', { x: 0, z: -13.5 }, { isSitting: true }), false);
  assert.equal(isSuitableProposalLocation('gallery', { x: 0, z: -13.5 }, { isDancing: true }), false);
  assert.equal(isSuitableProposalLocation('gallery', { x: 0, z: -13.5 }, { modalOpen: true }), false);
  assert.equal(
    isSuitableProposalLocation('gallery', { x: 0, z: -13.5 }, { proposalStage: 'kneeling' }),
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

test('proposal state helpers lock interruptions and trigger celebration only post-acceptance', () => {
  assert.equal(isProposalBusy('idle'), false);
  assert.equal(isProposalBusy('approaching'), true);
  assert.equal(isProposalBusy('kneeling'), true);
  assert.equal(isProposalBusy('awaiting_answer'), true);
  assert.equal(isProposalBusy('embracing'), true);

  assert.equal(isProposalCelebrationActive('kneeling'), false);
  assert.equal(isProposalCelebrationActive('awaiting_answer'), false);
  assert.equal(isProposalCelebrationActive('accepted_standing'), true);
  assert.equal(isProposalCelebrationActive('embracing'), true);
  assert.equal(isProposalCelebrationActive('celebrating'), true);
});

test('shouldShowCoupleToolbar respects wedding room and modal visibility', () => {
  assert.equal(shouldShowCoupleToolbar('gallery', false), true);
  assert.equal(shouldShowCoupleToolbar('garden', false), true);
  assert.equal(shouldShowCoupleToolbar('wedding', false), false);
  assert.equal(shouldShowCoupleToolbar('gallery', true), false);
});
