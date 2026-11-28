export type CakeCuttingStage =
  | 'idle'
  | 'approaching'
  | 'cutting'
  | 'feeding_a_to_b'
  | 'feeding_b_to_a'
  | 'celebrating';

export const WEDDING_CAKE_TABLE_POS: [number, number, number] = [-35.8, 0, -40.0];
export const WEDDING_CAKE_TABLE_RADIUS = 0.85;

export const CAKE_STAGE_DURATIONS: Record<Exclude<CakeCuttingStage, 'idle' | 'approaching'>, number> = {
  cutting: 2.5,
  feeding_a_to_b: 2.6,
  feeding_b_to_a: 2.6,
  celebrating: 1.7,
};

export interface CakePose {
  player: [number, number, number];
  partner: [number, number, number];
  playerFacing: number;
  partnerFacing: number;
  playerAction: string;
  partnerAction: string;
}

export function getCakeCuttingPose(stage: Exclude<CakeCuttingStage, 'idle'>): CakePose {
  const [cx, , cz] = WEDDING_CAKE_TABLE_POS;
  // Stand on the open North side of the cake table (1.08m from cake center -> clear of 0.85m table edge)
  const standZ = cz - 1.08;

  if (stage === 'approaching' || stage === 'cutting') {
    const px = cx - 0.34;
    const bx = cx + 0.34;
    return {
      player: [px, 0, standZ],
      partner: [bx, 0, standZ],
      playerFacing: Math.atan2(cx - px, cz - standZ),
      partnerFacing: Math.atan2(cx - bx, cz - standZ),
      playerAction: stage === 'cutting' ? 'cake_cut' : 'walk',
      partnerAction: stage === 'cutting' ? 'cake_cut' : 'walk',
    };
  }

  if (stage === 'feeding_a_to_b') {
    return {
      player: [cx - 0.39, 0, standZ - 0.04],
      partner: [cx + 0.39, 0, standZ - 0.04],
      playerFacing: Math.PI / 2,
      partnerFacing: -Math.PI / 2,
      playerAction: 'cake_feed_give',
      partnerAction: 'cake_feed_receive',
    };
  }

  if (stage === 'feeding_b_to_a') {
    return {
      player: [cx - 0.39, 0, standZ - 0.04],
      partner: [cx + 0.39, 0, standZ - 0.04],
      playerFacing: Math.PI / 2,
      partnerFacing: -Math.PI / 2,
      playerAction: 'cake_feed_receive',
      partnerAction: 'cake_feed_give',
    };
  }

  // celebrating — joyful pose angled warmly toward cake & courtyard camera
  return {
    player: [cx - 0.42, 0, standZ - 0.08],
    partner: [cx + 0.42, 0, standZ - 0.08],
    playerFacing: 0.35,
    partnerFacing: -0.35,
    playerAction: 'celebrate',
    partnerAction: 'celebrate',
  };
}

export function advanceCakeCuttingStage(
  stage: CakeCuttingStage,
  elapsedInStage: number,
  playerDistToTarget: number
): CakeCuttingStage | 'done' {
  if (stage === 'idle') return 'idle';
  if (stage === 'approaching') {
    if ((playerDistToTarget <= 0.18 && elapsedInStage >= 0.45) || elapsedInStage >= 10.5) {
      return 'cutting';
    }
    return 'approaching';
  }
  if (stage === 'cutting') {
    return elapsedInStage >= CAKE_STAGE_DURATIONS.cutting ? 'feeding_a_to_b' : 'cutting';
  }
  if (stage === 'feeding_a_to_b') {
    return elapsedInStage >= CAKE_STAGE_DURATIONS.feeding_a_to_b ? 'feeding_b_to_a' : 'feeding_a_to_b';
  }
  if (stage === 'feeding_b_to_a') {
    return elapsedInStage >= CAKE_STAGE_DURATIONS.feeding_b_to_a ? 'celebrating' : 'feeding_b_to_a';
  }
  return elapsedInStage >= CAKE_STAGE_DURATIONS.celebrating ? 'done' : 'celebrating';
}

export function getCakeCameraFraming(): {
  position: [number, number, number];
  lookAt: [number, number, number];
} {
  const [cx, , cz] = WEDDING_CAKE_TABLE_POS;
  return {
    position: [cx + 2.35, 1.84, cz + 2.25],
    lookAt: [cx + 0.12, 1.18, cz - 0.35],
  };
}
