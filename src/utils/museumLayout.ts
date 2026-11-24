import * as THREE from 'three';

export type MuseumRoom = 'exterior' | 'entrance' | 'gallery' | 'cinema' | 'garden';

export const GALLERY_CENTER: [number, number, number] = [0, 0, -21.5];
export const GALLERY_OUTER_RADIUS = 17;
export const GALLERY_INNER_RADIUS = 2.6;
export const DANCE_SPOT_POS: [number, number, number] = [0, 0, -13.5];
export const DANCE_PARTNER_SPACING = 0.72;

export const MAIN_DOOR_POS: [number, number, number] = [0, 0, 4.0];
export const THEATRE_DOOR_POS: [number, number, number] = [0, 0, -38.5];
export const GARDEN_DOOR_POS: [number, number, number] = [12.0, 0, -33.5];

export const ENTRANCE_ARRIVAL_POS: [number, number, number] = [0, 0, 0.8];
export const THEATRE_ARRIVAL_POS: [number, number, number] = [0, 0, -41.5];
export const GARDEN_ARRIVAL_POS: [number, number, number] = [15.5, 0, -34.8];

export const THEATRE_VIP_SEAT_POS: [number, number, number] = [0, 0, -47.5];
export const THEATRE_SIDE_SEATS: ReadonlyArray<{
  id: string;
  label: string;
  position: [number, number, number];
  rotation: number;
}> = [
  { id: 'cinema-left-front', label: 'Left Front Loveseat', position: [-3.8, 0, -47.5], rotation: Math.PI },
  { id: 'cinema-right-front', label: 'Right Front Loveseat', position: [3.8, 0, -47.5], rotation: Math.PI },
  { id: 'cinema-left-back', label: 'Left Row Loveseat', position: [-3.8, 0, -50.8], rotation: Math.PI },
  { id: 'cinema-right-back', label: 'Right Row Loveseat', position: [3.8, 0, -50.8], rotation: Math.PI },
];

export const WATERFALL_CENTER: [number, number, number] = [26.5, 0, -38.0];
export const WATERFALL_POND_RADIUS = 2.8;

export const GARDEN_BENCH_POSITIONS: ReadonlyArray<{
  id: string;
  label: string;
  position: [number, number, number];
  rotation: number;
}> = [
  { id: 'garden-bench-1', label: 'Waterfall View Bench', position: [20.2, 0, -32.2], rotation: 2.38 },
  { id: 'garden-bench-2', label: 'Blossom Grove Bench', position: [30.8, 0, -43.8], rotation: -0.78 },
];

export const CAMERA_BOUNDS = {
  minDistance: 2.4,
  maxDistance: 6.5,
  minPitch: -0.16,
  maxPitch: 0.72,
  minHeight: 0.65,
};

// Cushion top is y=0.465m, backrest front face is local z=-0.205m.
// Positioning hip center at local z=-0.03m rests torso gently against backrest while knees clear seat front (+0.27m).
export const BENCH_SEAT_LOCAL_Z = -0.03;
export const BENCH_CUSHION_TOP_Y = 0.465;

export function clampCameraDistance(distance: number): number {
  return Math.max(CAMERA_BOUNDS.minDistance, Math.min(CAMERA_BOUNDS.maxDistance, distance));
}

export function clampCameraPitch(pitch: number): number {
  return Math.max(CAMERA_BOUNDS.minPitch, Math.min(CAMERA_BOUNDS.maxPitch, pitch));
}

export function detectMuseumRoom(x: number, z: number): MuseumRoom {
  if (z > 4.0) {
    return 'exterior';
  }
  if (z >= -4.5 && Math.abs(x) <= 7.5) {
    return 'entrance';
  }
  if (z < -38.5 && Math.abs(x) <= 8.5) {
    return 'cinema';
  }
  if (x > 11.2 && z <= -22.0 && z >= -54.0) {
    return 'garden';
  }
  return 'gallery';
}

export function getCoupleSideBySidePositions(
  centerX: number,
  centerZ: number,
  facingAngle: number,
  halfSpacing: number = 0.39
): {
  player: [number, number, number];
  partner: [number, number, number];
} {
  // Character forward vector for rotation y = facingAngle is (sin(facingAngle), 0, cos(facingAngle)).
  // Character screen-right vector (90deg clockwise around Y from viewer behind) is (-cos(facingAngle), 0, sin(facingAngle)).
  const rightX = -Math.cos(facingAngle);
  const rightZ = Math.sin(facingAngle);

  return {
    player: [centerX - rightX * halfSpacing, 0, centerZ - rightZ * halfSpacing],
    partner: [centerX + rightX * halfSpacing, 0, centerZ + rightZ * halfSpacing],
  };
}

export function getDanceCouplePositions(
  centerX: number,
  centerZ: number,
  phaseAngle: number,
  spacing: number = DANCE_PARTNER_SPACING
): {
  player: [number, number, number];
  partner: [number, number, number];
  playerFacing: number;
  partnerFacing: number;
} {
  const half = spacing * 0.5;
  const glideX = Math.sin(phaseAngle * 0.5) * 0.24;
  const glideZ = Math.cos(phaseAngle * 0.5) * 0.16;
  const cx = centerX + glideX;
  const cz = centerZ + glideZ;

  const dx = Math.sin(phaseAngle) * half;
  const dz = Math.cos(phaseAngle) * half;

  const px = cx - dx;
  const pz = cz - dz;
  const partnerX = cx + dx;
  const partnerZ = cz + dz;

  return {
    player: [px, 0, pz],
    partner: [partnerX, 0, partnerZ],
    playerFacing: Math.atan2(partnerX - px, partnerZ - pz),
    partnerFacing: Math.atan2(px - partnerX, pz - partnerZ),
  };
}

export function computeSeatAlignment(
  benchPos: [number, number, number],
  benchRot: number,
  halfSpacing: number = 0.34
): {
  player: [number, number, number];
  partner: [number, number, number];
  exitPos: [number, number, number];
} {
  const fx = Math.sin(benchRot);
  const fz = Math.cos(benchRot);
  const rx = -Math.cos(benchRot);
  const rz = Math.sin(benchRot);

  const seatCenterX = benchPos[0] + fx * BENCH_SEAT_LOCAL_Z;
  const seatCenterZ = benchPos[2] + fz * BENCH_SEAT_LOCAL_Z;

  return {
    player: [seatCenterX - rx * halfSpacing, 0, seatCenterZ - rz * halfSpacing],
    partner: [seatCenterX + rx * halfSpacing, 0, seatCenterZ + rz * halfSpacing],
    exitPos: [benchPos[0] + fx * 0.85, 0.02, benchPos[2] + fz * 0.85],
  };
}

export interface InteractiveBenchEntry {
  id: string;
  label: string;
  position: [number, number, number];
  rotation: number;
}

export function findNearestBench(
  playerPos: { x: number; z: number },
  benches: Iterable<InteractiveBenchEntry>,
  maxDistance: number
): InteractiveBenchEntry | null {
  let best: InteractiveBenchEntry | null = null;
  let bestDist = maxDistance;
  for (const b of benches) {
    const d = Math.hypot(b.position[0] - playerPos.x, b.position[2] - playerPos.z);
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}

// Lightweight registry of architectural meshes for third-person camera raycasting
const cameraColliderMeshes = new Set<THREE.Object3D>();

export function registerCameraCollider(obj: THREE.Object3D | null): void {
  if (obj) cameraColliderMeshes.add(obj);
}

export function unregisterCameraCollider(obj: THREE.Object3D | null): void {
  if (obj) cameraColliderMeshes.delete(obj);
}

export function getCameraColliders(): THREE.Object3D[] {
  return Array.from(cameraColliderMeshes);
}
