export type PlayerGender = 'girl' | 'boy';

export type FlowerChoiceId =
  | 'red_rose'
  | 'blush_peony'
  | 'white_lily'
  | 'lavender'
  | 'sunflower'
  | 'babys_breath';

export type RibbonStyleId = 'satin_bow' | 'velvet_wrap' | 'gold_cord';

export type RibbonColorId =
  | 'champagne'
  | 'crimson'
  | 'ivory'
  | 'blush'
  | 'sage'
  | 'midnight';

export type BouquetHandoverStage =
  | 'idle'
  | 'approaching'
  | 'offering'
  | 'receiving'
  | 'reaction';

export type BouquetReactionType = 'none' | 'boy_blush' | 'girl_happy';

export type LetterMode = 'typed' | 'handwritten';

export const MAX_BOUQUET_FLOWERS = 4;

export interface FlowerOption {
  id: FlowerChoiceId;
  name: string;
  subtitle: string;
  primaryHex: string;
  accentHex: string;
  imagePath: string;
}

export interface RibbonStyleOption {
  id: RibbonStyleId;
  name: string;
  description: string;
}

export interface RibbonColorOption {
  id: RibbonColorId;
  name: string;
  hex: string;
  trimHex: string;
}

export interface BouquetDesign {
  flowers: FlowerChoiceId[];
  ribbonStyle: RibbonStyleId;
  ribbonColor: RibbonColorId;
  message: string;
  letterMode?: LetterMode;
  handwrittenLetterDataUrl?: string | null;
  createdBy: PlayerGender;
  createdAt: number;
}

export interface BouquetHandoverAnchor {
  boyPos: [number, number, number];
  girlPos: [number, number, number];
  boyFacing: number;
  girlFacing: number;
  giver: PlayerGender;
  receiver: PlayerGender;
}

export const FLOWER_OPTIONS: ReadonlyArray<FlowerOption> = [
  {
    id: 'red_rose',
    name: 'Crimson Rose',
    subtitle: 'Deep velvet romance',
    primaryHex: '#b81d38',
    accentHex: '#e65872',
    imagePath: '/flowers/red_rose.png',
  },
  {
    id: 'blush_peony',
    name: 'Blush Peony',
    subtitle: 'Soft garden silk',
    primaryHex: '#f1a0b6',
    accentHex: '#ffd7e2',
    imagePath: '/flowers/blush_peony.png',
  },
  {
    id: 'white_lily',
    name: 'Ivory Lily',
    subtitle: 'Pure sunlit grace',
    primaryHex: '#faf5ea',
    accentHex: '#e6c268',
    imagePath: '/flowers/white_lily.png',
  },
  {
    id: 'lavender',
    name: 'French Lavender',
    subtitle: 'Calm meadow scent',
    primaryHex: '#8d6cc6',
    accentHex: '#c2aceb',
    imagePath: '/flowers/lavender.png',
  },
  {
    id: 'sunflower',
    name: 'Golden Sunflower',
    subtitle: 'Warm bright devotion',
    primaryHex: '#ebb028',
    accentHex: '#5a3519',
    imagePath: '/flowers/sunflower.png',
  },
  {
    id: 'babys_breath',
    name: "Baby's Breath",
    subtitle: 'Delicate cloud mist',
    primaryHex: '#fffdf7',
    accentHex: '#b7ceb2',
    imagePath: '/flowers/babys_breath.png',
  },
];

export const RIBBON_STYLE_OPTIONS: ReadonlyArray<RibbonStyleOption> = [
  {
    id: 'satin_bow',
    name: 'Classic Satin Bow',
    description: 'Hand-tied double loops with flowing tails',
  },
  {
    id: 'velvet_wrap',
    name: 'Velvet Wrap',
    description: 'Rich gathered collar with tailored pleat',
  },
  {
    id: 'gold_cord',
    name: 'Lace & Gold Cord',
    description: 'Heirloom lace trim bound in spun gold',
  },
];

export const RIBBON_COLOR_OPTIONS: ReadonlyArray<RibbonColorOption> = [
  { id: 'champagne', name: 'Champagne', hex: '#d4af63', trimHex: '#f2dfb0' },
  { id: 'crimson', name: 'Crimson', hex: '#9e1f3a', trimHex: '#cf4863' },
  { id: 'ivory', name: 'Ivory Silk', hex: '#f5ede0', trimHex: '#dcd0be' },
  { id: 'blush', name: 'Dusty Rose', hex: '#d88296', trimHex: '#f0b6c3' },
  { id: 'sage', name: 'Meadow Sage', hex: '#6c8b70', trimHex: '#9ab79d' },
  { id: 'midnight', name: 'Midnight', hex: '#263656', trimHex: '#526896' },
];

// Circular Gallery arc midway between Memory Theatre (theta = PI -> [0, 0, -38.5])
// and Garden Door (theta = 3*PI/4 -> [12.0, 0, -33.5]), facing inward toward Gallery Center.
export const BOUQUET_STATION_ANGLE = (7 * Math.PI) / 8;
const STATION_RADIUS = 14.85;
export const BOUQUET_STATION_POS: [number, number, number] = [
  Number((STATION_RADIUS * Math.sin(BOUQUET_STATION_ANGLE)).toFixed(2)),
  0,
  Number((-21.5 + STATION_RADIUS * Math.cos(BOUQUET_STATION_ANGLE)).toFixed(2)),
];
// Faces inward toward GALLERY_CENTER [0, 0, -21.5]
export const BOUQUET_STATION_ROTATION = BOUQUET_STATION_ANGLE + Math.PI;

// Attendant stands welcomingly beside the flower-arranging table, clear of both doorways
export const BOUQUET_ATTENDANT_POS: [number, number, number] = [
  Number((BOUQUET_STATION_POS[0] + Math.cos(BOUQUET_STATION_ROTATION) * 1.38).toFixed(2)),
  0,
  Number((BOUQUET_STATION_POS[2] - Math.sin(BOUQUET_STATION_ROTATION) * 1.38).toFixed(2)),
];
export const BOUQUET_ATTENDANT_ROTATION = BOUQUET_STATION_ROTATION + 0.34;

export const BOUQUET_STATION_INTERACT_RADIUS = 2.95;
const THEATRE_DOOR_XZ: [number, number] = [0, -38.5];
const GARDEN_DOOR_XZ: [number, number] = [12.0, -33.5];

export function isNearBouquetStation(pos: { x: number; z: number }): boolean {
  const dStation = Math.hypot(
    pos.x - BOUQUET_STATION_POS[0],
    pos.z - BOUQUET_STATION_POS[2]
  );
  if (dStation > BOUQUET_STATION_INTERACT_RADIUS) return false;

  const dTheatre = Math.hypot(pos.x - THEATRE_DOOR_XZ[0], pos.z - THEATRE_DOOR_XZ[1]);
  const dGarden = Math.hypot(pos.x - GARDEN_DOOR_XZ[0], pos.z - GARDEN_DOOR_XZ[1]);
  return dStation < dTheatre - 0.6 && dStation < dGarden - 0.6;
}

export function getFlowerOption(id: FlowerChoiceId): FlowerOption {
  return FLOWER_OPTIONS.find((f) => f.id === id) ?? FLOWER_OPTIONS[0];
}

export function getRibbonStyleOption(id: RibbonStyleId): RibbonStyleOption {
  return RIBBON_STYLE_OPTIONS.find((r) => r.id === id) ?? RIBBON_STYLE_OPTIONS[0];
}

export function getRibbonColorOption(id: RibbonColorId): RibbonColorOption {
  return RIBBON_COLOR_OPTIONS.find((c) => c.id === id) ?? RIBBON_COLOR_OPTIONS[0];
}

export function createDefaultBouquetDesign(createdBy: PlayerGender = 'girl'): BouquetDesign {
  return {
    flowers: ['red_rose', 'babys_breath'],
    ribbonStyle: 'satin_bow',
    ribbonColor: 'champagne',
    message: '',
    letterMode: 'typed',
    handwrittenLetterDataUrl: null,
    createdBy,
    createdAt: Date.now(),
  };
}

export function addFlowerToSelection(
  current: ReadonlyArray<FlowerChoiceId>,
  flowerId: FlowerChoiceId
): { next: FlowerChoiceId[]; added: boolean; reason?: 'max_reached' | 'invalid' } {
  if (!FLOWER_OPTIONS.some((opt) => opt.id === flowerId)) {
    return { next: [...current], added: false, reason: 'invalid' };
  }
  if (current.length >= MAX_BOUQUET_FLOWERS) {
    return { next: [...current], added: false, reason: 'max_reached' };
  }
  return { next: [...current, flowerId], added: true };
}

export function removeFlowerAtIndex(
  current: ReadonlyArray<FlowerChoiceId>,
  index: number
): FlowerChoiceId[] {
  if (index < 0 || index >= current.length) {
    return [...current];
  }
  return current.filter((_, i) => i !== index);
}

export function replaceFlowerAtIndex(
  current: ReadonlyArray<FlowerChoiceId>,
  index: number,
  flowerId: FlowerChoiceId
): FlowerChoiceId[] {
  if (
    index < 0 ||
    index >= current.length ||
    !FLOWER_OPTIONS.some((opt) => opt.id === flowerId)
  ) {
    return [...current];
  }
  return current.map((item, i) => (i === index ? flowerId : item));
}

export function hasBouquetLetter(
  design: Pick<BouquetDesign, 'message' | 'letterMode' | 'handwrittenLetterDataUrl'> | null | undefined
): boolean {
  if (!design) return false;
  if (design.letterMode === 'handwritten' && Boolean(design.handwrittenLetterDataUrl)) {
    return true;
  }
  return Boolean(design.message?.trim() || design.handwrittenLetterDataUrl);
}

export function normalizeBouquetDesign(input: {
  flowers: FlowerChoiceId[];
  ribbonStyle: RibbonStyleId;
  ribbonColor: RibbonColorId;
  message: string;
  letterMode?: LetterMode;
  handwrittenLetterDataUrl?: string | null;
  createdBy: PlayerGender;
}): BouquetDesign | null {
  const chosenFlowers: FlowerChoiceId[] = [];
  for (const id of input.flowers) {
    if (FLOWER_OPTIONS.some((opt) => opt.id === id)) {
      chosenFlowers.push(id);
    }
    if (chosenFlowers.length >= MAX_BOUQUET_FLOWERS) break;
  }
  if (chosenFlowers.length === 0) return null;

  const validStyle = RIBBON_STYLE_OPTIONS.some((s) => s.id === input.ribbonStyle)
    ? input.ribbonStyle
    : 'satin_bow';
  const validColor = RIBBON_COLOR_OPTIONS.some((c) => c.id === input.ribbonColor)
    ? input.ribbonColor
    : 'champagne';

  const trimmedMessage = input.message.trim().slice(0, 180);
  const validDrawing =
    typeof input.handwrittenLetterDataUrl === 'string' &&
    input.handwrittenLetterDataUrl.startsWith('data:image/')
      ? input.handwrittenLetterDataUrl
      : null;

  const requestedMode: LetterMode =
    input.letterMode === 'handwritten' ? 'handwritten' : 'typed';

  const finalMode: LetterMode =
    requestedMode === 'handwritten'
      ? validDrawing
        ? 'handwritten'
        : trimmedMessage
        ? 'typed'
        : 'handwritten'
      : trimmedMessage
      ? 'typed'
      : validDrawing
      ? 'handwritten'
      : 'typed';

  return {
    flowers: chosenFlowers,
    ribbonStyle: validStyle,
    ribbonColor: validColor,
    message: finalMode === 'typed' ? trimmedMessage : '',
    letterMode: finalMode,
    handwrittenLetterDataUrl: finalMode === 'handwritten' ? validDrawing : null,
    createdBy: input.createdBy,
    createdAt: Date.now(),
  };
}

export function getBouquetRecipient(giver: PlayerGender): PlayerGender {
  return giver === 'girl' ? 'boy' : 'girl';
}

export function isBouquetHandoverBusy(stage: BouquetHandoverStage): boolean {
  return stage !== 'idle';
}

export function getActiveBouquetReaction(
  stage: BouquetHandoverStage,
  receiver: PlayerGender | null
): BouquetReactionType {
  if (stage !== 'reaction' || !receiver) return 'none';
  return receiver === 'boy' ? 'boy_blush' : 'girl_happy';
}

export function computeBouquetHandoverAnchor(
  boyPos: { x: number; z: number },
  boyRot: number,
  girlPos: { x: number; z: number },
  giver: PlayerGender,
  spacing: number = 0.92
): BouquetHandoverAnchor {
  const receiver = getBouquetRecipient(giver);
  const half = spacing * 0.5;

  const giverCurrent = giver === 'boy' ? boyPos : girlPos;
  const receiverCurrent = giver === 'boy' ? girlPos : boyPos;

  let dx = receiverCurrent.x - giverCurrent.x;
  let dz = receiverCurrent.z - giverCurrent.z;
  const dist = Math.hypot(dx, dz);

  if (dist < 0.08) {
    dx = Math.sin(boyRot);
    dz = Math.cos(boyRot);
  } else {
    dx /= dist;
    dz /= dist;
  }

  // Keep receiver anchored near current position if far apart, or meet comfortably at midpoint if close
  const anchorCenterX =
    dist > 1.8
      ? receiverCurrent.x - dx * half
      : (giverCurrent.x + receiverCurrent.x) * 0.5;
  const anchorCenterZ =
    dist > 1.8
      ? receiverCurrent.z - dz * half
      : (giverCurrent.z + receiverCurrent.z) * 0.5;

  const giverTarget: [number, number, number] = [
    anchorCenterX - dx * half,
    0,
    anchorCenterZ - dz * half,
  ];
  const receiverTarget: [number, number, number] = [
    anchorCenterX + dx * half,
    0,
    anchorCenterZ + dz * half,
  ];

  const giverFacing = Math.atan2(dx, dz);
  const receiverFacing = Math.atan2(-dx, -dz);

  return {
    boyPos: giver === 'boy' ? giverTarget : receiverTarget,
    girlPos: giver === 'girl' ? giverTarget : receiverTarget,
    boyFacing: giver === 'boy' ? giverFacing : receiverFacing,
    girlFacing: giver === 'girl' ? giverFacing : receiverFacing,
    giver,
    receiver,
  };
}

export function advanceBouquetHandoverStage(
  stage: BouquetHandoverStage,
  elapsedSeconds: number,
  giverDistToTarget: number
): BouquetHandoverStage | 'done' {
  switch (stage) {
    case 'approaching':
      if ((giverDistToTarget <= 0.16 && elapsedSeconds >= 0.35) || elapsedSeconds >= 2.2) {
        return 'offering';
      }
      return 'approaching';
    case 'offering':
      return elapsedSeconds >= 1.35 ? 'receiving' : 'offering';
    case 'receiving':
      return elapsedSeconds >= 0.95 ? 'reaction' : 'receiving';
    case 'reaction':
      return elapsedSeconds >= 3.2 ? 'done' : 'reaction';
    default:
      return 'idle';
  }
}

export function getBouquetHandoverActions(
  stage: BouquetHandoverStage,
  giver: PlayerGender,
  giverDistToTarget: number
): {
  boyAction: string;
  girlAction: string;
} {
  if (stage === 'idle') {
    return { boyAction: 'idle', girlAction: 'idle' };
  }

  let giverAction = 'idle';
  let receiverAction = 'idle';

  if (stage === 'approaching') {
    giverAction = giverDistToTarget > 0.16 ? 'walk' : 'idle';
    receiverAction = 'idle';
  } else if (stage === 'offering') {
    giverAction = 'bouquet_give';
    receiverAction = 'bouquet_receive';
  } else if (stage === 'receiving') {
    giverAction = 'bouquet_give';
    receiverAction = 'bouquet_receive';
  } else if (stage === 'reaction') {
    giverAction = 'idle';
    receiverAction = giver === 'girl' ? 'bouquet_react_blush' : 'bouquet_react_happy';
  }

  return {
    boyAction: giver === 'boy' ? giverAction : receiverAction,
    girlAction: giver === 'girl' ? giverAction : receiverAction,
  };
}
