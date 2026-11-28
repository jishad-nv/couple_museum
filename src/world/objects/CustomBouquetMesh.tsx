import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';
import {
  getFlowerOption,
  getRibbonColorOption,
  type BouquetDesign,
  type FlowerChoiceId,
} from '../../utils/bouquet';

const BLOOM_SLOTS: ReadonlyArray<{
  pos: [number, number, number];
  scale: number;
}> = [
  { pos: [0, 0.14, 0.01], scale: 1.05 },
  { pos: [-0.048, 0.125, 0.032], scale: 0.94 },
  { pos: [0.048, 0.125, 0.028], scale: 0.94 },
  { pos: [-0.036, 0.128, -0.028], scale: 0.88 },
  { pos: [0.036, 0.128, -0.028], scale: 0.88 },
  { pos: [0, 0.118, 0.056], scale: 0.86 },
  { pos: [0, 0.135, -0.048], scale: 0.84 },
];

function BloomClusterItem({
  flowerId,
  position,
  scale,
}: {
  flowerId: FlowerChoiceId;
  position: [number, number, number];
  scale: number;
}) {
  const opt = getFlowerOption(flowerId);

  if (flowerId === 'lavender') {
    return (
      <group position={position} scale={scale}>
        <mesh position={[0, 0.02, 0]}>
          <coneGeometry args={[0.016, 0.072, 7]} />
          <meshStandardMaterial color={opt.primaryHex} roughness={0.62} />
        </mesh>
        <mesh position={[0.012, 0.008, 0.008]} rotation={[0.15, 0, -0.22]}>
          <coneGeometry args={[0.012, 0.056, 7]} />
          <meshStandardMaterial color={opt.accentHex} roughness={0.62} />
        </mesh>
      </group>
    );
  }

  if (flowerId === 'sunflower') {
    return (
      <group position={position} scale={scale} rotation={[0.35, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.034, 0.034, 0.012, 12]} />
          <meshStandardMaterial color={opt.primaryHex} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.006, 0]}>
          <sphereGeometry args={[0.019, 10, 8]} />
          <meshStandardMaterial color={opt.accentHex} roughness={0.82} />
        </mesh>
      </group>
    );
  }

  if (flowerId === 'babys_breath') {
    return (
      <group position={position} scale={scale}>
        {[
          [0, 0.014, 0],
          [-0.016, 0.004, 0.01],
          [0.016, 0.006, -0.008],
          [0.005, 0.022, 0.012],
        ].map(([bx, by, bz], idx) => (
          <mesh key={idx} position={[bx, by, bz]}>
            <sphereGeometry args={[0.011, 7, 7]} />
            <meshStandardMaterial color={opt.primaryHex} roughness={0.48} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.032, 10, 8]} />
        <meshPhysicalMaterial
          color={opt.primaryHex}
          roughness={0.46}
          sheen={0.55}
          sheenColor={opt.accentHex}
        />
      </mesh>
      <mesh position={[0, 0.014, 0.008]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshStandardMaterial color={opt.accentHex} roughness={0.44} />
      </mesh>
    </group>
  );
}

export default function CustomBouquetMesh({
  design,
  scale = 1,
}: {
  design: BouquetDesign;
  scale?: number;
}) {
  const ribbonColor = getRibbonColorOption(design.ribbonColor);
  const flowers = design.flowers.length > 0 ? design.flowers : (['red_rose'] as FlowerChoiceId[]);

  const arrangedBlooms = useMemo(
    () =>
      BLOOM_SLOTS.map((slot, idx) => ({
        flowerId: flowers[idx % flowers.length],
        pos: slot.pos,
        scale: slot.scale,
      })),
    [flowers]
  );

  return (
    <group scale={scale}>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.026, 0.016, 0.16, 10]} />
        <meshStandardMaterial color="#466e4a" roughness={0.78} />
      </mesh>

      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.088, 0.024, 0.15, 14, 1, true]} />
        <meshPhysicalMaterial
          color="#f3ead8"
          roughness={0.68}
          sheen={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {[0, 1.25, 2.5, 3.8, 5.05].map((ang, idx) => (
        <mesh
          key={`leaf-${idx}`}
          position={[Math.sin(ang) * 0.068, 0.095, Math.cos(ang) * 0.068]}
          rotation={[0.52, ang, 0]}
          scale={[0.8, 0.35, 1.45]}
        >
          <sphereGeometry args={[0.024, 8, 6]} />
          <meshStandardMaterial color="#4d7a51" roughness={0.68} />
        </mesh>
      ))}

      {arrangedBlooms.map((b, idx) => (
        <BloomClusterItem
          key={`bloom-${idx}-${b.flowerId}`}
          flowerId={b.flowerId}
          position={b.pos}
          scale={b.scale}
        />
      ))}

      <mesh position={[0, -0.005, 0]}>
        <cylinderGeometry
          args={[
            design.ribbonStyle === 'velvet_wrap' ? 0.039 : 0.034,
            design.ribbonStyle === 'velvet_wrap' ? 0.034 : 0.031,
            design.ribbonStyle === 'velvet_wrap' ? 0.056 : 0.034,
            12,
          ]}
        />
        <meshPhysicalMaterial
          color={ribbonColor.hex}
          roughness={design.ribbonStyle === 'velvet_wrap' ? 0.72 : 0.36}
          sheen={0.75}
          sheenColor={ribbonColor.trimHex}
        />
      </mesh>

      {design.ribbonStyle === 'satin_bow' && (
        <group position={[0, -0.004, 0.036]}>
          <mesh position={[-0.022, 0.004, 0]} rotation={[0, 0, 0.36]}>
            <torusGeometry args={[0.015, 0.0055, 6, 12]} />
            <meshPhysicalMaterial color={ribbonColor.hex} roughness={0.34} sheen={0.8} />
          </mesh>
          <mesh position={[0.022, 0.004, 0]} rotation={[0, 0, -0.36]}>
            <torusGeometry args={[0.015, 0.0055, 6, 12]} />
            <meshPhysicalMaterial color={ribbonColor.hex} roughness={0.34} sheen={0.8} />
          </mesh>
          <mesh position={[-0.01, -0.03, 0.004]} rotation={[0.14, 0, -0.18]}>
            <boxGeometry args={[0.011, 0.048, 0.004]} />
            <meshStandardMaterial color={ribbonColor.hex} roughness={0.38} />
          </mesh>
          <mesh position={[0.01, -0.03, 0.004]} rotation={[0.14, 0, 0.18]}>
            <boxGeometry args={[0.011, 0.048, 0.004]} />
            <meshStandardMaterial color={ribbonColor.hex} roughness={0.38} />
          </mesh>
        </group>
      )}

      {design.ribbonStyle === 'gold_cord' && (
        <group>
          <mesh position={[0, 0.008, 0]} rotation={[Math.PI / 2, 0.15, 0]}>
            <torusGeometry args={[0.036, 0.0038, 6, 16]} />
            <meshStandardMaterial color={COLORS.goldLight} metalness={0.72} roughness={0.22} />
          </mesh>
          <mesh position={[0, -0.018, 0]} rotation={[Math.PI / 2, -0.15, 0]}>
            <torusGeometry args={[0.033, 0.0038, 6, 16]} />
            <meshStandardMaterial color={COLORS.goldLight} metalness={0.72} roughness={0.22} />
          </mesh>
        </group>
      )}
    </group>
  );
}
