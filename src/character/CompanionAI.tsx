import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Character from './Character';
import { useGameStore } from '../store/gameStore';

export default function CompanionAI() {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(2, 0, 0));
  const currentPos = useRef(new THREE.Vector3(2, 0, 0));
  const currentRotation = useRef(0);
  const companionAction = useRef('idle');

  const { playerPosition } = useGameStore();

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Follow player at a distance
    const followDistance = 2;
    const followAngle = Math.atan2(
      playerPosition.x - currentPos.current.x,
      playerPosition.z - currentPos.current.z
    );

    // Calculate target position (behind and to the side of player)
    targetPos.current.set(
      playerPosition.x - Math.sin(followAngle + 0.5) * followDistance,
      0,
      playerPosition.z - Math.cos(followAngle + 0.5) * followDistance
    );

    // Distance to target
    const dist = currentPos.current.distanceTo(targetPos.current);

    // Move toward target
    if (dist > 1) {
      const speed = dist > 3 ? 5 : 3;
      currentPos.current.lerp(targetPos.current, Math.min(1, delta * speed));
      companionAction.current = dist > 3 ? 'run' : 'walk';

      // Rotate toward movement direction
      const moveDir = targetPos.current.clone().sub(currentPos.current);
      if (moveDir.length() > 0.01) {
        currentRotation.current = Math.atan2(moveDir.x, moveDir.z);
      }
    } else {
      companionAction.current = useGameStore.getState().companionAction !== 'idle'
        ? useGameStore.getState().companionAction
        : 'idle';

      // Face the player when idle
      const toPlayer = new THREE.Vector3(
        playerPosition.x - currentPos.current.x,
        0,
        playerPosition.z - currentPos.current.z
      );
      if (toPlayer.length() > 0.5) {
        const targetRot = Math.atan2(toPlayer.x, toPlayer.z);
        currentRotation.current = THREE.MathUtils.lerp(
          currentRotation.current,
          targetRot,
          delta * 3
        );
      }
    }

    // Apply position and rotation
    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.y = currentRotation.current;
  });

  return (
    <group ref={groupRef} position={[2, 0, 0]}>
      <Character isMale={false} action={companionAction.current} />
    </group>
  );
}
