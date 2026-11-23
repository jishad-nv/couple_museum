import { Text } from '@react-three/drei';
import Wall from '../objects/Wall';
import Floor from '../objects/Floor';
import CinemaScreen from '../objects/CinemaScreen';
import Bench from '../objects/Decorations';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS, CINEMA_SIZE } from '../../utils/constants';

export default function MemoryTheatre() {
  const { width, depth } = CINEMA_SIZE;
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallY = WALL_HEIGHT / 2;
  const offsetZ = 26; // After gallery

  return (
    <group position={[0, 0, offsetZ]}>
      {/* Floor - dark carpet */}
      <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#2a2035" roughness={0.9} />
      </mesh>
      {/* Floor collider */}
      <mesh position={[0, -0.05, 0]} visible={false}>
        <boxGeometry args={[width, 0.1, depth]} />
      </mesh>

      {/* Ceiling - dark */}
      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1a1525" roughness={0.8} />
      </mesh>

      {/* Walls - dark cinema walls */}
      <Wall
        position={[0, wallY, halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color="#2a2035"
        hasDoor
        doorPosition={0}
        doorWidth={3}
        doorHeight={3.8}
      />
      <Wall
        position={[0, wallY, -halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color="#2a2035"
        hasDoor
        doorPosition={0}
        doorWidth={3}
        doorHeight={3.8}
      />
      <Wall
        position={[-halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color="#2a2035"
      />
      <Wall
        position={[halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color="#2a2035"
      />

      {/* Cinema Screen */}
      <CinemaScreen
        position={[0, 3, -halfD + 0.5]}
        size={[8, 4.5]}
      />

      {/* Seating rows */}
      <Bench position={[-3, 0, 0]} rotation={[0, 0, 0]} />
      <Bench position={[0, 0, 0]} rotation={[0, 0, 0]} />
      <Bench position={[3, 0, 0]} rotation={[0, 0, 0]} />

      <Bench position={[-3, 0, 3]} rotation={[0, 0, 0]} />
      <Bench position={[0, 0, 3]} rotation={[0, 0, 0]} />
      <Bench position={[3, 0, 3]} rotation={[0, 0, 0]} />

      {/* Cinema ambient lights */}
      <pointLight position={[0, 4.5, -5]} intensity={3} color="#6666aa" distance={12} />
      <pointLight position={[-7, 1, 0]} intensity={2} color="#8888ff" distance={6} />
      <pointLight position={[7, 1, 0]} intensity={2} color="#8888ff" distance={6} />

      {/* Floor strip lights */}
      {[-halfW + 0.5, halfW - 0.5].map((x) =>
        Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`${x}-${i}`} position={[x, 0.02, -halfD + 2 + i * 2]}>
            <boxGeometry args={[0.1, 0.02, 0.8]} />
            <meshStandardMaterial
              color="#6666aa"
              emissive="#6666aa"
              emissiveIntensity={0.8}
            />
          </mesh>
        ))
      )}

      {/* Room label */}
      <Text
        position={[0, 4.5, -halfD + 0.5]}
        fontSize={0.2}
        color="#aaaaff"
        anchorX="center"
        font={undefined}
      >
        🎬 Memory Theatre
      </Text>

      {/* Direction sign */}
      <Text
        position={[0, 3.5, halfD - 0.3]}
        fontSize={0.1}
        color="#aaaaff"
        anchorX="center"
        rotation={[0, Math.PI, 0]}
        font={undefined}
      >
        → Memory Garden →
      </Text>
    </group>
  );
}
