import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import {
  isProposalCelebrationActive,
  shouldPlayProposalFlowerAnimation,
} from '../utils/proposal';
import {
  TRAIL_HEART_POOL_SIZE,
  createTrailHeartPool,
  stepTrailHeartPool,
} from '../utils/trailHearts';

const HEART_COUNT = 10;
const SPARKLE_COUNT = 16;
const PETAL_COUNT = 38;
const HUG_MOTE_COUNT = 12;
const TRAIL_HEART_COLORS = ['#ff6fa3', '#ff8eb8', '#ffb3cf'] as const;
const RED_ROSE_PETAL_COLORS = ['#c41634', '#df2646', '#9c0e26', '#eb425e'] as const;

function createHeartGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.03);
  shape.bezierCurveTo(0, 0.06, -0.05, 0.06, -0.05, 0.025);
  shape.bezierCurveTo(-0.05, -0.01, 0, -0.035, 0, -0.055);
  shape.bezierCurveTo(0, -0.035, 0.05, -0.01, 0.05, 0.025);
  shape.bezierCurveTo(0.05, 0.06, 0, 0.06, 0, 0.03);
  return new THREE.ShapeGeometry(shape, 8);
}

function createRosePetalGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.038);
  shape.bezierCurveTo(0.032, -0.024, 0.044, 0.015, 0.022, 0.042);
  shape.bezierCurveTo(0.008, 0.052, 0, 0.042, 0, 0.042);
  shape.bezierCurveTo(0, 0.042, -0.008, 0.052, -0.022, 0.042);
  shape.bezierCurveTo(-0.044, 0.015, -0.032, -0.024, 0, -0.038);
  return new THREE.ShapeGeometry(shape, 7);
}

/**
 * Pooled, zero-allocation romantic visual effects:
 * - Kiss: glowing pink rising hearts + soft rose-pink glow ONLY
 * - Hug: NO hearts — warm golden-amber glow, gentle amber motes, and an expanding warm floor pulse ring
 * - Proposal Kneel/Ask: gentle warm ring spotlight rim
 * - Proposal Celebration & Wedding Celebration: floating hearts, cascading flower petals, sparkles & warm lighting
 */
export default function CoupleEffects() {
  const heartRefs = useRef<Array<THREE.Mesh | null>>([]);
  const trailHeartRefs = useRef<Array<THREE.Mesh | null>>([]);
  const sparkleRefs = useRef<Array<THREE.Mesh | null>>([]);
  const petalRefs = useRef<Array<THREE.Mesh | null>>([]);
  const hugMoteRefs = useRef<Array<THREE.Mesh | null>>([]);
  const hugRingRef = useRef<THREE.Mesh>(null);
  const kissLightRef = useRef<THREE.PointLight>(null);
  const hugLightRef = useRef<THREE.PointLight>(null);
  const proposalLightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);
  const proposalPetalTimeRef = useRef(0);
  const trailPoolRef = useRef(createTrailHeartPool(TRAIL_HEART_POOL_SIZE));
  const lastTrailCountRef = useRef(-1);
  const lastProposalStateRef = useRef<string>('');

  const heartGeo = useMemo(() => createHeartGeometry(), []);
  const sparkleGeo = useMemo(() => new THREE.SphereGeometry(0.022, 6, 6), []);
  const petalGeo = useMemo(() => createRosePetalGeometry(), []);
  const hugMoteGeo = useMemo(() => new THREE.SphereGeometry(0.02, 6, 6), []);
  const hugRingGeo = useMemo(() => new THREE.RingGeometry(0.36, 0.44, 36), []);

  useEffect(() => {
    return () => {
      heartGeo.dispose();
      sparkleGeo.dispose();
      petalGeo.dispose();
      hugMoteGeo.dispose();
      hugRingGeo.dispose();
    };
  }, [heartGeo, sparkleGeo, petalGeo, hugMoteGeo, hugRingGeo]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const particleDelta = Math.min(rawDelta, 0.2);
    timeRef.current += delta;
    const t = timeRef.current;

    const s = useGameStore.getState();
    const midX = (s.playerPosition.x + s.partnerPosition.x) * 0.5;
    const midZ = (s.playerPosition.z + s.partnerPosition.z) * 0.5;

    const isProposalCelebration = isProposalCelebrationActive(s.proposalStage);
    const isProposalFlowerActive = shouldPlayProposalFlowerAnimation(s.proposalStage);
    const isProposalKneel =
      s.proposalStage === 'kneeling' || s.proposalStage === 'awaiting_answer';

    if (isProposalFlowerActive) {
      proposalPetalTimeRef.current += delta;
    } else {
      proposalPetalTimeRef.current = 0;
    }

    // Hearts appear ONLY for Kiss or Proposal celebration (never for Hug!)
    const showHearts =
      s.activeCoupleSequence === 'kiss' || isProposalCelebration;

    // Warm golden glow + soft drifting motes + floor pulse ring for Hug (zero hearts)
    const showHugWarmth =
      s.activeCoupleSequence === 'hug' ||
      (s.currentRoom === 'wedding' && s.weddingStage === 'hug');

    const showDanceSparkles =
      s.isDancing ||
      isProposalCelebration ||
      (s.currentRoom === 'wedding' &&
        (s.weddingStage === 'vows' || s.weddingStage === 'celebrating'));

    const showPetals =
      isProposalFlowerActive ||
      (s.currentRoom === 'wedding' && s.weddingStage === 'celebrating');

    const proposalDatasetState = `${s.proposalStage}:${isProposalFlowerActive ? 'petals' : 'off'}`;
    if (proposalDatasetState !== lastProposalStateRef.current) {
      lastProposalStateRef.current = proposalDatasetState;
      if (typeof document !== 'undefined') {
        document.body.dataset.proposalEffects = isProposalCelebration
          ? 'active'
          : isProposalKneel
          ? 'kneel'
          : 'idle';
        document.body.dataset.proposalPetals = isProposalFlowerActive ? 'active' : 'off';
      }
    }

    // Dynamic lights
    if (kissLightRef.current) {
      kissLightRef.current.position.set(midX, 1.8, midZ);
      kissLightRef.current.intensity =
        s.activeCoupleSequence === 'kiss' ? 2.5 + Math.sin(t * 4) * 0.35 : 0;
    }

    if (hugLightRef.current) {
      hugLightRef.current.position.set(midX, 1.55, midZ);
      hugLightRef.current.intensity = showHugWarmth
        ? 3.1 + Math.sin(t * 3.2) * 0.5
        : 0;
    }

    if (proposalLightRef.current) {
      proposalLightRef.current.position.set(midX, isProposalCelebration ? 2.6 : 1.45, midZ);
      proposalLightRef.current.intensity = isProposalCelebration
        ? 4.2 + Math.sin(t * 4.5) * 0.5
        : isProposalKneel
        ? 2.4 + Math.sin(t * 2.5) * 0.3
        : 0;
    }

    // Expanding warm golden floor pulse ring during Hug
    if (hugRingRef.current) {
      if (!showHugWarmth) {
        hugRingRef.current.visible = false;
      } else {
        const ringCycle = (t * 0.62) % 1;
        hugRingRef.current.visible = true;
        hugRingRef.current.position.set(midX, 0.025, midZ);
        hugRingRef.current.scale.setScalar(0.95 + ringCycle * 1.9);
        const mat = hugRingRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(ringCycle * Math.PI) * 0.45;
      }
    }

    // Warm golden amber motes rising gently during Hug
    for (let i = 0; i < HUG_MOTE_COUNT; i++) {
      const m = hugMoteRefs.current[i];
      if (!m) continue;
      if (!showHugWarmth) {
        m.visible = false;
        continue;
      }
      const cycle = ((t * 0.48 + i / HUG_MOTE_COUNT) % 1 + 1) % 1;
      const angle = i * 2.1 + t * 1.1;
      const radius = 0.42 + Math.sin(cycle * Math.PI) * 0.28;
      m.visible = true;
      m.position.set(
        midX + Math.cos(angle) * radius,
        0.55 + cycle * 1.45,
        midZ + Math.sin(angle) * radius
      );
      const scale = Math.sin(cycle * Math.PI) * 1.1;
      m.scale.setScalar(Math.max(0.05, scale));
    }

    // Floating rose-pink hearts for Kiss & Proposal Celebration
    for (let i = 0; i < HEART_COUNT; i++) {
      const m = heartRefs.current[i];
      if (!m) continue;
      if (!showHearts) {
        m.visible = false;
        continue;
      }
      const cycle = ((t * 0.62 + i / HEART_COUNT) % 1 + 1) % 1;
      const angle = i * 1.9 + t * 0.9;
      const spread = (isProposalCelebration ? 0.35 : 0.14) + cycle * (isProposalCelebration ? 0.55 : 0.24);
      m.visible = true;
      m.position.set(
        midX + Math.cos(angle) * spread,
        1.55 + cycle * (isProposalCelebration ? 1.45 : 0.95),
        midZ + Math.sin(angle) * spread
      );
      m.rotation.y = angle + t * 0.5;
      const scale = Math.sin(cycle * Math.PI) * (isProposalCelebration ? 1.3 : 1.15);
      m.scale.setScalar(Math.max(0.01, scale));
    }

    // Swirling golden sparkles
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const m = sparkleRefs.current[i];
      if (!m) continue;
      if (!showDanceSparkles) {
        m.visible = false;
        continue;
      }
      const orbitAngle = t * 1.35 + (i * Math.PI * 2) / SPARKLE_COUNT;
      const radius = 0.72 + (i % 3) * 0.34;
      const yBob = 0.28 + ((i * 0.23 + t * 0.38) % 1.55);
      m.visible = true;
      m.position.set(
        midX + Math.cos(orbitAngle) * radius,
        yBob,
        midZ + Math.sin(orbitAngle) * radius
      );
      const pulse = 0.65 + Math.sin(t * 4 + i) * 0.35;
      m.scale.setScalar(pulse);
    }

    // Tossed & cascading red rose petals for Wedding Celebration & Proposal Celebration
    const isWeddingCelebrating = s.currentRoom === 'wedding' && s.weddingStage === 'celebrating';
    const petalTime = isProposalFlowerActive && !isWeddingCelebrating ? proposalPetalTimeRef.current : t;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const m = petalRefs.current[i];
      if (!m) continue;
      if (!showPetals) {
        m.visible = false;
        continue;
      }
      const fallCycle = ((petalTime * 0.36 + i * 0.079) % 1 + 1) % 1;
      const angle = i * 2.399 + petalTime * 0.55;
      const radial = isWeddingCelebrating
        ? 0.35 + ((i * 17) % 10) * 0.24
        : 0.4 + ((i * 19) % 11) * 0.21;
      const driftX = Math.sin(petalTime * 2.1 + i) * 0.36;
      const driftZ = Math.cos(petalTime * 1.7 + i * 0.7) * 0.36;
      // Gentle toss upward arc from side guests before fluttering down cleanly around the couple
      const yPos =
        fallCycle < 0.22
          ? 1.55 + Math.sin((fallCycle / 0.22) * (Math.PI / 2)) * 2.45
          : 4.0 - ((fallCycle - 0.22) / 0.78) * 3.88;
      m.visible = true;
      m.position.set(
        midX + Math.cos(angle) * radial + driftX,
        yPos,
        midZ + Math.sin(angle) * radial + driftZ
      );
      m.rotation.set(petalTime * 2.4 + i, petalTime * 1.7 + i * 0.6, Math.sin(petalTime * 2.2 + i) * 0.9);
      m.scale.setScalar(0.95 + (i % 3) * 0.22);
    }

    // Subtle trailing hearts when characters move through the museum during non-proposal moments
    const activeTrailCount = stepTrailHeartPool(trailPoolRef.current, {
      delta: particleDelta,
      playerPos: s.playerPosition,
      partnerPos: s.partnerPosition,
      eligibility: {
        proposalStage: s.proposalStage,
        isSitting: s.isSitting,
        activeCoupleSequence: s.activeCoupleSequence,
        currentRoom: s.currentRoom,
        weddingStage: s.weddingStage,
      },
    });

    if (activeTrailCount !== lastTrailCountRef.current) {
      lastTrailCountRef.current = activeTrailCount;
      if (typeof document !== 'undefined') {
        document.body.dataset.trailHearts = String(activeTrailCount);
      }
    }

    const camX = state.camera.position.x;
    const camZ = state.camera.position.z;
    const trailParticles = trailPoolRef.current.particles;
    for (let i = 0; i < trailParticles.length; i++) {
      const m = trailHeartRefs.current[i];
      const p = trailParticles[i];
      if (!m) continue;
      if (!p.active || p.opacity <= 0.005) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(p.x, p.y, p.z);
      const faceCamY = Math.atan2(camX - p.x, camZ - p.z);
      m.rotation.set(
        Math.sin(p.age * 2.2 + p.phase) * 0.12,
        faceCamY + Math.sin(p.age * 1.8 + p.phase) * 0.22,
        Math.sin(p.age * 2.6 + p.phase) * 0.16
      );
      m.scale.setScalar(p.scale);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = p.opacity;
    }
  });

  return (
    <group>
      <pointLight ref={kissLightRef} color="#ff8eb8" intensity={0} distance={5} decay={2} />
      <pointLight ref={hugLightRef} color="#ffcb8c" intensity={0} distance={5.5} decay={2} />
      <pointLight ref={proposalLightRef} color="#ffe0a6" intensity={0} distance={6.5} decay={2} />

      <mesh
        ref={hugRingRef}
        geometry={hugRingGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <meshBasicMaterial
          color="#ffd79a"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {Array.from({ length: HUG_MOTE_COUNT }).map((_, i) => (
        <mesh
          key={`hm-${i}`}
          ref={(el) => {
            hugMoteRefs.current[i] = el;
          }}
          geometry={hugMoteGeo}
          visible={false}
        >
          <meshBasicMaterial
            color={i % 2 === 0 ? '#ffe1a8' : '#ffd2b8'}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}

      {Array.from({ length: HEART_COUNT }).map((_, i) => (
        <mesh
          key={`kh-${i}`}
          ref={(el) => {
            heartRefs.current[i] = el;
          }}
          geometry={heartGeo}
          visible={false}
        >
          <meshBasicMaterial color="#ff85aa" transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {Array.from({ length: TRAIL_HEART_POOL_SIZE }).map((_, i) => (
        <mesh
          key={`th-${i}`}
          ref={(el) => {
            trailHeartRefs.current[i] = el;
          }}
          geometry={heartGeo}
          visible={false}
          renderOrder={2}
        >
          <meshBasicMaterial
            color={TRAIL_HEART_COLORS[i % TRAIL_HEART_COLORS.length]}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
        <mesh
          key={`ds-${i}`}
          ref={(el) => {
            sparkleRefs.current[i] = el;
          }}
          geometry={sparkleGeo}
          visible={false}
        >
          <meshBasicMaterial color="#ffe49e" transparent opacity={0.82} />
        </mesh>
      ))}

      {Array.from({ length: PETAL_COUNT }).map((_, i) => (
        <mesh
          key={`wp-${i}`}
          ref={(el) => {
            petalRefs.current[i] = el;
          }}
          geometry={petalGeo}
          visible={false}
        >
          <meshBasicMaterial
            color={RED_ROSE_PETAL_COLORS[i % RED_ROSE_PETAL_COLORS.length]}
            transparent
            opacity={0.94}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
