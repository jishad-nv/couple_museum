import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import Wall from '../objects/Wall';
import Floor from '../objects/Floor';
import { CeilingLight, Pillar } from '../objects/Decorations';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS, ENTRANCE_SIZE } from '../../utils/constants';

export default function EntranceHall() {
  const particlesRef = useRef<THREE.Points>(null);
  const { width, depth } = ENTRANCE_SIZE;
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallY = WALL_HEIGHT / 2;

  // Floating particles
  const particleCount = 50;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * width;
    particlePositions[i * 3 + 1] = Math.random() * WALL_HEIGHT;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * depth;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.002;
        if (positions[i * 3 + 1] > WALL_HEIGHT) positions[i * 3 + 1] = 0;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Floor */}
      <Floor position={[0, 0, 0]} size={[width, depth]} />

      {/* Ceiling */}
      <mesh position={[0, WALL_HEIGHT, 0]} receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.5} />
      </mesh>

      {/* Back wall */}
      <Wall
        position={[0, wallY, -halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color={COLORS.wallWarm}
      />

      {/* Left wall */}
      <Wall
        position={[-halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color={COLORS.wallWhite}
      />

      {/* Right wall */}
      <Wall
        position={[halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color={COLORS.wallWhite}
      />

      {/* Front wall with door to gallery */}
      <Wall
        position={[0, wallY, halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color={COLORS.wallWhite}
        hasDoor
        doorPosition={0}
        doorWidth={3}
        doorHeight={3.8}
      />

      {/* Pillars */}
      <Pillar position={[-halfW + 1.5, 0, -halfD + 1.5]} />
      <Pillar position={[halfW - 1.5, 0, -halfD + 1.5]} />
      <Pillar position={[-halfW + 1.5, 0, halfD - 1.5]} />
      <Pillar position={[halfW - 1.5, 0, halfD - 1.5]} />

      {/* Ceiling lights */}
      <CeilingLight position={[-3, WALL_HEIGHT, -2]} />
      <CeilingLight position={[3, WALL_HEIGHT, -2]} />
      <CeilingLight position={[0, WALL_HEIGHT, 2]} />

      {/* Welcome text */}
      <Float speed={2} floatIntensity={0.3} rotationIntensity={0}>
        <Text
          position={[0, 3.2, -halfD + 0.5]}
          fontSize={0.6}
          color={COLORS.gold}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          OUR LOVE MUSEUM
        </Text>
      </Float>

      <Text
        position={[0, 2.3, -halfD + 0.5]}
        fontSize={0.18}
        color="#8a7a6a"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
        textAlign="center"
        font={undefined}
      >
        A journey through our most beautiful memories
      </Text>

      {/* Decorative arch hint */}
      <Text
        position={[0, 3.6, halfD - 0.3]}
        fontSize={0.12}
        color={COLORS.gold}
        anchorX="center"
        font={undefined}
      >
        → Photo Gallery →
      </Text>

      {/* Floating heart particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color={COLORS.rosePink}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Floor center medallion */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.5}
          roughness={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.6}
          roughness={0.2}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
