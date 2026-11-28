import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { playBouquetRustleSound } from '../../utils/bouquetAudio';
import {
  FLOWER_OPTIONS,
  MAX_BOUQUET_FLOWERS,
  RIBBON_COLOR_OPTIONS,
  RIBBON_STYLE_OPTIONS,
  addFlowerToSelection,
  getFlowerOption,
  getRibbonColorOption,
  normalizeBouquetDesign,
  removeFlowerAtIndex,
  replaceFlowerAtIndex,
  type FlowerChoiceId,
  type LetterMode,
  type RibbonColorId,
  type RibbonStyleId,
} from '../../utils/bouquet';

interface InkPoint {
  x: number;
  y: number;
}

type InkStroke = InkPoint[];

const DECKLE_TOP_POINTS =
  '0,14 0,6 18,9 36,4 58,10 80,5 104,9 128,3 152,8 176,5 204,10 228,4 256,9 282,5 310,9 338,4 366,8 394,5 424,10 454,4 484,9 514,5 544,9 576,3 606,8 636,5 668,10 698,4 730,9 762,5 786,8 800,5 800,14';

const DECKLE_BOTTOM_POINTS =
  '0,0 800,0 800,8 778,5 748,10 718,4 686,9 656,5 624,10 594,4 562,9 532,5 500,10 470,4 438,9 408,5 376,10 346,4 316,9 286,5 254,10 224,4 192,9 162,5 130,10 98,5 68,9 38,4 16,8 0,5';

const ARRANGEMENT_LAYOUTS: Record<
  number,
  ReadonlyArray<{ leftPct: number; topPct: number; sizePct: number; rotDeg: number; z: number }>
> = {
  1: [{ leftPct: 50, topPct: 33, sizePct: 54, rotDeg: 0, z: 3 }],
  2: [
    { leftPct: 37, topPct: 34, sizePct: 48, rotDeg: -12, z: 2 },
    { leftPct: 63, topPct: 34, sizePct: 48, rotDeg: 12, z: 3 },
  ],
  3: [
    { leftPct: 31, topPct: 37, sizePct: 44, rotDeg: -18, z: 2 },
    { leftPct: 69, topPct: 37, sizePct: 44, rotDeg: 18, z: 2 },
    { leftPct: 50, topPct: 27, sizePct: 48, rotDeg: 0, z: 4 },
  ],
  4: [
    { leftPct: 28, topPct: 39, sizePct: 41, rotDeg: -22, z: 2 },
    { leftPct: 72, topPct: 39, sizePct: 41, rotDeg: 22, z: 2 },
    { leftPct: 43, topPct: 26, sizePct: 45, rotDeg: -7, z: 3 },
    { leftPct: 58, topPct: 29, sizePct: 44, rotDeg: 9, z: 4 },
  ],
};

function FlowerPngImage({
  flowerId,
  size,
  style,
}: {
  flowerId: FlowerChoiceId;
  size: number | string;
  style?: React.CSSProperties;
}) {
  const opt = getFlowerOption(flowerId);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={opt.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${opt.accentHex}, ${opt.primaryHex})`,
          border: '1px solid rgba(56, 36, 32, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2A1D19',
          fontSize: 10,
          ...style,
        }}
      >
        {opt.name.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={opt.imagePath}
      alt={opt.name}
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

function LiveBouquetPreview({
  flowers,
  ribbonStyle,
  ribbonColor,
  compact,
  isDropHover,
}: {
  flowers: FlowerChoiceId[];
  ribbonStyle: RibbonStyleId;
  ribbonColor: RibbonColorId;
  compact: boolean;
  isDropHover: boolean;
}) {
  const ribbon = getRibbonColorOption(ribbonColor);

  if (flowers.length === 0) {
    return (
      <div
        data-testid="bouquet-empty-preview"
        style={{
          width: '100%',
          height: compact ? 124 : 206,
          borderRadius: 6,
          border: isDropHover
            ? '1.5px dashed #8F2544'
            : '1.5px dashed rgba(145, 118, 78, 0.5)',
          background: isDropHover ? 'rgba(143, 37, 68, 0.05)' : '#FCF9F1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: compact ? 8 : 12,
          transition: 'border-color 0.15s ease, background 0.15s ease',
        }}
      >
        <svg
          viewBox="0 0 120 120"
          aria-hidden="true"
          style={{ width: compact ? 46 : 74, height: compact ? 46 : 74, opacity: 0.48, marginBottom: 4 }}
        >
          <polygon
            points="28,48 92,48 68,98 52,98"
            fill="none"
            stroke="#9B7E52"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <line x1="60" y1="30" x2="60" y2="56" stroke="#9B7E52" strokeWidth="1.8" strokeDasharray="3 3" />
          <line x1="47" y1="43" x2="73" y2="43" stroke="#9B7E52" strokeWidth="1.8" strokeDasharray="3 3" />
        </svg>
        <div style={{ fontSize: compact ? 11.5 : 12.5, color: '#4E3C35', lineHeight: 1.35 }}>
          Tap or drag flowers here
        </div>
        <div style={{ fontSize: 10.5, color: '#8A7363', marginTop: 2 }}>
          0 of {MAX_BOUQUET_FLOWERS} blooms selected
        </div>
      </div>
    );
  }

  const coords = ARRANGEMENT_LAYOUTS[Math.min(4, flowers.length)] ?? ARRANGEMENT_LAYOUTS[4];

  return (
    <div
      data-testid="bouquet-live-preview"
      aria-label={`Live bouquet with ${flowers.map((f) => getFlowerOption(f).name).join(', ')} and ${ribbon.name} ${ribbonStyle.replace('_', ' ')}`}
      style={{
        position: 'relative',
        width: '100%',
        height: compact ? 132 : 212,
        borderRadius: 6,
        border: isDropHover
          ? '1.5px solid #8F2544'
          : '1px solid rgba(176, 149, 108, 0.35)',
        background: isDropHover
          ? 'radial-gradient(circle at 50% 42%, #FFF9F2, #F8ECE5)'
          : 'radial-gradient(circle at 50% 42%, #FFFDF8, #F7EFE0)',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      {/* Back archival wrapping cone */}
      <svg
        viewBox="0 0 200 220"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <polygon
          points="38,94 162,94 114,186 86,186"
          fill="#EFE3CC"
          stroke="#D3BE9B"
          strokeWidth="1.5"
        />
        <polygon points="48,98 152,98 111,182 89,182" fill="#F8F0E0" />
        <g stroke="#4E7351" strokeWidth="3.5" strokeLinecap="round">
          <line x1="94" y1="178" x2="90" y2="208" />
          <line x1="100" y1="178" x2="100" y2="210" />
          <line x1="106" y1="178" x2="110" y2="208" />
        </g>
      </svg>

      {/* Exact selected flower PNG assets */}
      {flowers.map((flowerId, idx) => {
        const slot = coords[idx] ?? coords[coords.length - 1];
        return (
          <div
            key={`preview-bloom-${idx}-${flowerId}`}
            style={{
              position: 'absolute',
              left: `${slot.leftPct}%`,
              top: `${slot.topPct}%`,
              width: `${slot.sizePct}%`,
              aspectRatio: '1 / 1',
              transform: `translate(-50%, -50%) rotate(${slot.rotDeg}deg)`,
              zIndex: slot.z,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 3px 6px rgba(42, 24, 20, 0.16))',
            }}
          >
            <FlowerPngImage flowerId={flowerId} size="100%" />
          </div>
        );
      })}

      {/* Front paper wrap fold + live ribbon */}
      <svg
        viewBox="0 0 200 220"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      >
        <polygon
          points="60,118 140,118 113,184 87,184"
          fill="#FBF5E8"
          stroke="#DAC8A8"
          strokeWidth="1.3"
        />
        <rect
          x="84"
          y="156"
          width="32"
          height={ribbonStyle === 'velvet_wrap' ? 20 : 12}
          rx="4"
          fill={ribbon.hex}
          stroke="rgba(30,20,18,0.22)"
          strokeWidth="1"
        />

        {ribbonStyle === 'satin_bow' && (
          <g>
            <ellipse
              cx="83"
              cy="162"
              rx="13"
              ry="7"
              transform="rotate(-18 83 162)"
              fill={ribbon.hex}
              stroke={ribbon.trimHex}
              strokeWidth="1.2"
            />
            <ellipse
              cx="117"
              cy="162"
              rx="13"
              ry="7"
              transform="rotate(18 117 162)"
              fill={ribbon.hex}
              stroke={ribbon.trimHex}
              strokeWidth="1.2"
            />
            <circle cx="100" cy="162" r="5" fill={ribbon.trimHex} />
            <path d="M97 166 L86 196 L94 194 Z" fill={ribbon.hex} />
            <path d="M103 166 L114 196 L106 194 Z" fill={ribbon.hex} />
          </g>
        )}

        {ribbonStyle === 'velvet_wrap' && (
          <g>
            <line x1="85" y1="162" x2="115" y2="162" stroke={ribbon.trimHex} strokeWidth="1.6" />
            <line x1="85" y1="170" x2="115" y2="170" stroke={ribbon.trimHex} strokeWidth="1.6" />
            <path d="M96 174 L91 198 L100 194 L109 198 L104 174 Z" fill={ribbon.hex} />
          </g>
        )}

        {ribbonStyle === 'gold_cord' && (
          <g>
            <ellipse cx="100" cy="159" rx="17" ry="4" fill="none" stroke="#D9B25F" strokeWidth="2.4" />
            <ellipse cx="100" cy="166" rx="16" ry="4" fill="none" stroke="#F0D58A" strokeWidth="2.2" />
            <circle cx="100" cy="164" r="4" fill="#D9B25F" />
            <path d="M98 168 Q92 184 88 196" fill="none" stroke="#D9B25F" strokeWidth="2.2" />
            <path d="M102 168 Q108 184 112 196" fill="none" stroke="#D9B25F" strokeWidth="2.2" />
          </g>
        )}
      </svg>
    </div>
  );
}

function redrawStrokesOnCanvas(canvas: HTMLCanvasElement, strokes: InkStroke[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2B1B17';
  ctx.lineWidth = 3.2;

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    if (stroke.length === 1) {
      ctx.arc(stroke[0].x, stroke[0].y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = '#2B1B17';
      ctx.fill();
      continue;
    }
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length - 1; i++) {
      const midX = (stroke[i].x + stroke[i + 1].x) * 0.5;
      const midY = (stroke[i].y + stroke[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
}

export default function BouquetCreatorModal() {
  const showBouquetCreator = useGameStore((s) => s.showBouquetCreator);
  if (!showBouquetCreator) return null;
  return <BouquetCreatorSheet />;
}

function BouquetCreatorSheet() {
  const playerGender = useGameStore((s) => s.playerGender);
  const isMuted = useGameStore((s) => s.isMuted);
  const closeBouquetCreator = useGameStore((s) => s.closeBouquetCreator);
  const saveCreatedBouquet = useGameStore((s) => s.saveCreatedBouquet);

  // Always mounts empty every time a new bouquet creation modal opens
  const [selectedFlowers, setSelectedFlowers] = useState<FlowerChoiceId[]>([]);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [ribbonStyle, setRibbonStyle] = useState<RibbonStyleId>('satin_bow');
  const [ribbonColor, setRibbonColor] = useState<RibbonColorId>('champagne');
  const [letterMode, setLetterMode] = useState<LetterMode>('typed');
  const [message, setMessage] = useState<string>('');
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [handwrittenDataUrl, setHandwrittenDataUrl] = useState<string | null>(null);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [flowerNotice, setFlowerNotice] = useState<string | null>(null);
  const [isDropHover, setIsDropHover] = useState(false);
  const [draggingTouchFlower, setDraggingTouchFlower] = useState<{
    id: FlowerChoiceId;
    x: number;
    y: number;
  } | null>(null);
  const [viewport, setViewport] = useState(() =>
    typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 1440, height: 900 }
  );

  const dropzoneRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokeRef = useRef<InkStroke | null>(null);
  const strokesRef = useRef<InkStroke[]>([]);
  const isDrawingRef = useRef(false);
  const touchDragRef = useRef<{
    flowerId: FlowerChoiceId;
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Redraw canvas whenever handwritten mode becomes visible again
  useEffect(() => {
    if (letterMode !== 'handwritten' || showLetterPreview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    redrawStrokesOnCanvas(canvas, strokesRef.current);
  }, [letterMode, showLetterPreview, strokes]);

  const giverLabel = useMemo(
    () => (playerGender === 'boy' ? 'Boy to Girl' : 'Girl to Boy'),
    [playerGender]
  );

  const handleSelectOrDropFlower = useCallback(
    (flowerId: FlowerChoiceId, targetSlotIndex: number | null = null) => {
      playBouquetRustleSound(isMuted);
      const slotToReplace = targetSlotIndex ?? replaceTargetIndex;
      if (slotToReplace !== null) {
        setSelectedFlowers((prev) => replaceFlowerAtIndex(prev, slotToReplace, flowerId));
        setReplaceTargetIndex(null);
        setFlowerNotice(null);
        return;
      }

      setSelectedFlowers((prev) => {
        const result = addFlowerToSelection(prev, flowerId);
        if (!result.added && result.reason === 'max_reached') {
          setFlowerNotice(
            `Maximum ${MAX_BOUQUET_FLOWERS} flowers reached — remove or replace a bloom to swap.`
          );
          return prev;
        }
        setFlowerNotice(null);
        return result.next;
      });
    },
    [replaceTargetIndex, isMuted]
  );

  // Pointer-based touch drag support for mobile / tablet touch screens
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = touchDragRef.current;
      if (!state) return;
      const moved = Math.hypot(e.clientX - state.startX, e.clientY - state.startY);
      if (!state.active && moved > 10) {
        state.active = true;
      }
      if (state.active) {
        setDraggingTouchFlower({ id: state.flowerId, x: e.clientX, y: e.clientY });
        const rect = dropzoneRef.current?.getBoundingClientRect();
        if (
          rect &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          setIsDropHover(true);
        } else {
          setIsDropHover(false);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const state = touchDragRef.current;
      if (!state) return;
      touchDragRef.current = null;

      if (state.active) {
        suppressNextClickRef.current = true;
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 80);

        let droppedSlot: number | null = null;
        slotRefs.current.forEach((el, idx) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          ) {
            droppedSlot = idx;
          }
        });

        const dropRect = dropzoneRef.current?.getBoundingClientRect();
        const overDropzone =
          dropRect &&
          e.clientX >= dropRect.left &&
          e.clientX <= dropRect.right &&
          e.clientY >= dropRect.top &&
          e.clientY <= dropRect.bottom;

        if (droppedSlot !== null || overDropzone) {
          handleSelectOrDropFlower(state.flowerId, droppedSlot);
        }
      }

      setDraggingTouchFlower(null);
      setIsDropHover(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handleSelectOrDropFlower]);

  const isCompact = viewport.height <= 520 || viewport.width <= 720;
  const isSideBySide = viewport.width >= 560;

  const handleRemoveFlower = (index: number) => {
    playBouquetRustleSound(isMuted);
    setSelectedFlowers((prev) => removeFlowerAtIndex(prev, index));
    if (replaceTargetIndex === index) {
      setReplaceTargetIndex(null);
    } else if (replaceTargetIndex !== null && replaceTargetIndex > index) {
      setReplaceTargetIndex(replaceTargetIndex - 1);
    }
    setFlowerNotice(null);
  };

  const getCanvasPointFromClient = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number): InkPoint => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / Math.max(1, rect.width);
      const scaleY = canvas.height / Math.max(1, rect.height);
      return {
        x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
        y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY)),
      };
    },
    []
  );

  const finalizeCanvasStroke = useCallback((canvas: HTMLCanvasElement) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    isDrawingRef.current = false;
    const nextStrokes = [...strokesRef.current, activeStrokeRef.current];
    activeStrokeRef.current = null;
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
    redrawStrokesOnCanvas(canvas, nextStrokes);
    setHandwrittenDataUrl(nextStrokes.length > 0 ? canvas.toDataURL('image/png') : null);
  }, []);

  // Resilient window-level move/up fallback so synthetic PointerEvents or edge drags never throw or stall
  useEffect(() => {
    if (letterMode !== 'handwritten' || showLetterPreview) return;

    const handleWindowMove = (e: PointerEvent) => {
      if (!isDrawingRef.current || !activeStrokeRef.current || !canvasRef.current) return;
      const pt = getCanvasPointFromClient(canvasRef.current, e.clientX, e.clientY);
      const active = activeStrokeRef.current;
      const last = active[active.length - 1];
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 0.5) {
        active.push(pt);
        redrawStrokesOnCanvas(canvasRef.current, [...strokesRef.current, active]);
      }
    };

    const handleWindowUp = () => {
      if (!isDrawingRef.current || !canvasRef.current) return;
      finalizeCanvasStroke(canvasRef.current);
    };

    window.addEventListener('pointermove', handleWindowMove);
    window.addEventListener('pointerup', handleWindowUp);
    window.addEventListener('pointercancel', handleWindowUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowMove);
      window.removeEventListener('pointerup', handleWindowUp);
      window.removeEventListener('pointercancel', handleWindowUp);
    };
  }, [letterMode, showLetterPreview, getCanvasPointFromClient, finalizeCanvasStroke]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = e.currentTarget;
    const pt = getCanvasPointFromClient(canvas, e.clientX, e.clientY);
    isDrawingRef.current = true;
    activeStrokeRef.current = [pt];
    redrawStrokesOnCanvas(canvas, [...strokesRef.current, activeStrokeRef.current]);
    try {
      if (typeof canvas.setPointerCapture === 'function') {
        canvas.setPointerCapture(e.pointerId);
      }
    } catch {
      // Synthetic pointer events without an active browser pointerId use window fallback
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    e.preventDefault();
    const pt = getCanvasPointFromClient(e.currentTarget, e.clientX, e.clientY);
    activeStrokeRef.current.push(pt);
    redrawStrokesOnCanvas(e.currentTarget, [...strokesRef.current, activeStrokeRef.current]);
  };

  const handleUndoHandwriting = () => {
    const nextStrokes = strokesRef.current.slice(0, -1);
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
    if (canvasRef.current) {
      redrawStrokesOnCanvas(canvasRef.current, nextStrokes);
      setHandwrittenDataUrl(
        nextStrokes.length > 0 ? canvasRef.current.toDataURL('image/png') : null
      );
    } else if (nextStrokes.length === 0) {
      setHandwrittenDataUrl(null);
    }
  };

  const handleClearHandwriting = () => {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    isDrawingRef.current = false;
    setStrokes([]);
    setHandwrittenDataUrl(null);
    if (canvasRef.current) {
      redrawStrokesOnCanvas(canvasRef.current, []);
    }
  };

  const hasTypedLetter = message.trim().length > 0;
  const hasHandwrittenLetter = Boolean(handwrittenDataUrl);
  const canPreviewLetter =
    (letterMode === 'typed' && hasTypedLetter) ||
    (letterMode === 'handwritten' && hasHandwrittenLetter);

  const handleSubmit = () => {
    const design = normalizeBouquetDesign({
      flowers: selectedFlowers,
      ribbonStyle,
      ribbonColor,
      message,
      letterMode,
      handwrittenLetterDataUrl: handwrittenDataUrl,
      createdBy: playerGender ?? 'girl',
    });
    if (!design) {
      setFlowerNotice('Select at least one flower to create your bouquet.');
      return;
    }
    saveCreatedBouquet(design);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bouquet-sheet-title"
      data-testid="bouquet-creator-modal"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1250,
        background: 'rgba(18, 11, 16, 0.72)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isCompact ? '8px 12px' : '18px',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(96vw, 880px)',
          maxHeight: 'calc(100dvh - 16px)',
          display: 'flex',
          flexDirection: 'column',
          filter: 'drop-shadow(0 24px 52px rgba(0, 0, 0, 0.56))',
        }}
      >
        {/* Torn top archival paper deckle edge */}
        <svg
          viewBox="0 0 800 14"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ width: '100%', height: 11, display: 'block', flexShrink: 0 }}
        >
          <polygon points={DECKLE_TOP_POINTS} fill="#FBF7EE" />
        </svg>

        {/* Main paper sheet body */}
        <div
          style={{
            background: 'linear-gradient(180deg, #FBF7EE 0%, #F7F0E2 100%)',
            color: '#241B19',
            fontFamily: 'Georgia, serif',
            padding: isCompact ? '8px 16px 10px' : '18px 28px 18px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            borderLeft: '1px solid #DFD3BC',
            borderRight: '1px solid #DFD3BC',
          }}
        >
          {/* Paper Sheet Letterhead */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              borderBottom: '1px solid rgba(154, 126, 86, 0.35)',
              paddingBottom: isCompact ? 6 : 12,
              marginBottom: isCompact ? 8 : 14,
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: 1.6,
                  color: '#886734',
                  marginBottom: 2,
                }}
              >
                Atelier de Fleurs · {giverLabel}
              </div>
              <h2
                id="bouquet-sheet-title"
                style={{
                  margin: 0,
                  fontSize: isCompact ? 18 : 24,
                  fontWeight: 500,
                  color: '#241917',
                }}
              >
                Arrange Your Custom Bouquet
              </h2>
            </div>

            <button
              type="button"
              aria-label="Close bouquet creator"
              data-testid="btn-close-bouquet-creator"
              onClick={closeBouquetCreator}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid rgba(136, 103, 52, 0.38)',
                background: '#F4ECDC',
                color: '#3A2823',
                fontSize: 18,
                lineHeight: 1,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* 2-Column Responsive Atelier Sheet */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: !isSideBySide
                ? '1fr'
                : isCompact
                ? '220px 1fr'
                : '268px 1fr',
              gridTemplateRows: isSideBySide ? 'minmax(0, 1fr)' : 'auto',
              gap: isCompact ? 12 : 22,
              alignItems: isSideBySide ? 'stretch' : 'start',
              flex: 1,
              minHeight: 0,
              overflow: isSideBySide ? 'hidden' : 'auto',
              paddingRight: isSideBySide ? 0 : 2,
            }}
          >
            {/* Left Column: Bouquet Dropzone Preview + Remove/Replace Slots (pinned in view on side-by-side) */}
            <div
              ref={dropzoneRef}
              data-testid="bouquet-dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDropHover(true);
              }}
              onDragLeave={() => setIsDropHover(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDropHover(false);
                const droppedFlower = e.dataTransfer.getData('text/plain') as FlowerChoiceId;
                if (FLOWER_OPTIONS.some((f) => f.id === droppedFlower)) {
                  handleSelectOrDropFlower(droppedFlower);
                }
              }}
              style={{
                background: '#FFFDF7',
                border: '1px solid rgba(176, 149, 108, 0.4)',
                borderRadius: 6,
                padding: isCompact ? '8px 10px 10px' : '14px 16px 16px',
                maxHeight: isSideBySide ? '100%' : 'none',
                overflowY: isSideBySide ? 'auto' : 'visible',
                alignSelf: 'start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  color: '#856537',
                  marginBottom: 6,
                }}
              >
                <span>Bouquet Preview</span>
                <span data-testid="bouquet-flower-count">
                  {selectedFlowers.length}/{MAX_BOUQUET_FLOWERS}
                </span>
              </div>

              <LiveBouquetPreview
                flowers={selectedFlowers}
                ribbonStyle={ribbonStyle}
                ribbonColor={ribbonColor}
                compact={isCompact}
                isDropHover={isDropHover}
              />

              {/* Selected Flower Slots with Clear Remove & Replace Controls */}
              {selectedFlowers.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                  }}
                >
                  {selectedFlowers.map((flowerId, idx) => {
                    const opt = getFlowerOption(flowerId);
                    const isReplacing = replaceTargetIndex === idx;
                    return (
                      <div
                        key={`selected-slot-${idx}-${flowerId}`}
                        ref={(el) => {
                          slotRefs.current[idx] = el;
                        }}
                        data-testid={`bouquet-slot-${idx}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const droppedFlower = e.dataTransfer.getData(
                            'text/plain'
                          ) as FlowerChoiceId;
                          if (FLOWER_OPTIONS.some((f) => f.id === droppedFlower)) {
                            handleSelectOrDropFlower(droppedFlower, idx);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          padding: '4px 6px',
                          borderRadius: 5,
                          border: isReplacing
                            ? '1.5px solid #8F2544'
                            : '1px solid rgba(164, 138, 98, 0.3)',
                          background: isReplacing ? '#FDF2F4' : '#FAF5EA',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <FlowerPngImage flowerId={flowerId} size={22} />
                          <span
                            style={{
                              fontSize: 11,
                              color: '#2F211D',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {opt.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            type="button"
                            data-testid={`btn-replace-slot-${idx}`}
                            onClick={() =>
                              setReplaceTargetIndex((prev) => (prev === idx ? null : idx))
                            }
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1px solid rgba(136, 103, 52, 0.35)',
                              background: isReplacing ? '#8F2544' : '#FFFDF8',
                              color: isReplacing ? '#FFFDF8' : '#5D4437',
                              fontSize: 10,
                              fontFamily: 'Georgia, serif',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isReplacing ? 'Pick...' : 'Replace'}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${opt.name}`}
                            data-testid={`btn-remove-flower-${idx}`}
                            onClick={() => handleRemoveFlower(idx)}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 4,
                              border: '1px solid rgba(136, 103, 52, 0.3)',
                              background: '#FFFDF8',
                              color: '#6C2233',
                              fontSize: 13,
                              lineHeight: 1,
                              cursor: 'pointer',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedFlowers.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 7,
                    borderTop: '1px dashed rgba(164, 138, 98, 0.4)',
                    fontSize: 11,
                    color: '#5B4842',
                    lineHeight: 1.4,
                  }}
                >
                  Ribbon: {getRibbonColorOption(ribbonColor).name} ·{' '}
                  {RIBBON_STYLE_OPTIONS.find((r) => r.id === ribbonStyle)?.name}
                </div>
              )}
            </div>

            {/* Right Column: Flowers (PNG Tiles), Ribbon, Dual Personal Letter */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isCompact ? 10 : 14,
                maxHeight: isSideBySide ? '100%' : 'none',
                overflowY: isSideBySide ? 'auto' : 'visible',
                paddingRight: isSideBySide ? 4 : 0,
                minHeight: 0,
              }}
            >
              {/* 1. Flower Image Selection */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#332421' }}>
                    {replaceTargetIndex !== null
                      ? `Select a flower to replace slot ${replaceTargetIndex + 1}`
                      : `Choose up to ${MAX_BOUQUET_FLOWERS} Flowers (tap or drag)`}
                  </span>
                  {flowerNotice && (
                    <span
                      data-testid="bouquet-flower-limit-notice"
                      style={{ fontSize: 11, color: '#9E1F3A', fontWeight: 600 }}
                    >
                      {flowerNotice}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: isCompact ? 6 : 8,
                  }}
                >
                  {FLOWER_OPTIONS.map((opt) => {
                    const selectedCount = selectedFlowers.filter((f) => f === opt.id).length;
                    const atCap =
                      selectedFlowers.length >= MAX_BOUQUET_FLOWERS &&
                      replaceTargetIndex === null;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        draggable
                        data-testid={`btn-flower-${opt.id}`}
                        aria-label={`Add ${opt.name} to bouquet`}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', opt.id);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onPointerDown={(e) => {
                          if (e.pointerType === 'mouse') return;
                          touchDragRef.current = {
                            flowerId: opt.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            active: false,
                          };
                        }}
                        onClick={() => {
                          if (suppressNextClickRef.current) return;
                          handleSelectOrDropFlower(opt.id);
                        }}
                        style={{
                          position: 'relative',
                          padding: isCompact ? '6px 6px 5px' : '8px 8px 6px',
                          borderRadius: 6,
                          border:
                            selectedCount > 0
                              ? '1.5px solid #8E2944'
                              : '1px solid rgba(154, 128, 96, 0.34)',
                          background: selectedCount > 0 ? '#FDF4F5' : '#FFFDF9',
                          color: '#241B19',
                          fontFamily: 'Georgia, serif',
                          cursor: atCap ? 'not-allowed' : 'grab',
                          opacity: atCap ? 0.65 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        <FlowerPngImage
                          flowerId={opt.id}
                          size={isCompact ? 50 : 64}
                        />
                        <span
                          style={{
                            fontSize: 10.5,
                            lineHeight: 1.2,
                            color: '#4F3D37',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                        >
                          {opt.name}
                        </span>
                        {selectedCount > 0 && (
                          <span
                            aria-label={`${selectedCount} selected`}
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 5,
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#8E2944',
                            }}
                          >
                            ×{selectedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ribbon Style & Color */}
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#332421',
                    marginBottom: 6,
                  }}
                >
                  Ribbon Style &amp; Shade
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 7 }}>
                  {RIBBON_STYLE_OPTIONS.map((st) => {
                    const active = ribbonStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        data-testid={`btn-ribbon-style-${st.id}`}
                        aria-pressed={active}
                        onClick={() => {
                          playBouquetRustleSound(isMuted);
                          setRibbonStyle(st.id);
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 5,
                          border: active
                            ? '1.5px solid #8E6828'
                            : '1px solid rgba(154, 128, 96, 0.36)',
                          background: active ? '#F7EBD2' : '#FFFDF9',
                          color: '#2C1F1A',
                          fontFamily: 'Georgia, serif',
                          fontSize: 11.5,
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {st.name}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {RIBBON_COLOR_OPTIONS.map((col) => {
                    const active = ribbonColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        aria-label={`Ribbon color ${col.name}`}
                        data-testid={`btn-ribbon-color-${col.id}`}
                        aria-pressed={active}
                        onClick={() => {
                          playBouquetRustleSound(isMuted);
                          setRibbonColor(col.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 8px',
                          borderRadius: 5,
                          border: active
                            ? '1.5px solid #241B19'
                            : '1px solid rgba(154, 128, 96, 0.35)',
                          background: active ? '#F4EBD8' : '#FFFDF9',
                          color: '#2B201E',
                          fontSize: 11,
                          fontFamily: 'Georgia, serif',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: '50%',
                            background: col.hex,
                            border: '1px solid rgba(36, 27, 25, 0.25)',
                          }}
                        />
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Personal Letter — Optional Handwritten or Typed Mode */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#332421' }}>
                    Personal Letter (Optional)
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      role="tablist"
                      aria-label="Letter writing mode"
                      style={{
                        display: 'inline-flex',
                        padding: 2,
                        borderRadius: 6,
                        background: '#EFE6D5',
                        border: '1px solid rgba(154, 128, 96, 0.32)',
                      }}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={letterMode === 'typed'}
                        data-testid="tab-letter-typed"
                        onClick={() => {
                          setLetterMode('typed');
                          setShowLetterPreview(false);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: 'none',
                          background: letterMode === 'typed' ? '#FFFDF8' : 'transparent',
                          color: letterMode === 'typed' ? '#2B1D19' : '#6D594E',
                          fontFamily: 'Georgia, serif',
                          fontSize: 11,
                          fontWeight: letterMode === 'typed' ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Type Message
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={letterMode === 'handwritten'}
                        data-testid="tab-letter-handwritten"
                        onClick={() => {
                          setLetterMode('handwritten');
                          setShowLetterPreview(false);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: 'none',
                          background: letterMode === 'handwritten' ? '#FFFDF8' : 'transparent',
                          color: letterMode === 'handwritten' ? '#2B1D19' : '#6D594E',
                          fontFamily: 'Georgia, serif',
                          fontSize: 11,
                          fontWeight: letterMode === 'handwritten' ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Handwritten
                      </button>
                    </div>

                    {canPreviewLetter && (
                      <button
                        type="button"
                        data-testid="btn-preview-letter"
                        onClick={() => setShowLetterPreview((p) => !p)}
                        style={{
                          padding: '4px 9px',
                          borderRadius: 5,
                          border: '1px solid rgba(136, 103, 52, 0.4)',
                          background: showLetterPreview ? '#F4EBD8' : '#FFFDF8',
                          color: '#5C4324',
                          fontFamily: 'Georgia, serif',
                          fontSize: 11,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {showLetterPreview ? 'Edit Letter' : 'Preview Letter'}
                      </button>
                    )}
                  </div>
                </div>

                {showLetterPreview && canPreviewLetter ? (
                  <div
                    data-testid="letter-preview-card"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 5,
                      border: '1px solid rgba(164, 138, 98, 0.48)',
                      background: '#FFFDF8',
                      minHeight: isCompact ? 86 : 112,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: 1.4,
                        textTransform: 'uppercase',
                        color: '#886734',
                        marginBottom: 6,
                      }}
                    >
                      Letter Preview
                    </div>
                    {letterMode === 'handwritten' && handwrittenDataUrl ? (
                      <img
                        data-testid="letter-preview-handwritten-img"
                        src={handwrittenDataUrl}
                        alt="Handwritten letter preview"
                        referrerPolicy="no-referrer"
                        style={{
                          width: '100%',
                          height: isCompact ? 76 : 100,
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1.6,
                          fontStyle: 'italic',
                          color: '#2D1E1B',
                          wordBreak: 'break-word',
                        }}
                      >
                        “{message.trim()}”
                      </p>
                    )}
                  </div>
                ) : letterMode === 'typed' ? (
                  <div>
                    <textarea
                      id="bouquet-note-input"
                      data-testid="input-bouquet-message"
                      value={message}
                      maxLength={180}
                      rows={isCompact ? 2 : 3}
                      placeholder="Write a personal note to tuck inside the bouquet..."
                      onChange={(e) => setMessage(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '8px 12px',
                        borderRadius: 4,
                        border: '1px solid rgba(156, 130, 98, 0.45)',
                        background:
                          'repeating-linear-gradient(180deg, #FFFDF8 0px, #FFFDF8 23px, rgba(190, 168, 132, 0.28) 24px)',
                        color: '#281C19',
                        fontFamily: 'Georgia, serif',
                        fontSize: 13.5,
                        lineHeight: '24px',
                        resize: 'vertical',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        fontSize: 10.5,
                        color: '#78665C',
                        marginTop: 2,
                      }}
                    >
                      {message.length}/180
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 5,
                        border: '1px solid rgba(156, 130, 98, 0.48)',
                        background:
                          'repeating-linear-gradient(180deg, #FFFDF8 0px, #FFFDF8 23px, rgba(190, 168, 132, 0.28) 24px)',
                        overflow: 'hidden',
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        data-testid="handwriting-canvas"
                        width={540}
                        height={156}
                        onPointerDown={handleCanvasPointerDown}
                        onPointerMove={handleCanvasPointerMove}
                        onPointerUp={(e) => finalizeCanvasStroke(e.currentTarget)}
                        onPointerCancel={(e) => finalizeCanvasStroke(e.currentTarget)}
                        style={{
                          width: '100%',
                          height: isCompact ? 96 : 122,
                          display: 'block',
                          touchAction: 'none',
                          cursor: 'crosshair',
                        }}
                      />
                      {strokes.length === 0 && (
                        <div
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            color: '#9A8679',
                            pointerEvents: 'none',
                          }}
                        >
                          Write with your finger, mouse, or stylus...
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 5,
                      }}
                    >
                      <span style={{ fontSize: 10.5, color: '#78665C' }}>
                        {strokes.length > 0
                          ? `${strokes.length} stroke${strokes.length === 1 ? '' : 's'} captured`
                          : 'Optional handwritten letter'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          data-testid="btn-handwriting-undo"
                          disabled={strokes.length === 0}
                          onClick={handleUndoHandwriting}
                          style={{
                            padding: '3px 9px',
                            borderRadius: 4,
                            border: '1px solid rgba(134, 108, 78, 0.36)',
                            background: '#FFFDF8',
                            color: '#4E3C37',
                            fontSize: 11,
                            fontFamily: 'Georgia, serif',
                            cursor: strokes.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: strokes.length === 0 ? 0.5 : 1,
                          }}
                        >
                          Undo
                        </button>
                        <button
                          type="button"
                          data-testid="btn-handwriting-clear"
                          disabled={strokes.length === 0}
                          onClick={handleClearHandwriting}
                          style={{
                            padding: '3px 9px',
                            borderRadius: 4,
                            border: '1px solid rgba(134, 108, 78, 0.36)',
                            background: '#FFFDF8',
                            color: '#6C2233',
                            fontSize: 11,
                            fontFamily: 'Georgia, serif',
                            cursor: strokes.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: strokes.length === 0 ? 0.5 : 1,
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pinned Paper Sheet Action Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              paddingTop: isCompact ? 8 : 12,
              marginTop: isCompact ? 8 : 12,
              borderTop: '1px solid rgba(154, 126, 86, 0.3)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: '#6E5A50' }}>
              {selectedFlowers.length === 0
                ? 'Add 1 to 4 flowers to enable bouquet creation'
                : `${selectedFlowers.length} of ${MAX_BOUQUET_FLOWERS} flowers ready`}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                data-testid="btn-cancel-create-bouquet"
                onClick={closeBouquetCreator}
                style={{
                  padding: isCompact ? '7px 14px' : '9px 16px',
                  borderRadius: 6,
                  border: '1px solid rgba(134, 108, 78, 0.42)',
                  background: 'transparent',
                  color: '#4E3C37',
                  fontSize: isCompact ? 12.5 : 13,
                  fontFamily: 'Georgia, serif',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="btn-confirm-create-bouquet"
                disabled={selectedFlowers.length === 0}
                onClick={handleSubmit}
                style={{
                  padding: isCompact ? '8px 18px' : '10px 22px',
                  borderRadius: 6,
                  border: '1px solid #8A5D20',
                  background:
                    selectedFlowers.length === 0
                      ? '#B8A8A0'
                      : 'linear-gradient(135deg, #8F2544, #681730)',
                  color: '#FFF9F2',
                  fontSize: isCompact ? 12.5 : 13.5,
                  fontWeight: 700,
                  letterSpacing: 0.7,
                  fontFamily: 'Georgia, serif',
                  cursor: selectedFlowers.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedFlowers.length === 0 ? 0.7 : 1,
                  boxShadow:
                    selectedFlowers.length === 0
                      ? 'none'
                      : '0 8px 20px rgba(104, 23, 48, 0.28)',
                  whiteSpace: 'nowrap',
                }}
              >
                CREATE BOUQUET
              </button>
            </div>
          </div>
        </div>

        {/* Torn bottom archival paper deckle edge */}
        <svg
          viewBox="0 0 800 14"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ width: '100%', height: 11, display: 'block', flexShrink: 0 }}
        >
          <polygon points={DECKLE_BOTTOM_POINTS} fill="#F7F0E2" />
        </svg>
      </div>

      {/* Floating PNG drag preview during touch drag */}
      {draggingTouchFlower && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: draggingTouchFlower.x,
            top: draggingTouchFlower.y,
            transform: 'translate(-50%, -50%) scale(1.08)',
            pointerEvents: 'none',
            zIndex: 1300,
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35))',
          }}
        >
          <FlowerPngImage flowerId={draggingTouchFlower.id} size={64} />
        </div>
      )}
    </div>
  );
}
