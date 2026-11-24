import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { INTERACTION_DISTANCE, COLORS, VIDEO_CONFIG } from '../../utils/constants';

interface CinemaScreenProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
}

const FILM_CHAPTERS = [
  { title: 'Our First Holidays Together', subtitle: 'Chapter I · Golden Coast Dusk', c1: '#231942', c2: '#be6e7c', c3: '#f4c095' },
  { title: 'Mountain Train Mornings', subtitle: 'Chapter II · Misty Valleys', c1: '#1d2d44', c2: '#7a5c58', c3: '#e8c49a' },
  { title: 'Lanterns Over the Harbor', subtitle: 'Chapter III · Wishes & Starlight', c1: '#0f162b', c2: '#3f3d6e', c3: '#f2be6b' },
  { title: 'Forever Ahead of Us', subtitle: 'Chapter IV · Every Journey Hand in Hand', c1: '#2a1829', c2: '#8a3959', c3: '#f3d08a' },
];

export function isRealVideoUrl(videoSrc: string): boolean {
  return (
    videoSrc.startsWith('/api/media/') ||
    videoSrc.startsWith('/api/admin/media-preview/') ||
    videoSrc.startsWith('https://') ||
    videoSrc.startsWith('http://') ||
    videoSrc.startsWith('blob:')
  );
}

export default function CinemaScreen({
  position,
  rotation = [0, 0, 0],
  size = [10, 5.2],
}: CinemaScreenProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const isNearRef = useRef(false);

  const videos = useGameStore((s) => s.videos);
  const textsMap = useGameStore((s) => s.textsMap);
  const cinemaPlaying = useGameStore((s) => s.cinemaPlaying);
  const setShowVideoPlayer = useGameStore((s) => s.setShowVideoPlayer);

  const activeVideo = useMemo(
    () => videos.find((v) => v.isTheatreActive) ?? videos[0] ?? null,
    [videos]
  );
  const activeSrc = activeVideo?.videoSrc ?? '';
  const useLiveVideoFile = isRealVideoUrl(activeSrc);
  const screenHeading =
    textsMap.theatre_film_heading || activeVideo?.title || VIDEO_CONFIG.title;

  // Live canvas texture fallback when using built-in curated chapter reel
  const { canvas, canvasTexture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, canvasTexture: t };
  }, []);

  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      canvasTexture.dispose();
    };
  }, [canvasTexture]);

  // Manage real uploaded/hosted HTMLVideoElement + VideoTexture when selected in Theatre
  useEffect(() => {
    if (!useLiveVideoFile || !activeSrc) {
      setVideoTexture(null);
      videoElRef.current = null;
      return;
    }

    const videoEl = document.createElement('video');
    videoEl.src = activeSrc;
    videoEl.crossOrigin = 'anonymous';
    videoEl.loop = true;
    videoEl.muted = true; // Scene background monitor stays muted to respect BackgroundAudioManager
    videoEl.playsInline = true;
    videoEl.preload = 'metadata';

    const vTex = new THREE.VideoTexture(videoEl);
    vTex.colorSpace = THREE.SRGBColorSpace;
    videoElRef.current = videoEl;
    setVideoTexture(vTex);

    if (useGameStore.getState().cinemaPlaying) {
      videoEl.play().catch(() => {});
    }

    return () => {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      vTex.dispose();
      if (videoElRef.current === videoEl) {
        videoElRef.current = null;
      }
    };
  }, [useLiveVideoFile, activeSrc]);

  useEffect(() => {
    const vid = videoElRef.current;
    if (!vid) return;
    if (cinemaPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [cinemaPlaying]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();

    // Advance shared cinema playback clock when playing synthetic reel
    if (!useLiveVideoFile) {
      if (s.cinemaPlaying) {
        const nextTime = (s.cinemaTime + delta) % s.cinemaDuration;
        s.setCinemaTime(nextTime);
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const t = s.cinemaTime;
        const chapterIdx =
          Math.floor((t / s.cinemaDuration) * FILM_CHAPTERS.length) % FILM_CHAPTERS.length;
        const chapter = FILM_CHAPTERS[chapterIdx];
        const titleToDraw =
          chapterIdx === 0 && activeVideo?.title ? activeVideo.title : chapter.title;
        const subtitleToDraw =
          chapterIdx === 0 && activeVideo?.subtitle ? activeVideo.subtitle : chapter.subtitle;

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, chapter.c1);
        grad.addColorStop(0.55, chapter.c2);
        grad.addColorStop(1, chapter.c3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 14; i++) {
          const bx = ((i * 79 + t * (12 + (i % 4) * 5)) % (canvas.width + 40)) - 20;
          const by = 60 + ((i * 43) % 210) + Math.sin(t + i) * 8;
          ctx.fillStyle = 'rgba(255, 240, 200, 0.25)';
          ctx.beginPath();
          ctx.arc(bx, by, 6 + (i % 4) * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(18, 10, 24, 0.55)';
        ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);

        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.72;
        ctx.fillStyle = 'rgba(15, 9, 20, 0.92)';
        ctx.beginPath();
        ctx.arc(cx - 16, cy - 52, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 25, cy - 42, 18, 42);
        ctx.beginPath();
        ctx.arc(cx + 16, cy - 48, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx + 8, cy - 38, 16, 38);

        ctx.fillStyle = 'rgba(250, 242, 226, 0.95)';
        ctx.font = 'italic 26px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(titleToDraw, cx, 118);

        ctx.fillStyle = 'rgba(232, 205, 145, 0.9)';
        ctx.font = '15px Georgia, serif';
        ctx.fillText(subtitleToDraw, cx, 148);

        if (!s.cinemaPlaying) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.arc(cx, canvas.height * 0.52, 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f5e6c4';
          ctx.beginPath();
          ctx.moveTo(cx - 8, canvas.height * 0.52 - 12);
          ctx.lineTo(cx + 14, canvas.height * 0.52);
          ctx.lineTo(cx - 8, canvas.height * 0.52 + 12);
          ctx.closePath();
          ctx.fill();
        }

        canvasTexture.needsUpdate = true;
      }
    }

    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPosRef.current);
    const dist = worldPosRef.current.distanceTo(s.playerPosition);
    const near = dist < INTERACTION_DISTANCE + 4.5;

    if (near !== isNearRef.current) {
      isNearRef.current = near;
      if (near) {
        s.setNearbyInteractable('cinema-screen');
      } else if (s.nearbyInteractable === 'cinema-screen') {
        s.setNearbyInteractable(null);
      }
    }
  });

  const handleClick = useCallback(() => {
    setShowVideoPlayer(true);
  }, [setShowVideoPlayer]);

  const activeMap = videoTexture ?? canvasTexture;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Dark velvet curtain wings flanking the screen */}
      <mesh position={[-(size[0] / 2 + 0.7), 0, 0.12]} castShadow>
        <boxGeometry args={[1.1, size[1] + 0.5, 0.25]} />
        <meshStandardMaterial color={COLORS.velvetRed} roughness={0.85} />
      </mesh>
      <mesh position={[size[0] / 2 + 0.7, 0, 0.12]} castShadow>
        <boxGeometry args={[1.1, size[1] + 0.5, 0.25]} />
        <meshStandardMaterial color={COLORS.velvetRed} roughness={0.85} />
      </mesh>
      {/* Top valence */}
      <mesh position={[0, size[1] / 2 + 0.28, 0.16]} castShadow>
        <boxGeometry args={[size[0] + 2.5, 0.5, 0.3]} />
        <meshStandardMaterial color={COLORS.velvetRed} roughness={0.85} />
      </mesh>

      {/* Gold screen frame */}
      <mesh>
        <boxGeometry args={[size[0] + 0.36, size[1] + 0.36, 0.14]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
      </mesh>

      {/* Live screen surface */}
      <mesh
        position={[0, 0, 0.085]}
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={size} />
        <meshStandardMaterial
          map={activeMap}
          color="#ffffff"
          emissive="#ffffff"
          emissiveMap={activeMap}
          emissiveIntensity={0.65}
          roughness={0.25}
        />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.75, 0.1]}
        fontSize={0.22}
        color={COLORS.goldLight}
        anchorX="center"
        font={undefined}
      >
        {screenHeading}
      </Text>
    </group>
  );
}
