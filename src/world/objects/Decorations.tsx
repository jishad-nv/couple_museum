import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { COLORS, INTERACTION_DISTANCE } from '../../utils/constants';
import {
  BENCH_CUSHION_TOP_Y,
  findNearestBench,
  type InteractiveBenchEntry,
} from '../../utils/museumLayout';

interface BenchProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  benchId?: string;
  benchLabel?: string;
  interactive?: boolean;
}

// Global registry of mounted interactive benches so closest seat always wins cleanly
const interactiveBenchRegistry = new Map<string, InteractiveBenchEntry>();

export default function Bench({
  position,
  rotation = [0, 0, 0],
  benchId,
  benchLabel = 'Romantic Bench',
  interactive = false,
}: BenchProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!interactive || !benchId) return;
    interactiveBenchRegistry.set(benchId, {
      id: benchId,
      label: benchLabel,
      position: [position[0], 0, position[2]],
      rotation: rotation[1],
    });
    return () => {
      interactiveBenchRegistry.delete(benchId);
      const s = useGameStore.getState();
      if (s.nearbyBench?.id === benchId) {
        s.setNearbyBench(null);
      }
    };
  }, [interactive, benchId, benchLabel, position, rotation]);

  useFrame(() => {
    if (!interactive || !benchId || !groupRef.current) return;
    groupRef.current.getWorldPosition(worldPosRef.current);
    interactiveBenchRegistry.set(benchId, {
      id: benchId,
      label: benchLabel,
      position: [worldPosRef.current.x, 0, worldPosRef.current.z],
      rotation: rotation[1],
    });

    const s = useGameStore.getState();
    const nearest = findNearestBench(
      s.playerPosition,
      interactiveBenchRegistry.values(),
      INTERACTION_DISTANCE
    );

    if (nearest?.id === benchId) {
      if (s.nearbyBench?.id !== benchId) {
        s.setNearbyBench(nearest);
      }
    } else if (!nearest && s.nearbyBench?.id === benchId) {
      s.setNearbyBench(null);
    }
  });

  // Bench height dimensions calibrated so Cushion top sits strictly at BENCH_CUSHION_TOP_Y (0.465m)
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Wood Seat Base (top = 0.425m) */}
        <mesh position={[0, 0.39, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.65, 0.07, 0.54]} />
          <meshStandardMaterial color={COLORS.woodBrown} roughness={0.65} />
        </mesh>
        {/* Ergonomic Backrest (front face = -0.205m) */}
        <mesh position={[0, 0.72, -0.24]} castShadow>
          <boxGeometry args={[1.65, 0.52, 0.07]} />
          <meshStandardMaterial color={COLORS.woodBrown} roughness={0.65} />
        </mesh>
      </RigidBody>

      {/* Velvet Cushion (y center = 0.445, h = 0.04 => top strictly at 0.465m) */}
      <mesh position={[0, BENCH_CUSHION_TOP_Y - 0.02, 0.02]} receiveShadow>
        <boxGeometry args={[1.5, 0.04, 0.44]} />
        <meshStandardMaterial color="#8b2252" roughness={0.82} />
      </mesh>

      {/* Legs resting on floor y = 0 */}
      {[-0.68, 0.68].map((x) =>
        [-0.19, 0.19].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.18, z]} castShadow>
            <boxGeometry args={[0.07, 0.36, 0.07]} />
            <meshStandardMaterial color="#231c18" roughness={0.5} metalness={0.2} />
          </mesh>
        ))
      )}

      {/* Armrests */}
      {[-0.76, 0.76].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.56, -0.04]} castShadow>
            <boxGeometry args={[0.07, 0.06, 0.44]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.4} />
          </mesh>
          <mesh position={[x, 0.47, 0.14]} castShadow>
            <boxGeometry args={[0.055, 0.14, 0.055]} />
            <meshStandardMaterial color="#231c18" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

interface TreeProps {
  position: [number, number, number];
  scale?: number;
  blossom?: boolean;
}

export function Tree({ position, scale = 1, blossom = false }: TreeProps) {
  const canopyRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (canopyRef.current) {
      // Gentle slow wind sway strictly at upper canopy; trunk and branches remain grounded
      canopyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.55 + position[0]) * 0.012;
      canopyRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.45 + position[2]) * 0.008;
    }
  });

  const mainLeaf = blossom ? '#c47b96' : '#254e28';
  const topLeaf = blossom ? '#dda0b6' : '#356834';
  const accentLeaf = blossom ? '#aa5e7a' : '#1d3e20';

  return (
    <group position={position} scale={scale}>
      {/* Grounded Root Collar & Root Buttresses */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.4, 0.28, 12]} />
        <meshStandardMaterial color="#462d18" roughness={0.94} />
      </mesh>
      {[0, 2.1, 4.2].map((ang, i) => (
        <mesh
          key={`root-${i}`}
          position={[Math.cos(ang) * 0.26, 0.08, Math.sin(ang) * 0.26]}
          rotation={[Math.sin(ang) * 0.4, ang, Math.cos(ang) * 0.4]}
          castShadow
        >
          <cylinderGeometry args={[0.08, 0.14, 0.32, 7]} />
          <meshStandardMaterial color="#462d18" roughness={0.94} />
        </mesh>
      ))}

      {/* Tapered Main Trunk */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.25, 2.9, 12]} />
        <meshStandardMaterial color="#54371d" roughness={0.92} />
      </mesh>

      {/* Outstretched Structural Limbs anchoring foliage & hanging memories */}
      <mesh position={[0.62, 2.55, 0.18]} rotation={[0.15, 0, -0.78]} castShadow>
        <cylinderGeometry args={[0.055, 0.1, 1.55, 8]} />
        <meshStandardMaterial color="#54371d" roughness={0.92} />
      </mesh>
      <mesh position={[-0.64, 2.65, -0.15]} rotation={[-0.12, 0, 0.74]} castShadow>
        <cylinderGeometry args={[0.055, 0.1, 1.5, 8]} />
        <meshStandardMaterial color="#54371d" roughness={0.92} />
      </mesh>
      <mesh position={[0.12, 2.75, 0.65]} rotation={[0.72, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.045, 0.085, 1.4, 8]} />
        <meshStandardMaterial color="#54371d" roughness={0.92} />
      </mesh>
      <mesh position={[-0.15, 2.8, -0.62]} rotation={[-0.7, 0, -0.08]} castShadow>
        <cylinderGeometry args={[0.045, 0.085, 1.35, 8]} />
        <meshStandardMaterial color="#54371d" roughness={0.92} />
      </mesh>

      {/* Multi-Cluster Organic Crown */}
      <group ref={canopyRef} position={[0, 3.05, 0]}>
        <mesh position={[0, 0.68, 0]} castShadow>
          <sphereGeometry args={[1.38, 16, 12]} />
          <meshStandardMaterial color={mainLeaf} roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.48, 0]} castShadow>
          <sphereGeometry args={[0.98, 14, 12]} />
          <meshStandardMaterial color={topLeaf} roughness={0.84} />
        </mesh>
        <mesh position={[0.92, 0.25, 0.42]} castShadow>
          <sphereGeometry args={[0.92, 14, 10]} />
          <meshStandardMaterial color={accentLeaf} roughness={0.88} />
        </mesh>
        <mesh position={[-0.95, 0.35, -0.35]} castShadow>
          <sphereGeometry args={[0.88, 14, 10]} />
          <meshStandardMaterial color={topLeaf} roughness={0.85} />
        </mesh>
        <mesh position={[0.25, 0.2, 0.92]} castShadow>
          <sphereGeometry args={[0.82, 12, 10]} />
          <meshStandardMaterial color={mainLeaf} roughness={0.86} />
        </mesh>
        <mesh position={[-0.35, 0.28, -0.9]} castShadow>
          <sphereGeometry args={[0.84, 12, 10]} />
          <meshStandardMaterial color={accentLeaf} roughness={0.87} />
        </mesh>
      </group>
    </group>
  );
}

export type FlowerVariety = 'rose' | 'tulip' | 'daisy';

interface FlowerProps {
  position: [number, number, number];
  color?: string;
  phaseOffset?: number;
  variety?: FlowerVariety;
  scale?: number;
}

export function Flower({
  position,
  color = '#ff69b4',
  phaseOffset = 0,
  variety = 'daisy',
  scale = 1,
}: FlowerProps) {
  const swayRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (swayRef.current) {
      // Strictly grounded at y=0 base with subtle slow breeze — never jittery
      const t = state.clock.elapsedTime;
      swayRef.current.rotation.z = Math.sin(t * 0.85 + phaseOffset) * 0.022;
      swayRef.current.rotation.x = Math.cos(t * 0.72 + phaseOffset) * 0.015;
    }
  });

  const stemH = variety === 'tulip' ? 0.38 : variety === 'rose' ? 0.35 : 0.31;

  return (
    <group position={[position[0], 0, position[2]]} scale={scale}>
      <group ref={swayRef}>
        {/* Grounded stem */}
        <mesh position={[0, stemH / 2, 0]}>
          <cylinderGeometry args={[0.014, 0.022, stemH, 6]} />
          <meshStandardMaterial color="#274e1e" roughness={0.85} />
        </mesh>
        {/* Two curved foliage leaves */}
        <mesh position={[0.055, stemH * 0.36, 0]} rotation={[0.1, 0, -0.58]}>
          <boxGeometry args={[0.09, 0.014, 0.04]} />
          <meshStandardMaterial color="#346525" roughness={0.82} />
        </mesh>
        <mesh position={[-0.055, stemH * 0.52, 0]} rotation={[-0.1, 0.4, 0.58]}>
          <boxGeometry args={[0.085, 0.014, 0.04]} />
          <meshStandardMaterial color="#346525" roughness={0.82} />
        </mesh>

        {variety === 'tulip' && (
          <group position={[0, stemH + 0.03, 0]}>
            <mesh>
              <cylinderGeometry args={[0.068, 0.036, 0.11, 8, 1, false]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.03, 0]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color="#ffe58f" roughness={0.45} />
            </mesh>
          </group>
        )}

        {variety === 'rose' && (
          <group position={[0, stemH + 0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.068, 10, 8]} />
              <meshStandardMaterial color={color} roughness={0.52} />
            </mesh>
            {[0, 72, 144, 216, 288].map((ang, i) => (
              <mesh
                key={i}
                position={[
                  Math.sin((ang * Math.PI) / 180) * 0.055,
                  -0.005,
                  Math.cos((ang * Math.PI) / 180) * 0.055,
                ]}
                rotation={[0.45, (ang * Math.PI) / 180, 0]}
              >
                <sphereGeometry args={[0.042, 8, 6]} />
                <meshStandardMaterial color={color} roughness={0.55} />
              </mesh>
            ))}
          </group>
        )}

        {variety === 'daisy' && (
          <>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <mesh
                key={i}
                position={[
                  Math.sin((angle * Math.PI) / 180) * 0.072,
                  stemH + 0.01,
                  Math.cos((angle * Math.PI) / 180) * 0.072,
                ]}
                rotation={[0.28, (angle * Math.PI) / 180, 0]}
                scale={[0.85, 0.45, 1.15]}
              >
                <sphereGeometry args={[0.05, 8, 6]} />
                <meshStandardMaterial color={color} roughness={0.55} />
              </mesh>
            ))}
            <mesh position={[0, stemH + 0.02, 0]}>
              <sphereGeometry args={[0.036, 8, 8]} />
              <meshStandardMaterial color="#ffdd55" roughness={0.45} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

export function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={[position[0], 0, position[2]]} scale={scale}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.48, 12, 10]} />
        <meshStandardMaterial color="#245421" roughness={0.88} />
      </mesh>
      <mesh position={[0.32, 0.27, 0.16]} castShadow>
        <sphereGeometry args={[0.36, 10, 8]} />
        <meshStandardMaterial color="#2f6629" roughness={0.88} />
      </mesh>
      <mesh position={[-0.3, 0.29, -0.12]} castShadow>
        <sphereGeometry args={[0.38, 10, 8]} />
        <meshStandardMaterial color="#1d461b" roughness={0.88} />
      </mesh>
      <mesh position={[0.05, 0.46, -0.14]} castShadow>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color="#36702f" roughness={0.86} />
      </mesh>
    </group>
  );
}

export function GardenLamp({
  position,
  castGlow = false,
}: {
  position: [number, number, number];
  castGlow?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.28, 10]} />
        <meshStandardMaterial color="#222228" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.32, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.062, 2.25, 8]} />
        <meshStandardMaterial color="#222228" roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.52, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial
          color="#fff4c4"
          emissive="#ffd478"
          emissiveIntensity={1.85}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 2.72, 0]}>
        <coneGeometry args={[0.22, 0.16, 8]} />
        <meshStandardMaterial color="#222228" roughness={0.5} />
      </mesh>
      {castGlow && (
        <pointLight position={[0, 2.45, 0]} intensity={6.5} color="#ffd588" distance={9.5} />
      )}
    </group>
  );
}

interface CeilingLightProps {
  position: [number, number, number];
}

export function CeilingLight({ position }: CeilingLightProps) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.44, 8]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.22, 16, 1, true]} />
        <meshStandardMaterial
          color="#fff6e6"
          emissive="#ffe2b0"
          emissiveIntensity={0.65}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color="#fffbe8" emissive="#fff2c8" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}

interface PillarProps {
  position: [number, number, number];
  height?: number;
}

export function Pillar({ position, height = 5.5 }: PillarProps) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.66, 0.36, 0.66]} />
          <meshStandardMaterial color="#e5dccf" roughness={0.4} />
        </mesh>
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.25, height - 0.72, 14]} />
          <meshStandardMaterial color="#efe8dc" roughness={0.35} />
        </mesh>
        <mesh position={[0, height - 0.18, 0]} castShadow>
          <boxGeometry args={[0.68, 0.36, 0.68]} />
          <meshStandardMaterial color="#e5dccf" roughness={0.4} />
        </mesh>
      </RigidBody>
      <mesh position={[0, height - 0.38, 0]}>
        <cylinderGeometry args={[0.26, 0.24, 0.08, 14]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
      </mesh>
    </group>
  );
}
