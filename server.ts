import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { MuseumDatabase } from './server/db.ts';
import {
  BASE_UPLOAD_DIR,
  MAX_UPLOAD_BYTES,
  ensureUploadDirs,
  removeManagedUploadIfUnused,
  saveValidatedUpload,
  streamMediaFile,
} from './server/media.ts';
import {
  LoginRateLimiter,
  constantTimeEqualStrings,
  hashPassword,
  isSafeMediaUrl,
  isValidHexColor,
  sanitizeText,
  signAdminToken,
  verifyAdminToken,
  verifyMediaAccess,
  verifyPassword,
  type AdminTokenPayload,
  type MediaCategory,
} from './server/security.ts';
import type {
  MemoryMotif,
  MemorySection,
  MuseumGuestbookEntry,
  MusicZoneTarget,
  PhotoRoomTarget,
} from './src/utils/museumContentTypes.ts';

interface AuthenticatedRequest extends Request {
  adminUser?: AdminTokenPayload;
}

const VALID_SECTIONS = new Set<MemorySection>([
  'Our First Memories',
  'Our First Holidays Together',
  'Special Moments',
  'Beautiful Memories',
  'Forever Together',
  'Garden Memories',
]);

const VALID_MOTIFS = new Set<MemoryMotif>([
  'sunrise',
  'beach',
  'lanterns',
  'roses',
  'stars',
  'rain',
  'autumn',
  'arch',
]);

const VALID_ROOM_TARGETS = new Set<PhotoRoomTarget>(['gallery', 'garden', 'album']);
const VALID_MUSIC_ZONES = new Set<MusicZoneTarget>(['gallery', 'theatre', 'garden', 'dance', 'playlist']);
const VALID_STAMPS = new Set<MuseumGuestbookEntry['stamp']>(['♡', '✦', '❀', '★']);

export function createMuseumApp(options?: { dbPath?: string; uploadDir?: string }) {
  const db = new MuseumDatabase(options?.dbPath);
  const uploadDir = options?.uploadDir ?? BASE_UPLOAD_DIR;
  ensureUploadDirs(uploadDir);

  const loginLimiter = new LoginRateLimiter(5, 15 * 60 * 1000);
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  function hasEnvAdmin(): boolean {
    return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);
  }

  function extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string') return null;
    if (!header.startsWith('Bearer ')) return null;
    return header.slice(7).trim() || null;
  }

  function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const payload = verifyAdminToken(token, (jti) => db.isTokenRevoked(jti));
    if (!payload || payload.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: invalid or expired administrator session' });
      return;
    }
    req.adminUser = payload;
    next();
  }

  function getClientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  function paramStr(value: string | string[] | undefined): string {
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }

  // ─── Public Read-Only & Visitor Guestbook Routes ──────────────────────────

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/museum-content', (_req, res) => {
    res.json(db.getFullBundle());
  });

  app.post('/api/guestbook', (req, res) => {
    const author = sanitizeText(req.body?.author, 32);
    const message = sanitizeText(req.body?.message, 200);
    const rawStamp = typeof req.body?.stamp === 'string' ? req.body.stamp : '♡';
    const stamp: MuseumGuestbookEntry['stamp'] = VALID_STAMPS.has(
      rawStamp as MuseumGuestbookEntry['stamp']
    )
      ? (rawStamp as MuseumGuestbookEntry['stamp'])
      : '♡';

    if (!author) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    if (!message) {
      res.status(400).json({ error: 'Please write a note before signing.' });
      return;
    }

    const entry = db.addGuestbookEntry(author, message, stamp);
    res.status(201).json({ entry });
  });

  app.get('/api/media/:category/:filename', (req, res) => {
    streamMediaFile(req, res, paramStr(req.params.category), paramStr(req.params.filename), uploadDir);
  });

  // ─── Admin Authentication & Security Routes ────────────────────────────────

  app.get('/api/admin/status', (req, res) => {
    const setupRequired = !hasEnvAdmin() && !db.hasAdminUser();
    const token = extractBearerToken(req);
    const payload = token ? verifyAdminToken(token, (jti) => db.isTokenRevoked(jti)) : null;

    res.json({
      setupRequired,
      authenticated: Boolean(payload),
      admin: payload ? { username: payload.sub, email: payload.email, role: payload.role } : null,
    });
  });

  app.post('/api/admin/bootstrap', (req, res) => {
    if (hasEnvAdmin() || db.hasAdminUser()) {
      res.status(403).json({ error: 'Administrator account is already configured.' });
      return;
    }

    const username = sanitizeText(req.body?.username, 40);
    const email = sanitizeText(req.body?.email, 120);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (username.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
      res.status(400).json({ error: 'Username must be 3-40 letters, digits, dots, underscores, or hyphens.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid administrator email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
      return;
    }

    const passwordHash = hashPassword(password);
    const created = db.createInitialAdmin(username, email, passwordHash);
    const { token } = signAdminToken(created.username, created.email);

    res.status(201).json({
      token,
      admin: { username: created.username, email: created.email, role: created.role },
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const ip = getClientIp(req);
    const rateCheck = loginLimiter.check(ip);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      res.status(429).json({
        error: `Too many failed login attempts. Please try again in ${rateCheck.retryAfterSeconds}s.`,
      });
      return;
    }

    const identifier = sanitizeText(req.body?.identifier ?? req.body?.username ?? req.body?.email, 120);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      loginLimiter.recordFailure(ip);
      res.status(400).json({ error: 'Username/email and password are required.' });
      return;
    }

    // Priority 1: server environment admin credentials
    if (hasEnvAdmin()) {
      const envPassword = process.env.ADMIN_PASSWORD!.trim();
      const envUser = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
      const envEmail = (process.env.ADMIN_EMAIL || 'admin@ourlovemuseum.local').trim().toLowerCase();
      const normalizedId = identifier.toLowerCase();
      const idMatches =
        constantTimeEqualStrings(normalizedId, envUser) ||
        constantTimeEqualStrings(normalizedId, envEmail);
      const pwMatches = constantTimeEqualStrings(password, envPassword);

      if (idMatches && pwMatches) {
        loginLimiter.reset(ip);
        const { token } = signAdminToken(envUser, envEmail);
        res.json({
          token,
          admin: { username: envUser, email: envEmail, role: 'admin' },
        });
        return;
      }

      loginLimiter.recordFailure(ip);
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    // Priority 2: claimed database admin account
    const admin = db.findAdminByIdentifier(identifier);
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      loginLimiter.recordFailure(ip);
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    loginLimiter.reset(ip);
    const { token } = signAdminToken(admin.username, admin.email);
    res.json({
      token,
      admin: { username: admin.username, email: admin.email, role: admin.role },
    });
  });

  app.post('/api/admin/logout', requireAdmin, (req: AuthenticatedRequest, res) => {
    if (req.adminUser) {
      db.revokeToken(req.adminUser.jti, req.adminUser.exp);
    }
    res.json({ ok: true });
  });

  // ─── Admin Media Preview (Signed URL OR Bearer) & Protected Upload ────────

  app.get('/api/admin/media-preview/:category/:filename', (req: AuthenticatedRequest, res) => {
    const token = extractBearerToken(req);
    const payload = token ? verifyAdminToken(token, (jti) => db.isTokenRevoked(jti)) : null;
    const category = paramStr(req.params.category) as MediaCategory;
    const filename = paramStr(req.params.filename);
    const exp = typeof req.query.exp === 'string' ? req.query.exp : '';
    const sig = typeof req.query.sig === 'string' ? req.query.sig : '';

    if (!payload && !verifyMediaAccess(category, filename, exp, sig)) {
      res.status(403).json({ error: 'Invalid or expired signed media URL' });
      return;
    }
    streamMediaFile(req, res, category, filename, uploadDir);
  });

  const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES.videos },
  });

  app.post('/api/admin/upload/:category', requireAdmin, (req, res) => {
    const category = req.params.category;
    if (category !== 'photos' && category !== 'videos' && category !== 'music') {
      res.status(400).json({ error: 'Invalid upload category.' });
      return;
    }

    memoryUpload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed.';
        res.status(400).json({ error: msg });
        return;
      }
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ error: 'No file attached.' });
        return;
      }

      try {
        const saved = saveValidatedUpload(category, req.file.buffer, uploadDir);
        res.status(201).json(saved);
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : 'Invalid file upload.';
        res.status(400).json({ error: msg });
      }
    });
  });

  // ─── Admin Protected CRUD Routes ──────────────────────────────────────────

  app.get('/api/admin/content', requireAdmin, (_req, res) => {
    res.json(db.getFullBundle());
  });

  // Photos CRUD
  app.post('/api/admin/photos', requireAdmin, (req, res) => {
    const title = sanitizeText(req.body?.title, 80);
    const section = sanitizeText(req.body?.section, 50) as MemorySection;
    const date = sanitizeText(req.body?.date, 50);
    const description = sanitizeText(req.body?.description, 320);
    const photoSrc = sanitizeText(req.body?.photoSrc, 500);
    const motif = sanitizeText(req.body?.motif, 20) as MemoryMotif;
    const roomTarget = sanitizeText(req.body?.roomTarget, 20) as PhotoRoomTarget;
    const albumPage =
      req.body?.albumPage === null || req.body?.albumPage === '' || req.body?.albumPage === undefined
        ? null
        : Math.max(1, Math.min(200, Math.round(Number(req.body.albumPage))));

    if (!title) {
      res.status(400).json({ error: 'Photo title is required.' });
      return;
    }
    if (!isSafeMediaUrl(photoSrc) || !photoSrc) {
      res.status(400).json({ error: 'A valid photograph source URL or uploaded file is required.' });
      return;
    }

    const rawPalette = Array.isArray(req.body?.palette) ? req.body.palette : [];
    const palette: [string, string, string] = [
      isValidHexColor(rawPalette[0]) ? rawPalette[0] : '#3d233a',
      isValidHexColor(rawPalette[1]) ? rawPalette[1] : '#9c5268',
      isValidHexColor(rawPalette[2]) ? rawPalette[2] : '#f0b898',
    ];

    const created = db.createPhoto({
      title,
      section: VALID_SECTIONS.has(section) ? section : 'Our First Memories',
      date: date || 'Special Moment',
      description,
      photoSrc,
      palette,
      motif: VALID_MOTIFS.has(motif) ? motif : 'roses',
      roomTarget: VALID_ROOM_TARGETS.has(roomTarget) ? roomTarget : 'gallery',
      albumPage,
    });

    res.status(201).json({ photo: created, bundle: db.getFullBundle() });
  });

  app.put('/api/admin/photos/reorder', requireAdmin, (req, res) => {
    const orderedIds = Array.isArray(req.body?.orderedIds)
      ? req.body.orderedIds.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    if (orderedIds.length === 0) {
      res.status(400).json({ error: 'orderedIds array is required.' });
      return;
    }
    db.reorderPhotos(orderedIds);
    res.json({ bundle: db.getFullBundle() });
  });

  app.put('/api/admin/photos/:id', requireAdmin, (req, res) => {
    const patch: Record<string, unknown> = {};
    if (req.body?.title !== undefined) {
      const title = sanitizeText(req.body.title, 80);
      if (!title) {
        res.status(400).json({ error: 'Photo title cannot be empty.' });
        return;
      }
      patch.title = title;
    }
    if (req.body?.section !== undefined) {
      const sec = sanitizeText(req.body.section, 50) as MemorySection;
      if (VALID_SECTIONS.has(sec)) patch.section = sec;
    }
    if (req.body?.date !== undefined) patch.date = sanitizeText(req.body.date, 50);
    if (req.body?.description !== undefined) patch.description = sanitizeText(req.body.description, 320);
    if (req.body?.photoSrc !== undefined) {
      const photoSrc = sanitizeText(req.body.photoSrc, 500);
      if (!isSafeMediaUrl(photoSrc) || !photoSrc) {
        res.status(400).json({ error: 'Invalid photograph URL.' });
        return;
      }
      patch.photoSrc = photoSrc;
    }
    if (req.body?.roomTarget !== undefined) {
      const rt = sanitizeText(req.body.roomTarget, 20) as PhotoRoomTarget;
      if (VALID_ROOM_TARGETS.has(rt)) patch.roomTarget = rt;
    }
    if (req.body?.albumPage !== undefined) {
      patch.albumPage =
        req.body.albumPage === null || req.body.albumPage === ''
          ? null
          : Math.max(1, Math.min(200, Math.round(Number(req.body.albumPage))));
    }
    if (req.body?.motif !== undefined) {
      const motif = sanitizeText(req.body.motif, 20) as MemoryMotif;
      if (VALID_MOTIFS.has(motif)) patch.motif = motif;
    }

    const { updated, oldPhotoSrc } = db.updatePhoto(paramStr(req.params.id), patch);
    if (!updated) {
      res.status(404).json({ error: 'Photograph not found.' });
      return;
    }
    if (oldPhotoSrc) {
      removeManagedUploadIfUnused(oldPhotoSrc, db.getReferencedMediaUrls(), uploadDir);
    }
    res.json({ photo: updated, bundle: db.getFullBundle() });
  });

  app.delete('/api/admin/photos/:id', requireAdmin, (req, res) => {
    const { deleted, oldPhotoSrc } = db.deletePhoto(paramStr(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Photograph not found.' });
      return;
    }
    if (oldPhotoSrc) {
      removeManagedUploadIfUnused(oldPhotoSrc, db.getReferencedMediaUrls(), uploadDir);
    }
    res.json({ bundle: db.getFullBundle() });
  });

  // Videos CRUD
  app.post('/api/admin/videos', requireAdmin, (req, res) => {
    const title = sanitizeText(req.body?.title, 90);
    const subtitle = sanitizeText(req.body?.subtitle, 140);
    const description = sanitizeText(req.body?.description, 360);
    const videoSrc = sanitizeText(req.body?.videoSrc, 500);
    const posterSrc = sanitizeText(req.body?.posterSrc, 500);

    if (!title) {
      res.status(400).json({ error: 'Video title is required.' });
      return;
    }
    if (!videoSrc || !isSafeMediaUrl(videoSrc)) {
      res.status(400).json({ error: 'Valid video source is required.' });
      return;
    }
    if (posterSrc && !isSafeMediaUrl(posterSrc)) {
      res.status(400).json({ error: 'Invalid poster URL.' });
      return;
    }

    const created = db.createVideo({
      title,
      subtitle,
      description,
      videoSrc,
      posterSrc: posterSrc || '/videos/poster.jpg',
      isTheatreActive: Boolean(req.body?.isTheatreActive),
      isStoryVideo: Boolean(req.body?.isStoryVideo),
    });
    res.status(201).json({ video: created, bundle: db.getFullBundle() });
  });

  app.put('/api/admin/videos/:id', requireAdmin, (req, res) => {
    const patch: Record<string, unknown> = {};
    if (req.body?.title !== undefined) {
      const title = sanitizeText(req.body.title, 90);
      if (!title) {
        res.status(400).json({ error: 'Video title cannot be empty.' });
        return;
      }
      patch.title = title;
    }
    if (req.body?.subtitle !== undefined) patch.subtitle = sanitizeText(req.body.subtitle, 140);
    if (req.body?.description !== undefined) patch.description = sanitizeText(req.body.description, 360);
    if (req.body?.videoSrc !== undefined) {
      const videoSrc = sanitizeText(req.body.videoSrc, 500);
      if (!videoSrc || !isSafeMediaUrl(videoSrc)) {
        res.status(400).json({ error: 'Invalid video source URL.' });
        return;
      }
      patch.videoSrc = videoSrc;
    }
    if (req.body?.posterSrc !== undefined) {
      const posterSrc = sanitizeText(req.body.posterSrc, 500);
      if (!isSafeMediaUrl(posterSrc)) {
        res.status(400).json({ error: 'Invalid poster URL.' });
        return;
      }
      patch.posterSrc = posterSrc;
    }
    if (req.body?.isTheatreActive !== undefined) {
      patch.isTheatreActive = Boolean(req.body.isTheatreActive);
    }
    if (req.body?.isStoryVideo !== undefined) {
      patch.isStoryVideo = Boolean(req.body.isStoryVideo);
    }

    const { updated, removedUrls } = db.updateVideo(paramStr(req.params.id), patch);
    if (!updated) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    const referenced = db.getReferencedMediaUrls();
    for (const u of removedUrls) removeManagedUploadIfUnused(u, referenced, uploadDir);
    res.json({ video: updated, bundle: db.getFullBundle() });
  });

  app.delete('/api/admin/videos/:id', requireAdmin, (req, res) => {
    const { deleted, removedUrls } = db.deleteVideo(paramStr(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    const referenced = db.getReferencedMediaUrls();
    for (const u of removedUrls) removeManagedUploadIfUnused(u, referenced, uploadDir);
    res.json({ bundle: db.getFullBundle() });
  });

  // Texts management
  app.put('/api/admin/texts', requireAdmin, (req, res) => {
    const rawItems = Array.isArray(req.body?.texts) ? req.body.texts : [];
    const updates: Array<{ key: string; value: string }> = [];
    for (const item of rawItems) {
      const key = sanitizeText(item?.key, 60);
      const value = sanitizeText(item?.value, 240);
      if (key && value) {
        updates.push({ key, value });
      }
    }
    if (updates.length === 0) {
      res.status(400).json({ error: 'At least one non-empty text update is required.' });
      return;
    }
    db.updateTexts(updates);
    res.json({ bundle: db.getFullBundle() });
  });

  // Music CRUD & Playlist Reorder
  app.post('/api/admin/music', requireAdmin, (req, res) => {
    const title = sanitizeText(req.body?.title, 80);
    const subtitle = sanitizeText(req.body?.subtitle, 120);
    const zone = sanitizeText(req.body?.zone, 20) as MusicZoneTarget;
    const audioSrc = sanitizeText(req.body?.audioSrc, 500);
    const volume =
      typeof req.body?.volume === 'number' ? Math.max(0, Math.min(1, req.body.volume)) : 0.8;

    if (!title) {
      res.status(400).json({ error: 'Song title is required.' });
      return;
    }
    if (!audioSrc || !isSafeMediaUrl(audioSrc)) {
      res.status(400).json({ error: 'A valid uploaded audio file or safe URL is required.' });
      return;
    }

    const created = db.createMusicTrack({
      title,
      subtitle: subtitle || 'Curated Museum Track',
      zone: VALID_MUSIC_ZONES.has(zone) ? zone : 'playlist',
      audioSrc,
      volume,
    });
    res.status(201).json({ track: created, bundle: db.getFullBundle() });
  });

  app.put('/api/admin/music/reorder', requireAdmin, (req, res) => {
    const orderedIds = Array.isArray(req.body?.orderedIds)
      ? req.body.orderedIds.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    if (orderedIds.length === 0) {
      res.status(400).json({ error: 'orderedIds array is required.' });
      return;
    }
    db.reorderMusicTracks(orderedIds);
    res.json({ bundle: db.getFullBundle() });
  });

  app.put('/api/admin/music/:id', requireAdmin, (req, res) => {
    const patch: Record<string, unknown> = {};
    if (req.body?.title !== undefined) {
      const title = sanitizeText(req.body.title, 80);
      if (!title) {
        res.status(400).json({ error: 'Song title cannot be empty.' });
        return;
      }
      patch.title = title;
    }
    if (req.body?.subtitle !== undefined) patch.subtitle = sanitizeText(req.body.subtitle, 120);
    if (req.body?.zone !== undefined) {
      const z = sanitizeText(req.body.zone, 20) as MusicZoneTarget;
      if (VALID_MUSIC_ZONES.has(z)) patch.zone = z;
    }
    if (req.body?.audioSrc !== undefined) {
      const audioSrc = sanitizeText(req.body.audioSrc, 500);
      if (!isSafeMediaUrl(audioSrc)) {
        res.status(400).json({ error: 'Invalid audio URL.' });
        return;
      }
      patch.audioSrc = audioSrc;
    }
    if (req.body?.volume !== undefined) {
      patch.volume = Math.max(0, Math.min(1, Number(req.body.volume) || 0.78));
    }

    const { updated, oldAudioSrc } = db.updateMusicTrack(paramStr(req.params.id), patch);
    if (!updated) {
      res.status(404).json({ error: 'Music track not found.' });
      return;
    }
    if (oldAudioSrc) {
      removeManagedUploadIfUnused(oldAudioSrc, db.getReferencedMediaUrls(), uploadDir);
    }
    res.json({ track: updated, bundle: db.getFullBundle() });
  });

  app.delete('/api/admin/music/:id', requireAdmin, (req, res) => {
    try {
      const { deleted, oldAudioSrc } = db.deleteMusicTrack(paramStr(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: 'Music track not found.' });
        return;
      }
      if (oldAudioSrc) {
        removeManagedUploadIfUnused(oldAudioSrc, db.getReferencedMediaUrls(), uploadDir);
      }
      res.json({ bundle: db.getFullBundle() });
    } catch (delErr) {
      const msg = delErr instanceof Error ? delErr.message : 'Unable to delete track.';
      res.status(400).json({ error: msg });
    }
  });

  // Settings update
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const patch: Record<string, unknown> = {};
    if (req.body?.musicEnabled !== undefined) patch.musicEnabled = Boolean(req.body.musicEnabled);
    if (req.body?.musicVolume !== undefined) {
      const vol = Number(req.body.musicVolume);
      if (Number.isFinite(vol)) patch.musicVolume = Math.max(0, Math.min(1, vol));
    }
    for (const k of [
      'defaultMusicTrackId',
      'galleryMusicTrackId',
      'theatreMusicTrackId',
      'gardenMusicTrackId',
      'danceMusicTrackId',
    ] as const) {
      if (req.body?.[k] !== undefined) {
        patch[k] = sanitizeText(req.body[k], 60);
      }
    }
    db.updateSettings(patch);
    res.json({ bundle: db.getFullBundle() });
  });

  return { app, db };
}

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const { app } = createMuseumApp();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      const indexHtml = path.resolve(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output missing. Run npm run build.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Our Love Museum server listening on http://0.0.0.0:${port}`);
  });
}

const isEntrypoint =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename);

if (isEntrypoint) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
