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
  QUIZ_MASTER_POS,
  REWARD_BOX_POS,
  registerCameraCollider,
  unregisterCameraCollider,
} from '../../utils/museumLayout';
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

function QuizMasterNPC() {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);

  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);
  const showLoveQuizModal = useGameStore((s) => s.showLoveQuizModal);
  const setShowLoveQuizModal = useGameStore((s) => s.setShowLoveQuizModal);
  const setShowDoYouLoveMeModal = useGameStore((s) => s.setShowDoYouLoveMeModal);
  const quizCompleted = useGameStore((s) => s.secretProgress.quizCompleted);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const s = useGameStore.getState();

    if (rootRef.current) {
      const dx = s.playerPosition.x - QUIZ_MASTER_POS[0];
      const dz = s.playerPosition.z - QUIZ_MASTER_POS[2];
      const dist = Math.hypot(dx, dz);
      const targetYaw = dist < 8.5 ? Math.atan2(dx, dz) : Math.PI / 2;
      let diff = targetYaw - rootRef.current.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rootRef.current.rotation.y += diff * Math.min(1, delta * 5.2);
    }

    const engaging = s.nearbyInteractable === 'quiz-master' || s.showLoveQuizModal;
    if (torsoRef.current) {
      torsoRef.current.position.y = 1.06 + Math.sin(t * 2.0) * 0.012;
      torsoRef.current.rotation.x = engaging ? Math.sin(t * 2.4) * 0.035 : 0;
    }
    if (headRef.current) {
      headRef.current.rotation.y = engaging ? Math.sin(t * 1.4) * 0.09 : Math.sin(t * 0.6) * 0.04;
      headRef.current.rotation.x = engaging ? Math.sin(t * 2.8) * 0.045 : 0;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = engaging
        ? -0.58 + Math.sin(t * 3.4) * 0.18
        : -0.1 + Math.sin(t * 1.5) * 0.04;
      rightArmRef.current.rotation.z = engaging ? -0.18 : -0.06;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = engaging
        ? -0.24 + Math.cos(t * 2.6) * 0.1
        : -0.06 - Math.sin(t * 1.5) * 0.03;
      leftArmRef.current.rotation.z = 0.07;
    }
  });

  const active = nearbyInteractable === 'quiz-master' || showLoveQuizModal;

  return (
    <group
      position={QUIZ_MASTER_POS}
      onClick={(e) => {
        e.stopPropagation();
        const s = useGameStore.getState();
        if (!s.secretProgress.yesConfirmed) {
          setShowDoYouLoveMeModal(true);
        } else {
          setShowLoveQuizModal(true, true);
        }
      }}
    >
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.35, 0.9, 0.35]} position={[0, 0.9, 0]} />
      </RigidBody>

      {/* Velvet sanctuary mat under Quiz Master */}
      <mesh position={[0, 0.018, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.68, 0.025, 24]} />
        <meshStandardMaterial color="#3f1e2c" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.033, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.56, 0.62, 24]} />
        <meshStandardMaterial
          color={COLORS.gold}
          emissive={active ? '#f0b858' : '#7c5a26'}
          emissiveIntensity={active ? 0.9 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={rootRef} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-0.1, 0.05, 0.03]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.22]} />
          <meshStandardMaterial color="#211618" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.05, 0.03]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.22]} />
          <meshStandardMaterial color="#211618" roughness={0.5} />
        </mesh>
        <mesh position={[-0.1, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.062, 0.78, 10]} />
          <meshStandardMaterial color="#2a2436" roughness={0.75} />
        </mesh>
        <mesh position={[0.1, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.062, 0.78, 10]} />
          <meshStandardMaterial color="#2a2436" roughness={0.75} />
        </mesh>

        <group ref={torsoRef} position={[0, 1.06, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.19, 0.165, 0.52, 14]} />
            <meshStandardMaterial color="#4e1d32" roughness={0.62} />
          </mesh>
          <mesh position={[0, 0.06, 0.14]}>
            <boxGeometry args={[0.12, 0.34, 0.06]} />
            <meshStandardMaterial color="#faf2e4" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.2, 0.175]}>
            <boxGeometry args={[0.11, 0.045, 0.03]} />
            <meshStandardMaterial color="#b4843a" metalness={0.35} roughness={0.35} />
          </mesh>
          <mesh position={[0.07, -0.05, 0.165]} rotation={[0, 0, -0.2]}>
            <torusGeometry args={[0.045, 0.008, 6, 12, Math.PI]} />
            <meshStandardMaterial color={COLORS.goldLight} metalness={0.5} roughness={0.3} />
          </mesh>

          <group ref={leftArmRef} position={[-0.23, 0.18, 0]}>
            <mesh position={[0, -0.17, 0]} castShadow>
              <cylinderGeometry args={[0.052, 0.044, 0.38, 10]} />
              <meshStandardMaterial color="#4e1d32" roughness={0.65} />
            </mesh>
            <mesh position={[0, -0.38, 0]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial color="#e8bea0" roughness={0.72} />
            </mesh>
          </group>

          <group ref={rightArmRef} position={[0.23, 0.18, 0]}>
            <mesh position={[0, -0.17, 0]} castShadow>
              <cylinderGeometry args={[0.052, 0.044, 0.38, 10]} />
              <meshStandardMaterial color="#4e1d32" roughness={0.65} />
            </mesh>
            <mesh position={[0, -0.38, 0]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial color="#e8bea0" roughness={0.72} />
            </mesh>
          </group>

          <group ref={headRef} position={[0, 0.4, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.145, 16, 16]} />
              <meshStandardMaterial color="#ebbfa0" roughness={0.68} />
            </mesh>
            <mesh position={[0, 0.06, -0.015]} castShadow>
              <sphereGeometry args={[0.148, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
              <meshStandardMaterial color="#3c261d" roughness={0.78} />
            </mesh>
            <mesh position={[-0.05, 0.02, 0.132]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#2a1b16" />
            </mesh>
            <mesh position={[0.05, 0.02, 0.132]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#2a1b16" />
            </mesh>
            <mesh position={[-0.05, 0.02, 0.142]}>
              <torusGeometry args={[0.028, 0.004, 6, 14]} />
              <meshStandardMaterial color={COLORS.goldLight} metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.05, 0.02, 0.142]}>
              <torusGeometry args={[0.028, 0.004, 6, 14]} />
              <meshStandardMaterial color={COLORS.goldLight} metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.052, 0.136]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.032, 0.006, 6, 12, Math.PI * 0.8]} />
              <meshStandardMaterial color="#a85654" />
            </mesh>
          </group>
        </group>

        <Text
          position={[0, 1.98, 0]}
          fontSize={0.13}
          color={quizCompleted ? '#b8f2c2' : COLORS.goldLight}
          anchorX="center"
          letterSpacing={0.08}
          font={undefined}
        >
          {quizCompleted ? 'QUIZ MASTER · PASSED ♡' : 'THE QUIZ MASTER'}
        </Text>
      </group>
    </group>
  );
}

function RewardBox3D() {
  const lidRef = useRef<THREE.Group>(null);
  const keyRef = useRef<THREE.Group>(null);
  const sparkleGroupRef = useRef<THREE.Group>(null);

  const quizCompleted = useGameStore((s) => s.secretProgress.quizCompleted);
  const keyCollected = useGameStore((s) => s.secretProgress.keyCollected);
  const collectGoldenKey = useGameStore((s) => s.collectGoldenKey);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const s = useGameStore.getState();
    const isQuizDone = s.secretProgress.quizCompleted;
    const hasKey = s.secretProgress.keyCollected;

    if (lidRef.current) {
      const targetAngle = isQuizDone ? -1.16 : 0;
      const nextAngle = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetAngle,
        1 - Math.exp(-3.2 * delta)
      );
      lidRef.current.rotation.x = Math.abs(targetAngle - nextAngle) < 0.0005 ? targetAngle : nextAngle;
    }

    if (keyRef.current && isQuizDone && !hasKey) {
      keyRef.current.position.y = 1.38 + Math.sin(t * 2.3) * 0.07;
      keyRef.current.rotation.y = t * 1.15;
    }

    if (sparkleGroupRef.current && isQuizDone && !hasKey) {
      sparkleGroupRef.current.rotation.y = -t * 0.9;
    }
  });

  const sparkleAngles = [0, 1.05, 2.1, 3.15, 4.2, 5.25];

  return (
    <group
      position={REWARD_BOX_POS}
      rotation={[0, Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (quizCompleted && !keyCollected) {
          collectGoldenKey();
        }
      }}
    >
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.72, 0.72]} />
          <meshStandardMaterial color="#3c1e2a" roughness={0.62} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 0.74, 0]}>
        <boxGeometry args={[0.98, 0.05, 0.78]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.64, 0.28, 0.44]} />
        <meshStandardMaterial color="#592836" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.9, 0.225]}>
        <boxGeometry args={[0.66, 0.05, 0.02]} />
        <meshStandardMaterial color={COLORS.goldLight} metalness={0.45} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.93, 0.24]}>
        <boxGeometry args={[0.1, 0.11, 0.03]} />
        <meshStandardMaterial
          color={quizCompleted ? '#f7d88b' : '#b28741'}
          emissive={quizCompleted ? '#ffcf6e' : '#000000'}
          emissiveIntensity={quizCompleted ? 0.8 : 0}
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>

      <group ref={lidRef} position={[0, 1.04, -0.22]}>
        <mesh position={[0, 0.05, 0.22]} castShadow>
          <boxGeometry args={[0.66, 0.1, 0.46]} />
          <meshStandardMaterial color="#672f40" roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.11, 0.22]}>
          <boxGeometry args={[0.52, 0.04, 0.34]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.4} roughness={0.3} />
        </mesh>
      </group>

      {quizCompleted && !keyCollected && (
        <>
          <group ref={keyRef} position={[0, 1.38, 0]}>
            <mesh position={[-0.14, 0, 0]}>
              <torusGeometry args={[0.085, 0.022, 10, 20]} />
              <meshStandardMaterial
                color="#ffe68a"
                emissive="#ffbd3b"
                emissiveIntensity={1.85}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 10]} />
              <meshStandardMaterial
                color="#ffe68a"
                emissive="#ffbd3b"
                emissiveIntensity={1.85}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0.17, -0.045, 0]}>
              <boxGeometry args={[0.032, 0.065, 0.022]} />
              <meshStandardMaterial color="#ffe68a" emissive="#ffbd3b" emissiveIntensity={1.85} />
            </mesh>
            <mesh position={[0.11, -0.038, 0]}>
              <boxGeometry args={[0.026, 0.05, 0.022]} />
              <meshStandardMaterial color="#ffe68a" emissive="#ffbd3b" emissiveIntensity={1.85} />
            </mesh>
          </group>

          <group ref={sparkleGroupRef} position={[0, 1.38, 0]}>
            {sparkleAngles.map((ang, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos(ang) * 0.28,
                  Math.sin(ang * 2) * 0.09,
                  Math.sin(ang) * 0.28,
                ]}
              >
                <sphereGeometry args={[0.024, 8, 8]} />
                <meshStandardMaterial color="#fff7d6" emissive="#ffd26e" emissiveIntensity={2.8} />
              </mesh>
            ))}
          </group>
          <pointLight position={[0, 1.45, 0]} intensity={3.2} color="#ffd070" distance={4.5} />
        </>
      )}

      <Text
        position={[0, 1.78, 0]}
        fontSize={0.115}
        color={keyCollected ? '#a6ebb4' : quizCompleted ? '#ffe49e' : '#d8c4a6'}
        anchorX="center"
        font={undefined}
      >
        {keyCollected
          ? 'KEY COLLECTED ✓'
          : quizCompleted
          ? 'GOLDEN KEY UNLOCKED!'
          : 'LOCKED REWARD CHEST'}
      </Text>
    </group>
  );
}

export default function PhotoGallery() {
  const isTheatreDoorOpen = useGameStore((s) => s.isTheatreDoorOpen);
  const isGardenDoorOpen = useGameStore((s) => s.isGardenDoorOpen);
  const isSecretDoorOpen = useGameStore((s) => s.isSecretDoorOpen);
  const isWeddingDoorOpen = useGameStore((s) => s.isWeddingDoorOpen);
  const secretKeyUnlockAnimActive = useGameStore((s) => s.secretKeyUnlockAnimActive);
  const secretDoorUnlocked = useGameStore((s) => s.secretProgress.secretDoorUnlocked);
  const keyCollected = useGameStore((s) => s.secretProgress.keyCollected);
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
  const secretKeyRef = useRef<THREE.Group>(null);
  const secretKeyElapsedRef = useRef(0);

  const weddingLeftRef = useRef<THREE.Group>(null);
  const weddingRightRef = useRef<THREE.Group>(null);
  const weddingProgressRef = useRef(0);
  const nearWeddingRef = useRef(false);

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
        s.showPrivateMemoryModal
      ) {
        return;
      }

      if (s.nearbyInteractable === 'theatre-door' && !s.isTheatreDoorOpen) {
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
      } else if (s.nearbyInteractable === 'quiz-master') {
        if (!s.secretProgress.yesConfirmed) {
          s.setShowDoYouLoveMeModal(true);
        } else {
          s.setShowLoveQuizModal(true, true);
        }
      } else if (s.nearbyInteractable === 'reward-box') {
        if (s.secretProgress.quizCompleted && !s.secretProgress.keyCollected) {
          s.collectGoldenKey();
        }
      } else if (s.nearbyInteractable === 'wedding-door') {
        s.enterWeddingHall();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
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

    // Animate discreet Secret Room hinged alcove panel with snap when settled
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

    // Animate Golden Key Unlocking the Secret Room door lock
    if (s.secretKeyUnlockAnimActive && secretKeyRef.current) {
      secretKeyElapsedRef.current += delta;
      const p = Math.min(1, secretKeyElapsedRef.current / 1.35);
      const slideZ = THREE.MathUtils.lerp(-0.62, -0.18, Math.min(1, p * 1.8));
      const turnZ = p > 0.5 ? (p - 0.5) * 2 * (Math.PI / 2) : 0;
      secretKeyRef.current.position.set(0, 1.36, slideZ);
      secretKeyRef.current.rotation.set(0, 0, turnZ);
    } else {
      secretKeyElapsedRef.current = 0;
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

    // West Alcove Proximity Priority: Quiz Master, Reward Box, or Secret Door (Gallery side)
    if (s.currentRoom === 'gallery') {
      const px = s.playerPosition.x;
      const pz = s.playerPosition.z;
      const dSecret = Math.hypot(px - SECRET_DOOR_POS[0], pz - SECRET_DOOR_POS[2]);
      const dQuiz = Math.hypot(px - QUIZ_MASTER_POS[0], pz - QUIZ_MASTER_POS[2]);
      const dBox = Math.hypot(px - REWARD_BOX_POS[0], pz - REWARD_BOX_POS[2]);

      const westCandidates: Array<{ id: string; dist: number; max: number }> = [
        { id: 'secret-door', dist: dSecret, max: 3.1 },
        { id: 'quiz-master', dist: dQuiz, max: 3.0 },
      ];
      if (s.secretProgress.quizCompleted && !s.secretProgress.keyCollected) {
        westCandidates.push({ id: 'reward-box', dist: dBox, max: 3.1 });
      }
      let bestWest: string | null = null;
      let bestDist = Infinity;
      for (const c of westCandidates) {
        if (c.dist < c.max && c.dist < bestDist) {
          bestDist = c.dist;
          bestWest = c.id;
        }
      }
      nearSecretRef.current = bestWest !== null;
      if (bestWest) {
        if (s.nearbyInteractable !== bestWest) s.setNearbyInteractable(bestWest);
      } else if (
        s.nearbyInteractable === 'secret-door' ||
        s.nearbyInteractable === 'quiz-master' ||
        s.nearbyInteractable === 'reward-box'
      ) {
        s.setNearbyInteractable(null);
      }
    } else if (nearSecretRef.current) {
      nearSecretRef.current = false;
      if (
        s.nearbyInteractable === 'secret-door' ||
        s.nearbyInteractable === 'quiz-master' ||
        s.nearbyInteractable === 'reward-box'
      ) {
        s.setNearbyInteractable(null);
      }
    }

    // Proximity check for Wedding Hall Archway
    const dWedding = Math.hypot(
      s.playerPosition.x - WEDDING_DOOR_POS[0],
      s.playerPosition.z - WEDDING_DOOR_POS[2]
    );
    const nearW = s.currentRoom === 'gallery' && dWedding < 4.5;
    if (nearW !== nearWeddingRef.current) {
      nearWeddingRef.current = nearW;
      if (nearW) s.setNearbyInteractable('wedding-door');
      else if (s.nearbyInteractable === 'wedding-door') s.setNearbyInteractable(null);
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

      {/* Quiz Master & Reward Chest guarding the Secret Room West Alcove */}
      <QuizMasterNPC />
      <RewardBox3D />

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

        <group ref={theatreLeftRef} position={[-doorLeafW, 0, 0]}>
          <mesh position={[doorLeafW / 2, doorLeafH / 2, 0]} castShadow>
            <boxGeometry args={[doorLeafW - 0.03, doorLeafH, 0.12]} />
            <meshStandardMaterial color={COLORS.velvetRed} roughness={0.65} />
          </mesh>
          <mesh position={[doorLeafW - 0.16, 1.35, 0.09]}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color={COLORS.goldLight} metalness={0.35} roughness={0.25} />
          </mesh>
        </group>
        <group ref={theatreRightRef} position={[doorLeafW, 0, 0]}>
          <mesh position={[-doorLeafW / 2, doorLeafH / 2, 0]} castShadow>
            <boxGeometry args={[doorLeafW - 0.03, doorLeafH, 0.12]} />
            <meshStandardMaterial color={COLORS.velvetRed} roughness={0.65} />
          </mesh>
          <mesh position={[-(doorLeafW - 0.16), 1.35, 0.09]}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color={COLORS.goldLight} metalness={0.35} roughness={0.25} />
          </mesh>
        </group>
        {!isTheatreDoorOpen && (
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.5, doorLeafH / 2, 0.18]} position={[0, doorLeafH / 2, 0]} />
          </RigidBody>
        )}
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

        {/* Conservatory Timber & Glass Double Doors (flush non-overlapping stiles + pane) */}
        <group ref={gardenLeftRef} position={[-doorLeafW, 0, 0]}>
          <mesh position={[doorLeafW / 2, doorLeafH / 2, 0]} castShadow>
            <boxGeometry args={[doorLeafW - 0.03, doorLeafH, 0.1]} />
            <meshStandardMaterial color="#3c6241" roughness={0.55} />
          </mesh>
          <mesh position={[doorLeafW / 2, 2.25, 0]}>
            <boxGeometry args={[doorLeafW - 0.36, 2.08, 0.06]} />
            <meshStandardMaterial color="#a8d5ba" transparent opacity={0.55} roughness={0.15} />
          </mesh>
        </group>
        <group ref={gardenRightRef} position={[doorLeafW, 0, 0]}>
          <mesh position={[-doorLeafW / 2, doorLeafH / 2, 0]} castShadow>
            <boxGeometry args={[doorLeafW - 0.03, doorLeafH, 0.1]} />
            <meshStandardMaterial color="#3c6241" roughness={0.55} />
          </mesh>
          <mesh position={[-doorLeafW / 2, 2.25, 0]}>
            <boxGeometry args={[doorLeafW - 0.36, 2.08, 0.06]} />
            <meshStandardMaterial color="#a8d5ba" transparent opacity={0.55} roughness={0.15} />
          </mesh>
        </group>
        {!isGardenDoorOpen && (
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.5, doorLeafH / 2, 0.18]} position={[0, doorLeafH / 2, 0]} />
          </RigidBody>
        )}
      </group>

      {/* ─── DISCREET SECRET ROOM ENTRANCE (West Arc at [-17.0, 0, -21.5], 270 deg) ─── */}
      <group position={SECRET_DOOR_POS} rotation={[0, SECRET_DOOR_ANGLE, 0]}>
        <Wall
          position={[0, WALL_HEIGHT / 2, 0]}
          size={[3.2, WALL_HEIGHT, WALL_THICKNESS]}
          color="#38252c"
          hasDoor
          doorPosition={0}
          doorWidth={2.2}
          doorHeight={3.4}
        />
        <mesh position={[0, 3.65, -0.22]}>
          <boxGeometry args={[2.55, 0.42, 0.16]} />
          <meshStandardMaterial color="#2a1420" roughness={0.62} />
        </mesh>
        <Text
          position={[0, 3.65, -0.32]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.14}
          color="#e8c996"
          anchorX="center"
          letterSpacing={0.08}
          font={undefined}
        >
          {secretDoorUnlocked ? 'OUR SECRET ROOM' : 'LOCKED SECRET SANCTUARY'}
        </Text>
        {[-1.38, 1.38].map((sx, idx) => (
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

        {/* Hinged carved rosewood & velvet secret panel door (offset layers prevent Z-fighting) */}
        <group
          ref={secretDoorRef}
          position={[-1.1, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            useGameStore.getState().enterSecretRoom();
          }}
        >
          <mesh position={[1.1, 1.7, 0]} castShadow>
            <boxGeometry args={[2.16, 3.4, 0.14]} />
            <meshStandardMaterial color="#3c1f2b" roughness={0.68} />
          </mesh>
          <mesh position={[1.1, 1.7, -0.086]}>
            <boxGeometry args={[1.65, 2.75, 0.024]} />
            <meshStandardMaterial color="#29131d" roughness={0.6} />
          </mesh>
          <mesh position={[1.1, 1.7, 0.086]}>
            <boxGeometry args={[1.65, 2.75, 0.024]} />
            <meshStandardMaterial color="#29131d" roughness={0.6} />
          </mesh>
          <mesh position={[1.1, 1.36, -0.106]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.022, 18]} />
            <meshStandardMaterial
              color={COLORS.gold}
              emissive={keyCollected ? '#ffbe4f' : '#704d24'}
              emissiveIntensity={keyCollected ? 1.15 : 0.35}
              metalness={0.45}
              roughness={0.26}
            />
          </mesh>
        </group>

        {/* Animated 3D Golden Key unlocking the Secret Room */}
        {secretKeyUnlockAnimActive && (
          <group ref={secretKeyRef} position={[0, 1.36, -0.62]}>
            <mesh position={[0, 0, -0.14]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.09, 0.024, 10, 20]} />
              <meshStandardMaterial
                color="#ffea92"
                emissive="#ffc240"
                emissiveIntensity={2.1}
                metalness={0.65}
              />
            </mesh>
            <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.3, 10]} />
              <meshStandardMaterial
                color="#ffea92"
                emissive="#ffc240"
                emissiveIntensity={2.1}
                metalness={0.65}
              />
            </mesh>
            <mesh position={[0, -0.045, 0.16]}>
              <boxGeometry args={[0.022, 0.07, 0.036]} />
              <meshStandardMaterial color="#ffea92" emissive="#ffc240" emissiveIntensity={2.1} />
            </mesh>
            <pointLight position={[0, 0, -0.12]} intensity={4} color="#ffd068" distance={4} />
          </group>
        )}

        {!isSecretDoorOpen && (
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.15, 1.7, 0.2]} position={[0, 1.7, 0]} />
          </RigidBody>
        )}
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
        {[-1.7, 1.7].map((fx, idx) => (
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

        {/* Ivory & Gold Double Doors (flush non-overlapping stiles + pane) */}
        <group ref={weddingLeftRef} position={[-doorLeafW, 0, 0]}>
          <mesh position={[doorLeafW / 2, doorLeafH / 2, 0]} castShadow>
            <boxGeometry args={[doorLeafW - 0.03, doorLeafH, 0.1]} />
            <meshStandardMaterial color="#f4ede1" roughness={0.45} />
          </mesh>
          <mesh position={[doorLeafW / 2, 2.25, 0]}>
            <boxGeometry args={[doorLeafW - 0.36, 2.08, 0.06]} />
            <meshStandardMaterial color="#ffeef2" transparent opacity={0.58} roughness={0.18} />
          </mesh>
        </group>
        <group ref={weddingRightRef} position={[doorLeafW, 0, 0]}>
          <mesh position={[-doorLeafW / 2, doorLeafH / 2, 0]} castShadow>
            <boxGeometry args={[doorLeafW - 0.03, doorLeafH, 0.1]} />
            <meshStandardMaterial color="#f4ede1" roughness={0.45} />
          </mesh>
          <mesh position={[-doorLeafW / 2, 2.25, 0]}>
            <boxGeometry args={[doorLeafW - 0.36, 2.08, 0.06]} />
            <meshStandardMaterial color="#ffeef2" transparent opacity={0.58} roughness={0.18} />
          </mesh>
        </group>
        {!isWeddingDoorOpen && (
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.5, doorLeafH / 2, 0.18]} position={[0, doorLeafH / 2, 0]} />
          </RigidBody>
        )}
      </group>
    </group>
  );
}
