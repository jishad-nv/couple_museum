export type ContentLoadStatus = 'loading' | 'ready' | 'error';

export const ENTRANCE_TWILIGHT_FACTOR = 0.42;

export interface LoadingReadinessInput {
  contentStatus: ContentLoadStatus;
  sceneReady: boolean;
  contentError: string | null;
}

export interface LoadingReadinessState {
  percent: number;
  canEnter: boolean;
  isError: boolean;
  statusLabel: string;
}

export function computeLoadingReadiness(input: LoadingReadinessInput): LoadingReadinessState {
  if (input.contentStatus === 'error') {
    return {
      percent: input.sceneReady ? 50 : 15,
      canEnter: false,
      isError: true,
      statusLabel: input.contentError || 'Unable to load museum content.',
    };
  }

  let percent = 10;
  if (input.contentStatus === 'ready') percent += 45;
  if (input.sceneReady) percent += 45;

  const canEnter = input.contentStatus === 'ready' && input.sceneReady;

  let statusLabel = 'PREPARING YOUR EXPERIENCE...';
  if (input.contentStatus !== 'ready' && input.sceneReady) {
    statusLabel = 'LOADING MUSEUM MEMORIES...';
  } else if (input.contentStatus === 'ready' && !input.sceneReady) {
    statusLabel = 'ILLUMINATING THE MUSEUM HALLS...';
  } else if (canEnter) {
    statusLabel = 'READY TO ENTER';
  }

  return {
    percent,
    canEnter,
    isError: false,
    statusLabel,
  };
}

export function stepEntranceLightFactor(
  currentFactor: number,
  isLoading: boolean,
  dt: number
): number {
  const safeDt = Math.max(0, Math.min(dt, 0.1));
  if (isLoading) {
    return ENTRANCE_TWILIGHT_FACTOR;
  }
  const next = currentFactor + (1 - currentFactor) * (1 - Math.exp(-1.9 * safeDt));
  return Math.abs(1 - next) < 0.002 ? 1 : next;
}
