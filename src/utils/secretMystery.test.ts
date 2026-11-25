import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PRIVATE_MEMORIES,
  DEFAULT_SECRET_PROGRESS,
  DEFAULT_SECRET_QUIZ_QUESTIONS,
  pickNextNoButtonPosition,
} from './secretMystery.ts';
import {
  PRIVATE_CHAMBER_ARRIVAL_POS,
  PRIVATE_DOOR_POS,
  QUIZ_MASTER_POS,
  REWARD_BOX_POS,
  SECRET_ARRIVAL_POS,
  detectMuseumRoom,
} from './museumLayout.ts';

test('pickNextNoButtonPosition always keeps NO strictly inside stage bounds and away from YES', () => {
  const yesRect = { x: 24, y: 52, width: 118, height: 46 };
  const stageW = 380;
  const stageH = 156;
  const btnW = 112;
  const btnH = 46;

  let current = { x: 204, y: 52 };
  for (let i = 0; i < 12; i++) {
    const next = pickNextNoButtonPosition(current, stageW, stageH, btnW, btnH, yesRect);
    assert.ok(next.x >= 12 && next.x <= stageW - btnW - 12, `x=${next.x} out of bounds`);
    assert.ok(next.y >= 10 && next.y <= stageH - btnH - 10, `y=${next.y} out of bounds`);
    assert.ok(next.x !== current.x || next.y !== current.y, 'NO button failed to move');

    const overlapsYes =
      next.x < yesRect.x + yesRect.width &&
      next.x + btnW > yesRect.x &&
      next.y < yesRect.y + yesRect.height &&
      next.y + btnH > yesRect.y;
    assert.equal(overlapsYes, false, 'NO button overlapped YES button');
    current = next;
  }
});

test('detectMuseumRoom distinguishes Secret Room and Private Memory Chamber cleanly', () => {
  assert.equal(detectMuseumRoom(SECRET_ARRIVAL_POS[0], SECRET_ARRIVAL_POS[2]), 'secret');
  assert.equal(detectMuseumRoom(QUIZ_MASTER_POS[0], QUIZ_MASTER_POS[2]), 'secret');
  assert.equal(detectMuseumRoom(REWARD_BOX_POS[0], REWARD_BOX_POS[2]), 'secret');
  assert.equal(
    detectMuseumRoom(PRIVATE_CHAMBER_ARRIVAL_POS[0], PRIVATE_CHAMBER_ARRIVAL_POS[2]),
    'private_chamber'
  );
  assert.equal(detectMuseumRoom(-44.8, -21.5), 'private_chamber');
  // Secret doorway threshold inside secret room
  assert.equal(detectMuseumRoom(PRIVATE_DOOR_POS[0] + 0.4, PRIVATE_DOOR_POS[2]), 'secret');
});

test('seeded quiz and private memory defaults satisfy required structure', () => {
  assert.equal(DEFAULT_SECRET_QUIZ_QUESTIONS.length, 5);
  for (const q of DEFAULT_SECRET_QUIZ_QUESTIONS) {
    assert.ok(q.question.length > 5);
    assert.ok(q.options.A && q.options.B && q.options.C && q.options.D);
    assert.ok(['A', 'B', 'C', 'D'].includes(q.correctOption));
  }
  assert.ok(DEFAULT_PRIVATE_MEMORIES.length >= 6);
  assert.equal(DEFAULT_SECRET_PROGRESS.yesConfirmed, false);
  assert.equal(DEFAULT_SECRET_PROGRESS.secondDoorUnlocked, false);
});
