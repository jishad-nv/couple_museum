import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../utils/constants';

interface CharacterProps {
  position?: [number, number, number];
  rotation?: number;
  action?: string;
  isMale?: boolean;
  color?: string;
  isHoldingHands?: boolean;
}

// Standing kinematic skeleton heights (meters, base floor at y = 0):
// Hip pivot at y = 0.84, Thigh = 0.41 -> Knee pivot at -0.41 (y = 0.43)
// LowerLeg = 0.37, Foot center at -0.40 (box height 0.06 -> sole bottom at -0.43 below knee => y = 0.00m)
// Seated kinematics on Bench (cushion top y = 0.465m, thigh bottom offset ~0.072m):
// Seated hipY = 0.465 + 0.072 = 0.537m => targetBodyY = 0.537 - 0.84 = -0.303m
const SEATED_BODY_Y = -0.303;

export default function Character({
  position = [0, 0, 0],
  rotation = 0,
  action = 'idle',
  isMale = true,
  color,
  isHoldingHands = false,
}: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const limbPhaseRef = useRef(0);

  const skinColor = isMale ? '#ebbca0' : '#f4cdb6';
  const blushColor = isMale ? '#e29f88' : '#ef9ba4';
  const hairColor = isMale ? '#332215' : '#26160b';
  const topColor = color || (isMale ? '#263759' : COLORS.rosePink);
  const topTrimColor = isMale ? '#f2ede4' : '#f7cbd6';
  const bottomColor = isMale ? '#1f2230' : '#352236';
  const shoeColor = isMale ? '#18181b' : '#8a2352';

  const bodyGeometries = useMemo(
    () => ({
      head: new THREE.SphereGeometry(0.165, 20, 20),
      hairCap: new THREE.SphereGeometry(0.175, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairBackUpper: new THREE.CylinderGeometry(0.155, 0.175, 0.24, 14),
      hairBackLower: new THREE.CylinderGeometry(0.172, 0.135, 0.22, 14),
      torso: new THREE.CylinderGeometry(0.195, 0.168, 0.48, 16),
      shoulderCap: new THREE.SphereGeometry(0.068, 12, 10),
      collar: new THREE.TorusGeometry(0.088, 0.022, 8, 16),
      belt: new THREE.CylinderGeometry(0.176, 0.176, 0.048, 16),
      skirt: new THREE.CylinderGeometry(0.172, 0.275, 0.36, 18),
      hip: new THREE.CylinderGeometry(0.176, 0.162, 0.16, 14),
      upperArm: new THREE.CylinderGeometry(0.056, 0.048, 0.28, 10),
      lowerArm: new THREE.CylinderGeometry(0.047, 0.039, 0.26, 10),
      hand: new THREE.SphereGeometry(0.046, 10, 10),
      thumb: new THREE.SphereGeometry(0.021, 8, 8),
      upperLeg: new THREE.CylinderGeometry(0.074, 0.062, 0.41, 12),
      lowerLeg: new THREE.CylinderGeometry(0.060, 0.046, 0.37, 12),
      foot: new THREE.BoxGeometry(0.092, 0.055, 0.195),
      footToe: new THREE.SphereGeometry(0.046, 10, 8),
      neck: new THREE.CylinderGeometry(0.062, 0.072, 0.10, 10),
      smile: new THREE.TorusGeometry(0.026, 0.006, 6, 12, Math.PI),
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
    const lerpSpeed = 1 - Math.exp((isSitting ? -9 : -12) * delta);

    let walkSpeed = 0;
    let walkAmplitude = 0;
    let armSwing = 0;
    let bodyBob = 0;
    let bodyLean = 0;

    const isRunning = action === 'run';
    const isWalking = action === 'walk' || action === 'hold_hands_walk';
    const isHugging = action === 'hug';
    const isKissing = action === 'kiss';
    const isDancing = action === 'dance';

    if (isRunning) {
      walkSpeed = 10;
      walkAmplitude = 0.65;
      armSwing = 0.8;
      bodyBob = 0.028;
      bodyLean = 0.07;
    } else if (isWalking) {
      walkSpeed = isHoldingHands ? 5.2 : 6;
      walkAmplitude = 0.44;
      armSwing = 0.5;
      bodyBob = 0.014;
      bodyLean = 0.025;
    } else if (isSitting || isHugging || isKissing || isDancing) {
      walkSpeed = 0;
    } else {
      walkSpeed = 1.1;
      walkAmplitude = 0.018;
      armSwing = 0.04;
      bodyBob = 0.004;
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
      // Exact hip alignment on cushion top (y = 0.465m) with relaxed knee angle so soles rest near floor (y ~ 0.04m)
      targetBodyY = SEATED_BODY_Y;
      tLeftUpperLeg.x = -Math.PI / 2 + 0.04;
      tRightUpperLeg.x = -Math.PI / 2 + 0.04;
      tLeftLowerLeg.x = Math.PI / 2 - 0.05;
      tRightLowerLeg.x = Math.PI / 2 - 0.05;
      tLeftFoot.x = 0.01;
      tRightFoot.x = 0.01;

      if (isHoldingHands) {
        if (isMale) {
          // Male sits on left (-right); inner hand toward partner is local -X (leftUpperArm)
          tLeftUpperArm.x = -0.34;
          tLeftUpperArm.z = -0.22;
          tLeftLowerArm.x = -0.42;

          tRightUpperArm.x = -0.34;
          tRightUpperArm.z = 0.05;
          tRightLowerArm.x = -0.58;
          targetHeadRotY = -0.11;
        } else {
          // Partner sits on right (+right); inner hand toward male is local +X (rightUpperArm)
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
      // Subtle negative X leans torso smoothly back onto the backrest!
      targetBodyLeanX = -0.055;
    } else if (isHugging) {
      // Warm full-torso embrace with heads resting softly side-by-side
      targetBodyY = Math.sin(t * 2.2) * 0.005;
      targetBodyLeanX = 0.055;
      targetBodyTiltZ = Math.sin(t * 1.4) * (isMale ? 0.025 : -0.025);

      if (isMale) {
        tRightUpperArm.x = -1.48;
        tRightUpperArm.z = -0.38;
        tLeftUpperArm.x = -1.08;
        tLeftUpperArm.z = 0.42;
        tRightLowerArm.x = -0.78;
        tLeftLowerArm.x = -0.68;
        targetHeadRotY = -0.26;
        targetHeadRotX = 0.09;
        targetHeadRotZ = -0.14;
      } else {
        tLeftUpperArm.x = -1.48;
        tLeftUpperArm.z = 0.38;
        tRightUpperArm.x = -1.08;
        tRightUpperArm.z = -0.42;
        tLeftLowerArm.x = -0.78;
        tRightLowerArm.x = -0.68;
        targetHeadRotY = 0.26;
        targetHeadRotX = 0.09;
        targetHeadRotZ = 0.14;
      }
    } else if (isKissing) {
      // Distinct close cheek-cradle & affectionate forward lean silhouette
      targetBodyY = Math.sin(t * 1.6) * 0.004;
      targetBodyLeanX = isMale ? 0.12 : 0.10;

      if (isMale) {
        // Left hand cups partner's cheek, right hand rests gently on waist
        tLeftUpperArm.x = -1.78;
        tLeftUpperArm.z = 0.18;
        tLeftLowerArm.x = -1.08;

        tRightUpperArm.x = -0.82;
        tRightUpperArm.z = -0.26;
        tRightLowerArm.x = -0.58;

        targetHeadRotZ = -0.18;
        targetHeadRotX = 0.13;
        targetHeadRotY = -0.03;
      } else {
        // Right hand touches male's shoulder/chest, left hand wraps around torso; gentle chin tilt up
        tRightUpperArm.x = -1.32;
        tRightUpperArm.z = -0.22;
        tRightLowerArm.x = -0.88;

        tLeftUpperArm.x = -0.86;
        tLeftUpperArm.z = 0.24;
        tLeftLowerArm.x = -0.64;

        targetHeadRotZ = 0.18;
        targetHeadRotX = -0.10;
        targetHeadRotY = 0.03;
      }
    } else if (isDancing) {
      // Synchronized Ballroom Waltz Frame (3/4 rise & fall + gentle waltz steps)
      const waltzBeat = t * 2.8;
      const stepPhase = t * 2.1;
      const waltzRise = (Math.sin(waltzBeat) * 0.5 + 0.5) * 0.022;
      const sway = Math.sin(stepPhase) * 0.045;

      targetBodyY = waltzRise;
      targetBodyLeanX = 0.025;
      targetBodyTiltZ = isMale ? sway : -sway;

      // Subtle synchronized waltz footwork
      const legWave = Math.sin(stepPhase) * 0.22;
      tLeftUpperLeg.x = isMale ? legWave : -legWave;
      tRightUpperLeg.x = isMale ? -legWave : legWave;
      tLeftLowerLeg.x = Math.max(0, Math.sin(stepPhase + 0.5) * 0.22);
      tRightLowerLeg.x = Math.max(0, Math.sin(-stepPhase + 0.5) * 0.22);

      if (isMale) {
        // Left arm extended to clasp partner's right hand; right arm around partner's waist
        tLeftUpperArm.x = -0.78;
        tLeftUpperArm.z = -0.46;
        tLeftLowerArm.x = -0.52;

        tRightUpperArm.x = -0.96;
        tRightUpperArm.z = -0.24;
        tRightLowerArm.x = -0.74;

        targetHeadRotY = -0.05;
        targetHeadRotX = 0.04;
      } else {
        // Right arm extended to clasp male's left hand; left hand gracefully on male's shoulder
        tRightUpperArm.x = -0.78;
        tRightUpperArm.z = 0.46;
        tRightLowerArm.x = -0.52;

        tLeftUpperArm.x = -1.14;
        tLeftUpperArm.z = 0.26;
        tLeftLowerArm.x = -0.78;

        targetHeadRotY = 0.05;
        targetHeadRotX = -0.03;
      }
    } else {
      const legAngle = Math.sin(phase) * walkAmplitude;
      const leftKneeBend = Math.max(0, Math.sin(phase + 0.4) * walkAmplitude * 0.72);
      const rightKneeBend = Math.max(0, Math.sin(-phase + 0.4) * walkAmplitude * 0.72);

      tLeftUpperLeg.x = legAngle;
      tRightUpperLeg.x = -legAngle;
      tLeftLowerLeg.x = leftKneeBend;
      tRightLowerLeg.x = rightKneeBend;

      targetBodyY = Math.abs(Math.sin(phase * 2)) * bodyBob;
      targetBodyLeanX = bodyLean;
      targetBodyTiltZ = Math.sin(phase) * bodyLean * 0.35;

      if (isHoldingHands) {
        if (isMale) {
          tLeftUpperArm.x = -0.14 + Math.sin(phase * 0.5) * 0.035;
          tLeftUpperArm.z = -0.30;
          tLeftLowerArm.x = -0.20;

          tRightUpperArm.x = Math.sin(phase) * armSwing;
          tRightLowerArm.x = -Math.max(0, Math.sin(phase) * armSwing * 0.3);
          targetHeadRotY = Math.sin(t * 0.5) * 0.04 + (Math.sin(t * 0.25) > 0.65 ? -0.11 : 0);
        } else {
          tRightUpperArm.x = -0.14 + Math.sin(phase * 0.5) * 0.035;
          tRightUpperArm.z = 0.30;
          tRightLowerArm.x = -0.20;

          tLeftUpperArm.x = -Math.sin(phase) * armSwing;
          tLeftLowerArm.x = -Math.max(0, -Math.sin(phase) * armSwing * 0.3);
          targetHeadRotY = Math.sin(t * 0.5) * 0.04 + (Math.sin(t * 0.25) > 0.65 ? 0.11 : 0);
        }
      } else {
        tLeftUpperArm.x = -Math.sin(phase) * armSwing;
        tRightUpperArm.x = Math.sin(phase) * armSwing;
        tLeftLowerArm.x = -Math.max(0, -Math.sin(phase) * armSwing * 0.3);
        tRightLowerArm.x = -Math.max(0, Math.sin(phase) * armSwing * 0.3);
        targetHeadRotY = Math.sin(t * 0.5) * 0.04;
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
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Soft contact shadow disc on floor */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 18]} />
        <meshBasicMaterial color="#0b0710" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      <group ref={bodyRef}>
        {/* Neck */}
        <mesh geometry={bodyGeometries.neck} position={[0, 1.44, 0]}>
          <meshStandardMaterial color={skinColor} roughness={0.58} />
        </mesh>

        {/* Refined Head Group (rotates together cleanly: face features + layered hair) */}
        <group ref={headGroupRef} position={[0, 1.62, 0]}>
          <mesh geometry={bodyGeometries.head} castShadow>
            <meshStandardMaterial color={skinColor} roughness={0.56} />
          </mesh>

          {/* Layered Hair Crown (slightly oversized to wrap cleanly without skin seams) */}
          <mesh
            geometry={bodyGeometries.hairCap}
            position={[0, 0.028, -0.015]}
            rotation={[0.2, 0, 0]}
            scale={[1.04, 1.03, 1.05]}
            castShadow
          >
            <meshStandardMaterial color={hairColor} roughness={0.78} />
          </mesh>
          {isMale ? (
            <>
              {/* Subtle textured front locks & side tapers */}
              <mesh position={[-0.05, 0.125, 0.105]} rotation={[0.45, -0.2, 0.15]}>
                <boxGeometry args={[0.09, 0.055, 0.08]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[0.05, 0.13, 0.105]} rotation={[0.42, 0.2, -0.15]}>
                <boxGeometry args={[0.095, 0.055, 0.08]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[-0.148, -0.02, -0.015]}>
                <boxGeometry args={[0.032, 0.11, 0.075]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[0.148, -0.02, -0.015]}>
                <boxGeometry args={[0.032, 0.11, 0.075]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
            </>
          ) : (
            <>
              {/* Flowing Layered Long Hair & Seamless Side Locks */}
              <mesh
                geometry={bodyGeometries.hairBackUpper}
                position={[0, -0.06, -0.048]}
                scale={[1.05, 1.0, 1.06]}
                castShadow
              >
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
              <mesh geometry={bodyGeometries.hairBackLower} position={[0, -0.25, -0.068]} castShadow>
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
              <mesh position={[-0.138, -0.04, 0.035]} rotation={[0.04, 0, 0.08]}>
                <cylinderGeometry args={[0.042, 0.032, 0.26, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
              <mesh position={[0.138, -0.04, 0.035]} rotation={[0.04, 0, -0.08]}>
                <cylinderGeometry args={[0.042, 0.032, 0.26, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
              {/* Subtle rose hair accent */}
              <mesh position={[0.115, 0.115, -0.02]}>
                <sphereGeometry args={[0.028, 8, 8]} />
                <meshStandardMaterial color={COLORS.rosePink} roughness={0.45} />
              </mesh>
            </>
          )}

          {/* Expressive Eyes with Sclera + Iris + Catchlight */}
          {[-0.054, 0.054].map((ex, idx) => (
            <group key={`eye-${idx}`} position={[ex, 0.01, 0.145]}>
              <mesh scale={[0.024, 0.022, 0.014]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color="#f8f6f2" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.008]} scale={[0.015, 0.017, 0.01]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color="#1d1828" roughness={0.2} />
              </mesh>
              <mesh position={[0.005, 0.006, 0.015]} scale={[0.005, 0.005, 0.005]}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}

          {/* Eyebrows */}
          <mesh position={[-0.055, 0.045, 0.142]} rotation={[0, 0, isMale ? 0.06 : 0.1]}>
            <boxGeometry args={[0.044, 0.009, 0.012]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          <mesh position={[0.055, 0.045, 0.142]} rotation={[0, 0, isMale ? -0.06 : -0.1]}>
            <boxGeometry args={[0.044, 0.009, 0.012]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>

          {/* Subtle Nose Bridge */}
          <mesh position={[0, -0.018, 0.158]} scale={[0.013, 0.024, 0.016]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.56} />
          </mesh>

          {/* Soft Cheek Warmth */}
          <mesh position={[-0.088, -0.028, 0.125]} scale={[0.026, 0.015, 0.01]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={blushColor} roughness={0.7} transparent opacity={isMale ? 0.3 : 0.55} />
          </mesh>
          <mesh position={[0.088, -0.028, 0.125]} scale={[0.026, 0.015, 0.01]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={blushColor} roughness={0.7} transparent opacity={isMale ? 0.3 : 0.55} />
          </mesh>

          {/* Gentle Warm Smile */}
          <mesh
            geometry={bodyGeometries.smile}
            position={[0, -0.055, 0.148]}
            rotation={[Math.PI, 0, 0]}
          >
            <meshStandardMaterial color="#b86b68" roughness={0.6} />
          </mesh>
        </group>

        {/* Torso with Rounded Upper Shoulder Slope & Collar Trim */}
        <mesh geometry={bodyGeometries.torso} position={[0, 1.16, 0]} castShadow>
          <meshStandardMaterial color={topColor} roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.385, 0]} scale={[0.195, 0.07, 0.195]} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={topColor} roughness={0.78} />
        </mesh>
        <mesh geometry={bodyGeometries.collar} position={[0, 1.40, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color={topTrimColor} roughness={0.65} />
        </mesh>

        {/* Waist Belt / Dress Sash */}
        <mesh geometry={bodyGeometries.belt} position={[0, 0.93, 0]}>
          <meshStandardMaterial color={isMale ? '#2a1d15' : '#c96f86'} roughness={0.58} />
        </mesh>
        {isMale && (
          <mesh position={[0, 0.93, 0.175]}>
            <boxGeometry args={[0.048, 0.036, 0.016]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.35} />
          </mesh>
        )}

        {/* Pelvis / Dress Skirt */}
        {isMale ? (
          <mesh geometry={bodyGeometries.hip} position={[0, 0.85, 0]} castShadow>
            <meshStandardMaterial color={bottomColor} roughness={0.76} />
          </mesh>
        ) : (
          <mesh geometry={bodyGeometries.skirt} position={[0, 0.77, 0]} castShadow>
            <meshStandardMaterial color={topColor} roughness={0.76} />
          </mesh>
        )}

        {/* Left Arm (local -X) */}
        <group ref={leftUpperArmRef} position={[-0.235, 1.33, 0]}>
          <mesh geometry={bodyGeometries.shoulderCap} position={[0.01, -0.01, 0]}>
            <meshStandardMaterial color={topColor} roughness={0.78} />
          </mesh>
          <mesh geometry={bodyGeometries.upperArm} position={[0, -0.14, 0]} castShadow>
            <meshStandardMaterial color={topColor} roughness={0.78} />
          </mesh>
          <group ref={leftLowerArmRef} position={[0, -0.28, 0]}>
            <mesh geometry={bodyGeometries.lowerArm} position={[0, -0.13, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.58} />
            </mesh>
            <mesh geometry={bodyGeometries.hand} position={[0, -0.28, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.58} />
            </mesh>
            <mesh geometry={bodyGeometries.thumb} position={[0.032, -0.268, 0.022]}>
              <meshStandardMaterial color={skinColor} roughness={0.58} />
            </mesh>
          </group>
        </group>

        {/* Right Arm (local +X) */}
        <group ref={rightUpperArmRef} position={[0.235, 1.33, 0]}>
          <mesh geometry={bodyGeometries.shoulderCap} position={[-0.01, -0.01, 0]}>
            <meshStandardMaterial color={topColor} roughness={0.78} />
          </mesh>
          <mesh geometry={bodyGeometries.upperArm} position={[0, -0.14, 0]} castShadow>
            <meshStandardMaterial color={topColor} roughness={0.78} />
          </mesh>
          <group ref={rightLowerArmRef} position={[0, -0.28, 0]}>
            <mesh geometry={bodyGeometries.lowerArm} position={[0, -0.13, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.58} />
            </mesh>
            <mesh geometry={bodyGeometries.hand} position={[0, -0.28, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.58} />
            </mesh>
            <mesh geometry={bodyGeometries.thumb} position={[-0.032, -0.268, 0.022]}>
              <meshStandardMaterial color={skinColor} roughness={0.58} />
            </mesh>
          </group>
        </group>

        {/* Left Leg (hip pivot y = 0.84) */}
        <group ref={leftUpperLegRef} position={[-0.095, 0.84, 0]}>
          <mesh geometry={bodyGeometries.upperLeg} position={[0, -0.205, 0]} castShadow>
            <meshStandardMaterial color={bottomColor} roughness={0.76} />
          </mesh>
          <group ref={leftLowerLegRef} position={[0, -0.41, 0]}>
            <mesh geometry={bodyGeometries.lowerLeg} position={[0, -0.185, 0]} castShadow>
              <meshStandardMaterial color={bottomColor} roughness={0.76} />
            </mesh>
            <group ref={leftFootRef} position={[0, -0.40, 0.045]}>
              <mesh geometry={bodyGeometries.foot} castShadow>
                <meshStandardMaterial color={shoeColor} roughness={0.48} />
              </mesh>
              <mesh geometry={bodyGeometries.footToe} position={[0, -0.004, 0.088]} scale={[1, 0.56, 0.8]}>
                <meshStandardMaterial color={shoeColor} roughness={0.48} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right Leg (hip pivot y = 0.84) */}
        <group ref={rightUpperLegRef} position={[0.095, 0.84, 0]}>
          <mesh geometry={bodyGeometries.upperLeg} position={[0, -0.205, 0]} castShadow>
            <meshStandardMaterial color={bottomColor} roughness={0.76} />
          </mesh>
          <group ref={rightLowerLegRef} position={[0, -0.41, 0]}>
            <mesh geometry={bodyGeometries.lowerLeg} position={[0, -0.185, 0]} castShadow>
              <meshStandardMaterial color={bottomColor} roughness={0.76} />
            </mesh>
            <group ref={rightFootRef} position={[0, -0.40, 0.045]}>
              <mesh geometry={bodyGeometries.foot} castShadow>
                <meshStandardMaterial color={shoeColor} roughness={0.48} />
              </mesh>
              <mesh geometry={bodyGeometries.footToe} position={[0, -0.004, 0.088]} scale={[1, 0.56, 0.8]}>
                <meshStandardMaterial color={shoeColor} roughness={0.48} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}