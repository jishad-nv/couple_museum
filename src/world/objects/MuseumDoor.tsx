import * as THREE from 'three';
import { COLORS } from '../../utils/constants';

export type MuseumDoorVariant =
  | 'entrance'
  | 'theatre'
  | 'garden'
  | 'secret_alcove'
  | 'vault'
  | 'wedding';

interface VariantPalette {
  frameColor: string;
  leafColor: string;
  panelColor: string;
  trimColor: string;
  handleColor: string;
  glassColor: string;
  glassOpacity: number;
  glazed: boolean;
  roughness: number;
  metalness: number;
}

const DOOR_PALETTES: Record<MuseumDoorVariant, VariantPalette> = {
  entrance: {
    frameColor: '#2c1c16',
    leafColor: '#48281c',
    panelColor: '#351b12',
    trimColor: COLORS.gold,
    handleColor: COLORS.goldLight,
    glassColor: '#ffe7c2',
    glassOpacity: 0.42,
    glazed: true,
    roughness: 0.36,
    metalness: 0.1,
  },
  theatre: {
    frameColor: '#24141d',
    leafColor: '#6d172c',
    panelColor: '#4d0f20',
    trimColor: COLORS.gold,
    handleColor: COLORS.goldLight,
    glassColor: '#ffd4df',
    glassOpacity: 0.25,
    glazed: false,
    roughness: 0.48,
    metalness: 0.08,
  },
  garden: {
    frameColor: '#f2eee4',
    leafColor: '#36583c',
    panelColor: '#2a462f',
    trimColor: COLORS.gold,
    handleColor: COLORS.goldLight,
    glassColor: '#cdecd8',
    glassOpacity: 0.46,
    glazed: true,
    roughness: 0.42,
    metalness: 0.08,
  },
  secret_alcove: {
    frameColor: '#24121c',
    leafColor: '#391b28',
    panelColor: '#28111c',
    trimColor: '#d9ac62',
    handleColor: COLORS.goldLight,
    glassColor: '#d9ac62',
    glassOpacity: 0.2,
    glazed: false,
    roughness: 0.52,
    metalness: 0.14,
  },
  vault: {
    frameColor: '#311a26',
    leafColor: '#1b0f19',
    panelColor: '#2b1627',
    trimColor: COLORS.gold,
    handleColor: COLORS.goldLight,
    glassColor: '#ffe29c',
    glassOpacity: 0.2,
    glazed: false,
    roughness: 0.38,
    metalness: 0.28,
  },
  wedding: {
    frameColor: '#efe6d8',
    leafColor: '#faf4ea',
    panelColor: '#efe3d1',
    trimColor: '#d8b467',
    handleColor: COLORS.gold,
    glassColor: '#fff0f4',
    glassOpacity: 0.48,
    glazed: true,
    roughness: 0.34,
    metalness: 0.08,
  },
};

export function LuxuryDoorArchwayFrame({
  openingWidth,
  openingHeight,
  depth = 0.5,
  variant,
}: {
  openingWidth: number;
  openingHeight: number;
  depth?: number;
  variant: MuseumDoorVariant;
}) {
  const palette = DOOR_PALETTES[variant];
  const halfW = openingWidth / 2;
  const pilasterW = 0.22;
  const frameDepth = Math.max(depth, 0.5);

  return (
    <group>
      {/* Brass threshold strip flush with floor */}
      <mesh position={[0, 0.008, 0]} receiveShadow>
        <boxGeometry args={[openingWidth + 0.16, 0.016, frameDepth + 0.04]} />
        <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
      </mesh>

      {/* Left & Right fluted pilasters with plinth bases and capitals */}
      {[-1, 1].map((side) => {
        const px = side * (halfW + pilasterW * 0.5 + 0.015);
        return (
          <group key={`pilaster-${side}`} position={[px, 0, 0]}>
            <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
              <boxGeometry args={[pilasterW + 0.08, 0.26, frameDepth + 0.08]} />
              <meshStandardMaterial color={palette.frameColor} roughness={0.44} />
            </mesh>
            <mesh position={[0, openingHeight / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[pilasterW, openingHeight, frameDepth]} />
              <meshStandardMaterial color={palette.frameColor} roughness={0.42} />
            </mesh>
            {/* Inlaid gold vertical flute accent */}
            <mesh position={[0, openingHeight / 2, frameDepth / 2 + 0.008]}>
              <boxGeometry args={[0.032, openingHeight - 0.48, 0.014]} />
              <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.26} />
            </mesh>
            <mesh position={[0, openingHeight / 2, -(frameDepth / 2 + 0.008)]}>
              <boxGeometry args={[0.032, openingHeight - 0.48, 0.014]} />
              <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.26} />
            </mesh>
            {/* Capital */}
            <mesh position={[0, openingHeight - 0.06, 0]} castShadow>
              <boxGeometry args={[pilasterW + 0.09, 0.14, frameDepth + 0.09]} />
              <meshStandardMaterial color={palette.trimColor} metalness={0.45} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Stepped Architrave Lintel & Cornice */}
      <mesh position={[0, openingHeight + 0.09, 0]} castShadow>
        <boxGeometry args={[openingWidth + pilasterW * 2 + 0.18, 0.18, depth + 0.06]} />
        <meshStandardMaterial color={palette.frameColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, openingHeight + 0.21, 0]} castShadow>
        <boxGeometry args={[openingWidth + pilasterW * 2 + 0.3, 0.075, depth + 0.14]} />
        <meshStandardMaterial color={palette.trimColor} metalness={0.5} roughness={0.28} />
      </mesh>
    </group>
  );
}

export function LuxuryDoorLeaf({
  width,
  height,
  thickness = 0.12,
  variant,
  hingeSide,
  showCenterMedallion = false,
  medallionActive = false,
}: {
  width: number;
  height: number;
  thickness?: number;
  variant: MuseumDoorVariant;
  hingeSide: 'left' | 'right';
  showCenterMedallion?: boolean;
  medallionActive?: boolean;
}) {
  const palette = DOOR_PALETTES[variant];
  const dir = hingeSide === 'left' ? 1 : -1;
  const centerX = dir * (width / 2);
  const latchX = dir * (width - 0.18);
  const hingeX = dir * 0.012;

  const stileW = Math.min(0.18, width * 0.13);
  const innerW = Math.max(0.24, width - stileW * 2);
  const bottomRailH = 0.26;
  const midRailH = 0.16;
  const topRailH = 0.24;
  const lowerPanelY = bottomRailH + (height * 0.36 - bottomRailH) / 2;
  const lowerPanelH = Math.max(0.45, height * 0.36 - bottomRailH);
  const midRailY = bottomRailH + lowerPanelH + midRailH / 2;
  const upperWindowBottom = midRailY + midRailH / 2;
  const upperWindowTop = height - topRailH;
  const upperH = Math.max(0.5, upperWindowTop - upperWindowBottom);
  const upperCenterY = upperWindowBottom + upperH / 2;

  const trimZ = thickness / 2 + 0.012;
  const handleZ = thickness / 2 + 0.042;

  return (
    <group>
      {/* Vertical Outer Stiles */}
      <mesh position={[dir * (stileW / 2), height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[stileW - 0.01, height, thickness]} />
        <meshStandardMaterial
          color={palette.leafColor}
          roughness={palette.roughness}
          metalness={palette.metalness}
        />
      </mesh>
      <mesh position={[dir * (width - stileW / 2), height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[stileW - 0.01, height, thickness]} />
        <meshStandardMaterial
          color={palette.leafColor}
          roughness={palette.roughness}
          metalness={palette.metalness}
        />
      </mesh>

      {/* Bottom, Mid, and Top Horizontal Rails */}
      <mesh position={[centerX, bottomRailH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, bottomRailH, thickness]} />
        <meshStandardMaterial
          color={palette.leafColor}
          roughness={palette.roughness}
          metalness={palette.metalness}
        />
      </mesh>
      <mesh position={[centerX, midRailY, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, midRailH, thickness]} />
        <meshStandardMaterial
          color={palette.leafColor}
          roughness={palette.roughness}
          metalness={palette.metalness}
        />
      </mesh>
      <mesh position={[centerX, height - topRailH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, topRailH, thickness]} />
        <meshStandardMaterial
          color={palette.leafColor}
          roughness={palette.roughness}
          metalness={palette.metalness}
        />
      </mesh>

      {/* Lower Recessed Raised Molding Panel + Gold Inlay Border (Front & Back) */}
      <mesh position={[centerX, lowerPanelY, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, lowerPanelH, thickness * 0.56]} />
        <meshStandardMaterial color={palette.panelColor} roughness={palette.roughness + 0.08} />
      </mesh>
      {[-1, 1].map((face) => (
        <group key={`lp-trim-${face}`} position={[centerX, lowerPanelY, face * (thickness * 0.34)]}>
          <mesh>
            <boxGeometry args={[innerW - 0.14, lowerPanelH - 0.14, 0.024]} />
            <meshStandardMaterial color={palette.leafColor} roughness={palette.roughness} />
          </mesh>
          <mesh position={[0, (lowerPanelH - 0.14) / 2, face * 0.015]}>
            <boxGeometry args={[innerW - 0.12, 0.022, 0.012]} />
            <meshStandardMaterial color={palette.trimColor} metalness={0.58} roughness={0.26} />
          </mesh>
          <mesh position={[0, -(lowerPanelH - 0.14) / 2, face * 0.015]}>
            <boxGeometry args={[innerW - 0.12, 0.022, 0.012]} />
            <meshStandardMaterial color={palette.trimColor} metalness={0.58} roughness={0.26} />
          </mesh>
        </group>
      ))}

      {/* Upper Section: Beveled Glazed Window OR Solid Raised Coffered Panel */}
      {palette.glazed ? (
        <group position={[centerX, upperCenterY, 0]}>
          {/* Clear/Frosted Tempered Glass Sheet */}
          <mesh>
            <boxGeometry args={[innerW, upperH, 0.026]} />
            <meshPhysicalMaterial
              color={palette.glassColor}
              transparent
              opacity={palette.glassOpacity}
              roughness={0.12}
              metalness={0.05}
              clearcoat={0.85}
            />
          </mesh>
          {/* Decorative Brass Muntin Mullion Bars */}
          <mesh>
            <boxGeometry args={[0.028, upperH, 0.044]} />
            <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[0, upperH * 0.16, 0]}>
            <boxGeometry args={[innerW, 0.028, 0.044]} />
            <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[0, -upperH * 0.18, 0]}>
            <boxGeometry args={[innerW, 0.028, 0.044]} />
            <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
          </mesh>
        </group>
      ) : (
        <group position={[centerX, upperCenterY, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[innerW, upperH, thickness * 0.54]} />
            <meshStandardMaterial color={palette.panelColor} roughness={palette.roughness + 0.08} />
          </mesh>
          {[-1, 1].map((face) => (
            <group key={`up-trim-${face}`} position={[0, 0, face * trimZ]}>
              <mesh position={[0, upperH * 0.39, 0]}>
                <boxGeometry args={[innerW - 0.18, 0.024, 0.016]} />
                <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
              </mesh>
              <mesh position={[0, -upperH * 0.39, 0]}>
                <boxGeometry args={[innerW - 0.18, 0.024, 0.016]} />
                <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
              </mesh>
              <mesh position={[-(innerW - 0.18) / 2, 0, 0]}>
                <boxGeometry args={[0.024, upperH * 0.78, 0.016]} />
                <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
              </mesh>
              <mesh position={[(innerW - 0.18) / 2, 0, 0]}>
                <boxGeometry args={[0.024, upperH * 0.78, 0.016]} />
                <meshStandardMaterial color={palette.trimColor} metalness={0.55} roughness={0.28} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Optional Ornamental Center Medallion (for Secret Room & Vault Door) */}
      {showCenterMedallion &&
        [-1, 1].map((face) => (
          <group
            key={`med-${face}`}
            position={[centerX, height * 0.56, face * (thickness / 2 + 0.028)]}
          >
            <mesh rotation={face > 0 ? [0, 0, 0] : [0, Math.PI, 0]}>
              <ringGeometry args={[0.18, 0.24, 24]} />
              <meshStandardMaterial
                color={palette.trimColor}
                emissive={medallionActive ? '#ffd378' : '#583b18'}
                emissiveIntensity={medallionActive ? 0.85 : 0.22}
                metalness={0.6}
                roughness={0.24}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.024, 16]} />
              <meshStandardMaterial
                color={palette.handleColor}
                emissive={medallionActive ? '#ffca64' : '#3d2810'}
                emissiveIntensity={medallionActive ? 0.95 : 0.18}
                metalness={0.65}
                roughness={0.22}
              />
            </mesh>
          </group>
        ))}

      {/* Sculpted Brushed-Gold Hinge Barrels */}
      {[0.45, height * 0.5, height - 0.45].map((hy, idx) => (
        <mesh key={`hinge-${idx}`} position={[hingeX, hy, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.18, 10]} />
          <meshStandardMaterial color={palette.trimColor} metalness={0.7} roughness={0.25} />
        </mesh>
      ))}

      {/* Sculpted Backplate & Architectural Pull Handle on Both Faces */}
      {[-1, 1].map((face) => (
        <group key={`handle-${face}`} position={[latchX, 1.24, face * handleZ]}>
          <mesh position={[0, 0, -face * 0.018]}>
            <boxGeometry args={[0.068, 0.34, 0.016]} />
            <meshStandardMaterial color={palette.trimColor} metalness={0.65} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, face * 0.014]}>
            <cylinderGeometry args={[0.016, 0.016, 0.24, 10]} />
            <meshStandardMaterial color={palette.handleColor} metalness={0.72} roughness={0.22} />
          </mesh>
          {[-0.1, 0.1].map((py, i) => (
            <mesh key={i} position={[0, py, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.036, 8]} />
              <meshStandardMaterial color={palette.handleColor} metalness={0.72} roughness={0.22} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
