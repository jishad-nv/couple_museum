import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import {
  detectMagicMediaType,
  resolveConfinedMediaPath,
  signMediaAccess,
  type MediaCategory,
} from './security.ts';

export const BASE_UPLOAD_DIR = path.resolve(process.cwd(), 'storage', 'uploads');

export const MAX_UPLOAD_BYTES: Record<MediaCategory, number> = {
  photos: 10 * 1024 * 1024, // 10 MB
  videos: 80 * 1024 * 1024, // 80 MB
  music: 25 * 1024 * 1024, // 25 MB
};

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
};

export function ensureUploadDirs(baseDir = BASE_UPLOAD_DIR): void {
  for (const cat of ['photos', 'videos', 'music'] as const) {
    fs.mkdirSync(path.resolve(baseDir, cat), { recursive: true });
  }
}

export function saveValidatedUpload(
  category: MediaCategory,
  buffer: Buffer,
  baseDir = BASE_UPLOAD_DIR
): {
  filename: string;
  publicUrl: string;
  url: string;
  signedPreviewUrl: string;
  mime: string;
  mimeType: string;
  size: number;
} {
  if (buffer.length > MAX_UPLOAD_BYTES[category]) {
    throw new Error(
      `File exceeds ${Math.round(MAX_UPLOAD_BYTES[category] / (1024 * 1024))}MB limit for ${category}.`
    );
  }

  const detected = detectMagicMediaType(buffer, category);
  if (!detected) {
    throw new Error(`Unsupported or invalid ${category} file signature.`);
  }

  ensureUploadDirs(baseDir);
  const filename = `${Date.now()}-${crypto.randomUUID()}${detected.ext}`;
  const confined = resolveConfinedMediaPath(baseDir, category, filename);
  if (!confined.valid) {
    throw new Error('Invalid destination path.');
  }

  fs.writeFileSync(confined.fullPath, buffer);
  const signed = signMediaAccess(category, filename, 900);

  const publicUrl = `/api/media/${category}/${filename}`;
  return {
    filename,
    publicUrl,
    url: publicUrl,
    signedPreviewUrl: signed.signedUrl,
    mime: detected.mime,
    mimeType: detected.mime,
    size: buffer.length,
  };
}

export function removeManagedUploadIfUnused(
  mediaUrl: string,
  stillReferencedUrls: Set<string>,
  baseDir = BASE_UPLOAD_DIR
): void {
  if (!mediaUrl.startsWith('/api/media/')) return;
  if (stillReferencedUrls.has(mediaUrl)) return;
  const segments = mediaUrl.replace(/^\/api\/media\//, '').split('/');
  if (segments.length !== 2) return;
  const [category, filename] = segments;
  const confined = resolveConfinedMediaPath(baseDir, category, filename);
  if (!confined.valid) return;
  try {
    if (fs.existsSync(confined.fullPath)) {
      fs.unlinkSync(confined.fullPath);
    }
  } catch {
    // Non-fatal cleanup
  }
}

export function streamMediaFile(
  req: Request,
  res: Response,
  category: string,
  filename: string,
  baseDir = BASE_UPLOAD_DIR
): void {
  const confined = resolveConfinedMediaPath(baseDir, category, filename);
  if (!confined.valid) {
    res.status(400).json({ error: 'Invalid media path' });
    return;
  }

  if (!fs.existsSync(confined.fullPath)) {
    res.status(404).json({ error: 'Media file not found' });
    return;
  }

  const stat = fs.statSync(confined.fullPath);
  const ext = path.extname(filename).toLowerCase();
  const mime = MIME_BY_EXT[ext] || 'application/octet-stream';

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', mime);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) {
      res.status(416).end();
      return;
    }
    const start = Number(match[1]);
    const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    if (start >= stat.size || end < start) {
      res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
      return;
    }
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', String(end - start + 1));
    fs.createReadStream(confined.fullPath, { start, end }).pipe(res);
    return;
  }

  res.setHeader('Content-Length', String(stat.size));
  fs.createReadStream(confined.fullPath).pipe(res);
}
