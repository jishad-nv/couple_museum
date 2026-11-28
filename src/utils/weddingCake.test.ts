import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WEDDING_CAKE_TABLE_POS,
  WEDDING_CAKE_TABLE_RADIUS,
  advanceCakeCuttingStage,
  getCakeCameraFraming,
  getCakeCuttingPose,
} from './weddingCake';

test('getCakeCuttingPose places both characters clear of the cake table collider and separated cleanly', () => {
  const stages = ['approaching', 'cutting', 'feeding_a_to_b', 'feeding_b_to_a', 'celebrating'] as const;
  for (const stage of stages) {
    const pose = getCakeCuttingPose(stage);
    const distPlayerTable = Math.hypot(
      pose.player[0] - WEDDING_CAKE_TABLE_POS[0],
      pose.player[2] - WEDDING_CAKE_TABLE_POS[2]
    );
    const distPartnerTable = Math.hypot(
      pose.partner[0] - WEDDING_CAKE_TABLE_POS[0],
      pose.partner[2] - WEDDING_CAKE_TABLE_POS[2]
    );
    const pairDist = Math.hypot(pose.player[0] - pose.partner[0], pose.player[2] - pose.partner[2]);

    assert.ok(
      distPlayerTable >= WEDDING_CAKE_TABLE_RADIUS + 0.18,
      `${stage} player too close to cake table (${distPlayerTable})`
    );
    assert.ok(
      distPartnerTable >= WEDDING_CAKE_TABLE_RADIUS + 0.18,
      `${stage} partner too close to cake table (${distPartnerTable})`
    );
    assert.ok(pairDist >= 0.65, `${stage} couple spacing too tight (${pairDist})`);
  }
});

test('getCakeCuttingPose assigns coordinated cutting and mutual feeding actions', () => {
  const cut = getCakeCuttingPose('cutting');
  assert.equal(cut.playerAction, 'cake_cut');
  assert.equal(cut.partnerAction, 'cake_cut');

  const feedA = getCakeCuttingPose('feeding_a_to_b');
  assert.equal(feedA.playerAction, 'cake_feed_give');
  assert.equal(feedA.partnerAction, 'cake_feed_receive');

  const feedB = getCakeCuttingPose('feeding_b_to_a');
  assert.equal(feedB.playerAction, 'cake_feed_receive');
  assert.equal(feedB.partnerAction, 'cake_feed_give');
});

test('advanceCakeCuttingStage progresses through cutting -> mutual feeding -> celebrating -> done', () => {
  assert.equal(advanceCakeCuttingStage('approaching', 0.2, 0.5), 'approaching');
  assert.equal(advanceCakeCuttingStage('approaching', 0.6, 0.1), 'cutting');
  assert.equal(advanceCakeCuttingStage('cutting', 3.0, 0), 'feeding_a_to_b');
  assert.equal(advanceCakeCuttingStage('feeding_a_to_b', 3.0, 0), 'feeding_b_to_a');
  assert.equal(advanceCakeCuttingStage('feeding_b_to_a', 3.0, 0), 'celebrating');
  assert.equal(advanceCakeCuttingStage('celebrating', 2.0, 0), 'done');
});

test('getCakeCameraFraming frames unobstructed side-courtyard view of cake and couple', () => {
  const cam = getCakeCameraFraming();
  assert.ok(cam.position[0] > WEDDING_CAKE_TABLE_POS[0] + 2.0);
  assert.ok(cam.position[1] > 1.4 && cam.position[1] < 2.5);
  assert.ok(cam.lookAt[0] > WEDDING_CAKE_TABLE_POS[0]);
});
