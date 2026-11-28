import type { MuseumRoom } from './museumLayout';
import {
  GARDEN_DOOR_POS,
  MAIN_DOOR_POS,
  PRIVATE_DOOR_POS,
  SECRET_DOOR_POS,
  THEATRE_DOOR_POS,
  WEDDING_DOOR_POS,
} from './museumLayout';

export type MuseumDoorId = 'main' | 'theatre' | 'garden' | 'secret' | 'private' | 'wedding';

export type DoorLifecyclePhase = 'closed' | 'opening_from_outside' | 'inside_open';

export interface DoorSpec {
  id: MuseumDoorId;
  position: [number, number, number];
  /** Unit vector in XZ plane pointing OUTSIDE the room (toward exterior / previous room). */
  outwardNormal: [number, number];
  /** MuseumRoom expected once the player has exited through this door. */
  outsideRoom: MuseumRoom;
  /** Minimum signed distance outside doorway plane required before auto-closing. */
  outsideClearance: number;
  /** Minimum signed distance inside doorway plane that confirms the player entered. */
  entryConfirmDepth: number;
  /** Half-width of the doorway opening along the wall tangent. */
  halfWidth: number;
  /** Maximum reach of swinging door leaves into the inside (-outwardNormal). */
  inwardSweep: number;
  /** Maximum reach of swinging door leaves into the outside (+outwardNormal). */
  outwardSweep: number;
  /** Distance outside where an abandoned external open call may reset if player walks away. */
  abandonOutsideDist: number;
}

export interface DoorTrackerState {
  phase: DoorLifecyclePhase;
  exitDwellTime: number;
}

export type DoorTrackers = Record<MuseumDoorId, DoorTrackerState>;

export interface DoorStepContext {
  doorOpenMap: Record<MuseumDoorId, boolean>;
  playerPos: { x: number; z: number };
  partnerPos: { x: number; z: number } | null;
  currentRoom: MuseumRoom;
  scriptedWalkTarget: [number, number, number] | null;
  interactionBusy: boolean;
}

const SQRT1_2 = Math.SQRT1_2;

export const DOOR_SPECS: Record<MuseumDoorId, DoorSpec> = {
  main: {
    id: 'main',
    position: MAIN_DOOR_POS,
    outwardNormal: [0, 1],
    outsideRoom: 'exterior',
    outsideClearance: 1.45,
    entryConfirmDepth: 0.65,
    halfWidth: 1.7,
    inwardSweep: 1.65,
    outwardSweep: 0.25,
    abandonOutsideDist: 13.5,
  },
  theatre: {
    id: 'theatre',
    position: THEATRE_DOOR_POS,
    outwardNormal: [0, 1],
    outsideRoom: 'gallery',
    outsideClearance: 1.45,
    entryConfirmDepth: 0.65,
    halfWidth: 1.5,
    inwardSweep: 1.45,
    outwardSweep: 0.25,
    abandonOutsideDist: 5.5,
  },
  garden: {
    id: 'garden',
    position: GARDEN_DOOR_POS,
    outwardNormal: [-SQRT1_2, SQRT1_2],
    outsideRoom: 'gallery',
    outsideClearance: 1.85,
    entryConfirmDepth: 0.65,
    halfWidth: 1.5,
    inwardSweep: 0.25,
    outwardSweep: 1.45,
    abandonOutsideDist: 5.5,
  },
  secret: {
    id: 'secret',
    position: SECRET_DOOR_POS,
    outwardNormal: [1, 0],
    outsideRoom: 'gallery',
    outsideClearance: 2.85,
    entryConfirmDepth: 0.65,
    halfWidth: 1.3,
    inwardSweep: 0.25,
    outwardSweep: 2.48,
    abandonOutsideDist: 5.5,
  },
  private: {
    id: 'private',
    position: PRIVATE_DOOR_POS,
    outwardNormal: [1, 0],
    outsideRoom: 'secret',
    outsideClearance: 1.45,
    entryConfirmDepth: 0.65,
    halfWidth: 1.15,
    inwardSweep: 2.22,
    outwardSweep: 0.25,
    abandonOutsideDist: 5.0,
  },
  wedding: {
    id: 'wedding',
    position: WEDDING_DOOR_POS,
    outwardNormal: [SQRT1_2, SQRT1_2],
    outsideRoom: 'gallery',
    outsideClearance: 1.85,
    entryConfirmDepth: 0.65,
    halfWidth: 1.5,
    inwardSweep: 0.25,
    outwardSweep: 1.45,
    abandonOutsideDist: 5.5,
  },
};

export const ALL_DOOR_IDS: ReadonlyArray<MuseumDoorId> = [
  'main',
  'theatre',
  'garden',
  'secret',
  'private',
  'wedding',
];

export const EXIT_DWELL_SECONDS = 0.14;
export const ABANDON_DWELL_SECONDS = 0.28;

export function createInitialDoorTrackers(): DoorTrackers {
  return {
    main: { phase: 'closed', exitDwellTime: 0 },
    theatre: { phase: 'closed', exitDwellTime: 0 },
    garden: { phase: 'closed', exitDwellTime: 0 },
    secret: { phase: 'closed', exitDwellTime: 0 },
    private: { phase: 'closed', exitDwellTime: 0 },
    wedding: { phase: 'closed', exitDwellTime: 0 },
  };
}

export function computeDoorRelativeCoords(
  spec: DoorSpec,
  pos: { x: number; z: number }
): { signedOutDist: number; lateralOffset: number } {
  const dx = pos.x - spec.position[0];
  const dz = pos.z - spec.position[2];
  const [nx, nz] = spec.outwardNormal;
  const signedOutDist = dx * nx + dz * nz;
  const lateralOffset = dx * -nz + dz * nx;
  return { signedOutDist, lateralOffset };
}

export function isPositionInDoorHazardZone(
  spec: DoorSpec,
  pos: { x: number; z: number }
): boolean {
  const { signedOutDist, lateralOffset } = computeDoorRelativeCoords(spec, pos);
  return (
    Math.abs(lateralOffset) <= spec.halfWidth + 0.55 &&
    signedOutDist >= -(spec.inwardSweep + 0.35) &&
    signedOutDist <= spec.outwardSweep + 0.35
  );
}

function isScriptedWalkTargetingInside(
  spec: DoorSpec,
  target: [number, number, number] | null
): boolean {
  if (!target) return false;
  const { signedOutDist } = computeDoorRelativeCoords(spec, { x: target[0], z: target[2] });
  return signedOutDist < -0.5;
}

export function stepDoorLifecycle(
  spec: DoorSpec,
  tracker: DoorTrackerState,
  ctx: DoorStepContext,
  delta: number
): { nextTracker: DoorTrackerState; shouldClose: boolean } {
  const isOpen = ctx.doorOpenMap[spec.id];
  if (!isOpen) {
    if (tracker.phase === 'closed' && tracker.exitDwellTime === 0) {
      return { nextTracker: tracker, shouldClose: false };
    }
    return { nextTracker: { phase: 'closed', exitDwellTime: 0 }, shouldClose: false };
  }

  const dt = Math.max(0, Math.min(delta, 0.1));
  const pCoords = computeDoorRelativeCoords(spec, ctx.playerPos);
  const enteringThisRoom = isScriptedWalkTargetingInside(spec, ctx.scriptedWalkTarget);

  let phase = tracker.phase;
  if (phase === 'closed') {
    const startedInside =
      pCoords.signedOutDist <= -spec.entryConfirmDepth ||
      (ctx.currentRoom !== spec.outsideRoom && pCoords.signedOutDist < spec.outsideClearance);
    phase = startedInside ? 'inside_open' : 'opening_from_outside';
  }

  if (phase === 'opening_from_outside') {
    if (pCoords.signedOutDist <= -spec.entryConfirmDepth) {
      return {
        nextTracker: { phase: 'inside_open', exitDwellTime: 0 },
        shouldClose: false,
      };
    }

    const abandonedOutside =
      !ctx.interactionBusy &&
      !enteringThisRoom &&
      ctx.currentRoom === spec.outsideRoom &&
      pCoords.signedOutDist >= spec.abandonOutsideDist &&
      !isPositionInDoorHazardZone(spec, ctx.playerPos) &&
      (!ctx.partnerPos || !isPositionInDoorHazardZone(spec, ctx.partnerPos));

    if (abandonedOutside) {
      const nextDwell = tracker.exitDwellTime + dt;
      if (nextDwell >= ABANDON_DWELL_SECONDS) {
        return {
          nextTracker: { phase: 'closed', exitDwellTime: 0 },
          shouldClose: true,
        };
      }
      return {
        nextTracker: { phase, exitDwellTime: nextDwell },
        shouldClose: false,
      };
    }

    return {
      nextTracker: { phase, exitDwellTime: 0 },
      shouldClose: false,
    };
  }

  // phase === 'inside_open'
  if (ctx.interactionBusy || enteringThisRoom) {
    return {
      nextTracker: { phase: 'inside_open', exitDwellTime: 0 },
      shouldClose: false,
    };
  }

  const isOutsideRoom = ctx.currentRoom === spec.outsideRoom;
  const playerCleared =
    pCoords.signedOutDist >= spec.outsideClearance && !isPositionInDoorHazardZone(spec, ctx.playerPos);

  const partnerBlocking =
    ctx.partnerPos !== null &&
    isPositionInDoorHazardZone(spec, ctx.partnerPos) &&
    pCoords.signedOutDist < spec.outsideClearance + 1.5;

  if (isOutsideRoom && playerCleared && !partnerBlocking) {
    const nextDwell = tracker.exitDwellTime + dt;
    if (nextDwell >= EXIT_DWELL_SECONDS) {
      return {
        nextTracker: { phase: 'closed', exitDwellTime: 0 },
        shouldClose: true,
      };
    }
    return {
      nextTracker: { phase: 'inside_open', exitDwellTime: nextDwell },
      shouldClose: false,
    };
  }

  return {
    nextTracker: { phase: 'inside_open', exitDwellTime: 0 },
    shouldClose: false,
  };
}

export function stepAllDoors(
  trackers: DoorTrackers,
  ctx: DoorStepContext,
  delta: number
): { nextTrackers: DoorTrackers; doorsToClose: MuseumDoorId[] } {
  const nextTrackers: DoorTrackers = { ...trackers };
  const doorsToClose: MuseumDoorId[] = [];

  for (const id of ALL_DOOR_IDS) {
    const res = stepDoorLifecycle(DOOR_SPECS[id], trackers[id], ctx, delta);
    nextTrackers[id] = res.nextTracker;
    if (res.shouldClose) {
      doorsToClose.push(id);
    }
  }

  return { nextTrackers, doorsToClose };
}
