import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { INTERACTION_DISTANCE, COLORS } from '../../utils/constants';

interface PhotoFrameProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  photoId: string;
  photoSrc: string;
  message?: string;
  size?: [number, number];
}

export default function PhotoFrame({
  position,
  rotation = [0, 0, 0],
  photoId,
  photoSrc,
  message = '',
  size = [1.6, 1.2],
}: PhotoFrameProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isNear, setIsNear] = useState(false);
  const { playerPosition, setCurrentPhoto, setNearbyInteractable } = useGameStore();

  useFrame(() => {
    if (!groupRef.current) return;

    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);

    const dist = worldPos.distanceTo(playerPosition);
    const near = dist < INTERACTION_DISTANCE;

    if (near !== isNear) {
      setIsNear(near);
      if (near) {
        setNearbyInteractable(photoId);
      } else {
        setNearbyInteractable(null);
      }
    }

    // Glow effect
    if (glowRef.current) {
      const scale = near ? 1.08 + Math.sin(Date.now() * 0.003) * 0.02 : 1;
      glowRef.current.scale.setScalar(scale);
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        near ? 0.3 + Math.sin(Date.now() * 0.004) * 0.1 : 0;
    }
  });

  const handleClick = useCallback(() => {
    if (isNear) {
      setCurrentPhoto(photoSrc, message);
    }
  }, [isNear, photoSrc, message, setCurrentPhoto]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Frame border */}
      <mesh castShadow>
        <boxGeometry args={[size[0] + 0.15, size[1] + 0.15, 0.08]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Inner frame mat */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[size[0] + 0.05, size[1] + 0.05, 0.05]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.5} />
      </mesh>

      {/* Photo surface - placeholder color until real images loaded */}
      <mesh
        ref={glowRef}
        position={[0, 0, 0.045]}
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = isNear ? 'pointer' : 'default';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={size} />
        <meshStandardMaterial
          color="#d4a5b5"
          roughness={0.5}
          emissive="#d4a5b5"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Photo label */}
      {message && (
        <Text
          position={[0, -(size[1] / 2 + 0.2), 0.05]}
          fontSize={0.08}
          color="#888"
          anchorX="center"
          anchorY="top"
          maxWidth={size[0]}
          font={undefined}
        >
          {message}
        </Text>
      )}

      {/* Interaction indicator */}
      {isNear && (
        <group position={[0, size[1] / 2 + 0.3, 0.1]}>
          <Text
            fontSize={0.1}
            color={COLORS.gold}
            anchorX="center"
            font={undefined}
          >
            Press E to view
          </Text>
        </group>
      )}
    </group>
  );
}
