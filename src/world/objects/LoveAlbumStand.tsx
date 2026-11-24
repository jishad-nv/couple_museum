import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';
import { buildAlbumSpreads } from '../../utils/loveAlbum';
import { resolveUploadedAssetUrl } from '../../utils/memoryArt';
import type { MuseumPhotoItem } from '../../utils/museumContentTypes';
import { useGameStore } from '../../store/gameStore';
import { registerCameraCollider, unregisterCameraCollider } from '../../utils/museumLayout';

interface LoveAlbumStandProps {
  position: [number, number, number];
}

function drawAlbumPageCanvas(
  canvas: HTMLCanvasElement,
  photo: MuseumPhotoItem | null,
  pageNumber: number,
  side: 'left' | 'right',
  coverTitle: string,
  coverSubtitle: string,
  onAsyncImageReady: () => void
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Warm cream parchment background with inner spine shading
  const bg = ctx.createLinearGradient(0, 0, w, 0);
  if (side === 'left') {
    bg.addColorStop(0, '#f7f1e4');
    bg.addColorStop(0.86, '#fbf7ee');
    bg.addColorStop(1, '#dfd2bc');
  } else {
    bg.addColorStop(0, '#dfd2bc');
    bg.addColorStop(0.14, '#fbf7ee');
    bg.addColorStop(1, '#f7f1e4');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle gold inner border & corner flourishes
  ctx.strokeStyle = 'rgba(200, 165, 90, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  ctx.strokeStyle = 'rgba(232, 160, 176, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28, 28, w - 56, h - 56);

  if (!photo) {
    ctx.fillStyle = '#4a2c3d';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(coverTitle, w * 0.5, h * 0.42);
    ctx.fillStyle = '#8d6574';
    ctx.font = '15px Georgia, serif';
    ctx.fillText(coverSubtitle, w * 0.5, h * 0.5);
    ctx.fillStyle = '#a07e46';
    ctx.font = '14px Georgia, serif';
    ctx.fillText(`✦  Page ${pageNumber}  ✦`, w * 0.5, h - 46);
    return;
  }

  // Top rose-gold chapter header
  ctx.fillStyle = '#9e7840';
  ctx.font = '600 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${photo.section.toUpperCase()}  ·  ${photo.date}`, w * 0.5, 62);

  // Photo mount area
  const frameX = 56;
  const frameY = 82;
  const frameW = w - 112;
  const frameH = 268;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(35, 22, 32, 0.18)';
  ctx.shadowBlur = 12;
  ctx.fillRect(frameX - 8, frameY - 8, frameW + 16, frameH + 16);
  ctx.shadowBlur = 0;

  // Paint fallback palette artwork immediately
  const [c1, c2, c3] = photo.palette;
  const grad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.55, c2);
  grad.addColorStop(1, c3);
  ctx.fillStyle = grad;
  ctx.fillRect(frameX, frameY, frameW, frameH);

  // Horizon silhouette accents for fallback
  ctx.fillStyle = 'rgba(20, 12, 24, 0.52)';
  ctx.fillRect(frameX, frameY + frameH * 0.72, frameW, frameH * 0.28);

  // Title, caption & page number
  ctx.fillStyle = '#2d1c27';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(photo.title.slice(0, 34), w * 0.5, 396);

  // Word-wrapped short caption
  ctx.fillStyle = '#5c4352';
  ctx.font = 'italic 15px Georgia, serif';
  const words = photo.description.split(/\s+/);
  let line = '';
  let y = 430;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > w - 108 && line) {
      ctx.fillText(line, w * 0.5, y);
      line = words[i];
      y += 22;
      if (y > 498) break;
    } else {
      line = test;
    }
  }
  if (line && y <= 498) ctx.fillText(line, w * 0.5, y);

  ctx.fillStyle = '#9e7840';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`— ${pageNumber} —`, w * 0.5, h - 42);

  // Upgrade photo rectangle with actual uploaded/bundled photograph if present
  const resolved = resolveUploadedAssetUrl(photo.photoSrc);
  if (resolved && typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c2d = canvas.getContext('2d');
      if (!c2d) return;
      c2d.save();
      c2d.beginPath();
      c2d.rect(frameX, frameY, frameW, frameH);
      c2d.clip();
      const scale = Math.max(frameW / img.width, frameH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      c2d.drawImage(img, frameX + (frameW - dw) * 0.5, frameY + (frameH - dh) * 0.5, dw, dh);
      c2d.restore();

      c2d.strokeStyle = 'rgba(200, 165, 90, 0.55)';
      c2d.lineWidth = 2;
      c2d.strokeRect(frameX, frameY, frameW, frameH);
      onAsyncImageReady();
    };
    img.src = resolved;
  }
}

export default function LoveAlbumStand({ position }: LoveAlbumStandProps) {
  const photos = useGameStore((s) => s.photos);
  const albumSpreadIndex = useGameStore((s) => s.albumSpreadIndex);
  const textsMap = useGameStore((s) => s.textsMap);
  const setShowLoveAlbum = useGameStore((s) => s.setShowLoveAlbum);

  const groupRef = useRef<THREE.Group>(null);
  const pedestalColliderRef = useRef<THREE.Mesh>(null);
  const flippingLeafRef = useRef<THREE.Group>(null);
  const isNearRef = useRef(false);
  const worldPosRef = useRef(new THREE.Vector3());
  const lastSpreadRef = useRef(albumSpreadIndex);
  const flipTimerRef = useRef(0);

  useEffect(() => {
    const mesh = pedestalColliderRef.current;
    registerCameraCollider(mesh);
    return () => unregisterCameraCollider(mesh);
  }, []);

  const spreads = useMemo(() => buildAlbumSpreads(photos), [photos]);
  const safeSpreadIdx = Math.min(albumSpreadIndex, Math.max(0, spreads.length - 1));
  const currentSpread = spreads[safeSpreadIdx] ?? spreads[0];

  const coverTitle = textsMap.album_cover_title || 'Our Love Story';
  const coverSubtitle = textsMap.album_cover_subtitle || 'A Living Chronicle of Us';
  const plaqueCaption = textsMap.album_pedestal_caption || 'OUR LOVE ALBUM';

  // Left & Right dynamic canvas textures
  const { leftCanvas, leftTex, rightCanvas, rightTex } = useMemo(() => {
    const lc = document.createElement('canvas');
    lc.width = 512;
    lc.height = 580;
    const lt = new THREE.CanvasTexture(lc);
    lt.colorSpace = THREE.SRGBColorSpace;

    const rc = document.createElement('canvas');
    rc.width = 512;
    rc.height = 580;
    const rt = new THREE.CanvasTexture(rc);
    rt.colorSpace = THREE.SRGBColorSpace;

    return { leftCanvas: lc, leftTex: lt, rightCanvas: rc, rightTex: rt };
  }, []);

  useEffect(() => {
    return () => {
      leftTex.dispose();
      rightTex.dispose();
    };
  }, [leftTex, rightTex]);

  useEffect(() => {
    drawAlbumPageCanvas(
      leftCanvas,
      currentSpread?.leftPage ?? null,
      currentSpread?.leftPageNumber ?? 1,
      'left',
      coverTitle,
      coverSubtitle,
      () => {
        leftTex.needsUpdate = true;
      }
    );
    leftTex.needsUpdate = true;

    drawAlbumPageCanvas(
      rightCanvas,
      currentSpread?.rightPage ?? null,
      currentSpread?.rightPageNumber ?? 2,
      'right',
      coverTitle,
      coverSubtitle,
      () => {
        rightTex.needsUpdate = true;
      }
    );
    rightTex.needsUpdate = true;

    if (lastSpreadRef.current !== safeSpreadIdx) {
      lastSpreadRef.current = safeSpreadIdx;
      flipTimerRef.current = 1.0;
    }
  }, [currentSpread, coverTitle, coverSubtitle, leftCanvas, leftTex, rightCanvas, rightTex, safeSpreadIdx]);

  // E-key opens the interactive Love Album when near
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.code !== 'KeyE') return;
      const s = useGameStore.getState();
      if (
        s.showPhotoViewer ||
        s.showGuestbookModal ||
        s.showVideoPlayer ||
        s.showLoveAlbum ||
        s.showAdminLogin ||
        s.showAdminPanel
      ) {
        return;
      }
      if (s.nearbyInteractable === 'love-album') {
        s.setShowLoveAlbum(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (useGameStore.getState().nearbyInteractable === 'love-album') {
        useGameStore.getState().setNearbyInteractable(null);
      }
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!groupRef.current) return;

    // Subtle 3D page flip motion when user turns a page
    if (flippingLeafRef.current) {
      if (flipTimerRef.current > 0) {
        flipTimerRef.current = Math.max(0, flipTimerRef.current - delta * 2.1);
        const p = 1 - flipTimerRef.current;
        flippingLeafRef.current.visible = true;
        flippingLeafRef.current.rotation.z = Math.PI * p;
      } else {
        flippingLeafRef.current.visible = false;
      }
    }

    groupRef.current.getWorldPosition(worldPosRef.current);
    const s = useGameStore.getState();
    const dist = Math.hypot(
      s.playerPosition.x - worldPosRef.current.x,
      s.playerPosition.z - worldPosRef.current.z
    );
    const near = dist < 4.1;
    if (near !== isNearRef.current) {
      isNearRef.current = near;
      if (near) {
        s.setNearbyInteractable('love-album');
      } else if (s.nearbyInteractable === 'love-album') {
        s.setNearbyInteractable(null);
      }
    }
  });

  const handleOpenAlbum = useCallback(() => {
    setShowLoveAlbum(true);
  }, [setShowLoveAlbum]);

  return (
    <group ref={groupRef} position={position}>
      {/* Stepped Marble Pedestal Base */}
      <RigidBody type="fixed" colliders="hull">
        <mesh ref={pedestalColliderRef} position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.65, 1.95, 0.56, 28]} />
          <meshStandardMaterial color="#e6dccd" roughness={0.36} />
        </mesh>
      </RigidBody>

      {/* Upper Gold Trim Plinth & Column */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.32, 0.14, 28]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.32} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.96, 0.68, 24]} />
        <meshStandardMaterial color="#f1e8d9" roughness={0.34} />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <cylinderGeometry args={[0.98, 0.94, 0.12, 24]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.32} roughness={0.28} />
      </mesh>

      {/* Front Brass Dedication Plaque */}
      <mesh position={[0, 0.96, 0.93]}>
        <boxGeometry args={[1.18, 0.24, 0.04]} />
        <meshStandardMaterial color="#2a1624" roughness={0.45} />
      </mesh>
      <Text
        position={[0, 0.96, 0.96]}
        fontSize={0.11}
        color={COLORS.goldLight}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
        font={undefined}
      >
        {plaqueCaption.toUpperCase()}
      </Text>

      {/* Angled Open Hardcover Love Album resting on Velvet Lectern (tilted toward +Z entrance) */}
      <group
        position={[0, 1.58, 0.06]}
        rotation={[0.42, 0, 0]}
        onClick={handleOpenAlbum}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        {/* Walnut & Velvet Display Lectern Tray */}
        <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.16, 0.07, 1.36]} />
          <meshStandardMaterial color="#4e3022" roughness={0.58} />
        </mesh>
        <mesh position={[0, -0.04, 0.65]}>
          <boxGeometry args={[2.16, 0.05, 0.06]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.28} />
        </mesh>

        {/* Hardcover Rose-Plum Leather Spine */}
        <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 1.18, 12, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#59223a" roughness={0.62} />
        </mesh>

        {/* Left Hardcover Board + Gold Trim */}
        <mesh position={[-0.51, -0.032, 0]} rotation={[0, 0, -0.08]} castShadow>
          <boxGeometry args={[0.96, 0.036, 1.18]} />
          <meshStandardMaterial color="#672844" roughness={0.55} />
        </mesh>
        <mesh position={[-0.97, -0.012, 0.56]}>
          <boxGeometry args={[0.08, 0.045, 0.08]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.4} roughness={0.26} />
        </mesh>
        <mesh position={[-0.97, -0.012, -0.56]}>
          <boxGeometry args={[0.08, 0.045, 0.08]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.4} roughness={0.26} />
        </mesh>

        {/* Right Hardcover Board + Gold Trim */}
        <mesh position={[0.51, -0.032, 0]} rotation={[0, 0, 0.08]} castShadow>
          <boxGeometry args={[0.96, 0.036, 1.18]} />
          <meshStandardMaterial color="#672844" roughness={0.55} />
        </mesh>
        <mesh position={[0.97, -0.012, 0.56]}>
          <boxGeometry args={[0.08, 0.045, 0.08]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.4} roughness={0.26} />
        </mesh>
        <mesh position={[0.97, -0.012, -0.56]}>
          <boxGeometry args={[0.08, 0.045, 0.08]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.4} roughness={0.26} />
        </mesh>

        {/* Left & Right Thick Paper Blocks (cream pages with gold-gilded edges) */}
        <mesh position={[-0.47, 0.025, 0]} rotation={[0, 0, -0.06]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.095, 1.09]} />
          <meshStandardMaterial color="#ebe2ce" roughness={0.85} />
        </mesh>
        <mesh position={[0.47, 0.025, 0]} rotation={[0, 0, 0.06]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.095, 1.09]} />
          <meshStandardMaterial color="#ebe2ce" roughness={0.85} />
        </mesh>

        {/* Left Visible Page Surface with Live Photo Spread */}
        <mesh position={[-0.468, 0.078, 0]} rotation={[-Math.PI / 2, -0.06, 0]} receiveShadow>
          <planeGeometry args={[0.86, 1.06]} />
          <meshStandardMaterial map={leftTex} roughness={0.78} />
        </mesh>

        {/* Right Visible Page Surface with Live Photo Spread */}
        <mesh position={[0.468, 0.078, 0]} rotation={[-Math.PI / 2, 0.06, 0]} receiveShadow>
          <planeGeometry args={[0.86, 1.06]} />
          <meshStandardMaterial map={rightTex} roughness={0.78} />
        </mesh>

        {/* Spine Shadow Gutter & Gold Satin Bookmark Ribbon */}
        <mesh position={[0, 0.062, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.045, 1.12]} />
          <meshStandardMaterial color={COLORS.gold} roughness={0.4} metalness={0.22} />
        </mesh>
        <mesh position={[0.02, 0.03, 0.62]} rotation={[0.55, 0, 0]}>
          <boxGeometry args={[0.036, 0.008, 0.24]} />
          <meshStandardMaterial color={COLORS.rosePink} roughness={0.5} />
        </mesh>

        {/* Animated 3D Flipping Page Leaf */}
        <group ref={flippingLeafRef} position={[0, 0.085, 0]} visible={false}>
          <mesh position={[0.42, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.84, 1.04]} />
            <meshStandardMaterial color="#fbf7ee" side={THREE.DoubleSide} roughness={0.82} />
          </mesh>
        </group>
      </group>

      {/* Floating Header Above the Album */}
      <Text
        position={[0, 2.38, 0]}
        fontSize={0.18}
        color={COLORS.goldLight}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.07}
        font={undefined}
      >
        {coverTitle}
      </Text>

      {/* Warm Overhead Pool Lighting the Book Pages */}
      <pointLight position={[0, 3.1, 0.7]} intensity={4.8} color="#ffdfb0" distance={6.5} />
    </group>
  );
}
