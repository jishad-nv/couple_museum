import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../utils/constants';
import { useGameStore } from '../store/gameStore';

const NIGHT_AMBIENT = new THREE.Color('#c4d3ec');
const DAY_AMBIENT = new THREE.Color('#fff5e6');
const NIGHT_SKY_HEMI = new THREE.Color('#4e6ea8');
const DAY_SKY_HEMI = new THREE.Color('#b6e0fa');
const NIGHT_GND_HEMI = new THREE.Color('#222821');
const DAY_GND_HEMI = new THREE.Color('#dfd0bc');
const NIGHT_KEY = new THREE.Color('#c8dcff');
const DAY_KEY = new THREE.Color('#fff1d4');

export default function Lighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const dayMixRef = useRef(0);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const isWedding = useGameStore.getState().currentRoom === 'wedding';
    const target = isWedding ? 1 : 0;
    dayMixRef.current = THREE.MathUtils.lerp(dayMixRef.current, target, 1 - Math.exp(-2.8 * dt));
    const m = dayMixRef.current;

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.38, 0.72, m);
      ambientRef.current.color.lerpColors(NIGHT_AMBIENT, DAY_AMBIENT, m);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.56, 0.92, m);
      hemiRef.current.color.lerpColors(NIGHT_SKY_HEMI, DAY_SKY_HEMI, m);
      hemiRef.current.groundColor.lerpColors(NIGHT_GND_HEMI, DAY_GND_HEMI, m);
    }
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(0.82, 1.65, m);
      dirRef.current.color.lerpColors(NIGHT_KEY, DAY_KEY, m);
    }
  });

  return (
    <>
      {/* Adaptive Ambient + Hemisphere Fill (Night Moonlight <-> Morning Destination Wedding Sun) */}
      <ambientLight ref={ambientRef} intensity={0.38} color="#c4d3ec" />
      <hemisphereLight ref={hemiRef} args={['#4e6ea8', '#222821', 0.56]} />

      {/* Directional Key Light (Moonlight / Morning Sun) */}
      <directionalLight
        ref={dirRef}
        position={[24, 34, -22]}
        intensity={0.82}
        color="#c8dcff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={125}
        shadow-camera-left={-52}
        shadow-camera-right={52}
        shadow-camera-top={52}
        shadow-camera-bottom={-52}
        shadow-bias={-0.0008}
      />

      {/* Exterior Forecourt Warm Portico & Courtyard Lantern Illumination */}
      <pointLight position={[0, 4.8, 7.2]} intensity={14} color="#ffd89c" distance={22} />
      <pointLight position={[0, 4.4, 13.8]} intensity={10} color="#ffdba8" distance={18} />

      {/* Entrance Hall Warm Chandeliers */}
      <pointLight position={[0, 4.8, -0.25]} intensity={16} color={COLORS.warmLight} distance={16} />

      {/* Circular Photo Gallery Rotunda & Wall Accent Lights */}
      <pointLight position={[0, 5.2, -21.5]} intensity={23} color="#fff2de" distance={32} />
      <pointLight position={[0, 4.5, -11.5]} intensity={12} color="#ffe8cb" distance={18} />
      <pointLight position={[0, 4.5, -31.5]} intensity={12} color="#ffe8cb" distance={18} />
      <pointLight position={[-11, 4.5, -21.5]} intensity={12} color="#ffe8cb" distance={18} />
      <pointLight position={[11, 4.5, -21.5]} intensity={12} color="#ffe8cb" distance={18} />

      {/* Memory Theatre Warm Sconce & Screen Ambient */}
      <pointLight position={[0, 4.4, -47.5]} intensity={6.5} color="#ffd0a0" distance={18} />
      <pointLight position={[0, 3.6, -54.0]} intensity={5.0} color="#e8b8d0" distance={14} />

      {/* Beauty of Garden: Soft Cool Moonlight Canopy Wash + Warm Focal Pools */}
      <pointLight position={[26.5, 9.5, -38.0]} intensity={18} color="#9fc2f5" distance={36} />
      <pointLight position={[17.2, 3.8, -33.6]} intensity={9} color="#ffd48c" distance={14} />

      {/* Our Secret Room: Intimate Warm Candlelight & Rose-Gold Glow */}
      <pointLight position={[-26.5, 4.2, -21.5]} intensity={14} color="#ffcb94" distance={20} />
      <pointLight position={[-32.0, 2.8, -21.5]} intensity={9} color="#ffaa6e" distance={12} />

      {/* Our Private Memories Chamber: Warm Archive Sconces & Amber Focal Glow */}
      <pointLight position={[-44.8, 4.3, -21.5]} intensity={16} color="#ffd59f" distance={24} />
      <pointLight position={[-50.5, 3.6, -21.5]} intensity={11} color="#ffc285" distance={18} />

      {/* Our Wedding Day: Radiant Morning Pavilion & Floral Arch Warmth */}
      <pointLight position={[-26.5, 8.5, -50.5]} intensity={18} color="#fff5de" distance={36} />
      <pointLight position={[-26.5, 4.8, -59.5]} intensity={12} color="#ffe4bd" distance={18} />
    </>
  );
}
