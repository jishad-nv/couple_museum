import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeResponsiveFov,
  detectMobileTouchDevice,
  isPortraitViewport,
  shouldShowLandscapePrompt,
} from './orientation';

test('detectMobileTouchDevice identifies phones and touch tablets in both portrait and landscape', () => {
  // Phone portrait & landscape
  assert.equal(
    detectMobileTouchDevice({
      width: 390,
      height: 844,
      maxTouchPoints: 5,
      hasTouchEvent: true,
      hasCoarsePointer: true,
      hasFinePointer: false,
    }),
    true
  );
  assert.equal(
    detectMobileTouchDevice({
      width: 844,
      height: 390,
      maxTouchPoints: 5,
      hasTouchEvent: true,
      hasCoarsePointer: true,
      hasFinePointer: false,
    }),
    true
  );

  // Touch tablet portrait & landscape (keeps mobile status across rotation)
  assert.equal(
    detectMobileTouchDevice({
      width: 768,
      height: 1024,
      maxTouchPoints: 5,
      hasTouchEvent: true,
      hasCoarsePointer: true,
      hasFinePointer: false,
    }),
    true
  );
  assert.equal(
    detectMobileTouchDevice({
      width: 1024,
      height: 768,
      maxTouchPoints: 5,
      hasTouchEvent: true,
      hasCoarsePointer: true,
      hasFinePointer: false,
    }),
    true
  );
});

test('detectMobileTouchDevice never forces desktop browsers or fine-pointer laptops into mobile mode', () => {
  // Standard desktop
  assert.equal(
    detectMobileTouchDevice({
      width: 1440,
      height: 900,
      maxTouchPoints: 0,
      hasTouchEvent: false,
      hasCoarsePointer: false,
      hasFinePointer: true,
    }),
    false
  );

  // Narrow non-touch desktop browser window
  assert.equal(
    detectMobileTouchDevice({
      width: 390,
      height: 844,
      maxTouchPoints: 0,
      hasTouchEvent: false,
      hasCoarsePointer: false,
      hasFinePointer: true,
    }),
    false
  );

  // Large touchscreen laptop with mouse/trackpad primary pointer
  assert.equal(
    detectMobileTouchDevice({
      width: 1440,
      height: 900,
      maxTouchPoints: 10,
      hasTouchEvent: true,
      hasCoarsePointer: false,
      hasFinePointer: true,
    }),
    false
  );
});

test('isPortraitViewport and shouldShowLandscapePrompt enforce landscape-only on mobile touch devices', () => {
  assert.equal(isPortraitViewport(390, 844), true);
  assert.equal(isPortraitViewport(844, 390), false);
  assert.equal(isPortraitViewport(1440, 900), false);

  assert.equal(shouldShowLandscapePrompt(true, true), true);
  assert.equal(shouldShowLandscapePrompt(true, false), false);
  assert.equal(shouldShowLandscapePrompt(false, true), false);
  assert.equal(shouldShowLandscapePrompt(false, false), false);
});

test('computeResponsiveFov adapts gently for wide short mobile landscape viewports while preserving desktop FOV', () => {
  assert.equal(computeResponsiveFov(1440, 900, false), 60);
  assert.equal(computeResponsiveFov(844, 390, true), 63);
  assert.equal(computeResponsiveFov(1024, 768, true), 60);
});
