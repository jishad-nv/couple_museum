import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import Floor from '../objects/Floor';
import Wall from '../objects/Wall';
import { Tree, Bush, GardenLamp, Flower } from '../objects/Decorations';
import { LuxuryDoorArchwayFrame, LuxuryDoorLeaf } from '../objects/MuseumDoor';
import { useGameStore } from '../../store/gameStore';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS } from '../../utils/constants';
import {
  MAIN_DOOR_POS,
  ENTRANCE_ARRIVAL_POS,
  registerCameraCollider,
  unregisterCameraCollider,
} from '../../utils/museumLayout';

const EXTERIOR_TREES: Array<{ pos: [number, number, number]; scale: number; blossom: boolean }> = [
  { pos: [-11.5, 0, 8.5], scale: 1.05, blossom: true },
  { pos: [11.5, 0, 8.5], scale: 1.05, blossom: true },
  { pos: [-13.0, 0, 15.5], scale: 1.15, blossom: false },
  { pos: [13.0, 0, 15.5], scale: 1.15, blossom: false },
];

const EXTERIOR_BUSHES: Array<{ pos: [number, number, number]; scale: number }> = [
  { pos: [-5.4, 0, 5.2], scale: 0.9 },
  { pos: [5.4, 0, 5.2], scale: 0.9 },
  { pos: [-8.2, 0, 6.2], scale: 1.1 },
  { pos: [8.2, 0, 6.2], scale: 1.1 },
  { pos: [-3.4, 0, 11.2], scale: 0.75 },
  { pos: [3.4, 0, 11.2], scale: 0.75 },
];

const EXTERIOR_FLOWERS: Array<{ pos: [number, number, number]; color: string; phase: number }> = [
  { pos: [-4.6, 0, 6.8], color: '#ff7aa8', phase: 0.2 },
  { pos: [-4.1, 0, 7.6], color: '#ffd166', phase: 0.8 },
  { pos: [-4.7, 0, 8.4], color: '#ff8fab', phase: 1.5 },
  { pos: [4.6, 0, 6.8], color: '#ff7aa8', phase: 2.1 },
  { pos: [4.1, 0, 7.6], color: '#ffd166', phase: 2.7 },
  { pos: [4.7, 0, 8.4], color: '#ff8fab', phase: 3.3 },
  { pos: [-3.5, 0, 13.0], color: '#f7a8b8', phase: 1.1 },
  { pos: [3.5, 0, 13.0], color: '#f7a8b8', phase: 1.9 },
];

const PORTICO_COLUMN_XS = [-6.0, -3.6, 3.6, 6.0];

function PorticoColumn({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const m = meshRef.current;
    registerCameraCollider(m);
    return () => unregisterCameraCollider(m);
  }, []);

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.48, 0.92]} />
          <meshStandardMaterial color="#dfd5c7" roughness={0.45} />
        </mesh>
        <mesh ref={meshRef} position={[0, 3.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.31, 0.37, 5.4, 16]} />
          <meshStandardMaterial color="#f2ebe0" roughness={0.35} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 5.85, 0]} castShadow>
        <boxGeometry args={[0.96, 0.26, 0.96]} />
        <meshStandardMaterial color="#dfd5c7" roughness={0.42} />
      </mesh>
      <mesh position={[0, 5.66, 0]}>
        <cylinderGeometry args={[0.38, 0.32, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
      </mesh>
    </group>
  );
}

export default function MuseumExterior() {
  const isMainDoorOpen = useGameStore((s) => s.isMainDoorOpen);
  const textsMap = useGameStore((s) => s.textsMap);
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const openProgressRef = useRef(0);
  const isNearRef = useRef(false);

  const exteriorTitle = textsMap.exterior_title || 'OUR LOVE MUSEUM';

  // Trigger door open + smooth walk inside on E key near main entrance
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.code !== 'KeyE') return;
      const s = useGameStore.getState();
      if (
        s.showPhotoViewer ||
        s.showGuestbookModal ||
        s.showVideoPlayer ||
        s.showLoveAlbum ||
        s.showAdminLogin ||
        s.showAdminPanel
      ) {
        return;
      }
      if (s.nearbyInteractable === 'main-door' && !s.isMainDoorOpen) {
        s.setMainDoorOpen(true);
        s.startScriptedWalk({
          target: ENTRANCE_ARRIVAL_POS,
          facing: Math.PI,
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();

    // Animate double doors swinging inward smoothly
    const targetOpen = s.isMainDoorOpen ? 1 : 0;
    const nextOpen = THREE.MathUtils.lerp(
      openProgressRef.current,
      targetOpen,
      1 - Math.exp(-3.5 * delta)
    );
    openProgressRef.current = Math.abs(targetOpen - nextOpen) < 0.0005 ? targetOpen : nextOpen;
    const swingAngle = openProgressRef.current * 1.48;
    if (leftDoorRef.current) leftDoorRef.current.rotation.y = swingAngle;
    if (rightDoorRef.current) rightDoorRef.current.rotation.y = -swingAngle;

    // Proximity sensor across the front courtyard so button is available right from start
    const px = s.playerPosition.x;
    const pz = s.playerPosition.z;
    const distToDoor = Math.hypot(px - MAIN_DOOR_POS[0], pz - MAIN_DOOR_POS[2]);
    const near = !s.isMainDoorOpen && s.currentRoom === 'exterior' && distToDoor < 11.5;

    if (near !== isNearRef.current) {
      isNearRef.current = near;
      if (near) {
        s.setNearbyInteractable('main-door');
      } else if (s.nearbyInteractable === 'main-door') {
        s.setNearbyInteractable(null);
      }
    }
  });

  const doorHalfW = 1.65;
  const doorHeight = 4.1;

  return (
    <group>
      {/* Stone courtyard forecourt */}
      <Floor position={[0, 0, 14]} size={[18, 20]} color="#d8cfc2" />

      {/* Surrounding green manicured front lawn */}
      <Floor position={[-18, -0.02, 14]} size={[18, 24]} isGarden />
      <Floor position={[18, -0.02, 14]} size={[18, 24]} isGarden />
      <Floor position={[0, -0.02, 27]} size={[54, 8]} isGarden />

      {/* Ceremonial red-velvet & gold carpet runner leading into the museum */}
      <mesh position={[0, 0.012, 9.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.7, 11.2]} />
        <meshStandardMaterial color={COLORS.velvetRed} roughness={0.85} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh position={[-1.4, 0.014, 9.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 11.2]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh position={[1.4, 0.014, 9.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 11.2]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} polygonOffset polygonOffsetFactor={-2} />
      </mesh>

      {/* Grand Front Museum Facade Wall (owns z = 4.0 shared boundary with EntranceHall) */}
      <Wall
        position={[0, WALL_HEIGHT / 2, 4.0]}
        size={[18, WALL_HEIGHT, WALL_THICKNESS + 0.16]}
        color="#efe7da"
        hasDoor
        doorPosition={0}
        doorWidth={3.4}
        doorHeight={4.2}
      />

      {/* Grand Upper Cornice, Entablature & Triangular Pediment */}
      <mesh position={[0, WALL_HEIGHT + 0.48, 4.5]} castShadow>
        <boxGeometry args={[18.8, 0.96, 3.2]} />
        <meshStandardMaterial color="#e8decb" roughness={0.45} />
      </mesh>
      <mesh position={[0, WALL_HEIGHT + 0.98, 4.55]}>
        <boxGeometry args={[19.2, 0.2, 3.45]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
      </mesh>
      {/* Classical Triangular Pediment Roof */}
      <mesh position={[0, WALL_HEIGHT + 2.0, 4.7]} rotation={[0, Math.PI / 4, 0]} scale={[1.8, 0.72, 1.0]} castShadow>
        <coneGeometry args={[7.2, 2.8, 4]} />
        <meshStandardMaterial color="#e4d9c6" roughness={0.5} />
      </mesh>

      {/* Grand Museum Facade Title Plaque */}
      <mesh position={[0, WALL_HEIGHT + 0.48, 6.12]}>
        <boxGeometry args={[6.4, 0.72, 0.1]} />
        <meshStandardMaterial color="#251424" roughness={0.45} />
      </mesh>
      <Text
        position={[0, WALL_HEIGHT + 0.48, 6.18]}
        fontSize={0.46}
        color={COLORS.goldLight}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
        font={undefined}
      >
        {exteriorTitle.toUpperCase()}
      </Text>

      {/* Classical Marble Portico Columns */}
      {PORTICO_COLUMN_XS.map((cx) => (
        <PorticoColumn key={cx} position={[cx, 0, 6.0]} />
      ))}

      {/* Ornate Double Entrance Doors */}
      <group position={[0, 0, 4.0]}>
        <LuxuryDoorArchwayFrame
          openingWidth={doorHalfW * 2 + 0.04}
          openingHeight={doorHeight + 0.04}
          depth={0.56}
          variant="entrance"
        />

        {/* Left Door Leaf (hinged at x = -1.65) */}
        <group ref={leftDoorRef} position={[-doorHalfW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorHalfW - 0.02}
            height={doorHeight}
            thickness={0.14}
            variant="entrance"
            hingeSide="left"
          />
        </group>

        {/* Right Door Leaf (hinged at x = +1.65) */}
        <group ref={rightDoorRef} position={[doorHalfW, 0, 0]}>
          <LuxuryDoorLeaf
            width={doorHalfW - 0.02}
            height={doorHeight}
            thickness={0.14}
            variant="entrance"
            hingeSide="right"
          />
        </group>

        {/* Physics barrier toggled via sensor to avoid Rapier broadphase rebuild lag */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[1.65, doorHeight / 2, 0.16]}
            position={[0, doorHeight / 2, 0]}
            sensor={isMainDoorOpen}
          />
        </RigidBody>
      </group>

      {/* Architectural Stone Parapets & Lanterns framing Courtyard */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-9.2, 0.55, 14]} castShadow receiveShadow>
          <boxGeometry args={[0.45, 1.1, 20]} />
          <meshStandardMaterial color="#dfd4c4" roughness={0.6} />
        </mesh>
        <mesh position={[9.2, 0.55, 14]} castShadow receiveShadow>
          <boxGeometry args={[0.45, 1.1, 20]} />
          <meshStandardMaterial color="#dfd4c4" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.55, 24.0]} castShadow receiveShadow>
          <boxGeometry args={[18.8, 1.1, 0.45]} />
          <meshStandardMaterial color="#dfd4c4" roughness={0.6} />
        </mesh>
      </RigidBody>

      <GardenLamp position={[-2.6, 0, 7.2]} />
      <GardenLamp position={[2.6, 0, 7.2]} />
      <GardenLamp position={[-2.6, 0, 14.5]} />
      <GardenLamp position={[2.6, 0, 14.5]} />

      {/* Trees, Bushes, Grounded Flowers */}
      {EXTERIOR_TREES.map((t, idx) => (
        <Tree key={`ext-tree-${idx}`} position={t.pos} scale={t.scale} blossom={t.blossom} />
      ))}
      {EXTERIOR_BUSHES.map((b, idx) => (
        <Bush key={`ext-bush-${idx}`} position={b.pos} scale={b.scale} />
      ))}
      {EXTERIOR_FLOWERS.map((f, idx) => (
        <Flower key={`ext-fl-${idx}`} position={f.pos} color={f.color} phaseOffset={f.phase} />
      ))}
    </group>
  );
}
