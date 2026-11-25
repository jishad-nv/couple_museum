import { Suspense, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
import SecretRoom from './rooms/SecretRoom';
import PrivateMemoryChamber from './rooms/PrivateMemoryChamber';
import WeddingHall from './rooms/WeddingHall';
import { useGameStore } from '../store/gameStore';

const NIGHT_BG = new THREE.Color('#070e1e');
const WEDDING_DAY_BG = new THREE.Color('#9ed4f0');

function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const renderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = renderTarget.texture;
    scene.environmentIntensity = 0.45;
    roomEnv.dispose();
    pmremGenerator.dispose();

    return () => {
      if (scene.environment === renderTarget.texture) {
        scene.environment = null;
      }
      renderTarget.dispose();
    };
  }, [gl, scene]);

  return null;
}

function AdaptiveBackground() {
  const { scene } = useThree();
  const mixRef = useRef(0);
  const bgColorRef = useRef(new THREE.Color('#070e1e'));

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const isWedding = useGameStore.getState().currentRoom === 'wedding';
    mixRef.current = THREE.MathUtils.lerp(
      mixRef.current,
      isWedding ? 1 : 0,
      1 - Math.exp(-2.2 * delta)
    );
    bgColorRef.current.copy(NIGHT_BG).lerp(WEDDING_DAY_BG, mixRef.current);
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(bgColorRef.current);
    } else {
      scene.background = bgColorRef.current.clone();
    }
  });

  return null;
}

export default function Museum() {
  return (
    <Physics gravity={[0, -9.81, 0]}>
      <color attach="background" args={['#070e1e']} />
      <StudioEnvironment />
      <AdaptiveBackground />

      <NightSky />
      <Lighting />

      {/* Permanent invisible bedrock collider directly under Physics so characters never fall while async Text fonts load */}
      <RigidBody type="fixed" colliders={false} position={[-5, -0.5, -26]}>
        <CuboidCollider args={[105, 0.5, 105]} />
      </RigidBody>

      {/* Connected 3D Museum Worlds + Characters inside same Suspense */}
      <Suspense fallback={null}>
        <MuseumExterior />
        <EntranceHall />
        <PhotoGallery />
        <MemoryTheatre />
        <MemoryGarden />
        <SecretRoom />
        <PrivateMemoryChamber />
        <WeddingHall />

        <CharacterController />
        <CompanionAI />
        <CoupleEffects />
      </Suspense>

      {/* Clamped Collision-Aware Third-Person Camera */}
      <ThirdPersonCamera />
    </Physics>
  );
}
