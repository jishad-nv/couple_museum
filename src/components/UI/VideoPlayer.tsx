import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { VIDEO_CONFIG } from '../../utils/constants';

export default function VideoPlayer() {
  const { showVideoPlayer, setShowVideoPlayer } = useGameStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setShowVideoPlayer(false);
  }, [setShowVideoPlayer]);

  if (!showVideoPlayer) return null;

  return (
    <AnimatePresence>
      {showVideoPlayer && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="ui-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              width: 40,
              height: 40,
              borderRadius: '50%',
              fontSize: 20,
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ✕
          </button>

          {/* Video container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={{
              width: '80vw',
              maxWidth: 900,
              borderRadius: 8,
              overflow: 'hidden',
              background: '#000',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Video element */}
            <div
              style={{
                width: '100%',
                aspectRatio: '16/9',
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              >
                <source src={VIDEO_CONFIG.src} type="video/mp4" />
              </video>

              {/* Play overlay */}
              {!isPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    <span style={{ fontSize: 28, color: '#fff', marginLeft: 4 }}>▶</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Place video at public/videos/memories.mp4
                  </span>
                </div>
              )}
            </div>

            {/* Controls bar */}
            <div
              style={{
                padding: '10px 15px',
                background: '#1a1a2e',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '0 5px',
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              {/* Time */}
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, minWidth: 40 }}>
                {formatTime(currentTime)}
              </span>

              {/* Progress bar */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  flex: 1,
                  height: 4,
                  appearance: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  accentColor: '#c8a55a',
                }}
              />

              {/* Duration */}
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, minWidth: 40 }}>
                {formatTime(duration)}
              </span>

              {/* Volume */}
              <span style={{ color: '#fff', fontSize: 14 }}>🔊</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolume}
                style={{
                  width: 60,
                  height: 4,
                  appearance: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  accentColor: '#c8a55a',
                }}
              />

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                {isFullscreen ? '⊠' : '⛶'}
              </button>
            </div>
          </motion.div>

          {/* Title */}
          <p
            style={{
              marginTop: 20,
              color: '#c8a55a',
              fontSize: 16,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
            }}
          >
            🎬 Our Memories Together
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
