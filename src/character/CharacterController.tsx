import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { useInput } from '../hooks/useInput';
import Character from './Character';
import {
  PLAYER_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_HEIGHT,
} from '../utils/constants';

export default function CharacterController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const characterRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const isGrounded = useRef(true);
  const { getInput } = useInput();

  const {
    cameraAngleX,
    setPlayerPosition,
    setPlayerRotation,
    setIsMoving,
    setIsRunning,
    setCharacterAction,
  } = useGameStore();

  const { camera } = useThree();

  const moveDirection = useRef(new THREE.Vector3());
  const currentVelocity = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;

    const input = getInput();
    const rb = rigidBodyRef.current;

    // Calculate movement direction relative to camera
    const forward = new THREE.Vector3(
      -Math.sin(cameraAngleX),
      0,
      -Math.cos(cameraAngleX)
    );
    const right = new THREE.Vector3(
      Math.cos(cameraAngleX),
      0,
      -Math.sin(cameraAngleX)
    );

    moveDirection.current.set(0, 0, 0);

    if (input.forward) moveDirection.current.add(forward);
    if (input.backward) moveDirection.current.sub(forward);
    if (input.left) moveDirection.current.sub(right);
    if (input.right) moveDirection.current.add(right);

    const isMoving = moveDirection.current.length() > 0.01;
    const speed = input.run ? PLAYER_RUN_SPEED : PLAYER_SPEED;

    if (isMoving) {
      moveDirection.current.normalize();

      // Smooth rotation toward movement direction
      targetRotation.current = Math.atan2(
        moveDirection.current.x,
        moveDirection.current.z
      );
    }

    // Get current velocity
    const vel = rb.linvel();
    currentVelocity.current.set(vel.x, vel.y, vel.z);

    // Apply movement
    const targetVel = new THREE.Vector3(
      moveDirection.current.x * speed,
      vel.y,
      moveDirection.current.z * speed
    );

    // Smooth velocity interpolation
    const lerpFactor = 1 - Math.pow(0.001, delta);
    const newVelX = THREE.MathUtils.lerp(vel.x, targetVel.x, lerpFactor);
    const newVelZ = THREE.MathUtils.lerp(vel.z, targetVel.z, lerpFactor);

    rb.setLinvel({ x: newVelX, y: targetVel.y, z: newVelZ }, true);

    // Jump
    const pos = rb.translation();
    isGrounded.current = pos.y < 0.95;

    if (input.jump && isGrounded.current) {
      rb.setLinvel({ x: newVelX, y: PLAYER_JUMP_FORCE, z: newVelZ }, true);
    }

    // Rotate character smoothly
    if (characterRef.current) {
      const currentRot = characterRef.current.rotation.y;
      const diff = targetRotation.current - currentRot;
      // Handle angle wrapping
      const wrappedDiff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
      characterRef.current.rotation.y += wrappedDiff * Math.min(1, delta * 10);
    }

    // Update store
    const position = new THREE.Vector3(pos.x, pos.y, pos.z);
    setPlayerPosition(position);
    setPlayerRotation(targetRotation.current);
    setIsMoving(isMoving);
    setIsRunning(input.run && isMoving);

    // Set animation
    if (!isMoving) {
      setCharacterAction('idle');
    } else if (input.run) {
      setCharacterAction('run');
    } else {
      setCharacterAction('walk');
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 2, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={0.5}
      mass={1}
      type="dynamic"
      colliders={false}
      lockRotations
    >
      <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.85, 0]} />
      <group ref={characterRef}>
        <Character
          action={useGameStore.getState().characterAction}
          isMale={true}
        />
      </group>
    </RigidBody>
  );
}
