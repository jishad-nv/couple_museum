import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Floor from '../objects/Floor';
import Bench, { Flower } from '../objects/Decorations';
import { COLORS } from '../../utils/constants';
import {
  WEDDING_ALTAR_CENTER,
  WEDDING_ARCH_POS,
  WEDDING_DOOR_POS,
  WEDDING_GUEST_SEATS,
} from '../../utils/museumLayout';
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
  { pos: [-34.4, 0, -47.2], rotY: 1.50, hasGuest: true, attireColor: '#2f394c', skinColor: '#ddb092', hairColor: '#1d1512' },
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
  { pos: [-18.6, 0, -47.2], rotY: -1.50, hasGuest: true, attireColor: '#b7d4c0', skinColor: '#ecc4ab', hairColor: '#382218' },
  { pos: [-20.6, 0, -44.2], rotY: -1.58, hasGuest: true, attireColor: '#c29db8', skinColor: '#e5baa0', hairColor: '#241812' },
  { pos: [-18.6, 0, -44.2], rotY: -1.58, hasGuest: false, attireColor: '#d998b0', skinColor: '#ecc4ab', hairColor: '#2a1c17' },
];

function ChiavariChair({
  position,
  rotationY,
  hasGuest,
  attireColor,
  skinColor,
  hairColor,
}: {
  position: [number, number, number];
  rotationY: number;
  hasGuest: boolean;
  attireColor: string;
  skinColor: string;
  hairColor: string;
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

      {/* Seated Wedding Guest */}
      {hasGuest && (
        <group position={[0, 0.465, -0.02]}>
          {/* Seated hips + torso */}
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.26, 0.12, 0.22]} />
            <meshStandardMaterial color={attireColor} roughness={0.68} />
          </mesh>
          <mesh position={[0, 0.27, -0.02]} castShadow>
            <cylinderGeometry args={[0.14, 0.12, 0.34, 10]} />
            <meshStandardMaterial color={attireColor} roughness={0.62} />
          </mesh>
          {/* Seated thighs & vertical calves */}
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
          {/* Head & hair */}
          <mesh position={[0, 0.56, 0.01]} castShadow>
            <sphereGeometry args={[0.105, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.61, -0.015]}>
            <sphereGeometry args={[0.112, 12, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.85} />
          </mesh>
        </group>
      )}
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
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.22, 0.16, 0.14, 12]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.32} />
      </mesh>
      {/* Lush Blush & Ivory Floral Bouquet */}
      {[
        { p: [0, 1.2, 0] as [number, number, number], r: 0.22, c: '#fff5f7' },
        { p: [-0.14, 1.15, 0.1] as [number, number, number], r: 0.14, c: '#f7b2c4' },
        { p: [0.15, 1.14, -0.08] as [number, number, number], r: 0.14, c: '#fbd1dc' },
        { p: [0.04, 1.12, 0.15] as [number, number, number], r: 0.12, c: '#a2c9a6' },
      ].map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <sphereGeometry args={[b.r, 10, 8]} />
          <meshStandardMaterial color={b.c} roughness={0.65} />
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

  const aisleFlowers = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; color: string; idx: number }> = [];
    const zs = [-40.0, -43.0, -46.0, -49.0, -52.0, -55.0, -57.8];
    zs.forEach((z, idx) => {
      items.push({
        pos: [-28.05, 0, z],
        color: idx % 2 === 0 ? '#f7b2c4' : '#fff5f7',
        idx: idx * 2,
      });
      items.push({
        pos: [-24.95, 0, z],
        color: idx % 2 === 0 ? '#fff5f7' : '#f7b2c4',
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
      {/* Main Sunlit Travertine Wedding Courtyard Terrace */}
      <Floor position={[-26.5, 0, -51.0]} size={[28, 33]} color="#efe5d5" />
      {/* Sunlit Breezeway Connecting North-West Gallery Archway to Courtyard Arrival */}
      <Floor position={[-16.2, 0, -35.8]} size={[11.5, 7.6]} color="#efe5d5" />

      {/* Open-Air Marble Balustrade Border (keeping breezeway entry wide open!) */}
      <Balustrade position={[-40.3, 0, -51.0]} length={32.4} rotationY={Math.PI / 2} />
      <Balustrade position={[-26.5, 0, -67.2]} length={27.8} />
      <Balustrade position={[-12.6, 0, -52.2]} length={30.0} rotationY={Math.PI / 2} />
      <Balustrade position={[-35.0, 0, -34.8]} length={11.0} />

      {/* Central Ivory & Blush-Gold Wedding Aisle Runner */}
      <mesh position={[WEDDING_ALTAR_CENTER[0], 0.012, -48.6]} receiveShadow>
        <boxGeometry args={[2.5, 0.018, 22.0]} />
        <meshStandardMaterial color="#fbf6ee" roughness={0.78} />
      </mesh>
      {[-27.72, -25.28].map((gx, idx) => (
        <mesh key={`trim-${idx}`} position={[gx, 0.016, -48.6]} receiveShadow>
          <boxGeometry args={[0.08, 0.018, 22.0]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.28} roughness={0.35} />
        </mesh>
      ))}

      {/* Floral Urn Columns & Garden Roses Framing the Aisle */}
      {[-42.2, -48.6, -55.0].map((z, idx) => (
        <group key={`urn-row-${idx}`}>
          <FloralUrnPillar position={[-28.05, 0, z]} />
          <FloralUrnPillar position={[-24.95, 0, z]} />
        </group>
      ))}
      {aisleFlowers.map((fl) => (
        <Flower
          key={`wf-${fl.idx}`}
          position={fl.pos}
          color={fl.color}
          variety="rose"
          phaseOffset={fl.idx * 0.4}
          scale={1.15}
        />
      ))}

      {/* Overhead White-Silk Pergola Beams & Hanging Floral Chandeliers */}
      {[-43.5, -49.5, -55.5].map((z, idx) => (
        <group key={`pergola-${idx}`} position={[-26.5, 0, z]}>
          <mesh position={[-3.2, 2.35, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 4.7, 10]} />
            <meshStandardMaterial color="#f6f0e6" roughness={0.38} />
          </mesh>
          <mesh position={[3.2, 2.35, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 4.7, 10]} />
            <meshStandardMaterial color="#f6f0e6" roughness={0.38} />
          </mesh>
          <mesh position={[0, 4.72, 0]} castShadow>
            <boxGeometry args={[6.8, 0.14, 0.22]} />
            <meshStandardMaterial color="#f6f0e6" roughness={0.38} />
          </mesh>
          {/* Draped sheer white silk canopy */}
          <mesh position={[0, 4.55, 0]}>
            <boxGeometry args={[5.8, 0.04, 0.9]} />
            <meshStandardMaterial color="#fff9f4" transparent opacity={0.78} roughness={0.7} />
          </mesh>
          {/* Hanging Floral Crystal Ring */}
          <mesh position={[0, 4.18, 0]}>
            <torusGeometry args={[0.42, 0.045, 8, 20]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.28} />
          </mesh>
        </group>
      ))}

      {/* Grand Ceremony Arch & Altar Backdrop */}
      <group position={WEDDING_ARCH_POS}>
        {/* Thin low ceremonial marble rug step behind altar positions */}
        <mesh position={[0, 0.015, 0.8]} receiveShadow>
          <boxGeometry args={[6.2, 0.03, 3.2]} />
          <meshStandardMaterial color="#f7efe4" roughness={0.36} />
        </mesh>

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
              <boxGeometry args={[0.62, 0.36, 0.62]} />
              <meshStandardMaterial color="#ede3d3" roughness={0.4} />
            </mesh>
            <mesh position={[0, 3.98, 0]}>
              <boxGeometry args={[0.62, 0.28, 0.62]} />
              <meshStandardMaterial color={COLORS.gold} metalness={0.28} roughness={0.35} />
            </mesh>
            {/* Climbing Blush & Ivory Flowers */}
            {[1.1, 2.1, 3.1, 3.85].map((fy, fidx) => (
              <mesh
                key={`cf-${fidx}`}
                position={[ax > 0 ? -0.18 : 0.18, fy, 0.18]}
                castShadow
              >
                <sphereGeometry args={[0.22, 10, 8]} />
                <meshStandardMaterial
                  color={fidx % 2 === 0 ? '#f8bfd0' : '#fff7f8'}
                  roughness={0.62}
                />
              </mesh>
            ))}
          </group>
        ))}

        {/* Sweeping Semi-Circular Floral Ceremony Arch */}
        <mesh position={[0, 3.95, 0]}>
          <torusGeometry args={[2.35, 0.16, 10, 32, Math.PI]} />
          <meshStandardMaterial color="#f8f1e6" roughness={0.45} />
        </mesh>
        {[-1.9, -1.2, -0.45, 0.45, 1.2, 1.9].map((angX, i) => {
          const y = 3.95 + Math.sqrt(Math.max(0, 2.35 * 2.35 - angX * angX));
          return (
            <group key={`arch-bloom-${i}`} position={[angX, y, 0.12]}>
              <mesh>
                <sphereGeometry args={[0.24, 10, 8]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? '#f7b2c4' : '#fff8f9'}
                  roughness={0.6}
                />
              </mesh>
              <mesh position={[0.14, -0.06, -0.06]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial color="#96c49a" roughness={0.75} />
              </mesh>
            </group>
          );
        })}

        {/* Draped Silk Veil & Ceremony Crest */}
        <mesh position={[-2.05, 2.25, -0.14]}>
          <boxGeometry args={[0.55, 3.8, 0.08]} />
          <meshStandardMaterial color="#fffaf5" transparent opacity={0.86} roughness={0.68} />
        </mesh>
        <mesh position={[2.05, 2.25, -0.14]}>
          <boxGeometry args={[0.55, 3.8, 0.08]} />
          <meshStandardMaterial color="#fffaf5" transparent opacity={0.86} roughness={0.68} />
        </mesh>
        <mesh position={[0, 4.95, 0.1]}>
          <boxGeometry args={[3.9, 0.56, 0.12]} />
          <meshStandardMaterial color="#fff9f1" roughness={0.42} />
        </mesh>
        <Text
          position={[0, 4.95, 0.18]}
          fontSize={0.25}
          color="#8a6220"
          anchorX="center"
          letterSpacing={0.1}
          font={undefined}
        >
          {weddingTitle.toUpperCase()}
        </Text>
      </group>

      {/* Interactive Front & Mid Ceremony Pews (couple can sit side by side cleanly) */}
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

      {/* Decorative Chiavari Chairs & Seated Wedding Guests */}
      {GUEST_ROW_SPECS.map((g, idx) => (
        <ChiavariChair
          key={`guest-seat-${idx}`}
          position={g.pos}
          rotationY={g.rotY}
          hasGuest={g.hasGuest}
          attireColor={g.attireColor}
          skinColor={g.skinColor}
          hairColor={g.hairColor}
        />
      ))}

      {/* Wedding Cake & Champagne Reception Table (South-West Terrace) */}
      <group position={[-35.8, 0, -40.0]}>
        <RigidBody type="fixed" colliders="hull">
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 0.9, 0.96, 20]} />
            <meshStandardMaterial color="#fbf7f2" roughness={0.78} />
          </mesh>
        </RigidBody>
        {/* 3-Tier Ivory & Rose Wedding Cake */}
        <mesh position={[0, 1.08, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.4, 0.24, 18]} />
          <meshStandardMaterial color="#fffaf4" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.27, 0.28, 0.2, 18]} />
          <meshStandardMaterial color="#fff5f7" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.48, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.18, 0.16, 18]} />
          <meshStandardMaterial color="#fffaf4" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color="#f5a7be" roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
}
