import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../utils/constants';
import { useGameStore } from '../store/gameStore';
import { isWeddingAtmosphereActive } from '../utils/weddingEnvironment';
import {
  ENTRANCE_TWILIGHT_FACTOR,
  stepEntranceLightFactor,
} from '../utils/loadingReadiness';

const NIGHT_AMBIENT = new THREE.Color('#c4d3ec');
const DAY_AMBIENT = new THREE.Color('#fff7ea');
const NIGHT_SKY_HEMI = new THREE.Color('#4e6ea8');
const DAY_SKY_HEMI = new THREE.Color('#bfe3f9');
const NIGHT_GND_HEMI = new THREE.Color('#222821');
const DAY_GND_HEMI = new THREE.Color('#7a9461');
const NIGHT_KEY = new THREE.Color('#c8dcff');
const DAY_KEY = new THREE.Color('#fff0d2');

interface RoomPointLightSpec {
  position: [number, number, number];
  intensity: number;
  color: string;
  distance: number;
}

const ROOM_POINT_LIGHTS: ReadonlyArray<RoomPointLightSpec> = [
  // Exterior Forecourt
  { position: [0, 4.8, 7.2], intensity: 14, color: '#ffd89c', distance: 22 },
  { position: [0, 4.4, 13.8], intensity: 10, color: '#ffdba8', distance: 18 },
  // Entrance Hall
  { position: [0, 4.8, -0.25], intensity: 16, color: COLORS.warmLight, distance: 16 },
  // Circular Photo Gallery Rotunda & Wall Accent Lights
  { position: [0, 5.2, -21.5], intensity: 23, color: '#fff2de', distance: 32 },
  { position: [0, 4.5, -11.5], intensity: 12, color: '#ffe8cb', distance: 18 },
  { position: [0, 4.5, -31.5], intensity: 12, color: '#ffe8cb', distance: 18 },
  { position: [-11, 4.5, -21.5], intensity: 12, color: '#ffe8cb', distance: 18 },
  { position: [11, 4.5, -21.5], intensity: 12, color: '#ffe8cb', distance: 18 },
  // Memory Theatre
  { position: [0, 4.4, -47.5], intensity: 6.5, color: '#ffd0a0', distance: 18 },
  { position: [0, 3.6, -54.0], intensity: 5.0, color: '#e8b8d0', distance: 14 },
  // Beauty of Garden
  { position: [26.5, 9.5, -38.0], intensity: 18, color: '#9fc2f5', distance: 36 },
  { position: [17.2, 3.8, -33.6], intensity: 9, color: '#ffd48c', distance: 14 },
  // Pre-Secret Room
  { position: [-26.5, 4.2, -21.5], intensity: 14, color: '#ffcb94', distance: 20 },
  { position: [-32.0, 2.8, -21.5], intensity: 9, color: '#ffaa6e', distance: 12 },
  // Inner Password-Protected Secret Room
  { position: [-44.8, 4.3, -21.5], intensity: 16, color: '#ffd59f', distance: 24 },
  { position: [-50.5, 3.6, -21.5], intensity: 11, color: '#ffc285', distance: 18 },
  // Our Wedding Day — Stage Spotlight, Chandeliers & Cake Pavilion
  { position: [-26.5, 5.2, -59.2], intensity: 15, color: '#ffecc8', distance: 20 },
  { position: [-26.5, 4.4, -55.5], intensity: 11, color: '#fff1d6', distance: 16 },
  { position: [-26.5, 4.4, -49.5], intensity: 12, color: '#fff1d6', distance: 18 },
  { position: [-26.5, 4.4, -43.5], intensity: 11, color: '#fff1d6', distance: 16 },
  { position: [-34.8, 3.4, -40.0], intensity: 10, color: '#ffebd0', distance: 12 },
];

const ACTIVE_POOL_SIZE = 6;

export default function Lighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const poolRefs = useRef<Array<THREE.PointLight | null>>([]);
  const dayMixRef = useRef(0);
  const revealFactorRef = useRef(
    useGameStore.getState().isLoading ? ENTRANCE_TWILIGHT_FACTOR : 1
  );
  const rankedIndices = useRef<number[]>(ROOM_POINT_LIGHTS.map((_, i) => i));
  const rankedDistances = useRef<number[]>(new Array(ROOM_POINT_LIGHTS.length).fill(0));

  useFrame((_, rawDelta) => {
    const dt = Math.max(0, Math.min(rawDelta, 0.05));
    const s = useGameStore.getState();

    revealFactorRef.current = stepEntranceLightFactor(
      revealFactorRef.current,
      s.isLoading,
      dt
    );
    const reveal = revealFactorRef.current;

    const isWedding = isWeddingAtmosphereActive(s.currentRoom, s.scriptedWalk?.target);
    const target = isWedding ? 1 : 0;
    dayMixRef.current = THREE.MathUtils.lerp(dayMixRef.current, target, 1 - Math.exp(-2.8 * dt));
    const m = dayMixRef.current;

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.38, 0.56, m) * reveal;
      ambientRef.current.color.lerpColors(NIGHT_AMBIENT, DAY_AMBIENT, m);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.56, 0.86, m) * reveal;
      hemiRef.current.color.lerpColors(NIGHT_SKY_HEMI, DAY_SKY_HEMI, m);
      hemiRef.current.groundColor.lerpColors(NIGHT_GND_HEMI, DAY_GND_HEMI, m);
    }
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(0.82, 1.42, m) * reveal;
      dirRef.current.color.lerpColors(NIGHT_KEY, DAY_KEY, m);
    }

    // Bind the 6 nearest room lights to player position without allocating or recompiling shaders
    const px = s.playerPosition.x;
    const pz = s.playerPosition.z;
    const dists = rankedDistances.current;
    const indices = rankedIndices.current;
    for (let i = 0; i < ROOM_POINT_LIGHTS.length; i++) {
      const spec = ROOM_POINT_LIGHTS[i];
      const dx = spec.position[0] - px;
      const dz = spec.position[2] - pz;
      dists[i] = dx * dx + dz * dz;
      indices[i] = i;
    }
    for (let slot = 0; slot < ACTIVE_POOL_SIZE; slot++) {
      let best = slot;
      for (let j = slot + 1; j < indices.length; j++) {
        if (dists[indices[j]] < dists[indices[best]]) best = j;
      }
      if (best !== slot) {
        const tmp = indices[slot];
        indices[slot] = indices[best];
        indices[best] = tmp;
      }
      const light = poolRefs.current[slot];
      if (light) {
        const spec = ROOM_POINT_LIGHTS[indices[slot]];
        light.position.set(spec.position[0], spec.position[1], spec.position[2]);
        light.intensity = spec.intensity * reveal;
        light.distance = spec.distance;
        light.color.set(spec.color);
      }
    }
  });

  return (
    <>
      <ambientLight
        ref={ambientRef}
        intensity={0.38 * ENTRANCE_TWILIGHT_FACTOR}
        color="#c4d3ec"
      />
      <hemisphereLight
        ref={hemiRef}
        args={['#4e6ea8', '#222821', 0.56 * ENTRANCE_TWILIGHT_FACTOR]}
      />

      <directionalLight
        ref={dirRef}
        position={[24, 34, -22]}
        intensity={0.82 * ENTRANCE_TWILIGHT_FACTOR}
        color="#c8dcff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={145}
        shadow-camera-left={-58}
        shadow-camera-right={48}
        shadow-camera-top={68}
        shadow-camera-bottom={-58}
        shadow-bias={-0.0005}
      />

      {ROOM_POINT_LIGHTS.slice(0, ACTIVE_POOL_SIZE).map((spec, slot) => (
        <pointLight
          key={`room-light-pool-${slot}`}
          ref={(el) => {
            poolRefs.current[slot] = el;
          }}
          position={spec.position}
          intensity={spec.intensity * ENTRANCE_TWILIGHT_FACTOR}
          color={spec.color}
          distance={spec.distance}
        />
      ))}
    </>
  );
}
