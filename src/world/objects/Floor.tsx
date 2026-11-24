import { useEffect, useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';

interface FloorProps {
  position: [number, number, number];
  size: [number, number];
  isGarden?: boolean;
  color?: string;
}

function createTileTexture(baseColor: string, lineColor: string, isGarden: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    if (isGarden) {
      // Natural organic night meadow texture with soft moss, clover & blade variation
      for (let i = 0; i < 650; i++) {
        const hx = Math.abs(Math.sin(i * 12.9898 + 1.23) * 43758.5453) % 1;
        const hy = Math.abs(Math.sin(i * 78.233 + 4.56) * 29431.1357) % 1;
        const x = Math.floor(hx * 252);
        const y = Math.floor(hy * 248);
        ctx.fillStyle =
          i % 4 === 0
            ? 'rgba(18, 42, 18, 0.34)'
            : i % 4 === 1
            ? 'rgba(72, 122, 54, 0.22)'
            : i % 4 === 2
            ? 'rgba(34, 68, 30, 0.26)'
            : 'rgba(94, 138, 68, 0.14)';
        ctx.fillRect(x, y, i % 5 === 0 ? 4 : 2, 5 + (i % 4));
      }
    } else {
      // Crisp marble tile grid with soft veining
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 128, 128);
      ctx.strokeRect(128, 0, 128, 128);
      ctx.strokeRect(0, 128, 128, 128);
      ctx.strokeRect(128, 128, 128, 128);

      ctx.strokeStyle = 'rgba(180, 165, 145, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, 22);
      ctx.quadraticCurveTo(96, 85, 220, 142);
      ctx.moveTo(45, 195);
      ctx.quadraticCurveTo(130, 175, 238, 232);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export default function Floor({
  position,
  size,
  isGarden = false,
  color,
}: FloorProps) {
  const baseColor = color || (isGarden ? COLORS.gardenGrass : COLORS.floorMarble);
  const [sizeW, sizeD] = size;

  const texture = useMemo(() => {
    const tex = createTileTexture(baseColor, 'rgba(170, 155, 136, 0.35)', isGarden);
    tex.repeat.set(Math.max(1, sizeW / 3), Math.max(1, sizeD / 3));
    return tex;
  }, [baseColor, isGarden, sizeW, sizeD]);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={[position[0], position[1] - 0.1, position[2]]}>
      <mesh receiveShadow>
        <boxGeometry args={[size[0], 0.2, size[1]]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          roughness={isGarden ? 0.92 : 0.34}
          metalness={isGarden ? 0 : 0.08}
        />
      </mesh>
    </RigidBody>
  );
}
