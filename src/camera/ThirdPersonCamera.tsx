import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { PLAYER_HEIGHT } from '../utils/constants';
import {
  CAMERA_BOUNDS,
  clampCameraDistance,
  clampCameraPitch,
  getCameraColliders,
} from '../utils/museumLayout';

export default function ThirdPersonCamera() {
  const { camera, gl } = useThree();
  const isMobile = useGameStore((s) => s.isMobile);

  const isPointerDown = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  const currentPosition = useRef(new THREE.Vector3(0, 2.15, 17.8));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.75, 12.5));

  // Pre-allocated scratch helpers (zero GC inside useFrame)
  const desiredOffset = useRef(new THREE.Vector3());
  const desiredPos = useRef(new THREE.Vector3());
  const rayOrigin = useRef(new THREE.Vector3());
  const rayDir = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  const handlePointerDown = useCallback((e: PointerEvent) => {
    const s = useGameStore.getState();
    if (s.showGuestbookModal || s.showPhotoViewer || s.showVideoPlayer) return;
    const target = e.target as HTMLElement;
    if (target.closest('.ui-overlay')) return;

    if (e.button === 0 || e.button === 2 || e.pointerType === 'touch') {
      isPointerDown.current = true;
      previousPointer.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPointerDown.current) return;
      const s = useGameStore.getState();

      const deltaX = e.clientX - previousPointer.current.x;
      const deltaY = e.clientY - previousPointer.current.y;
      const sensitivity = isMobile ? 0.0045 : 0.0035;

      s.setCameraAngle(
        s.cameraAngleX - deltaX * sensitivity,
        clampCameraPitch(s.cameraAngleY + deltaY * sensitivity)
      );

      previousPointer.current = { x: e.clientX, y: e.clientY };
    },
    [isMobile]
  );

  const handlePointerUp = useCallback(() => {
    isPointerDown.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    const s = useGameStore.getState();
    if (s.showGuestbookModal || s.showPhotoViewer || s.showVideoPlayer) return;
    e.preventDefault();
    s.setCameraDistance(clampCameraDistance(s.cameraDistance + e.deltaY * 0.004));
  }, []);

  const touchesRef = useRef<Touch[]>([]);
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchesRef.current = Array.from(e.touches);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && touchesRef.current.length === 2) {
      const prevDist = Math.hypot(
        touchesRef.current[0].clientX - touchesRef.current[1].clientX,
        touchesRef.current[0].clientY - touchesRef.current[1].clientY
      );
      const curDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const s = useGameStore.getState();
      s.setCameraDistance(clampCameraDistance(s.cameraDistance + (prevDist - curDist) * 0.015));
    }
    touchesRef.current = Array.from(e.touches);
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const preventContext = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', preventContext);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('contextmenu', preventContext);
    };
  }, [
    gl,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
  ]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = useGameStore.getState();
    const pPos = s.playerPosition;
    const partnerPos = s.partnerPosition;

    // Frame the couple midpoint when together so both stay cleanly visible
    const partnerDist = Math.hypot(pPos.x - partnerPos.x, pPos.z - partnerPos.z);
    const frameCouple = (s.isHoldingHands || s.isSitting || s.activeCoupleSequence !== 'none') && partnerDist < 2.2;
    const anchorX = frameCouple ? (pPos.x + partnerPos.x) * 0.5 : pPos.x;
    const anchorZ = frameCouple ? (pPos.z + partnerPos.z) * 0.5 : pPos.z;
    const anchorY = pPos.y;

    if (s.cameraMode === 'third-person') {
      const dist = clampCameraDistance(s.cameraDistance);
      const pitch = clampCameraPitch(s.cameraAngleY);
      const yaw = s.cameraAngleX;

      desiredOffset.current.set(
        Math.sin(yaw) * Math.cos(pitch) * dist,
        Math.sin(pitch) * dist,
        Math.cos(yaw) * Math.cos(pitch) * dist
      );

      rayOrigin.current.set(anchorX, anchorY + 1.45, anchorZ);
      desiredPos.current.copy(rayOrigin.current).add(desiredOffset.current);

      // Raycast against architectural walls/doors/pillars so camera never passes through walls
      rayDir.current.copy(desiredPos.current).sub(rayOrigin.current);
      const maxRayLen = rayDir.current.length();
      if (maxRayLen > 0.01) {
        rayDir.current.divideScalar(maxRayLen);
        raycaster.current.set(rayOrigin.current, rayDir.current);
        raycaster.current.far = maxRayLen;

        const colliders = getCameraColliders();
        if (colliders.length > 0) {
          const hits = raycaster.current.intersectObjects(colliders, false);
          if (hits.length > 0 && hits[0].distance < maxRayLen) {
            // Pull camera forward in front of hit wall, clearing character shoulders without crossing walls
            const safeDist = Math.max(0.55, hits[0].distance - 0.35);
            desiredPos.current.copy(rayOrigin.current).addScaledVector(rayDir.current, safeDist);
          }
        }
      }

      // Clamp height above ground and below indoor ceiling
      desiredPos.current.y = Math.max(CAMERA_BOUNDS.minHeight, desiredPos.current.y);
      if (s.currentRoom !== 'exterior' && s.currentRoom !== 'garden') {
        desiredPos.current.y = Math.min(4.85, desiredPos.current.y);
      }

      const lookYOffset =
        s.currentRoom === 'exterior' ? 1.85 : s.currentRoom === 'garden' ? 1.66 : 1.52;
      lookTarget.current.set(anchorX, anchorY + lookYOffset, anchorZ);

      if (currentPosition.current.distanceTo(desiredPos.current) > 10) {
        currentPosition.current.copy(desiredPos.current);
        currentLookAt.current.copy(lookTarget.current);
      } else {
        const damp = 1 - Math.exp(-9 * delta);
        currentPosition.current.lerp(desiredPos.current, damp);
        currentLookAt.current.lerp(lookTarget.current, 1 - Math.exp(-12 * delta));
      }

      camera.position.copy(currentPosition.current);
      camera.lookAt(currentLookAt.current);
    } else {
      camera.position.set(pPos.x, pPos.y + PLAYER_HEIGHT * 0.9, pPos.z);
      lookTarget.current.set(
        pPos.x - Math.sin(s.cameraAngleX),
        pPos.y + PLAYER_HEIGHT * 0.9 - Math.sin(s.cameraAngleY) * 0.5,
        pPos.z - Math.cos(s.cameraAngleX)
      );
      camera.lookAt(lookTarget.current);
    }
  });

  return null;
}
