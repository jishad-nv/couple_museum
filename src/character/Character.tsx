import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../utils/constants';
import {
  DEFAULT_BRIDE_OUTFIT,
  DEFAULT_GROOM_OUTFIT,
  resolveBrideColors,
  resolveGroomColors,
  type BrideOutfitConfig,
  type GroomOutfitConfig,
} from '../utils/weddingAttire';
import type { BouquetDesign, BouquetReactionType } from '../utils/bouquet';
import CustomBouquetMesh from '../world/objects/CustomBouquetMesh';

interface CharacterProps {
  position?: [number, number, number];
  rotation?: number;
  action?: string;
  isMale?: boolean;
  color?: string;
  isHoldingHands?: boolean;
  weddingMode?: boolean;
  brideOutfit?: BrideOutfitConfig;
  groomOutfit?: GroomOutfitConfig;
  heldBouquet?: BouquetDesign | null;
  bouquetReaction?: BouquetReactionType;
}

// Standing kinematic skeleton heights (meters, base floor at y = 0):
// Hip pivot at y = 0.84, Thigh = 0.41 -> Knee pivot at -0.41 (y = 0.43)
// LowerLeg = 0.37, Foot center at -0.40 (box height 0.055 -> sole bottom at -0.4275 below knee => y = 0.0025m)
// Seated kinematics on Bench (cushion top y = 0.465m, thigh bottom offset ~0.072m):
// Seated hipY = 0.465 + 0.072 = 0.537m => targetBodyY = 0.537 - 0.84 = -0.303m
// One-knee Proposal kneel kinematics:
// Kneeling hipY = 0.46m => targetBodyY = -0.38m; right knee rests flush at y ~ 0.00m, left foot sole rests at y ~ 0.00m
const SEATED_BODY_Y = -0.303;
const KNEEL_BODY_Y = -0.38;

function createTaperedHairCascadeGeometry(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.08, 0.24),
    new THREE.Vector2(0.165, 0.16),
    new THREE.Vector2(0.18, 0.04),
    new THREE.Vector2(0.172, -0.10),
    new THREE.Vector2(0.152, -0.24),
    new THREE.Vector2(0.115, -0.34),
    new THREE.Vector2(0.02, -0.38),
  ];
  return new THREE.LatheGeometry(pts, 18);
}

export default function Character({
  position = [0, 0, 0],
  rotation = 0,
  action = 'idle',
  isMale = true,
  color,
  isHoldingHands = false,
  weddingMode = false,
  brideOutfit = DEFAULT_BRIDE_OUTFIT,
  groomOutfit = DEFAULT_GROOM_OUTFIT,
  heldBouquet = null,
  bouquetReaction = 'none',
}: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const limbPhaseRef = useRef(0);

  const bridePalette = resolveBrideColors(brideOutfit);
  const groomPalette = resolveGroomColors(groomOutfit);

  const skinColor = isMale ? '#e9b89b' : '#f4cbb4';
  const blushColor = isMale ? '#df9780' : '#ef939e';
  const lipColor = isMale ? '#b86c66' : '#c95e6f';
  const hairColor = isMale ? '#2c1c12' : '#24140c';
  const irisColor = isMale ? '#38251a' : '#2f1f18';
  const topColor = weddingMode
    ? isMale
      ? groomPalette.jacket
      : bridePalette.dress
    : color || (isMale ? '#26395c' : COLORS.rosePink);
  const topTrimColor = weddingMode
    ? isMale
      ? groomPalette.trim
      : bridePalette.bodiceLace
    : isMale
    ? '#f3ede3'
    : '#f9d3dd';
  const bottomColor = weddingMode
    ? isMale
      ? groomPalette.trousers
      : bridePalette.skirtTrim
    : isMale
    ? '#1f2332'
    : '#352236';
  const shoeColor = weddingMode
    ? isMale
      ? groomPalette.shoe
      : bridePalette.shoe
    : isMale
    ? '#1c181a'
    : '#8a2352';

  const bodyGeometries = useMemo(
    () => ({
      head: new THREE.SphereGeometry(0.162, 24, 22),
      jaw: new THREE.SphereGeometry(0.116, 18, 14),
      ear: new THREE.SphereGeometry(0.028, 10, 10),
      hairCap: new THREE.SphereGeometry(0.168, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairCascade: createTaperedHairCascadeGeometry(),
      torsoUpper: new THREE.CylinderGeometry(0.182, 0.158, 0.29, 20),
      torsoWaist: new THREE.CylinderGeometry(0.158, 0.166, 0.19, 20),
      shoulderCap: new THREE.SphereGeometry(0.054, 14, 12),
      collar: new THREE.TorusGeometry(0.086, 0.02, 10, 20),
      belt: new THREE.CylinderGeometry(0.172, 0.172, 0.044, 20),
      skirt: new THREE.CylinderGeometry(0.168, 0.285, 0.38, 24),
      skirtTrim: new THREE.TorusGeometry(0.282, 0.011, 8, 24),
      hip: new THREE.CylinderGeometry(0.172, 0.158, 0.16, 18),
      upperArm: new THREE.CylinderGeometry(0.055, 0.046, 0.28, 14),
      elbow: new THREE.SphereGeometry(0.044, 12, 10),
      lowerArm: new THREE.CylinderGeometry(0.045, 0.036, 0.26, 14),
      hand: new THREE.SphereGeometry(0.043, 12, 12),
      thumb: new THREE.SphereGeometry(0.019, 8, 8),
      upperLeg: new THREE.CylinderGeometry(0.072, 0.058, 0.41, 16),
      knee: new THREE.SphereGeometry(0.058, 12, 10),
      lowerLeg: new THREE.CylinderGeometry(0.057, 0.043, 0.37, 16),
      foot: new THREE.BoxGeometry(0.088, 0.05, 0.185),
      footToe: new THREE.SphereGeometry(0.044, 12, 10),
      neck: new THREE.CylinderGeometry(0.058, 0.068, 0.105, 14),
      smile: new THREE.TorusGeometry(0.025, 0.0055, 8, 14, Math.PI),
      eyelash: new THREE.TorusGeometry(0.021, 0.0035, 6, 12, Math.PI),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(bodyGeometries).forEach((g) => g.dispose());
    };
  }, [bodyGeometries]);

  const leftUpperArmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const leftUpperLegRef = useRef<THREE.Group>(null);
  const rightUpperLegRef = useRef<THREE.Group>(null);
  const leftLowerLegRef = useRef<THREE.Group>(null);
  const rightLowerLegRef = useRef<THREE.Group>(null);
  const leftLowerArmRef = useRef<THREE.Group>(null);
  const rightLowerArmRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Group>(null);
  const rightFootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const ringGlowRef = useRef<THREE.Mesh>(null);
  const leftBlushMeshRef = useRef<THREE.Mesh>(null);
  const rightBlushMeshRef = useRef<THREE.Mesh>(null);
  const leftBlushMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightBlushMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseBlushColorObj = useMemo(
    () => new THREE.Color(isMale ? '#df9780' : '#ef939e'),
    [isMale]
  );
  const activeBlushColorObj = useMemo(
    () => new THREE.Color(isMale ? '#e97b86' : '#f08294'),
    [isMale]
  );
  const workingBlushColorRef = useRef(new THREE.Color(isMale ? '#df9780' : '#ef939e'));
  const blushLevelRef = useRef(0);

  // Pre-allocated Euler targets so useFrame never allocates
  const targets = useMemo(
    () => ({
      leftUpperArm: new THREE.Euler(),
      rightUpperArm: new THREE.Euler(),
      leftLowerArm: new THREE.Euler(),
      rightLowerArm: new THREE.Euler(),
      leftUpperLeg: new THREE.Euler(),
      rightUpperLeg: new THREE.Euler(),
      leftLowerLeg: new THREE.Euler(),
      rightLowerLeg: new THREE.Euler(),
      leftFoot: new THREE.Euler(),
      rightFoot: new THREE.Euler(),
    }),
    []
  );

  const smoothRot = (targetRot: THREE.Euler, currentRot: THREE.Euler, factor: number) => {
    currentRot.x = THREE.MathUtils.lerp(currentRot.x, targetRot.x, factor);
    currentRot.y = THREE.MathUtils.lerp(currentRot.y, targetRot.y, factor);
    currentRot.z = THREE.MathUtils.lerp(currentRot.z, targetRot.z, factor);
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    timeRef.current += delta;
    const t = timeRef.current;

    const isSitting = action === 'sit';
    const isKneeling = action === 'propose_kneel';
    const isProposeStand = action === 'propose_stand';
    const isProposeSurprised = action === 'propose_surprised';
    const isProposeAccept = action === 'propose_accept';
    const isProposeEmbrace = action === 'propose_embrace';
    const isRunning = action === 'run';
    const isWalking = action === 'walk' || action === 'hold_hands_walk';
    const isHugging = action === 'hug' || isProposeEmbrace;
    const isKissing = action === 'kiss';
    const isDancing = action === 'dance';
    const isVows = action === 'vows';
    const isCelebrating = action === 'celebrate';
    const isCakeCut = action === 'cake_cut';
    const isCakeFeedGive = action === 'cake_feed_give';
    const isCakeFeedReceive = action === 'cake_feed_receive';
    const isBouquetGive = action === 'bouquet_give';
    const isBouquetReceive = action === 'bouquet_receive';
    const isBouquetBlush = action === 'bouquet_react_blush';
    const isBouquetHappy = action === 'bouquet_react_happy';

    const lerpRate = isSitting || isKneeling || isProposeStand ? 8.5 : 12;
    const lerpSpeed = 1 - Math.exp(-lerpRate * delta);

    let walkSpeed = 0;
    let walkAmplitude = 0;
    let armSwing = 0;
    let bodyBob = 0;
    let bodyLean = 0;

    if (isRunning) {
      walkSpeed = 10;
      walkAmplitude = 0.65;
      armSwing = 0.8;
      bodyBob = 0.026;
      bodyLean = 0.07;
    } else if (isWalking) {
      walkSpeed = isHoldingHands ? 5.2 : 6;
      walkAmplitude = 0.44;
      armSwing = 0.48;
      bodyBob = 0.013;
      bodyLean = 0.025;
    } else if (
      isSitting ||
      isKneeling ||
      isProposeStand ||
      isProposeSurprised ||
      isProposeAccept ||
      isHugging ||
      isKissing ||
      isDancing ||
      isVows ||
      isCelebrating ||
      isCakeCut ||
      isCakeFeedGive ||
      isCakeFeedReceive ||
      isBouquetGive ||
      isBouquetReceive ||
      isBouquetBlush ||
      isBouquetHappy
    ) {
      walkSpeed = 0;
    } else {
      // Gentle natural breathing & posture micro-sway in idle
      walkSpeed = 1.15;
      walkAmplitude = 0.012;
      armSwing = 0.032;
      bodyBob = 0.0045;
      bodyLean = 0;
    }

    limbPhaseRef.current += delta * walkSpeed;
    const phase = limbPhaseRef.current;

    const {
      leftUpperArm: tLeftUpperArm,
      rightUpperArm: tRightUpperArm,
      leftLowerArm: tLeftLowerArm,
      rightLowerArm: tRightLowerArm,
      leftUpperLeg: tLeftUpperLeg,
      rightUpperLeg: tRightUpperLeg,
      leftLowerLeg: tLeftLowerLeg,
      rightLowerLeg: tRightLowerLeg,
      leftFoot: tLeftFoot,
      rightFoot: tRightFoot,
    } = targets;

    tLeftUpperArm.set(0, 0, 0);
    tRightUpperArm.set(0, 0, 0);
    tLeftLowerArm.set(0, 0, 0);
    tRightLowerArm.set(0, 0, 0);
    tLeftUpperLeg.set(0, 0, 0);
    tRightUpperLeg.set(0, 0, 0);
    tLeftLowerLeg.set(0, 0, 0);
    tRightLowerLeg.set(0, 0, 0);
    tLeftFoot.set(0, 0, 0);
    tRightFoot.set(0, 0, 0);

    let targetBodyY = 0;
    let targetBodyLeanX = 0;
    let targetBodyTiltZ = 0;
    let targetHeadRotY = 0;
    let targetHeadRotX = 0;
    let targetHeadRotZ = 0;

    if (isSitting) {
      targetBodyY = SEATED_BODY_Y;
      tLeftUpperLeg.x = -Math.PI / 2 + 0.04;
      tRightUpperLeg.x = -Math.PI / 2 + 0.04;
      tLeftLowerLeg.x = Math.PI / 2 - 0.05;
      tRightLowerLeg.x = Math.PI / 2 - 0.05;
      tLeftFoot.x = 0.01;
      tRightFoot.x = 0.01;

      if (isHoldingHands) {
        if (isMale) {
          tLeftUpperArm.x = -0.34;
          tLeftUpperArm.z = -0.22;
          tLeftLowerArm.x = -0.42;
          tRightUpperArm.x = -0.34;
          tRightUpperArm.z = 0.05;
          tRightLowerArm.x = -0.58;
          targetHeadRotY = -0.11;
        } else {
          tRightUpperArm.x = -0.34;
          tRightUpperArm.z = 0.22;
          tRightLowerArm.x = -0.42;
          tLeftUpperArm.x = -0.34;
          tLeftUpperArm.z = -0.05;
          tLeftLowerArm.x = -0.58;
          targetHeadRotY = 0.11;
        }
      } else {
        tLeftUpperArm.x = -0.36;
        tRightUpperArm.x = -0.36;
        tLeftLowerArm.x = -0.56;
        tRightLowerArm.x = -0.56;
      }
      targetBodyLeanX = -0.055;
    } else if (isKneeling) {
      // Exact grounded one-knee proposal pose: left foot planted flat forward, right knee resting on floor
      targetBodyY = KNEEL_BODY_Y;
      targetBodyLeanX = 0.04;

      // Left leg forward, vertical shin planted cleanly on floor
      tLeftUpperLeg.x = -1.48;
      tLeftLowerLeg.x = 1.48;
      tLeftFoot.x = 0;

      // Right leg kneeling neatly beneath hip
      tRightUpperLeg.x = 0.2;
      tRightLowerLeg.x = 1.37;
      tRightFoot.x = 0.12;

      // Left hand rests gracefully near left knee/waist
      tLeftUpperArm.x = -0.42;
      tLeftUpperArm.z = -0.14;
      tLeftLowerArm.x = -0.58;

      // Right arm smoothly extends forward presenting the ring box & diamond ring
      const presentPulse = Math.sin(t * 2.1) * 0.035;
      tRightUpperArm.x = -0.82 + presentPulse;
      tRightUpperArm.z = -0.14;
      tRightLowerArm.x = -0.58;

      // Look warmly upward at partner's eyes
      targetHeadRotX = -0.24;
      targetHeadRotY = 0;
    } else if (isProposeStand) {
      // Standing up gracefully right after YES, smiling warmly with open happy posture
      targetBodyY = Math.sin(t * 2.4) * 0.005;
      targetBodyLeanX = 0.02;
      tLeftUpperArm.x = -0.45;
      tLeftUpperArm.z = -0.18;
      tLeftLowerArm.x = -0.55;
      tRightUpperArm.x = -0.65;
      tRightUpperArm.z = -0.15;
      tRightLowerArm.x = -0.68;
      targetHeadRotX = -0.05;
    } else if (isProposeSurprised) {
      // Receiving partner touched & happily surprised while looking down at the ring
      targetBodyY = Math.sin(t * 2.2) * 0.006;
      targetBodyLeanX = -0.02;
      tLeftUpperArm.x = -1.32;
      tLeftUpperArm.z = 0.34;
      tLeftLowerArm.x = -1.18;
      tRightUpperArm.x = -1.24;
      tRightUpperArm.z = -0.32;
      tRightLowerArm.x = -1.08;
      targetHeadRotX = 0.2;
      targetHeadRotZ = Math.sin(t * 1.8) * 0.06 + 0.06;
    } else if (isProposeAccept) {
      // Joyful acceptance reaction: happy bounce, hands clasped near heart / cheeks
      const beat = t * 5.2;
      targetBodyY = Math.abs(Math.sin(beat)) * 0.032;
      targetBodyTiltZ = Math.sin(beat * 0.5) * 0.04;
      tLeftUpperArm.x = -1.48;
      tLeftUpperArm.z = 0.36;
      tLeftLowerArm.x = -1.12;
      tRightUpperArm.x = -1.48;
      tRightUpperArm.z = -0.36;
      tRightLowerArm.x = -1.12;
      targetHeadRotX = -0.06 + Math.sin(beat) * 0.05;
      targetHeadRotZ = Math.sin(beat * 0.5) * 0.08;
    } else if (isHugging) {
      // Dedicated warm full-torso embrace: arms sweep outward to clear partner's shoulders, forearms wrap cleanly around back
      targetBodyY = Math.sin(t * 2.1) * 0.005;
      targetBodyLeanX = 0.06;
      targetBodyTiltZ = Math.sin(t * 1.5) * (isMale ? 0.025 : -0.025);

      if (isMale) {
        tRightUpperArm.x = -1.16;
        tRightUpperArm.y = 0.24;
        tRightUpperArm.z = 0.08;
        tRightLowerArm.x = -0.76;
        tRightLowerArm.y = -0.78;

        tLeftUpperArm.x = -1.04;
        tLeftUpperArm.y = -0.24;
        tLeftUpperArm.z = -0.08;
        tLeftLowerArm.x = -0.72;
        tLeftLowerArm.y = 0.78;

        targetHeadRotY = -0.24;
        targetHeadRotX = 0.05;
        targetHeadRotZ = -0.09;
      } else {
        tLeftUpperArm.x = -1.16;
        tLeftUpperArm.y = -0.24;
        tLeftUpperArm.z = -0.08;
        tLeftLowerArm.x = -0.76;
        tLeftLowerArm.y = 0.78;

        tRightUpperArm.x = -1.04;
        tRightUpperArm.y = 0.24;
        tRightUpperArm.z = 0.08;
        tRightLowerArm.x = -0.72;
        tRightLowerArm.y = -0.78;

        targetHeadRotY = 0.24;
        targetHeadRotX = 0.05;
        targetHeadRotZ = 0.09;
      }
    } else if (isKissing) {
      // Dedicated tender kiss pose: male cups partner's cheek, female rises lightly on tiptoes & tilts chin
      targetBodyY = isMale ? Math.sin(t * 1.5) * 0.003 : 0.022 + Math.sin(t * 1.5) * 0.003;
      targetBodyLeanX = isMale ? 0.145 : 0.12;

      if (isMale) {
        tLeftUpperArm.x = -1.84;
        tLeftUpperArm.z = 0.22;
        tLeftLowerArm.x = -1.12;
        tRightUpperArm.x = -0.84;
        tRightUpperArm.z = -0.24;
        tRightLowerArm.x = -0.62;
        targetHeadRotZ = -0.22;
        targetHeadRotX = 0.16;
        targetHeadRotY = -0.02;
      } else {
        tLeftFoot.x = 0.16;
        tRightFoot.x = 0.16;
        tRightUpperArm.x = -1.38;
        tRightUpperArm.z = -0.24;
        tRightLowerArm.x = -0.94;
        tLeftUpperArm.x = -1.36;
        tLeftUpperArm.z = 0.24;
        tLeftLowerArm.x = -0.94;
        targetHeadRotZ = 0.22;
        targetHeadRotX = -0.15;
        targetHeadRotY = 0.02;
      }
    } else if (isDancing) {
      const waltzBeat = t * 2.8;
      const stepPhase = t * 2.1;
      const waltzRise = (Math.sin(waltzBeat) * 0.5 + 0.5) * 0.022;
      const sway = Math.sin(stepPhase) * 0.045;

      targetBodyY = waltzRise;
      targetBodyLeanX = 0.025;
      targetBodyTiltZ = isMale ? sway : -sway;

      const legWave = Math.sin(stepPhase) * 0.22;
      tLeftUpperLeg.x = isMale ? legWave : -legWave;
      tRightUpperLeg.x = isMale ? -legWave : legWave;
      tLeftLowerLeg.x = Math.max(0, Math.sin(stepPhase + 0.5) * 0.22);
      tRightLowerLeg.x = Math.max(0, Math.sin(-stepPhase + 0.5) * 0.22);

      if (isMale) {
        tLeftUpperArm.x = -0.78;
        tLeftUpperArm.z = -0.46;
        tLeftLowerArm.x = -0.52;
        tRightUpperArm.x = -0.96;
        tRightUpperArm.z = -0.24;
        tRightLowerArm.x = -0.74;
        targetHeadRotY = -0.05;
        targetHeadRotX = 0.04;
      } else {
        tRightUpperArm.x = -0.78;
        tRightUpperArm.z = 0.46;
        tRightLowerArm.x = -0.52;
        tLeftUpperArm.x = -1.14;
        tLeftUpperArm.z = 0.26;
        tLeftLowerArm.x = -0.78;
        targetHeadRotY = 0.05;
        targetHeadRotX = -0.03;
      }
    } else if (isVows) {
      targetBodyY = Math.sin(t * 1.5) * 0.004;
      targetBodyLeanX = 0.04;
      if (isMale) {
        // Groom extends Right Arm cleanly toward Bride's Left Hand holding the wedding ring
        tRightUpperArm.x = -0.72 + Math.sin(t * 1.8) * 0.015;
        tRightUpperArm.z = -0.18;
        tRightLowerArm.x = -0.46;
        // Left hand rests gently over heart
        tLeftUpperArm.x = -0.32;
        tLeftUpperArm.z = -0.16;
        tLeftLowerArm.x = -0.82;
        targetHeadRotX = 0.06;
      } else {
        // Bride extends Left Hand cleanly to meet Groom's ring clasp
        tLeftUpperArm.x = -0.72 + Math.sin(t * 1.8) * 0.015;
        tLeftUpperArm.z = 0.18;
        tLeftLowerArm.x = -0.46;
        // Right hand poised warmly
        tRightUpperArm.x = -0.28;
        tRightUpperArm.z = 0.14;
        tRightLowerArm.x = -0.38;
        targetHeadRotX = 0.03;
      }
    } else if (isCelebrating) {
      const beat = t * 4.2;
      targetBodyY = Math.abs(Math.sin(beat)) * 0.036;
      targetBodyTiltZ = Math.sin(beat * 0.5) * (isMale ? 0.055 : -0.055);
      tLeftUpperLeg.x = Math.sin(beat * 0.5) * 0.14;
      tRightUpperLeg.x = -Math.sin(beat * 0.5) * 0.14;
      tLeftLowerLeg.x = Math.max(0, Math.sin(beat * 0.5) * 0.2);
      tRightLowerLeg.x = Math.max(0, -Math.sin(beat * 0.5) * 0.2);
      if (isMale) {
        tLeftUpperArm.x = -0.35;
        tLeftUpperArm.z = -0.32;
        tRightUpperArm.x = -2.1 + Math.sin(beat) * 0.18;
        tRightUpperArm.z = -0.35;
        tRightLowerArm.x = -0.32;
        targetHeadRotY = -0.14;
      } else {
        tRightUpperArm.x = -0.35;
        tRightUpperArm.z = 0.32;
        tLeftUpperArm.x = -2.05 + Math.sin(beat) * 0.18;
        tLeftUpperArm.z = 0.35;
        tLeftLowerArm.x = -0.32;
        targetHeadRotY = 0.14;
      }
    } else if (isCakeCut) {
      const sliceMotion = Math.sin(t * 2.9) * 0.1;
      targetBodyY = Math.sin(t * 1.8) * 0.004;
      targetBodyLeanX = 0.08;
      if (isMale) {
        // Groom guides silver cake knife cleanly onto front cake tier
        tRightUpperArm.x = -0.92 + sliceMotion;
        tRightUpperArm.z = -0.18;
        tRightLowerArm.x = -0.38 + sliceMotion * 0.45;
        tLeftUpperArm.x = -0.22;
        tLeftUpperArm.z = -0.1;
        tLeftLowerArm.x = -0.35;
        targetHeadRotX = 0.16;
        targetHeadRotY = -0.12;
      } else {
        // Bride places left hand lovingly over Groom's hand on the knife
        tLeftUpperArm.x = -0.9 + sliceMotion;
        tLeftUpperArm.z = 0.2;
        tLeftLowerArm.x = -0.38 + sliceMotion * 0.45;
        tRightUpperArm.x = -0.24;
        tRightUpperArm.z = 0.12;
        tRightLowerArm.x = -0.38;
        targetHeadRotX = 0.16;
        targetHeadRotY = 0.14;
      }
    } else if (isCakeFeedGive) {
      const feedBob = Math.sin(t * 2.4) * 0.06;
      targetBodyY = Math.sin(t * 2.0) * 0.005;
      targetBodyLeanX = 0.065;
      // Right hand lifts silver fork + cake slice gently toward partner's mouth
      tRightUpperArm.x = -1.28 + feedBob;
      tRightUpperArm.z = 0.06;
      tRightLowerArm.x = -0.68 + feedBob * 0.45;
      tLeftUpperArm.x = -0.26;
      tLeftUpperArm.z = -0.14;
      tLeftLowerArm.x = -0.45;
      targetHeadRotX = -0.04;
      targetHeadRotY = 0.02;
    } else if (isCakeFeedReceive) {
      targetBodyY = Math.sin(t * 2.2) * 0.006;
      targetBodyLeanX = 0.07;
      tLeftUpperArm.x = -0.68;
      tLeftUpperArm.z = 0.18;
      tLeftLowerArm.x = -0.92;
      tRightUpperArm.x = -0.45;
      tRightUpperArm.z = -0.16;
      tRightLowerArm.x = -0.68;
      targetHeadRotX = -0.08;
      targetHeadRotZ = Math.sin(t * 2.2) * 0.04;
    } else if (isBouquetGive) {
      targetBodyY = Math.sin(t * 1.9) * 0.004;
      targetBodyLeanX = 0.05;
      tRightUpperArm.x = -0.84 + Math.sin(t * 2.2) * 0.02;
      tRightUpperArm.z = -0.12;
      tRightLowerArm.x = -0.42;
      tLeftUpperArm.x = -0.26;
      tLeftUpperArm.z = 0.08;
      tLeftLowerArm.x = -0.45;
      targetHeadRotX = 0.04;
    } else if (isBouquetReceive) {
      targetBodyY = Math.sin(t * 2.0) * 0.004;
      targetBodyLeanX = 0.035;
      tRightUpperArm.x = -0.74;
      tRightUpperArm.z = -0.08;
      tRightLowerArm.x = -0.68;
      tLeftUpperArm.x = -0.44;
      tLeftUpperArm.z = 0.14;
      tLeftLowerArm.x = -0.78;
      targetHeadRotX = 0.05;
    } else if (isBouquetBlush) {
      // Soft shy reaction for Boy receiving bouquet: cradles bouquet, gentle head tilt & warm blush
      targetBodyY = Math.sin(t * 2.1) * 0.005;
      targetBodyLeanX = 0.02;
      tRightUpperArm.x = -0.46;
      tRightUpperArm.z = -0.08;
      tRightLowerArm.x = -0.86;
      tLeftUpperArm.x = -0.18;
      tLeftUpperArm.z = 0.08;
      tLeftLowerArm.x = -0.42;
      targetHeadRotX = 0.085;
      targetHeadRotZ = 0.105;
      targetHeadRotY = Math.sin(t * 1.5) * 0.07;
    } else if (isBouquetHappy) {
      // Joyful affectionate reaction for Girl receiving bouquet
      const happyBeat = t * 3.8;
      targetBodyY = Math.abs(Math.sin(happyBeat)) * 0.018;
      targetBodyTiltZ = Math.sin(t * 2.0) * 0.032;
      tRightUpperArm.x = -0.56;
      tRightUpperArm.z = -0.1;
      tRightLowerArm.x = -0.92;
      tLeftUpperArm.x = -0.52;
      tLeftUpperArm.z = 0.14;
      tLeftLowerArm.x = -0.84;
      targetHeadRotX = -0.04;
      targetHeadRotZ = -0.095 + Math.sin(t * 2.1) * 0.04;
    } else {
      // Natural fluid walking / running / poised idle with subtle breathing & ankle articulation
      const legAngle = Math.sin(phase) * walkAmplitude;
      const leftKneeBend = Math.max(0, Math.sin(phase + 0.42) * walkAmplitude * 0.78);
      const rightKneeBend = Math.max(0, Math.sin(-phase + 0.42) * walkAmplitude * 0.78);

      tLeftUpperLeg.x = legAngle;
      tRightUpperLeg.x = -legAngle;
      tLeftLowerLeg.x = leftKneeBend;
      tRightLowerLeg.x = rightKneeBend;

      if (isWalking || isRunning) {
        tLeftFoot.x = -Math.sin(phase - 0.3) * 0.16;
        tRightFoot.x = Math.sin(phase - 0.3) * 0.16;
      }

      targetBodyY =
        isWalking || isRunning
          ? Math.abs(Math.sin(phase * 2)) * bodyBob
          : Math.sin(t * 1.8) * 0.0045;
      targetBodyLeanX = bodyLean;
      targetBodyTiltZ = Math.sin(phase) * bodyLean * 0.32;

      if (isHoldingHands) {
        if (isMale) {
          tLeftUpperArm.x = -0.14 + Math.sin(phase * 0.5) * 0.035;
          tLeftUpperArm.z = -0.3;
          tLeftLowerArm.x = -0.2;
          tRightUpperArm.x = heldBouquet ? -0.32 : Math.sin(phase) * armSwing;
          tRightUpperArm.z = heldBouquet ? -0.06 : 0.04;
          tRightLowerArm.x = heldBouquet
            ? -0.62
            : -0.08 - Math.max(0, Math.sin(phase) * armSwing * 0.3);
          targetHeadRotY = Math.sin(t * 0.5) * 0.04 + (Math.sin(t * 0.25) > 0.6 ? -0.12 : 0);
        } else {
          tRightUpperArm.x = heldBouquet ? -0.32 : -0.14 + Math.sin(phase * 0.5) * 0.035;
          tRightUpperArm.z = heldBouquet ? -0.06 : 0.3;
          tRightLowerArm.x = heldBouquet ? -0.62 : -0.2;
          tLeftUpperArm.x = -Math.sin(phase) * armSwing;
          tLeftUpperArm.z = -0.04;
          tLeftLowerArm.x = -0.08 - Math.max(0, -Math.sin(phase) * armSwing * 0.3);
          targetHeadRotY = Math.sin(t * 0.5) * 0.04 + (Math.sin(t * 0.25) > 0.6 ? 0.12 : 0);
        }
      } else {
        tLeftUpperArm.x = -Math.sin(phase) * armSwing;
        tRightUpperArm.x = heldBouquet ? -0.32 + Math.sin(phase) * armSwing * 0.25 : Math.sin(phase) * armSwing;
        tLeftUpperArm.z = -0.035;
        tRightUpperArm.z = heldBouquet ? -0.06 : 0.035;
        tLeftLowerArm.x = -0.07 - Math.max(0, -Math.sin(phase) * armSwing * 0.3);
        tRightLowerArm.x = heldBouquet
          ? -0.64
          : -0.07 - Math.max(0, Math.sin(phase) * armSwing * 0.3);
        targetHeadRotY = Math.sin(t * 0.55) * 0.05;
        targetHeadRotX = Math.sin(t * 0.9) * 0.02;
      }
    }

    if (leftUpperArmRef.current) smoothRot(tLeftUpperArm, leftUpperArmRef.current.rotation, lerpSpeed);
    if (rightUpperArmRef.current) smoothRot(tRightUpperArm, rightUpperArmRef.current.rotation, lerpSpeed);
    if (leftLowerArmRef.current) smoothRot(tLeftLowerArm, leftLowerArmRef.current.rotation, lerpSpeed);
    if (rightLowerArmRef.current) smoothRot(tRightLowerArm, rightLowerArmRef.current.rotation, lerpSpeed);

    if (leftUpperLegRef.current) smoothRot(tLeftUpperLeg, leftUpperLegRef.current.rotation, lerpSpeed);
    if (rightUpperLegRef.current) smoothRot(tRightUpperLeg, rightUpperLegRef.current.rotation, lerpSpeed);
    if (leftLowerLegRef.current) smoothRot(tLeftLowerLeg, leftLowerLegRef.current.rotation, lerpSpeed);
    if (rightLowerLegRef.current) smoothRot(tRightLowerLeg, rightLowerLegRef.current.rotation, lerpSpeed);
    if (leftFootRef.current) smoothRot(tLeftFoot, leftFootRef.current.rotation, lerpSpeed);
    if (rightFootRef.current) smoothRot(tRightFoot, rightFootRef.current.rotation, lerpSpeed);

    if (bodyRef.current) {
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, targetBodyY, lerpSpeed);
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetBodyLeanX, lerpSpeed);
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, targetBodyTiltZ, lerpSpeed);
    }

    if (headGroupRef.current) {
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetHeadRotY, lerpSpeed);
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetHeadRotX, lerpSpeed);
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, targetHeadRotZ, lerpSpeed);
    }

    if (ringGlowRef.current) {
      const shimmer = 1.0 + Math.sin(t * 5.2) * 0.16;
      ringGlowRef.current.scale.setScalar(shimmer);
    }

    // Smooth facial blush glow ONLY after receiving bouquet (soft, natural rose warmth)
    const targetBlushLevel =
      (isMale && bouquetReaction === 'boy_blush') ||
      (!isMale && bouquetReaction === 'girl_happy')
        ? 1
        : 0;
    blushLevelRef.current = THREE.MathUtils.lerp(
      blushLevelRef.current,
      targetBlushLevel,
      1 - Math.exp(-5.5 * delta)
    );
    const bLvl = blushLevelRef.current;
    const baseOpacity = isMale ? 0.24 : 0.48;
    const targetOpacity = THREE.MathUtils.lerp(baseOpacity, isMale ? 0.66 : 0.68, bLvl);
    workingBlushColorRef.current.copy(baseBlushColorObj).lerp(activeBlushColorObj, bLvl);
    if (leftBlushMatRef.current) {
      leftBlushMatRef.current.opacity = targetOpacity;
      leftBlushMatRef.current.color.copy(workingBlushColorRef.current);
    }
    if (rightBlushMatRef.current) {
      rightBlushMatRef.current.opacity = targetOpacity;
      rightBlushMatRef.current.color.copy(workingBlushColorRef.current);
    }
    const sx = THREE.MathUtils.lerp(0.026, 0.033, bLvl);
    const sy = THREE.MathUtils.lerp(0.014, 0.0175, bLvl);
    const sz = THREE.MathUtils.lerp(0.01, 0.0115, bLvl);
    if (leftBlushMeshRef.current) leftBlushMeshRef.current.scale.set(sx, sy, sz);
    if (rightBlushMeshRef.current) rightBlushMeshRef.current.scale.set(sx, sy, sz);
  });

  const showEngagementRing = isMale && action === 'propose_kneel';
  const showWeddingRing = isMale && action === 'vows';
  const showCakeKnife = isMale && action === 'cake_cut';
  const showCakeFork = action === 'cake_feed_give';
  const showCustomBouquet =
    Boolean(heldBouquet) &&
    !showEngagementRing &&
    !showWeddingRing &&
    !showCakeKnife &&
    !showCakeFork &&
    action !== 'hug' &&
    action !== 'kiss' &&
    action !== 'propose_embrace' &&
    action !== 'dance';
  const isSurprisedFace = !isMale && action === 'propose_surprised';

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Soft contact shadow disc on floor */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 18]} />
        <meshBasicMaterial color="#0b0710" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      <group ref={bodyRef}>
        {/* Neck with soft collar transition */}
        <mesh geometry={bodyGeometries.neck} position={[0, 1.44, 0]}>
          <meshPhysicalMaterial
            color={skinColor}
            roughness={0.52}
            sheen={0.25}
            sheenColor="#ffd8c6"
            sheenRoughness={0.75}
          />
        </mesh>

        {/* Sculpted Head Group (proportional cranium + jawline + ears + expressive eyes & lips + layered hair) */}
        <group ref={headGroupRef} position={[0, 1.62, 0]}>
          <mesh geometry={bodyGeometries.head} scale={[0.93, 1.04, 0.96]} castShadow>
            <meshPhysicalMaterial
              color={skinColor}
              roughness={0.5}
              clearcoat={0.08}
              clearcoatRoughness={0.72}
              sheen={0.28}
              sheenColor="#ffd8c6"
              sheenRoughness={0.75}
            />
          </mesh>
          {/* Tapered Jawline & Chin Contour */}
          <mesh geometry={bodyGeometries.jaw} position={[0, -0.068, 0.022]} scale={[0.84, 0.66, 0.84]} castShadow>
            <meshPhysicalMaterial
              color={skinColor}
              roughness={0.5}
              sheen={0.25}
              sheenColor="#ffd8c6"
              sheenRoughness={0.75}
            />
          </mesh>
          {/* Ears */}
          {[-0.146, 0.146].map((ex, idx) => (
            <mesh
              key={`ear-${idx}`}
              geometry={bodyGeometries.ear}
              position={[ex, -0.005, -0.008]}
              scale={[0.55, 1.05, 0.72]}
            >
              <meshPhysicalMaterial color={skinColor} roughness={0.54} />
            </mesh>
          ))}

          {/* Layered Hair Crown OR Modest Pearl Bridal Hijab */}
          {weddingMode && !isMale && brideOutfit.headwear === 'pearl_hijab' ? (
            <group>
              <mesh position={[0, 0.025, -0.02]} scale={[1.1, 1.08, 1.12]} castShadow>
                <sphereGeometry args={[0.17, 20, 18, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
                <meshPhysicalMaterial
                  color={bridePalette.hijabColor}
                  roughness={0.48}
                  sheen={0.7}
                  sheenColor="#ffffff"
                  sheenRoughness={0.5}
                />
              </mesh>
              <mesh position={[0, -0.08, -0.045]} castShadow>
                <cylinderGeometry args={[0.164, 0.188, 0.25, 18]} />
                <meshPhysicalMaterial
                  color={bridePalette.hijabColor}
                  roughness={0.48}
                  sheen={0.7}
                  sheenColor="#ffffff"
                  sheenRoughness={0.5}
                />
              </mesh>
              <mesh position={[0, -0.22, 0.015]} castShadow>
                <cylinderGeometry args={[0.17, 0.228, 0.18, 18]} />
                <meshPhysicalMaterial
                  color={bridePalette.hijabColor}
                  roughness={0.48}
                  sheen={0.7}
                  sheenColor="#ffffff"
                  sheenRoughness={0.5}
                />
              </mesh>
              <mesh position={[0, 0.11, 0.146]}>
                <sphereGeometry args={[0.02, 10, 10]} />
                <meshStandardMaterial color={bridePalette.accentHex} metalness={0.4} roughness={0.24} />
              </mesh>
            </group>
          ) : (
            <>
              <mesh
                geometry={bodyGeometries.hairCap}
                position={[0, 0.044, -0.022]}
                rotation={[-0.24, 0, 0]}
                scale={[0.98, 1.02, 1.0]}
                castShadow
              >
                <meshPhysicalMaterial
                  color={hairColor}
                  roughness={0.42}
                  clearcoat={0.22}
                  clearcoatRoughness={0.48}
                />
              </mesh>
              {isMale ? (
                <>
                  {/* Sculpted textured swept-front hair strands & clean tapered back contour */}
                  <mesh position={[-0.042, 0.142, 0.066]} rotation={[0.18, -0.22, 0.16]} scale={[1.05, 0.62, 0.92]} castShadow>
                    <sphereGeometry args={[0.058, 12, 10]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.42} clearcoat={0.22} clearcoatRoughness={0.48} />
                  </mesh>
                  <mesh position={[0.042, 0.146, 0.066]} rotation={[0.15, 0.22, -0.16]} scale={[1.08, 0.64, 0.92]} castShadow>
                    <sphereGeometry args={[0.06, 12, 10]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.42} clearcoat={0.22} clearcoatRoughness={0.48} />
                  </mesh>
                  <mesh position={[0, 0.04, -0.048]} scale={[0.94, 0.96, 0.92]}>
                    <sphereGeometry args={[0.155, 14, 12]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.44} clearcoat={0.2} clearcoatRoughness={0.5} />
                  </mesh>
                  <mesh position={[-0.138, 0.022, -0.02]} scale={[0.24, 0.72, 0.5]}>
                    <sphereGeometry args={[0.075, 10, 8]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.44} />
                  </mesh>
                  <mesh position={[0.138, 0.022, -0.02]} scale={[0.24, 0.72, 0.5]}>
                    <sphereGeometry args={[0.075, 10, 8]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.44} />
                  </mesh>
                </>
              ) : (
                <>
                  {/* Sculpted parted bangs framing forehead cleanly & tapered silky layered back cascade */}
                  <mesh position={[-0.072, 0.122, 0.068]} rotation={[0.16, -0.32, 0.34]} scale={[0.92, 0.65, 0.7]} castShadow>
                    <sphereGeometry args={[0.062, 12, 10]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.42} />
                  </mesh>
                  <mesh position={[0.072, 0.122, 0.068]} rotation={[0.16, 0.32, -0.34]} scale={[0.92, 0.65, 0.7]} castShadow>
                    <sphereGeometry args={[0.062, 12, 10]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.42} />
                  </mesh>
                  <mesh
                    geometry={bodyGeometries.hairCascade}
                    position={[0, -0.105, -0.04]}
                    rotation={[0.06, 0, 0]}
                    scale={[1.02, 1.0, 0.98]}
                    castShadow
                  >
                    <meshPhysicalMaterial color={hairColor} roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.42} />
                  </mesh>
                  <mesh position={[-0.128, -0.055, -0.036]} rotation={[0.06, 0, 0.06]} scale={[0.42, 1.35, 0.65]}>
                    <sphereGeometry args={[0.095, 12, 10]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.38} clearcoat={0.26} clearcoatRoughness={0.44} />
                  </mesh>
                  <mesh position={[0.128, -0.055, -0.036]} rotation={[0.06, 0, -0.06]} scale={[0.42, 1.35, 0.65]}>
                    <sphereGeometry args={[0.095, 12, 10]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.38} clearcoat={0.26} clearcoatRoughness={0.44} />
                  </mesh>
                  {/* Rose or bridal floral hair pin */}
                  <mesh position={[0.112, 0.112, -0.015]}>
                    <sphereGeometry args={[0.027, 10, 10]} />
                    <meshPhysicalMaterial
                      color={weddingMode ? bridePalette.bouquetPrimary : COLORS.rosePink}
                      roughness={0.4}
                      sheen={0.6}
                      sheenColor="#fff0f4"
                    />
                  </mesh>
                </>
              )}

              {/* Flowing Bridal Veil or Golden Floral Tiara */}
              {weddingMode && !isMale && brideOutfit.headwear === 'flowing_veil' && (
                <group position={[0, 0.06, -0.11]}>
                  <mesh position={[0, 0.09, 0.02]} rotation={[-0.25, 0, 0]}>
                    <torusGeometry args={[0.085, 0.012, 8, 16, Math.PI]} />
                    <meshStandardMaterial color={bridePalette.accentHex} metalness={0.42} roughness={0.24} />
                  </mesh>
                  <mesh position={[0, -0.34, -0.1]} rotation={[0.12, 0, 0]}>
                    <cylinderGeometry args={[0.11, 0.34, 0.88, 18, 1, true]} />
                    <meshPhysicalMaterial
                      color="#fffdf8"
                      transparent
                      opacity={0.56}
                      roughness={0.38}
                      sheen={0.8}
                      side={THREE.DoubleSide}
                      depthWrite={false}
                    />
                  </mesh>
                </group>
              )}

              {weddingMode && !isMale && brideOutfit.headwear === 'golden_tiara' && (
                <group position={[0, 0.155, 0.05]} rotation={[-0.18, 0, 0]}>
                  <mesh>
                    <torusGeometry args={[0.09, 0.011, 8, 18, Math.PI]} />
                    <meshStandardMaterial color={bridePalette.accentHex} metalness={0.55} roughness={0.2} />
                  </mesh>
                  {[-0.045, 0, 0.045].map((tx, idx) => (
                    <mesh key={`tiara-${idx}`} position={[tx, idx === 1 ? 0.036 : 0.022, 0.068]}>
                      <sphereGeometry args={[idx === 1 ? 0.018 : 0.013, 8, 8]} />
                      <meshStandardMaterial color="#fffaf0" roughness={0.2} metalness={0.2} />
                    </mesh>
                  ))}
                </group>
              )}
            </>
          )}

          {/* Expressive Eyes: Sclera + Iris + Pupil + Specular Catchlight + Upper Lash Line */}
          {[-0.05, 0.05].map((ex, idx) => (
            <group key={`eye-${idx}`} position={[ex, 0.012, 0.141]}>
              <mesh scale={[0.023, 0.02, 0.013]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial color="#faf7f2" roughness={0.24} />
              </mesh>
              <mesh position={[0, 0, 0.0075]} scale={[0.0145, 0.0155, 0.009]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial color={irisColor} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.012]} scale={[0.0075, 0.0085, 0.006]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshStandardMaterial color="#120e16" roughness={0.15} />
              </mesh>
              <mesh position={[0.0055, 0.0055, 0.015]} scale={[0.0042, 0.0042, 0.004]}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh geometry={bodyGeometries.eyelash} position={[0, 0.008, 0.007]} rotation={[0.2, 0, 0]}>
                <meshStandardMaterial color={hairColor} roughness={0.65} />
              </mesh>
            </group>
          ))}

          {/* Contoured Eyebrows */}
          <mesh position={[-0.051, 0.046, 0.138]} rotation={[0, 0, isSurprisedFace ? 0.16 : isMale ? 0.05 : 0.1]}>
            <boxGeometry args={[0.042, 0.008, 0.011]} />
            <meshStandardMaterial color={hairColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.051, 0.046, 0.138]} rotation={[0, 0, isSurprisedFace ? -0.16 : isMale ? -0.05 : -0.1]}>
            <boxGeometry args={[0.042, 0.008, 0.011]} />
            <meshStandardMaterial color={hairColor} roughness={0.65} />
          </mesh>

          {/* Sculpted Nose Bridge & Nasal Tip */}
          <mesh position={[0, -0.01, 0.152]} rotation={[-0.18, 0, 0]} scale={[0.01, 0.025, 0.013]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshPhysicalMaterial color={skinColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.024, 0.157]} scale={[0.013, 0.011, 0.013]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshPhysicalMaterial color={skinColor} roughness={0.48} />
          </mesh>

          {/* Soft Cheek Warmth */}
          <mesh ref={leftBlushMeshRef} position={[-0.082, -0.028, 0.123]} scale={[0.026, 0.014, 0.01]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
              ref={leftBlushMatRef}
              color={blushColor}
              roughness={0.72}
              transparent
              opacity={isMale ? 0.24 : 0.48}
            />
          </mesh>
          <mesh ref={rightBlushMeshRef} position={[0.082, -0.028, 0.123]} scale={[0.026, 0.014, 0.01]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
              ref={rightBlushMatRef}
              color={blushColor}
              roughness={0.72}
              transparent
              opacity={isMale ? 0.24 : 0.48}
            />
          </mesh>

          {/* Expressive Mouth (soft surprised 'o' or warm sculpted smile) */}
          {isSurprisedFace ? (
            <mesh position={[0, -0.06, 0.146]} scale={[0.015, 0.019, 0.01]}>
              <sphereGeometry args={[1, 10, 10]} />
              <meshStandardMaterial color={lipColor} roughness={0.45} />
            </mesh>
          ) : (
            <mesh
              geometry={bodyGeometries.smile}
              position={[0, -0.056, 0.144]}
              rotation={[Math.PI, 0, 0]}
            >
              <meshStandardMaterial color={lipColor} roughness={0.48} />
            </mesh>
          )}
        </group>

        {/* Contoured Upper & Lower Torso with Realistic Fabric Sheen */}
        <mesh geometry={bodyGeometries.torsoUpper} position={[0, 1.24, 0]} castShadow>
          <meshPhysicalMaterial
            color={topColor}
            roughness={0.68}
            sheen={0.55}
            sheenColor={topTrimColor}
            sheenRoughness={0.7}
          />
        </mesh>
        <mesh geometry={bodyGeometries.torsoWaist} position={[0, 1.005, 0]} castShadow>
          <meshPhysicalMaterial
            color={topColor}
            roughness={0.68}
            sheen={0.55}
            sheenColor={topTrimColor}
            sheenRoughness={0.7}
          />
        </mesh>
        <mesh position={[0, 1.38, 0]} scale={[0.181, 0.072, 0.168]} castShadow>
          <sphereGeometry args={[1, 18, 14]} />
          <meshPhysicalMaterial color={topColor} roughness={0.68} sheen={0.5} sheenColor={topTrimColor} />
        </mesh>
        <mesh geometry={bodyGeometries.collar} position={[0, 1.41, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <meshPhysicalMaterial color={topTrimColor} roughness={0.48} sheen={0.7} sheenColor="#ffffff" />
        </mesh>

        {/* Tailored Jacket Lapels & Pocket Accent (Male) / Sweetheart Bodice Accent (Female) */}
        {isMale && !weddingMode && (
          <group>
            <mesh position={[-0.055, 1.27, 0.162]} rotation={[0.08, 0.18, 0.26]}>
              <boxGeometry args={[0.042, 0.22, 0.018]} />
              <meshPhysicalMaterial color="#1d2c48" roughness={0.55} sheen={0.5} />
            </mesh>
            <mesh position={[0.055, 1.27, 0.162]} rotation={[0.08, -0.18, -0.26]}>
              <boxGeometry args={[0.042, 0.22, 0.018]} />
              <meshPhysicalMaterial color="#1d2c48" roughness={0.55} sheen={0.5} />
            </mesh>
            {/* Inner Shirt V */}
            <mesh position={[0, 1.31, 0.162]} rotation={[0.06, 0, 0]}>
              <boxGeometry args={[0.078, 0.15, 0.012]} />
              <meshPhysicalMaterial color="#f5f1e8" roughness={0.52} />
            </mesh>
            {/* Pocket Square */}
            <mesh position={[0.098, 1.26, 0.166]} rotation={[0, 0, -0.15]}>
              <boxGeometry args={[0.036, 0.022, 0.01]} />
              <meshStandardMaterial color="#f4d8df" roughness={0.45} />
            </mesh>
          </group>
        )}

        {/* Waist Belt / Dress Sash */}
        <mesh geometry={bodyGeometries.belt} position={[0, 0.93, 0]}>
          <meshPhysicalMaterial
            color={
              weddingMode
                ? isMale
                  ? groomPalette.trim
                  : bridePalette.accentHex
                : isMale
                ? '#2a1d15'
                : '#c96f86'
            }
            roughness={weddingMode ? 0.34 : 0.48}
            metalness={weddingMode ? 0.28 : 0.08}
            sheen={0.65}
          />
        </mesh>
        {isMale && (
          <mesh position={[0, 0.93, 0.172]}>
            <boxGeometry args={[0.046, 0.034, 0.016]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.65} roughness={0.25} />
          </mesh>
        )}
        {!isMale && !weddingMode && (
          <group position={[0.11, 0.93, 0.135]} rotation={[0, 0.65, 0]}>
            <mesh position={[-0.022, 0, 0]} rotation={[0, 0, 0.28]}>
              <boxGeometry args={[0.042, 0.024, 0.016]} />
              <meshPhysicalMaterial color="#e89cb0" roughness={0.42} sheen={0.7} />
            </mesh>
            <mesh position={[0.022, 0, 0]} rotation={[0, 0, -0.28]}>
              <boxGeometry args={[0.042, 0.024, 0.016]} />
              <meshPhysicalMaterial color="#e89cb0" roughness={0.42} sheen={0.7} />
            </mesh>
          </group>
        )}

        {/* Groom Formal Shirt Bib, Tie & Rose Boutonniere */}
        {weddingMode && isMale && (
          <group>
            <mesh position={[0, 1.24, 0.168]}>
              <boxGeometry args={[0.11, 0.28, 0.025]} />
              <meshPhysicalMaterial color={groomPalette.shirt} roughness={0.48} sheen={0.5} />
            </mesh>
            <mesh position={[0, 1.37, 0.186]}>
              <boxGeometry args={[0.092, 0.034, 0.016]} />
              <meshPhysicalMaterial color={groomPalette.tie} roughness={0.35} sheen={0.75} />
            </mesh>
            <mesh position={[0, 1.24, 0.184]}>
              <boxGeometry args={[0.026, 0.21, 0.012]} />
              <meshPhysicalMaterial color={groomPalette.tie} roughness={0.35} sheen={0.75} />
            </mesh>
            <mesh position={[0.105, 1.28, 0.178]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color="#b81834" roughness={0.42} />
            </mesh>
            <mesh position={[0.105, 1.245, 0.178]}>
              <boxGeometry args={[0.018, 0.04, 0.01]} />
              <meshStandardMaterial color="#3c6b42" roughness={0.7} />
            </mesh>
          </group>
        )}

        {/* Bride Pearl Necklace */}
        {weddingMode && !isMale && (
          <mesh position={[0, 1.41, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.095, 0.01, 8, 16]} />
            <meshStandardMaterial color="#fffdf8" roughness={0.2} metalness={0.2} />
          </mesh>
        )}

        {/* Pelvis / Skirt / Bridal Gown Tiers */}
        {isMale ? (
          <group>
            <mesh geometry={bodyGeometries.hip} position={[0, 0.85, 0]} castShadow>
              <meshPhysicalMaterial color={bottomColor} roughness={0.72} sheen={0.35} />
            </mesh>
            {weddingMode && groomOutfit.style === 'ivory_tailcoat' && (
              <mesh position={[0, 0.68, -0.14]} rotation={[0.1, 0, 0]} castShadow>
                <boxGeometry args={[0.26, 0.42, 0.045]} />
                <meshPhysicalMaterial color={groomPalette.jacket} roughness={0.58} sheen={0.5} />
              </mesh>
            )}
          </group>
        ) : weddingMode ? (
          <group>
            <mesh
              position={[0, action === 'sit' ? 0.72 : 0.64, action === 'sit' ? 0.06 : 0]}
              castShadow
            >
              <cylinderGeometry
                args={[
                  0.175,
                  brideOutfit.style === 'ivory_ballgown'
                    ? 0.44
                    : brideOutfit.style === 'rosegold_couture'
                    ? 0.36
                    : 0.33,
                  action === 'sit' ? 0.42 : 0.66,
                  24,
                ]}
              />
              <meshPhysicalMaterial
                color={bridePalette.dress}
                roughness={0.48}
                sheen={0.75}
                sheenColor="#ffffff"
              />
            </mesh>
            {action !== 'sit' && (
              <mesh position={[0, 0.33, 0]} castShadow>
                <cylinderGeometry
                  args={[
                    brideOutfit.style === 'ivory_ballgown' ? 0.42 : 0.32,
                    brideOutfit.style === 'ivory_ballgown' ? 0.5 : 0.39,
                    0.26,
                    24,
                  ]}
                />
                <meshPhysicalMaterial
                  color={bridePalette.skirtTrim}
                  roughness={0.52}
                  sheen={0.7}
                  sheenColor="#ffffff"
                />
              </mesh>
            )}
          </group>
        ) : (
          <group>
            <mesh geometry={bodyGeometries.skirt} position={[0, 0.76, 0]} castShadow>
              <meshPhysicalMaterial
                color={topColor}
                roughness={0.62}
                sheen={0.65}
                sheenColor={topTrimColor}
              />
            </mesh>
            <mesh
              geometry={bodyGeometries.skirtTrim}
              position={[0, 0.575, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshPhysicalMaterial color={topTrimColor} roughness={0.45} sheen={0.7} />
            </mesh>
          </group>
        )}

        {/* Left Arm (local -X) */}
        <group ref={leftUpperArmRef} position={[-0.218, 1.325, 0]}>
          <mesh geometry={bodyGeometries.shoulderCap} position={[0.006, 0, 0]}>
            <meshPhysicalMaterial color={topColor} roughness={0.68} sheen={0.5} />
          </mesh>
          <mesh geometry={bodyGeometries.upperArm} position={[0, -0.14, 0]} castShadow>
            <meshPhysicalMaterial color={topColor} roughness={0.68} sheen={0.5} />
          </mesh>
          <group ref={leftLowerArmRef} position={[0, -0.28, 0]}>
            {/* Seamless elbow joint sphere */}
            <mesh geometry={bodyGeometries.elbow}>
              <meshPhysicalMaterial
                color={isMale ? topColor : skinColor}
                roughness={isMale ? 0.68 : 0.52}
              />
            </mesh>
            <mesh geometry={bodyGeometries.lowerArm} position={[0, -0.13, 0]} castShadow>
              <meshPhysicalMaterial
                color={isMale ? topColor : skinColor}
                roughness={isMale ? 0.65 : 0.52}
                sheen={0.3}
              />
            </mesh>
            {/* Wristwatch (Male) / Gold Bracelet (Female) */}
            <mesh position={[0, -0.235, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.038, 0.008, 8, 14]} />
              <meshStandardMaterial
                color={isMale ? '#b89456' : COLORS.goldLight}
                metalness={0.75}
                roughness={0.22}
              />
            </mesh>
            <mesh geometry={bodyGeometries.hand} position={[0, -0.28, 0]}>
              <meshPhysicalMaterial color={skinColor} roughness={0.5} sheen={0.25} />
            </mesh>
            <mesh geometry={bodyGeometries.thumb} position={[0.031, -0.268, 0.02]}>
              <meshPhysicalMaterial color={skinColor} roughness={0.5} />
            </mesh>
            {/* Bridal Bouquet (kept aside during ring exchange, hug, kiss, cake cutting, celebrate, and sitting) */}
            {weddingMode &&
              !isMale &&
              action !== 'sit' &&
              action !== 'vows' &&
              action !== 'hug' &&
              action !== 'kiss' &&
              action !== 'cake_cut' &&
              action !== 'cake_feed_give' &&
              action !== 'cake_feed_receive' &&
              action !== 'celebrate' && (
                <group position={[0, -0.28, 0.095]}>
                  <mesh position={[0, -0.03, 0]}>
                    <cylinderGeometry args={[0.022, 0.014, 0.09, 8]} />
                    <meshStandardMaterial color="#4c7a52" roughness={0.75} />
                  </mesh>
                  <mesh position={[0, 0.03, 0.01]}>
                    <sphereGeometry args={[0.056, 10, 8]} />
                    <meshStandardMaterial color={bridePalette.bouquetSecondary} roughness={0.55} />
                  </mesh>
                  <mesh position={[-0.036, 0.035, 0.028]}>
                    <sphereGeometry args={[0.038, 8, 8]} />
                    <meshStandardMaterial color={bridePalette.bouquetPrimary} roughness={0.5} />
                  </mesh>
                  <mesh position={[0.036, 0.03, 0.024]}>
                    <sphereGeometry args={[0.038, 8, 8]} />
                    <meshStandardMaterial color={bridePalette.bouquetPrimary} roughness={0.5} />
                  </mesh>
                </group>
              )}
          </group>
        </group>

        {/* Right Arm (local +X) — holds aligned 3D Velvet Ring Box & Diamond Ring during Proposal */}
        <group ref={rightUpperArmRef} position={[0.218, 1.325, 0]}>
          <mesh geometry={bodyGeometries.shoulderCap} position={[-0.006, 0, 0]}>
            <meshPhysicalMaterial color={topColor} roughness={0.68} sheen={0.5} />
          </mesh>
          <mesh geometry={bodyGeometries.upperArm} position={[0, -0.14, 0]} castShadow>
            <meshPhysicalMaterial color={topColor} roughness={0.68} sheen={0.5} />
          </mesh>
          <group ref={rightLowerArmRef} position={[0, -0.28, 0]}>
            <mesh geometry={bodyGeometries.elbow}>
              <meshPhysicalMaterial
                color={isMale ? topColor : skinColor}
                roughness={isMale ? 0.68 : 0.52}
              />
            </mesh>
            <mesh geometry={bodyGeometries.lowerArm} position={[0, -0.13, 0]} castShadow>
              <meshPhysicalMaterial
                color={isMale ? topColor : skinColor}
                roughness={isMale ? 0.65 : 0.52}
                sheen={0.3}
              />
            </mesh>
            <mesh geometry={bodyGeometries.hand} position={[0, -0.28, 0]}>
              <meshPhysicalMaterial color={skinColor} roughness={0.5} sheen={0.25} />
            </mesh>
            <mesh geometry={bodyGeometries.thumb} position={[-0.031, -0.268, 0.02]}>
              <meshPhysicalMaterial color={skinColor} roughness={0.5} />
            </mesh>

            {/* Aligned 3D Proposal Ring & Open Velvet Cushion Box in Right Hand */}
            {showEngagementRing && (
              <group position={[0, -0.292, 0.038]} rotation={[1.4, 0, 0]}>
                {/* Small Crimson Velvet Ring Box Base */}
                <mesh position={[0, -0.012, 0]}>
                  <boxGeometry args={[0.068, 0.034, 0.064]} />
                  <meshPhysicalMaterial color="#58142c" roughness={0.78} sheen={0.8} sheenColor="#c85a7a" />
                </mesh>
                {/* Open Hinged Lid */}
                <mesh position={[0, 0.022, -0.034]} rotation={[-0.52, 0, 0]}>
                  <boxGeometry args={[0.068, 0.052, 0.014]} />
                  <meshPhysicalMaterial color="#4a1024" roughness={0.78} sheen={0.75} />
                </mesh>
                {/* Cream Satin Cushion */}
                <mesh position={[0, 0.004, 0]}>
                  <boxGeometry args={[0.054, 0.014, 0.05]} />
                  <meshPhysicalMaterial color="#f7efe4" roughness={0.45} sheen={0.6} />
                </mesh>
                {/* 18k Gold Ring Band */}
                <mesh position={[0, 0.026, 0.004]}>
                  <torusGeometry args={[0.019, 0.0045, 10, 22]} />
                  <meshStandardMaterial color="#f6cf70" metalness={0.92} roughness={0.14} />
                </mesh>
                {/* Prong Setting + Sparkling Diamond Solitaire */}
                <mesh position={[0, 0.047, 0.004]}>
                  <cylinderGeometry args={[0.007, 0.004, 0.009, 6]} />
                  <meshStandardMaterial color="#f6cf70" metalness={0.9} roughness={0.16} />
                </mesh>
                <mesh ref={ringGlowRef} position={[0, 0.056, 0.004]}>
                  <octahedronGeometry args={[0.013, 0]} />
                  <meshPhysicalMaterial
                    color="#ffffff"
                    emissive="#ffe9b5"
                    emissiveIntensity={1.65}
                    roughness={0.05}
                    metalness={0.15}
                    clearcoat={1}
                  />
                </mesh>
              </group>
            )}

            {/* Gleaming Gold & Diamond Wedding Ring at the Ring-Exchange Hand Clasp */}
            {showWeddingRing && (
              <group position={[0, -0.285, 0.045]} rotation={[0.45, 0.25, 0]}>
                <mesh>
                  <torusGeometry args={[0.024, 0.0055, 10, 22]} />
                  <meshStandardMaterial
                    color="#f6cf70"
                    metalness={0.92}
                    roughness={0.14}
                    emissive="#8a6214"
                    emissiveIntensity={0.45}
                  />
                </mesh>
                <mesh position={[0, 0.029, 0]}>
                  <octahedronGeometry args={[0.012, 0]} />
                  <meshPhysicalMaterial
                    color="#ffffff"
                    emissive="#ffe9b5"
                    emissiveIntensity={1.45}
                    roughness={0.05}
                    metalness={0.15}
                    clearcoat={1}
                  />
                </mesh>
              </group>
            )}

            {/* Silver & Gold Wedding Cake Knife during Cake Cutting */}
            {showCakeKnife && (
              <group position={[0, -0.285, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.012, 0.014, 0.14, 8]} />
                  <meshStandardMaterial color={COLORS.goldLight} metalness={0.72} roughness={0.22} />
                </mesh>
                <mesh position={[0, 0.23, 0]}>
                  <boxGeometry args={[0.008, 0.22, 0.032]} />
                  <meshStandardMaterial color="#edf2f7" metalness={0.88} roughness={0.14} />
                </mesh>
              </group>
            )}

            {/* Silver Dessert Fork & Frosted Cake Slice during Mutual Feeding */}
            {showCakeFork && (
              <group position={[0, -0.285, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, 0.075, 0]}>
                  <cylinderGeometry args={[0.006, 0.007, 0.16, 8]} />
                  <meshStandardMaterial color="#e6ecf2" metalness={0.85} roughness={0.16} />
                </mesh>
                <mesh position={[0, 0.165, 0.01]}>
                  <boxGeometry args={[0.056, 0.042, 0.052]} />
                  <meshStandardMaterial color="#fff3f6" roughness={0.46} />
                </mesh>
                <mesh position={[0, 0.188, 0.01]}>
                  <boxGeometry args={[0.058, 0.012, 0.054]} />
                  <meshStandardMaterial color="#f6c1d0" roughness={0.45} />
                </mesh>
              </group>
            )}

            {/* Custom Player-Created Bouquet Held Cleanly in Right Hand */}
            {showCustomBouquet && heldBouquet && (
              <group position={[0, -0.285, 0.052]} rotation={[0.92, 0.08, -0.08]}>
                <CustomBouquetMesh design={heldBouquet} scale={0.94} />
              </group>
            )}
          </group>
        </group>

        {/* Left Leg (hip pivot y = 0.84) */}
        <group ref={leftUpperLegRef} position={[-0.095, 0.84, 0]}>
          <mesh geometry={bodyGeometries.upperLeg} position={[0, -0.205, 0]} castShadow>
            <meshPhysicalMaterial color={bottomColor} roughness={0.72} sheen={0.3} />
          </mesh>
          <group ref={leftLowerLegRef} position={[0, -0.41, 0]}>
            <mesh geometry={bodyGeometries.knee}>
              <meshPhysicalMaterial color={bottomColor} roughness={0.72} />
            </mesh>
            <mesh geometry={bodyGeometries.lowerLeg} position={[0, -0.185, 0]} castShadow>
              <meshPhysicalMaterial color={bottomColor} roughness={0.72} sheen={0.25} />
            </mesh>
            <group ref={leftFootRef} position={[0, -0.4, 0.045]}>
              <mesh geometry={bodyGeometries.foot} castShadow>
                <meshPhysicalMaterial color={shoeColor} roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.35} />
              </mesh>
              <mesh geometry={bodyGeometries.footToe} position={[0, -0.003, 0.084]} scale={[1, 0.56, 0.8]}>
                <meshPhysicalMaterial color={shoeColor} roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.35} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right Leg (hip pivot y = 0.84) */}
        <group ref={rightUpperLegRef} position={[0.095, 0.84, 0]}>
          <mesh geometry={bodyGeometries.upperLeg} position={[0, -0.205, 0]} castShadow>
            <meshPhysicalMaterial color={bottomColor} roughness={0.72} sheen={0.3} />
          </mesh>
          <group ref={rightLowerLegRef} position={[0, -0.41, 0]}>
            <mesh geometry={bodyGeometries.knee}>
              <meshPhysicalMaterial color={bottomColor} roughness={0.72} />
            </mesh>
            <mesh geometry={bodyGeometries.lowerLeg} position={[0, -0.185, 0]} castShadow>
              <meshPhysicalMaterial color={bottomColor} roughness={0.72} sheen={0.25} />
            </mesh>
            <group ref={rightFootRef} position={[0, -0.4, 0.045]}>
              <mesh geometry={bodyGeometries.foot} castShadow>
                <meshPhysicalMaterial color={shoeColor} roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.35} />
              </mesh>
              <mesh geometry={bodyGeometries.footToe} position={[0, -0.003, 0.084]} scale={[1, 0.56, 0.8]}>
                <meshPhysicalMaterial color={shoeColor} roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.35} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}