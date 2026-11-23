import { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import CharacterController from '../character/CharacterController';
import CompanionAI from '../character/CompanionAI';
import ThirdPersonCamera from '../camera/ThirdPersonCamera';
import Lighting from './Lighting';
import EntranceHall from './rooms/EntranceHall';
import PhotoGallery from './rooms/PhotoGallery';
import RomanticCorner from './rooms/RomanticCorner';
import MemoryTheatre from './rooms/MemoryTheatre';
import MemoryGarden from './rooms/MemoryGarden';
import { RigidBody } from '@react-three/rapier';

export default function Museum() {
  return (
    <Physics gravity={[0, -9.81, 0]}>
      <Lighting />

      {/* Global ground plane (fallback) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.1, 25]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 120]} />
          <meshStandardMaterial color="#e8e0d4" roughness={0.4} transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Fog */}
      {/* Rooms */}
      <Suspense fallback={null}>
        <EntranceHall />
        <PhotoGallery />
        <RomanticCorner />
        <MemoryTheatre />
        <MemoryGarden />
      </Suspense>

      {/* Player */}
      <CharacterController />

      {/* Companion */}
      <CompanionAI />

      {/* Camera */}
      <ThirdPersonCamera />
    </Physics>
  );
}
