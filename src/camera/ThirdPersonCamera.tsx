import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import {
  CAMERA_SMOOTHNESS,
  CAMERA_HEIGHT_OFFSET,
  PLAYER_HEIGHT,
} from '../utils/constants';

export default function ThirdPersonCamera() {
  const { camera, gl } = useThree();
  const {
    playerPosition,
    cameraAngleX,
    cameraAngleY,
    cameraDistance,
    cameraMode,
    setCameraAngle,
    setCameraDistance,
    isMobile,
  } = useGameStore();

  const isPointerDown = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3(0, 5, 10));

  // Mouse/touch handlers for camera rotation
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Don't start camera rotation if clicking on UI elements
      const target = e.target as HTMLElement;
      if (target.closest('.ui-overlay')) return;

      if (e.button === 0 || e.pointerType === 'touch') {
        // For desktop: only right-click or if no UI overlay
        if (!isMobile && e.button !== 2 && e.button !== 0) return;
        isPointerDown.current = true;
        previousPointer.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isMobile]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPointerDown.current) return;

      const deltaX = e.clientX - previousPointer.current.x;
      const deltaY = e.clientY - previousPointer.current.y;

      const sensitivity = isMobile ? 0.004 : 0.003;

      setCameraAngle(
        cameraAngleX - deltaX * sensitivity,
        cameraAngleY + deltaY * sensitivity
      );

      previousPointer.current = { x: e.clientX, y: e.clientY };
    },
    [cameraAngleX, cameraAngleY, setCameraAngle, isMobile]
  );

  const handlePointerUp = useCallback(() => {
    isPointerDown.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setCameraDistance(cameraDistance + e.deltaY * 0.005);
    },
    [cameraDistance, setCameraDistance]
  );

  // Touch pinch zoom
  const touchesRef = useRef<Touch[]>([]);
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchesRef.current = Array.from(e.touches);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && touchesRef.current.length === 2) {
        const prevDist = Math.hypot(
          touchesRef.current[0].clientX - touchesRef.current[1].clientX,
          touchesRef.current[0].clientY - touchesRef.current[1].clientY
        );
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = prevDist - curDist;
        setCameraDistance(cameraDistance + delta * 0.02);
      }
      touchesRef.current = Array.from(e.touches);
    },
    [cameraDistance, setCameraDistance]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Prevent context menu on right click
    const preventContext = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', preventContext);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
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

  useFrame(() => {
    if (cameraMode === 'third-person') {
      // Calculate target camera position
      const offset = new THREE.Vector3(
        Math.sin(cameraAngleX) * Math.cos(cameraAngleY) * cameraDistance,
        Math.sin(cameraAngleY) * cameraDistance + CAMERA_HEIGHT_OFFSET,
        Math.cos(cameraAngleX) * Math.cos(cameraAngleY) * cameraDistance
      );

      targetPosition.current.copy(playerPosition).add(offset);

      // Smooth camera movement
      currentPosition.current.lerp(targetPosition.current, CAMERA_SMOOTHNESS);

      camera.position.copy(currentPosition.current);

      // Look at player
      const lookTarget = new THREE.Vector3(
        playerPosition.x,
        playerPosition.y + PLAYER_HEIGHT * 0.6,
        playerPosition.z
      );
      camera.lookAt(lookTarget);
    } else {
      // First person mode
      camera.position.set(
        playerPosition.x,
        playerPosition.y + PLAYER_HEIGHT * 0.9,
        playerPosition.z
      );

      const lookDir = new THREE.Vector3(
        -Math.sin(cameraAngleX),
        -Math.sin(cameraAngleY) * 0.5,
        -Math.cos(cameraAngleX)
      );
      camera.lookAt(camera.position.clone().add(lookDir));
    }
  });

  return null;
}
