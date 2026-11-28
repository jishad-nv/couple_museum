import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ENTRANCE_TWILIGHT_FACTOR,
  computeLoadingReadiness,
  stepEntranceLightFactor,
} from './loadingReadiness';

test('computeLoadingReadiness waits for both content and sceneReady before allowing ENTER', () => {
  const onlyContent = computeLoadingReadiness({
    contentStatus: 'ready',
    sceneReady: false,
    contentError: null,
  });
  assert.equal(onlyContent.canEnter, false);
  assert.equal(onlyContent.isError, false);
  assert.ok(onlyContent.percent >= 50 && onlyContent.percent < 100);

  const onlyScene = computeLoadingReadiness({
    contentStatus: 'loading',
    sceneReady: true,
    contentError: null,
  });
  assert.equal(onlyScene.canEnter, false);
  assert.ok(onlyScene.percent >= 50 && onlyScene.percent < 100);

  const ready = computeLoadingReadiness({
    contentStatus: 'ready',
    sceneReady: true,
    contentError: null,
  });
  assert.equal(ready.canEnter, true);
  assert.equal(ready.percent, 100);
});

test('computeLoadingReadiness exposes clear error state and blocks enter on failure', () => {
  const errState = computeLoadingReadiness({
    contentStatus: 'error',
    sceneReady: true,
    contentError: 'Network unavailable',
  });
  assert.equal(errState.isError, true);
  assert.equal(errState.canEnter, false);
  assert.equal(errState.statusLabel, 'Network unavailable');
});

test('stepEntranceLightFactor keeps visible twilight while loading and fades smoothly up on ENTER', () => {
  let factor = stepEntranceLightFactor(ENTRANCE_TWILIGHT_FACTOR, true, 0.016);
  assert.equal(factor, ENTRANCE_TWILIGHT_FACTOR);

  for (let i = 0; i < 40; i++) {
    const next = stepEntranceLightFactor(factor, false, 0.033);
    assert.ok(next > factor, 'entrance lighting should rise monotonically after ENTER');
    factor = next;
  }
  assert.ok(factor > 0.9, 'lighting should smooth toward full brightness within ~1.3s');

  for (let i = 0; i < 120; i++) {
    factor = stepEntranceLightFactor(factor, false, 0.033);
  }
  assert.equal(factor, 1);
});
