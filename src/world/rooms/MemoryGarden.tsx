import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Floor from '../objects/Floor';
import PhotoFrame from '../objects/PhotoFrame';
import Waterfall from '../objects/Waterfall';
import Bench, {
  Tree,
  Flower,
  Bush,
  GardenLamp,
  type FlowerVariety,
} from '../objects/Decorations';
import { COLORS } from '../../utils/constants';
import { useGameStore } from '../../store/gameStore';
import {
  GARDEN_BENCH_POSITIONS,
  WATERFALL_CENTER,
  registerCameraCollider,
  unregisterCameraCollider,
} from '../../utils/museumLayout';

const GARDEN_CENTER: [number, number, number] = [25.5, 0, -38.0];

// Trees framing the waterfall, flower beds, and hanging-memory groves
const TREE_SPECS: Array<{ pos: [number, number, number]; scale: number; blossom: boolean }> = [
  { pos: [19.4, 0, -28.6], scale: 1.16, blossom: true }, // Grove A (frames 1-3)
  { pos: [32.4, 0, -35.8], scale: 1.18, blossom: true }, // Grove B (frames 4-6)
  { pos: [23.8, 0, -47.2], scale: 1.12, blossom: false },
  { pos: [34.8, 0, -27.2], scale: 1.22, blossom: false },
  { pos: [35.2, 0, -48.2], scale: 1.15, blossom: true },
  { pos: [16.2, 0, -47.8], scale: 1.05, blossom: false },
  { pos: [28.4, 0, -27.5], scale: 1.02, blossom: true },
];

// 6 small keepsake framed memories hanging from tree branches at staggered natural heights
const HANGING_SPECS: Array<{
  pos: [number, number, number];
  rot: [number, number, number];
  ropeLength: number;
}> = [
  // Grove A (North-West Blossom Tree) — angled toward garden pathway & waterfall
  { pos: [18.3, 1.98, -30.05], rot: [0, 2.68, 0], ropeLength: 0.98 },
  { pos: [19.55, 2.32, -29.85], rot: [0, 2.86, 0], ropeLength: 0.72 },
  { pos: [20.8, 1.92, -30.15], rot: [0, 3.04, 0], ropeLength: 1.04 },
  // Grove B (East Blossom Tree)
  { pos: [31.15, 2.02, -34.25], rot: [0, -1.15, 0], ropeLength: 0.94 },
  { pos: [30.85, 2.35, -35.95], rot: [0, -1.52, 0], ropeLength: 0.7 },
  { pos: [31.25, 1.95, -37.65], rot: [0, -1.9, 0], ropeLength: 1.0 },
];

// Raised bordered flower beds grounded seamlessly on the lawn
const FLOWER_BEDS: Array<{
  center: [number, number, number];
  radiusX: number;
  radiusZ: number;
  count: number;
  varieties: FlowerVariety[];
  colors: string[];
}> = [
  {
    center: [16.2, 0, -30.4],
    radiusX: 1.45,
    radiusZ: 1.15,
    count: 14,
    varieties: ['tulip', 'rose', 'daisy'],
    colors: ['#ff6b9d', '#ffb86c', '#f78fb3', '#ffeaa7'],
  },
  {
    center: [24.2, 0, -28.2],
    radiusX: 2.1,
    radiusZ: 1.25,
    count: 18,
    varieties: ['rose', 'daisy', 'tulip'],
    colors: ['#f78fb3', '#ffd166', '#ff85a1', '#f8a5c2'],
  },
  {
    center: [34.5, 0, -40.8],
    radiusX: 1.65,
    radiusZ: 2.0,
    count: 16,
    varieties: ['tulip', 'daisy', 'rose'],
    colors: ['#e056fd', '#ff9ff3', '#ffeaa7', '#ff6b9d'],
  },
  {
    center: [21.5, 0, -46.8],
    radiusX: 2.2,
    radiusZ: 1.35,
    count: 18,
    varieties: ['rose', 'tulip', 'daisy'],
    colors: ['#ff758f', '#ffd166', '#f7a8b8', '#ff9ff3'],
  },
  {
    center: [16.5, 0, -40.8],
    radiusX: 1.5,
    radiusZ: 1.85,
    count: 15,
    varieties: ['daisy', 'rose', 'tulip'],
    colors: ['#ffb347', '#ff6b9d', '#ffeaa7', '#f78fb3'],
  },
];

const BUSH_SPECS: Array<{ pos: [number, number, number]; scale: number }> = [
  { pos: [17.4, 0, -26.8], scale: 1.05 },
  { pos: [14.5, 0, -39.2], scale: 0.95 },
  { pos: [21.8, 0, -26.2], scale: 1.1 },
  { pos: [29.8, 0, -26.5], scale: 1.05 },
  { pos: [36.2, 0, -31.8], scale: 1.15 },
  { pos: [36.4, 0, -44.0], scale: 1.1 },
  { pos: [28.2, 0, -49.6], scale: 1.08 },
  { pos: [19.0, 0, -49.2], scale: 1.02 },
  { pos: [33.5, 0, -38.0], scale: 0.9 },
];

// Winding natural flagstone path from Conservatory door -> Waterfall promenade -> Benches
const FLAGSTONE_PATH: Array<{ pos: [number, number]; rx: number; rz: number; rot: number }> = [
  { pos: [13.5, -34.2], rx: 0.65, rz: 0.55, rot: 0.2 },
  { pos: [15.1, -34.8], rx: 0.72, rz: 0.54, rot: 0.35 },
  { pos: [16.7, -35.5], rx: 0.68, rz: 0.52, rot: 0.28 },
  { pos: [18.3, -36.2], rx: 0.74, rz: 0.56, rot: 0.4 },
  { pos: [20.0, -36.8], rx: 0.68, rz: 0.54, rot: 0.22 },
  { pos: [21.7, -37.3], rx: 0.72, rz: 0.56, rot: 0.15 },
  // Loop spurs toward Bench 1 & Blossom Grove A
  { pos: [19.4, -34.4], rx: 0.62, rz: 0.5, rot: -0.4 },
  { pos: [19.8, -32.9], rx: 0.66, rz: 0.52, rot: -0.5 },
  // Loop spurs toward Bench 2 & Grove B
  { pos: [29.5, -40.8], rx: 0.65, rz: 0.54, rot: 0.7 },
  { pos: [30.3, -42.4], rx: 0.68, rz: 0.52, rot: 0.8 },
];

const GARDEN_LAMPS: Array<{ pos: [number, number, number]; glow: boolean }> = [
  { pos: [16.2, 0, -33.2], glow: true },
  { pos: [21.6, 0, -35.0], glow: true },
  { pos: [23.2, 0, -41.2], glow: false },
  { pos: [30.2, 0, -34.0], glow: true },
  { pos: [29.8, 0, -42.0], glow: false },
];

function GardenHedge({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const m = meshRef.current;
    registerCameraCollider(m);
    return () => unregisterCameraCollider(m);
  }, []);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#1f401d" roughness={0.94} />
      </mesh>
    </RigidBody>
  );
}

/**
 * Decorative floral garland + miniature warm LED string draped smoothly between tree branches and frames
 */
function TreeGarlandAndLights({
  points,
  blossomColors = ['#ff85a1', '#ffd6e0', '#ffeaa7'],
}: {
  points: [number, number, number][];
  blossomColors?: string[];
}) {
  const { tubeGeo, bulbPositions, flowerBeads } = useMemo(() => {
    const vecs = points.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(vecs);
    const tube = new THREE.TubeGeometry(curve, 32, 0.014, 6, false);

    const bulbs: [number, number, number][] = [];
    const bulbCount = 18;
    for (let i = 0; i <= bulbCount; i++) {
      const pt = curve.getPoint(i / bulbCount);
      bulbs.push([pt.x, pt.y - 0.03, pt.z]);
    }

    const beads: Array<{ pos: [number, number, number]; color: string }> = [];
    const beadCount = 14;
    for (let i = 0; i <= beadCount; i++) {
      const pt = curve.getPoint((i + 0.35) / (beadCount + 1));
      beads.push({
        pos: [pt.x, pt.y + 0.015, pt.z],
        color: blossomColors[i % blossomColors.length],
      });
    }

    return { tubeGeo: tube, bulbPositions: bulbs, flowerBeads: beads };
  }, [points, blossomColors]);

  useEffect(() => {
    return () => {
      tubeGeo.dispose();
    };
  }, [tubeGeo]);

  const midPt = points[Math.floor(points.length / 2)];

  return (
    <group>
      {/* Vine & wire strand */}
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial color="#274723" roughness={0.85} />
      </mesh>

      {/* Floral garland blossom clusters */}
      {flowerBeads.map((fb, idx) => (
        <mesh key={`gfl-${idx}`} position={fb.pos}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color={fb.color} roughness={0.55} />
        </mesh>
      ))}

      {/* Miniature warm LED fairy bulbs */}
      {bulbPositions.map((bp, idx) => (
        <mesh key={`gled-${idx}`} position={bp}>
          <sphereGeometry args={[0.024, 6, 6]} />
          <meshStandardMaterial
            color="#fff6d6"
            emissive="#ffd26a"
            emissiveIntensity={2.3}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Subtle warm light pool illuminating the hanging tree frames */}
      <pointLight position={[midPt[0], midPt[1] - 0.35, midPt[2]]} intensity={5.2} color="#ffd588" distance={7.5} />
    </group>
  );
}

function Fireflies({ center }: { center: [number, number, number] }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 32;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = center[0] + Math.sin(i * 1.7) * 9.5;
      arr[i * 3 + 1] = 1.0 + ((i * 23) % 10) * 0.25;
      arr[i * 3 + 2] = center[2] + Math.cos(i * 1.3) * 9.5;
    }
    return arr;
  }, [center]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] = 1.2 + Math.sin(state.clock.elapsedTime * 1.1 + i) * 0.38 + (i % 3) * 0.4;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.085} color="#ffeaa0" transparent opacity={0.82} sizeAttenuation />
    </points>
  );
}

export default function MemoryGarden() {
  const photos = useGameStore((s) => s.photos);
  const textsMap = useGameStore((s) => s.textsMap);
  const gardenWelcomeText = textsMap.garden_welcome_text || 'Moonlit Garden of Memories';

  const gardenMemories = useMemo(
    () => photos.filter((p) => p.roomTarget === 'garden').slice(0, HANGING_SPECS.length),
    [photos]
  );

  // Deterministic flower instances inside raised beds + border edges
  const flowers = useMemo(() => {
    const items: Array<{
      pos: [number, number, number];
      color: string;
      phase: number;
      variety: FlowerVariety;
      scale: number;
    }> = [];

    FLOWER_BEDS.forEach((bed, bIdx) => {
      for (let i = 0; i < bed.count; i++) {
        const angle = (i / bed.count) * Math.PI * 2 + bIdx * 0.5;
        const rFrac = 0.28 + ((i * 37) % 10) * 0.068;
        const fx = bed.center[0] + Math.cos(angle) * bed.radiusX * rFrac;
        const fz = bed.center[2] + Math.sin(angle) * bed.radiusZ * rFrac;
        items.push({
          pos: [fx, 0, fz],
          color: bed.colors[i % bed.colors.length],
          phase: bIdx * 1.3 + i * 0.45,
          variety: bed.varieties[i % bed.varieties.length],
          scale: 0.92 + (i % 3) * 0.12,
        });
      }
    });
    return items;
  }, []);

  return (
    <group>
      {/* Single Seamless Night Meadow Grass Lawn tucked 4mm below Gallery marble slab */}
      <Floor position={[25.5, -0.004, -38.0]} size={[27.5, 28]} isGarden />
      {/* Natural stone threshold outside Garden Doorway [12, -33.5] */}
      <Floor position={[13.8, 0.003, -34.4]} size={[2.2, 2.8]} color="#9d968a" />

      {/* Subtle Garden Welcome Plaque overlooking waterfall */}
      <group position={[15.2, 0, -32.2]} rotation={[0, -0.68, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.055, 0.84, 10]} />
          <meshStandardMaterial color="#3c2a21" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.92, 0]} rotation={[-0.25, 0, 0]} castShadow>
          <boxGeometry args={[1.45, 0.42, 0.06]} />
          <meshStandardMaterial color="#1f2d22" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.92, 0.015]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[1.5, 0.46, 0.02]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.35} />
        </mesh>
        <Text
          position={[0, 0.92, 0.042]}
          rotation={[-0.25, 0, 0]}
          fontSize={0.095}
          maxWidth={1.32}
          color={COLORS.goldLight}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {gardenWelcomeText}
        </Text>
      </group>

      {/* Winding Natural Stone Pathway leading from Doorway around Waterfall Promenade */}
      {FLAGSTONE_PATH.map((st, i) => (
        <mesh
          key={`stone-${i}`}
          position={[st.pos[0], 0.016, st.pos[1]]}
          rotation={[-Math.PI / 2, 0, st.rot]}
          scale={[st.rx, st.rz, 1]}
          receiveShadow
        >
          <circleGeometry args={[1, 14]} />
          <meshStandardMaterial color="#8f897e" roughness={0.86} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}

      {/* Circular Stone Promenade Ring framing Central Waterfall & Pond */}
      <mesh position={[WATERFALL_CENTER[0], 0.014, WATERFALL_CENTER[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[2.65, 4.35, 36]} />
        <meshStandardMaterial color="#8d877c" roughness={0.82} polygonOffset polygonOffsetFactor={-1} />
      </mesh>

      {/* Raised Dark-Soil Bordered Flower Beds */}
      {FLOWER_BEDS.map((bed, idx) => (
        <group key={`fbed-${idx}`} position={bed.center}>
          <mesh position={[0, 0.025, 0]} scale={[bed.radiusX, 1, bed.radiusZ]} receiveShadow>
            <cylinderGeometry args={[1, 1.05, 0.05, 20]} />
            <meshStandardMaterial color="#2a1f18" roughness={0.96} />
          </mesh>
          <mesh
            position={[0, 0.05, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[bed.radiusX, bed.radiusZ, 1]}
          >
            <torusGeometry args={[1.0, 0.045, 6, 24]} />
            <meshStandardMaterial color="#4e463d" roughness={0.88} />
          </mesh>
        </group>
      ))}

      {/* Perimeter Garden Hedges cleanly outside Circular Gallery wall */}
      <GardenHedge position={[25.5, 1.1, -51.8]} size={[27.5, 2.2, 0.7]} />
      <GardenHedge position={[28.4, 1.1, -24.2]} size={[22.0, 2.2, 0.7]} />
      <GardenHedge position={[39.2, 1.1, -38.0]} size={[0.7, 2.2, 28.0]} />
      <GardenHedge position={[11.8, 1.1, -44.8]} size={[0.7, 2.2, 14.4]} />

      {/* Central Natural Multi-Tier Waterfall & Rippled Pond */}
      <Waterfall position={WATERFALL_CENTER} />

      {/* Interactive Romantic Garden Benches */}
      {GARDEN_BENCH_POSITIONS.map((b) => (
        <Bench
          key={b.id}
          position={b.position}
          rotation={[0, b.rotation, 0]}
          benchId={b.id}
          benchLabel={b.label}
          interactive
        />
      ))}

      {/* Detailed Multi-Part Garden Trees */}
      {TREE_SPECS.map((t, i) => (
        <Tree key={`gt-${i}`} position={t.pos} scale={t.scale} blossom={t.blossom} />
      ))}

      {/* Small Framed Couple Photographs Hanging from Tree Branches */}
      {gardenMemories.map((mem, idx) => {
        const spec = HANGING_SPECS[idx];
        if (!spec) return null;
        return (
          <PhotoFrame
            key={mem.id}
            position={spec.pos}
            rotation={spec.rot}
            memory={mem}
            size={[0.5, 0.37]}
            hanging
            ropeLength={spec.ropeLength}
          />
        );
      })}

      {/* Flower Garlands + Miniature Warm LED String Lights Draped Between Hanging Frames */}
      <TreeGarlandAndLights
        points={[
          [18.1, 3.04, -30.04],
          [18.85, 2.86, -29.96],
          [19.55, 3.12, -29.85],
          [20.25, 2.86, -30.02],
          [20.95, 3.04, -30.16],
        ]}
      />
      <TreeGarlandAndLights
        points={[
          [31.22, 3.08, -34.15],
          [30.98, 2.86, -35.05],
          [30.85, 3.16, -35.95],
          [31.02, 2.86, -36.85],
          [31.28, 3.06, -37.78],
        ]}
      />

      {/* Natural Bushes & Diverse Flower Varieties */}
      {BUSH_SPECS.map((b, i) => (
        <Bush key={`gb-${i}`} position={b.pos} scale={b.scale} />
      ))}

      {flowers.map((f, i) => (
        <Flower
          key={`gf-${i}`}
          position={f.pos}
          color={f.color}
          phaseOffset={f.phase}
          variety={f.variety}
          scale={f.scale}
        />
      ))}

      {/* Warm Garden Pathway Lanterns */}
      {GARDEN_LAMPS.map((lamp, i) => (
        <GardenLamp key={`gl-${i}`} position={lamp.pos} castGlow={lamp.glow} />
      ))}

      <Fireflies center={GARDEN_CENTER} />
    </group>
  );
}
