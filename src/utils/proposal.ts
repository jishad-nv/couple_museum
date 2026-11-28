import {
  PRIVATE_CHAMBER_CENTER,
  SECRET_PROPOSAL_RADIUS,
  type MuseumRoom,
} from './museumLayout.ts';

export type ProposalStage =
  | 'idle'
  | 'approaching'
  | 'kneeling'
  | 'awaiting_answer'
  | 'accepted_standing'
  | 'embracing'
  | 'celebrating';

export const PROPOSAL_SUITABLE_ROOMS: ReadonlySet<MuseumRoom> = new Set(['private_chamber']);

export function isProposalBusy(stage: ProposalStage): boolean {
  return stage !== 'idle';
}

export function isProposalCelebrationActive(stage: ProposalStage): boolean {
  return stage === 'accepted_standing' || stage === 'embracing' || stage === 'celebrating';
}

/**
 * Secret Room flower petals play strictly while the proposal acceptance/celebration
 * moment is actively happening, and stop cleanly as soon as it completes (`idle`).
 */
export function shouldPlayProposalFlowerAnimation(stage: ProposalStage): boolean {
  return isProposalCelebrationActive(stage);
}

/**
 * Secret Room proposal must never trigger firework bursts/explosions.
 */
export function isProposalFireworksAllowed(room: MuseumRoom): boolean {
  return room !== 'private_chamber' && room !== 'secret';
}

export function shouldShowCoupleToolbar(currentRoom: MuseumRoom, modalOpen: boolean): boolean {
  return !modalOpen && currentRoom !== 'wedding';
}

export function isSuitableProposalLocation(
  room: MuseumRoom,
  playerPos: { x: number; z: number },
  opts: {
    isSitting?: boolean;
    isDancing?: boolean;
    proposalStage?: ProposalStage;
    activeCoupleSequence?: string;
    modalOpen?: boolean;
    secretRoomUnlocked?: boolean;
  } = {}
): boolean {
  if (opts.isSitting || opts.isDancing || opts.modalOpen) return false;
  if (opts.proposalStage && opts.proposalStage !== 'idle') return false;
  if (opts.activeCoupleSequence && opts.activeCoupleSequence !== 'none') return false;
  if (!PROPOSAL_SUITABLE_ROOMS.has(room)) return false;
  if (!opts.secretRoomUnlocked) return false;

  // Must stay inside the inner Secret Room open floor clear of walls and bookshelves
  if (playerPos.x < -52.2 || playerPos.x > -37.2 || playerPos.z < -28.8 || playerPos.z > -14.2) {
    return false;
  }

  const distFromCenterBoard = Math.hypot(
    playerPos.x - PRIVATE_CHAMBER_CENTER[0],
    playerPos.z - PRIVATE_CHAMBER_CENTER[2]
  );
  if (distFromCenterBoard < 2.2 || distFromCenterBoard > SECRET_PROPOSAL_RADIUS) {
    return false;
  }

  return true;
}

export function computeProposalPositions(
  playerPos: { x: number; z: number },
  playerRot: number,
  spacing: number = 0.98
): {
  proposer: [number, number, number];
  partner: [number, number, number];
  proposerFacing: number;
  partnerFacing: number;
} {
  const dirX = Math.sin(playerRot);
  const dirZ = Math.cos(playerRot);
  const half = spacing * 0.5;
  const cx = playerPos.x + dirX * (half * 0.65);
  const cz = playerPos.z + dirZ * (half * 0.65);

  const proposerX = cx - dirX * half;
  const proposerZ = cz - dirZ * half;
  const partnerX = cx + dirX * half;
  const partnerZ = cz + dirZ * half;

  return {
    proposer: [proposerX, 0, proposerZ],
    partner: [partnerX, 0, partnerZ],
    proposerFacing: Math.atan2(partnerX - proposerX, partnerZ - proposerZ),
    partnerFacing: Math.atan2(proposerX - partnerX, proposerZ - partnerZ),
  };
}
