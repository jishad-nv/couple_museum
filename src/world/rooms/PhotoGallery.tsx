import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import Wall from '../objects/Wall';
import Bench, { CeilingLight, Pillar } from '../objects/Decorations';
import PhotoFrame from '../objects/PhotoFrame';
import LoveAlbumStand from '../objects/LoveAlbumStand';
import DancePavilion from '../objects/DancePavilion';
import BouquetStation from '../objects/BouquetStation';
import { LuxuryDoorArchwayFrame, LuxuryDoorLeaf } from '../objects/MuseumDoor';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS } from '../../utils/constants';
import {
  DANCE_SPOT_POS,
  GALLERY_CENTER,
  GALLERY_OUTER_RADIUS,
  THEATRE_DOOR_POS,
  GARDEN_DOOR_POS,
  SECRET_DOOR_POS,
  WEDDING_DOOR_POS,
  THEATRE_ARRIVAL_POS,
  GARDEN_ARRIVAL_POS,
  registerCameraCollider,
  unregisterCameraCollider,
} from '../../utils/museumLayout';
import { isNearBouquetStation } from '../../utils/bouquet';
import { useGameStore } from '../../store/gameStore';

// Angles measured around GALLERY_CENTER: theta=0 is South (+Z toward Entrance), theta=PI is North (-Z toward Theatre)
const WALL_SEGMENTS = 36;
const GARDEN_DOOR_ANGLE = (3 * Math.PI) / 4; // 135 degrees => (12.02, -33.52) North-East right of Theatre
const WEDDING_DOOR_ANGLE = (5 * Math.PI) / 4; // 225 degrees => (-12.02, -33.52) North-West left of Theatre
const SECRET_DOOR_ANGLE = (3 * Math.PI) / 2; // 270 degrees => (-17.0, -21.5) West discreet alcove

function isDoorOpeningSegment(thetaCenter: number): boolean {
  const wrapDiff = (a: number, b: number) => {
    let d = Math.abs(a - b) % (Math.PI * 2);
    if (d > Math.PI) d = Math.PI * 2 - d;
    return d;
  };
  if (wrapDiff(thetaCenter, 0) < 0.16) return true;
  if (wrapDiff(thetaCenter, Math.PI) < 0.14) return true;
  if (wrapDiff(thetaCenter, GARDEN_DOOR_ANGLE) < 0.14) return true;
  if (wrapDiff(thetaCenter, WEDDING_DOOR_ANGLE) < 0.14) return true;
  if (wrapDiff(thetaCenter, SECRET_DOOR_ANGLE) < 0.13) return true;
  return false;
}

// Deterministic placement slots around the curved walls across 5 titled sections (clear of all 5 doorway arcs)
const SECTION_PLACEMENTS: Array<{
  title: string;
  angles: number[];
}> = [
  { title: 'Our First Memories', angles: [0.34, 0.54, 0.74, 0.90] }, // South-East arc
  { title: 'Our First Holidays Together', angles: [1.12, 1.38, 1.64, 1.88] }, // East arc
  { title: 'Special Moments', angles: [3.38, 3.58, 4.22, 4.40] }, // North-West arc (clear of Wedding door 3.93)
  { title: 'Beautiful Memories', angles: [4.98, 5.18, 5.38, 5.56] }, // South-West arc (clear of Secret alcove 4.71)
  { title: 'Forever Together', angles: [5.66, 5.84, 6.02, 6.06] }, // South-West toward Entrance
];

const PRIMARY_15_ANGLES = [
  0.36, 0.56, 0.76,
  1.12, 1.38, 1.66,
  3.38, 3.58, 4.24,
  4.44, 5.02, 5.24,
  5.48, 5.72, 5.96,
];

const EXTRA_ANGLES = [
  0.94, 1.90, 3.30, 4.14, 5.36, 6.06,
];

function CurvedWallSegment({
  position,
  rotationY,
  width,
  color,
}: {
  position: [number, number, number];
  rotationY: number;
  width: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const m = meshRef.current;
    registerCameraCollider(m);
    return () => unregisterCameraCollider(m);
  }, []);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotationY, 0]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={color} roughness={0.48} />
      </mesh>
    </RigidBody>
  );
}


export default function PhotoGallery() {
  const isTheatreDoorOpen = useGameStore((s) => s.isTheatreDoorOpen);
  const isGardenDoorOpen = useGameStore((s) => s.isGardenDoorOpen);
  const isSecretDoorOpen = useGameStore((s) => s.isSecretDoorOpen);
  const isWeddingDoorOpen = useGameStore((s) => s.isWeddingDoorOpen);
  const photos = useGameStore((s) => s.photos);
  const textsMap = useGameStore((s) => s.textsMap);

  const theatreLeftRef = useRef<THREE.Group>(null);
  const theatreRightRef = useRef<THREE.Group>(null);
  const theatreProgressRef = useRef(0);
  const nearTheatreRef = useRef(false);

  const gardenLeftRef = useRef<THREE.Group>(null);
  const gardenRightRef = useRef<THREE.Group>(null);
  const gardenProgressRef = useRef(0);
  const nearGardenRef = useRef(false);

  const secretDoorRef = useRef<THREE.Group>(null);
  const secretProgressRef = useRef(0);
  const nearSecretRef = useRef(false);

  const weddingLeftRef = useRef<THREE.Group>(null);
  const weddingRightRef = useRef<THREE.Group>(null);
  const weddingProgressRef = useRef(0);
  const nearWeddingRef = useRef(false);
  const nearBouquetRef = useRef(false);

  const [cx, , cz] = GALLERY_CENTER;
  const R = GALLERY_OUTER_RADIUS;

  const theatreDoorTitle = textsMap.theatre_door_title || 'MEMORY THEATRE';
  const gardenDoorTitle = textsMap.garden_door_title || 'BEAUTY OF GARDEN';
  const weddingDoorTitle = textsMap.wedding_door_title || 'OUR WEDDING DAY';

  // Build 36 curved outer chord segments skipping the 3 doorway arcs
  const curvedSegments = useMemo(() => {
    const step = (Math.PI * 2) / WALL_SEGMENTS;
    const chordLen = 2 * R * Math.sin(step / 2) + 0.16;
    const segs: Array<{ pos: [number, number, number]; rotY: number; len: number; alt: boolean }> = [];

    for (let i = 0; i < WALL_SEGMENTS; i++) {
      const theta = i * step;
      if (isDoorOpeningSegment(theta)) continue;
      const px = cx + R * Math.sin(theta);
      const pz = cz + R * Math.cos(theta);
      segs.push({
        pos: [px, WALL_HEIGHT / 2, pz],
        rotY: theta,
        len: chordLen,
        alt: i % 2 === 0,
      });
    }
    return segs;
  }, [cx, cz, R]);

  // Mount dynamic gallery photos flush along inner wall face
  const wallMountedMemories = useMemo(() => {
    const frameRadius = R - 0.36;
    const galleryPhotos = photos.filter((p) => p.roomTarget === 'gallery');
    const allSlots = [...PRIMARY_15_ANGLES, ...EXTRA_ANGLES];

    return galleryPhotos.slice(0, allSlots.length).map((memory, idx) => {
      const theta = allSlots[idx];
      return {
        memory,
        position: [cx + frameRadius * Math.sin(theta), 2.35, cz + frameRadius * Math.cos(theta)] as [
          number,
          number,
          number,
        ],
        rotation: [0, theta + Math.PI, 0] as [number, number, number],
      };
    });
  }, [photos, cx, cz, R]);

  // Section header banners mounted above each group of frames
  const sectionBanners = useMemo(() => {
    const bannerRadius = R - 0.34;
    return SECTION_PLACEMENTS.map((sec) => {
      const midAngle = sec.angles[1];
      return {
        title: sec.title,
        position: [
          cx + bannerRadius * Math.sin(midAngle),
          4.15,
          cz + bannerRadius * Math.cos(midAngle),
        ] as [number, number, number],
        rotation: [0, midAngle + Math.PI, 0] as [number, number, number],
      };
    });
  }, [cx, cz, R]);

  // Trigger E-key interactions for Gallery doors, Quiz Master & Reward Box
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
        s.showDoYouLoveMeModal ||
        s.showLoveQuizModal ||
        s.showPrivateMemoryModal ||
        s.showPasswordModal ||
        s.showProposalModal ||
        s.showBouquetCreator ||
        s.showGenderModal ||
        !s.hasAnsweredGenderPrompt
      ) {
        return;
      }

      if (s.nearbyInteractable === 'bouquet-station') {
        s.openBouquetCreator();
      } else if (s.nearbyInteractable === 'theatre-door' && !s.isTheatreDoorOpen) {
        s.setTheatreDoorOpen(true);
        s.startScriptedWalk({
          target: THEATRE_ARRIVAL_POS,
          facing: Math.PI,
        });
      } else if (s.nearbyInteractable === 'garden-door' && !s.isGardenDoorOpen) {
        s.setGardenDoorOpen(true);
        s.startScriptedWalk({
          target: GARDEN_ARRIVAL_POS,
          facing: 1.9,
        });
      } else if (s.nearbyInteractable === 'secret-door') {
        s.enterSecretRoom();
      } else if (s.nearbyInteractable === 'wedding-door') {
        s.enterWeddingHall();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.max(0, Math.min(rawDelta, 0.05));
    const s = useGameStore.getState();

    // Animate Theatre doors cleanly with snap when settled
    const tTarget = s.isTheatreDoorOpen ? 1 : 0;
    const tNext = THREE.MathUtils.lerp(
      theatreProgressRef.current,
      tTarget,
      1 - Math.exp(-3.5 * delta)
    );
    theatreProgressRef.current = Math.abs(tTarget - tNext) < 0.0005 ? tTarget : tNext;
    const tAngle = theatreProgressRef.current * 1.48;
    if (theatreLeftRef.current) theatreLeftRef.current.rotation.y = tAngle;
    if (theatreRightRef.current) theatreRightRef.current.rotation.y = -tAngle;

    // Animate Garden doors cleanly with snap when settled
    const gTarget = s.isGardenDoorOpen ? 1 : 0;
    const gNext = THREE.MathUtils.lerp(
      gardenProgressRef.current,
      gTarget,
      1 - Math.exp(-3.5 * delta)
    );
    gardenProgressRef.current = Math.abs(gTarget - gNext) < 0.0005 ? gTarget : gNext;
    const gAngle = gardenProgressRef.current * 1.45;
    if (gardenLeftRef.current) gardenLeftRef.current.rotation.y = gAngle;
    if (gardenRightRef.current) gardenRightRef.current.rotation.y = -gAngle;

    // Animate discreet Pre-Secret Room hinged alcove panel with snap when settled
    const sTarget = s.isSecretDoorOpen ? 1 : 0;
    const sNext = THREE.MathUtils.lerp(
      secretProgressRef.current,
      sTarget,
      1 - Math.exp(-3.2 * delta)
    );
    secretProgressRef.current = Math.abs(sTarget - sNext) < 0.0005 ? sTarget : sNext;
    if (secretDoorRef.current) {
      secretDoorRef.current.rotation.y = secretProgressRef.current * 1.48;
    }

    // Animate Wedding Hall floral archway doors cleanly with snap when settled
    const wTarget = s.isWeddingDoorOpen ? 1 : 0;
    const wNext = THREE.MathUtils.lerp(
      weddingProgressRef.current,
      wTarget,
      1 - Math.exp(-3.5 * delta)
    );
    weddingProgressRef.current = Math.abs(wTarget - wNext) < 0.0005 ? wTarget : wNext;
    const wAngle = weddingProgressRef.current * 1.46;
    if (weddingLeftRef.current) weddingLeftRef.current.rotation.y = wAngle;
    if (weddingRightRef.current) weddingRightRef.current.rotation.y = -wAngle;

    // Proximity check for Theatre Door
    const dTheatre = Math.hypot(
      s.playerPosition.x - THEATRE_DOOR_POS[0],
      s.playerPosition.z - THEATRE_DOOR_POS[2]
    );
    const nearT = !s.isTheatreDoorOpen && dTheatre < 4.5;
    if (nearT !== nearTheatreRef.current) {
      nearTheatreRef.current = nearT;
      if (nearT) s.setNearbyInteractable('theatre-door');
      else if (s.nearbyInteractable === 'theatre-door') s.setNearbyInteractable(null);
    }

    // Proximity check for Garden Door
    const dGarden = Math.hypot(
      s.playerPosition.x - GARDEN_DOOR_POS[0],
      s.playerPosition.z - GARDEN_DOOR_POS[2]
    );
    const nearG = !s.isGardenDoorOpen && dGarden < 4.5;
    if (nearG !== nearGardenRef.current) {
      nearGardenRef.current = nearG;
      if (nearG) s.setNearbyInteractable('garden-door');
      else if (s.nearbyInteractable === 'garden-door') s.setNearbyInteractable(null);
    }

    // West Alcove Proximity: Pre-Secret Room entrance door (Gallery side)
    const dSecret = Math.hypot(
      s.playerPosition.x - SECRET_DOOR_POS[0],
      s.playerPosition.z - SECRET_DOOR_POS[2]
    );
    const nearS = !s.isSecretDoorOpen && s.currentRoom === 'gallery' && dSecret < 3.4;
    if (nearS !== nearSecretRef.current) {
      nearSecretRef.current = nearS;
      if (nearS) s.setNearbyInteractable('secret-door');
      else if (s.nearbyInteractable === 'secret-door') s.setNearbyInteractable(null);
    }

    // Proximity check for Wedding Hall Archway
    const dWedding = Math.hypot(
      s.playerPosition.x - WEDDING_DOOR_POS[0],
      s.playerPosition.z - WEDDING_DOOR_POS[2]
    );
    const nearW = !s.isWeddingDoorOpen && s.currentRoom === 'gallery' && dWedding < 4.5;
    if (nearW !== nearWeddingRef.current) {
      nearWeddingRef.current = nearW;
      if (nearW) s.setNearbyInteractable('wedding-door');
      else if (s.nearbyInteractable === 'wedding-door') s.setNearbyInteractable(null);
    }

    // Proximity check for Bouquet Creation Station between Theatre and Garden doors
    const nearB =
      s.currentRoom === 'gallery' &&
      !s.showBouquetCreator &&
      isNearBouquetStation({ x: s.playerPosition.x, z: s.playerPosition.z });
    if (nearB !== nearBouquetRef.current) {
      nearBouquetRef.current = nearB;
      if (nearB) s.setNearbyInteractable('bouquet-station');
      else if (s.nearbyInteractable === 'bouquet-station') s.setNearbyInteractable(null);
    }
  });

  const doorLeafW = 1.45;
  const doorLeafH = 3.8;

  return (
    <group>
      {/* Large Circular Gallery Marble Floor Slab (top strictly at y = 0) */}
      <RigidBody type="fixed" colliders={false} position={[cx, -0.1, cz]}>
        <CylinderCollider args={[0.1, R + 0.5]} />
        <mesh receiveShadow>
          <cylinderGeometry args={[R + 0.5, R + 0.5, 0.2, 48]} />
          <meshStandardMaterial color={COLORS.floorMarble} roughness={0.32} metalness={0.04} />
        </mesh>
      </RigidBody>

      {/* Circular Decorative Gold Inlay Rings */}
      <mesh position={[cx, 0.012, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10.5, 10.75, 48]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.3}
          roughness={0.3}
          transparent
          opacity={0.45}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[cx, 0.012, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.4, 4.65, 40]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.3}
          roughness={0.3}
          transparent
          opacity={0.5}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Circular Rotunda Ceiling & Warm Glowing Skylight Oculus */}
      <mesh position={[cx, WALL_HEIGHT, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.6, R + 0.4, 48]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.5} />
      </mesh>
      <mesh position={[cx, WALL_HEIGHT + 0.15, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.7, 36]} />
        <meshStandardMaterial
          color="#fff4db"
          emissive="#ffdca8"
          emissiveIntensity={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* Curved Gallery Perimeter Wall Segments */}
      {curvedSegments.map((seg, i) => (
        <CurvedWallSegment
          key={`gw-${i}`}
          position={seg.pos}
          rotationY={seg.rotY}
          width={seg.len}
          color={seg.alt ? COLORS.wallWhite : COLORS.wallWarm}
        />
      ))}

      {/* Framed Photographs mounted flush on the circular walls */}
      {wallMountedMemories.map(({ memory, position, rotation }) => (
        <PhotoFrame
          key={memory.id}
          position={position}
          rotation={rotation}
          memory={memory}
          size={[1.85, 1.35]}
        />
      ))}

      {/* 5 Section Architectural Title Banners above frames */}
      {sectionBanners.map((b) => (
        <group key={b.title} position={b.position} rotation={b.rotation}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[4.4, 0.46, 0.05]} />
            <meshStandardMaterial color="#251424" roughness={0.45} />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.22}
            color={COLORS.goldLight}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.06}
            font={undefined}
          >
            {b.title.toUpperCase()}
          </Text>
        </group>
      ))}

      {/* Central Rotunda Physical Open Hardcover Love Album Pedestal (replaces former pink sculpture) */}
      <LoveAlbumStand position={[cx, 0, cz]} />

      {/* Dedicated Romantic Moonlit Waltz Dance Pavilion in Open Gallery Floor */}
      <DancePavilion position={DANCE_SPOT_POS} />

      {/* Bouquet Creation Atelier Station between Memory Theatre & Garden Doors */}
      <BouquetStation />

      {/* Gallery Seating Benches looking outward/around circular path */}
      <Bench
        position={[cx - 4.4, 0, cz]}
        rotation={[0, -Math.PI / 2, 0]}
        benchId="gallery-west-bench"
        benchLabel="Gallery Viewing Bench"
        interactive
      />
      <Bench
        position={[cx + 4.4, 0, cz]}
        rotation={[0, Math.PI / 2, 0]}
        benchId="gallery-east-bench"
        benchLabel="Gallery Viewing Bench"
        interactive
      />

      {/* Four Grand Rotunda Pillars + Chandeliers */}
      <Pillar position={[cx - 6.8, 0, cz - 6.8]} />
      <Pillar position={[cx + 6.8, 0, cz - 6.8]} />
      <Pillar position={[cx - 6.8, 0, cz + 6.8]} />
      <Pillar position={[cx + 6.8, 0, cz + 6.8]} />

      <CeilingLight position={[cx, WALL_HEIGHT, cz - 9]} />
      <CeilingLight position={[cx, WALL_HEIGHT, cz + 9]} />
      <CeilingLight position={[cx - 9, WALL_HEIGHT, cz]} />
      <CeilingLight position={[cx + 9, WALL_HEIGHT, cz]} />



      {/* ─── THEATRE ENTRANCE DOORWAY (North Wall at z = -38.5) ─── */}
      <group position={THEATRE_DOOR_POS}>
        <Wall
          position={[0, WALL_HEIGHT / 2, 0]}
          size={[3.5, WALL_HEIGHT, WALL_THICKNESS]}
          color="#261722"
          hasDoor
          doorPosition={0}
          doorWidth={2.9}
          doorHeight={3.9}
        />
        <mesh position={[0, 4.55, 0.24]}>
          <boxGeometry args={[4.4, 0.72, 0.14]} />
          <meshStandardMaterial color="#1f111a" roughness={0.4} />
        </mesh>
        <Text
          position={[0, 4.55, 0.34]}
          fontSize={0.28}
          color={COLORS.goldLight}
          anchorX="center"
          letterSpacing={0.12}
          font={undefined}
        >
          {theatreDoorTitle.toUpperCase()}
        </Text>

        <LuxuryDoorArchwayFrame
          openingWidth={doorLeafW * 2 + 0.04}
          openingHeight={doorLeafH + 0.02}
          depth={0.44}
          variant="theatre"
        />
        <group ref={theatreLeftRef} position={[-doorLeafW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorLeafW - 0.02}
            height={doorLeafH}
            thickness={0.12}
            variant="theatre"
            hingeSide="left"
          />
        </group>
        <group ref={theatreRightRef} position={[doorLeafW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorLeafW - 0.02}
            height={doorLeafH}
            thickness={0.12}
            variant="theatre"
            hingeSide="right"
          />
        </group>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[1.5, doorLeafH / 2, 0.18]}
            position={[0, doorLeafH / 2, 0]}
            sensor={isTheatreDoorOpen}
          />
        </RigidBody>
      </group>

      {/* ─── GARDEN ENTRANCE DOORWAY (Right of Theatre at [12.0, 0, -33.5], 135 deg) ─── */}
      <group position={GARDEN_DOOR_POS} rotation={[0, GARDEN_DOOR_ANGLE, 0]}>
        <Wall
          position={[0, WALL_HEIGHT / 2, 0]}
          size={[6.1, WALL_HEIGHT, WALL_THICKNESS]}
          color="#e4eadf"
          hasDoor
          doorPosition={0}
          doorWidth={2.9}
          doorHeight={3.9}
        />
        <mesh position={[0, 4.55, -0.22]}>
          <boxGeometry args={[4.4, 0.72, 0.14]} />
          <meshStandardMaterial color="#1f3822" roughness={0.45} />
        </mesh>
        <Text
          position={[0, 4.55, -0.32]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.26}
          color={COLORS.goldLight}
          anchorX="center"
          letterSpacing={0.1}
          font={undefined}
        >
          {gardenDoorTitle.toUpperCase()}
        </Text>

        <LuxuryDoorArchwayFrame
          openingWidth={doorLeafW * 2 + 0.04}
          openingHeight={doorLeafH + 0.02}
          depth={0.44}
          variant="garden"
        />
        <group ref={gardenLeftRef} position={[-doorLeafW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorLeafW - 0.02}
            height={doorLeafH}
            thickness={0.11}
            variant="garden"
            hingeSide="left"
          />
        </group>
        <group ref={gardenRightRef} position={[doorLeafW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorLeafW - 0.02}
            height={doorLeafH}
            thickness={0.11}
            variant="garden"
            hingeSide="right"
          />
        </group>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[1.5, doorLeafH / 2, 0.18]}
            position={[0, doorLeafH / 2, 0]}
            sensor={isGardenDoorOpen}
          />
        </RigidBody>
      </group>

      {/* ─── DISCREET SECRET ROOM ENTRANCE (West Arc at [-17.0, 0, -21.5], 270 deg) ─── */}
      <group position={SECRET_DOOR_POS} rotation={[0, SECRET_DOOR_ANGLE, 0]}>
        <Wall
          position={[0, WALL_HEIGHT / 2, 0]}
          size={[3.5, WALL_HEIGHT, WALL_THICKNESS]}
          color="#38252c"
          hasDoor
          doorPosition={0}
          doorWidth={2.5}
          doorHeight={3.4}
        />
        <mesh position={[0, 3.72, -0.22]}>
          <boxGeometry args={[2.8, 0.42, 0.16]} />
          <meshStandardMaterial color="#2a1420" roughness={0.62} />
        </mesh>
        <Text
          position={[0, 3.72, -0.32]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.14}
          color="#e8c996"
          anchorX="center"
          letterSpacing={0.08}
          font={undefined}
        >
          PRE-SECRET ROOM
        </Text>
        {[-1.56, 1.56].map((sx, idx) => (
          <group key={`ss-${idx}`} position={[sx, 2.25, -0.22]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.05, 0.24, 8]} />
              <meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color="#fff3cf" emissive="#ffb85e" emissiveIntensity={2.0} />
            </mesh>
          </group>
        ))}

        <LuxuryDoorArchwayFrame
          openingWidth={2.52}
          openingHeight={3.42}
          depth={0.44}
          variant="secret_alcove"
        />

        {/* Hinged carved rosewood & velvet secret panel door */}
        <group
          ref={secretDoorRef}
          position={[-1.25, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            useGameStore.getState().enterSecretRoom();
          }}
        >
          <LuxuryDoorLeaf
            width={2.48}
            height={3.4}
            thickness={0.14}
            variant="secret_alcove"
            hingeSide="left"
            showCenterMedallion
            medallionActive={isSecretDoorOpen}
          />
        </group>

        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[1.28, 1.7, 0.2]}
            position={[0, 1.7, 0]}
            sensor={isSecretDoorOpen}
          />
        </RigidBody>
      </group>

      {/* ─── WEDDING HALL ENTRANCE ARCHWAY (North-West Arc at [-12.0, 0, -33.5], 225 deg) ─── */}
      <group position={WEDDING_DOOR_POS} rotation={[0, WEDDING_DOOR_ANGLE, 0]}>
        <Wall
          position={[0, WALL_HEIGHT / 2, 0]}
          size={[6.1, WALL_HEIGHT, WALL_THICKNESS]}
          color="#f4ece0"
          hasDoor
          doorPosition={0}
          doorWidth={2.9}
          doorHeight={3.9}
        />
        <mesh position={[0, 4.55, -0.22]}>
          <boxGeometry args={[4.4, 0.72, 0.14]} />
          <meshStandardMaterial color="#f8f2e8" roughness={0.42} />
        </mesh>
        <Text
          position={[0, 4.55, -0.32]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.26}
          color="#8a6220"
          anchorX="center"
          letterSpacing={0.1}
          font={undefined}
        >
          {weddingDoorTitle.toUpperCase()}
        </Text>
        {[-1.72, 1.72].map((fx, idx) => (
          <group key={`wdf-${idx}`} position={[fx, 2.85, -0.26]}>
            <mesh>
              <sphereGeometry args={[0.16, 10, 8]} />
              <meshStandardMaterial color="#b81834" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
              <sphereGeometry args={[0.13, 10, 8]} />
              <meshStandardMaterial color="#fff9f2" roughness={0.55} />
            </mesh>
          </group>
        ))}

        <LuxuryDoorArchwayFrame
          openingWidth={doorLeafW * 2 + 0.04}
          openingHeight={doorLeafH + 0.02}
          depth={0.44}
          variant="wedding"
        />
        <group ref={weddingLeftRef} position={[-doorLeafW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorLeafW - 0.02}
            height={doorLeafH}
            thickness={0.11}
            variant="wedding"
            hingeSide="left"
          />
        </group>
        <group ref={weddingRightRef} position={[doorLeafW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorLeafW - 0.02}
            height={doorLeafH}
            thickness={0.11}
            variant="wedding"
            hingeSide="right"
          />
        </group>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[1.5, doorLeafH / 2, 0.18]}
            position={[0, doorLeafH / 2, 0]}
            sensor={isWeddingDoorOpen}
          />
        </RigidBody>
      </group>
    </group>
  );
}
