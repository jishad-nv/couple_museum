import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { INTERACTION_DISTANCE, COLORS } from '../../utils/constants';
import { createMemoryCanvasTexture, type MemoryItem } from '../../utils/memoryArt';

interface PhotoFrameProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  memory: MemoryItem;
  size?: [number, number];
  hanging?: boolean;
  ropeLength?: number;
}

export default function PhotoFrame({
  position,
  rotation = [0, 0, 0],
  memory,
  size = [1.85, 1.35],
  hanging = false,
  ropeLength = 0.95,
}: PhotoFrameProps) {
  const groupRef = useRef<THREE.Group>(null);
  const swingRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const isNearRef = useRef(false);
  const [isNear, setIsNear] = useState(false);

  const openMemory = useGameStore((s) => s.openMemory);
  const openAlbumFromMemory = useGameStore((s) => s.openAlbumFromMemory);

  const texture = useMemo(() => createMemoryCanvasTexture(memory), [memory]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (hanging && swingRef.current) {
      // Ultra-gentle pendulum breeze from overhead branch pivot — smooth, zero jitter
      const t = state.clock.elapsedTime;
      swingRef.current.rotation.z = Math.sin(t * 0.75 + position[0] * 1.3) * 0.018;
      swingRef.current.rotation.x = Math.cos(t * 0.6 + position[2] * 1.1) * 0.012;
    }

    groupRef.current.getWorldPosition(worldPosRef.current);
    const s = useGameStore.getState();
    const dist = worldPosRef.current.distanceTo(s.playerPosition);
    const near = dist < INTERACTION_DISTANCE;

    if (near !== isNearRef.current) {
      isNearRef.current = near;
      setIsNear(near);
      if (near) {
        s.setNearbyMemory(memory);
      } else if (s.nearbyMemory?.id === memory.id) {
        s.setNearbyMemory(null);
      }
    }
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.code !== 'KeyE') return;
      const s = useGameStore.getState();
      if (
        s.showPhotoViewer ||
        s.showGuestbookModal ||
        s.showVideoPlayer ||
        s.showLoveAlbum ||
        s.showSecretLetterModal ||
        s.showAdminLogin ||
        s.showAdminPanel
      ) {
        return;
      }
      if (s.nearbyMemory?.id === memory.id) {
        if (s.currentRoom === 'garden') {
          s.openAlbumFromMemory(memory);
        } else {
          s.openMemory(memory);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (useGameStore.getState().nearbyMemory?.id === memory.id) {
        useGameStore.getState().setNearbyMemory(null);
      }
    };
  }, [memory]);

  const handleClick = useCallback(() => {
    if (useGameStore.getState().currentRoom === 'garden') {
      openAlbumFromMemory(memory);
    } else {
      openMemory(memory);
    }
  }, [memory, openMemory, openAlbumFromMemory]);

  const frameRim = hanging ? 0.065 : 0.18;
  const matBorder = hanging ? 0.025 : 0.06;

  const frameContent = (
    <>
      {/* Gold museum outer frame */}
      <mesh castShadow>
        <boxGeometry args={[size[0] + frameRim, size[1] + frameRim, hanging ? 0.04 : 0.07]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.28} roughness={0.3} />
      </mesh>

      {/* Cream museum mat */}
      <mesh position={[0, 0, hanging ? 0.014 : 0.025]}>
        <boxGeometry args={[size[0] + matBorder, size[1] + matBorder, 0.026]} />
        <meshStandardMaterial color="#faf6ee" roughness={0.6} />
      </mesh>

      {/* Memory artwork surface */}
      <mesh
        position={[0, 0, hanging ? 0.028 : 0.048]}
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
          map={texture}
          color="#ffffff"
          roughness={0.42}
          emissive={isNear ? '#4a3a22' : hanging ? '#221a12' : '#000000'}
          emissiveIntensity={isNear ? 0.25 : hanging ? 0.16 : 0}
        />
      </mesh>

      {/* Gallery overhead picture sconce */}
      {!hanging && (
        <group position={[0, size[1] / 2 + 0.24, 0.16]}>
          <mesh>
            <boxGeometry args={[0.42, 0.05, 0.12]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.03, 0.04]}>
            <boxGeometry args={[0.34, 0.02, 0.04]} />
            <meshStandardMaterial color="#fff3cc" emissive="#ffe5a0" emissiveIntensity={1.6} />
          </mesh>
        </group>
      )}

      {/* Double-sided keepsake photo & mat + delicate miniature LED accent dots along hanging frame top */}
      {hanging && (
        <>
          <mesh position={[0, 0, -0.014]} rotation={[0, Math.PI, 0]}>
            <boxGeometry args={[size[0] + matBorder, size[1] + matBorder, 0.026]} />
            <meshStandardMaterial color="#faf6ee" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, -0.028]} rotation={[0, Math.PI, 0]} onClick={handleClick}>
            <planeGeometry args={size} />
            <meshStandardMaterial
              map={texture}
              color="#ffffff"
              roughness={0.42}
              emissive={isNear ? '#4a3a22' : '#221a12'}
              emissiveIntensity={isNear ? 0.25 : 0.16}
            />
          </mesh>
          {[-0.28, 0, 0.28].map((lx, idx) => (
            <mesh key={`led-${idx}`} position={[lx * size[0], size[1] / 2 + 0.042, 0.024]}>
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color="#fff5cc" emissive="#ffcf6e" emissiveIntensity={2.4} />
            </mesh>
          ))}
        </>
      )}

      {/* Compact Brass Plaque tucked beneath frame */}
      <mesh position={[0, -(size[1] / 2 + (hanging ? 0.072 : 0.24)), 0.022]}>
        <boxGeometry args={[hanging ? size[0] * 0.82 : Math.min(1.5, size[0] * 0.96), hanging ? 0.075 : 0.2, 0.016]} />
        <meshStandardMaterial color="#241822" roughness={0.5} />
      </mesh>
      <Text
        position={[0, -(size[1] / 2 + (hanging ? 0.072 : 0.24)), 0.034]}
        fontSize={hanging ? 0.032 : 0.085}
        color={COLORS.goldLight}
        anchorX="center"
        anchorY="middle"
        maxWidth={size[0] * 0.78}
        material-side={THREE.FrontSide}
        font={undefined}
      >
        {memory.title}
      </Text>
    </>
  );

  // Pivot around the top branch attachment point so rope + frame sway naturally together
  const pivotHeight = size[1] / 2 + ropeLength;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {hanging ? (
        <group position={[0, pivotHeight, 0]}>
          <group ref={swingRef} position={[0, -pivotHeight, 0]}>
            {/* Two braided suspension ropes attached cleanly up to the overhead tree branch */}
            <mesh position={[-size[0] * 0.34, size[1] / 2 + ropeLength / 2, 0]}>
              <cylinderGeometry args={[0.01, 0.01, ropeLength, 6]} />
              <meshStandardMaterial color="#8c6d46" roughness={0.92} />
            </mesh>
            <mesh position={[size[0] * 0.34, size[1] / 2 + ropeLength / 2, 0]}>
              <cylinderGeometry args={[0.01, 0.01, ropeLength, 6]} />
              <meshStandardMaterial color="#8c6d46" roughness={0.92} />
            </mesh>
            {/* Brass hanging rings */}
            {[-size[0] * 0.34, size[0] * 0.34].map((rx, idx) => (
              <mesh key={`ring-${idx}`} position={[rx, size[1] / 2 + 0.05, 0.01]}>
                <torusGeometry args={[0.022, 0.006, 6, 12]} />
                <meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.35} />
              </mesh>
            ))}
            {frameContent}
          </group>
        </group>
      ) : (
        frameContent
      )}
    </group>
  );
}
