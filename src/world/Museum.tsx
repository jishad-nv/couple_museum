import { Suspense } from 'react';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import CharacterController from '../character/CharacterController';
import CompanionAI from '../character/CompanionAI';
import CoupleEffects from '../character/CoupleEffects';
import ThirdPersonCamera from '../camera/ThirdPersonCamera';
import Lighting from './Lighting';
import NightSky from './objects/NightSky';
import MuseumExterior from './rooms/MuseumExterior';
import EntranceHall from './rooms/EntranceHall';
import PhotoGallery from './rooms/PhotoGallery';
import MemoryTheatre from './rooms/MemoryTheatre';
import MemoryGarden from './rooms/MemoryGarden';

export default function Museum() {
  return (
    <Physics gravity={[0, -9.81, 0]}>
      <color attach="background" args={['#070e1e']} />

      <NightSky />
      <Lighting />

      {/* Permanent invisible bedrock collider directly under Physics so characters never fall while async Text fonts load */}
      <RigidBody type="fixed" colliders={false} position={[0, -0.5, -20]}>
        <CuboidCollider args={[90, 0.5, 90]} />
      </RigidBody>

      {/* Connected 3D Museum Worlds + Characters inside same Suspense */}
      <Suspense fallback={null}>
        <MuseumExterior />
        <EntranceHall />
        <PhotoGallery />
        <MemoryTheatre />
        <MemoryGarden />

        <CharacterController />
        <CompanionAI />
        <CoupleEffects />
      </Suspense>

      {/* Clamped Collision-Aware Third-Person Camera */}
      <ThirdPersonCamera />
    </Physics>
  );
}
