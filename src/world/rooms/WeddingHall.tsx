import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Floor from '../objects/Floor';
import Bench, { Flower } from '../objects/Decorations';
import WeddingEnvironment from './WeddingEnvironment';
import RosePetals from '../objects/RosePetals';
import WeddingFireworks from '../objects/WeddingFireworks';
import { COLORS } from '../../utils/constants';
import {
  WEDDING_ALTAR_CENTER,
  WEDDING_ARCH_POS,
  WEDDING_DOOR_POS,
  WEDDING_GUEST_SEATS,
} from '../../utils/museumLayout';
import { WEDDING_CAKE_TABLE_POS } from '../../utils/weddingCake';
import { useGameStore } from '../../store/gameStore';

const GUEST_ROW_SPECS: Array<{
  pos: [number, number, number];
  rotY: number;
  hasGuest: boolean;
  attireColor: string;
  skinColor: string;
  hairColor: string;
}> = [
  // Left guest column rows
  { pos: [-32.4, 0, -56.0], rotY: 1.35, hasGuest: true, attireColor: '#d998b0', skinColor: '#ecc4ab', hairColor: '#2a1c17' },
  { pos: [-34.4, 0, -56.0], rotY: 1.32, hasGuest: true, attireColor: '#3e4c68', skinColor: '#d6a485', hairColor: '#1e1612' },
  { pos: [-32.4, 0, -53.2], rotY: 1.42, hasGuest: true, attireColor: '#a6c4a9', skinColor: '#f0cbb4', hairColor: '#4c2c1b' },
  { pos: [-34.4, 0, -53.2], rotY: 1.38, hasGuest: false, attireColor: '#e5d4b8', skinColor: '#ecc4ab', hairColor: '#2a1c17' },
  { pos: [-32.4, 0, -50.2], rotY: 1.48, hasGuest: true, attireColor: '#c9b2d8', skinColor: '#c99374', hairColor: '#1a120f' },
  { pos: [-34.4, 0, -50.2], rotY: 1.46, hasGuest: true, attireColor: '#56647a', skinColor: '#e7be9e', hairColor: '#3a281d' },
  { pos: [-32.4, 0, -47.2], rotY: 1.52, hasGuest: true, attireColor: '#f2c1b6', skinColor: '#f0ccb6', hairColor: '#5c3c28' },
  { pos: [-34.4, 0, -47.2], rotY: 1.5, hasGuest: true, attireColor: '#2f394c', skinColor: '#ddb092', hairColor: '#1d1512' },
  { pos: [-32.4, 0, -44.2], rotY: 1.58, hasGuest: false, attireColor: '#d998b0', skinColor: '#ecc4ab', hairColor: '#2a1c17' },
  { pos: [-34.4, 0, -44.2], rotY: 1.58, hasGuest: true, attireColor: '#9db7ce', skinColor: '#e5baa0', hairColor: '#2c1e16' },
  // Right guest column rows
  { pos: [-20.6, 0, -56.0], rotY: -1.35, hasGuest: true, attireColor: '#3c4860', skinColor: '#e9c1a6', hairColor: '#1d1512' },
  { pos: [-18.6, 0, -56.0], rotY: -1.32, hasGuest: true, attireColor: '#e7b5c4', skinColor: '#f0ccb6', hairColor: '#4e2e1d' },
  { pos: [-20.6, 0, -53.2], rotY: -1.42, hasGuest: true, attireColor: '#d9c598', skinColor: '#cf9a7b', hairColor: '#1a1210' },
  { pos: [-18.6, 0, -53.2], rotY: -1.38, hasGuest: true, attireColor: '#4e675a', skinColor: '#ecc3a8', hairColor: '#2b1b15' },
  { pos: [-20.6, 0, -50.2], rotY: -1.48, hasGuest: false, attireColor: '#c9b2d8', skinColor: '#ecc4ab', hairColor: '#2a1c17' },
  { pos: [-18.6, 0, -50.2], rotY: -1.46, hasGuest: true, attireColor: '#e5a3b6', skinColor: '#f2ceb9', hairColor: '#664028' },
  { pos: [-20.6, 0, -47.2], rotY: -1.52, hasGuest: true, attireColor: '#374151', skinColor: '#dca88a', hairColor: '#1a1410' },
  { pos: [-18.6, 0, -47.2], rotY: -1.5, hasGuest: true, attireColor: '#b7d4c0', skinColor: '#ecc4ab', hairColor: '#382218' },
  { pos: [-20.6, 0, -44.2], rotY: -1.58, hasGuest: true, attireColor: '#c29db8', skinColor: '#e5baa0', hairColor: '#241812' },
  { pos: [-18.6, 0, -44.2], rotY: -1.58, hasGuest: false, attireColor: '#d998b0', skinColor: '#ecc4ab', hairColor: '#2a1c17' },
];

const CURTAIN_PLEAT_OFFSETS = [-0.48, -0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36, 0.48];
const CHANDELIER_SPOKES = [0, 1, 2, 3, 4, 5, 6, 7];

function PleatedCurtain({
  position,
  rotationY = 0,
  height = 4.9,
  color = '#fbf5ec',
  trimColor = '#d8b467',
  tieSide = 1,
  phaseOffset = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
  height?: number;
  color?: string;
  trimColor?: string;
  tieSide?: 1 | -1;
  phaseOffset?: number;
}) {
  const swayRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!swayRef.current) return;
    const t = clock.getElapsedTime() + phaseOffset;
    swayRef.current.rotation.z = Math.sin(t * 0.72) * 0.014;
    swayRef.current.rotation.x = Math.cos(t * 0.55) * 0.01;
  });

  const tieY = height * 0.38;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Top Curtain Rod & Finials */}
      <mesh position={[0, height + 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 1.24, 10]} />
        <meshStandardMaterial color={trimColor} metalness={0.55} roughness={0.26} />
      </mesh>
      {[-0.64, 0.64].map((fx, i) => (
        <mesh key={i} position={[fx, height + 0.05, 0]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.24} />
        </mesh>
      ))}

      {/* Gentle Fabric Sway Group */}
      <group ref={swayRef} position={[0, height, 0]}>
        <group position={[0, -height / 2, 0]}>
          {CURTAIN_PLEAT_OFFSETS.map((px, idx) => {
            const zWave = idx % 2 === 0 ? 0.045 : -0.045;
            const gatherX = px * 0.78 + tieSide * 0.06;
            return (
              <group key={idx}>
                {/* Upper gathered pleat */}
                <mesh
                  position={[px * 0.94, height * 0.16, zWave]}
                  rotation={[0, 0, -tieSide * 0.04]}
                  castShadow
                >
                  <cylinderGeometry args={[0.072, 0.058, height * 0.62, 10]} />
                  <meshStandardMaterial color={color} roughness={0.68} />
                </mesh>
                {/* Lower flowing drape flare */}
                <mesh
                  position={[gatherX * 0.9, -height * 0.28, zWave * 1.15]}
                  rotation={[0, 0, tieSide * 0.05]}
                  castShadow
                >
                  <cylinderGeometry args={[0.054, 0.088, height * 0.44, 8]} />
                  <meshStandardMaterial color={color} roughness={0.72} />
                </mesh>
              </group>
            );
          })}

          {/* Gold Tie-Back Cord & Crimson Rose Accent */}
          <mesh position={[tieSide * 0.04, tieY - height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.022, 8, 18]} />
            <meshStandardMaterial color={trimColor} metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[tieSide * 0.18, tieY - height / 2, 0.24]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color="#b81834" roughness={0.48} />
          </mesh>
          <mesh position={[tieSide * 0.1, tieY - height / 2 + 0.05, 0.23]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color="#f6cbd7" roughness={0.52} />
          </mesh>
        </group>

        {/* Scalloped Pelmet Valance */}
        <mesh position={[0, -0.14, 0.06]} castShadow>
          <boxGeometry args={[1.16, 0.26, 0.14]} />
          <meshStandardMaterial color={color} roughness={0.64} />
        </mesh>
        <mesh position={[0, -0.26, 0.12]}>
          <boxGeometry args={[1.18, 0.036, 0.04]} />
          <meshStandardMaterial color={trimColor} metalness={0.55} roughness={0.26} />
        </mesh>
      </group>
    </group>
  );
}

function LuxuryChandelier({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Suspension Chain Rod */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.84, 8]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.65} roughness={0.25} />
      </mesh>
      {/* Upper Crown & Lower Grand Gold Ring */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.032, 10, 24]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.68, 0.042, 10, 28]} />
        <meshStandardMaterial color={COLORS.goldLight} metalness={0.65} roughness={0.24} />
      </mesh>

      {/* Filigree Spokes & Crystal Finial */}
      {[0, 1, 2, 3].map((si) => (
        <mesh
          key={`sp-${si}`}
          position={[0, -0.24, 0]}
          rotation={[0, (si * Math.PI) / 4, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.012, 0.012, 1.34, 6]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.65} roughness={0.26} />
        </mesh>
      ))}
      <mesh position={[0, -0.36, 0]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshPhysicalMaterial
          color="#fff9eb"
          emissive="#ffe3a8"
          emissiveIntensity={0.95}
          roughness={0.08}
          clearcoat={1}
        />
      </mesh>

      {/* Warm Taper Candles & Hanging Crystal Teardrops */}
      {CHANDELIER_SPOKES.map((idx) => {
        const ang = (idx / CHANDELIER_SPOKES.length) * Math.PI * 2;
        const cx = Math.cos(ang) * 0.66;
        const cz = Math.sin(ang) * 0.66;
        const innerX = Math.cos(ang + 0.35) * 0.38;
        const innerZ = Math.sin(ang + 0.35) * 0.38;
        return (
          <group key={`cand-${idx}`}>
            <mesh position={[cx, -0.14, cz]}>
              <cylinderGeometry args={[0.02, 0.022, 0.14, 8]} />
              <meshStandardMaterial color="#fff9ee" roughness={0.45} />
            </mesh>
            <mesh position={[cx, -0.05, cz]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial
                color="#fff6d4"
                emissive="#ffd175"
                emissiveIntensity={2.6}
              />
            </mesh>
            <mesh position={[cx, -0.34, cz]}>
              <octahedronGeometry args={[0.042, 0]} />
              <meshPhysicalMaterial
                color="#fffdf8"
                emissive="#ffe9b8"
                emissiveIntensity={0.75}
                roughness={0.06}
                clearcoat={1}
              />
            </mesh>
            <mesh position={[innerX, -0.04, innerZ]}>
              <octahedronGeometry args={[0.038, 0]} />
              <meshPhysicalMaterial
                color="#fffdf8"
                emissive="#ffe7b0"
                emissiveIntensity={0.85}
                roughness={0.06}
                clearcoat={1}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function AisleLantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.085, 0.36, 10]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.24, 8]} />
        <meshPhysicalMaterial
          color="#fff4da"
          emissive="#ffcf78"
          emissiveIntensity={1.55}
          transparent
          opacity={0.92}
          roughness={0.18}
        />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <coneGeometry args={[0.1, 0.1, 8]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.55} roughness={0.26} />
      </mesh>
    </group>
  );
}

function ChiavariChair({
  position,
  rotationY,
  hasGuest,
  attireColor,
  skinColor,
  hairColor,
  isStanding,
}: {
  position: [number, number, number];
  rotationY: number;
  hasGuest: boolean;
  attireColor: string;
  skinColor: string;
  hairColor: string;
  isStanding: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Ivory-and-gold Chiavari frame */}
      {[-0.19, 0.19].map((lx) =>
        [-0.19, 0.19].map((lz) => (
          <mesh key={`leg-${lx}-${lz}`} position={[lx, 0.22, lz]} castShadow>
            <cylinderGeometry args={[0.02, 0.022, 0.44, 8]} />
            <meshStandardMaterial color="#f5ede0" roughness={0.35} />
          </mesh>
        ))
      )}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.05, 0.46]} />
        <meshStandardMaterial color="#f8e6ec" roughness={0.7} />
      </mesh>
      {/* Spindle Backrest */}
      {[-0.18, 0.18].map((bx) => (
        <mesh key={`post-${bx}`} position={[bx, 0.72, -0.2]} castShadow>
          <cylinderGeometry args={[0.018, 0.02, 0.56, 8]} />
          <meshStandardMaterial color="#f5ede0" roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.96, -0.2]} castShadow>
        <boxGeometry args={[0.42, 0.07, 0.04]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, -0.2]}>
        <boxGeometry args={[0.36, 0.04, 0.03]} />
        <meshStandardMaterial color="#f5ede0" roughness={0.4} />
      </mesh>
      {/* Chair Sash Bow */}
      <mesh position={[0, 0.84, -0.23]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.26, 0.09, 0.03]} />
        <meshPhysicalMaterial color="#d8a2b2" roughness={0.6} sheen={0.7} />
      </mesh>

      {/* Wedding Guest: Seated or Standing/Applauding */}
      {hasGuest &&
        (isStanding ? (
          <group position={[0, 0.02, 0.28]}>
            <mesh position={[0, 0.46, 0]} castShadow>
              <boxGeometry args={[0.28, 0.52, 0.22]} />
              <meshStandardMaterial color={attireColor} roughness={0.65} />
            </mesh>
            {[-0.08, 0.08].map((gx) => (
              <mesh key={`sl-${gx}`} position={[gx, 0.18, 0]}>
                <cylinderGeometry args={[0.045, 0.038, 0.44, 8]} />
                <meshStandardMaterial color="#2b262a" roughness={0.65} />
              </mesh>
            ))}
            {[-0.18, 0.18].map((ax, ai) => (
              <mesh
                key={`arm-${ai}`}
                position={[ax, 0.58, 0.08]}
                rotation={[ai === 0 ? 0.4 : -0.4, 0, ai === 0 ? -0.5 : 0.5]}
              >
                <cylinderGeometry args={[0.035, 0.03, 0.38, 8]} />
                <meshStandardMaterial color={attireColor} roughness={0.65} />
              </mesh>
            ))}
            <mesh position={[0, 0.84, 0]} castShadow>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.9, -0.02]}>
              <sphereGeometry args={[0.116, 12, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.85} />
            </mesh>
          </group>
        ) : (
          <group position={[0, 0.465, -0.02]}>
            <mesh position={[0, 0.06, 0]} castShadow>
              <boxGeometry args={[0.26, 0.12, 0.22]} />
              <meshStandardMaterial color={attireColor} roughness={0.68} />
            </mesh>
            <mesh position={[0, 0.27, -0.02]} castShadow>
              <cylinderGeometry args={[0.14, 0.12, 0.34, 10]} />
              <meshStandardMaterial color={attireColor} roughness={0.62} />
            </mesh>
            {[-0.08, 0.08].map((gx) => (
              <group key={`gl-${gx}`}>
                <mesh position={[gx, 0.06, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.052, 0.046, 0.28, 8]} />
                  <meshStandardMaterial color={attireColor} roughness={0.7} />
                </mesh>
                <mesh position={[gx, -0.18, 0.26]}>
                  <cylinderGeometry args={[0.042, 0.036, 0.44, 8]} />
                  <meshStandardMaterial color="#2b262a" roughness={0.65} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.56, 0.01]} castShadow>
              <sphereGeometry args={[0.105, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.61, -0.015]}>
              <sphereGeometry args={[0.112, 12, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.85} />
            </mesh>
          </group>
        ))}
    </group>
  );
}

function FloralUrnPillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.96, 0.42]} />
          <meshStandardMaterial color="#f5efe6" roughness={0.4} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 0.96, 0]}>
        <boxGeometry args={[0.48, 0.06, 0.48]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.24, 0.16, 0.16, 12]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.42} roughness={0.28} />
      </mesh>
      {/* Rich Red Rose, Blush & Ivory Arrangement */}
      {[
        { p: [0, 1.25, 0] as [number, number, number], r: 0.19, c: '#b81834' },
        { p: [-0.14, 1.2, 0.1] as [number, number, number], r: 0.14, c: '#fff5f7' },
        { p: [0.15, 1.19, -0.08] as [number, number, number], r: 0.14, c: '#f7b2c4' },
        { p: [0.04, 1.17, 0.15] as [number, number, number], r: 0.13, c: '#d42648' },
        { p: [-0.12, 1.15, -0.12] as [number, number, number], r: 0.12, c: '#7fa884' },
      ].map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <sphereGeometry args={[b.r, 10, 8]} />
          <meshStandardMaterial color={b.c} roughness={0.58} />
        </mesh>
      ))}
    </group>
  );
}

function Balustrade({
  position,
  length,
  rotationY = 0,
}: {
  position: [number, number, number];
  length: number;
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[length, 0.96, 0.36]} />
          <meshStandardMaterial color="#f2eadf" roughness={0.42} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[length + 0.1, 0.1, 0.46]} />
        <meshStandardMaterial color="#e6dccd" roughness={0.38} />
      </mesh>
    </group>
  );
}

export default function WeddingHall() {
  const textsMap = useGameStore((s) => s.textsMap);
  const weddingTitle = textsMap.wedding_door_title || 'OUR WEDDING DAY';
  const weddingStage = useGameStore((s) => s.weddingStage);
  const cakeHasBeenCut = useGameStore((s) => s.cakeHasBeenCut);
  const cakeCuttingStage = useGameStore((s) => s.cakeCuttingStage);
  const isStandingGuests =
    weddingStage === 'vows' ||
    weddingStage === 'hug' ||
    weddingStage === 'celebrating' ||
    cakeCuttingStage !== 'idle';

  const aisleFlowers = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; color: string; idx: number }> = [];
    const zs = [-40.0, -43.0, -46.0, -49.0, -52.0, -55.0, -57.8];
    zs.forEach((z, idx) => {
      items.push({
        pos: [-28.05, 0, z],
        color: idx % 2 === 0 ? '#b81834' : '#fff5f7',
        idx: idx * 2,
      });
      items.push({
        pos: [-24.95, 0, z],
        color: idx % 2 === 0 ? '#fff5f7' : '#d42648',
        idx: idx * 2 + 1,
      });
    });
    return items;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.code !== 'KeyE') return;
      const s = useGameStore.getState();
      if (
        s.showPhotoViewer ||
        s.showGuestbookModal ||
        s.showVideoPlayer ||
        s.showLoveAlbum ||
        s.showAdminLogin ||
        s.showAdminPanel ||
        s.showSecretLetterModal ||
        s.showOutfitCustomizer
      ) {
        return;
      }
      if (s.nearbyInteractable === 'wedding-exit') {
        s.exitWeddingHall();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useFrame(() => {
    const s = useGameStore.getState();
    const px = s.playerPosition.x;
    const pz = s.playerPosition.z;
    const exitDist =
      s.currentRoom === 'wedding'
        ? Math.hypot(px - WEDDING_DOOR_POS[0], pz - WEDDING_DOOR_POS[2])
        : 999;

    if (exitDist < 3.4) {
      if (s.nearbyInteractable !== 'wedding-exit') {
        s.setNearbyInteractable('wedding-exit');
      }
    } else if (s.nearbyInteractable === 'wedding-exit') {
      s.setNearbyInteractable(null);
    }
  });

  return (
    <group name="OurWeddingDay">
      <WeddingEnvironment />
      <RosePetals />
      <WeddingFireworks />

      {/* Main Sunlit Travertine Wedding Courtyard Terrace */}
      <Floor position={[-26.5, 0, -51.0]} size={[28, 33]} color="#efe5d5" />
      {/* Sunlit Breezeway Connecting North-West Gallery Archway to Courtyard Arrival */}
      <Floor position={[-16.2, 0, -35.8]} size={[11.5, 7.6]} color="#efe5d5" />

      {/* Open-Air Marble Balustrade Border */}
      <Balustrade position={[-40.3, 0, -51.0]} length={32.4} rotationY={Math.PI / 2} />
      <Balustrade position={[-26.5, 0, -67.2]} length={27.8} />
      <Balustrade position={[-12.6, 0, -52.2]} length={30.0} rotationY={Math.PI / 2} />
      <Balustrade position={[-31.2, 0, -34.8]} length={18.6} />
      <Balustrade position={[-21.9, 0, -33.5]} length={2.6} rotationY={Math.PI / 2} />
      <Balustrade position={[-18.3, 0, -32.15]} length={7.2} />
      <Balustrade position={[-11.2, 0, -36.4]} length={3.1} rotationY={-0.51} />

      {/* Central Ivory & Champagne-Gold Wedding Aisle Runner */}
      <mesh position={[WEDDING_ALTAR_CENTER[0], 0.012, -48.6]} receiveShadow>
        <boxGeometry args={[2.5, 0.018, 22.0]} />
        <meshStandardMaterial color="#fbf6ee" roughness={0.78} />
      </mesh>
      {[-27.72, -25.28].map((gx, idx) => (
        <mesh key={`trim-${idx}`} position={[gx, 0.016, -48.6]} receiveShadow>
          <boxGeometry args={[0.09, 0.018, 22.0]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.3} />
        </mesh>
      ))}

      {/* Floral Urn Columns, Red Roses & Warm Aisle Lanterns */}
      {[-42.2, -48.6, -55.0].map((z, idx) => (
        <group key={`urn-row-${idx}`}>
          <FloralUrnPillar position={[-28.05, 0, z]} />
          <FloralUrnPillar position={[-24.95, 0, z]} />
        </group>
      ))}
      {[-40.5, -45.4, -51.8, -56.8].map((z, idx) => (
        <group key={`lantern-row-${idx}`}>
          <AisleLantern position={[-28.05, 0, z]} />
          <AisleLantern position={[-24.95, 0, z]} />
        </group>
      ))}
      {aisleFlowers.map((fl) => (
        <Flower
          key={`wf-${fl.idx}`}
          position={fl.pos}
          color={fl.color}
          variety="rose"
          phaseOffset={fl.idx * 0.4}
          scale={1.18}
        />
      ))}

      {/* Overhead White-Silk Pergola Bays, Pleated Side Curtains & Crystal Chandeliers */}
      {[-43.5, -49.5, -55.5].map((z, idx) => (
        <group key={`pergola-${idx}`} position={[-26.5, 0, z]}>
          {/* Fluted Columns & Gold Rings */}
          {[-3.25, 3.25].map((cx, ci) => (
            <group key={`pc-${ci}`} position={[cx, 0, 0]}>
              <mesh position={[0, 0.18, 0]} castShadow>
                <boxGeometry args={[0.42, 0.36, 0.42]} />
                <meshStandardMaterial color="#eee5d6" roughness={0.4} />
              </mesh>
              <mesh position={[0, 2.38, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.145, 4.7, 12]} />
                <meshStandardMaterial color="#f6f0e6" roughness={0.38} />
              </mesh>
              <mesh position={[0, 4.66, 0]}>
                <boxGeometry args={[0.38, 0.14, 0.38]} />
                <meshStandardMaterial color={COLORS.gold} metalness={0.45} roughness={0.28} />
              </mesh>
            </group>
          ))}

          {/* Overhead Pergola Crossbeam & Gold Trim */}
          <mesh position={[0, 4.78, 0]} castShadow>
            <boxGeometry args={[7.1, 0.18, 0.26]} />
            <meshStandardMaterial color="#f6f0e6" roughness={0.38} />
          </mesh>
          <mesh position={[0, 4.66, 0]}>
            <boxGeometry args={[6.9, 0.05, 0.3]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.45} roughness={0.28} />
          </mesh>

          {/* Draped Sheer Silk Swag */}
          <mesh position={[0, 4.56, 0]}>
            <boxGeometry args={[6.1, 0.04, 1.05]} />
            <meshPhysicalMaterial
              color="#fff9f4"
              transparent
              opacity={0.82}
              roughness={0.68}
              sheen={0.8}
            />
          </mesh>

          {/* Pleated Luxury Side Curtains tied cleanly to pergola columns */}
          <PleatedCurtain
            position={[-2.95, 0.02, 0]}
            rotationY={Math.PI / 2}
            height={4.65}
            color="#fbf4ea"
            tieSide={1}
            phaseOffset={idx * 1.1}
          />
          <PleatedCurtain
            position={[2.95, 0.02, 0]}
            rotationY={-Math.PI / 2}
            height={4.65}
            color="#fbf4ea"
            tieSide={-1}
            phaseOffset={idx * 1.1 + 0.6}
          />

          {/* Grand Crystal & Gold Chandelier (lit via Lighting.tsx room pool) */}
          <LuxuryChandelier position={[0, 4.24, 0]} scale={0.92} />
        </group>
      ))}

      {/* Grand Ceremony Stage, Pleated Backdrop Curtains, Spotlights & Red-Rose Floral Arch */}
      <group position={WEDDING_ARCH_POS}>
        {/* Elevated Travertine Stage Platform with Gold Step Trim */}
        <mesh position={[0, 0.015, 0.85]} receiveShadow>
          <boxGeometry args={[7.6, 0.03, 3.8]} />
          <meshStandardMaterial color="#f7efe4" roughness={0.36} />
        </mesh>
        <mesh position={[0, 0.032, 2.74]}>
          <boxGeometry args={[7.64, 0.035, 0.06]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.5} roughness={0.28} />
        </mesh>

        {/* Ornamental Champagne & Blush Backdrop Panels Behind Stage */}
        {[-3.45, 3.45].map((px, idx) => (
          <group key={`stage-panel-${idx}`} position={[px, 2.4, -0.45]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.35, 4.8, 0.14]} />
              <meshStandardMaterial color="#f5ecdf" roughness={0.42} />
            </mesh>
            <mesh position={[0, 0, 0.08]}>
              <boxGeometry args={[1.05, 4.35, 0.025]} />
              <meshStandardMaterial color={COLORS.gold} metalness={0.48} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.098]}>
              <boxGeometry args={[0.95, 4.22, 0.022]} />
              <meshPhysicalMaterial color="#fff8f5" roughness={0.62} sheen={0.65} />
            </mesh>
          </group>
        ))}

        {/* Tall Pleated Velvet-Blush & Ivory Stage Curtains */}
        <PleatedCurtain
          position={[-2.95, 0.02, -0.22]}
          height={5.0}
          color="#f9eff0"
          tieSide={-1}
          phaseOffset={0.4}
        />
        <PleatedCurtain
          position={[2.95, 0.02, -0.22]}
          height={5.0}
          color="#f9eff0"
          tieSide={1}
          phaseOffset={1.3}
        />
        <PleatedCurtain
          position={[-4.05, 0.02, -0.35]}
          height={4.85}
          color="#961c3a"
          tieSide={-1}
          phaseOffset={2.1}
        />
        <PleatedCurtain
          position={[4.05, 0.02, -0.35]}
          height={4.85}
          color="#961c3a"
          tieSide={1}
          phaseOffset={2.8}
        />

        {/* Overhead Stage Canopy Truss + Stage Crown Chandelier + Subtle Warm Spotlight Glow */}
        <mesh position={[0, 5.18, 0.18]} castShadow>
          <boxGeometry args={[8.4, 0.18, 0.28]} />
          <meshStandardMaterial color="#f4eadb" roughness={0.38} />
        </mesh>
        <LuxuryChandelier position={[0, 4.78, 1.15]} scale={1.08} />
        {[-1.35, 1.35].map((sx, idx) => (
          <mesh key={`beam-${idx}`} position={[sx, 2.75, 0.72]} rotation={[0.16, 0, sx > 0 ? 0.12 : -0.12]}>
            <coneGeometry args={[1.35, 4.6, 18, 1, true]} />
            <meshBasicMaterial
              color="#fff4d8"
              transparent
              opacity={0.045}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {/* Corinthian Arch Columns */}
        {[-2.35, 2.35].map((ax, idx) => (
          <group key={`col-${idx}`} position={[ax, 0, 0]}>
            <RigidBody type="fixed" colliders="cuboid">
              <mesh position={[0, 2.0, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.24, 4.0, 14]} />
                <meshStandardMaterial color="#f8f2e8" roughness={0.35} />
              </mesh>
            </RigidBody>
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.64, 0.36, 0.64]} />
              <meshStandardMaterial color="#ede3d3" roughness={0.4} />
            </mesh>
            <mesh position={[0, 3.98, 0]}>
              <boxGeometry args={[0.64, 0.28, 0.64]} />
              <meshStandardMaterial color={COLORS.gold} metalness={0.42} roughness={0.28} />
            </mesh>
            {/* Climbing Red Rose, Blush & Ivory Blooms */}
            {[0.85, 1.55, 2.25, 3.05, 3.78].map((fy, fidx) => (
              <group
                key={`cf-${fidx}`}
                position={[ax > 0 ? -0.18 : 0.18, fy, 0.18]}
              >
                <mesh castShadow>
                  <sphereGeometry args={[0.2, 10, 8]} />
                  <meshStandardMaterial
                    color={fidx % 3 === 0 ? '#b81834' : fidx % 3 === 1 ? '#f8bfd0' : '#fff7f8'}
                    roughness={0.58}
                  />
                </mesh>
                <mesh position={[ax > 0 ? 0.08 : -0.08, -0.08, 0.06]}>
                  <sphereGeometry args={[0.12, 8, 8]} />
                  <meshStandardMaterial color="#7da882" roughness={0.72} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Sweeping Semi-Circular Red-Rose & Champagne Floral Ceremony Arch */}
        <mesh position={[0, 3.95, 0]}>
          <torusGeometry args={[2.35, 0.16, 10, 32, Math.PI]} />
          <meshStandardMaterial color="#f8f1e6" roughness={0.42} />
        </mesh>
        {[-2.1, -1.55, -0.95, -0.35, 0.35, 0.95, 1.55, 2.1].map((angX, i) => {
          const y = 3.95 + Math.sqrt(Math.max(0, 2.35 * 2.35 - angX * angX));
          const bloomColors = ['#b81834', '#f7b2c4', '#fff8f9', '#d42648'];
          return (
            <group key={`arch-bloom-${i}`} position={[angX, y, 0.12]}>
              <mesh castShadow>
                <sphereGeometry args={[0.23, 10, 8]} />
                <meshStandardMaterial
                  color={bloomColors[i % bloomColors.length]}
                  roughness={0.58}
                />
              </mesh>
              <mesh position={[0.14, -0.06, -0.06]}>
                <sphereGeometry args={[0.14, 8, 8]} />
                <meshStandardMaterial color="#7da882" roughness={0.75} />
              </mesh>
            </group>
          );
        })}

        {/* Draped Silk Veil & Ceremony Crest */}
        <mesh position={[-2.05, 2.25, -0.14]}>
          <boxGeometry args={[0.55, 3.8, 0.08]} />
          <meshPhysicalMaterial color="#fffaf5" transparent opacity={0.86} roughness={0.68} sheen={0.7} />
        </mesh>
        <mesh position={[2.05, 2.25, -0.14]}>
          <boxGeometry args={[0.55, 3.8, 0.08]} />
          <meshPhysicalMaterial color="#fffaf5" transparent opacity={0.86} roughness={0.68} sheen={0.7} />
        </mesh>
        <mesh position={[0, 4.98, 0.1]}>
          <boxGeometry args={[4.1, 0.58, 0.12]} />
          <meshStandardMaterial color="#fff9f1" roughness={0.4} />
        </mesh>
        <mesh position={[0, 4.98, 0.08]}>
          <boxGeometry args={[4.2, 0.66, 0.08]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.45} roughness={0.28} />
        </mesh>
        <Text
          position={[0, 4.98, 0.18]}
          fontSize={0.25}
          color="#8a6220"
          anchorX="center"
          letterSpacing={0.1}
          font={undefined}
        >
          {weddingTitle.toUpperCase()}
        </Text>
      </group>

      {/* Interactive Front & Mid Ceremony Pews */}
      {WEDDING_GUEST_SEATS.map((seat) => (
        <Bench
          key={seat.id}
          position={seat.position}
          rotation={[0, seat.rotation, 0]}
          benchId={seat.id}
          benchLabel={seat.label}
          interactive
        />
      ))}

      {/* Decorative Chiavari Chairs & Seated / Applauding Wedding Guests */}
      {GUEST_ROW_SPECS.map((g, idx) => (
        <ChiavariChair
          key={`guest-seat-${idx}`}
          position={g.pos}
          rotationY={g.rotY}
          hasGuest={g.hasGuest}
          attireColor={g.attireColor}
          skinColor={g.skinColor}
          hairColor={g.hairColor}
          isStanding={isStandingGuests}
        />
      ))}

      {/* Ornate Wedding Cake Pavilion & 3-Tier Floral Cake */}
      <group position={WEDDING_CAKE_TABLE_POS}>
        {/* Pleated Ivory Reception Tablecloth & Gold Rim */}
        <RigidBody type="fixed" colliders="hull">
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 0.92, 0.96, 24]} />
            <meshPhysicalMaterial color="#fbf7f2" roughness={0.72} sheen={0.6} sheenColor="#ffffff" />
          </mesh>
        </RigidBody>
        <mesh position={[0, 0.955, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.85, 0.022, 8, 28]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.55} roughness={0.26} />
        </mesh>

        {/* Gold Cake Stand Pedestal */}
        <mesh position={[0, 0.985, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.48, 0.04, 22]} />
          <meshStandardMaterial color={COLORS.goldLight} metalness={0.6} roughness={0.24} />
        </mesh>

        {/* Base Floral Garland Ring (Red Roses & Blush Buds) */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const ang = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={`cgr-${i}`}
              position={[Math.cos(ang) * 0.43, 1.03, Math.sin(ang) * 0.43]}
              castShadow
            >
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#b81834' : '#f7bfd0'}
                roughness={0.55}
              />
            </mesh>
          );
        })}

        {/* 3-Tier Wedding Cake with Gold Ribbons & Rose Accents */}
        <mesh position={[0, 1.12, 0]} castShadow>
          <cylinderGeometry args={[0.37, 0.39, 0.24, 22]} />
          <meshPhysicalMaterial color="#fffaf4" roughness={0.42} sheen={0.5} />
        </mesh>
        <mesh position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.385, 0.014, 8, 24]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.5} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.33, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.275, 0.2, 20]} />
          <meshPhysicalMaterial color="#fff5f7" roughness={0.42} sheen={0.5} />
        </mesh>
        <mesh position={[0, 1.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.012, 8, 22]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.5} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.165, 0.175, 0.16, 18]} />
          <meshPhysicalMaterial color="#fffaf4" roughness={0.42} sheen={0.5} />
        </mesh>
        {/* Topper Red Rose Cluster & Gold Crest Ring */}
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.068, 10, 8]} />
          <meshStandardMaterial color="#b81834" roughness={0.48} />
        </mesh>
        <mesh position={[0.055, 1.59, 0.04]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#f6cbd7" roughness={0.52} />
        </mesh>
        <mesh position={[0, 1.71, 0]}>
          <torusGeometry args={[0.075, 0.012, 8, 18]} />
          <meshStandardMaterial color={COLORS.goldLight} metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Visible Cut Seam Wedge Marker once Cake Has Been Cut */}
        {cakeHasBeenCut && (
          <mesh position={[0, 1.13, -0.27]}>
            <boxGeometry args={[0.085, 0.22, 0.24]} />
            <meshStandardMaterial color="#f4c4ce" roughness={0.58} />
          </mesh>
        )}

        {/* Chilled Champagne Bucket & Two Crystal Flutes (South side of table) */}
        <group position={[-0.36, 0.96, 0.36]}>
          <mesh position={[0, 0.11, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.075, 0.22, 14]} />
            <meshStandardMaterial color="#d8dde4" metalness={0.78} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.24, 0.02]} rotation={[0.22, 0, -0.15]}>
            <cylinderGeometry args={[0.026, 0.042, 0.26, 10]} />
            <meshStandardMaterial color="#2b4a2f" roughness={0.25} />
          </mesh>
        </group>
        {[-0.08, 0.08].map((fx, fi) => (
          <group key={`flute-${fi}`} position={[0.32 + fx, 0.96, 0.44]}>
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.006, 0.03, 0.14, 8]} />
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.7} roughness={0.08} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.024, 0.016, 0.09, 10]} />
              <meshPhysicalMaterial color="#fff2c8" transparent opacity={0.78} roughness={0.1} />
            </mesh>
          </group>
        ))}

        {/* Two Porcelain Tasting Plates & Resting Silver Cake Knife on North Side Facing Couple */}
        {[
          [-0.26, 0.975, -0.54],
          [0.26, 0.975, -0.54],
        ].map((pp, idx) => (
          <group key={`plate-${idx}`} position={pp as [number, number, number]}>
            <mesh>
              <cylinderGeometry args={[0.125, 0.095, 0.02, 16]} />
              <meshStandardMaterial color="#fffdf8" roughness={0.22} />
            </mesh>
            {cakeHasBeenCut && (
              <mesh position={[0, 0.032, 0]}>
                <boxGeometry args={[0.085, 0.048, 0.06]} />
                <meshStandardMaterial color="#fff2f5" roughness={0.48} />
              </mesh>
            )}
          </group>
        ))}

        {cakeCuttingStage !== 'cutting' && (
          <group position={[0, 0.982, -0.56]} rotation={[0, Math.PI / 2 + 0.25, 0]}>
            <mesh position={[0.08, 0, 0]}>
              <boxGeometry args={[0.16, 0.012, 0.022]} />
              <meshStandardMaterial color={COLORS.goldLight} metalness={0.65} roughness={0.25} />
            </mesh>
            <mesh position={[-0.08, 0, 0]}>
              <boxGeometry args={[0.18, 0.008, 0.028]} />
              <meshStandardMaterial color="#e8edf2" metalness={0.85} roughness={0.15} />
            </mesh>
          </group>
        )}

        {cakeCuttingStage === 'idle' && (
          <Text
            position={[0, 2.02, 0]}
            rotation={[0, 0.45, 0]}
            fontSize={0.12}
            color="#8a6220"
            anchorX="center"
            letterSpacing={0.08}
            font={undefined}
          >
            CAKE PAVILION
          </Text>
        )}
      </group>
    </group>
  );
}
