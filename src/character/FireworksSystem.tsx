import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { isProposalCelebrationActive, isProposalFireworksAllowed } from '../utils/proposal';

const FIREWORK_COUNT = 6; // simultaneous firework shells
const PARTICLE_COUNT_PER_FIREWORK = 45;
const TOTAL_PARTICLES = FIREWORK_COUNT * PARTICLE_COUNT_PER_FIREWORK;

const FIREWORK_COLORS = [
  new THREE.Color('#ff3366'), // hot pink
  new THREE.Color('#ffcc00'), // golden spark
  new THREE.Color('#ff88cc'), // light romantic pink
  new THREE.Color('#33ccff'), // electric cyan
  new THREE.Color('#ff5522'), // orange red
  new THREE.Color('#ffffaa'), // warm white star
];

export default function FireworksSystem() {
  const pointsRef = useRef<THREE.Points>(null);

  // Firework state: position (x, y, z), velocity (vx, vy, vz), age, life, color, exploded
  const fireworkData = useRef(
    Array.from({ length: FIREWORK_COUNT }, (_, i) => ({
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      life: 2.2,
      exploded: false,
      color: FIREWORK_COLORS[i % FIREWORK_COLORS.length],
    }))
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();
    const isAccepted =
      s.proposalAccepted &&
      isProposalCelebrationActive(s.proposalStage) &&
      isProposalFireworksAllowed(s.currentRoom);

    const points = pointsRef.current;
    if (!points) return;

    if (!isAccepted) {
      points.visible = false;
      return;
    }
    points.visible = true;

    const playerX = s.playerPosition.x;
    const playerZ = s.playerPosition.z;

    const attrPos = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const attrColor = points.geometry.getAttribute('color') as THREE.BufferAttribute;

    for (let f = 0; f < FIREWORK_COUNT; f++) {
      const fw = fireworkData.current[f];
      fw.age += delta;

      if (fw.age >= fw.life) {
        // Relaunch firework
        fw.age = 0;
        fw.exploded = false;
        fw.life = 1.8 + Math.random() * 1.4;
        const inSecretChamber = s.currentRoom === 'private_chamber' || s.currentRoom === 'secret';
        const angle = Math.random() * Math.PI * 2;
        const dist = inSecretChamber ? 1.8 + Math.random() * 4.5 : 3.5 + Math.random() * 10;
        fw.x = playerX + Math.cos(angle) * dist;
        fw.y = 0.2;
        fw.z = playerZ + Math.sin(angle) * dist;

        fw.vx = (Math.random() - 0.5) * 1.1;
        fw.vy = inSecretChamber ? 5.2 + Math.random() * 1.8 : 8.0 + Math.random() * 3.0;
        fw.vz = (Math.random() - 0.5) * 1.1;
        fw.color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      }

      const baseParticleIdx = f * PARTICLE_COUNT_PER_FIREWORK;
      const inSecretChamber = s.currentRoom === 'private_chamber' || s.currentRoom === 'secret';

      if (!fw.exploded) {
        fw.x += fw.vx * delta;
        fw.y += fw.vy * delta;
        fw.z += fw.vz * delta;
        fw.vy -= 4.5 * delta;

        const maxBurstY = inSecretChamber ? 3.5 + (f % 3) * 0.45 : 8.5 + (f % 3) * 2;
        if (fw.vy <= 0 || fw.y >= maxBurstY) {
          fw.exploded = true;
        }
      }

      for (let p = 0; p < PARTICLE_COUNT_PER_FIREWORK; p++) {
        const idx = baseParticleIdx + p;
        if (!fw.exploded) {
          if (p === 0) {
            attrPos.setXYZ(idx, fw.x, fw.y, fw.z);
            attrColor.setXYZ(idx, fw.color.r, fw.color.g, fw.color.b);
          } else {
            attrPos.setXYZ(idx, 0, -100, 0);
          }
        } else {
          const burstAge = fw.age - (fw.life * 0.3);
          const progress = Math.max(0, burstAge / (fw.life * 0.7));

          const seed = p + f * 99;
          const angle1 = (seed * 13.1) % (Math.PI * 2);
          const angle2 = (seed * 7.7) % Math.PI;
          const expandSpeed = 1.8 + (seed % 4) * 0.6;

          const px = fw.x + Math.cos(angle1) * Math.sin(angle2) * expandSpeed * progress * 2.2;
          const py = fw.y + Math.cos(angle2) * expandSpeed * progress * 2.2 - (3.8 * progress * progress);
          const pz = fw.z + Math.sin(angle1) * Math.sin(angle2) * expandSpeed * progress * 2.2;

          attrPos.setXYZ(idx, px, Math.max(0.05, py), pz);

          const fade = Math.max(0, 1 - progress);
          attrColor.setXYZ(
            idx,
            fw.color.r * fade,
            fw.color.g * fade,
            fw.color.b * fade
          );
        }
      }
    }

    attrPos.needsUpdate = true;
    attrColor.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(TOTAL_PARTICLES * 3);
    const col = new Float32Array(TOTAL_PARTICLES * 3);
    for (let i = 0; i < TOTAL_PARTICLES * 3; i++) {
      pos[i] = 0;
      col[i] = 1;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, []);

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial
        attach="material"
        size={0.18}
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
