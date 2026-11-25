import {
  SECRET_PROPOSAL_RADIUS,
  SECRET_PROPOSAL_SPOT,
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

export const PROPOSAL_SUITABLE_ROOMS: ReadonlySet<MuseumRoom> = new Set(['secret']);

export function isProposalBusy(stage: ProposalStage): boolean {
  return stage !== 'idle';
}

export function isProposalCelebrationActive(stage: ProposalStage): boolean {
  return stage === 'accepted_standing' || stage === 'embracing' || stage === 'celebrating';
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

  const distFromProposalSpot = Math.hypot(
    playerPos.x - SECRET_PROPOSAL_SPOT[0],
    playerPos.z - SECRET_PROPOSAL_SPOT[2]
  );
  if (distFromProposalSpot > SECRET_PROPOSAL_RADIUS) return false;

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
