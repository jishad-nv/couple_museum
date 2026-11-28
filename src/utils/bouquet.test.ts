import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOUQUET_ATTENDANT_POS,
  BOUQUET_STATION_POS,
  addFlowerToSelection,
  advanceBouquetHandoverStage,
  computeBouquetHandoverAnchor,
  createDefaultBouquetDesign,
  getActiveBouquetReaction,
  getBouquetHandoverActions,
  getBouquetRecipient,
  hasBouquetLetter,
  isNearBouquetStation,
  normalizeBouquetDesign,
  removeFlowerAtIndex,
  replaceFlowerAtIndex,
} from './bouquet';

test('bouquet station and attendant sit cleanly between Theatre and Garden doors without blocking either doorway', () => {
  const theatreDoor = { x: 0, z: -38.5 };
  const gardenDoor = { x: 12.0, z: -33.5 };

  const distToTheatre = Math.hypot(
    BOUQUET_STATION_POS[0] - theatreDoor.x,
    BOUQUET_STATION_POS[2] - theatreDoor.z
  );
  const distToGarden = Math.hypot(
    BOUQUET_STATION_POS[0] - gardenDoor.x,
    BOUQUET_STATION_POS[2] - gardenDoor.z
  );
  const attendantToGarden = Math.hypot(
    BOUQUET_ATTENDANT_POS[0] - gardenDoor.x,
    BOUQUET_ATTENDANT_POS[2] - gardenDoor.z
  );

  assert.ok(distToTheatre > 5.0, `Expected >5m from Theatre door, got ${distToTheatre}`);
  assert.ok(distToGarden > 5.0, `Expected >5m from Garden door, got ${distToGarden}`);
  assert.ok(attendantToGarden > 4.0, `Expected >4m from Garden door, got ${attendantToGarden}`);

  // Standing in front of the bouquet table triggers proximity
  assert.equal(
    isNearBouquetStation({ x: BOUQUET_STATION_POS[0] - 0.5, z: BOUQUET_STATION_POS[2] + 1.4 }),
    true
  );
  // Standing at either door does NOT trigger bouquet station
  assert.equal(isNearBouquetStation({ x: 0, z: -35.8 }), false);
  assert.equal(isNearBouquetStation({ x: 10.2, z: -31.8 }), false);
});

test('flower selection enforces max 4 flowers, prevents adding a 5th, and supports remove/replace', () => {
  let picked: ('red_rose' | 'blush_peony' | 'white_lily' | 'lavender' | 'sunflower')[] = [];

  const r1 = addFlowerToSelection(picked, 'red_rose');
  assert.equal(r1.added, true);
  picked = r1.next;

  const r2 = addFlowerToSelection(picked, 'blush_peony');
  picked = r2.next;
  const r3 = addFlowerToSelection(picked, 'white_lily');
  picked = r3.next;
  const r4 = addFlowerToSelection(picked, 'lavender');
  picked = r4.next;
  assert.equal(picked.length, 4);

  // Attempting to add a 5th flower must be blocked
  const r5 = addFlowerToSelection(picked, 'sunflower');
  assert.equal(r5.added, false);
  assert.equal(r5.reason, 'max_reached');
  assert.deepEqual(r5.next, ['red_rose', 'blush_peony', 'white_lily', 'lavender']);

  // Replace slot 1 and remove slot 2
  const replaced = replaceFlowerAtIndex(r5.next, 1, 'sunflower');
  assert.deepEqual(replaced, ['red_rose', 'sunflower', 'white_lily', 'lavender']);

  const removed = removeFlowerAtIndex(replaced, 2);
  assert.deepEqual(removed, ['red_rose', 'sunflower', 'lavender']);
});

test('normalizeBouquetDesign enforces at least one valid flower, caps at 4, and handles optional typed or handwritten letters', () => {
  const invalid = normalizeBouquetDesign({
    flowers: [],
    ribbonStyle: 'satin_bow',
    ribbonColor: 'champagne',
    message: 'hello',
    createdBy: 'girl',
  });
  assert.equal(invalid, null);

  const validTyped = normalizeBouquetDesign({
    flowers: ['red_rose', 'red_rose', 'white_lily', 'lavender', 'sunflower'],
    ribbonStyle: 'velvet_wrap',
    ribbonColor: 'crimson',
    message: '   For my favorite person in every room.   ',
    letterMode: 'typed',
    createdBy: 'boy',
  });
  assert.ok(validTyped);
  assert.deepEqual(validTyped.flowers, ['red_rose', 'red_rose', 'white_lily', 'lavender']);
  assert.equal(validTyped.ribbonStyle, 'velvet_wrap');
  assert.equal(validTyped.ribbonColor, 'crimson');
  assert.equal(validTyped.message, 'For my favorite person in every room.');
  assert.equal(validTyped.letterMode, 'typed');
  assert.equal(hasBouquetLetter(validTyped), true);

  const validHandwritten = normalizeBouquetDesign({
    flowers: ['blush_peony'],
    ribbonStyle: 'gold_cord',
    ribbonColor: 'ivory',
    message: '',
    letterMode: 'handwritten',
    handwrittenLetterDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    createdBy: 'girl',
  });
  assert.ok(validHandwritten);
  assert.equal(validHandwritten.letterMode, 'handwritten');
  assert.ok(validHandwritten.handwrittenLetterDataUrl?.startsWith('data:image/png'));
  assert.equal(hasBouquetLetter(validHandwritten), true);

  const noLetter = normalizeBouquetDesign({
    flowers: ['sunflower'],
    ribbonStyle: 'satin_bow',
    ribbonColor: 'champagne',
    message: '   ',
    letterMode: 'typed',
    handwrittenLetterDataUrl: null,
    createdBy: 'girl',
  });
  assert.ok(noLetter);
  assert.equal(hasBouquetLetter(noLetter), false);
});

test('handover reaction triggers only during final reaction stage for the correct recipient', () => {
  assert.equal(getBouquetRecipient('girl'), 'boy');
  assert.equal(getBouquetRecipient('boy'), 'girl');

  // Creation / offering / receiving must NOT prematurely fire reactions
  assert.equal(getActiveBouquetReaction('idle', 'boy'), 'none');
  assert.equal(getActiveBouquetReaction('approaching', 'boy'), 'none');
  assert.equal(getActiveBouquetReaction('offering', 'boy'), 'none');
  assert.equal(getActiveBouquetReaction('receiving', 'boy'), 'none');

  // Girl gives to Boy -> Boy blushes softly after handover
  assert.equal(getActiveBouquetReaction('reaction', getBouquetRecipient('girl')), 'boy_blush');
  // Boy gives to Girl -> Girl shows happy affectionate reaction after handover
  assert.equal(getActiveBouquetReaction('reaction', getBouquetRecipient('boy')), 'girl_happy');
});

test('computeBouquetHandoverAnchor aligns giver and receiver facing each other at non-clipping spacing', () => {
  const anchor = computeBouquetHandoverAnchor(
    { x: 4.5, z: -33.2 },
    Math.PI,
    { x: 6.8, z: -33.6 },
    'girl'
  );
  assert.equal(anchor.giver, 'girl');
  assert.equal(anchor.receiver, 'boy');

  const separation = Math.hypot(
    anchor.boyPos[0] - anchor.girlPos[0],
    anchor.boyPos[2] - anchor.girlPos[2]
  );
  assert.ok(Math.abs(separation - 0.92) < 0.01);

  // Facing vectors should be opposite (PI apart modulo 2*PI)
  const facingDelta = Math.abs(Math.sin((anchor.boyFacing - anchor.girlFacing) / 2));
  assert.ok(facingDelta > 0.99);
});

test('advanceBouquetHandoverStage and action mapping progress smoothly for both genders', () => {
  assert.equal(advanceBouquetHandoverStage('approaching', 0.2, 0.05), 'approaching');
  assert.equal(advanceBouquetHandoverStage('approaching', 0.4, 0.05), 'offering');
  assert.equal(advanceBouquetHandoverStage('offering', 1.4, 0.0), 'receiving');
  assert.equal(advanceBouquetHandoverStage('receiving', 1.0, 0.0), 'reaction');
  assert.equal(advanceBouquetHandoverStage('reaction', 3.3, 0.0), 'done');

  const girlGives = getBouquetHandoverActions('reaction', 'girl', 0);
  assert.equal(girlGives.girlAction, 'idle');
  assert.equal(girlGives.boyAction, 'bouquet_react_blush');

  const boyGives = getBouquetHandoverActions('reaction', 'boy', 0);
  assert.equal(boyGives.boyAction, 'idle');
  assert.equal(boyGives.girlAction, 'bouquet_react_happy');

  const defaults = createDefaultBouquetDesign('girl');
  assert.ok(defaults.flowers.length >= 1);
});
