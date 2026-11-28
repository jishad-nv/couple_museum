export interface ButterflySpec {
  anchor: readonly [number, number, number];
  radiusX: number;
  radiusZ: number;
  bobAmplitude: number;
  speed: number;
  flapSpeed: number;
  phase: number;
  scale: number;
  color: string;
}

export interface ButterflyPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  wingFlap: number;
}

/**
 * Computes smooth organic figure-8 meandering flight position, heading yaw, pitch,
 * and asymmetric wing flap angle for a low-poly butterfly at time `t` (seconds).
 */
export function sampleButterflyPose(spec: ButterflySpec, t: number): ButterflyPose {
  const angle = t * spec.speed + spec.phase;
  const sinA = Math.sin(angle);
  const cosA = Math.cos(angle);
  const sin2A = Math.sin(angle * 2 + 0.6);
  const cos2A = Math.cos(angle * 2 + 0.6);

  // Figure-8 meander around anchor
  const x = spec.anchor[0] + sinA * spec.radiusX;
  const z = spec.anchor[2] + sin2A * (spec.radiusZ * 0.68) + cosA * (spec.radiusZ * 0.32);
  const y =
    spec.anchor[1] +
    Math.sin(t * spec.speed * 2.1 + spec.phase * 1.4) * spec.bobAmplitude +
    Math.cos(t * spec.speed * 1.3 + spec.phase) * (spec.bobAmplitude * 0.45);

  // Analytical horizontal velocity for smooth natural body alignment along flight path
  const vx = cosA * spec.radiusX * spec.speed;
  const vz = (cos2A * 2 * (spec.radiusZ * 0.68) - sinA * (spec.radiusZ * 0.32)) * spec.speed;
  const vy =
    Math.cos(t * spec.speed * 2.1 + spec.phase * 1.4) * spec.bobAmplitude * (spec.speed * 2.1) -
    Math.sin(t * spec.speed * 1.3 + spec.phase) * (spec.bobAmplitude * 0.45) * (spec.speed * 1.3);

  const yaw = Math.atan2(vx, vz);
  const horizSpeed = Math.max(0.05, Math.hypot(vx, vz));
  const pitch = Math.max(-0.35, Math.min(0.35, -vy / horizSpeed * 0.35));

  // Rapid natural wing beat with slight upward glide bias
  const flapWave = Math.sin(t * spec.flapSpeed + spec.phase * 2.3);
  const wingFlap = 0.22 + flapWave * 0.92;

  return { x, y, z, yaw, pitch, wingFlap };
}

// Moonlit Garden ("Beauty of Garden") low-poly butterfly flock drifting above flower beds & pond
export const GARDEN_BUTTERFLIES: ReadonlyArray<ButterflySpec> = [
  // Above Flower Bed 1 ([16.2, -30.4])
  {
    anchor: [16.2, 1.05, -30.4],
    radiusX: 1.3,
    radiusZ: 1.05,
    bobAmplitude: 0.28,
    speed: 0.58,
    flapSpeed: 10.5,
    phase: 0.4,
    scale: 1.0,
    color: '#ffb3d1',
  },
  {
    anchor: [16.9, 1.25, -31.1],
    radiusX: 1.0,
    radiusZ: 0.95,
    bobAmplitude: 0.24,
    speed: 0.64,
    flapSpeed: 11.4,
    phase: 2.1,
    scale: 0.88,
    color: '#ffe082',
  },
  // Above Flower Bed 2 ([24.2, -28.2]) & Blossom Grove A
  {
    anchor: [24.2, 1.15, -28.4],
    radiusX: 1.65,
    radiusZ: 1.1,
    bobAmplitude: 0.32,
    speed: 0.52,
    flapSpeed: 10.2,
    phase: 1.3,
    scale: 1.08,
    color: '#a8e0ff',
  },
  {
    anchor: [21.2, 1.55, -30.0],
    radiusX: 1.4,
    radiusZ: 1.2,
    bobAmplitude: 0.34,
    speed: 0.48,
    flapSpeed: 9.8,
    phase: 3.7,
    scale: 0.94,
    color: '#f8a5c2',
  },
  // Above Flower Bed 3 ([34.5, -40.8])
  {
    anchor: [34.2, 1.1, -40.5],
    radiusX: 1.35,
    radiusZ: 1.5,
    bobAmplitude: 0.3,
    speed: 0.56,
    flapSpeed: 11.0,
    phase: 4.5,
    scale: 1.02,
    color: '#ffd1a9',
  },
  // Above Flower Bed 4 ([21.5, -46.8])
  {
    anchor: [21.5, 1.08, -46.6],
    radiusX: 1.6,
    radiusZ: 1.15,
    bobAmplitude: 0.26,
    speed: 0.6,
    flapSpeed: 10.8,
    phase: 5.2,
    scale: 0.96,
    color: '#e5b8ff',
  },
  // Above Flower Bed 5 ([16.5, -40.8])
  {
    anchor: [16.6, 1.18, -40.6],
    radiusX: 1.25,
    radiusZ: 1.4,
    bobAmplitude: 0.28,
    speed: 0.55,
    flapSpeed: 11.6,
    phase: 2.8,
    scale: 0.92,
    color: '#ffeaa7',
  },
  // Near Waterfall Promenade Rim ([25.8, -34.2])
  {
    anchor: [25.6, 1.45, -34.0],
    radiusX: 1.5,
    radiusZ: 1.2,
    bobAmplitude: 0.35,
    speed: 0.5,
    flapSpeed: 9.6,
    phase: 0.9,
    scale: 1.05,
    color: '#9be7ff',
  },
  {
    anchor: [29.2, 1.35, -39.2],
    radiusX: 1.3,
    radiusZ: 1.25,
    bobAmplitude: 0.3,
    speed: 0.62,
    flapSpeed: 10.9,
    phase: 4.1,
    scale: 0.9,
    color: '#ff9ebb',
  },
];

// Sunlit Destination-Wedding Courtyard & Rose Border butterflies
export const WEDDING_BUTTERFLIES: ReadonlyArray<ButterflySpec> = [
  {
    anchor: [-28.8, 1.15, -44.2],
    radiusX: 1.1,
    radiusZ: 1.3,
    bobAmplitude: 0.24,
    speed: 0.56,
    flapSpeed: 10.6,
    phase: 0.5,
    scale: 0.95,
    color: '#fff2a6',
  },
  {
    anchor: [-24.2, 1.2, -46.5],
    radiusX: 1.15,
    radiusZ: 1.25,
    bobAmplitude: 0.25,
    speed: 0.52,
    flapSpeed: 11.2,
    phase: 2.3,
    scale: 0.92,
    color: '#f8bfd4',
  },
  {
    anchor: [-31.5, 1.35, -63.5],
    radiusX: 1.4,
    radiusZ: 1.1,
    bobAmplitude: 0.28,
    speed: 0.6,
    flapSpeed: 10.2,
    phase: 3.9,
    scale: 1.0,
    color: '#a8dcff',
  },
  {
    anchor: [-21.5, 1.3, -63.8],
    radiusX: 1.4,
    radiusZ: 1.1,
    bobAmplitude: 0.28,
    speed: 0.54,
    flapSpeed: 10.8,
    phase: 1.4,
    scale: 0.98,
    color: '#ffd6a5',
  },
  {
    anchor: [-41.8, 1.4, -52.0],
    radiusX: 1.3,
    radiusZ: 1.8,
    bobAmplitude: 0.32,
    speed: 0.48,
    flapSpeed: 9.8,
    phase: 4.8,
    scale: 1.05,
    color: '#fff4d2',
  },
  {
    anchor: [-26.5, 1.25, -70.4],
    radiusX: 1.7,
    radiusZ: 1.3,
    bobAmplitude: 0.3,
    speed: 0.5,
    flapSpeed: 10.4,
    phase: 5.6,
    scale: 1.02,
    color: '#f7b2c4',
  },
];
