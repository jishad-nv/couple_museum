import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Museum from '../world/Museum';

export default function Canvas3D() {
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 5, 10] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1020');
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = 2; // PCFSoftShadowMap
      }}
    >
      <fog attach="fog" args={['#1a1020', 30, 80]} />
      <Suspense fallback={null}>
        <Museum />
      </Suspense>
    </Canvas>
  );
}
