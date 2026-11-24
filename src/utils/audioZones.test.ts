import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_TRACKS,
  CROSSFADE_DURATION_SECONDS,
  computeEqualPowerCrossfade,
  computeZoneMixGains,
  midiToFreq,
  roomToAudioZone,
  type AudioZoneId,
} from './audioZones';

test('roomToAudioZone maps exterior, entrance, and gallery to gallery, cinema to theatre, garden to garden, and dance to dance', () => {
  assert.equal(roomToAudioZone('exterior'), 'gallery');
  assert.equal(roomToAudioZone('entrance'), 'gallery');
  assert.equal(roomToAudioZone('gallery'), 'gallery');
  assert.equal(roomToAudioZone('cinema'), 'theatre');
  assert.equal(roomToAudioZone('garden'), 'garden');
  assert.equal(roomToAudioZone('gallery', true), 'dance');
  assert.equal(roomToAudioZone('entrance', true), 'dance');
});

test('computeZoneMixGains enforces single active zone when playing and zeroed gains when paused or muted', () => {
  assert.deepEqual(computeZoneMixGains('gallery', true, false), {
    gallery: 1,
    theatre: 0,
    garden: 0,
    dance: 0,
  });
  assert.deepEqual(computeZoneMixGains('theatre', true, false), {
    gallery: 0,
    theatre: 1,
    garden: 0,
    dance: 0,
  });
  assert.deepEqual(computeZoneMixGains('garden', true, false), {
    gallery: 0,
    theatre: 0,
    garden: 1,
    dance: 0,
  });
  assert.deepEqual(computeZoneMixGains('dance', true, false), {
    gallery: 0,
    theatre: 0,
    garden: 0,
    dance: 1,
  });
  assert.deepEqual(computeZoneMixGains('theatre', false, false), {
    gallery: 0,
    theatre: 0,
    garden: 0,
    dance: 0,
  });
  assert.deepEqual(computeZoneMixGains('garden', true, true), {
    gallery: 0,
    theatre: 0,
    garden: 0,
    dance: 0,
  });
});

test('computeEqualPowerCrossfade preserves smooth equal-power energy across transition', () => {
  const start = computeEqualPowerCrossfade(0);
  assert.ok(Math.abs(start.fromGain - 1) < 1e-6);
  assert.ok(Math.abs(start.toGain - 0) < 1e-6);

  const mid = computeEqualPowerCrossfade(0.5);
  const energy = mid.fromGain * mid.fromGain + mid.toGain * mid.toGain;
  assert.ok(Math.abs(energy - 1) < 1e-6);

  const end = computeEqualPowerCrossfade(1);
  assert.ok(Math.abs(end.fromGain - 0) < 1e-6);
  assert.ok(Math.abs(end.toGain - 1) < 1e-6);
  assert.ok(CROSSFADE_DURATION_SECONDS >= 1.5);
});

test('AUDIO_TRACKS define valid multi-chord romantic progressions for all four zones', () => {
  const zones: AudioZoneId[] = ['gallery', 'theatre', 'garden', 'dance'];
  for (const zone of zones) {
    const spec = AUDIO_TRACKS[zone];
    assert.ok(spec.title.length > 0);
    assert.ok(spec.tempoBpm >= 50 && spec.tempoBpm <= 95);
    assert.ok(spec.chords.length >= 4);
    for (const chord of spec.chords) {
      assert.equal(chord.arpMidis.length, spec.stepsPerChord);
      assert.equal(chord.melodyMidis.length, spec.stepsPerChord);
      assert.ok(chord.padMidis.length >= 3);
      assert.ok(midiToFreq(chord.bassMidi) > 40);
    }
  }
  assert.ok(Math.abs(midiToFreq(69) - 440) < 1e-6);
});
