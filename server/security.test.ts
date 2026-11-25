import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createMuseumApp } from '../server.ts';
import {
  LoginRateLimiter,
  detectMagicMediaType,
  hashPassword,
  isSafeMediaUrl,
  resolveConfinedMediaPath,
  signAdminToken,
  signMediaAccess,
  verifyAdminToken,
  verifyMediaAccess,
  verifyPassword,
} from './security.ts';

test('scrypt password hashing verifies valid passwords and rejects wrong passwords', () => {
  const hash = hashPassword('RomanticMuseum#2026');
  assert.ok(hash.startsWith('scrypt:'));
  assert.equal(verifyPassword('RomanticMuseum#2026', hash), true);
  assert.equal(verifyPassword('wrong-password', hash), false);
});

test('signed admin tokens enforce HMAC integrity, expiration, and revocation', () => {
  const revoked = new Set<string>();
  const { token, payload } = signAdminToken('curator', 'curator@museum.test', 120);
  const verified = verifyAdminToken(token, (jti) => revoked.has(jti));
  assert.ok(verified);
  assert.equal(verified.sub, 'curator');
  assert.equal(verified.role, 'admin');

  // Tamper check
  const tampered = `${token.slice(0, -4)}AAAA`;
  assert.equal(verifyAdminToken(tampered), null);

  // Revocation check
  revoked.add(payload.jti);
  assert.equal(verifyAdminToken(token, (jti) => revoked.has(jti)), null);
});

test('login rate limiter locks after 5 failures and resets cleanly', () => {
  const limiter = new LoginRateLimiter(5, 60_000);
  const ip = '203.0.113.10';
  for (let i = 0; i < 5; i++) {
    assert.equal(limiter.check(ip, 1000).allowed, true);
    limiter.recordFailure(ip, 1000);
  }
  const blocked = limiter.check(ip, 2000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);

  limiter.reset(ip);
  assert.equal(limiter.check(ip, 2000).allowed, true);
});

test('magic-byte validator rejects spoofed executables and accepts valid PNG/JPEG/MP3', () => {
  const fakeScript = Buffer.from('<script>alert(1)</script>................');
  assert.equal(detectMagicMediaType(fakeScript, 'photos'), null);

  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 1]);
  assert.deepEqual(detectMagicMediaType(validPng, 'photos'), { ext: '.png', mime: 'image/png' });

  const validMp3 = Buffer.from([0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(detectMagicMediaType(validMp3, 'music'), { ext: '.mp3', mime: 'audio/mpeg' });
});

test('media path resolver blocks traversal and signed media URLs expire cleanly', () => {
  const base = path.resolve('/tmp/museum-uploads');
  assert.equal(resolveConfinedMediaPath(base, 'photos', '../secret.txt').valid, false);
  assert.equal(resolveConfinedMediaPath(base, 'scripts', 'evil.js').valid, false);
  assert.equal(resolveConfinedMediaPath(base, 'photos', 'valid-photo_1.png').valid, true);

  assert.equal(isSafeMediaUrl('javascript:alert(1)'), false);
  assert.equal(isSafeMediaUrl('/api/media/photos/abc.jpg'), true);

  const signed = signMediaAccess('photos', 'sample.jpg', 60);
  assert.equal(verifyMediaAccess('photos', 'sample.jpg', String(signed.exp), signed.sig), true);
  assert.equal(verifyMediaAccess('photos', 'other.jpg', String(signed.exp), signed.sig), false);
});

test('end-to-end API security: unauthenticated admin mutations rejected, bootstrap locks, CRUD persists', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'love-museum-test-'));
  const dbPath = path.join(tmpDir, 'test.db');
  const uploadDir = path.join(tmpDir, 'uploads');

  const { app, db } = createMuseumApp({ dbPath, uploadDir });
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Public content loads seeded memories & settings
    const pubRes = await fetch(`${baseUrl}/api/museum-content`);
    assert.equal(pubRes.status, 200);
    const pubData = (await pubRes.json()) as { photos: Array<{ id: string }>; texts: Array<{ key: string }> };
    assert.ok(pubData.photos.length >= 15);
    assert.ok(pubData.texts.length >= 10);

    // 2. Unauthorized admin requests are rejected (401)
    const unauthPost = await fetch(`${baseUrl}/api/admin/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Sneaky', photoSrc: '/photos/photo1.jpg' }),
    });
    assert.equal(unauthPost.status, 401);

    const unauthDelete = await fetch(`${baseUrl}/api/admin/photos/mem-1`, { method: 'DELETE' });
    assert.equal(unauthDelete.status, 401);

    // 3. First-run bootstrap claims admin & locks permanently afterward
    const bootRes = await fetch(`${baseUrl}/api/admin/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'curator',
        email: 'curator@love-museum.test',
        password: 'MuseumPassword!2026',
      }),
    });
    assert.equal(bootRes.status, 201);
    const bootJson = (await bootRes.json()) as { token: string };
    assert.ok(bootJson.token);

    const secondBoot = await fetch(`${baseUrl}/api/admin/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'attacker',
        email: 'attacker@evil.test',
        password: 'AttackerPassword!99',
      }),
    });
    assert.equal(secondBoot.status, 403);

    // 4. Authenticated admin can upload PNG/MP4/WAV, create photo/video/music, edit text, and persist across fresh fetch
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 1, 0, 0, 0, 1]);
    const form = new FormData();
    form.append('file', new Blob([validPng], { type: 'image/png' }), 'memory.png');
    const upRes = await fetch(`${baseUrl}/api/admin/upload/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bootJson.token}` },
      body: form,
    });
    assert.equal(upRes.status, 201);
    const upJson = (await upRes.json()) as { publicUrl: string; url: string };
    assert.ok(upJson.publicUrl.startsWith('/api/media/photos/'));
    assert.equal(upJson.url, upJson.publicUrl);

    const addPhotoRes = await fetch(`${baseUrl}/api/admin/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bootJson.token}`,
      },
      body: JSON.stringify({
        title: 'Parisian Balcony',
        section: 'Special Moments',
        date: 'Autumn 2025',
        description: 'Croissants at sunrise overlooking quiet rooftops.',
        photoSrc: upJson.url,
        roomTarget: 'album',
        albumPage: 19,
      }),
    });
    assert.equal(addPhotoRes.status, 201);

    // Upload MP4 + create video
    const validMp4 = Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
    const vForm = new FormData();
    vForm.append('file', new Blob([validMp4], { type: 'video/mp4' }), 'reel.mp4');
    const upVidRes = await fetch(`${baseUrl}/api/admin/upload/videos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bootJson.token}` },
      body: vForm,
    });
    assert.equal(upVidRes.status, 201);
    const upVidJson = (await upVidRes.json()) as { url: string; publicUrl: string };
    assert.ok(upVidJson.url.startsWith('/api/media/videos/'));
    const addVidRes = await fetch(`${baseUrl}/api/admin/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bootJson.token}`,
      },
      body: JSON.stringify({
        title: 'Anniversary Reel',
        subtitle: 'Cinema Cut',
        description: 'Our year in motion.',
        videoSrc: upVidJson.url,
        isTheatreActive: true,
        isStoryVideo: true,
      }),
    });
    assert.equal(addVidRes.status, 201);

    // Upload WAV + create music track
    const validWav = Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt ', 'latin1');
    const mForm = new FormData();
    mForm.append('file', new Blob([validWav], { type: 'audio/wav' }), 'waltz.wav');
    const upMusRes = await fetch(`${baseUrl}/api/admin/upload/music`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bootJson.token}` },
      body: mForm,
    });
    assert.equal(upMusRes.status, 201);
    const upMusJson = (await upMusRes.json()) as { url: string; publicUrl: string };
    assert.ok(upMusJson.url.startsWith('/api/media/music/'));
    const addMusRes = await fetch(`${baseUrl}/api/admin/music`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bootJson.token}`,
      },
      body: JSON.stringify({
        title: 'Moonlit Waltz Theme',
        subtitle: 'Custom Violin',
        zone: 'dance',
        audioSrc: upMusJson.url,
        volume: 0.85,
      }),
    });
    assert.equal(addMusRes.status, 201);

    // Confirm uploaded media streams back with nosniff
    const streamRes = await fetch(`${baseUrl}${upJson.url}`);
    assert.equal(streamRes.status, 200);
    assert.equal(streamRes.headers.get('x-content-type-options'), 'nosniff');

    const textRes = await fetch(`${baseUrl}/api/admin/texts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bootJson.token}`,
      },
      body: JSON.stringify({
        texts: [{ key: 'album_cover_title', value: 'Our Eternal Chronicles' }],
      }),
    });
    assert.equal(textRes.status, 200);

    // Confirm persisted in public museum bundle
    const refreshedRes = await fetch(`${baseUrl}/api/museum-content`);
    const refreshed = (await refreshedRes.json()) as {
      photos: Array<{ title: string }>;
      videos: Array<{ title: string }>;
      musicTracks: Array<{ title: string }>;
      texts: Array<{ key: string; value: string }>;
    };
    assert.ok(refreshed.photos.some((p) => p.title === 'Parisian Balcony'));
    assert.ok(refreshed.videos.some((v) => v.title === 'Anniversary Reel'));
    assert.ok(refreshed.musicTracks.some((m) => m.title === 'Moonlit Waltz Theme'));
    assert.equal(
      refreshed.texts.find((t) => t.key === 'album_cover_title')?.value,
      'Our Eternal Chronicles'
    );

    // 5. Secret Room Quiz CRUD, Private Memory CRUD, and monotonic visitor progress + admin reset
    const unauthReset = await fetch(`${baseUrl}/api/admin/secret/reset-progress`, { method: 'POST' });
    assert.equal(unauthReset.status, 401);

    const unauthQuizCreate = await fetch(`${baseUrl}/api/admin/secret-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Unauthorized question?',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correctOption: 'A',
      }),
    });
    assert.equal(unauthQuizCreate.status, 401);

    // Monotonic progress guard: cannot collect key or unlock 2nd door before yesConfirmed + quizCompleted
    const skipAttempt = await fetch(`${baseUrl}/api/secret/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyCollected: true, secondDoorUnlocked: true }),
    });
    assert.equal(skipAttempt.status, 200);
    const skipJson = (await skipAttempt.json()) as {
      secretProgress: {
        yesConfirmed: boolean;
        quizCompleted: boolean;
        keyCollected: boolean;
        secondDoorUnlocked: boolean;
      };
    };
    assert.equal(skipJson.secretProgress.yesConfirmed, false);
    assert.equal(skipJson.secretProgress.keyCollected, false);
    assert.equal(skipJson.secretProgress.secondDoorUnlocked, false);

    // Valid sequential steps persist
    await fetch(`${baseUrl}/api/secret/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yesConfirmed: true }),
    });
    await fetch(`${baseUrl}/api/secret/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizCompleted: true, keyCollected: true }),
    });
    const unlockStep = await fetch(`${baseUrl}/api/secret/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secondDoorUnlocked: true, chamberDiscovered: true }),
    });
    const unlockJson = (await unlockStep.json()) as {
      secretProgress: { secondDoorUnlocked: boolean; chamberDiscovered: boolean };
    };
    assert.equal(unlockJson.secretProgress.secondDoorUnlocked, true);
    assert.equal(unlockJson.secretProgress.chamberDiscovered, true);

    // Authenticated admin updates quiz + adds private memory + resets progress
    const addQuizRes = await fetch(`${baseUrl}/api/admin/secret-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bootJson.token}`,
      },
      body: JSON.stringify({
        question: 'Where did we share our midnight tea?',
        description: 'Look back at winter.',
        options: { A: 'Terrace', B: 'Station', C: 'Park', D: 'Bookshop' },
        correctOption: 'A',
      }),
    });
    assert.equal(addQuizRes.status, 201);

    const addPrivRes = await fetch(`${baseUrl}/api/admin/private-memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bootJson.token}`,
      },
      body: JSON.stringify({
        kind: 'code',
        title: 'Secret Signal 11:11',
        subtitle: 'Admin Test',
        dateLabel: 'Tonight',
        body: 'Thinking of you.',
        secretCode: '11:11-US',
        photoSrc: upJson.url,
      }),
    });
    assert.equal(addPrivRes.status, 201);

    const resetRes = await fetch(`${baseUrl}/api/admin/secret/reset-progress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bootJson.token}` },
    });
    assert.equal(resetRes.status, 200);
    const resetBundle = (await resetRes.json()) as {
      bundle: {
        secretQuiz: Array<{ question: string }>;
        privateMemories: Array<{ title: string }>;
        secretProgress: { yesConfirmed: boolean; secondDoorUnlocked: boolean };
      };
    };
    assert.ok(resetBundle.bundle.secretQuiz.some((q) => q.question.includes('midnight tea')));
    assert.ok(resetBundle.bundle.privateMemories.some((m) => m.title === 'Secret Signal 11:11'));
    assert.equal(resetBundle.bundle.secretProgress.yesConfirmed, false);
    assert.equal(resetBundle.bundle.secretProgress.secondDoorUnlocked, false);

    // 6. Logout revokes token immediately
    const logoutRes = await fetch(`${baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bootJson.token}` },
    });
    assert.equal(logoutRes.status, 200);

    const afterLogout = await fetch(`${baseUrl}/api/admin/content`, {
      headers: { Authorization: `Bearer ${bootJson.token}` },
    });
    assert.equal(afterLogout.status, 403);
  } finally {
    server.close();
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
