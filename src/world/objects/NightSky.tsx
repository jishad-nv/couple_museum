import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SKY_CENTER: [number, number, number] = [12, 0, -15];
const MOON_DIRECTION = new THREE.Vector3(0.28, 0.25, -0.92).normalize();
const SUN_DIRECTION = new THREE.Vector3(-0.36, 0.42, -0.83).normalize();

export default function NightSky() {
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const starMatRef = useRef<THREE.ShaderMaterial>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  const moonGlowRef = useRef<THREE.Mesh>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const sunGlowRef = useRef<THREE.Mesh>(null);
  const dayMixRef = useRef(0);

  const skyUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMoonDir: { value: MOON_DIRECTION.clone() },
      uSunDir: { value: SUN_DIRECTION.clone() },
      uDayMix: { value: 0 },
    }),
    []
  );

  const starGeometry = useMemo(() => {
    const count = 950;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const radius = 144;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      // Deterministic stratified upper hemisphere distribution
      const t = (i + 0.5) / count;
      const y = 0.04 + t * 0.94;
      const rSlice = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * goldenAngle + Math.sin(i * 17.31) * 0.24;

      positions[i * 3] = Math.cos(theta) * rSlice * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * rSlice * radius;

      const tint = (i * 29) % 10;
      if (tint < 2) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.91;
        colors[i * 3 + 2] = 0.74;
      } else if (tint < 5) {
        colors[i * 3] = 0.78;
        colors[i * 3 + 1] = 0.88;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.97;
        colors[i * 3 + 2] = 1.0;
      }

      sizes[i] = 1.6 + ((i * 37) % 11) * 0.28;
      phases[i] = (i * 1.618) % (Math.PI * 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, []);

  const starUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVisibility: { value: 1 },
    }),
    []
  );

  useEffect(() => {
    return () => {
      starGeometry.dispose();
    };
  }, [starGeometry]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    // Dynamically import store without circular dependency by reading window debug ref if available
    const storeApi = (
      window as unknown as {
        __LOVE_MUSEUM_STORE__?: { getState: () => { currentRoom?: string } };
      }
    ).__LOVE_MUSEUM_STORE__;
    const isWedding = storeApi?.getState().currentRoom === 'wedding';
    const targetDay = isWedding ? 1 : 0;
    dayMixRef.current = THREE.MathUtils.lerp(dayMixRef.current, targetDay, 1 - Math.exp(-2.8 * dt));
    const dayMix = dayMixRef.current;

    if (skyMatRef.current) {
      skyMatRef.current.uniforms.uTime.value = t;
      skyMatRef.current.uniforms.uDayMix.value = dayMix;
    }
    if (starMatRef.current) {
      starMatRef.current.uniforms.uTime.value = t;
      starMatRef.current.uniforms.uVisibility.value = Math.max(0, 1 - dayMix * 1.4);
    }
    if (moonMeshRef.current) {
      moonMeshRef.current.visible = dayMix < 0.92;
      (moonMeshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - dayMix);
    }
    if (moonGlowRef.current) {
      moonGlowRef.current.visible = dayMix < 0.92;
      (moonGlowRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.18 * (1 - dayMix));
    }
    if (sunMeshRef.current) {
      sunMeshRef.current.visible = dayMix > 0.05;
      (sunMeshRef.current.material as THREE.MeshBasicMaterial).opacity = dayMix;
    }
    if (sunGlowRef.current) {
      sunGlowRef.current.visible = dayMix > 0.05;
      (sunGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.28 * dayMix;
    }
  });

  const moonWorldPos: [number, number, number] = useMemo(
    () => [MOON_DIRECTION.x * 130, MOON_DIRECTION.y * 130, MOON_DIRECTION.z * 130],
    []
  );
  const sunWorldPos: [number, number, number] = useMemo(
    () => [SUN_DIRECTION.x * 132, SUN_DIRECTION.y * 132, SUN_DIRECTION.z * 132],
    []
  );

  return (
    <group position={SKY_CENTER}>
      {/* Full 360-degree Adaptive Sky Dome (Midnight Navy Night <-> Bright Morning Wedding Sky) */}
      <mesh renderOrder={-10}>
        <sphereGeometry args={[158, 40, 28]} />
        <shaderMaterial
          ref={skyMatRef}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
          uniforms={skyUniforms}
          vertexShader={`
            varying vec3 vDir;
            void main() {
              vDir = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform vec3 uMoonDir;
            uniform vec3 uSunDir;
            uniform float uDayMix;
            varying vec3 vDir;

            float hash21(vec2 p) {
              p = fract(p * vec2(123.34, 456.21));
              p += dot(p, p + 45.32);
              return fract(p.x * p.y);
            }

            float noise2(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
                mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
                u.y
              );
            }

            float fbm(vec2 p) {
              float v = 0.0;
              float a = 0.5;
              for (int i = 0; i < 4; i++) {
                v += a * noise2(p);
                p = p * 2.04 + vec2(13.1, 7.7);
                a *= 0.5;
              }
              return v;
            }

            void main() {
              float h = clamp(vDir.y, 0.0, 1.0);

              // Night gradient
              vec3 nHorizon = vec3(0.055, 0.095, 0.21);
              vec3 nMid     = vec3(0.025, 0.055, 0.145);
              vec3 nZenith  = vec3(0.008, 0.018, 0.062);
              vec3 nightCol = mix(nHorizon, nMid, smoothstep(0.0, 0.30, h));
              nightCol = mix(nightCol, nZenith, smoothstep(0.28, 0.88, h));

              float moonAlign = max(dot(normalize(vDir), normalize(uMoonDir)), 0.0);
              nightCol += vec3(0.16, 0.23, 0.38) * pow(moonAlign, 8.0) * 0.65;
              nightCol += vec3(0.45, 0.55, 0.72) * pow(moonAlign, 48.0) * 0.55;

              // Bright Morning Wedding Sky gradient
              vec3 dHorizon = vec3(0.99, 0.90, 0.80);
              vec3 dMid     = vec3(0.58, 0.82, 0.96);
              vec3 dZenith  = vec3(0.27, 0.60, 0.87);
              vec3 dayCol = mix(dHorizon, dMid, smoothstep(0.0, 0.32, h));
              dayCol = mix(dayCol, dZenith, smoothstep(0.30, 0.90, h));

              float sunAlign = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
              dayCol += vec3(1.0, 0.90, 0.68) * pow(sunAlign, 8.0) * 0.32;
              dayCol += vec3(1.0, 0.97, 0.88) * pow(sunAlign, 42.0) * 0.45;

              vec3 col = mix(nightCol, dayCol, uDayMix);

              // High-altitude clouds (wispy silver by night, fluffy sunlit white by morning)
              if (h > 0.04) {
                vec2 cloudUv = vDir.xz / (h + 0.28) * 1.45 + vec2(uTime * 0.0055, uTime * 0.0022);
                float c1 = fbm(cloudUv);
                float c2 = fbm(cloudUv * 2.1 - vec2(uTime * 0.003, 0.0));
                float cloud = smoothstep(0.50, 0.82, c1 * 0.72 + c2 * 0.28);
                float horizonFade = smoothstep(0.04, 0.22, h) * (1.0 - smoothstep(0.68, 0.96, h));
                vec3 nightCloud = mix(vec3(0.07, 0.11, 0.22), vec3(0.22, 0.30, 0.48), pow(moonAlign, 3.0));
                vec3 dayCloud = mix(vec3(0.95, 0.97, 1.0), vec3(1.0, 0.98, 0.93), pow(sunAlign, 2.0));
                vec3 cloudLit = mix(nightCloud, dayCloud, uDayMix);
                col = mix(col, cloudLit, cloud * horizonFade * mix(0.48, 0.62, uDayMix));
              }

              gl_FragColor = vec4(col, 1.0);
            }
          `}
        />
      </mesh>

      {/* Luminous Moon Sphere (visible outside Wedding daytime) */}
      <mesh ref={moonMeshRef} position={moonWorldPos} renderOrder={-8}>
        <sphereGeometry args={[3.4, 24, 24]} />
        <meshBasicMaterial color="#f5f3e8" transparent opacity={1} fog={false} />
      </mesh>
      <mesh ref={moonGlowRef} position={moonWorldPos} renderOrder={-9}>
        <sphereGeometry args={[5.4, 20, 20]} />
        <meshBasicMaterial
          color="#b8d0f8"
          transparent
          opacity={0.18}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Warm Morning Sun Sphere & Halo (visible during Wedding daytime) */}
      <mesh ref={sunMeshRef} position={sunWorldPos} renderOrder={-8} visible={false}>
        <sphereGeometry args={[4.2, 24, 24]} />
        <meshBasicMaterial color="#fff8e3" transparent opacity={0} fog={false} />
      </mesh>
      <mesh ref={sunGlowRef} position={sunWorldPos} renderOrder={-9} visible={false}>
        <sphereGeometry args={[8.5, 20, 20]} />
        <meshBasicMaterial
          color="#ffe09e"
          transparent
          opacity={0}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Crisp Twinkling Midnight Starfield */}
      <points geometry={starGeometry} renderOrder={-7}>
        <shaderMaterial
          ref={starMatRef}
          transparent
          depthWrite={false}
          fog={false}
          blending={THREE.AdditiveBlending}
          uniforms={starUniforms}
          vertexShader={`
            attribute float aSize;
            attribute vec3 aColor;
            attribute float aPhase;
            uniform float uTime;
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
              vColor = aColor;
              vAlpha = 0.65 + 0.35 * sin(uTime * 1.4 + aPhase);
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = aSize * (280.0 / max(-mvPos.z, 1.0));
              gl_Position = projectionMatrix * mvPos;
            }
          `}
          fragmentShader={`
            uniform float uVisibility;
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float glow = smoothstep(0.5, 0.05, d);
              gl_FragColor = vec4(vColor, glow * vAlpha * uVisibility);
            }
          `}
        />
      </points>
    </group>
  );
}
