export interface OrientationViewportSnapshot {
  width: number;
  height: number;
  maxTouchPoints: number;
  hasTouchEvent: boolean;
  hasCoarsePointer: boolean;
  hasFinePointer: boolean;
}

export type OrientationLockResult = 'locked' | 'unsupported' | 'denied';

export function isPortraitViewport(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  if (width <= 0 || height <= 0) return false;
  return height > width;
}

/**
 * Distinguishes touch phones and touch tablets from desktop browsers (including
 * resized narrow desktop windows and large fine-pointer touchscreen laptops).
 * Uses min/max viewport dimensions so rotating a tablet between portrait (768x1024)
 * and landscape (1024x768) keeps its mobile/touch classification consistent.
 */
export function detectMobileTouchDevice(snapshot: OrientationViewportSnapshot): boolean {
  const { width, height, maxTouchPoints, hasTouchEvent, hasCoarsePointer, hasFinePointer } =
    snapshot;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }

  const hasTouchCapability = hasTouchEvent || maxTouchPoints > 0 || hasCoarsePointer;
  if (!hasTouchCapability) {
    return false;
  }

  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);

  // Desktop touchscreen monitors / laptops usually have primary fine pointer and large viewport
  if (hasFinePointer && !hasCoarsePointer && maxDim >= 1200) {
    return false;
  }

  return minDim <= 900 && maxDim <= 1368;
}

export function shouldShowLandscapePrompt(isMobileTouch: boolean, isPortrait: boolean): boolean {
  return isMobileTouch && isPortrait;
}

/**
 * Computes comfortable vertical FOV for desktop and mobile landscape viewports so the
 * 3D museum and couple stay properly framed without stretching or vertical cropping.
 */
export function computeResponsiveFov(
  width: number,
  height: number,
  isMobileTouch: boolean
): number {
  if (!isMobileTouch || width <= 0 || height <= 0 || height > width) {
    return 60;
  }
  const aspect = width / height;
  if (height <= 460 && aspect >= 1.75) {
    return 63;
  }
  return 60;
}

export function readBrowserViewportSnapshot(): OrientationViewportSnapshot {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      maxTouchPoints: 0,
      hasTouchEvent: false,
      hasCoarsePointer: false,
      hasFinePointer: true,
    };
  }

  const hasCoarsePointer =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;
  const hasFinePointer =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: fine)').matches
      : false;

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0,
    hasTouchEvent: 'ontouchstart' in window,
    hasCoarsePointer,
    hasFinePointer,
  };
}

export async function tryLockLandscapeOrientation(): Promise<OrientationLockResult> {
  if (typeof window === 'undefined' || typeof screen === 'undefined') {
    return 'unsupported';
  }
  const orientation = screen.orientation as
    | (ScreenOrientation & { lock?: (mode: string) => Promise<void> })
    | undefined;
  if (!orientation || typeof orientation.lock !== 'function') {
    return 'unsupported';
  }
  try {
    const result = await Promise.race<OrientationLockResult>([
      orientation.lock('landscape').then(
        () => 'locked',
        () => 'denied'
      ),
      new Promise<OrientationLockResult>((resolve) => {
        window.setTimeout(() => resolve('denied'), 600);
      }),
    ]);
    return result;
  } catch {
    return 'denied';
  }
}
