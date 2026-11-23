import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';

interface BenchProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export default function Bench({ position, rotation = [0, 0, 0] }: BenchProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.5]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.7} />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, 0.75, -0.22]} castShadow>
        <boxGeometry args={[1.6, 0.5, 0.06]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.7} />
      </mesh>

      {/* Legs */}
      {[-0.65, 0.65].map((x) =>
        [-0.18, 0.18].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.22, z]} castShadow>
            <boxGeometry args={[0.06, 0.44, 0.06]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.6} />
          </mesh>
        ))
      )}

      {/* Armrests */}
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.6, -0.05]} castShadow>
          <boxGeometry args={[0.06, 0.06, 0.4]} />
          <meshStandardMaterial color={COLORS.woodBrown} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

export function Tree({ position, scale = 1 }: TreeProps) {
  const leavesRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 3, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>

      {/* Canopy layers */}
      <mesh ref={leavesRef} position={[0, 3.5, 0]} castShadow>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshStandardMaterial color="#3a7a2a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.2, 0]} castShadow>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#4a8a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 3, 0.5]} castShadow>
        <sphereGeometry args={[0.8, 10, 10]} />
        <meshStandardMaterial color="#2a6a1a" roughness={0.8} />
      </mesh>
    </group>
  );
}

interface FlowerProps {
  position: [number, number, number];
  color?: string;
}

export function Flower({ position, color = '#ff69b4' }: FlowerProps) {
  const flowerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (flowerRef.current) {
      flowerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
    }
  });

  return (
    <group ref={flowerRef} position={position}>
      {/* Stem */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.8} />
      </mesh>

      {/* Petals */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((angle * Math.PI) / 180) * 0.08,
            0.42,
            Math.cos((angle * Math.PI) / 180) * 0.08,
          ]}
          rotation={[0.3, (angle * Math.PI) / 180, 0]}
        >
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}

      {/* Center */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffdd00" roughness={0.4} />
      </mesh>
    </group>
  );
}

interface CeilingLightProps {
  position: [number, number, number];
}

export function CeilingLight({ position }: CeilingLightProps) {
  return (
    <group position={position}>
      {/* Fixture base */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Hanging rod */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#a0a0a0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Light shade */}
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 0.2, 16, 1, true]} />
        <meshStandardMaterial
          color="#fff8ee"
          emissive="#fff8ee"
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Bulb glow */}
      <mesh position={[0, -0.4, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#ffffee"
          emissive="#ffffee"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

interface PillarProps {
  position: [number, number, number];
  height?: number;
}

export function Pillar({ position, height = 5 }: PillarProps) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#e8e0d4" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Column */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, height - 0.6, 12]} />
        <meshStandardMaterial color="#f0e8dc" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Capital */}
      <mesh position={[0, height - 0.15, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#e8e0d4" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}
