import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { WEDDING_ALTAR_CENTER } from '../../utils/museumLayout';

const FIREWORK_COUNT = 5;
const PARTICLES_PER_SHELL = 50;
const TOTAL_PARTICLES = FIREWORK_COUNT * PARTICLES_PER_SHELL;

const COLORS_LIST = [
  new THREE.Color('#ffe875'), // gold
  new THREE.Color('#ffffff'), // warm white
  new THREE.Color('#ff8fa3'), // soft rose
  new THREE.Color('#ffb703'), // champagne gold
  new THREE.Color('#ff4d6d'), // ruby red
];

export default function WeddingFireworks() {
  const pointsRef = useRef<THREE.Points>(null);

  const fireworks = useRef(
    Array.from({ length: FIREWORK_COUNT }, (_, i) => ({
      x: WEDDING_ALTAR_CENTER[0] + (i - 2) * 1.8,
      y: 0,
      z: WEDDING_ALTAR_CENTER[2] - 8,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 12 + Math.random() * 4,
      vz: (Math.random() - 0.5) * 0.4,
      age: -i * 0.35, // Staggered start delay per firework shell
      life: 2.8,
      exploded: false,
      color: COLORS_LIST[i % COLORS_LIST.length],
    }))
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();
    const active = s.currentRoom === 'wedding' && s.weddingStage === 'celebrating';

    const points = pointsRef.current;
    if (!points) return;
    points.visible = active;
    if (!active) return;

    const attrPos = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const attrCol = points.geometry.getAttribute('color') as THREE.BufferAttribute;
    const cx = WEDDING_ALTAR_CENTER[0];
    const cz = WEDDING_ALTAR_CENTER[2];

    for (let f = 0; f < FIREWORK_COUNT; f++) {
      const fw = fireworks.current[f];
      fw.age += delta;

      if (fw.age >= fw.life) {
        fw.age = 0;
        fw.exploded = false;
        fw.life = 2.4 + Math.random() * 1.0;
        fw.x = cx + (Math.random() - 0.5) * 6;
        fw.y = 0;
        fw.z = cz - 8 + (Math.random() - 0.5) * 4;
        fw.vx = (Math.random() - 0.5) * 0.6;
        fw.vy = 13 + Math.random() * 4.5;
        fw.vz = (Math.random() - 0.5) * 0.6;
        fw.color = COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)];
      }

      const baseIdx = f * PARTICLES_PER_SHELL;
      if (fw.age < 0) {
        for (let p = 0; p < PARTICLES_PER_SHELL; p++) {
          attrPos.setXYZ(baseIdx + p, 0, -100, 0);
        }
        continue;
      }

      if (!fw.exploded) {
        fw.x += fw.vx * delta;
        fw.y += fw.vy * delta;
        fw.z += fw.vz * delta;
        fw.vy -= 5.0 * delta; // gravity
        if (fw.vy <= 0 || fw.y >= 18.0) {
          fw.exploded = true;
        }
      }

      for (let p = 0; p < PARTICLES_PER_SHELL; p++) {
        const idx = baseIdx + p;
        if (!fw.exploded) {
          if (p === 0) {
            attrPos.setXYZ(idx, fw.x, fw.y, fw.z);
            attrCol.setXYZ(idx, fw.color.r, fw.color.g, fw.color.b);
          } else {
            attrPos.setXYZ(idx, fw.x - fw.vx * p * 0.04, Math.max(0, fw.y - p * 0.12), fw.z - fw.vz * p * 0.04);
            attrCol.setXYZ(idx, fw.color.r * 0.6, fw.color.g * 0.6, fw.color.b * 0.6);
          }
        } else {
          const prog = Math.max(0, fw.age / 2.2);
          const angle = (p * Math.PI * 2) / PARTICLES_PER_SHELL;
          const elev = ((p % 7) - 3) * 0.35;
          const speed = 4.0 + (p % 4) * 1.2;

          const px = fw.x + Math.cos(angle) * Math.cos(elev) * speed * prog * 3.2;
          const py = fw.y + Math.sin(elev) * speed * prog * 3.2 - (4.5 * prog * prog);
          const pz = fw.z + Math.sin(angle) * Math.cos(elev) * speed * prog * 3.2;

          attrPos.setXYZ(idx, px, Math.max(0.5, py), pz);
          const fade = Math.max(0, 1 - prog);
          attrCol.setXYZ(idx, fw.color.r * fade, fw.color.g * fade, fw.color.b * fade);
        }
      }
    }

    attrPos.needsUpdate = true;
    attrCol.needsUpdate = true;
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
        size={0.28}
        vertexColors
        transparent
        opacity={0.98}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
