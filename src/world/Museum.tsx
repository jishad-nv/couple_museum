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
import { updateNearestPhotoFrame } from './objects/PhotoFrame';
import { updateNearestBench } from './objects/Decorations';
import { useGameStore } from '../store/gameStore';
import { isWeddingAtmosphereActive } from '../utils/weddingEnvironment';
import {
  createInitialDoorTrackers,
  stepAllDoors,
  type DoorTrackers,
} from '../utils/doorAutoClose';

const NIGHT_BG = new THREE.Color('#070e1e');
const NIGHT_FOG = new THREE.Color('#091124');
const WEDDING_DAY_BG = new THREE.Color('#dfeff6');
const WEDDING_DAY_FOG = new THREE.Color('#dfeff6');

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

function SceneReadyReporter() {
  const { gl, scene, camera } = useThree();
  const reportedRef = useRef(false);

  useEffect(() => {
    if (reportedRef.current) return;
    let cancelled = false;
    let rafId = 0;

    const finalize = () => {
      if (cancelled || reportedRef.current) return;
      reportedRef.current = true;
      try {
        const rendererName = String(
          (gl.getContext()?.getParameter(gl.getContext().RENDERER) as string | undefined) || ''
        );
        if (!/SwiftShader|llvmpipe|Software/i.test(rendererName)) {
          gl.compile(scene, camera);
        }
      } catch {
        // Ignore shader compile diagnostics in restricted environments
      }
      useGameStore.getState().markSceneReady();
    };

    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(finalize);
    });

    const fallbackTimer = window.setTimeout(finalize, 900);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(fallbackTimer);
    };
  }, [gl, scene, camera]);

  return null;
}

function ProximityManager() {
  useFrame(() => {
    const s = useGameStore.getState();
    if (s.isLoading) return;
    updateNearestPhotoFrame(s.playerPosition);
    updateNearestBench(s.playerPosition);
  });

  return null;
}

function DoorAutoCloseManager() {
  const trackersRef = useRef<DoorTrackers>(createInitialDoorTrackers());

  useFrame((_, rawDelta) => {
    const s = useGameStore.getState();
    if (s.isLoading) return;

    const modalOpen =
      s.showPhotoViewer ||
      s.showGuestbookModal ||
      s.showVideoPlayer ||
      s.showLoveAlbum ||
      s.showSecretLetterModal ||
      s.showDoYouLoveMeModal ||
      s.showLoveQuizModal ||
      s.showPrivateMemoryModal ||
      s.showProposalModal ||
      s.showPasswordModal ||
      s.showAdminLogin ||
      s.showAdminPanel ||
      s.showOutfitCustomizer ||
      s.showBouquetCreator ||
      s.showGenderModal;

    const interactionBusy =
      modalOpen ||
      s.isSitting ||
      s.isDancing ||
      s.proposalStage !== 'idle' ||
      s.cakeCuttingStage !== 'idle' ||
      s.bouquetHandoverStage !== 'idle' ||
      s.activeCoupleSequence !== 'none';

    const { nextTrackers, doorsToClose } = stepAllDoors(
      trackersRef.current,
      {
        doorOpenMap: {
          main: s.isMainDoorOpen,
          theatre: s.isTheatreDoorOpen,
          garden: s.isGardenDoorOpen,
          secret: s.isSecretDoorOpen,
          private: s.isPrivateDoorOpen,
          wedding: s.isWeddingDoorOpen,
        },
        playerPos: { x: s.playerPosition.x, z: s.playerPosition.z },
        partnerPos: { x: s.partnerPosition.x, z: s.partnerPosition.z },
        currentRoom: s.currentRoom,
        scriptedWalkTarget: s.scriptedWalk?.target ?? null,
        interactionBusy,
      },
      Math.min(rawDelta, 0.08)
    );

    trackersRef.current = nextTrackers;

    for (const doorId of doorsToClose) {
      if (doorId === 'main') s.setMainDoorOpen(false);
      else if (doorId === 'theatre') s.setTheatreDoorOpen(false);
      else if (doorId === 'garden') s.setGardenDoorOpen(false);
      else if (doorId === 'secret') s.setSecretDoorOpen(false);
      else if (doorId === 'private') s.setPrivateDoorOpen(false);
      else if (doorId === 'wedding') s.setWeddingDoorOpen(false);
    }
  });

  return null;
}

function AdaptiveBackground() {
  const { scene } = useThree();
  const mixRef = useRef(0);
  const bgColorRef = useRef(new THREE.Color('#070e1e'));
  const fogColorRef = useRef(new THREE.Color('#091124'));

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();
    const isWedding = isWeddingAtmosphereActive(s.currentRoom, s.scriptedWalk?.target);
    mixRef.current = THREE.MathUtils.lerp(
      mixRef.current,
      isWedding ? 1 : 0,
      1 - Math.exp(-2.4 * delta)
    );
    const m = mixRef.current;

    bgColorRef.current.copy(NIGHT_BG).lerp(WEDDING_DAY_BG, m);
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(bgColorRef.current);
    } else {
      scene.background = bgColorRef.current.clone();
    }

    if (scene.fog instanceof THREE.Fog) {
      fogColorRef.current.copy(NIGHT_FOG).lerp(WEDDING_DAY_FOG, m);
      scene.fog.color.copy(fogColorRef.current);
      scene.fog.near = THREE.MathUtils.lerp(52, 46, m);
      scene.fog.far = THREE.MathUtils.lerp(130, 162, m);
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
      <ProximityManager />
      <DoorAutoCloseManager />

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
        <SceneReadyReporter />
      </Suspense>

      {/* Clamped Collision-Aware Third-Person Camera */}
      <ThirdPersonCamera />
    </Physics>
  );
}
