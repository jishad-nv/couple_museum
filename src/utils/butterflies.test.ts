import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GARDEN_BUTTERFLIES,
  WEDDING_BUTTERFLIES,
  sampleButterflyPose,
} from './butterflies';

test('sampleButterflyPose stays bounded around anchor and produces finite yaw, pitch, and wing flap', () => {
  const spec = GARDEN_BUTTERFLIES[0];
  for (let t = 0; t <= 20; t += 0.35) {
    const pose = sampleButterflyPose(spec, t);
    assert.ok(Number.isFinite(pose.x) && Number.isFinite(pose.y) && Number.isFinite(pose.z));
    assert.ok(Number.isFinite(pose.yaw) && Number.isFinite(pose.pitch));
    assert.ok(Number.isFinite(pose.wingFlap));

    assert.ok(Math.abs(pose.x - spec.anchor[0]) <= spec.radiusX + 1e-6);
    assert.ok(Math.abs(pose.z - spec.anchor[2]) <= spec.radiusZ + 1e-6);
    assert.ok(
      Math.abs(pose.y - spec.anchor[1]) <= spec.bobAmplitude * 1.46,
      `y=${pose.y} exceeded expected bob range around ${spec.anchor[1]}`
    );
    assert.ok(pose.wingFlap >= -0.75 && pose.wingFlap <= 1.2);
  }
});

test('GARDEN_BUTTERFLIES and WEDDING_BUTTERFLIES stay safely positioned above ground in their gardens', () => {
  assert.ok(GARDEN_BUTTERFLIES.length >= 6);
  assert.ok(WEDDING_BUTTERFLIES.length >= 4);

  for (const b of GARDEN_BUTTERFLIES) {
    assert.ok(b.anchor[0] >= 13 && b.anchor[0] <= 38, `Garden butterfly X=${b.anchor[0]} out of garden bounds`);
    assert.ok(b.anchor[2] <= -26 && b.anchor[2] >= -50, `Garden butterfly Z=${b.anchor[2]} out of garden bounds`);
    assert.ok(b.anchor[1] >= 0.8 && b.anchor[1] <= 2.4);
  }

  for (const b of WEDDING_BUTTERFLIES) {
    assert.ok(b.anchor[0] <= -13 && b.anchor[0] >= -45);
    assert.ok(b.anchor[2] <= -36 && b.anchor[2] >= -74);
    assert.ok(b.anchor[1] >= 0.8 && b.anchor[1] <= 2.4);
  }
});
