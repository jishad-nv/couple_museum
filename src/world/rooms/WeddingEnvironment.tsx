import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';
import { useGameStore } from '../../store/gameStore';
import Butterflies from '../objects/Butterflies';
import { WEDDING_BUTTERFLIES } from '../../utils/butterflies';
import {
  WEDDING_CANOPY_TREES,
  WEDDING_CYPRESS_TREES,
  WEDDING_GARDEN_SHRUBS,
  WEDDING_LAWN_BASE_Y,
  WEDDING_NORTH_PATH_STONES,
  groundHeightAt,
  isWeddingAtmosphereActive,
} from '../../utils/weddingEnvironment';

const TERRAIN_CENTER_X = -32;
const TERRAIN_CENTER_Z = -56;
const TERRAIN_SIZE = 340;
const TERRAIN_SEGMENTS = 56;

function hash01(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function createMorningMeadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#7ea359';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle organic meadow mottling
    for (let i = 0; i < 180; i++) {
      const x = hash01(i * 1.13) * 512;
      const y = hash01(i * 2.41 + 9) * 512;
      const r = 18 + hash01(i * 3.77) * 42;
      ctx.fillStyle =
        i % 3 === 0
          ? 'rgba(104, 143, 66, 0.20)'
          : i % 3 === 1
          ? 'rgba(154, 186, 98, 0.16)'
          : 'rgba(84, 122, 54, 0.14)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine directional grass blades
    for (let i = 0; i < 2400; i++) {
      const x = hash01(i * 4.17 + 3) * 510;
      const y = hash01(i * 7.31 + 11) * 506;
      const len = 4 + hash01(i * 5.91) * 7;
      ctx.fillStyle =
        i % 4 === 0
          ? 'rgba(74, 110, 44, 0.34)'
          : i % 4 === 1
          ? 'rgba(162, 194, 102, 0.28)'
          : i % 4 === 2
          ? 'rgba(116, 152, 74, 0.25)'
          : 'rgba(210, 218, 134, 0.14)';
      ctx.fillRect(x, y, 2, len);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(44, 44);
  tex.anisotropy = 8;
  return tex;
}

function createSandstoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e7dcc9';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 420; i++) {
      const x = hash01(i * 3.1 + 2) * 252;
      const y = hash01(i * 6.7 + 5) * 252;
      const sz = 2 + hash01(i * 8.3) * 5;
      ctx.fillStyle =
        i % 2 === 0 ? 'rgba(196, 180, 156, 0.25)' : 'rgba(255, 250, 240, 0.24)';
      ctx.fillRect(x, y, sz, sz);
    }
    ctx.strokeStyle = 'rgba(168, 152, 128, 0.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 126);
    ctx.strokeRect(128, 1, 127, 126);
    ctx.strokeRect(1, 128, 126, 127);
    ctx.strokeRect(128, 128, 127, 127);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = 4;
  return tex;
}

export default function WeddingEnvironment() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const scriptedWalkTarget = useGameStore((s) => s.scriptedWalk?.target ?? null);
  const showFullCountryside = isWeddingAtmosphereActive(currentRoom, scriptedWalkTarget);

  const meadowTexture = useMemo(() => createMorningMeadowTexture(), []);
  const stoneTexture = useMemo(() => createSandstoneTexture(), []);

  useEffect(() => {
    return () => {
      meadowTexture.dispose();
      stoneTexture.dispose();
    };
  }, [meadowTexture, stoneTexture]);

  // Continuous countryside mesh displaced by groundHeightAt(worldX, worldZ)
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const lawnColor = new THREE.Color('#ffffff');
    const midHillColor = new THREE.Color('#e3ecd4');
    const distantRidgeColor = new THREE.Color('#cddfc9');
    const temp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localZ = pos.getZ(i);
      const worldX = localX + TERRAIN_CENTER_X;
      const worldZ = localZ + TERRAIN_CENTER_Z;
      const h = groundHeightAt(worldX, worldZ);
      pos.setY(i, h);

      const rise = Math.max(0, h - WEDDING_LAWN_BASE_Y);
      if (rise < 3.5) {
        temp.copy(lawnColor).lerp(midHillColor, rise / 3.5);
      } else {
        temp.copy(midHillColor).lerp(distantRidgeColor, Math.min(1, (rise - 3.5) / 14.0));
      }
      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  }, []);

  useEffect(() => {
    return () => terrainGeometry.dispose();
  }, [terrainGeometry]);

  // Instanced composite Cypress Spires (4 parts: trunk + lower spire + upper spire + top crown)
  const cypressTrunkRef = useRef<THREE.InstancedMesh>(null);
  const cypressLowerRef = useRef<THREE.InstancedMesh>(null);
  const cypressUpperRef = useRef<THREE.InstancedMesh>(null);
  const cypressTopRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const meshes = [
      cypressTrunkRef.current,
      cypressLowerRef.current,
      cypressUpperRef.current,
      cypressTopRef.current,
    ];
    if (meshes.some((m) => !m)) return;

    WEDDING_CYPRESS_TREES.forEach((tree, i) => {
      const baseY = groundHeightAt(tree.x, tree.z);
      const s = tree.scale;

      // 1. Trunk
      dummy.position.set(tree.x, baseY + 0.55 * s, tree.z);
      dummy.rotation.set(0, i * 0.8, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      cypressTrunkRef.current!.setMatrixAt(i, dummy.matrix);

      // 2. Lower cypress spire
      dummy.position.set(tree.x, baseY + 2.35 * s, tree.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      cypressLowerRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(tree.tint);
      cypressLowerRef.current!.setColorAt(i, tint);

      // 3. Upper tapered spire
      dummy.position.set(tree.x, baseY + 4.15 * s, tree.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      cypressUpperRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(tree.tint).offsetHSL(0.008, 0.02, 0.04);
      cypressUpperRef.current!.setColorAt(i, tint);

      // 4. Tapered cypress spire tip
      dummy.position.set(tree.x, baseY + 5.15 * s, tree.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      cypressTopRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(tree.tint).offsetHSL(0.012, 0.03, 0.06);
      cypressTopRef.current!.setColorAt(i, tint);
    });

    meshes.forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [showFullCountryside]);

  // Instanced composite Broadleaf & Blossom Trees (5 parts: trunk + branch A + branch B + 3 foliage/blossom clusters)
  const canopyTrunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyBranchARef = useRef<THREE.InstancedMesh>(null);
  const canopyBranchBRef = useRef<THREE.InstancedMesh>(null);
  const canopyMainRef = useRef<THREE.InstancedMesh>(null);
  const canopyTopRef = useRef<THREE.InstancedMesh>(null);
  const canopySideRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const meshes = [
      canopyTrunkRef.current,
      canopyBranchARef.current,
      canopyBranchBRef.current,
      canopyMainRef.current,
      canopyTopRef.current,
      canopySideRef.current,
    ];
    if (meshes.some((m) => !m)) return;

    WEDDING_CANOPY_TREES.forEach((tree, i) => {
      const baseY = groundHeightAt(tree.x, tree.z);
      const s = tree.scale;
      const cos = Math.cos(tree.rotY);
      const sin = Math.sin(tree.rotY);

      // 1. Grounded tapered trunk
      dummy.position.set(tree.x, baseY + 1.4 * s, tree.z);
      dummy.rotation.set(0, tree.rotY, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      canopyTrunkRef.current!.setMatrixAt(i, dummy.matrix);

      // 2. Left structural bough
      dummy.position.set(tree.x + cos * 0.55 * s, baseY + 2.5 * s, tree.z - sin * 0.55 * s);
      dummy.rotation.set(0, tree.rotY, -0.68);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      canopyBranchARef.current!.setMatrixAt(i, dummy.matrix);

      // 3. Right structural bough
      dummy.position.set(tree.x - cos * 0.52 * s, baseY + 2.65 * s, tree.z + sin * 0.52 * s);
      dummy.rotation.set(0, tree.rotY, 0.72);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      canopyBranchBRef.current!.setMatrixAt(i, dummy.matrix);

      // 4. Primary organic foliage crown
      dummy.position.set(tree.x, baseY + 3.55 * s, tree.z);
      dummy.rotation.set(0, tree.rotY, 0);
      dummy.scale.set(1.08 * s, 0.88 * s, 1.05 * s);
      dummy.updateMatrix();
      canopyMainRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(tree.tint);
      canopyMainRef.current!.setColorAt(i, tint);

      // 5. Upper sunlit crown tier
      dummy.position.set(tree.x + cos * 0.25 * s, baseY + 4.35 * s, tree.z - sin * 0.25 * s);
      dummy.scale.set(0.84 * s, 0.76 * s, 0.84 * s);
      dummy.updateMatrix();
      canopyTopRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(tree.tint).offsetHSL(0, 0.02, 0.05);
      canopyTopRef.current!.setColorAt(i, tint);

      // 6. Asymmetric lateral foliage cluster
      dummy.position.set(tree.x - cos * 0.78 * s, baseY + 3.35 * s, tree.z + sin * 0.78 * s);
      dummy.scale.set(0.78 * s, 0.72 * s, 0.78 * s);
      dummy.updateMatrix();
      canopySideRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(tree.tint).offsetHSL(-0.01, 0, -0.04);
      canopySideRef.current!.setColorAt(i, tint);
    });

    meshes.forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [showFullCountryside]);

  // Instanced Manicured Garden Shrubs + Flowering Rose Tops
  const shrubBaseRef = useRef<THREE.InstancedMesh>(null);
  const shrubUpperRef = useRef<THREE.InstancedMesh>(null);
  const shrubBloomRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const meshes = [shrubBaseRef.current, shrubUpperRef.current, shrubBloomRef.current];
    if (meshes.some((m) => !m)) return;

    WEDDING_GARDEN_SHRUBS.forEach((sh, i) => {
      const baseY = groundHeightAt(sh.x, sh.z);
      const s = sh.scale;

      dummy.position.set(sh.x, baseY + 0.42 * s, sh.z);
      dummy.rotation.set(0, sh.rotY, 0);
      dummy.scale.set(1.18 * s, 0.82 * s, 0.96 * s);
      dummy.updateMatrix();
      shrubBaseRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(i % 2 === 0 ? '#3b6d34' : '#467a3c');
      shrubBaseRef.current!.setColorAt(i, tint);

      dummy.position.set(sh.x + Math.cos(sh.rotY) * 0.25 * s, baseY + 0.56 * s, sh.z);
      dummy.scale.set(0.84 * s, 0.72 * s, 0.84 * s);
      dummy.updateMatrix();
      shrubUpperRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set('#538947');
      shrubUpperRef.current!.setColorAt(i, tint);

      dummy.position.set(sh.x, baseY + 0.74 * s, sh.z);
      dummy.scale.set(sh.hasBlossoms ? 0.32 * s : 0.001, sh.hasBlossoms ? 0.24 * s : 0.001, sh.hasBlossoms ? 0.32 * s : 0.001);
      dummy.updateMatrix();
      shrubBloomRef.current!.setMatrixAt(i, dummy.matrix);
      tint.set(i % 3 === 0 ? '#f6b8c9' : '#fff5f7');
      shrubBloomRef.current!.setColorAt(i, tint);
    });

    meshes.forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, []);

  return (
    <group name="WeddingDestinationEnvironment">
      {/* ─── LAYER A: Always-grounded Stone Terrace Plinth & Courtyard Garden Borders ─── */}
      {/* Solid stepped travertine foundation connecting terrace slab (y = -0.2..0) onto estate lawn (y = -0.22) */}
      <mesh position={[-26.5, -0.145, -51.0]} receiveShadow>
        <boxGeometry args={[29.2, 0.27, 34.2]} />
        <meshStandardMaterial map={stoneTexture} color="#e5dac7" roughness={0.62} />
      </mesh>
      <mesh position={[-16.2, -0.145, -35.8]} receiveShadow>
        <boxGeometry args={[12.4, 0.27, 8.4]} />
        <meshStandardMaterial map={stoneTexture} color="#e5dac7" roughness={0.62} />
      </mesh>

      {/* North Terrace Garden Steps descending from behind the arch onto the meadow path */}
      {[0, 1, 2].map((step) => (
        <mesh
          key={`n-step-${step}`}
          position={[-26.5, -0.05 - step * 0.06, -68.25 - step * 0.48]}
          receiveShadow
        >
          <boxGeometry args={[4.8 + step * 0.5, 0.12, 0.52]} />
          <meshStandardMaterial map={stoneTexture} color="#eae0cf" roughness={0.55} />
        </mesh>
      ))}

      {/* Immediate Courtyard Garden Ground Apron (always visible cleanly through breezeway & windows) */}
      <mesh
        position={[-28.5, WEDDING_LAWN_BASE_Y - 0.004, -55.0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[46, 54]} />
        <meshStandardMaterial
          map={meadowTexture}
          color="#e5efd9"
          roughness={0.92}
          metalness={0}
        />
      </mesh>

      {/* Sandstone Flagstone Promenade extending North behind the Ceremony Arch */}
      {WEDDING_NORTH_PATH_STONES.map((st, idx) => (
        <mesh
          key={`w-path-${idx}`}
          position={[st.x, WEDDING_LAWN_BASE_Y + 0.018, st.z]}
          rotation={[0, st.rotY, 0]}
          receiveShadow
        >
          <cylinderGeometry args={[st.rx, st.rx * 1.04, 0.036, 12]} />
          <meshStandardMaterial map={stoneTexture} color="#efe4d2" roughness={0.78} />
        </mesh>
      ))}

      {/* Limestone Villa Garden Arcade Backdrop flanking South & East outside other wings (no interior overlap!) */}
      {/* South Villa Courtyard Garden Wall (at z = -31.5, safely north of SecretRoom z=-29.0 & PrivateChamber z=-30.5) */}
      <group position={[-31.2, 0, -31.5]}>
        <mesh position={[0, 2.5, 0]} receiveShadow castShadow>
          <boxGeometry args={[20.5, 5.2, 0.45]} />
          <meshStandardMaterial map={stoneTexture} color="#efe6d8" roughness={0.62} />
        </mesh>
        <mesh position={[0, 5.15, 0]}>
          <boxGeometry args={[20.9, 0.24, 0.62]} />
          <meshStandardMaterial color="#dfd3c0" roughness={0.52} />
        </mesh>
        {[-8.0, -4.0, 0, 4.0, 8.0].map((px, i) => (
          <group key={`sv-pilaster-${i}`} position={[px, 0, -0.25]}>
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[0.52, 5.1, 0.28]} />
              <meshStandardMaterial color="#e8decb" roughness={0.55} />
            </mesh>
            {/* Climbing garden greenery & blush roses along villa wall */}
            <mesh position={[0, 1.35 + (i % 2) * 0.45, -0.18]} castShadow>
              <sphereGeometry args={[0.45, 8, 6]} />
              <meshStandardMaterial color="#3b6e34" roughness={0.86} />
            </mesh>
            <mesh position={[0.15, 1.65 + (i % 2) * 0.4, -0.24]}>
              <sphereGeometry args={[0.16, 7, 6]} />
              <meshStandardMaterial color="#f6b9ca" roughness={0.62} />
            </mesh>
          </group>
        ))}
      </group>

      {/* East Villa Garden Trellis Wall (at x = -8.75, safely west of MemoryTheatre x=-8.0) */}
      <group position={[-8.75, 0, -47.2]}>
        <mesh position={[0, 2.5, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.45, 5.2, 19.6]} />
          <meshStandardMaterial map={stoneTexture} color="#efe6d8" roughness={0.62} />
        </mesh>
        <mesh position={[0, 5.15, 0]}>
          <boxGeometry args={[0.62, 0.24, 20.0]} />
          <meshStandardMaterial color="#dfd3c0" roughness={0.52} />
        </mesh>
        {[-7.5, -3.75, 0, 3.75, 7.5].map((pz, i) => (
          <group key={`ev-pilaster-${i}`} position={[-0.25, 0, pz]}>
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[0.28, 5.1, 0.52]} />
              <meshStandardMaterial color="#e8decb" roughness={0.55} />
            </mesh>
            <mesh position={[-0.18, 1.45 + (i % 2) * 0.5, 0]} castShadow>
              <sphereGeometry args={[0.44, 8, 6]} />
              <meshStandardMaterial color="#3d7036" roughness={0.86} />
            </mesh>
            <mesh position={[-0.24, 1.75 + (i % 2) * 0.4, 0.14]}>
              <sphereGeometry args={[0.15, 7, 6]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#f6b9ca' : '#fff5f7'} roughness={0.62} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Instanced Manicured Garden Shrubs & Roses */}
      <instancedMesh
        ref={shrubBaseRef}
        args={[undefined, undefined, WEDDING_GARDEN_SHRUBS.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </instancedMesh>
      <instancedMesh
        ref={shrubUpperRef}
        args={[undefined, undefined, WEDDING_GARDEN_SHRUBS.length]}
        castShadow
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.46, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.86} />
      </instancedMesh>
      <instancedMesh
        ref={shrubBloomRef}
        args={[undefined, undefined, WEDDING_GARDEN_SHRUBS.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.5, 7, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.62} />
      </instancedMesh>

      {/* ─── LAYER B: Expansive Destination-Wedding Countryside, Rolling Hills & Tree Groves ─── */}
      {showFullCountryside && (
        <group name="WeddingCountrysideExpanse">
          {/* Continuous 340m x 340m Sculpted Meadow & Distant Rolling Hills */}
          <mesh
            geometry={terrainGeometry}
            position={[TERRAIN_CENTER_X, 0, TERRAIN_CENTER_Z]}
            receiveShadow
          >
            <meshStandardMaterial
              map={meadowTexture}
              vertexColors
              roughness={0.92}
              metalness={0}
            />
          </mesh>

          {/* Soft Distant Mountain / Horizon Ridge Ring Framing the Far Estate Mist */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
            const ang = (idx * Math.PI * 2) / 8 + 0.22;
            const dist = 128;
            const hx = TERRAIN_CENTER_X + Math.cos(ang) * dist;
            const hz = TERRAIN_CENTER_Z + Math.sin(ang) * dist;
            const peakH = 22 + (idx % 3) * 7;
            return (
              <mesh
                key={`hill-crest-${idx}`}
                position={[hx, peakH * 0.34 - 1.5, hz]}
                rotation={[0, -ang + Math.PI / 2, 0]}
                scale={[2.6, 1.0, 0.9]}
              >
                <coneGeometry args={[28 + (idx % 2) * 8, peakH, 10]} />
                <meshStandardMaterial color="#759472" roughness={0.95} metalness={0} />
              </mesh>
            );
          })}

          {/* Composite Instanced Mediterranean Cypress Spires */}
          <instancedMesh
            ref={cypressTrunkRef}
            args={[undefined, undefined, WEDDING_CYPRESS_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.12, 0.18, 1.1, 8]} />
            <meshStandardMaterial color="#573d27" roughness={0.92} />
          </instancedMesh>
          <instancedMesh
            ref={cypressLowerRef}
            args={[undefined, undefined, WEDDING_CYPRESS_TREES.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          >
            <coneGeometry args={[0.78, 3.2, 9]} />
            <meshStandardMaterial color="#ffffff" roughness={0.88} />
          </instancedMesh>
          <instancedMesh
            ref={cypressUpperRef}
            args={[undefined, undefined, WEDDING_CYPRESS_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <coneGeometry args={[0.56, 2.6, 9]} />
            <meshStandardMaterial color="#ffffff" roughness={0.86} />
          </instancedMesh>
          <instancedMesh
            ref={cypressTopRef}
            args={[undefined, undefined, WEDDING_CYPRESS_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <coneGeometry args={[0.31, 1.75, 9]} />
            <meshStandardMaterial color="#ffffff" roughness={0.85} />
          </instancedMesh>

          {/* Composite Instanced Broadleaf & Blossom Estate Trees */}
          <instancedMesh
            ref={canopyTrunkRef}
            args={[undefined, undefined, WEDDING_CANOPY_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.14, 0.26, 2.8, 8]} />
            <meshStandardMaterial color="#583c24" roughness={0.92} />
          </instancedMesh>
          <instancedMesh
            ref={canopyBranchARef}
            args={[undefined, undefined, WEDDING_CANOPY_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.06, 0.1, 1.45, 7]} />
            <meshStandardMaterial color="#583c24" roughness={0.92} />
          </instancedMesh>
          <instancedMesh
            ref={canopyBranchBRef}
            args={[undefined, undefined, WEDDING_CANOPY_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.06, 0.1, 1.4, 7]} />
            <meshStandardMaterial color="#583c24" roughness={0.92} />
          </instancedMesh>
          <instancedMesh
            ref={canopyMainRef}
            args={[undefined, undefined, WEDDING_CANOPY_TREES.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          >
            <dodecahedronGeometry args={[1.38, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.84} />
          </instancedMesh>
          <instancedMesh
            ref={canopyTopRef}
            args={[undefined, undefined, WEDDING_CANOPY_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <dodecahedronGeometry args={[1.05, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.82} />
          </instancedMesh>
          <instancedMesh
            ref={canopySideRef}
            args={[undefined, undefined, WEDDING_CANOPY_TREES.length]}
            castShadow
            frustumCulled={false}
          >
            <dodecahedronGeometry args={[0.98, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.86} />
          </instancedMesh>

          {/* Distant Charming Villa Garden Gazebo Accent Beyond North Promenade */}
          <group position={[-26.5, WEDDING_LAWN_BASE_Y, -90.0]}>
            <mesh position={[0, 0.14, 0]} receiveShadow>
              <cylinderGeometry args={[2.8, 3.0, 0.28, 16]} />
              <meshStandardMaterial color="#ede2d1" roughness={0.55} />
            </mesh>
            {[0, 1, 2, 3].map((p) => {
              const ang = (p * Math.PI) / 2 + Math.PI / 4;
              return (
                <mesh
                  key={`gz-col-${p}`}
                  position={[Math.cos(ang) * 2.1, 1.85, Math.sin(ang) * 2.1]}
                  castShadow
                >
                  <cylinderGeometry args={[0.14, 0.16, 3.4, 10]} />
                  <meshStandardMaterial color="#f5ede1" roughness={0.42} />
                </mesh>
              );
            })}
            <mesh position={[0, 4.1, 0]} castShadow>
              <coneGeometry args={[2.95, 1.45, 16]} />
              <meshStandardMaterial color="#f8f2e8" roughness={0.48} />
            </mesh>
            <mesh position={[0, 4.9, 0]}>
              <sphereGeometry args={[0.16, 10, 8]} />
              <meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.35} />
            </mesh>
          </group>
          {/* Sunlit Low-Poly Garden Butterflies */}
          <Butterflies specs={WEDDING_BUTTERFLIES} sunlit />
        </group>
      )}
    </group>
  );
}
