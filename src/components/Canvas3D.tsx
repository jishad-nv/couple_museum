import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Museum from '../world/Museum';
import { useGameStore } from '../store/gameStore';
import { computeResponsiveFov } from '../utils/orientation';

function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

let lastAdvanceTimestampSec = 0;

function advanceMonotonic(advance: (timestamp: number) => void) {
  const nowSec = performance.now() * 0.001;
  lastAdvanceTimestampSec = Math.max(lastAdvanceTimestampSec + 0.0001, nowSec);
  advance(lastAdvanceTimestampSec);
}

function ViewportCameraSync({ isSoftwareGl }: { isSoftwareGl: boolean }) {
  const { camera, advance, setSize } = useThree();
  const isMobile = useGameStore((s) => s.isMobile);
  const isPortrait = useGameStore((s) => s.isPortrait);

  useEffect(() => {
    let rafId = 0;
    let settleTimer = 0;

    const applyViewportMetrics = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 0 || h <= 0) return;

      setSize(w, h);
      if (camera instanceof THREE.PerspectiveCamera) {
        const aspect = w / h;
        const nextFov = computeResponsiveFov(w, h, useGameStore.getState().isMobile);
        if (Math.abs(camera.aspect - aspect) > 0.001 || Math.abs(camera.fov - nextFov) > 0.05) {
          camera.aspect = aspect;
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }
      }
      if (isSoftwareGl && !(useGameStore.getState().isMobile && useGameStore.getState().isPortrait)) {
        advanceMonotonic(advance);
      }
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(applyViewportMetrics);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(applyViewportMetrics, 160);
    };

    applyViewportMetrics();
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('orientationchange', scheduleSync);
    window.visualViewport?.addEventListener('resize', scheduleSync);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('orientationchange', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
    };
  }, [camera, advance, setSize, isSoftwareGl, isMobile, isPortrait]);

  return null;
}

function SoftwareGlLoop({ paused }: { paused: boolean }) {
  const { gl, advance } = useThree();

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    let timerId = 0;

    const afterDraw = (cb: () => void) => {
      const ctx = gl.getContext() as WebGL2RenderingContext | null;
      if (!ctx || typeof ctx.fenceSync !== 'function') {
        timerId = window.setTimeout(cb, 45);
        return;
      }
      const sync = ctx.fenceSync(ctx.SYNC_GPU_COMMANDS_COMPLETE, 0);
      ctx.flush();
      const poll = () => {
        if (cancelled) {
          if (sync) ctx.deleteSync(sync);
          return;
        }
        const state = sync && ctx.getSyncParameter(sync, ctx.SYNC_STATUS);
        if (state === ctx.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) ctx.deleteSync(sync);
          timerId = window.setTimeout(cb, 45);
        }
      };
      timerId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (cancelled) return;
      advanceMonotonic(advance);
      afterDraw(tick);
    };

    timerId = window.setTimeout(tick, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [gl, advance, paused]);

  return null;
}

export default function Canvas3D() {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);
  const isMobile = useGameStore((s) => s.isMobile);
  const isPortrait = useGameStore((s) => s.isPortrait);
  const orientationBlocked = isMobile && isPortrait;

  return (
    <Canvas
      shadows={!isSoftwareGl}
      dpr={isSoftwareGl ? 1 : [1, 2]}
      frameloop={isSoftwareGl || orientationBlocked ? 'never' : 'always'}
      camera={{ fov: 60, near: 0.1, far: 360, position: [0, 5, 10] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
      }}
      gl={{
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        preserveDrawingBuffer: isSoftwareGl,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#070e1e');
        gl.shadowMap.enabled = !isSoftwareGl;
        gl.shadowMap.type = 2; // PCFSoftShadowMap
      }}
    >
      <fog attach="fog" args={['#091124', 52, 130]} />
      <ViewportCameraSync isSoftwareGl={isSoftwareGl} />
      {isSoftwareGl && <SoftwareGlLoop paused={orientationBlocked} />}
      <Suspense fallback={null}>
        <Museum />
      </Suspense>
    </Canvas>
  );
}
