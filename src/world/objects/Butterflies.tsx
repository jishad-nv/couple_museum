import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sampleButterflyPose, type ButterflySpec } from '../../utils/butterflies';

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

function createWingGeometry(side: 1 | -1): THREE.BufferGeometry {
  const s = side;
  // Crisp low-poly forewing + hindwing silhouette hinged along x = 0 spine (forward = +Z)
  const positions = new Float32Array([
    // Forewing upper triangle
    0, 0, 0.045,
    0.15 * s, 0, 0.115,
    0.125 * s, 0, 0.015,
    // Forewing inner triangle
    0, 0, 0.045,
    0.125 * s, 0, 0.015,
    0, 0, -0.005,
    // Hindwing outer triangle
    0, 0, -0.005,
    0.11 * s, 0, -0.035,
    0.068 * s, 0, -0.105,
    // Hindwing inner tail triangle
    0, 0, -0.005,
    0.068 * s, 0, -0.105,
    0, 0, -0.055,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

interface ButterfliesProps {
  specs: ReadonlyArray<ButterflySpec>;
  sunlit?: boolean;
}

export default function Butterflies({ specs, sunlit = false }: ButterfliesProps) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const leftWingRef = useRef<THREE.InstancedMesh>(null);
  const rightWingRef = useRef<THREE.InstancedMesh>(null);

  const leftWingGeo = useMemo(() => createWingGeometry(-1), []);
  const rightWingGeo = useMemo(() => createWingGeometry(1), []);

  const dummyBody = useMemo(() => new THREE.Object3D(), []);
  const dummyWing = useMemo(() => new THREE.Object3D(), []);
  const eulerBody = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);
  const localQuat = useMemo(() => new THREE.Quaternion(), []);
  const bodyQuat = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    return () => {
      leftWingGeo.dispose();
      rightWingGeo.dispose();
    };
  }, [leftWingGeo, rightWingGeo]);

  useEffect(() => {
    const lw = leftWingRef.current;
    const rw = rightWingRef.current;
    if (!lw || !rw) return;

    const col = new THREE.Color();
    specs.forEach((spec, i) => {
      col.set(spec.color);
      lw.setColorAt(i, col);
      rw.setColorAt(i, col);
    });
    if (lw.instanceColor) lw.instanceColor.needsUpdate = true;
    if (rw.instanceColor) rw.instanceColor.needsUpdate = true;
  }, [specs]);

  useFrame((state) => {
    const body = bodyRef.current;
    const lw = leftWingRef.current;
    const rw = rightWingRef.current;
    if (!body || !lw || !rw) return;

    const t = state.clock.elapsedTime;

    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const pose = sampleButterflyPose(spec, t);
      const s = spec.scale;

      eulerBody.set(pose.pitch, pose.yaw, 0, 'YXZ');
      bodyQuat.setFromEuler(eulerBody);

      // Slender butterfly body (capsule/cylinder oriented forward along +Z)
      dummyBody.position.set(pose.x, pose.y, pose.z);
      localQuat.setFromAxisAngle(X_AXIS, Math.PI / 2);
      dummyBody.quaternion.copy(bodyQuat).multiply(localQuat);
      dummyBody.scale.set(s, s, s);
      dummyBody.updateMatrix();
      body.setMatrixAt(i, dummyBody.matrix);

      // Left wing flap around local Z axis (hinge at x = 0)
      dummyWing.position.set(pose.x, pose.y, pose.z);
      localQuat.setFromAxisAngle(Z_AXIS, -pose.wingFlap);
      dummyWing.quaternion.copy(bodyQuat).multiply(localQuat);
      dummyWing.scale.set(s, s, s);
      dummyWing.updateMatrix();
      lw.setMatrixAt(i, dummyWing.matrix);

      // Right wing mirrored flap around local Z axis
      localQuat.setFromAxisAngle(Z_AXIS, pose.wingFlap);
      dummyWing.quaternion.copy(bodyQuat).multiply(localQuat);
      dummyWing.updateMatrix();
      rw.setMatrixAt(i, dummyWing.matrix);
    }

    body.instanceMatrix.needsUpdate = true;
    lw.instanceMatrix.needsUpdate = true;
    rw.instanceMatrix.needsUpdate = true;
  });

  if (specs.length === 0) return null;

  return (
    <group name="GardenButterflies">
      <instancedMesh
        ref={bodyRef}
        args={[undefined, undefined, specs.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.011, 0.015, 0.125, 5]} />
        <meshStandardMaterial color="#2a2220" roughness={0.65} />
      </instancedMesh>

      <instancedMesh
        ref={leftWingRef}
        args={[leftWingGeo, undefined, specs.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#ffffff"
          emissive={sunlit ? '#33282c' : '#554450'}
          emissiveIntensity={sunlit ? 0.14 : 0.42}
          roughness={0.45}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      <instancedMesh
        ref={rightWingRef}
        args={[rightWingGeo, undefined, specs.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#ffffff"
          emissive={sunlit ? '#33282c' : '#554450'}
          emissiveIntensity={sunlit ? 0.14 : 0.42}
          roughness={0.45}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
