import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import Floor from '../objects/Floor';
import Bench, { Tree, Flower } from '../objects/Decorations';
import { COLORS, WALL_HEIGHT, GARDEN_SIZE } from '../../utils/constants';

export default function MemoryGarden() {
  const { width, depth } = GARDEN_SIZE;
  const halfW = width / 2;
  const halfD = depth / 2;
  const offsetZ = 40; // After cinema

  return (
    <group position={[0, 0, offsetZ]}>
      {/* Grass floor */}
      <Floor position={[0, 0, 0]} size={[width, depth]} isGarden />

      {/* Garden boundary walls (low hedges) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-halfW, 0.5, 0]} castShadow>
          <boxGeometry args={[0.6, 1, depth]} />
          <meshStandardMaterial color="#2a6a1a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[halfW, 0.5, 0]} castShadow>
          <boxGeometry args={[0.6, 1, depth]} />
          <meshStandardMaterial color="#2a6a1a" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.5, halfD]} castShadow>
          <boxGeometry args={[width, 1, 0.6]} />
          <meshStandardMaterial color="#2a6a1a" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Back wall with entrance door */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-halfW / 2 - 1.5, WALL_HEIGHT / 2, -halfD]}>
          <boxGeometry args={[halfW - 1.5, WALL_HEIGHT, 0.3]} />
          <meshStandardMaterial color={COLORS.wallWarm} roughness={0.4} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[halfW / 2 + 1.5, WALL_HEIGHT / 2, -halfD]}>
          <boxGeometry args={[halfW - 1.5, WALL_HEIGHT, 0.3]} />
          <meshStandardMaterial color={COLORS.wallWarm} roughness={0.4} />
        </mesh>
      </RigidBody>

      {/* Sky dome (hemisphere) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[40, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={COLORS.gardenSky}
          side={THREE.BackSide}
          roughness={1}
        />
      </mesh>

      {/* Sun */}
      <mesh position={[15, 25, -10]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshStandardMaterial
          color="#fff5a0"
          emissive="#fff5a0"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Trees */}
      <Tree position={[-8, 0, -5]} scale={1.2} />
      <Tree position={[8, 0, -3]} scale={1} />
      <Tree position={[-10, 0, 5]} scale={0.9} />
      <Tree position={[10, 0, 7]} scale={1.1} />
      <Tree position={[0, 0, 8]} scale={1.3} />
      <Tree position={[-5, 0, 10]} scale={0.8} />
      <Tree position={[6, 0, -8]} scale={1} />

      {/* Flower beds */}
      {Array.from({ length: 30 }).map((_, i) => (
        <Flower
          key={i}
          position={[
            (Math.random() - 0.5) * (width - 4),
            0,
            (Math.random() - 0.5) * (depth - 4),
          ]}
          color={
            ['#ff69b4', '#ff1493', '#ff6347', '#ffa500', '#ffff00', '#ff4500'][
              Math.floor(Math.random() * 6)
            ]
          }
        />
      ))}

      {/* Benches */}
      <Bench position={[-4, 0, 0]} rotation={[0, Math.PI / 4, 0]} />
      <Bench position={[4, 0, 2]} rotation={[0, -Math.PI / 4, 0]} />
      <Bench position={[0, 0, -4]} rotation={[0, 0, 0]} />

      {/* Garden path (stone tiles) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 0.3) * 1.5,
            0.01,
            -halfD + 2 + i * 2,
          ]}
          rotation={[-Math.PI / 2, 0, Math.random() * 0.3]}
          receiveShadow
        >
          <circleGeometry args={[0.4 + Math.random() * 0.2, 8]} />
          <meshStandardMaterial color="#c0b0a0" roughness={0.7} />
        </mesh>
      ))}

      {/* Romantic garden light posts */}
      {[[-6, 0, 0], [6, 0, 0], [0, 0, 6], [-6, 0, 8], [6, 0, 8]].map(
        ([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.06, 2.4, 6]} />
              <meshStandardMaterial
                color="#3a3a3a"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial
                color="#fff5a0"
                emissive="#ffe4b5"
                emissiveIntensity={1.5}
              />
            </mesh>
            <pointLight
              position={[0, 2.5, 0]}
              intensity={3}
              color="#ffe4b5"
              distance={6}
            />
          </group>
        )
      )}

      {/* Floating title */}
      <Float speed={1.5} floatIntensity={0.3}>
        <Text
          position={[0, 4, -halfD + 2]}
          fontSize={0.5}
          color={COLORS.gold}
          anchorX="center"
          font={undefined}
        >
          🌸 Memory Garden 🌸
        </Text>
      </Float>

      {/* Butterfly particles */}
      <ButterflyParticles />
    </group>
  );
}

function ButterflyParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 15;

  const positions = new Float32Array(count * 3);
  const velocities = useRef<Float32Array>(new Float32Array(count * 3));

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = 1 + Math.random() * 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    velocities.current[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
    velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities.current[i * 3] + Math.sin(state.clock.elapsedTime + i) * 0.005;
      pos[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 2 + i) * 0.005;
      pos[i * 3 + 2] += velocities.current[i * 3 + 2] + Math.cos(state.clock.elapsedTime + i) * 0.005;

      // Boundary wrap
      if (Math.abs(pos[i * 3]) > 12) velocities.current[i * 3] *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 10) velocities.current[i * 3 + 2] *= -1;
      if (pos[i * 3 + 1] < 0.5 || pos[i * 3 + 1] > 5) velocities.current[i * 3 + 1] *= -1;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#ff69b4"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}
