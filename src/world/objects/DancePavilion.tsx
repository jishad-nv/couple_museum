import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';
import { useGameStore } from '../../store/gameStore';

interface DancePavilionProps {
  position: [number, number, number];
}

export default function DancePavilion({ position }: DancePavilionProps) {
  const isDancing = useGameStore((s) => s.isDancing);
  const textsMap = useGameStore((s) => s.textsMap);
  const startDanceMode = useGameStore((s) => s.startDanceMode);
  const stopDanceMode = useGameStore((s) => s.stopDanceMode);

  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const isNearRef = useRef(false);

  const title = textsMap.dance_spot_title || 'MOONLIT WALTZ';

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
      if (s.nearbyInteractable === 'dance-spot') {
        if (s.isDancing) s.stopDanceMode();
        else s.startDanceMode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (useGameStore.getState().nearbyInteractable === 'dance-spot') {
        useGameStore.getState().setNearbyInteractable(null);
      }
    };
  }, []);

  useFrame((state) => {
    const s = useGameStore.getState();
    const dist = Math.hypot(s.playerPosition.x - position[0], s.playerPosition.z - position[2]);
    const near = dist < 3.4;

    if (near !== isNearRef.current) {
      isNearRef.current = near;
      if (near) {
        s.setNearbyInteractable('dance-spot');
      } else if (s.nearbyInteractable === 'dance-spot') {
        s.setNearbyInteractable(null);
      }
    }

    if (ringMatRef.current) {
      const baseEmissive = s.isDancing ? 0.68 : near ? 0.42 : 0.2;
      ringMatRef.current.emissiveIntensity =
        baseEmissive + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    }
  });

  return (
    <group
      position={position}
      onClick={() => (isDancing ? stopDanceMode() : startDanceMode())}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* Subtle Rose-Marble Waltz Medallion */}
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.65, 36]} />
        <meshStandardMaterial
          color="#efe1e6"
          roughness={0.34}
          metalness={0.08}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Glowing Gold Inlay Dance Ring */}
      <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.48, 1.66, 40]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color={COLORS.gold}
          emissive="#e8b86a"
          emissiveIntensity={0.22}
          metalness={0.35}
          roughness={0.28}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>

      {/* Inner Delicate Rose Ring */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.99, 32]} />
        <meshStandardMaterial
          color={COLORS.rosePink}
          emissive="#c85c7c"
          emissiveIntensity={0.25}
          roughness={0.4}
          polygonOffset
          polygonOffsetFactor={-3}
        />
      </mesh>

      {/* Subtle Floor Inscription */}
      <Text
        position={[0, 0.018, 1.24]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.14}
        color="#6a4626"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
        font={undefined}
      >
        {title.toUpperCase()}
      </Text>

      {isDancing && (
        <pointLight position={[0, 2.8, 0]} intensity={4.0} color="#ffd8b4" distance={6.5} />
      )}
    </group>
  );
}
