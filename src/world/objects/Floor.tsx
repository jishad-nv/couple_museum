import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';

interface FloorProps {
  position: [number, number, number];
  size: [number, number];
  isGarden?: boolean;
}

export default function Floor({ position, size, isGarden = false }: FloorProps) {
  const floorColor = isGarden ? COLORS.gardenGrass : COLORS.floorMarble;

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color={floorColor}
          roughness={isGarden ? 0.9 : 0.3}
          metalness={isGarden ? 0 : 0.1}
        />
      </mesh>
      {/* Marble tile pattern for indoor floors */}
      {!isGarden && (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <planeGeometry args={size} />
          <meshStandardMaterial
            color={COLORS.floorMarbleDark}
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={0.15}
            wireframe
          />
        </mesh>
      )}
    </RigidBody>
  );
}
