import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { WATERFALL_POND_RADIUS } from '../../utils/museumLayout';

interface WaterfallProps {
  position: [number, number, number];
}

const ROCK_SPECS: Array<{
  pos: [number, number, number];
  scale: [number, number, number];
  rot: [number, number, number];
  color: string;
}> = [
  // Back amphitheater rocky cliff mass
  { pos: [0.0, 1.45, -1.25], scale: [1.55, 1.5, 1.05], rot: [0.2, 0.3, 0.1], color: '#393e46' },
  { pos: [-1.15, 1.05, -0.95], scale: [1.05, 1.15, 0.95], rot: [0.1, -0.4, 0.25], color: '#454b54' },
  { pos: [1.15, 1.0, -0.9], scale: [1.1, 1.1, 0.9], rot: [-0.2, 0.5, -0.2], color: '#3b4248' },
  // Middle rocky shelf ledge
  { pos: [0.05, 0.84, -0.48], scale: [1.0, 0.42, 0.68], rot: [0.05, 0.1, 0.0], color: '#4e555e' },
  // Flanking lower moss-toned granite boulders
  { pos: [-1.5, 0.46, -0.15], scale: [0.75, 0.58, 0.75], rot: [0.3, 0.7, 0.1], color: '#34403a' },
  { pos: [1.5, 0.48, -0.1], scale: [0.78, 0.6, 0.72], rot: [-0.2, 0.4, 0.2], color: '#36443d' },
  { pos: [-0.8, 0.34, 0.25], scale: [0.5, 0.42, 0.52], rot: [0.1, 1.1, 0.0], color: '#474f57' },
  { pos: [0.85, 0.35, 0.28], scale: [0.52, 0.4, 0.5], rot: [-0.1, 0.8, 0.15], color: '#434a52' },
];

const COPING_ROCK_COUNT = 18;

export default function Waterfall({ position }: WaterfallProps) {
  const cascadeMatRef = useRef<THREE.ShaderMaterial>(null);
  const cascadeLowerMatRef = useRef<THREE.ShaderMaterial>(null);
  const pondMatRef = useRef<THREE.ShaderMaterial>(null);
  const mistRef = useRef<THREE.Points>(null);

  const cascadeUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const cascadeLowerUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const pondUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // Perimeter coping boulders around circular pond
  const copingRocks = useMemo(() => {
    const arr: Array<{ x: number; z: number; sx: number; sy: number; sz: number; ry: number; color: string }> = [];
    for (let i = 0; i < COPING_ROCK_COUNT; i++) {
      const a = (i / COPING_ROCK_COUNT) * Math.PI * 2;
      const r = 2.55 + (i % 3) * 0.08;
      arr.push({
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        sx: 0.38 + (i % 4) * 0.08,
        sy: 0.24 + (i % 3) * 0.06,
        sz: 0.36 + ((i + 1) % 3) * 0.08,
        ry: a + i * 0.4,
        color: i % 3 === 0 ? '#444b54' : i % 3 === 1 ? '#525963' : '#37423c',
      });
    }
    return arr;
  }, []);

  // Rising spray mist particles at base of waterfall
  const mistGeometry = useMemo(() => {
    const count = 40;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const spread = (((i * 37) % 100) / 100 - 0.5) * 1.5;
      pos[i * 3] = spread;
      pos[i * 3 + 1] = 0.28 + ((i * 53) % 100) * 0.008;
      pos[i * 3 + 2] = 0.45 + (((i * 29) % 100) / 100 - 0.5) * 0.65;
      seed[i] = (i * 0.73) % 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      mistGeometry.dispose();
    };
  }, [mistGeometry]);

  // Subtle natural ambient waterfall murmur via Web Audio (strictly respects room + mute)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let gainNode: GainNode | null = null;
    let source: AudioBufferSourceNode | null = null;
    let started = false;

    const ensureAudio = () => {
      if (started || typeof window === 'undefined') return;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      try {
        audioCtx = new AC();
        const sampleRate = audioCtx.sampleRate;
        const len = sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, len, sampleRate);
        const data = buffer.getChannelData(0);
        // Smooth pink-filtered noise for gentle falling water texture
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + white * 0.029;
          b1 = 0.985 * b1 + white * 0.032;
          b2 = 0.950 * b2 + white * 0.048;
          data[i] = (b0 + b1 + b2 + white * 0.015) * 0.35;
        }

        source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 680;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start();
        started = true;
      } catch {
        // Autoplay or audio hardware unavailable cleanly ignored
      }
    };

    const syncGain = () => {
      if (!audioCtx || !gainNode) return;
      const s = useGameStore.getState();
      const target = s.currentRoom === 'garden' && !s.isMuted ? 0.045 : 0;
      gainNode.gain.setTargetAtTime(target, audioCtx.currentTime, 0.25);
    };

    const onInteract = () => {
      ensureAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      syncGain();
    };

    window.addEventListener('pointerdown', onInteract, { passive: true });
    window.addEventListener('keydown', onInteract, { passive: true });
    const unsub = useGameStore.subscribe(syncGain);

    return () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      unsub();
      try {
        source?.stop();
        audioCtx?.close();
      } catch {
        // ignore cleanup failure
      }
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (cascadeMatRef.current) cascadeMatRef.current.uniforms.uTime.value = t;
    if (cascadeLowerMatRef.current) cascadeLowerMatRef.current.uniforms.uTime.value = t;
    if (pondMatRef.current) pondMatRef.current.uniforms.uTime.value = t;

    if (mistRef.current) {
      const posAttr = mistRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        const cycle = (t * 0.55 + i * 0.13) % 1;
        arr[i * 3 + 1] = 0.25 + cycle * 0.65;
        arr[i * 3 + 2] = 0.35 + cycle * 0.38 + Math.sin(t + i) * 0.08;
      }
      posAttr.needsUpdate = true;
    }
  });

  const cascadeVertex = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const cascadeFragment = `
    uniform float uTime;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      float flow1 = vnoise(vec2(vUv.x * 9.0, vUv.y * 5.0 + uTime * 2.1));
      float flow2 = vnoise(vec2(vUv.x * 16.0 + 3.1, vUv.y * 9.0 + uTime * 3.1));
      float streaks = smoothstep(0.45, 0.85, flow1 * 0.6 + flow2 * 0.4);

      // Edge softening & foam crest at top and splash bottom
      float edgeFade = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));
      float crestFoam = smoothstep(0.82, 1.0, vUv.y) * 0.55;
      float baseFoam = (1.0 - smoothstep(0.0, 0.26, vUv.y)) * 0.72;

      vec3 deepWater = vec3(0.14, 0.42, 0.58);
      vec3 brightWater = vec3(0.45, 0.76, 0.90);
      vec3 foam = vec3(0.88, 0.95, 1.0);

      vec3 col = mix(deepWater, brightWater, flow1);
      col = mix(col, foam, clamp(streaks * 0.65 + crestFoam + baseFoam, 0.0, 1.0));
      float alpha = clamp((0.62 + streaks * 0.28 + baseFoam * 0.25) * edgeFade, 0.0, 0.94);

      gl_FragColor = vec4(col, alpha);
    }
  `;

  return (
    <group position={position} rotation={[0, -0.82, 0]}>
      {/* Solid perimeter collider preventing couple from stepping into pond or rocks */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.85, WATERFALL_POND_RADIUS]} position={[0, 0.85, 0]} />
      </RigidBody>

      {/* Dark rocky pond floor & outer stone rim */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.58, 32]} />
        <meshStandardMaterial color="#16222c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.56, 0.12, 10, 36]} />
        <meshStandardMaterial color="#424952" roughness={0.85} />
      </mesh>

      {/* Natural Coping Rocks bordering the pond */}
      {copingRocks.map((r, i) => (
        <mesh
          key={`cr-${i}`}
          position={[r.x, 0.18, r.z]}
          scale={[r.sx, r.sy, r.sz]}
          rotation={[0.1, r.ry, 0.05]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={r.color} roughness={0.88} />
        </mesh>
      ))}

      {/* Sculpted Multi-Tier Natural Waterfall Outcrop */}
      {ROCK_SPECS.map((rock, idx) => (
        <mesh
          key={`wr-${idx}`}
          position={rock.pos}
          scale={rock.scale}
          rotation={rock.rot}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={rock.color} roughness={0.82} metalness={0.05} />
        </mesh>
      ))}

      {/* Upper Cascade Sheet (ledge -> middle shelf) */}
      <mesh position={[0, 1.78, -0.32]} rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[1.12, 1.35, 8, 12]} />
        <shaderMaterial
          ref={cascadeMatRef}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={cascadeUniforms}
          vertexShader={cascadeVertex}
          fragmentShader={cascadeFragment}
        />
      </mesh>

      {/* Lower Plunge Cascade Sheet (middle shelf -> pond) */}
      <mesh position={[0, 0.72, 0.02]} rotation={[-0.26, 0, 0]}>
        <planeGeometry args={[1.38, 1.15, 8, 12]} />
        <shaderMaterial
          ref={cascadeLowerMatRef}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={cascadeLowerUniforms}
          vertexShader={cascadeVertex}
          fragmentShader={cascadeFragment}
        />
      </mesh>

      {/* Frothy Plunge Splash Ring */}
      <mesh position={[0, 0.25, 0.34]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.85, 24]} />
        <meshBasicMaterial color="#d8eefc" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Animated Pond Surface with Concentric Ripples & Moonlight Specular Highlights */}
      <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.52, 40]} />
        <shaderMaterial
          ref={pondMatRef}
          transparent
          depthWrite={false}
          uniforms={pondUniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            varying vec2 vUv;

            void main() {
              vec2 p = (vUv - 0.5) * 2.0;
              vec2 plungeCenter = vec2(0.0, -0.14);
              float dPlunge = length(p - plungeCenter);
              float ripple = sin(dPlunge * 26.0 - uTime * 3.8) * exp(-dPlunge * 1.9);
              float ripple2 = sin(p.x * 14.0 + p.y * 11.0 + uTime * 1.7) * 0.25;

              vec3 baseCol = vec3(0.06, 0.18, 0.28);
              vec3 moonSpec = vec3(0.38, 0.58, 0.78);
              vec3 lanternGlow = vec3(0.75, 0.55, 0.32);

              float specMask = smoothstep(0.18, 0.85, ripple + ripple2);
              vec3 col = mix(baseCol, moonSpec, specMask * 0.55);

              // Subtle warm lantern shimmer near south pond edge
              float lanternSpot = exp(-length(p - vec2(-0.35, 0.45)) * 2.8);
              col += lanternGlow * lanternSpot * (0.28 + 0.14 * ripple);

              // Bright plunge foam ring
              float foam = smoothstep(0.36, 0.08, dPlunge) * 0.45;
              col = mix(col, vec3(0.82, 0.93, 1.0), foam);

              float radialEdge = 1.0 - smoothstep(0.92, 1.0, length(p));
              gl_FragColor = vec4(col, 0.88 * radialEdge);
            }
          `}
        />
      </mesh>

      {/* Gentle Rising Mist Spray at Plunge Base */}
      <points ref={mistRef} geometry={mistGeometry}>
        <pointsMaterial
          color="#d8eeff"
          size={0.14}
          transparent
          opacity={0.34}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Warm Uplight Illuminating Waterfall Cascades */}
      <pointLight position={[0, 1.15, 0.85]} intensity={6.5} color="#ffd89c" distance={8.5} />
    </group>
  );
}
