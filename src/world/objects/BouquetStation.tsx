import { Text } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import Character from '../../character/Character';
import CustomBouquetMesh from './CustomBouquetMesh';
import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';
import {
  BOUQUET_ATTENDANT_POS,
  BOUQUET_ATTENDANT_ROTATION,
  BOUQUET_STATION_POS,
  BOUQUET_STATION_ROTATION,
} from '../../utils/bouquet';

export default function BouquetStation() {
  const handleStationClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const s = useGameStore.getState();
    if (s.nearbyInteractable === 'bouquet-station') {
      s.openBouquetCreator();
    }
  };

  return (
    <group>
      {/* Elegant Floral Arranging Table between Memory Theatre & Garden Doors */}
      <group
        position={BOUQUET_STATION_POS}
        rotation={[0, BOUQUET_STATION_ROTATION, 0]}
        onClick={handleStationClick}
      >
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[1.02, 0.44, 0.46]} position={[0, 0.44, 0]} />

          {/* Dark Walnut Museum Console Legs */}
          {[
            [-0.86, 0.39, -0.34],
            [0.86, 0.39, -0.34],
            [-0.86, 0.39, 0.34],
            [0.86, 0.39, 0.34],
          ].map(([lx, ly, lz], idx) => (
            <group key={`leg-${idx}`} position={[lx, ly, lz]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.038, 0.028, 0.78, 10]} />
                <meshStandardMaterial color="#3c2219" roughness={0.44} />
              </mesh>
              <mesh position={[0, -0.35, 0]}>
                <cylinderGeometry args={[0.032, 0.034, 0.07, 10]} />
                <meshStandardMaterial color={COLORS.gold} metalness={0.62} roughness={0.28} />
              </mesh>
            </group>
          ))}

          {/* Walnut Apron & Brass Trim */}
          <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.88, 0.14, 0.78]} />
            <meshStandardMaterial color="#46281d" roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.655, 0]}>
            <boxGeometry args={[1.91, 0.02, 0.81]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.55} roughness={0.3} />
          </mesh>

          {/* Cream Marble Countertop */}
          <mesh position={[0, 0.815, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.02, 0.055, 0.88]} />
            <meshPhysicalMaterial
              color="#f6f0e4"
              roughness={0.28}
              clearcoat={0.25}
              clearcoatRoughness={0.35}
            />
          </mesh>

          {/* Engraved Brass Front Plaque */}
          <mesh position={[0, 0.72, 0.398]}>
            <boxGeometry args={[0.76, 0.085, 0.012]} />
            <meshStandardMaterial color="#2a161b" roughness={0.45} />
          </mesh>
          <Text
            position={[0, 0.72, 0.408]}
            fontSize={0.044}
            color={COLORS.goldLight}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            font={undefined}
          >
            FLOWER ATELIER
          </Text>
        </RigidBody>

        {/* Flower Vases & Display Buckets on Table */}
        {[
          { x: -0.68, z: -0.14, vaseColor: '#d9c5a0', blooms: ['#b81d38', '#e65872', '#fffdf7'] },
          { x: -0.34, z: -0.18, vaseColor: '#eee7da', blooms: ['#f1a0b6', '#ffd7e2', '#faf5ea'] },
          { x: 0.04, z: -0.18, vaseColor: '#c9a66b', blooms: ['#8d6cc6', '#ebb028', '#fffdf7'] },
        ].map((vase, vIdx) => (
          <group key={`vase-${vIdx}`} position={[vase.x, 0.842, vase.z]}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.085, 0.068, 0.24, 14]} />
              <meshPhysicalMaterial
                color={vase.vaseColor}
                roughness={0.32}
                metalness={vIdx === 2 ? 0.38 : 0.06}
              />
            </mesh>
            <mesh position={[0, 0.26, 0]}>
              <cylinderGeometry args={[0.072, 0.045, 0.08, 10]} />
              <meshStandardMaterial color="#49744d" roughness={0.78} />
            </mesh>
            {vase.blooms.map((col, bIdx) => (
              <mesh
                key={`vb-${bIdx}`}
                position={[
                  (bIdx - 1) * 0.045,
                  0.31 + (bIdx === 1 ? 0.035 : 0),
                  bIdx === 1 ? -0.02 : 0.025,
                ]}
              >
                <sphereGeometry args={[0.042, 10, 8]} />
                <meshPhysicalMaterial color={col} roughness={0.48} sheen={0.45} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Ribbon Spool Stand (right-back of table) */}
        <group position={[0.42, 0.842, -0.15]}>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.09, 0.095, 0.024, 14]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.25, 10]} />
            <meshStandardMaterial color={COLORS.goldLight} metalness={0.62} roughness={0.25} />
          </mesh>
          {[
            { y: 0.075, col: '#9e1f3a' },
            { y: 0.13, col: '#d4af63' },
            { y: 0.185, col: '#d88296' },
          ].map((spool, idx) => (
            <mesh key={`spool-${idx}`} position={[0, spool.y, 0]}>
              <cylinderGeometry args={[0.046, 0.046, 0.042, 14]} />
              <meshPhysicalMaterial color={spool.col} roughness={0.38} sheen={0.75} />
            </mesh>
          ))}
        </group>

        {/* Letter-Writing Parchment Sheets, Inkwell & Quill (front-center/right) */}
        <group position={[0.26, 0.844, 0.17]}>
          <mesh position={[0, 0.004, 0]} rotation={[0, -0.08, 0]}>
            <boxGeometry args={[0.28, 0.008, 0.2]} />
            <meshStandardMaterial color="#fbf6ea" roughness={0.82} />
          </mesh>
          <mesh position={[0.012, 0.009, 0.006]} rotation={[0, 0.06, 0]}>
            <boxGeometry args={[0.26, 0.006, 0.185]} />
            <meshStandardMaterial color="#fffaf0" roughness={0.85} />
          </mesh>
          {/* Brass Inkwell + Cream Feather Quill */}
          <mesh position={[0.18, 0.024, -0.05]}>
            <cylinderGeometry args={[0.024, 0.028, 0.042, 10]} />
            <meshStandardMaterial color="#2c1f24" roughness={0.34} metalness={0.3} />
          </mesh>
          <mesh position={[0.195, 0.085, -0.045]} rotation={[0.25, 0.1, -0.35]}>
            <coneGeometry args={[0.012, 0.14, 6]} />
            <meshStandardMaterial color="#f6eedc" roughness={0.55} />
          </mesh>
        </group>

        {/* Warm Brass Table Lamp (no dynamic pointLight to prevent shader recompile lag) */}
        <group position={[0.78, 0.842, -0.14]}>
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.075, 0.085, 0.03, 14]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.6} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.016, 0.02, 0.29, 10]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.6} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.085, 0.145, 0.15, 16]} />
            <meshStandardMaterial
              color="#fff4db"
              emissive="#ffd694"
              emissiveIntensity={1.1}
              roughness={0.42}
            />
          </mesh>
        </group>

        {/* Sample Kraft-Wrapped Ribbon Bouquet Resting Gently on Countertop */}
        <group position={[-0.24, 0.872, 0.16]} rotation={[1.38, 0.42, -0.22]}>
          <CustomBouquetMesh
            design={{
              flowers: ['red_rose', 'blush_peony', 'babys_breath'],
              ribbonStyle: 'satin_bow',
              ribbonColor: 'crimson',
              message: '',
              createdBy: 'girl',
              createdAt: 0,
            }}
            scale={0.95}
          />
        </group>
      </group>

      {/* One Friendly Floral Attendant Character Standing Beside the Table */}
      <group
        position={BOUQUET_ATTENDANT_POS}
        rotation={[0, BOUQUET_ATTENDANT_ROTATION, 0]}
        onClick={handleStationClick}
      >
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.26, 0.82, 0.26]} position={[0, 0.82, 0]} />
        </RigidBody>
        <Character isMale={false} color="#6b3048" action="idle" />
      </group>
    </group>
  );
}
