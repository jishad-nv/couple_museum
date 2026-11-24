import * as THREE from 'three';

export interface MemoryItem {
  id: string;
  title: string;
  section:
    | 'Our First Memories'
    | 'Our First Holidays Together'
    | 'Special Moments'
    | 'Beautiful Memories'
    | 'Forever Together'
    | 'Garden Memories';
  date: string;
  description: string;
  photoSrc: string;
  palette: [string, string, string];
  motif: 'sunrise' | 'beach' | 'lanterns' | 'roses' | 'stars' | 'rain' | 'autumn' | 'arch';
}

// Detect any user-uploaded personal photos in src/assets at build time without firing 404s
const bundledAssets = import.meta.glob('../assets/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export function isLivePhotoUrl(photoSrc: string): boolean {
  return (
    photoSrc.startsWith('/api/media/') ||
    photoSrc.startsWith('/api/admin/media-preview/') ||
    photoSrc.startsWith('https://') ||
    photoSrc.startsWith('http://') ||
    photoSrc.startsWith('data:image/') ||
    photoSrc.startsWith('blob:')
  );
}

export function resolveUploadedAssetUrl(photoSrc: string): string | null {
  if (!photoSrc) return null;
  if (isLivePhotoUrl(photoSrc)) return photoSrc;

  const fileName = photoSrc.split('/').pop()?.toLowerCase();
  if (!fileName) return null;
  for (const [path, url] of Object.entries(bundledAssets)) {
    if (path.toLowerCase().endsWith('/' + fileName)) {
      return url;
    }
  }
  return null;
}

const artworkDataUrlCache = new Map<string, string>();

export function getMemoryArtworkDataUrl(memory: MemoryItem): string {
  const uploaded = resolveUploadedAssetUrl(memory.photoSrc);
  if (uploaded) return uploaded;

  const cacheKey = `${memory.id}:${memory.title}:${memory.motif}:${memory.palette.join(',')}`;
  const cached = artworkDataUrlCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  drawMemoryScene(canvas, memory);

  const url = canvas.toDataURL('image/png');
  artworkDataUrlCache.set(cacheKey, url);
  return url;
}

/**
 * Creates a Three.js texture immediately with the painterly fallback artwork and upgrades
 * seamlessly to the real photograph if `memory.photoSrc` resolves to an uploaded or bundled image.
 */
export function createMemoryCanvasTexture(memory: MemoryItem): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  drawMemoryScene(canvas, memory);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const resolvedUrl = resolveUploadedAssetUrl(memory.photoSrc);
  if (resolvedUrl && typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Cover-crop onto 512x384 canvas preserving aspect ratio cleanly
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (canvas.width - drawW) * 0.5;
      const dy = (canvas.height - drawH) * 0.5;
      ctx.drawImage(img, dx, dy, drawW, drawH);

      // Subtle museum border + bottom vignette
      ctx.strokeStyle = 'rgba(200, 165, 90, 0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      texture.needsUpdate = true;
    };
    img.src = resolvedUrl;
  }

  return texture;
}

function drawMemoryScene(canvas: HTMLCanvasElement, memory: MemoryItem): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const [c1, c2, c3] = memory.palette;

  // Painterly sky/backdrop gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, c1);
  bg.addColorStop(0.55, c2);
  bg.addColorStop(1, c3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Soft sun / moon glow
  const glowX = memory.motif === 'beach' ? w * 0.65 : w * 0.5;
  const glowY = memory.motif === 'stars' ? h * 0.28 : h * 0.42;
  const sunGlow = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, w * 0.45);
  sunGlow.addColorStop(0, 'rgba(255, 244, 210, 0.85)');
  sunGlow.addColorStop(0.35, 'rgba(255, 215, 165, 0.35)');
  sunGlow.addColorStop(1, 'rgba(255, 200, 150, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h);

  // Motif accents
  if (memory.motif === 'stars' || memory.motif === 'lanterns') {
    ctx.fillStyle = 'rgba(255, 240, 195, 0.85)';
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 97 + 41) % (w - 40)) + 20;
      const sy = ((i * 61 + 29) % (h * 0.52)) + 16;
      const sr = memory.motif === 'lanterns' ? 3 + (i % 4) : 1.5 + (i % 3);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rolling horizon / water reflection
  ctx.fillStyle = 'rgba(24, 16, 30, 0.42)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.68);
  ctx.quadraticCurveTo(w * 0.28, h * 0.61, w * 0.55, h * 0.69);
  ctx.quadraticCurveTo(w * 0.8, h * 0.75, w, h * 0.66);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Ground foreground
  ctx.fillStyle = 'rgba(18, 11, 24, 0.72)';
  ctx.fillRect(0, h * 0.76, w, h * 0.24);

  // Romantic couple silhouette holding hands in the distance
  const cx = w * 0.5;
  const cy = h * 0.76;
  ctx.fillStyle = 'rgba(22, 13, 28, 0.92)';

  // Left figure
  ctx.beginPath();
  ctx.arc(cx - 18, cy - 56, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 28, cy - 45, 20, 46);

  // Right figure
  ctx.beginPath();
  ctx.arc(cx + 18, cy - 52, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 9, cy - 42);
  ctx.lineTo(cx + 27, cy - 42);
  ctx.lineTo(cx + 31, cy);
  ctx.lineTo(cx + 5, cy);
  ctx.closePath();
  ctx.fill();

  // Joined hands
  ctx.strokeStyle = 'rgba(22, 13, 28, 0.92)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 30);
  ctx.lineTo(cx + 9, cy - 28);
  ctx.stroke();

  // Delicate floating blossoms / warm bokeh
  ctx.fillStyle = 'rgba(255, 224, 232, 0.45)';
  for (let i = 0; i < 12; i++) {
    const bx = ((i * 73 + 53) % (w - 30)) + 15;
    const by = ((i * 47 + 80) % (h - 40)) + 20;
    ctx.beginPath();
    ctx.arc(bx, by, 4 + (i % 3) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle gold inner vignette border
  ctx.strokeStyle = 'rgba(200, 165, 90, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  // Caption watermark at bottom
  ctx.fillStyle = 'rgba(250, 240, 220, 0.92)';
  ctx.font = 'italic 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(memory.title, w * 0.5, h - 34);
}
