import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Floor from '../objects/Floor';
import Wall from '../objects/Wall';
import { CeilingLight } from '../objects/Decorations';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS } from '../../utils/constants';
import { getMemoryArtworkDataUrl } from '../../utils/memoryArt';
import {
  PRIVATE_CHAMBER_CENTER,
  PRIVATE_DOOR_POS,
  PRIVATE_MEMORY_DISPLAY_SLOTS,
} from '../../utils/museumLayout';
import type { PrivateMemoryItem } from '../../utils/secretMystery';
import { useGameStore } from '../../store/gameStore';

const DUST_MOTE_COUNT = 52;

function usePrivatePhotoTexture(item: PrivateMemoryItem): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;
    const url = getMemoryArtworkDataUrl({
      id: item.id,
      title: item.title,
      section: 'Special Moments',
      date: item.dateLabel,
      description: item.body,
      photoSrc: item.photoSrc,
      palette: item.palette,
      motif: item.motif,
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!active) return;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.src = url;

    return () => {
      active = false;
    };
  }, [item.id, item.title, item.dateLabel, item.body, item.photoSrc, item.palette, item.motif]);

  return texture;
}

function ChamberBookshelf({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.65, 2.5, 0.42]} />
          <meshStandardMaterial color="#341a22" roughness={0.62} />
        </mesh>
      </RigidBody>
      {[0.48, 1.05, 1.62, 2.15].map((sy, idx) => (
        <group key={idx} position={[0, sy, 0.14]}>
          <mesh>
            <boxGeometry args={[1.48, 0.04, 0.24]} />
            <meshStandardMaterial color="#4e2934" roughness={0.55} />
          </mesh>
          {/* Decorative linen volumes & keepsake boxes */}
          {[-0.5, -0.25, 0.05, 0.32, 0.52].map((bx, j) => (
            <mesh key={j} position={[bx, 0.16, 0]} castShadow>
              <boxGeometry args={[0.14, 0.26 + ((idx + j) % 3) * 0.04, 0.16]} />
              <meshStandardMaterial
                color={
                  (idx + j) % 4 === 0
                    ? '#7b2844'
                    : (idx + j) % 4 === 1
                    ? '#9c733a'
                    : (idx + j) % 4 === 2
                    ? '#3c4564'
                    : '#623344'
                }
                roughness={0.72}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function CentralMemoryBoard({
  item,
  position,
  rotation,
  isNearby,
}: {
  item: PrivateMemoryItem;
  position: [number, number, number];
  rotation: [number, number, number];
  isNearby: boolean;
}) {
  const openPrivateMemory = useGameStore((s) => s.openPrivateMemory);
  const tex = usePrivatePhotoTexture(item);

  return (
    <group
      position={[position[0], 0, position[2]]}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        openPrivateMemory(item);
      }}
    >
      {/* Solid Timber Easel / Memory Board Stand */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.56, 2.4]} />
          <meshStandardMaterial color="#3c1f28" roughness={0.58} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.16, 2.05, 2.68]} />
        <meshStandardMaterial color="#4b2732" roughness={0.48} />
      </mesh>
      {/* Velvet Pinboard Canvas */}
      <mesh position={[0.09, 1.58, 0]}>
        <boxGeometry args={[0.03, 1.78, 2.42]} />
        <meshStandardMaterial color="#2b121c" roughness={0.85} />
      </mesh>
      {/* Pinned Central Photograph */}
      <mesh position={[0.115, 1.7, -0.52]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.05, 0.78]} />
        <meshStandardMaterial
          map={tex ?? undefined}
          color={tex ? '#ffffff' : item.palette[1]}
          roughness={0.4}
        />
      </mesh>
      {/* Pinned Keepsake Card */}
      <mesh position={[0.115, 1.66, 0.55]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.02, 1.1]} />
        <meshStandardMaterial color="#f5e6ce" roughness={0.74} />
      </mesh>
      <Text
        position={[0.125, 2.0, 0.55]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.088}
        maxWidth={0.9}
        color="#522030"
        anchorX="center"
        font={undefined}
      >
        {item.title}
      </Text>
      <Text
        position={[0.125, 1.64, 0.55]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.062}
        maxWidth={0.88}
        color="#3d2724"
        anchorX="center"
        font={undefined}
      >
        {item.body.slice(0, 118) + (item.body.length > 118 ? '…' : '')}
      </Text>
      {item.secretCode && (
        <Text
          position={[0.125, 1.24, 0.55]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.072}
          color="#965d1e"
          anchorX="center"
          font={undefined}
        >
          {`CODE: ${item.secretCode}`}
        </Text>
      )}
      <Text
        position={[0.125, 2.34, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.11}
        color={isNearby ? '#fff5c8' : COLORS.goldLight}
        anchorX="center"
        letterSpacing={0.08}
        font={undefined}
      >
        {isNearby ? 'CENTRAL MEMORY BOARD · PRESS [E] TO VIEW' : 'CENTRAL MEMORY BOARD'}
      </Text>
    </group>
  );
}

function WallPrivateDisplay({
  item,
  position,
  rotation,
  isNearby,
}: {
  item: PrivateMemoryItem;
  position: [number, number, number];
  rotation: [number, number, number];
  isNearby: boolean;
}) {
  const openPrivateMemory = useGameStore((s) => s.openPrivateMemory);
  const tex = usePrivatePhotoTexture(item);

  const isLetter = item.kind === 'letter';
  const isCode = item.kind === 'code';
  const isMessage = item.kind === 'message';

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        openPrivateMemory(item);
      }}
    >
      {/* Outer Gilded Frame / Plaque */}
      <mesh castShadow>
        <boxGeometry args={[1.88, 1.38, 0.08]} />
        <meshStandardMaterial
          color={isNearby ? '#e6ba62' : '#9c783c'}
          emissive={isNearby ? '#8a5d1c' : '#000000'}
          emissiveIntensity={isNearby ? 0.55 : 0}
          metalness={0.42}
          roughness={0.34}
        />
      </mesh>

      {/* Backing Mat */}
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[1.66, 1.16, 0.02]} />
        <meshStandardMaterial
          color={isLetter ? '#f4e6cf' : isCode ? '#241428' : isMessage ? '#351b2a' : '#2a1824'}
          roughness={0.72}
        />
      </mesh>

      {/* Artwork / Letter Parchment / Code Plate */}
      {item.kind === 'photo' || item.kind === 'board' || item.photoSrc ? (
        <mesh position={[0, 0.04, 0.06]}>
          <planeGeometry args={[1.48, 0.96]} />
          <meshStandardMaterial
            map={tex ?? undefined}
            color={tex ? '#ffffff' : item.palette[1]}
            roughness={0.36}
          />
        </mesh>
      ) : (
        <>
          <Text
            position={[0, 0.34, 0.064]}
            fontSize={0.072}
            color={isLetter ? '#8c3148' : COLORS.goldLight}
            anchorX="center"
            font={undefined}
          >
            {isLetter ? 'PRIVATE LETTER' : isCode ? 'SECRET CODE' : 'KEEPSAKE MESSAGE'}
          </Text>
          <Text
            position={[0, 0.14, 0.064]}
            fontSize={0.09}
            maxWidth={1.4}
            color={isLetter ? '#2b181c' : '#fff5e4'}
            anchorX="center"
            font={undefined}
          >
            {item.title}
          </Text>
          <Text
            position={[0, -0.14, 0.064]}
            fontSize={0.065}
            maxWidth={1.38}
            color={isLetter ? '#4a3335' : '#e4d2be'}
            anchorX="center"
            font={undefined}
          >
            {item.body.slice(0, 92) + (item.body.length > 92 ? '…' : '')}
          </Text>
          {item.secretCode && (
            <Text
              position={[0, -0.4, 0.064]}
              fontSize={0.078}
              color={isLetter ? '#8c3148' : '#ffd57e'}
              anchorX="center"
              font={undefined}
            >
              {item.secretCode}
            </Text>
          )}
        </>
      )}

      {/* Crimson Wax Seal on Letters */}
      {isLetter && (
        <mesh position={[0.56, -0.36, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.02, 14]} />
          <meshStandardMaterial color="#a8203e" emissive="#d84062" emissiveIntensity={0.45} />
        </mesh>
      )}

      {/* Brass Caption Plate Beneath Frame */}
      <mesh position={[0, -0.82, 0.03]}>
        <boxGeometry args={[1.38, 0.2, 0.03]} />
        <meshStandardMaterial color="#25131f" roughness={0.6} />
      </mesh>
      <Text
        position={[0, -0.82, 0.05]}
        fontSize={0.072}
        maxWidth={1.28}
        color={isNearby ? '#fff5c8' : '#f2dfc0'}
        anchorX="center"
        font={undefined}
      >
        {item.title}
      </Text>
    </group>
  );
}

export default function PrivateMemoryChamber() {
  const privateMemories = useGameStore((s) => s.privateMemories);
  const nearbyPrivateMemory = useGameStore((s) => s.nearbyPrivateMemory);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const textsMap = useGameStore((s) => s.textsMap);
  const motesRef = useRef<THREE.Points>(null);

  const chamberTitle = textsMap.private_chamber_title || 'OUR PRIVATE MEMORIES';

  const displayAssignments = useMemo(() => {
    const central =
      privateMemories.find((m) => m.kind === 'board') ?? privateMemories[0] ?? null;
    const others = privateMemories.filter((m) => !central || m.id !== central.id);
    const wallSlots = PRIVATE_MEMORY_DISPLAY_SLOTS.slice(1);
    const mappedWalls = others.slice(0, wallSlots.length).map((item, idx) => ({
      item,
      slot: wallSlots[idx],
    }));
    return {
      central,
      centralSlot: PRIVATE_MEMORY_DISPLAY_SLOTS[0],
      wallItems: mappedWalls,
    };
  }, [privateMemories]);

  const motePositions = useMemo(() => {
    const arr = new Float32Array(DUST_MOTE_COUNT * 3);
    for (let i = 0; i < DUST_MOTE_COUNT; i++) {
      arr[i * 3] = ((Math.sin(i * 13.7) + 1) * 0.5) * 16.5 - 53.0;
      arr[i * 3 + 1] = ((Math.sin(i * 31.3) + 1) * 0.5) * 3.5 + 0.6;
      arr[i * 3 + 2] = ((Math.sin(i * 23.9) + 1) * 0.5) * 15.5 - 29.2;
    }
    return arr;
  }, []);

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
        s.showAdminPanel ||
        s.showSecretLetterModal ||
        s.showDoYouLoveMeModal ||
        s.showLoveQuizModal ||
        s.showPrivateMemoryModal
      ) {
        return;
      }
      if (s.currentRoom !== 'private_chamber') return;
      if (s.nearbyPrivateMemory) {
        s.openPrivateMemory(s.nearbyPrivateMemory);
      } else if (s.nearbyInteractable === 'private-chamber-exit') {
        s.exitPrivateChamberToSecret();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useFrame((state) => {
    if (motesRef.current) {
      motesRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.08;
    }

    const s = useGameStore.getState();
    if (s.currentRoom !== 'private_chamber') {
      if (s.nearbyPrivateMemory) s.setNearbyPrivateMemory(null);
      if (s.nearbyInteractable === 'private-chamber-exit') s.setNearbyInteractable(null);
      return;
    }

    const px = s.playerPosition.x;
    const pz = s.playerPosition.z;

    let bestItem: PrivateMemoryItem | null = null;
    let bestDist = 3.1;

    if (displayAssignments.central) {
      const d = Math.hypot(
        px - displayAssignments.centralSlot.position[0],
        pz - displayAssignments.centralSlot.position[2]
      );
      if (d < bestDist) {
        bestDist = d;
        bestItem = displayAssignments.central;
      }
    }

    for (const w of displayAssignments.wallItems) {
      const d = Math.hypot(px - w.slot.position[0], pz - w.slot.position[2]);
      if (d < bestDist) {
        bestDist = d;
        bestItem = w.item;
      }
    }

    s.setNearbyPrivateMemory(bestItem);

    const exitDist = Math.hypot(px - PRIVATE_DOOR_POS[0], pz - PRIVATE_DOOR_POS[2]);
    if (!bestItem && exitDist < 3.2) {
      if (s.nearbyInteractable !== 'private-chamber-exit') {
        s.setNearbyInteractable('private-chamber-exit');
      }
    } else if (s.nearbyInteractable === 'private-chamber-exit') {
      s.setNearbyInteractable(null);
    }
  });

  return (
    <group name="OurPrivateMemoriesChamber">
      {/* Warm Mahogany Floor offset below SecretRoom floor to prevent Z-fighting */}
      <Floor position={[-44.8, -0.004, -21.5]} size={[18.4, 18.0]} color="#23141b" />

      {/* Plush Archive Runner & Sanctuary Carpet */}
      <mesh position={[PRIVATE_CHAMBER_CENTER[0], 0.012, PRIVATE_CHAMBER_CENTER[2]]} receiveShadow>
        <boxGeometry args={[14.0, 0.02, 10.6]} />
        <meshStandardMaterial color="#3c1726" roughness={0.9} />
      </mesh>
      <mesh position={[PRIVATE_CHAMBER_CENTER[0], 0.016, PRIVATE_CHAMBER_CENTER[2]]} receiveShadow>
        <boxGeometry args={[13.0, 0.018, 9.6]} />
        <meshStandardMaterial color="#512034" roughness={0.88} />
      </mesh>

      {/* North, South, West & East-Corner Seal Walnut Walls */}
      <Wall
        position={[-44.8, WALL_HEIGHT / 2, -30.5]}
        size={[18.6, WALL_HEIGHT, WALL_THICKNESS]}
        color="#2a151e"
      />
      <Wall
        position={[-44.8, WALL_HEIGHT / 2, -12.5]}
        size={[18.6, WALL_HEIGHT, WALL_THICKNESS]}
        color="#2a151e"
      />
      <Wall
        position={[-54.0, WALL_HEIGHT / 2, -21.5]}
        size={[WALL_THICKNESS, WALL_HEIGHT, 18.2]}
        color="#26121b"
      />
      <Wall
        position={[-35.6, WALL_HEIGHT / 2, -29.75]}
        size={[WALL_THICKNESS, WALL_HEIGHT, 1.5]}
        color="#2a151e"
      />
      <Wall
        position={[-35.6, WALL_HEIGHT / 2, -13.25]}
        size={[WALL_THICKNESS, WALL_HEIGHT, 1.5]}
        color="#2a151e"
      />

      {/* Exterior Museum Limestone Cladding (keeps Wedding terrace & exterior forecourt cohesive) */}
      <mesh position={[-44.8, WALL_HEIGHT / 2, -12.32]} receiveShadow>
        <planeGeometry args={[18.6, WALL_HEIGHT]} />
        <meshStandardMaterial color="#e8dfd1" roughness={0.45} />
      </mesh>
      <mesh position={[-44.8, WALL_HEIGHT - 0.14, -12.28]}>
        <boxGeometry args={[18.7, 0.24, 0.12]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position={[-44.8, WALL_HEIGHT / 2, -30.68]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[18.6, WALL_HEIGHT]} />
        <meshStandardMaterial color="#e8dfd1" roughness={0.45} />
      </mesh>
      <mesh position={[-54.18, WALL_HEIGHT / 2, -21.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[18.2, WALL_HEIGHT]} />
        <meshStandardMaterial color="#e8dfd1" roughness={0.45} />
      </mesh>

      {/* Coffered Walnut Ceiling & Brass Chandeliers */}
      <mesh position={[-44.8, WALL_HEIGHT, -21.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18.6, 18.2]} />
        <meshStandardMaterial color="#1d0f16" roughness={0.8} />
      </mesh>
      {[-49.8, -44.8, -39.8].map((rx, idx) => (
        <mesh key={`pc-beam-${idx}`} position={[rx, WALL_HEIGHT - 0.14, -21.5]}>
          <boxGeometry args={[0.26, 0.28, 17.8]} />
          <meshStandardMaterial color="#44232f" roughness={0.6} />
        </mesh>
      ))}
      <CeilingLight position={[-40.2, WALL_HEIGHT - 0.12, -21.5]} />
      <CeilingLight position={[-44.8, WALL_HEIGHT - 0.12, -21.5]} />
      <CeilingLight position={[-49.5, WALL_HEIGHT - 0.12, -21.5]} />

      {/* Chamber Title Crest Above West Feature Wall */}
      <group position={[-53.62, 4.15, -21.5]}>
        <mesh>
          <boxGeometry args={[0.08, 0.56, 5.4]} />
          <meshStandardMaterial color="#1f0f17" roughness={0.5} />
        </mesh>
        <Text
          position={[0.06, 0.06, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.24}
          color={COLORS.goldLight}
          anchorX="center"
          letterSpacing={0.12}
          font={undefined}
        >
          {chamberTitle.toUpperCase()}
        </Text>
        <Text
          position={[0.06, -0.17, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.115}
          color="#f2c4cf"
          anchorX="center"
          font={undefined}
        >
          Locked Vault of Unspoken Letters, Secret Codes & Unshared Keepsakes
        </Text>
      </group>

      {/* Atmospheric Wooden Bookshelves in Corners */}
      <ChamberBookshelf position={[-53.4, 0, -29.1]} rotation={[0, Math.PI / 2, 0]} />
      <ChamberBookshelf position={[-53.4, 0, -13.9]} rotation={[0, Math.PI / 2, 0]} />
      <ChamberBookshelf position={[-37.4, 0, -29.8]} rotation={[0, 0, 0]} />
      <ChamberBookshelf position={[-37.4, 0, -13.2]} rotation={[0, Math.PI, 0]} />

      {/* Central Memory Board Display */}
      {displayAssignments.central && (
        <CentralMemoryBoard
          item={displayAssignments.central}
          position={displayAssignments.centralSlot.position}
          rotation={displayAssignments.centralSlot.rotation}
          isNearby={nearbyPrivateMemory?.id === displayAssignments.central.id}
        />
      )}

      {/* Wall-Mounted Private Photographs, Letters, Codes & Milestone Displays */}
      {displayAssignments.wallItems.map(({ item, slot }) => (
        <WallPrivateDisplay
          key={item.id}
          item={item}
          position={slot.position}
          rotation={slot.rotation}
          isNearby={nearbyPrivateMemory?.id === item.id}
        />
      ))}

      {/* Golden Dust Motes */}
      <points ref={motesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffe4ad"
          size={currentRoom === 'private_chamber' ? 0.08 : 0.05}
          transparent
          opacity={0.74}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
