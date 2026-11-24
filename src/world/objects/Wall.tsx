import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { COLORS } from '../../utils/constants';
import { registerCameraCollider, unregisterCameraCollider } from '../../utils/museumLayout';

interface WallProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  hasDoor?: boolean;
  doorPosition?: number;
  doorWidth?: number;
  doorHeight?: number;
  trimColor?: string;
}

function ColliderMesh({
  position = [0, 0, 0],
  size,
  color,
}: {
  position?: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    registerCameraCollider(mesh);
    return () => unregisterCameraCollider(mesh);
  }, []);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.48} />
      </mesh>
    </RigidBody>
  );
}

export default function Wall({
  position,
  size,
  color = COLORS.wallWhite,
  hasDoor = false,
  doorPosition = 0,
  doorWidth = 2.8,
  doorHeight = 3.8,
  trimColor = COLORS.gold,
}: WallProps) {
  if (hasDoor) {
    // Support both X-spanning walls (width > depth) and Z-spanning walls (depth > width)
    const isZSpanning = size[2] > size[0];
    const spanLen = isZSpanning ? size[2] : size[0];
    const wallHeight = size[1];
    const wallThick = isZSpanning ? size[0] : size[2];

    const leftLen = spanLen / 2 + doorPosition - doorWidth / 2;
    const rightLen = spanLen / 2 - doorPosition - doorWidth / 2;
    const topHeight = wallHeight - doorHeight;

    const segPos = (offsetAlongSpan: number, yOffset: number): [number, number, number] =>
      isZSpanning ? [0, yOffset, offsetAlongSpan] : [offsetAlongSpan, yOffset, 0];

    const segSize = (len: number, h: number): [number, number, number] =>
      isZSpanning ? [wallThick, h, len] : [len, h, wallThick];

    const jambSize: [number, number, number] = isZSpanning
      ? [wallThick + 0.06, doorHeight, 0.1]
      : [0.1, doorHeight, wallThick + 0.06];

    const lintelSize: [number, number, number] = isZSpanning
      ? [wallThick + 0.06, 0.12, doorWidth + 0.2]
      : [doorWidth + 0.2, 0.12, wallThick + 0.06];

    return (
      <group position={position}>
        {leftLen > 0.02 && (
          <ColliderMesh
            position={segPos(-(spanLen / 2 - leftLen / 2), 0)}
            size={segSize(leftLen, wallHeight)}
            color={color}
          />
        )}

        {rightLen > 0.02 && (
          <ColliderMesh
            position={segPos(spanLen / 2 - rightLen / 2, 0)}
            size={segSize(rightLen, wallHeight)}
            color={color}
          />
        )}

        {topHeight > 0.02 && (
          <ColliderMesh
            position={segPos(doorPosition, doorHeight + topHeight / 2 - wallHeight / 2)}
            size={segSize(doorWidth, topHeight)}
            color={color}
          />
        )}

        {/* Solid gold door jambs & lintel */}
        <mesh position={segPos(doorPosition - doorWidth / 2 - 0.05, doorHeight / 2 - wallHeight / 2)}>
          <boxGeometry args={jambSize} />
          <meshStandardMaterial color={trimColor} metalness={0.25} roughness={0.35} />
        </mesh>
        <mesh position={segPos(doorPosition + doorWidth / 2 + 0.05, doorHeight / 2 - wallHeight / 2)}>
          <boxGeometry args={jambSize} />
          <meshStandardMaterial color={trimColor} metalness={0.25} roughness={0.35} />
        </mesh>
        <mesh position={segPos(doorPosition, doorHeight - wallHeight / 2 + 0.06)}>
          <boxGeometry args={lintelSize} />
          <meshStandardMaterial color={trimColor} metalness={0.25} roughness={0.35} />
        </mesh>
      </group>
    );
  }

  return <ColliderMesh position={position} size={size} color={color} />;
}
