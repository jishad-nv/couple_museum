import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import Museum from '../world/Museum';

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

function SoftwareGlLoop() {
  const { gl, advance } = useThree();

  useEffect(() => {
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
      advance(performance.now());
      afterDraw(tick);
    };

    timerId = window.setTimeout(tick, 16);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [gl, advance]);

  return null;
}

export default function Canvas3D() {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);

  return (
    <Canvas
      shadows={!isSoftwareGl}
      dpr={isSoftwareGl ? 1 : [1, 2]}
      frameloop={isSoftwareGl ? 'never' : 'always'}
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 5, 10] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
      gl={{
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#070e1e');
        gl.shadowMap.enabled = !isSoftwareGl;
        gl.shadowMap.type = 2; // PCFSoftShadowMap
      }}
    >
      <fog attach="fog" args={['#091124', 52, 130]} />
      {isSoftwareGl && <SoftwareGlLoop />}
      <Suspense fallback={null}>
        <Museum />
      </Suspense>
    </Canvas>
  );
}
