import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export default function MobileControls() {
  const { isMobile, setJoystickInput } = useGameStore();
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const joystickSize = 60;

  const handleJoystickStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      const rect = joystickRef.current?.getBoundingClientRect();
      if (rect) {
        joystickCenter.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      setJoystickActive(true);
    },
    []
  );

  const handleJoystickMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!joystickActive) return;

      const touch = e.touches[0];
      let dx = touch.clientX - joystickCenter.current.x;
      let dy = touch.clientY - joystickCenter.current.y;

      // Clamp to joystick bounds
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > joystickSize) {
        dx = (dx / dist) * joystickSize;
        dy = (dy / dist) * joystickSize;
      }

      // Normalize to -1 to 1
      const normalX = dx / joystickSize;
      const normalY = dy / joystickSize;

      setJoystickInput({ x: normalX, y: normalY });

      // Move knob visually
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    },
    [joystickActive, setJoystickInput]
  );

  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    setJoystickInput({ x: 0, y: 0 });
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, [setJoystickInput]);

  const handleInteract = useCallback(() => {
    // Simulate E key press
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }));
    }, 100);
  }, []);

  const handleJump = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    }, 150);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="ui-overlay" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      pointerEvents: 'none',
      zIndex: 100,
      touchAction: 'none',
    }}>
      {/* Joystick */}
      <div
        ref={joystickRef}
        style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          width: joystickSize * 2 + 20,
          height: joystickSize * 2 + 20,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div
          ref={knobRef}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            border: '2px solid rgba(255,255,255,0.6)',
            transition: joystickActive ? 'none' : 'transform 0.2s ease',
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 15,
        pointerEvents: 'auto',
      }}>
        {/* Interact button */}
        <button
          onClick={handleInteract}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(200, 165, 90, 0.4)',
            border: '2px solid rgba(200, 165, 90, 0.7)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          E
        </button>

        {/* Jump button */}
        <button
          onClick={handleJump}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
