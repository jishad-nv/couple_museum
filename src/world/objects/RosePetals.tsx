import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { WEDDING_ALTAR_CENTER } from '../../utils/museumLayout';

const PETAL_COUNT = 70;

export default function RosePetals() {
  const pointsRef = useRef<THREE.Points>(null);
  const petalData = useRef(
    Array.from({ length: PETAL_COUNT }, (_, i) => ({
      x: WEDDING_ALTAR_CENTER[0] + (Math.random() - 0.5) * 8,
      y: 4 + Math.random() * 5,
      z: WEDDING_ALTAR_CENTER[2] - 2 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.8 - Math.random() * 0.8,
      vz: (Math.random() - 0.5) * 0.6,
      rot: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 3,
      life: 0,
    }))
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();
    const active =
      s.currentRoom === 'wedding' &&
      (s.weddingStage === 'vows' || s.weddingStage === 'celebrating');

    const points = pointsRef.current;
    if (!points) return;
    points.visible = active;
    if (!active) return;

    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const cx = WEDDING_ALTAR_CENTER[0];
    const cz = WEDDING_ALTAR_CENTER[2];

    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petalData.current[i];
      p.x += (p.vx + Math.sin(p.y * 2) * 0.4) * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      if (p.y < 0.05) {
        p.x = cx + (Math.random() - 0.5) * 8;
        p.y = 7 + Math.random() * 3;
        p.z = cz - 2 + Math.random() * 6;
      }

      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PETAL_COUNT * 3);
    for (let i = 0; i < PETAL_COUNT * 3; i++) pos[i] = 0;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial
        attach="material"
        size={0.14}
        color="#e63956"
        transparent
        opacity={0.92}
        depthWrite={false}
      />
    </points>
  );
}
