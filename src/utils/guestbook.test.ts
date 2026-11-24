import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_GUESTBOOK_ENTRIES,
  MAX_AUTHOR_LENGTH,
  MAX_MESSAGE_LENGTH,
  addGuestbookEntry,
  createGuestbookEntry,
  formatGuestbookTime,
  getRecentGuestbookEntries,
  validateGuestbookInput,
} from './guestbook';

test('validateGuestbookInput rejects empty author or message', () => {
  const bothEmpty = validateGuestbookInput('   ', '');
  assert.equal(bothEmpty.valid, false);
  assert.equal(bothEmpty.authorError, 'Please enter your name.');
  assert.equal(bothEmpty.messageError, 'Please write a note before signing.');

  const missingMessage = validateGuestbookInput('Elena', '   ');
  assert.equal(missingMessage.valid, false);
  assert.equal(missingMessage.authorError, null);
  assert.equal(missingMessage.messageError, 'Please write a note before signing.');
});

test('validateGuestbookInput enforces max lengths', () => {
  const longAuthor = 'A'.repeat(MAX_AUTHOR_LENGTH + 1);
  const longMsg = 'M'.repeat(MAX_MESSAGE_LENGTH + 1);
  const result = validateGuestbookInput(longAuthor, longMsg);
  assert.equal(result.valid, false);
  assert.ok(result.authorError);
  assert.ok(result.messageError);

  const valid = validateGuestbookInput('  Sam & Alex  ', '  Lovely museum!  ');
  assert.deepEqual(valid, {
    valid: true,
    authorError: null,
    messageError: null,
  });
});

test('createGuestbookEntry trims fields and throws on invalid input', () => {
  const now = 1795450000000;
  const entry = createGuestbookEntry('  Maya  ', '  Forever memorable!  ', '✦', now, 'note-1');
  assert.deepEqual(entry, {
    id: 'note-1',
    author: 'Maya',
    message: 'Forever memorable!',
    stamp: '✦',
    createdAt: now,
  });

  assert.throws(() => createGuestbookEntry('', 'Hello'));
});

test('addGuestbookEntry prepends new notes and getRecentGuestbookEntries orders newest first', () => {
  const older = createGuestbookEntry('First', 'Older note', '♡', 1000, 'a');
  const newer = createGuestbookEntry('Second', 'Newer note', '✿', 5000, 'b');
  const newest = createGuestbookEntry('Third', 'Newest note', '♪', 9000, 'c');

  const combined = addGuestbookEntry([older, newer], newest);
  assert.equal(combined.length, 3);
  assert.equal(combined[0].id, 'c');

  const recentTwo = getRecentGuestbookEntries(combined, 2);
  assert.deepEqual(
    recentTwo.map((e) => e.id),
    ['c', 'b']
  );

  assert.equal(getRecentGuestbookEntries(INITIAL_GUESTBOOK_ENTRIES, 0).length, 0);
});

test('formatGuestbookTime formats relative times accurately', () => {
  const now = 1_700_000_000_000;
  assert.equal(formatGuestbookTime(now - 20_000, now), 'Just now');
  assert.equal(formatGuestbookTime(now - 5 * 60_000, now), '5m ago');
  assert.equal(formatGuestbookTime(now - 3 * 3600_000, now), '3h ago');
  assert.equal(formatGuestbookTime(now - 25 * 3600_000, now), 'Yesterday');
  assert.equal(formatGuestbookTime(now - 4 * 86400_000, now), '4d ago');
});
