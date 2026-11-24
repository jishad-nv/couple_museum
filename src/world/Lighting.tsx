import { COLORS } from '../utils/constants';

export default function Lighting() {
  return (
    <>
      {/* Balanced Night Ambient + Moonlit Hemisphere Sky/Earth Contrast */}
      <ambientLight intensity={0.38} color="#c4d3ec" />
      <hemisphereLight args={['#4e6ea8', '#222821', 0.56]} />

      {/* Crisp Moonlight Directional Key Light casting natural night shadows */}
      <directionalLight
        position={[24, 34, -22]}
        intensity={0.82}
        color="#c8dcff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={105}
        shadow-camera-left={-44}
        shadow-camera-right={44}
        shadow-camera-top={44}
        shadow-camera-bottom={-44}
        shadow-bias={-0.0008}
      />

      {/* Exterior Forecourt Warm Portico & Courtyard Lantern Illumination */}
      <pointLight position={[0, 4.8, 7.2]} intensity={14} color="#ffd89c" distance={22} />
      <pointLight position={[0, 4.4, 13.8]} intensity={10} color="#ffdba8" distance={18} />

      {/* Entrance Hall Warm Chandeliers */}
      <pointLight position={[0, 4.8, -0.25]} intensity={16} color={COLORS.warmLight} distance={16} />

      {/* Circular Photo Gallery Rotunda & Wall Accent Lights */}
      <pointLight position={[0, 5.2, -21.5]} intensity={23} color="#fff2de" distance={32} />
      <pointLight position={[0, 4.5, -11.5]} intensity={12} color="#ffe8cb" distance={18} />
      <pointLight position={[0, 4.5, -31.5]} intensity={12} color="#ffe8cb" distance={18} />
      <pointLight position={[-11, 4.5, -21.5]} intensity={12} color="#ffe8cb" distance={18} />
      <pointLight position={[11, 4.5, -21.5]} intensity={12} color="#ffe8cb" distance={18} />

      {/* Memory Theatre Warm Sconce & Screen Ambient */}
      <pointLight position={[0, 4.4, -47.5]} intensity={6.5} color="#ffd0a0" distance={18} />
      <pointLight position={[0, 3.6, -54.0]} intensity={5.0} color="#e8b8d0" distance={14} />

      {/* Beauty of Garden: Soft Cool Moonlight Canopy Wash + Warm Focal Pools */}
      <pointLight position={[26.5, 9.5, -38.0]} intensity={18} color="#9fc2f5" distance={36} />
      <pointLight position={[17.2, 3.8, -33.6]} intensity={9} color="#ffd48c" distance={14} />
    </>
  );
}
