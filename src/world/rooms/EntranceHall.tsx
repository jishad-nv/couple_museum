import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import Wall from '../objects/Wall';
import Floor from '../objects/Floor';
import { CeilingLight, Pillar } from '../objects/Decorations';
import GuestbookStand from '../objects/GuestbookStand';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS, ENTRANCE_SIZE } from '../../utils/constants';
import { useGameStore } from '../../store/gameStore';

export default function EntranceHall() {
  const textsMap = useGameStore((s) => s.textsMap);
  const particlesRef = useRef<THREE.Points>(null);
  const { width, depth } = ENTRANCE_SIZE;
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallY = WALL_HEIGHT / 2;
  const archwayTitle = textsMap.entrance_archway_title || 'CIRCULAR ROTUNDA GALLERY';

  // Deterministic dust motes (no Math.random inside JSX render)
  const particleCount = 36;
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (((i * 37) % 100) / 100 - 0.5) * (width - 2);
      arr[i * 3 + 1] = (((i * 53) % 100) / 100) * (WALL_HEIGHT - 1) + 0.5;
      arr[i * 3 + 2] = (((i * 71) % 100) / 100 - 0.5) * (depth - 2);
    }
    return arr;
  }, [width, depth]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.0014;
      if (positions[i * 3 + 1] > WALL_HEIGHT - 0.4) positions[i * 3 + 1] = 0.4;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // EntranceHall spans z from -4.5 (gallery archway) to +4.0 (main door facade owned by MuseumExterior)
  // Center Z is -0.25
  return (
    <group position={[0, 0, -0.25]}>
      {/* Solid Marble Floor */}
      <Floor position={[0, 0, 0]} size={[width, depth]} />

      {/* Solid Ceiling Slab */}
      <mesh position={[0, WALL_HEIGHT, 0]} receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.5} />
      </mesh>

      {/* Left (West) & Right (East) Walls — South z=4.0 facade belongs to MuseumExterior */}
      <Wall
        position={[-halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color={COLORS.wallWhite}
      />
      <Wall
        position={[halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color={COLORS.wallWhite}
      />

      {/* North Archway opening into the Circular Photo Gallery (at world z = -4.5) */}
      <Wall
        position={[0, wallY, -halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color={COLORS.wallWarm}
        hasDoor
        doorPosition={0}
        doorWidth={4.2}
        doorHeight={4.2}
      />

      {/* Framing Marble Pillars */}
      <Pillar position={[-halfW + 1.4, 0, -halfD + 1.4]} />
      <Pillar position={[halfW - 1.4, 0, -halfD + 1.4]} />
      <Pillar position={[-halfW + 1.4, 0, halfD - 1.4]} />
      <Pillar position={[halfW - 1.4, 0, halfD - 1.4]} />

      {/* Warm Chandeliers */}
      <CeilingLight position={[-3.2, WALL_HEIGHT, -1.2]} />
      <CeilingLight position={[3.2, WALL_HEIGHT, -1.2]} />
      <CeilingLight position={[0, WALL_HEIGHT, 1.5]} />

      {/* Welcome inscription above the Gallery Archway */}
      <Float speed={1.2} floatIntensity={0.04} rotationIntensity={0}>
        <mesh position={[0, 4.95, -halfD + 0.25]}>
          <boxGeometry args={[6.6, 0.56, 0.08]} />
          <meshStandardMaterial color="#261524" roughness={0.45} />
        </mesh>
        <Text
          position={[0, 4.95, -halfD + 0.32]}
          fontSize={0.34}
          color={COLORS.goldLight}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {archwayTitle.toUpperCase()}
        </Text>
      </Float>

      {/* Guestbook Lectern preserved on the right side of Entrance Hall */}
      <GuestbookStand position={[3.1, 0, -0.4]} rotation={[0, -0.5, 0]} />

      {/* Floating ambient particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color={COLORS.rosePink} transparent opacity={0.5} sizeAttenuation />
      </points>

      {/* Central Gold Marble Floor Medallion (polygonOffset prevents any Z-fighting) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.95, 36]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.35}
          roughness={0.35}
          transparent
          opacity={0.28}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.82, 1.98, 36]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.38}
          roughness={0.28}
          transparent
          opacity={0.55}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  );
}
