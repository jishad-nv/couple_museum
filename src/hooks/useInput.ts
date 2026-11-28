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
  const showGuestbookModal = useGameStore((s) => s.showGuestbookModal);
  const showPhotoViewer = useGameStore((s) => s.showPhotoViewer);
  const showVideoPlayer = useGameStore((s) => s.showVideoPlayer);
  const showLoveAlbum = useGameStore((s) => s.showLoveAlbum);
  const showProposalModal = useGameStore((s) => s.showProposalModal);
  const showDoYouLoveMeModal = useGameStore((s) => s.showDoYouLoveMeModal);
  const showLoveQuizModal = useGameStore((s) => s.showLoveQuizModal);
  const showPrivateMemoryModal = useGameStore((s) => s.showPrivateMemoryModal);
  const showSecretLetterModal = useGameStore((s) => s.showSecretLetterModal);
  const showPasswordModal = useGameStore((s) => s.showPasswordModal);
  const showAdminLogin = useGameStore((s) => s.showAdminLogin);
  const showAdminPanel = useGameStore((s) => s.showAdminPanel);
  const showGenderModal = useGameStore((s) => s.showGenderModal);
  const showBouquetCreator = useGameStore((s) => s.showBouquetCreator);
  const hasAnsweredGenderPrompt = useGameStore(
    (s) => s.hasAnsweredGenderPrompt
  );
  const isAnyModalOpen =
    showGuestbookModal ||
    showPhotoViewer ||
    showVideoPlayer ||
    showLoveAlbum ||
    showProposalModal ||
    showDoYouLoveMeModal ||
    showLoveQuizModal ||
    showPrivateMemoryModal ||
    showSecretLetterModal ||
    showPasswordModal ||
    showAdminLogin ||
    showAdminPanel ||
    showGenderModal ||
    showBouquetCreator ||
    !hasAnsweredGenderPrompt;

  const clearInputs = useCallback(() => {
    inputRef.current.forward = false;
    inputRef.current.backward = false;
    inputRef.current.left = false;
    inputRef.current.right = false;
    inputRef.current.jump = false;
    inputRef.current.run = false;
    inputRef.current.interact = false;
  }, []);

  const isTypingInForm = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      el.isContentEditable
    );
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = useGameStore.getState();
    if (
      s.showGuestbookModal ||
      s.showPhotoViewer ||
      s.showVideoPlayer ||
      s.showLoveAlbum ||
      s.showProposalModal ||
      s.showDoYouLoveMeModal ||
      s.showLoveQuizModal ||
      s.showPrivateMemoryModal ||
      s.showSecretLetterModal ||
      s.showPasswordModal ||
      s.showAdminLogin ||
      s.showAdminPanel ||
      s.showGenderModal ||
      s.showBouquetCreator ||
      !s.hasAnsweredGenderPrompt ||
      isTypingInForm(e.target)
    ) {
      return;
    }

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
    if (isAnyModalOpen) {
      clearInputs();
    }
  }, [isAnyModalOpen, clearInputs]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) clearInputs();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [handleKeyDown, handleKeyUp, clearInputs]);

  const getInput = useCallback((): InputState => {
    const s = useGameStore.getState();
    if (
      s.showGuestbookModal ||
      s.showPhotoViewer ||
      s.showVideoPlayer ||
      s.showLoveAlbum ||
      s.showProposalModal ||
      s.showDoYouLoveMeModal ||
      s.showLoveQuizModal ||
      s.showPrivateMemoryModal ||
      s.showSecretLetterModal ||
      s.showPasswordModal ||
      s.showAdminLogin ||
      s.showAdminPanel ||
      s.showGenderModal ||
      s.showBouquetCreator ||
      !s.hasAnsweredGenderPrompt
    ) {
      return {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        run: false,
        interact: false,
      };
    }
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
