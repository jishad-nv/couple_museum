import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { VIDEO_CONFIG, COLORS } from '../../utils/constants';
import { isRealVideoUrl } from '../../world/objects/CinemaScreen';

const CHAPTERS = [
  { title: 'Our First Holidays Together', subtitle: 'Golden Coast Dusk', c1: '#231942', c2: '#be6e7c', c3: '#f4c095' },
  { title: 'Mountain Train Mornings', subtitle: 'Misty Valleys', c1: '#1d2d44', c2: '#7a5c58', c3: '#e8c49a' },
  { title: 'Lanterns Over the Harbor', subtitle: 'Wishes & Starlight', c1: '#0f162b', c2: '#3f3d6e', c3: '#f2be6b' },
  { title: 'Forever Ahead of Us', subtitle: 'Every Journey Hand in Hand', c1: '#2a1829', c2: '#8a3959', c3: '#f3d08a' },
];

export default function VideoPlayer() {
  const showVideoPlayer = useGameStore((s) => s.showVideoPlayer);
  const setShowVideoPlayer = useGameStore((s) => s.setShowVideoPlayer);
  const videos = useGameStore((s) => s.videos);
  const textsMap = useGameStore((s) => s.textsMap);
  const cinemaPlaying = useGameStore((s) => s.cinemaPlaying);
  const setCinemaPlaying = useGameStore((s) => s.setCinemaPlaying);
  const cinemaTime = useGameStore((s) => s.cinemaTime);
  const setCinemaTime = useGameStore((s) => s.setCinemaTime);
  const cinemaDuration = useGameStore((s) => s.cinemaDuration);
  const replayCinema = useGameStore((s) => s.replayCinema);

  const theatreDefault = useMemo(
    () => videos.find((v) => v.isTheatreActive) ?? videos[0] ?? null,
    [videos]
  );
  const playableVideos = useMemo(
    () => videos.filter((v) => v.isTheatreActive || v.isStoryVideo),
    [videos]
  );

  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const activeVideo = useMemo(
    () => videos.find((v) => v.id === selectedVideoId) ?? theatreDefault,
    [videos, selectedVideoId, theatreDefault]
  );

  const isRealVideo = activeVideo ? isRealVideoUrl(activeVideo.videoSrc) : false;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(0.75);
  const [realTime, setRealTime] = useState(0);
  const [realDuration, setRealDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync default selection when Theatre opens
  useEffect(() => {
    if (showVideoPlayer) {
      setSelectedVideoId(theatreDefault?.id ?? '');
      setCinemaPlaying(true);
    }
  }, [showVideoPlayer, theatreDefault?.id, setCinemaPlaying]);

  // Sync native HTML5 <video> element playback & volume
  useEffect(() => {
    const vid = videoElRef.current;
    if (!showVideoPlayer || !isRealVideo || !vid) return;
    vid.volume = volume;
    if (cinemaPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [showVideoPlayer, isRealVideo, cinemaPlaying, volume, activeVideo?.id]);

  // Draw live memory film synced with shared cinema clock when using built-in chapter reel
  useEffect(() => {
    if (!showVideoPlayer || isRealVideo) return;
    let rafId = 0;

    const renderFrame = () => {
      const c = canvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) {
          const s = useGameStore.getState();
          const t = s.cinemaTime;
          const idx = Math.floor((t / s.cinemaDuration) * CHAPTERS.length) % CHAPTERS.length;
          const ch = CHAPTERS[idx];
          const displayTitle =
            idx === 0 && activeVideo?.title ? activeVideo.title : ch.title;
          const displaySub =
            idx === 0 && activeVideo?.subtitle ? activeVideo.subtitle : ch.subtitle;

          const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
          grad.addColorStop(0, ch.c1);
          grad.addColorStop(0.55, ch.c2);
          grad.addColorStop(1, ch.c3);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, c.width, c.height);

          for (let i = 0; i < 16; i++) {
            const bx = ((i * 89 + t * (14 + (i % 4) * 5)) % (c.width + 40)) - 20;
            const by = 70 + ((i * 53) % 240) + Math.sin(t + i) * 9;
            ctx.fillStyle = 'rgba(255, 240, 200, 0.28)';
            ctx.beginPath();
            ctx.arc(bx, by, 7 + (i % 4) * 3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = 'rgba(18, 10, 24, 0.55)';
          ctx.fillRect(0, c.height * 0.72, c.width, c.height * 0.28);

          const cx = c.width * 0.5;
          const cy = c.height * 0.72;
          ctx.fillStyle = 'rgba(14, 8, 20, 0.92)';
          ctx.beginPath();
          ctx.arc(cx - 18, cy - 58, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(cx - 28, cy - 47, 20, 47);
          ctx.beginPath();
          ctx.arc(cx + 18, cy - 53, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(cx + 9, cy - 42, 18, 42);

          ctx.fillStyle = 'rgba(255, 246, 230, 0.96)';
          ctx.font = 'italic 32px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(displayTitle, cx, 145);

          ctx.fillStyle = 'rgba(232, 205, 145, 0.92)';
          ctx.font = '18px Georgia, serif';
          ctx.fillText(displaySub, cx, 182);
        }
      }
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [showVideoPlayer, isRealVideo, activeVideo?.title, activeVideo?.subtitle]);

  const togglePlay = useCallback(() => {
    setCinemaPlaying(!cinemaPlaying);
  }, [cinemaPlaying, setCinemaPlaying]);

  const handleReplay = useCallback(() => {
    if (isRealVideo && videoElRef.current) {
      videoElRef.current.currentTime = 0;
      setRealTime(0);
      setCinemaPlaying(true);
      videoElRef.current.play().catch(() => {});
    } else {
      replayCinema();
    }
  }, [isRealVideo, replayCinema, setCinemaPlaying]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (isRealVideo && videoElRef.current) {
        videoElRef.current.currentTime = val;
        setRealTime(val);
      } else {
        setCinemaTime(val);
      }
    },
    [isRealVideo, setCinemaTime]
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setShowVideoPlayer(false);
  }, [setShowVideoPlayer]);

  useEffect(() => {
    if (!showVideoPlayer) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showVideoPlayer, handleClose]);

  const formatTime = (t: number) => {
    const safe = Number.isFinite(t) && t >= 0 ? t : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showVideoPlayer) return null;

  const displayedTime = isRealVideo ? realTime : cinemaTime;
  const displayedDuration = isRealVideo ? Math.max(realDuration, 1) : cinemaDuration;
  const headingTitle =
    activeVideo?.title || textsMap.theatre_film_heading || VIDEO_CONFIG.title;

  return (
    <AnimatePresence>
      {showVideoPlayer && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="video-player-modal"
          className="ui-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 5, 12, 0.94)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            data-testid="btn-close-video-player"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(200, 165, 90, 0.16)',
              border: `1px solid ${COLORS.gold}`,
              color: '#fff4d6',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            Close ✕
          </button>

          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: 'min(92vw, 900px)',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#120b18',
              border: `1px solid ${COLORS.gold}`,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              onClick={togglePlay}
              style={{
                width: '100%',
                aspectRatio: '16/9',
                position: 'relative',
                cursor: 'pointer',
                background: '#09050c',
              }}
            >
              {isRealVideo && activeVideo ? (
                <video
                  ref={videoElRef}
                  src={activeVideo.videoSrc}
                  playsInline
                  loop
                  onTimeUpdate={(e) => setRealTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setRealDuration(e.currentTarget.duration || 0)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={450}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              )}

              {!cinemaPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      background: 'rgba(200, 165, 90, 0.85)',
                      color: '#1a0f1d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    ▶
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '12px 16px',
                background: '#1b1124',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  background: 'rgba(200, 165, 90, 0.2)',
                  border: `1px solid ${COLORS.gold}`,
                  borderRadius: 6,
                  color: '#fff4d6',
                  fontSize: 12,
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                {cinemaPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <button
                type="button"
                onClick={handleReplay}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#f5efe6',
                  fontSize: 12,
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                ↺ Replay
              </button>

              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                {formatTime(displayedTime)} / {formatTime(displayedDuration)}
              </span>

              <input
                type="range"
                min={0}
                max={displayedDuration}
                step={0.1}
                value={Math.min(displayedTime, displayedDuration)}
                onChange={handleSeek}
                aria-label="Seek memory film"
                style={{ flex: 1, minWidth: 100, accentColor: COLORS.gold, cursor: 'pointer' }}
              />

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume"
                style={{ width: 64, accentColor: COLORS.gold, cursor: 'pointer' }}
              />

              <button
                type="button"
                onClick={toggleFullscreen}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13,
                  padding: '4px 9px',
                  cursor: 'pointer',
                }}
              >
                {isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen'}
              </button>
            </div>
          </motion.div>

          <p
            style={{
              marginTop: 14,
              marginBottom: 4,
              color: COLORS.goldLight,
              fontSize: 16,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              textAlign: 'center',
            }}
          >
            {headingTitle}
          </p>
          {activeVideo?.description && (
            <p
              style={{
                margin: 0,
                maxWidth: 680,
                color: 'rgba(247, 241, 230, 0.72)',
                fontSize: 12,
                textAlign: 'center',
                fontFamily: 'Georgia, serif',
              }}
            >
              {activeVideo.description}
            </p>
          )}

          {playableVideos.length > 1 && (
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {playableVideos.map((vid) => {
                const selected = vid.id === activeVideo?.id;
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => {
                      setSelectedVideoId(vid.id);
                      setRealTime(0);
                      setCinemaPlaying(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: selected ? `1px solid ${COLORS.gold}` : '1px solid rgba(200, 165, 90, 0.3)',
                      background: selected ? 'rgba(200, 165, 90, 0.24)' : 'rgba(24, 15, 30, 0.9)',
                      color: '#fff4d8',
                      fontSize: 12,
                      fontFamily: 'Georgia, serif',
                      cursor: 'pointer',
                    }}
                  >
                    {vid.title}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
