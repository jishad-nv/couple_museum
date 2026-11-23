import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import Wall from '../objects/Wall';
import Floor from '../objects/Floor';
import Bench from '../objects/Decorations';
import { CeilingLight } from '../objects/Decorations';
import Character from '../../character/Character';
import { useGameStore } from '../../store/gameStore';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS, ROMANTIC_SIZE, INTERACTION_DISTANCE } from '../../utils/constants';

export default function RomanticCorner() {
  const { width, depth } = ROMANTIC_SIZE;
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallY = WALL_HEIGHT / 2;
  const offsetX = -(10 + width / 2); // Left of gallery
  const offsetZ = 12;

  const [interaction, setInteraction] = useState<string | null>(null);
  const interactionRef = useRef<THREE.Group>(null);
  const { playerPosition, setNearbyInteractable, setCharacterAction, setCompanionAction } = useGameStore();

  useFrame(() => {
    if (!interactionRef.current) return;
    const worldPos = new THREE.Vector3();
    interactionRef.current.getWorldPosition(worldPos);
    const dist = worldPos.distanceTo(playerPosition);

    if (dist < INTERACTION_DISTANCE) {
      setNearbyInteractable('romantic-interact');
    }
  });

  const handleHug = useCallback(() => {
    setInteraction('hug');
    setCharacterAction('hug');
    setCompanionAction('hug');
    setTimeout(() => {
      setInteraction(null);
      setCharacterAction('idle');
      setCompanionAction('idle');
    }, 3000);
  }, [setCharacterAction, setCompanionAction]);

  const handleSit = useCallback(() => {
    setInteraction('sit');
    setCharacterAction('sit');
    setCompanionAction('sit');
  }, [setCharacterAction, setCompanionAction]);

  return (
    <group position={[offsetX, 0, offsetZ]}>
      {/* Floor */}
      <Floor position={[0, 0, 0]} size={[width, depth]} />

      {/* Ceiling */}
      <mesh position={[0, WALL_HEIGHT, 0]} receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#ffe8ee" roughness={0.5} />
      </mesh>

      {/* Walls - warm pink tint */}
      <Wall
        position={[0, wallY, -halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color="#f5e0e8"
      />
      <Wall
        position={[-halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color="#f5e0e8"
      />
      <Wall
        position={[0, wallY, halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color="#f5e0e8"
      />

      {/* Right wall with door to gallery */}
      <Wall
        position={[halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color="#f5e0e8"
        hasDoor
        doorPosition={0}
        doorWidth={2.5}
        doorHeight={3.5}
      />

      {/* Ceiling lights - warm pink */}
      <CeilingLight position={[0, WALL_HEIGHT, 0]} />
      <CeilingLight position={[-3, WALL_HEIGHT, -3]} />
      <CeilingLight position={[3, WALL_HEIGHT, 3]} />

      {/* Romantic lighting */}
      <pointLight position={[0, 3, 0]} intensity={8} color="#ffb6c1" distance={10} />
      <pointLight position={[-3, 2, -3]} intensity={4} color="#ff69b4" distance={6} />
      <pointLight position={[3, 2, 3]} intensity={4} color="#ff69b4" distance={6} />

      {/* Heart decoration on back wall */}
      <Float speed={1.5} floatIntensity={0.2}>
        <mesh position={[0, 3, -halfD + 0.3]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial
            color="#ff4466"
            emissive="#ff4466"
            emissiveIntensity={0.4}
          />
        </mesh>
      </Float>

      {/* Room title */}
      <Text
        position={[0, 4, -halfD + 0.5]}
        fontSize={0.3}
        color={COLORS.rosePink}
        anchorX="center"
        font={undefined}
      >
        ♡ Romantic Corner ♡
      </Text>

      {/* Bench for sitting */}
      <Bench position={[0, 0, 2]} rotation={[0, 0, 0]} />

      {/* Companion character */}
      <group ref={interactionRef} position={[2, 0, 0]}>
        <Character
          isMale={false}
          action={useGameStore.getState().companionAction}
        />
      </group>

      {/* Interaction zone */}
      <group position={[0, 0, 0]}>
        {/* Interaction buttons displayed as 3D text */}
        <Text
          position={[-2, 1.5, 0]}
          fontSize={0.15}
          color={COLORS.rosePink}
          anchorX="center"
          onClick={handleHug}
          font={undefined}
        >
          💕 Hug
        </Text>
        <Text
          position={[0, 1.5, 2.5]}
          fontSize={0.15}
          color={COLORS.rosePink}
          anchorX="center"
          onClick={handleSit}
          font={undefined}
        >
          🪑 Sit Together
        </Text>
      </group>

      {/* Rose petals on floor */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * (width - 2),
            0.02,
            (Math.random() - 0.5) * (depth - 2),
          ]}
          rotation={[
            -Math.PI / 2 + Math.random() * 0.3,
            Math.random() * Math.PI * 2,
            0,
          ]}
        >
          <circleGeometry args={[0.05 + Math.random() * 0.05, 6]} />
          <meshStandardMaterial
            color={`hsl(${340 + Math.random() * 20}, 80%, ${60 + Math.random() * 20}%)`}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
