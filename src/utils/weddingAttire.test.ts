import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTIRE_ACCENT_OPTIONS,
  BRIDE_HEADWEAR_OPTIONS,
  BRIDE_STYLE_OPTIONS,
  DEFAULT_BRIDE_OUTFIT,
  DEFAULT_GROOM_OUTFIT,
  GROOM_STYLE_OPTIONS,
  SECRET_ROMANTIC_LETTERS,
  resolveBrideColors,
  resolveGroomColors,
} from './weddingAttire';

test('bride and groom attire resolvers return distinct valid palettes across all options', () => {
  for (const style of BRIDE_STYLE_OPTIONS) {
    for (const headwear of BRIDE_HEADWEAR_OPTIONS) {
      for (const accent of ATTIRE_ACCENT_OPTIONS) {
        const colors = resolveBrideColors({
          style: style.id,
          headwear: headwear.id,
          accent: accent.id,
        });
        assert.ok(colors.dress.startsWith('#'));
        assert.equal(colors.accentHex, accent.hex);
      }
    }
  }

  for (const suit of GROOM_STYLE_OPTIONS) {
    const colors = resolveGroomColors({ style: suit.id, accent: 'gold' });
    assert.ok(colors.jacket.startsWith('#'));
    assert.ok(colors.trousers.startsWith('#'));
  }

  assert.equal(DEFAULT_BRIDE_OUTFIT.headwear, 'flowing_veil');
  assert.equal(DEFAULT_GROOM_OUTFIT.style, 'midnight_tuxedo');
});

test('SECRET_ROMANTIC_LETTERS contain complete romantic prose entries', () => {
  assert.ok(SECRET_ROMANTIC_LETTERS.length >= 3);
  for (const letter of SECRET_ROMANTIC_LETTERS) {
    assert.ok(letter.title.length > 0);
    assert.ok(letter.date.length > 0);
    assert.ok(letter.body.length > 20);
  }
});
