import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
  interact: boolean;
}

export function useInput() {
  const inputRef = useRef<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    run: false,
    interact: false,
  });

  const joystickInput = useGameStore((s) => s.joystickInput);
  const isMobile = useGameStore((s) => s.isMobile);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        inputRef.current.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        inputRef.current.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        inputRef.current.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        inputRef.current.right = true;
        break;
      case 'Space':
        inputRef.current.jump = true;
        e.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        inputRef.current.run = true;
        break;
      case 'KeyE':
        inputRef.current.interact = true;
        break;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        inputRef.current.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        inputRef.current.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        inputRef.current.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        inputRef.current.right = false;
        break;
      case 'Space':
        inputRef.current.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        inputRef.current.run = false;
        break;
      case 'KeyE':
        inputRef.current.interact = false;
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const getInput = useCallback((): InputState => {
    if (isMobile) {
      return {
        forward: joystickInput.y < -0.2,
        backward: joystickInput.y > 0.2,
        left: joystickInput.x < -0.2,
        right: joystickInput.x > 0.2,
        jump: inputRef.current.jump,
        run: Math.abs(joystickInput.x) > 0.8 || Math.abs(joystickInput.y) > 0.8,
        interact: inputRef.current.interact,
      };
    }
    return { ...inputRef.current };
  }, [isMobile, joystickInput]);

  return { getInput, inputRef };
}
