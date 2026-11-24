import crypto from 'node:crypto';
import path from 'node:path';

export type MediaCategory = 'photos' | 'videos' | 'music';

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: 'admin';
  jti: string;
  iat: number;
  exp: number;
}

export interface DetectedMediaFile {
  ext: string;
  mime: string;
}

let runtimeSessionSecret: Buffer | null = null;

function getSessionSecret(): Buffer {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return crypto.createHash('sha256').update(envSecret).digest();
  }
  if (!runtimeSessionSecret) {
    runtimeSessionSecret = crypto.randomBytes(32);
  }
  return runtimeSessionSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function constantTimeEqualStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

export function signAdminToken(
  username: string,
  email: string,
  ttlSeconds = 60 * 60 * 12
): { token: string; payload: AdminTokenPayload } {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    sub: username,
    email,
    role: 'admin',
    jti: crypto.randomUUID(),
    iat: nowSec,
    exp: nowSec + ttlSeconds,
  };
  const headerB64 = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(data).digest();
  return {
    token: `${data}.${toBase64Url(sig)}`,
    payload,
  };
}

export function verifyAdminToken(
  token: string,
  isRevoked?: (jti: string) => boolean
): AdminTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  try {
    const data = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(data).digest();
    const providedSig = fromBase64Url(sigB64);
    if (expectedSig.length !== providedSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

    const payload = JSON.parse(fromBase64Url(payloadB64).toString('utf8')) as Partial<AdminTokenPayload>;
    if (
      payload.role !== 'admin' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.jti !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) return null;
    if (isRevoked && isRevoked(payload.jti)) return null;

    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function signMediaAccess(
  category: MediaCategory,
  filename: string,
  ttlSeconds = 900
): { exp: number; sig: string; signedUrl: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const data = `media:${category}:${filename}:${exp}`;
  const sig = toBase64Url(crypto.createHmac('sha256', getSessionSecret()).update(data).digest());
  return {
    exp,
    sig,
    signedUrl: `/api/admin/media-preview/${encodeURIComponent(category)}/${encodeURIComponent(filename)}?exp=${exp}&sig=${sig}`,
  };
}

export function verifyMediaAccess(
  category: MediaCategory,
  filename: string,
  expParam: string,
  sigParam: string
): boolean {
  const exp = Number(expParam);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return false;
  if (!sigParam || typeof sigParam !== 'string') return false;
  try {
    const data = `media:${category}:${filename}:${exp}`;
    const expected = crypto.createHmac('sha256', getSessionSecret()).update(data).digest();
    const provided = fromBase64Url(sigParam);
    if (expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  // Strip ASCII control characters except standard spaces/newlines
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return cleaned.slice(0, maxLen);
}

export function isSafeMediaUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (
    trimmed.startsWith('/photos/') ||
    trimmed.startsWith('/videos/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/api/media/') ||
    trimmed.startsWith('/api/admin/media-preview/')
  ) {
    return !trimmed.includes('..') && !/[\r\n\0]/.test(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isValidHexColor(value: unknown): boolean {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export function detectMagicMediaType(
  buffer: Buffer,
  category: MediaCategory
): DetectedMediaFile | null {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (category === 'photos') {
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { ext: '.jpg', mime: 'image/jpeg' };
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { ext: '.png', mime: 'image/png' };
    }
    // WEBP: RIFF....WEBP
    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { ext: '.webp', mime: 'image/webp' };
    }
    return null;
  }

  if (category === 'videos') {
    // MP4 / MOV: ....ftyp
    if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
      return { ext: '.mp4', mime: 'video/mp4' };
    }
    // WEBM: 1A 45 DF A3
    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return { ext: '.webm', mime: 'video/webm' };
    }
    return null;
  }

  // category === 'music'
  // MP3 with ID3 tag or frame sync
  if (
    buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  ) {
    return { ext: '.mp3', mime: 'audio/mpeg' };
  }
  // WAV: RIFF....WAVE
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return { ext: '.wav', mime: 'audio/wav' };
  }
  // OGG: OggS
  if (buffer.subarray(0, 4).toString('ascii') === 'OggS') {
    return { ext: '.ogg', mime: 'audio/ogg' };
  }
  // FLAC: fLaC
  if (buffer.subarray(0, 4).toString('ascii') === 'fLaC') {
    return { ext: '.flac', mime: 'audio/flac' };
  }
  // M4A / MP4 audio: ....ftyp
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return { ext: '.m4a', mime: 'audio/mp4' };
  }
  return null;
}

export function resolveConfinedMediaPath(
  baseUploadDir: string,
  category: string,
  filename: string
): { valid: true; category: MediaCategory; fullPath: string } | { valid: false } {
  if (category !== 'photos' && category !== 'videos' && category !== 'music') {
    return { valid: false };
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}$/.test(filename)) {
    return { valid: false };
  }
  if (filename.includes('..')) {
    return { valid: false };
  }
  const categoryDir = path.resolve(baseUploadDir, category);
  const resolved = path.resolve(categoryDir, filename);
  if (!resolved.startsWith(categoryDir + path.sep)) {
    return { valid: false };
  }
  return { valid: true, category, fullPath: resolved };
}

interface RateLimitBucket {
  failures: number;
  resetAt: number;
}

export class LoginRateLimiter {
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  check(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      return { allowed: true, retryAfterSeconds: 0, remaining: this.maxAttempts };
    }
    if (bucket.failures >= this.maxAttempts) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
        remaining: 0,
      };
    }
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, this.maxAttempts - bucket.failures),
    };
  }

  recordFailure(key: string, now = Date.now()): void {
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { failures: 1, resetAt: now + this.windowMs });
      return;
    }
    existing.failures += 1;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }
}
