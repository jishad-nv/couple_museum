import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../utils/constants';

export default function Lighting() {
  return (
    <>
      {/* Global ambient light */}
      <ambientLight intensity={0.3} color={COLORS.ambient} />

      {/* Main directional light (sun) */}
      <directionalLight
        position={[10, 20, 5]}
        intensity={0.5}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.001}
      />

      {/* Entrance Hall lights */}
      <pointLight
        position={[0, 4.5, 0]}
        intensity={15}
        color={COLORS.warmLight}
        distance={15}
        castShadow
      />
      <pointLight
        position={[-4, 4.5, 0]}
        intensity={8}
        color={COLORS.warmLight}
        distance={10}
      />
      <pointLight
        position={[4, 4.5, 0]}
        intensity={8}
        color={COLORS.warmLight}
        distance={10}
      />

      {/* Gallery lights */}
      <spotLight
        position={[-6, 4.8, 18]}
        angle={0.4}
        penumbra={0.6}
        intensity={20}
        color="#fff8ee"
        target-position={[-6, 2.5, 18]}
        castShadow
      />
      <spotLight
        position={[0, 4.8, 18]}
        angle={0.4}
        penumbra={0.6}
        intensity={20}
        color="#fff8ee"
      />
      <spotLight
        position={[6, 4.8, 18]}
        angle={0.4}
        penumbra={0.6}
        intensity={20}
        color="#fff8ee"
      />

      {/* Romantic corner lights */}
      <pointLight
        position={[-16, 4, 18]}
        intensity={12}
        color={COLORS.rosePink}
        distance={12}
      />
      <pointLight
        position={[-20, 3, 18]}
        intensity={6}
        color="#ffb6c1"
        distance={8}
      />

      {/* Cinema lights */}
      <pointLight
        position={[0, 4, 36]}
        intensity={5}
        color="#8888ff"
        distance={15}
      />

      {/* Garden lights */}
      <pointLight
        position={[0, 6, 54]}
        intensity={15}
        color="#ffe4b5"
        distance={25}
      />
      <pointLight
        position={[-10, 4, 50]}
        intensity={8}
        color="#98fb98"
        distance={12}
      />
      <pointLight
        position={[10, 4, 58]}
        intensity={8}
        color="#ffe4c4"
        distance={12}
      />

      {/* Hemisphere light for ambient fill */}
      <hemisphereLight
        args={['#ffeedd', '#c4b8a8', 0.4]}
      />
    </>
  );
}
