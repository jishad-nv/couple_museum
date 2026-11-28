import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Floor from '../objects/Floor';
import Wall from '../objects/Wall';
import Bench, { CeilingLight } from '../objects/Decorations';
import PhotoFrame from '../objects/PhotoFrame';
import { LuxuryDoorArchwayFrame, LuxuryDoorLeaf } from '../objects/MuseumDoor';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS } from '../../utils/constants';
import {
  DEFAULT_MUSEUM_PHOTOS,
  type MuseumPhotoItem,
} from '../../utils/museumContentTypes';
import {
  PRIVATE_DOOR_POS,
  QUIZ_MASTER_POS,
  REWARD_BOX_POS,
  SECRET_DOOR_POS,
  SECRET_LETTER_PLINTH_POS,
  SECRET_LOVESEAT_POS,
  SECRET_ROOM_CENTER,
} from '../../utils/museumLayout';
import { useGameStore } from '../../store/gameStore';

const SECRET_CANDLE_CLUSTERS: Array<[number, number, number]> = [
  [-34.1, 0, -24.8],
  [-34.1, 0, -18.2],
  [-30.4, 0, -28.0],
  [-30.4, 0, -15.0],
  [-22.8, 0, -28.0],
  [-22.8, 0, -15.0],
];

const EMBER_COUNT = 48;

function CandleCluster({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.35} />
      </mesh>
      {[
        { x: 0, z: 0, h: 0.42, r: 0.06 },
        { x: -0.11, z: 0.08, h: 0.28, r: 0.05 },
        { x: 0.12, z: -0.07, h: 0.34, r: 0.052 },
      ].map((c, idx) => (
        <group key={idx} position={[c.x, 0.04, c.z]}>
          <mesh position={[0, c.h / 2, 0]} castShadow>
            <cylinderGeometry args={[c.r * 0.9, c.r, c.h, 12]} />
            <meshStandardMaterial color="#f6ead7" roughness={0.62} />
          </mesh>
          <mesh position={[0, c.h + 0.03, 0]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshStandardMaterial
              color="#fff4cc"
              emissive="#ffaa48"
              emissiveIntensity={2.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GlowingCrystalPedestal({ position }: { position: [number, number, number] }) {
  const crystalRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y = state.clock.elapsedTime * 0.35 + position[2];
      crystalRef.current.position.y =
        1.24 + Math.sin(state.clock.elapsedTime * 1.4 + position[2]) * 0.04;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.32, 1.04, 12]} />
        <meshStandardMaterial color="#3c222e" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.05, 12]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.3} />
      </mesh>
      <mesh ref={crystalRef} position={[0, 1.24, 0]}>
        <octahedronGeometry args={[0.17, 0]} />
        <meshStandardMaterial
          color="#ffd4dc"
          emissive="#ff9bb8"
          emissiveIntensity={1.4}
          roughness={0.18}
          metalness={0.15}
        />
      </mesh>
    </group>
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

    // Smoothly turn to face the approaching couple (default facing -Z into center aisle)
    if (rootRef.current) {
      const dx = s.playerPosition.x - QUIZ_MASTER_POS[0];
      const dz = s.playerPosition.z - QUIZ_MASTER_POS[2];
      const dist = Math.hypot(dx, dz);
      const targetYaw = dist < 7.5 ? Math.atan2(dx, dz) : -2.65;
      let diff = targetYaw - rootRef.current.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rootRef.current.rotation.y += diff * Math.min(1, delta * 5.2);
    }

    const engaging =
      s.nearbyInteractable === 'quiz-master' || s.showLoveQuizModal;

    if (torsoRef.current) {
      torsoRef.current.position.y = 1.06 + Math.sin(t * 2.0) * 0.012;
      torsoRef.current.rotation.x = engaging ? Math.sin(t * 2.4) * 0.035 : 0;
    }
    if (headRef.current) {
      headRef.current.rotation.y = engaging ? Math.sin(t * 1.4) * 0.09 : Math.sin(t * 0.6) * 0.04;
      headRef.current.rotation.x = engaging ? Math.sin(t * 2.8) * 0.045 : 0;
    }
    if (rightArmRef.current) {
      // Friendly speaking & welcoming gesture
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

      {/* Subtle brass-trimmed sanctuary mat under Quiz Master */}
      <mesh position={[0, 0.018, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.68, 0.025, 24]} />
        <meshStandardMaterial color="#3f1e2c" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.56, 0.62, 24]} />
        <meshStandardMaterial
          color={COLORS.gold}
          emissive={active ? '#f0b858' : '#7c5a26'}
          emissiveIntensity={active ? 0.9 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={rootRef} rotation={[0, -2.65, 0]}>
        {/* Shoes */}
        <mesh position={[-0.1, 0.05, 0.03]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.22]} />
          <meshStandardMaterial color="#211618" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.05, 0.03]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.22]} />
          <meshStandardMaterial color="#211618" roughness={0.5} />
        </mesh>

        {/* Tailored Trousers */}
        <mesh position={[-0.1, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.062, 0.78, 10]} />
          <meshStandardMaterial color="#2a2436" roughness={0.75} />
        </mesh>
        <mesh position={[0.1, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.062, 0.78, 10]} />
          <meshStandardMaterial color="#2a2436" roughness={0.75} />
        </mesh>

        {/* Torso + Velvet Waistcoat + Golden Lapel Chain */}
        <group ref={torsoRef} position={[0, 1.06, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.19, 0.165, 0.52, 14]} />
            <meshStandardMaterial color="#4e1d32" roughness={0.62} />
          </mesh>
          {/* Cream shirt front & bow tie */}
          <mesh position={[0, 0.06, 0.14]}>
            <boxGeometry args={[0.12, 0.34, 0.06]} />
            <meshStandardMaterial color="#faf2e4" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.2, 0.175]}>
            <boxGeometry args={[0.11, 0.045, 0.03]} />
            <meshStandardMaterial color="#b4843a" metalness={0.35} roughness={0.35} />
          </mesh>
          {/* Pocket watch chain detail */}
          <mesh position={[0.07, -0.05, 0.165]} rotation={[0, 0, -0.2]}>
            <torusGeometry args={[0.045, 0.008, 6, 12, Math.PI]} />
            <meshStandardMaterial color={COLORS.goldLight} metalness={0.5} roughness={0.3} />
          </mesh>

          {/* Left Arm */}
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

          {/* Right Arm (speaking / welcoming gesture) */}
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

          {/* Warm Head, Hair & Gold Spectacles */}
          <group ref={headRef} position={[0, 0.4, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.145, 16, 16]} />
              <meshStandardMaterial color="#ebbfa0" roughness={0.68} />
            </mesh>
            {/* Friendly swept dark-chestnut hair */}
            <mesh position={[0, 0.06, -0.015]} castShadow>
              <sphereGeometry args={[0.148, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
              <meshStandardMaterial color="#3c261d" roughness={0.78} />
            </mesh>
            {/* Kind Eyes */}
            <mesh position={[-0.05, 0.02, 0.132]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#2a1b16" />
            </mesh>
            <mesh position={[0.05, 0.02, 0.132]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#2a1b16" />
            </mesh>
            {/* Round Golden Spectacles */}
            <mesh position={[-0.05, 0.02, 0.142]}>
              <torusGeometry args={[0.028, 0.004, 6, 14]} />
              <meshStandardMaterial color={COLORS.goldLight} metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.05, 0.02, 0.142]}>
              <torusGeometry args={[0.028, 0.004, 6, 14]} />
              <meshStandardMaterial color={COLORS.goldLight} metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Gentle warm smile */}
            <mesh position={[0, -0.052, 0.136]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.032, 0.006, 6, 12, Math.PI * 0.8]} />
              <meshStandardMaterial color="#a85654" />
            </mesh>
          </group>
        </group>

        {/* Floating Subtle Role Label */}
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
  const setShowSecretLetterModal = useGameStore((s) => s.setShowSecretLetterModal);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const s = useGameStore.getState();
    const isQuizDone = s.secretProgress.quizCompleted;
    const hasKey = s.secretProgress.keyCollected;

    if (lidRef.current) {
      const targetAngle = isQuizDone ? -1.16 : 0;
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetAngle,
        1 - Math.exp(-3.2 * delta)
      );
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
      rotation={[0, Math.PI, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (quizCompleted && !keyCollected) {
          collectGoldenKey();
        } else if (quizCompleted) {
          setShowSecretLetterModal(true);
        }
      }}
    >
      {/* Velvet Pedestal */}
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

      {/* Decorative Keepsake Chest Base */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.64, 0.28, 0.44]} />
        <meshStandardMaterial color="#592836" roughness={0.45} />
      </mesh>
      {/* Gold Corner Trim */}
      <mesh position={[0, 0.9, 0.225]}>
        <boxGeometry args={[0.66, 0.05, 0.02]} />
        <meshStandardMaterial color={COLORS.goldLight} metalness={0.45} roughness={0.28} />
      </mesh>
      {/* Front Brass Clasp / Lock */}
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

      {/* Hinged Lid */}
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

      {/* Glowing 3D Golden Key Rising Above Open Chest */}
      {quizCompleted && !keyCollected && (
        <>
          <group ref={keyRef} position={[0, 1.38, 0]}>
            {/* Bow Ring */}
            <mesh position={[-0.14, 0, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.085, 0.022, 10, 20]} />
              <meshStandardMaterial
                color="#ffe68a"
                emissive="#ffbd3b"
                emissiveIntensity={1.85}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>
            {/* Key Shaft */}
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
            {/* Key Teeth */}
            <mesh position={[0.17, -0.045, 0]}>
              <boxGeometry args={[0.032, 0.065, 0.022]} />
              <meshStandardMaterial
                color="#ffe68a"
                emissive="#ffbd3b"
                emissiveIntensity={1.85}
              />
            </mesh>
            <mesh position={[0.11, -0.038, 0]}>
              <boxGeometry args={[0.026, 0.05, 0.022]} />
              <meshStandardMaterial
                color="#ffe68a"
                emissive="#ffbd3b"
                emissiveIntensity={1.85}
              />
            </mesh>
          </group>

          {/* Orbiting Sparkles */}
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
                <meshStandardMaterial
                  color="#fff7d6"
                  emissive="#ffd26e"
                  emissiveIntensity={2.8}
                />
              </mesh>
            ))}
          </group>
        </>
      )}

      {/* Folded Reward Letter resting inside the open keepsake box */}
      {quizCompleted && (
        <group position={[0, 1.06, 0.04]} rotation={[0.14, 0.12, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.025, 0.24]} />
            <meshStandardMaterial color="#f7e8d0" roughness={0.68} />
          </mesh>
          <mesh position={[0.04, 0.018, 0.03]}>
            <cylinderGeometry args={[0.032, 0.032, 0.014, 12]} />
            <meshStandardMaterial color="#b22949" emissive="#d84366" emissiveIntensity={0.65} />
          </mesh>
        </group>
      )}

      <Text
        position={[0, 1.78, 0]}
        fontSize={0.115}
        color={keyCollected ? '#a6ebb4' : quizCompleted ? '#ffe49e' : '#d8c4a6'}
        anchorX="center"
        font={undefined}
      >
        {keyCollected
          ? 'BOX OPENED · VIEW LETTER ♡'
          : quizCompleted
          ? 'OPEN BOX · KEY & LETTER!'
          : 'LOCKED REWARD BOX'}
      </Text>
    </group>
  );
}

function PrivateVaultDoor() {
  const doorPivotRef = useRef<THREE.Group>(null);
  const animKeyRef = useRef<THREE.Group>(null);
  const doorProgressRef = useRef(0);
  const keyAnimElapsedRef = useRef(0);

  const isPrivateDoorOpen = useGameStore((s) => s.isPrivateDoorOpen);
  const secondDoorUnlocked = useGameStore((s) => s.secretProgress.secondDoorUnlocked);
  const keyCollected = useGameStore((s) => s.secretProgress.keyCollected);
  const keyUnlockAnimActive = useGameStore((s) => s.keyUnlockAnimActive);
  const unlockOrEnterPrivateChamber = useGameStore((s) => s.unlockOrEnterPrivateChamber);

  const isPassable = isPrivateDoorOpen;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();
    const openTarget = s.isPrivateDoorOpen ? 1 : 0;

    const nextProgress = THREE.MathUtils.lerp(
      doorProgressRef.current,
      openTarget,
      1 - Math.exp(-3.4 * delta)
    );
    doorProgressRef.current =
      Math.abs(openTarget - nextProgress) < 0.0005 ? openTarget : nextProgress;
    if (doorPivotRef.current) {
      // Swing gracefully westward into the chamber
      doorPivotRef.current.rotation.y = doorProgressRef.current * 1.48;
    }

    if (s.keyUnlockAnimActive && animKeyRef.current) {
      keyAnimElapsedRef.current += delta;
      const p = Math.min(1, keyAnimElapsedRef.current / 1.35);
      // Slide key smoothly into keyhole along -X and turn 90 degrees
      const slideX = THREE.MathUtils.lerp(0.55, 0.18, Math.min(1, p * 1.8));
      const turnX = p > 0.5 ? ((p - 0.5) * 2) * (Math.PI / 2) : 0;
      animKeyRef.current.position.set(slideX, 1.36, 0);
      animKeyRef.current.rotation.set(turnX, 0, 0);
    } else {
      keyAnimElapsedRef.current = 0;
    }
  });

  return (
    <group position={PRIVATE_DOOR_POS}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <LuxuryDoorArchwayFrame openingWidth={2.26} openingHeight={3.52} depth={0.44} variant="vault" />
      </group>

      {/* Physics blocker while locked/closed (permanently mounted sensor toggle avoids Rapier rebuild stall) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.28, 1.8, 1.15]} position={[0, 1.8, 0]} sensor={isPassable} />
      </RigidBody>

      {/* Hinged Luxury Vault Door Leaf */}
      <group
        ref={doorPivotRef}
        position={[0, 0, 1.12]}
        onClick={(e) => {
          e.stopPropagation();
          const st = useGameStore.getState();
          if (st.currentRoom === 'private_chamber') {
            st.exitPrivateChamberToSecret();
          } else {
            unlockOrEnterPrivateChamber();
          }
        }}
      >
        <group rotation={[0, Math.PI / 2, 0]}>
          <LuxuryDoorLeaf
            width={2.22}
            height={3.5}
            thickness={0.14}
            variant="vault"
            hingeSide="left"
            showCenterMedallion
            medallionActive={keyCollected || secondDoorUnlocked}
          />
        </group>
        <Text
          position={[0.12, 2.75, -1.12]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.12}
          color={COLORS.goldLight}
          anchorX="center"
          letterSpacing={0.09}
          font={undefined}
        >
          {secondDoorUnlocked ? 'SECRET ROOM · UNLOCKED' : 'SECRET ROOM · PASSWORD LOCKED'}
        </Text>
      </group>

      {/* Realistic 3D Key Unlock Animation Mesh */}
      {keyUnlockAnimActive && (
        <group ref={animKeyRef} position={[0.55, 1.36, 0]}>
          <mesh position={[0.14, 0, 0]}>
            <torusGeometry args={[0.09, 0.024, 10, 20]} />
            <meshStandardMaterial
              color="#ffea92"
              emissive="#ffc240"
              emissiveIntensity={2.1}
              metalness={0.65}
            />
          </mesh>
          <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.3, 10]} />
            <meshStandardMaterial
              color="#ffea92"
              emissive="#ffc240"
              emissiveIntensity={2.1}
              metalness={0.65}
            />
          </mesh>
          <mesh position={[-0.16, -0.045, 0]}>
            <boxGeometry args={[0.036, 0.07, 0.022]} />
            <meshStandardMaterial color="#ffea92" emissive="#ffc240" emissiveIntensity={2.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function SecretRoom() {
  const photos = useGameStore((s) => s.photos);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const setShowSecretLetterModal = useGameStore((s) => s.setShowSecretLetterModal);
  const embersRef = useRef<THREE.Points>(null);
  const autoPromptedQuizRef = useRef(false);

  const secretTitle = 'PRE-SECRET ROOM';

  const secretMemories = useMemo<MuseumPhotoItem[]>(() => {
    const tagged = photos.filter((p) => p.roomTarget === 'secret');
    if (tagged.length >= 4) return tagged.slice(0, 4);
    const fallbacks = [
      DEFAULT_MUSEUM_PHOTOS[6],
      DEFAULT_MUSEUM_PHOTOS[7],
      DEFAULT_MUSEUM_PHOTOS[12],
      DEFAULT_MUSEUM_PHOTOS[14],
    ].filter(Boolean);
    const combined = [...tagged];
    for (const fb of fallbacks) {
      if (combined.length >= 4) break;
      if (!combined.some((m) => m.id === fb.id)) {
        combined.push(fb);
      }
    }
    return combined;
  }, [photos]);

  const emberPositions = useMemo(() => {
    const arr = new Float32Array(EMBER_COUNT * 3);
    for (let i = 0; i < EMBER_COUNT; i++) {
      const rx = ((Math.sin(i * 17.3) + 1) * 0.5) * 16.5 - 34.5;
      const ry = ((Math.sin(i * 41.7) + 1) * 0.5) * 3.4 + 0.6;
      const rz = ((Math.sin(i * 29.1) + 1) * 0.5) * 12.5 - 27.8;
      arr[i * 3] = rx;
      arr[i * 3 + 1] = ry;
      arr[i * 3 + 2] = rz;
    }
    return arr;
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
        s.showOutfitCustomizer ||
        s.showSecretLetterModal ||
        s.showDoYouLoveMeModal ||
        s.showLoveQuizModal ||
        s.showPrivateMemoryModal ||
        s.showPasswordModal ||
        s.showProposalModal
      ) {
        return;
      }
      if (s.nearbyInteractable === 'quiz-master') {
        if (!s.secretProgress.yesConfirmed) {
          s.setShowDoYouLoveMeModal(true);
        } else {
          s.setShowLoveQuizModal(true, true);
        }
      } else if (s.nearbyInteractable === 'reward-box') {
        if (s.secretProgress.quizCompleted && !s.secretProgress.keyCollected) {
          s.collectGoldenKey();
        } else if (s.secretProgress.quizCompleted) {
          s.setShowSecretLetterModal(true);
        }
      } else if (s.nearbyInteractable === 'private-door') {
        s.unlockOrEnterPrivateChamber();
      } else if (s.nearbyInteractable === 'secret-letter') {
        s.setShowSecretLetterModal(true);
      } else if (s.nearbyInteractable === 'secret-exit') {
        s.exitSecretRoom();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useFrame((state) => {
    if (embersRef.current) {
      embersRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.02;
      embersRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
    }

    const s = useGameStore.getState();
    const px = s.playerPosition.x;
    const pz = s.playerPosition.z;

    if (s.currentRoom !== 'secret') {
      autoPromptedQuizRef.current = false;
      if (
        s.nearbyInteractable === 'quiz-master' ||
        s.nearbyInteractable === 'reward-box' ||
        s.nearbyInteractable === 'private-door' ||
        s.nearbyInteractable === 'secret-letter' ||
        s.nearbyInteractable === 'secret-exit'
      ) {
        s.setNearbyInteractable(null);
      }
      return;
    }

    const dQuiz = Math.hypot(px - QUIZ_MASTER_POS[0], pz - QUIZ_MASTER_POS[2]);
    if (dQuiz > 4.4) {
      autoPromptedQuizRef.current = false;
    } else if (
      dQuiz < 2.25 &&
      !s.secretProgress.quizCompleted &&
      !autoPromptedQuizRef.current &&
      !s.scriptedWalk &&
      !s.showDoYouLoveMeModal &&
      !s.showLoveQuizModal &&
      !s.showSecretLetterModal &&
      !s.showPasswordModal &&
      !s.showAdminLogin &&
      !s.showAdminPanel
    ) {
      autoPromptedQuizRef.current = true;
      if (!s.secretProgress.yesConfirmed) {
        s.setShowDoYouLoveMeModal(true);
      } else {
        s.setShowLoveQuizModal(true, true);
      }
    }

    const candidates: Array<{ id: string; dist: number; max: number }> = [
      {
        id: 'quiz-master',
        dist: dQuiz,
        max: 3.1,
      },
      {
        id: 'secret-letter',
        dist: Math.hypot(px - SECRET_LETTER_PLINTH_POS[0], pz - SECRET_LETTER_PLINTH_POS[2]),
        max: 2.9,
      },
      {
        id: 'private-door',
        dist: !s.isPrivateDoorOpen
          ? Math.hypot(px - PRIVATE_DOOR_POS[0], pz - PRIVATE_DOOR_POS[2])
          : 999,
        max: 3.3,
      },
      {
        id: 'secret-exit',
        dist: Math.hypot(px - SECRET_DOOR_POS[0], pz - SECRET_DOOR_POS[2]),
        max: 3.3,
      },
    ];

    if (s.secretProgress.quizCompleted) {
      candidates.push({
        id: 'reward-box',
        dist: Math.hypot(px - REWARD_BOX_POS[0], pz - REWARD_BOX_POS[2]),
        max: 3.2,
      });
    }

    let bestId: string | null = null;
    let bestDist = Infinity;
    for (const c of candidates) {
      if (c.dist < c.max && c.dist < bestDist) {
        bestDist = c.dist;
        bestId = c.id;
      }
    }

    if (bestId) {
      if (s.nearbyInteractable !== bestId) {
        s.setNearbyInteractable(bestId);
      }
    } else if (
      s.nearbyInteractable === 'quiz-master' ||
      s.nearbyInteractable === 'reward-box' ||
      s.nearbyInteractable === 'private-door' ||
      s.nearbyInteractable === 'secret-letter' ||
      s.nearbyInteractable === 'secret-exit'
    ) {
      s.setNearbyInteractable(null);
    }
  });

  return (
    <group name="OurSecretRoom">
      {/* Dark-walnut & rosewood sanctuary floor flush at y=0 */}
      <Floor position={[-26.5, 0, -21.5]} size={[19.2, 15.2]} color="#2a1a22" />

      {/* Plush Burgundy & Gold Sanctuary Rug */}
      <mesh position={[SECRET_ROOM_CENTER[0], 0.012, SECRET_ROOM_CENTER[2]]} receiveShadow>
        <boxGeometry args={[9.4, 0.02, 6.8]} />
        <meshStandardMaterial color="#4e192d" roughness={0.9} />
      </mesh>
      <mesh position={[SECRET_ROOM_CENTER[0], 0.016, SECRET_ROOM_CENTER[2]]} receiveShadow>
        <boxGeometry args={[8.6, 0.018, 6.0]} />
        <meshStandardMaterial color="#67243c" roughness={0.88} />
      </mesh>

      {/* Enclosed Romantic Walls */}
      <Wall
        position={[-26.4, WALL_HEIGHT / 2, -29.0]}
        size={[18.8, WALL_HEIGHT, WALL_THICKNESS]}
        color="#331c26"
      />
      <Wall
        position={[-26.4, WALL_HEIGHT / 2, -14.0]}
        size={[18.8, WALL_HEIGHT, WALL_THICKNESS]}
        color="#331c26"
      />
      {/* West Wall split around the Second Mysterious Vault Door at PRIVATE_DOOR_POS */}
      <Wall
        position={[-35.6, WALL_HEIGHT / 2, -25.85]}
        size={[WALL_THICKNESS, WALL_HEIGHT, 6.3]}
        color="#2c1720"
      />
      <Wall
        position={[-35.6, WALL_HEIGHT / 2, -17.15]}
        size={[WALL_THICKNESS, WALL_HEIGHT, 6.3]}
        color="#2c1720"
      />
      <Wall
        position={[-35.6, WALL_HEIGHT - 0.65, -21.5]}
        size={[WALL_THICKNESS, 1.3, 2.4]}
        color="#2c1720"
      />

      {/* East wings flanking the entrance doorway from Gallery */}
      <Wall
        position={[-17.15, WALL_HEIGHT / 2, -26.4]}
        size={[WALL_THICKNESS, WALL_HEIGHT, 5.2]}
        color="#331c26"
      />
      <Wall
        position={[-17.15, WALL_HEIGHT / 2, -16.6]}
        size={[WALL_THICKNESS, WALL_HEIGHT, 5.2]}
        color="#331c26"
      />

      {/* Exterior Museum Limestone Cladding on North & South outer walls */}
      <mesh position={[-26.4, WALL_HEIGHT / 2, -13.82]} receiveShadow>
        <planeGeometry args={[18.8, WALL_HEIGHT]} />
        <meshStandardMaterial color="#e8dfd1" roughness={0.45} />
      </mesh>
      <mesh position={[-26.4, WALL_HEIGHT - 0.14, -13.78]}>
        <boxGeometry args={[18.9, 0.24, 0.12]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position={[-26.4, WALL_HEIGHT / 2, -29.18]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[18.8, WALL_HEIGHT]} />
        <meshStandardMaterial color="#e8dfd1" roughness={0.45} />
      </mesh>

      {/* Intimate vaulted walnut ceiling & ribs */}
      <mesh position={[-26.4, WALL_HEIGHT, -21.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18.8, 15.2]} />
        <meshStandardMaterial color="#23121b" roughness={0.78} />
      </mesh>
      {[-32.5, -26.5, -20.5].map((rx, idx) => (
        <mesh key={`beam-${idx}`} position={[rx, WALL_HEIGHT - 0.14, -21.5]}>
          <boxGeometry args={[0.26, 0.28, 14.8]} />
          <meshStandardMaterial color="#462632" roughness={0.62} />
        </mesh>
      ))}

      {/* Warm Brass Chandeliers */}
      <CeilingLight position={[-26.5, WALL_HEIGHT - 0.12, -21.5]} />
      <CeilingLight position={[-31.2, WALL_HEIGHT - 0.12, -21.5]} />
      <CeilingLight position={[-21.8, WALL_HEIGHT - 0.12, -21.5]} />

      {/* Sanctuary Crest Banner Mounted Above Vault Doorway */}
      <group position={[-35.32, 4.25, -21.5]}>
        <mesh>
          <boxGeometry args={[0.08, 0.62, 4.2]} />
          <meshStandardMaterial color="#26111c" roughness={0.5} />
        </mesh>
        <Text
          position={[0.06, 0.08, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.24}
          color={COLORS.goldLight}
          anchorX="center"
          letterSpacing={0.12}
          font={undefined}
        >
          {secretTitle.toUpperCase()}
        </Text>
        <Text
          position={[0.06, -0.18, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.11}
          color="#f2c4cf"
          anchorX="center"
          font={undefined}
        >
          Meet the Quiz Master, Open the Chest &amp; Enter the Secret Room Password
        </Text>
      </group>

      {/* Second Mysterious Door (unlocks after Quiz Master + Golden Key) */}
      <PrivateVaultDoor />

      {/* Interactive 3D Love Quiz Master NPC */}
      <QuizMasterNPC />

      {/* Locked Decorative Reward Chest & Rising Golden Key */}
      <RewardBox3D />

      {/* Secret Love Letters Pedestal */}
      <group
        position={SECRET_LETTER_PLINTH_POS}
        onClick={(e) => {
          e.stopPropagation();
          setShowSecretLetterModal(true);
        }}
      >
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.38, 0.48, 0.96, 16]} />
            <meshStandardMaterial color="#40212e" roughness={0.52} />
          </mesh>
        </RigidBody>
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.05, 16]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.35} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.03, 0]} rotation={[0, Math.PI / 2, -0.18]}>
          <boxGeometry args={[0.52, 0.03, 0.38]} />
          <meshStandardMaterial color="#f6e7cf" roughness={0.7} />
        </mesh>
        <mesh position={[0.06, 1.06, 0.08]}>
          <cylinderGeometry args={[0.042, 0.042, 0.02, 12]} />
          <meshStandardMaterial color="#b22949" emissive="#d84366" emissiveIntensity={0.75} />
        </mesh>
        <Text
          position={[0, 1.52, 0]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.11}
          color={COLORS.goldLight}
          anchorX="center"
          font={undefined}
        >
          SECRET LOVE LETTER
        </Text>
      </group>

      {/* Interactive Plush Velvet Loveseat */}
      <Bench
        position={SECRET_LOVESEAT_POS}
        rotation={[0, 0, 0]}
        benchId="secret-loveseat"
        benchLabel="Secret Sanctuary Loveseat"
        interactive
      />

      {/* Candle Clusters & Glowing Rose-Quartz Crystal Pedestals */}
      {SECRET_CANDLE_CLUSTERS.map((pos, idx) => (
        <CandleCluster key={`sc-${idx}`} position={pos} />
      ))}
      <GlowingCrystalPedestal position={[-34.4, 0, -23.7]} />
      <GlowingCrystalPedestal position={[-34.4, 0, -19.3]} />

      {/* 4 Personal Couple Photographs Mounted on North & South Walnut Walls */}
      {secretMemories[0] && (
        <PhotoFrame
          position={[-29.2, 2.35, -28.72]}
          rotation={[0, 0, 0]}
          memory={secretMemories[0]}
          size={[2.0, 1.42]}
        />
      )}
      {secretMemories[1] && (
        <PhotoFrame
          position={[-23.6, 2.35, -28.72]}
          rotation={[0, 0, 0]}
          memory={secretMemories[1]}
          size={[2.0, 1.42]}
        />
      )}
      {secretMemories[2] && (
        <PhotoFrame
          position={[-29.2, 2.35, -14.28]}
          rotation={[0, Math.PI, 0]}
          memory={secretMemories[2]}
          size={[2.0, 1.42]}
        />
      )}
      {secretMemories[3] && (
        <PhotoFrame
          position={[-23.6, 2.35, -14.28]}
          rotation={[0, Math.PI, 0]}
          memory={secretMemories[3]}
          size={[2.0, 1.42]}
        />
      )}

      {/* Subtle Floating Golden Candlelight Embers */}
      <points ref={embersRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffdca0"
          size={currentRoom === 'secret' ? 0.08 : 0.05}
          transparent
          opacity={0.78}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
