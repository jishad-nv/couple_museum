import { isProposalBusy, type ProposalStage } from './proposal';

export const TRAIL_HEART_POOL_SIZE = 20;
export const TRAIL_SPAWN_DISTANCE = 0.52;
export const TRAIL_MIN_SPAWN_INTERVAL = 0.11;
export const TRAIL_MIN_SPEED = 0.45;
export const TRAIL_MAX_TELEPORT_SKIP = 3.0;
export const TRAIL_MAX_OPACITY = 0.72;

export interface TrailEmissionEligibilityInput {
  proposalStage: ProposalStage;
  isSitting: boolean;
  activeCoupleSequence: string;
  currentRoom: string;
  weddingStage: string;
}

export interface TrailHeartParticle {
  active: boolean;
  age: number;
  lifetime: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotY: number;
  spin: number;
  baseScale: number;
  phase: number;
  opacity: number;
  scale: number;
  colorIndex: number;
}

export interface TrailEmitterTracker {
  initialized: boolean;
  prevX: number;
  prevY: number;
  prevZ: number;
  distanceAccum: number;
  cooldown: number;
}

export interface TrailHeartPoolState {
  particles: TrailHeartParticle[];
  nextSlot: number;
  spawnSerial: number;
  player: TrailEmitterTracker;
  partner: TrailEmitterTracker;
}

function createTracker(): TrailEmitterTracker {
  return {
    initialized: false,
    prevX: 0,
    prevY: 0,
    prevZ: 0,
    distanceAccum: 0,
    cooldown: 0,
  };
}

export function createTrailHeartPool(
  size: number = TRAIL_HEART_POOL_SIZE
): TrailHeartPoolState {
  const particles: TrailHeartParticle[] = Array.from({ length: size }, (_, i) => ({
    active: false,
    age: 0,
    lifetime: 1.0,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0.42,
    vz: 0,
    rotY: 0,
    spin: 0.5,
    baseScale: 0.95,
    phase: i * 1.1,
    opacity: 0,
    scale: 0,
    colorIndex: i % 3,
  }));

  return {
    particles,
    nextSlot: 0,
    spawnSerial: 0,
    player: createTracker(),
    partner: createTracker(),
  };
}

/**
 * Trailing heart particles appear only during non-proposal movement
 * (and are also suppressed while sitting or during a heart-free hug).
 */
export function shouldEmitMovementHearts(input: TrailEmissionEligibilityInput): boolean {
  if (isProposalBusy(input.proposalStage)) return false;
  if (input.isSitting) return false;
  if (input.activeCoupleSequence === 'hug') return false;
  if (input.currentRoom === 'wedding' && input.weddingStage === 'hug') return false;
  return true;
}

function seededSigned(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

function spawnTrailHeart(
  pool: TrailHeartPoolState,
  x: number,
  y: number,
  z: number,
  dirX: number,
  dirZ: number
): void {
  const slot = pool.particles[pool.nextSlot];
  pool.nextSlot = (pool.nextSlot + 1) % pool.particles.length;
  pool.spawnSerial += 1;
  const serial = pool.spawnSerial;

  const latX = -dirZ;
  const latZ = dirX;
  const sideJitter = seededSigned(serial * 3 + 1) * 0.34;
  const heightJitter = 0.85 + ((seededSigned(serial * 5 + 2) + 1) * 0.5) * 0.52;
  const backOffset = 0.34 + ((seededSigned(serial * 7 + 3) + 1) * 0.5) * 0.22;

  slot.active = true;
  slot.age = 0;
  slot.lifetime = 0.88 + ((seededSigned(serial * 11 + 4) + 1) * 0.5) * 0.28;
  slot.x = x - dirX * backOffset + latX * sideJitter;
  slot.y = Math.max(0.4, y + heightJitter);
  slot.z = z - dirZ * backOffset + latZ * sideJitter;
  slot.vx = -dirX * 0.16 + latX * seededSigned(serial * 13 + 5) * 0.14;
  slot.vy = 0.38 + ((seededSigned(serial * 17 + 6) + 1) * 0.5) * 0.18;
  slot.vz = -dirZ * 0.16 + latZ * seededSigned(serial * 19 + 7) * 0.14;
  slot.rotY = Math.atan2(dirX, dirZ) + seededSigned(serial * 23 + 8) * 0.45;
  slot.spin = seededSigned(serial * 29 + 9) * 0.7;
  slot.baseScale = 0.82 + ((seededSigned(serial * 31 + 10) + 1) * 0.5) * 0.28;
  slot.phase = serial * 0.91;
  slot.opacity = 0;
  slot.scale = slot.baseScale * 0.65;
  slot.colorIndex = serial % 3;
}

function advanceTracker(
  pool: TrailHeartPoolState,
  tracker: TrailEmitterTracker,
  pos: { x: number; y: number; z: number },
  delta: number,
  canEmit: boolean
): void {
  if (!tracker.initialized) {
    tracker.initialized = true;
    tracker.prevX = pos.x;
    tracker.prevY = pos.y;
    tracker.prevZ = pos.z;
    tracker.distanceAccum = 0;
    tracker.cooldown = 0;
    return;
  }

  const dx = pos.x - tracker.prevX;
  const dz = pos.z - tracker.prevZ;
  const dist = Math.hypot(dx, dz);

  tracker.prevX = pos.x;
  tracker.prevY = pos.y;
  tracker.prevZ = pos.z;

  if (!canEmit) {
    tracker.distanceAccum = 0;
    tracker.cooldown = 0;
    return;
  }

  tracker.cooldown = Math.max(0, tracker.cooldown - delta);

  const speed = dist / Math.max(delta, 0.001);
  // Ignore stationary micro-settling or instantaneous room teleports
  if (speed < TRAIL_MIN_SPEED || dist > TRAIL_MAX_TELEPORT_SKIP) {
    return;
  }

  tracker.distanceAccum += dist;
  if (tracker.distanceAccum >= TRAIL_SPAWN_DISTANCE && tracker.cooldown <= 0) {
    tracker.distanceAccum = 0;
    tracker.cooldown = TRAIL_MIN_SPAWN_INTERVAL;
    const inv = 1 / dist;
    spawnTrailHeart(pool, pos.x, pos.y, pos.z, dx * inv, dz * inv);
  }
}

export function stepTrailHeartPool(
  pool: TrailHeartPoolState,
  params: {
    delta: number;
    playerPos: { x: number; y: number; z: number };
    partnerPos: { x: number; y: number; z: number };
    eligibility: TrailEmissionEligibilityInput;
  }
): number {
  const { delta, playerPos, partnerPos, eligibility } = params;
  const canEmit = shouldEmitMovementHearts(eligibility);

  advanceTracker(pool, pool.player, playerPos, delta, canEmit);
  advanceTracker(pool, pool.partner, partnerPos, delta, canEmit);

  // When entering a proposal or hug, dissolve any lingering trail softly faster
  const ageRate = canEmit ? 1 : 2.8;
  let activeCount = 0;

  for (let i = 0; i < pool.particles.length; i++) {
    const p = pool.particles[i];
    if (!p.active) continue;

    p.age += delta * ageRate;
    if (p.age >= p.lifetime) {
      p.active = false;
      p.opacity = 0;
      p.scale = 0;
      continue;
    }

    const life = p.age / p.lifetime;
    const sway = Math.sin(p.age * 3.4 + p.phase) * 0.09;
    p.x += (p.vx + sway) * delta;
    p.y += p.vy * delta;
    p.z += (p.vz + Math.cos(p.age * 2.9 + p.phase) * 0.07) * delta;
    p.rotY += p.spin * delta;

    const fadeIn = Math.min(1, life / 0.16);
    const fadeOut = Math.pow(Math.max(0, 1 - Math.max(0, (life - 0.16) / 0.84)), 1.3);
    p.opacity = TRAIL_MAX_OPACITY * fadeIn * fadeOut;
    p.scale = p.baseScale * (0.68 + 0.38 * fadeIn) * (1 - 0.2 * life);
    activeCount += 1;
  }

  return activeCount;
}
