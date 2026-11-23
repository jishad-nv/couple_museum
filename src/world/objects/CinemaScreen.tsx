import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { INTERACTION_DISTANCE, COLORS } from '../../utils/constants';

interface CinemaScreenProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
}

export default function CinemaScreen({
  position,
  rotation = [0, 0, 0],
  size = [8, 4.5],
}: CinemaScreenProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isNear, setIsNear] = useState(false);
  const { playerPosition, setShowVideoPlayer, setNearbyInteractable } = useGameStore();

  useFrame(() => {
    if (!groupRef.current) return;

    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);

    const dist = worldPos.distanceTo(playerPosition);
    const near = dist < INTERACTION_DISTANCE + 2;

    if (near !== isNear) {
      setIsNear(near);
      if (near) {
        setNearbyInteractable('cinema-screen');
      }
    }
  });

  const handleClick = useCallback(() => {
    if (isNear) {
      setShowVideoPlayer(true);
    }
  }, [isNear, setShowVideoPlayer]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Screen border/frame */}
      <mesh>
        <boxGeometry args={[size[0] + 0.4, size[1] + 0.4, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>

      {/* Screen surface */}
      <mesh position={[0, 0, 0.08]} onClick={handleClick}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color="#111122"
          roughness={0.1}
          emissive="#222244"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Play button overlay */}
      <group position={[0, 0, 0.1]}>
        <mesh>
          <circleGeometry args={[0.6, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            emissive="#ffffff"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[0.1, 0, 0.01]}>
          <coneGeometry args={[0.3, 0.5, 3]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Interaction indicator */}
      {isNear && (
        <Text
          position={[0, -(size[1] / 2 + 0.5), 0.1]}
          fontSize={0.15}
          color={COLORS.gold}
          anchorX="center"
          font={undefined}
        >
          Press E to watch
        </Text>
      )}
    </group>
  );
}
