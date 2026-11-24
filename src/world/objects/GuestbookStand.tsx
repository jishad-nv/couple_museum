import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { COLORS, INTERACTION_DISTANCE } from '../../utils/constants';

interface GuestbookStandProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function GuestbookStand({
  position = [3.6, 0, -2.2],
  rotation = [0, -0.45, 0],
}: GuestbookStandProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const isNearRef = useRef(false);

  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);
  const setShowGuestbookModal = useGameStore((s) => s.setShowGuestbookModal);
  const textsMap = useGameStore((s) => s.textsMap);
  const heading = textsMap.guestbook_heading || '✦ Guestbook ✦';

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPosRef.current);
    const playerPos = useGameStore.getState().playerPosition;
    const dist = worldPosRef.current.distanceTo(playerPos);
    const near = dist < INTERACTION_DISTANCE;

    if (near !== isNearRef.current) {
      isNearRef.current = near;
      if (near) {
        setNearbyInteractable('guestbook');
      } else if (useGameStore.getState().nearbyInteractable === 'guestbook') {
        setNearbyInteractable(null);
      }
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code !== 'KeyE') return;
      const state = useGameStore.getState();
      if (
        state.showGuestbookModal ||
        state.showPhotoViewer ||
        state.showVideoPlayer ||
        state.showLoveAlbum ||
        state.showAdminLogin ||
        state.showAdminPanel
      ) {
        return;
      }
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        return;
      }
      if (isNearRef.current || state.nearbyInteractable === 'guestbook') {
        setShowGuestbookModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (useGameStore.getState().nearbyInteractable === 'guestbook') {
        setNearbyInteractable(null);
      }
    };
  }, [setNearbyInteractable, setShowGuestbookModal]);

  const handleOpen = useCallback(() => {
    setShowGuestbookModal(true);
  }, [setShowGuestbookModal]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Marble plinth base */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.16, 0.7]} />
          <meshStandardMaterial color={COLORS.floorMarble} roughness={0.5} />
        </mesh>

        {/* Brass base trim */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.76, 0.04, 0.56]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
        </mesh>

        {/* Walnut pedestal column */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[0.38, 0.84, 0.34]} />
          <meshStandardMaterial color="#6e4d26" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Angled lectern top + open guestbook */}
      <group
        position={[0, 1.06, 0]}
        rotation={[0.35, 0, 0]}
        onClick={handleOpen}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        {/* Lectern wood plate */}
        <mesh castShadow>
          <boxGeometry args={[0.88, 0.06, 0.62]} />
          <meshStandardMaterial color="#5d3f1d" roughness={0.65} />
        </mesh>

        {/* Brass lip */}
        <mesh position={[0, 0.04, 0.28]} castShadow>
          <boxGeometry args={[0.88, 0.04, 0.04]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
        </mesh>

        {/* Velvet book cover */}
        <mesh position={[-0.04, 0.05, 0]} castShadow>
          <boxGeometry args={[0.62, 0.03, 0.44]} />
          <meshStandardMaterial color={COLORS.velvetRed} roughness={0.75} />
        </mesh>

        {/* Left & right open parchment pages */}
        <mesh position={[-0.18, 0.072, 0]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[0.27, 0.02, 0.39]} />
          <meshStandardMaterial color="#faf6ee" roughness={0.85} />
        </mesh>
        <mesh position={[0.1, 0.072, 0]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[0.27, 0.02, 0.39]} />
          <meshStandardMaterial color="#faf6ee" roughness={0.85} />
        </mesh>

        {/* Gold bookmark ribbon */}
        <mesh position={[-0.04, 0.085, 0.06]}>
          <boxGeometry args={[0.02, 0.008, 0.36]} />
          <meshStandardMaterial color={COLORS.gold} roughness={0.4} />
        </mesh>

        {/* Brass inkwell + quill */}
        <mesh position={[0.34, 0.065, -0.15]} castShadow>
          <cylinderGeometry args={[0.04, 0.045, 0.06, 12]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.3} />
        </mesh>
        <mesh position={[0.35, 0.16, -0.15]} rotation={[0.15, 0, -0.25]}>
          <cylinderGeometry args={[0.008, 0.015, 0.24, 8]} />
          <meshStandardMaterial color="#f5e6c8" roughness={0.6} />
        </mesh>
      </group>

      {/* Guestbook label */}
      <Text
        position={[0, 1.55, 0]}
        fontSize={0.14}
        color={COLORS.gold}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {heading}
      </Text>
    </group>
  );
}
