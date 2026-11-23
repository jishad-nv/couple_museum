import { useRef, useMemo } from 'react';
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

  const skinColor = isMale ? '#e8b89d' : '#f0c8b0';
  const hairColor = isMale ? '#3a2a1a' : '#2a1a0a';
  const topColor = color || (isMale ? '#2c3e6b' : COLORS.rosePink);
  const bottomColor = isMale ? '#2a2a3a' : '#3a2a3a';
  const shoeColor = isMale ? '#1a1a1a' : '#8b2252';

  const bodyGeometries = useMemo(
    () => ({
      head: new THREE.SphereGeometry(0.18, 16, 16),
      hair: new THREE.SphereGeometry(0.19, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
      torso: new THREE.CylinderGeometry(0.22, 0.2, 0.55, 8),
      hip: new THREE.CylinderGeometry(0.2, 0.18, 0.2, 8),
      upperArm: new THREE.CylinderGeometry(0.06, 0.055, 0.3, 6),
      lowerArm: new THREE.CylinderGeometry(0.055, 0.045, 0.28, 6),
      hand: new THREE.SphereGeometry(0.05, 8, 8),
      upperLeg: new THREE.CylinderGeometry(0.08, 0.07, 0.35, 6),
      lowerLeg: new THREE.CylinderGeometry(0.07, 0.055, 0.32, 6),
      foot: new THREE.BoxGeometry(0.1, 0.06, 0.18),
      neck: new THREE.CylinderGeometry(0.07, 0.08, 0.1, 8),
    }),
    []
  );

  // Refs for animated parts
  const leftUpperArmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const leftUpperLegRef = useRef<THREE.Group>(null);
  const rightUpperLegRef = useRef<THREE.Group>(null);
  const leftLowerLegRef = useRef<THREE.Group>(null);
  const rightLowerLegRef = useRef<THREE.Group>(null);
  const leftLowerArmRef = useRef<THREE.Group>(null);
  const rightLowerArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  // Helper to lerp rotation smoothly
  const smoothRot = (targetRot: THREE.Euler, currentRot: THREE.Euler, factor: number) => {
    currentRot.x = THREE.MathUtils.lerp(currentRot.x, targetRot.x, factor);
    currentRot.y = THREE.MathUtils.lerp(currentRot.y, targetRot.y, factor);
    currentRot.z = THREE.MathUtils.lerp(currentRot.z, targetRot.z, factor);
  };

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const lerpSpeed = Math.min(1, delta * 12);

    let walkSpeed = 0;
    let walkAmplitude = 0;
    let armSwing = 0;
    let bodyBob = 0;
    let bodyLean = 0;

    const isRunning = action === 'run';
    const isWalking = action === 'walk' || action === 'hold_hands_walk';
    const isSitting = action === 'sit';
    const isHugging = action === 'hug';
    const isKissing = action === 'kiss';

    if (isRunning) {
      walkSpeed = 10;
      walkAmplitude = 0.7;
      armSwing = 0.85;
      bodyBob = 0.03;
      bodyLean = 0.08;
    } else if (isWalking) {
      walkSpeed = isHoldingHands ? 5.2 : 6;
      walkAmplitude = 0.48;
      armSwing = 0.55;
      bodyBob = 0.016;
      bodyLean = 0.03;
    } else if (isSitting || isHugging || isKissing) {
      walkSpeed = 0;
    } else {
      // Idle
      walkSpeed = 1.2;
      walkAmplitude = 0.04;
      armSwing = 0.06;
      bodyBob = 0.006;
      bodyLean = 0;
    }

    limbPhaseRef.current += delta * walkSpeed;
    const phase = limbPhaseRef.current;

    // Target rotation holders
    const tLeftUpperArm = new THREE.Euler(0, 0, 0);
    const tRightUpperArm = new THREE.Euler(0, 0, 0);
    const tLeftLowerArm = new THREE.Euler(0, 0, 0);
    const tRightLowerArm = new THREE.Euler(0, 0, 0);

    const tLeftUpperLeg = new THREE.Euler(0, 0, 0);
    const tRightUpperLeg = new THREE.Euler(0, 0, 0);
    const tLeftLowerLeg = new THREE.Euler(0, 0, 0);
    const tRightLowerLeg = new THREE.Euler(0, 0, 0);

    let targetBodyY = 0;
    let targetBodyLeanX = 0;
    let targetBodyTiltZ = 0;
    let targetHeadRotY = 0;
    let targetHeadRotX = 0;
    let targetHeadRotZ = 0;

    if (isSitting) {
      // Sitting pose
      targetBodyY = -0.25;
      tLeftUpperLeg.x = -Math.PI / 2 + 0.05;
      tRightUpperLeg.x = -Math.PI / 2 + 0.05;
      tLeftLowerLeg.x = Math.PI / 2 - 0.05;
      tRightLowerLeg.x = Math.PI / 2 - 0.05;

      if (isHoldingHands) {
        // Holding hands while sitting: inner arms reach together toward bench center
        if (isMale) {
          // Male on left, right arm holds partner hand
          tRightUpperArm.x = -0.4;
          tRightUpperArm.z = -0.3;
          tRightLowerArm.x = -0.3;
          tLeftUpperArm.x = -0.3;
          tLeftLowerArm.x = -0.2;
          targetHeadRotY = -0.15; // Glancing warmly at partner
        } else {
          // Female on right, left arm holds partner hand
          tLeftUpperArm.x = -0.4;
          tLeftUpperArm.z = 0.3;
          tLeftLowerArm.x = -0.3;
          tRightUpperArm.x = -0.3;
          tRightLowerArm.x = -0.2;
          targetHeadRotY = 0.15; // Glancing warmly at partner
        }
      } else {
        // Normal sitting pose with hands resting comfortably on lap
        tLeftUpperArm.x = -0.4;
        tRightUpperArm.x = -0.4;
        tLeftLowerArm.x = -0.5;
        tRightLowerArm.x = -0.5;
      }
      targetBodyLeanX = 0.04;
    } else if (isHugging) {
      // Hug pose
      targetBodyY = Math.sin(t * 2) * 0.005; // Gentle breathing
      targetBodyLeanX = 0.06;

      if (isMale) {
        // Male embraces: right arm around her back/shoulder, left arm around waist
        tRightUpperArm.x = -1.35;
        tRightUpperArm.z = -0.35;
        tLeftUpperArm.x = -1.15;
        tLeftUpperArm.z = 0.42;
        tRightLowerArm.x = -0.65;
        tLeftLowerArm.x = -0.55;
        targetHeadRotY = -0.22;
        targetHeadRotX = 0.1;
        targetHeadRotZ = -0.1;
      } else {
        // Female embraces: wraps around neck and upper back
        tLeftUpperArm.x = -1.42;
        tLeftUpperArm.z = 0.38;
        tRightUpperArm.x = -1.25;
        tRightUpperArm.z = -0.38;
        tLeftLowerArm.x = -0.7;
        tRightLowerArm.x = -0.6;
        targetHeadRotY = 0.22;
        targetHeadRotX = 0.1;
        targetHeadRotZ = 0.1;
      }
    } else if (isKissing) {
      // Romantic kiss pose
      targetBodyY = Math.sin(t * 1.8) * 0.004;
      targetBodyLeanX = 0.11; // Lean slightly into the kiss

      if (isMale) {
        // Male hands tenderly on partner's waist/cheeks
        tRightUpperArm.x = -0.95;
        tRightUpperArm.z = -0.22;
        tLeftUpperArm.x = -0.95;
        tLeftUpperArm.z = 0.22;
        tRightLowerArm.x = -0.45;
        tLeftLowerArm.x = -0.45;
        // Head tilted slightly to the right for natural kiss angle
        targetHeadRotZ = -0.18;
        targetHeadRotX = 0.1;
        targetHeadRotY = -0.05;
      } else {
        // Female hands gently resting on partner's chest / shoulders
        tLeftUpperArm.x = -0.9;
        tLeftUpperArm.z = 0.18;
        tRightUpperArm.x = -0.9;
        tRightUpperArm.z = -0.18;
        tLeftLowerArm.x = -0.5;
        tRightLowerArm.x = -0.5;
        // Head tilted opposite to male for sweet alignment
        targetHeadRotZ = 0.18;
        targetHeadRotX = 0.08;
        targetHeadRotY = 0.05;
      }
    } else {
      // Dynamic walk / run / idle / hand-holding
      const legAngle = Math.sin(phase) * walkAmplitude;
      const kneeAngle = Math.max(0, Math.sin(phase) * walkAmplitude * 0.65);

      tLeftUpperLeg.x = legAngle;
      tRightUpperLeg.x = -legAngle;
      tLeftLowerLeg.x = -kneeAngle;
      tRightLowerLeg.x = kneeAngle;

      targetBodyY = Math.abs(Math.sin(phase * 2)) * bodyBob;
      targetBodyLeanX = bodyLean;
      targetBodyTiltZ = Math.sin(phase) * bodyLean * 0.4;

      if (isHoldingHands) {
        // Hand-holding mode!
        if (isMale) {
          // Male: partner is on his right.
          // Right arm is lowered and reaches slightly to the right/forward to hold partner's hand
          tRightUpperArm.x = -0.18 + Math.sin(phase * 0.5) * 0.04;
          tRightUpperArm.z = -0.24;
          tRightLowerArm.x = -0.22;

          // Left arm swings naturally
          tLeftUpperArm.x = -Math.sin(phase) * armSwing;
          tLeftLowerArm.x = -Math.max(0, -Math.sin(phase) * armSwing * 0.3);

          // Head gently looks forward with sweet occasional glance
          targetHeadRotY = Math.sin(t * 0.5) * 0.04 + (Math.sin(t * 0.2) > 0.6 ? -0.12 : 0);
        } else {
          // Female: partner is on her left.
          // Left arm reaches slightly to the left/forward to clasp male's hand
          tLeftUpperArm.x = -0.18 + Math.sin(phase * 0.5) * 0.04;
          tLeftUpperArm.z = 0.24;
          tLeftLowerArm.x = -0.22;

          // Right arm swings naturally
          tRightUpperArm.x = Math.sin(phase) * armSwing;
          tRightLowerArm.x = -Math.max(0, Math.sin(phase) * armSwing * 0.3);

          // Head looks forward with occasional loving glance toward partner
          targetHeadRotY = Math.sin(t * 0.5) * 0.04 + (Math.sin(t * 0.2) > 0.6 ? 0.12 : 0);
        }
      } else {
        // Independent arm swing
        tLeftUpperArm.x = -Math.sin(phase) * armSwing;
        tRightUpperArm.x = Math.sin(phase) * armSwing;
        tLeftLowerArm.x = -Math.max(0, -Math.sin(phase) * armSwing * 0.3);
        tRightLowerArm.x = -Math.max(0, Math.sin(phase) * armSwing * 0.3);
        targetHeadRotY = Math.sin(t * 0.5) * 0.05;
      }
    }

    // Apply smoothly to bones
    if (leftUpperArmRef.current) smoothRot(tLeftUpperArm, leftUpperArmRef.current.rotation, lerpSpeed);
    if (rightUpperArmRef.current) smoothRot(tRightUpperArm, rightUpperArmRef.current.rotation, lerpSpeed);
    if (leftLowerArmRef.current) smoothRot(tLeftLowerArm, leftLowerArmRef.current.rotation, lerpSpeed);
    if (rightLowerArmRef.current) smoothRot(tRightLowerArm, rightLowerArmRef.current.rotation, lerpSpeed);

    if (leftUpperLegRef.current) smoothRot(tLeftUpperLeg, leftUpperLegRef.current.rotation, lerpSpeed);
    if (rightUpperLegRef.current) smoothRot(tRightUpperLeg, rightUpperLegRef.current.rotation, lerpSpeed);
    if (leftLowerLegRef.current) smoothRot(tLeftLowerLeg, leftLowerLegRef.current.rotation, lerpSpeed);
    if (rightLowerLegRef.current) smoothRot(tRightLowerLeg, rightLowerLegRef.current.rotation, lerpSpeed);

    if (bodyRef.current) {
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, targetBodyY, lerpSpeed);
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetBodyLeanX, lerpSpeed);
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, targetBodyTiltZ, lerpSpeed);
    }

    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetHeadRotY, lerpSpeed);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadRotX, lerpSpeed);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, targetHeadRotZ, lerpSpeed);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <group ref={bodyRef}>
        {/* Neck */}
        <mesh geometry={bodyGeometries.neck} position={[0, 1.37, 0]}>
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Head */}
        <mesh ref={headRef} geometry={bodyGeometries.head} position={[0, 1.55, 0]}>
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Hair */}
        <mesh geometry={bodyGeometries.hair} position={[0, 1.58, -0.02]} rotation={[0.1, 0, 0]}>
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.06, 1.56, 0.15]} scale={[0.03, 0.035, 0.02]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.06, 1.56, 0.15]} scale={[0.03, 0.035, 0.02]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* Torso */}
        <mesh geometry={bodyGeometries.torso} position={[0, 1.07, 0]}>
          <meshStandardMaterial color={topColor} roughness={0.7} />
        </mesh>

        {/* Hip */}
        <mesh geometry={bodyGeometries.hip} position={[0, 0.72, 0]}>
          <meshStandardMaterial color={bottomColor} roughness={0.7} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftUpperArmRef} position={[-0.3, 1.25, 0]}>
          <mesh geometry={bodyGeometries.upperArm} position={[0, -0.15, 0]}>
            <meshStandardMaterial color={topColor} roughness={0.7} />
          </mesh>
          <group ref={leftLowerArmRef} position={[0, -0.3, 0]}>
            <mesh geometry={bodyGeometries.lowerArm} position={[0, -0.14, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
            <mesh geometry={bodyGeometries.hand} position={[0, -0.3, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
          </group>
        </group>

        {/* Right Arm */}
        <group ref={rightUpperArmRef} position={[0.3, 1.25, 0]}>
          <mesh geometry={bodyGeometries.upperArm} position={[0, -0.15, 0]}>
            <meshStandardMaterial color={topColor} roughness={0.7} />
          </mesh>
          <group ref={rightLowerArmRef} position={[0, -0.3, 0]}>
            <mesh geometry={bodyGeometries.lowerArm} position={[0, -0.14, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
            <mesh geometry={bodyGeometries.hand} position={[0, -0.3, 0]}>
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
          </group>
        </group>

        {/* Left Leg */}
        <group ref={leftUpperLegRef} position={[-0.1, 0.62, 0]}>
          <mesh geometry={bodyGeometries.upperLeg} position={[0, -0.18, 0]}>
            <meshStandardMaterial color={bottomColor} roughness={0.7} />
          </mesh>
          <group ref={leftLowerLegRef} position={[0, -0.35, 0]}>
            <mesh geometry={bodyGeometries.lowerLeg} position={[0, -0.16, 0]}>
              <meshStandardMaterial color={bottomColor} roughness={0.7} />
            </mesh>
            <mesh geometry={bodyGeometries.foot} position={[0, -0.33, 0.04]}>
              <meshStandardMaterial color={shoeColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* Right Leg */}
        <group ref={rightUpperLegRef} position={[0.1, 0.62, 0]}>
          <mesh geometry={bodyGeometries.upperLeg} position={[0, -0.18, 0]}>
            <meshStandardMaterial color={bottomColor} roughness={0.7} />
          </mesh>
          <group ref={rightLowerLegRef} position={[0, -0.35, 0]}>
            <mesh geometry={bodyGeometries.lowerLeg} position={[0, -0.16, 0]}>
              <meshStandardMaterial color={bottomColor} roughness={0.7} />
            </mesh>
            <mesh geometry={bodyGeometries.foot} position={[0, -0.33, 0.04]}>
              <meshStandardMaterial color={shoeColor} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}