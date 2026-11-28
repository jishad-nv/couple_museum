export interface RectBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const WEDDING_TERRACE_BOUNDS: RectBounds = {
  minX: -40.5,
  maxX: -12.5,
  minZ: -67.5,
  maxZ: -34.5,
};

export const WEDDING_BREEZEWAY_BOUNDS: RectBounds = {
  minX: -21.95,
  maxX: -10.45,
  minZ: -39.6,
  maxZ: -32.0,
};

// Other indoor/nighttime wings of the museum that must remain free of Wedding terrain hills & trees
export const MUSEUM_WING_EXCLUSION_BOXES: ReadonlyArray<RectBounds> = [
  // Circular Photo Gallery rotunda (z = -38.8 .. -4.2)
  { minX: -17.4, maxX: 17.4, minZ: -38.8, maxZ: -4.2 },
  // Memory Theatre cinema wing (x = -8.6 .. 8.6, z = -57.0 .. -38.2)
  { minX: -8.6, maxX: 8.6, minZ: -57.0, maxZ: -38.2 },
  // Entrance Hall & Museum Exterior courtyard
  { minX: -28.0, maxX: 28.0, minZ: -4.5, maxZ: 32.0 },
  // Beauty of Garden moonlit conservatory
  { minX: 11.2, maxX: 41.0, minZ: -54.5, maxZ: -21.5 },
  // Pre-Secret Room + Password-Protected Inner Secret Room
  { minX: -54.8, maxX: -16.8, minZ: -31.2, maxZ: -11.8 },
];

export const WEDDING_LAWN_BASE_Y = -0.22;

function pointInBounds(x: number, z: number, b: RectBounds, padding = 0): boolean {
  return (
    x >= b.minX - padding &&
    x <= b.maxX + padding &&
    z >= b.minZ - padding &&
    z <= b.maxZ + padding
  );
}

export function isWeddingAtmosphereActive(
  currentRoom: string | undefined,
  scriptedWalkTarget?: readonly [number, number, number] | null
): boolean {
  if (currentRoom === 'wedding') return true;
  if (!scriptedWalkTarget) return false;
  return (
    Math.abs(scriptedWalkTarget[0] - -26.5) < 0.1 &&
    Math.abs(scriptedWalkTarget[2] - -38.8) < 0.1
  );
}

export function isOnWeddingTerrace(x: number, z: number, padding = 0): boolean {
  return (
    pointInBounds(x, z, WEDDING_TERRACE_BOUNDS, padding) ||
    pointInBounds(x, z, WEDDING_BREEZEWAY_BOUNDS, padding)
  );
}

export function isInsideOtherMuseumWing(x: number, z: number, padding = 0): boolean {
  return MUSEUM_WING_EXCLUSION_BOXES.some((box) => pointInBounds(x, z, box, padding));
}

export function isInsideMuseumFootprint(x: number, z: number, padding = 0): boolean {
  return isOnWeddingTerrace(x, z, padding) || isInsideOtherMuseumWing(x, z, padding);
}

/**
 * Signed distance outside the Wedding Courtyard terrace perimeter.
 * Returns 0 on or inside the courtyard rectangle.
 */
export function distanceToWeddingCourtyard(x: number, z: number): number {
  const dx = Math.max(
    WEDDING_TERRACE_BOUNDS.minX - x,
    0,
    x - WEDDING_TERRACE_BOUNDS.maxX
  );
  const dz = Math.max(
    WEDDING_TERRACE_BOUNDS.minZ - z,
    0,
    z - WEDDING_TERRACE_BOUNDS.maxZ
  );
  return Math.hypot(dx, dz);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Continuous procedural elevation for the Destination Wedding countryside terrain.
 * Remains strictly flat (-0.22m) around the Wedding Hall terrace plinth and under museum structures
 * so there are no gaps, floating edges, or clipping into any room.
 */
export function groundHeightAt(x: number, z: number): number {
  const courtyardDist = distanceToWeddingCourtyard(x, z);
  const flatFactor = smoothstep(13.5, 44.0, courtyardDist);
  if (flatFactor <= 0.0001) {
    return WEDDING_LAWN_BASE_Y;
  }

  // Suppress hill elevation near/inside all other museum rooms so roofs & gardens never clip
  let museumMask = 1.0;
  for (const box of MUSEUM_WING_EXCLUSION_BOXES) {
    const dx = Math.max(box.minX - x, 0, x - box.maxX);
    const dz = Math.max(box.minZ - z, 0, z - box.maxZ);
    const dist = Math.hypot(dx, dz);
    museumMask = Math.min(museumMask, smoothstep(2.0, 18.0, dist));
  }
  if (museumMask <= 0.0001) {
    return WEDDING_LAWN_BASE_Y;
  }

  // Rolling countryside swells & multi-harmonic ridge silhouettes toward the horizon
  const n1 = Math.sin(x * 0.032 + 0.6) * Math.cos(z * 0.029 - 0.4);
  const n2 = Math.sin((x + z) * 0.019 + 1.3) * 0.55 + Math.cos((x - z) * 0.024) * 0.45;
  const ridge = Math.abs(Math.sin(x * 0.017 - z * 0.015 + 0.8));

  const distanceLift = smoothstep(26.0, 125.0, courtyardDist) * 14.5;
  const undulatingHills = (0.5 + 0.5 * n1) * 5.6 + (0.5 + 0.5 * n2) * 3.8 + ridge * 6.4;
  const rawRise = (distanceLift + undulatingHills) * flatFactor * museumMask;

  return WEDDING_LAWN_BASE_Y + rawRise;
}

export interface CypressTreeSpec {
  x: number;
  z: number;
  scale: number;
  tint: string;
}

export interface CanopyTreeSpec {
  x: number;
  z: number;
  scale: number;
  rotY: number;
  blossom: boolean;
  tint: string;
}

export interface GardenShrubSpec {
  x: number;
  z: number;
  scale: number;
  rotY: number;
  hasBlossoms: boolean;
}

export interface GardenPathStoneSpec {
  x: number;
  z: number;
  rx: number;
  rz: number;
  rotY: number;
}

// Curated & procedural trees strictly outside the playable terrace & museum structures
export const WEDDING_CYPRESS_TREES: ReadonlyArray<CypressTreeSpec> = [
  // North ceremonial vista framing past the floral arch (z < -69)
  { x: -34.2, z: -71.5, scale: 1.08, tint: '#335d35' },
  { x: -31.0, z: -73.2, scale: 1.22, tint: '#2d5330' },
  { x: -22.0, z: -73.0, scale: 1.2, tint: '#366138' },
  { x: -18.6, z: -71.2, scale: 1.06, tint: '#2f5732' },
  { x: -39.2, z: -72.8, scale: 1.15, tint: '#3c683d' },
  { x: -14.2, z: -72.4, scale: 1.12, tint: '#335d35' },
  // West meadow border framing balustrade view (x < -42.5)
  { x: -44.2, z: -64.0, scale: 1.18, tint: '#2e5531' },
  { x: -45.0, z: -56.2, scale: 1.04, tint: '#39653a' },
  { x: -44.8, z: -48.0, scale: 1.24, tint: '#305a33' },
  { x: -44.2, z: -39.5, scale: 1.08, tint: '#376239' },
  // East garden corridor (between Wedding balustrade x=-12.5 and Theatre west wall x=-8.5)
  { x: -10.5, z: -66.2, scale: 1.05, tint: '#335d35' },
  { x: -10.4, z: -60.5, scale: 0.96, tint: '#3d693e' },
  { x: -10.4, z: -51.5, scale: 1.02, tint: '#2f5732' },
  { x: -10.4, z: -44.2, scale: 0.94, tint: '#366138' },
  // North-East & North-West background cypress groves
  { x: -14.0, z: -85.0, scale: 1.26, tint: '#366039' },
  { x: -8.0, z: -79.0, scale: 1.18, tint: '#2f5732' },
  { x: -48.5, z: -75.0, scale: 1.28, tint: '#335d35' },
  { x: -55.0, z: -66.0, scale: 1.16, tint: '#3c683d' },
  { x: -54.0, z: -45.0, scale: 1.22, tint: '#2d5330' },
];

function createDeterministicCanopyTrees(): CanopyTreeSpec[] {
  const curated: CanopyTreeSpec[] = [
    // Close romantic blossom & olive trees framing the Wedding Hall vista
    { x: -35.8, z: -75.2, scale: 1.08, rotY: 0.4, blossom: true, tint: '#f3cad8' },
    { x: -17.2, z: -75.5, scale: 1.06, rotY: 2.1, blossom: true, tint: '#f8dce5' },
    { x: -46.8, z: -68.2, scale: 1.14, rotY: 1.1, blossom: false, tint: '#578543' },
    { x: -47.2, z: -52.0, scale: 1.1, rotY: 2.8, blossom: true, tint: '#f4cedb' },
    { x: -46.6, z: -36.5, scale: 1.05, rotY: 0.9, blossom: false, tint: '#4f7a3d' },
    { x: -26.5, z: -88.0, scale: 1.22, rotY: 1.7, blossom: false, tint: '#63924c' },
    { x: -33.2, z: -83.5, scale: 1.12, rotY: 0.5, blossom: false, tint: '#4e7c3c' },
    { x: -19.8, z: -83.5, scale: 1.14, rotY: 2.4, blossom: false, tint: '#5b8a45' },
  ];

  // Outer hillside & estate parklands (radius 46m–118m around Wedding Courtyard, keeping museum footprint clear)
  const paletteLeaf = ['#4b783a', '#598845', '#68964f', '#436c34', '#729f58'];
  const paletteBlossom = ['#f2c7d6', '#fae3ea', '#e8b3c6'];

  for (let i = 0; i < 64; i++) {
    const angle = (i * 2.399963) % (Math.PI * 2); // golden-angle spread
    const dist = 28 + ((i * 37) % 72);
    const x = -26.5 + Math.cos(angle) * (16 + dist);
    const z = -51.0 + Math.sin(angle) * (18 + dist);

    // Keep all generated trees safely outside the terrace, breezeway & other museum rooms
    if (isInsideMuseumFootprint(x, z, 4.5)) continue;
    // Keep foreground North-center ceremonial sightline open for garden path
    if (x > -30.5 && x < -22.5 && z > -88.0 && z < -67.0) continue;

    const blossom = i % 5 === 0;
    const tint = blossom
      ? paletteBlossom[i % paletteBlossom.length]
      : paletteLeaf[i % paletteLeaf.length];

    curated.push({
      x: Number(x.toFixed(2)),
      z: Number(z.toFixed(2)),
      scale: Number((0.92 + ((i * 19) % 10) * 0.045).toFixed(2)),
      rotY: Number(((i * 1.13) % (Math.PI * 2)).toFixed(2)),
      blossom,
      tint,
    });
  }

  return curated;
}

export const WEDDING_CANOPY_TREES: ReadonlyArray<CanopyTreeSpec> = createDeterministicCanopyTrees();

function createGardenShrubs(): GardenShrubSpec[] {
  const shrubs: GardenShrubSpec[] = [];

  // North perimeter hedge outside the North balustrade (z = -69.1) leaving center arch walkway open
  for (let x = -40.4; x <= -29.1; x += 2.2) {
    shrubs.push({ x, z: -69.1, scale: 1.38, rotY: x * 0.3, hasBlossoms: true });
  }
  for (let x = -23.9; x <= -12.6; x += 2.2) {
    shrubs.push({ x, z: -69.1, scale: 1.38, rotY: x * 0.3, hasBlossoms: true });
  }

  // West perimeter hedge outside the West balustrade (x = -42.15) tall enough to crown the stone railing
  for (let z = -66.8; z <= -35.4; z += 2.2) {
    shrubs.push({
      x: -42.15,
      z,
      scale: 1.36 + (Math.abs(Math.round(z)) % 2) * 0.14,
      rotY: z * 0.25,
      hasBlossoms: true,
    });
  }

  // South terrace hedge tucked neatly along z = -33.4 (north of SecretRoom z=-29.0 & PrivateChamber z=-30.5)
  for (let x = -40.2; x <= -23.2; x += 2.6) {
    shrubs.push({ x, z: -33.4, scale: 1.18, rotY: x * 0.4, hasBlossoms: true });
  }

  // East garden strip along balustrade (x = -11.2, outside Theatre west wall at -8.2)
  for (let z = -65.5; z <= -39.5; z += 2.6) {
    shrubs.push({ x: -11.2, z, scale: 1.24, rotY: z * 0.2, hasBlossoms: true });
  }

  // Border shrubs along North garden promenade
  for (let z = -72.0; z >= -86.0; z -= 3.2) {
    shrubs.push({ x: -29.2, z, scale: 1.08, rotY: z * 0.3, hasBlossoms: true });
    shrubs.push({ x: -23.8, z, scale: 1.08, rotY: -z * 0.3, hasBlossoms: true });
  }

  return shrubs;
}

export const WEDDING_GARDEN_SHRUBS: ReadonlyArray<GardenShrubSpec> = createGardenShrubs();

export const WEDDING_NORTH_PATH_STONES: ReadonlyArray<GardenPathStoneSpec> = [
  { x: -26.5, z: -69.4, rx: 1.35, rz: 0.72, rotY: 0.04 },
  { x: -26.4, z: -71.2, rx: 1.25, rz: 0.68, rotY: -0.08 },
  { x: -26.6, z: -73.1, rx: 1.22, rz: 0.68, rotY: 0.1 },
  { x: -26.3, z: -75.0, rx: 1.18, rz: 0.65, rotY: -0.05 },
  { x: -26.7, z: -77.0, rx: 1.22, rz: 0.66, rotY: 0.09 },
  { x: -26.4, z: -79.0, rx: 1.18, rz: 0.65, rotY: -0.07 },
  { x: -26.6, z: -81.0, rx: 1.15, rz: 0.64, rotY: 0.06 },
  { x: -26.5, z: -83.1, rx: 1.18, rz: 0.64, rotY: -0.04 },
  { x: -26.5, z: -85.2, rx: 1.25, rz: 0.7, rotY: 0.02 },
];
