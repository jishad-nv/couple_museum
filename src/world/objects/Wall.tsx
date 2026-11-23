import { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS } from '../../utils/constants';

interface WallProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  hasDoor?: boolean;
  doorPosition?: number;
  doorWidth?: number;
  doorHeight?: number;
}

export default function Wall({
  position,
  size,
  color = COLORS.wallWhite,
  hasDoor = false,
  doorPosition = 0,
  doorWidth = 2.5,
  doorHeight = 3.5,
}: WallProps) {
  if (hasDoor) {
    // Split wall into segments around the door
    const wallWidth = size[0];
    const wallHeight = size[1];
    const wallDepth = size[2];

    const leftWidth = (wallWidth / 2 + doorPosition - doorWidth / 2);
    const rightWidth = (wallWidth / 2 - doorPosition - doorWidth / 2);
    const topHeight = wallHeight - doorHeight;

    return (
      <group position={position}>
        {/* Left segment */}
        {leftWidth > 0.01 && (
          <RigidBody type="fixed" colliders="cuboid">
            <mesh
              position={[-(wallWidth / 2 - leftWidth / 2), 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[leftWidth, wallHeight, wallDepth]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>
          </RigidBody>
        )}

        {/* Right segment */}
        {rightWidth > 0.01 && (
          <RigidBody type="fixed" colliders="cuboid">
            <mesh
              position={[(wallWidth / 2 - rightWidth / 2), 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[rightWidth, wallHeight, wallDepth]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>
          </RigidBody>
        )}

        {/* Top segment (above door) */}
        {topHeight > 0.01 && (
          <RigidBody type="fixed" colliders="cuboid">
            <mesh
              position={[doorPosition, (doorHeight + topHeight / 2 - wallHeight / 2), 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[doorWidth, topHeight, wallDepth]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>
          </RigidBody>
        )}

        {/* Door frame trim */}
        <mesh position={[doorPosition - doorWidth / 2 - 0.05, doorHeight / 2 - wallHeight / 2, wallDepth / 2 + 0.01]}>
          <boxGeometry args={[0.08, doorHeight, 0.02]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[doorPosition + doorWidth / 2 + 0.05, doorHeight / 2 - wallHeight / 2, wallDepth / 2 + 0.01]}>
          <boxGeometry args={[0.08, doorHeight, 0.02]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[doorPosition, doorHeight - wallHeight / 2 + 0.04, wallDepth / 2 + 0.01]}>
          <boxGeometry args={[doorWidth + 0.16, 0.08, 0.02]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    </RigidBody>
  );
}
