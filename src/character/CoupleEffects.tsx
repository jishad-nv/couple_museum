import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const HEART_COUNT = 8;
const SPARKLE_COUNT = 16;

function createHeartGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.03);
  shape.bezierCurveTo(0, 0.06, -0.05, 0.06, -0.05, 0.025);
  shape.bezierCurveTo(-0.05, -0.01, 0, -0.035, 0, -0.055);
  shape.bezierCurveTo(0, -0.035, 0.05, -0.01, 0.05, 0.025);
  shape.bezierCurveTo(0.05, 0.06, 0, 0.06, 0, 0.03);
  return new THREE.ShapeGeometry(shape, 8);
}

/**
 * Pooled, zero-allocation particle effects for romantic couple moments:
 * - Soft glowing rose hearts rising gently during Kiss
 * - Warm golden waltz sparkles swirling softly around the couple during Dance Together
 */
export default function CoupleEffects() {
  const heartRefs = useRef<Array<THREE.Mesh | null>>([]);
  const sparkleRefs = useRef<Array<THREE.Mesh | null>>([]);
  const timeRef = useRef(0);

  const heartGeo = useMemo(() => createHeartGeometry(), []);
  const sparkleGeo = useMemo(() => new THREE.SphereGeometry(0.022, 6, 6), []);

  useEffect(() => {
    return () => {
      heartGeo.dispose();
      sparkleGeo.dispose();
    };
  }, [heartGeo, sparkleGeo]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    timeRef.current += delta;
    const t = timeRef.current;

    const s = useGameStore.getState();
    const midX = (s.playerPosition.x + s.partnerPosition.x) * 0.5;
    const midZ = (s.playerPosition.z + s.partnerPosition.z) * 0.5;
    const showKissHearts = s.activeCoupleSequence === 'kiss';
    const showDanceSparkles = s.isDancing;

    for (let i = 0; i < HEART_COUNT; i++) {
      const m = heartRefs.current[i];
      if (!m) continue;
      if (!showKissHearts) {
        m.visible = false;
        continue;
      }
      const cycle = ((t * 0.65 + i / HEART_COUNT) % 1 + 1) % 1;
      const angle = i * 1.9 + t * 0.9;
      const spread = 0.14 + cycle * 0.24;
      m.visible = true;
      m.position.set(
        midX + Math.cos(angle) * spread,
        1.65 + cycle * 0.95,
        midZ + Math.sin(angle) * spread
      );
      m.rotation.y = angle + t * 0.5;
      const scale = Math.sin(cycle * Math.PI) * 1.15;
      m.scale.setScalar(Math.max(0.01, scale));
    }

    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const m = sparkleRefs.current[i];
      if (!m) continue;
      if (!showDanceSparkles) {
        m.visible = false;
        continue;
      }
      const orbitAngle = t * 1.3 + (i * Math.PI * 2) / SPARKLE_COUNT;
      const radius = 0.75 + (i % 3) * 0.35;
      const yBob = 0.28 + ((i * 0.23 + t * 0.35) % 1.45);
      m.visible = true;
      m.position.set(
        midX + Math.cos(orbitAngle) * radius,
        yBob,
        midZ + Math.sin(orbitAngle) * radius
      );
      const pulse = 0.65 + Math.sin(t * 4 + i) * 0.35;
      m.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      {Array.from({ length: HEART_COUNT }).map((_, i) => (
        <mesh
          key={`kh-${i}`}
          ref={(el) => {
            heartRefs.current[i] = el;
          }}
          geometry={heartGeo}
          visible={false}
        >
          <meshBasicMaterial color="#ff85aa" transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
        <mesh
          key={`ds-${i}`}
          ref={(el) => {
            sparkleRefs.current[i] = el;
          }}
          geometry={sparkleGeo}
          visible={false}
        >
          <meshBasicMaterial color="#ffe49e" transparent opacity={0.82} />
        </mesh>
      ))}
    </group>
  );
}
