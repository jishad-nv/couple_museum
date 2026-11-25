export type WeddingStage =
  | 'idle'
  | 'ready'
  | 'aisle_walk'
  | 'vows'
  | 'hug'
  | 'celebrating';

export type BrideGownStyle = 'ivory_ballgown' | 'rosegold_couture' | 'champagne_lace';
export type BrideHeadwear = 'flowing_veil' | 'pearl_hijab' | 'golden_tiara';
export type GroomSuitStyle = 'midnight_tuxedo' | 'ivory_tailcoat' | 'champagne_sherwani' | 'sage_linen';
export type AttireAccent = 'gold' | 'blush' | 'ivory' | 'emerald';

export interface BrideOutfitConfig {
  style: BrideGownStyle;
  headwear: BrideHeadwear;
  accent: AttireAccent;
}

export interface GroomOutfitConfig {
  style: GroomSuitStyle;
  accent: AttireAccent;
}

export const DEFAULT_BRIDE_OUTFIT: BrideOutfitConfig = {
  style: 'ivory_ballgown',
  headwear: 'flowing_veil',
  accent: 'gold',
};

export const DEFAULT_GROOM_OUTFIT: GroomOutfitConfig = {
  style: 'midnight_tuxedo',
  accent: 'gold',
};

export const BRIDE_STYLE_OPTIONS: ReadonlyArray<{
  id: BrideGownStyle;
  label: string;
  subtitle: string;
}> = [
  { id: 'ivory_ballgown', label: 'Ivory Satin Ballgown', subtitle: 'Classic billowing cathedral skirt' },
  { id: 'rosegold_couture', label: 'Rose-Gold Couture', subtitle: 'Blush satin silhouette & bodice trim' },
  { id: 'champagne_lace', label: 'Champagne Lace', subtitle: 'Sculpted destination mermaid drape' },
];

export const BRIDE_HEADWEAR_OPTIONS: ReadonlyArray<{
  id: BrideHeadwear;
  label: string;
}> = [
  { id: 'flowing_veil', label: 'Flowing Bridal Veil' },
  { id: 'pearl_hijab', label: 'Pearl Bridal Hijab' },
  { id: 'golden_tiara', label: 'Golden Floral Tiara' },
];

export const GROOM_STYLE_OPTIONS: ReadonlyArray<{
  id: GroomSuitStyle;
  label: string;
  subtitle: string;
}> = [
  { id: 'midnight_tuxedo', label: 'Midnight Velvet Tuxedo', subtitle: 'Satin lapel & formal bow tie' },
  { id: 'ivory_tailcoat', label: 'Ivory Morning Tailcoat', subtitle: 'Crisp sunlit morning formal' },
  { id: 'champagne_sherwani', label: 'Champagne Sherwani', subtitle: 'Gold-embroidered royal collar' },
  { id: 'sage_linen', label: 'Sage Destination Suit', subtitle: 'Tailored coastal morning linen' },
];

export const ATTIRE_ACCENT_OPTIONS: ReadonlyArray<{
  id: AttireAccent;
  label: string;
  hex: string;
}> = [
  { id: 'gold', label: 'Champagne Gold', hex: '#d8b467' },
  { id: 'blush', label: 'Blush Rose', hex: '#e89eb0' },
  { id: 'ivory', label: 'Silk Ivory', hex: '#f8f2e4' },
  { id: 'emerald', label: 'Garden Sage', hex: '#5c8f6e' },
];

export function resolveBrideColors(outfit: BrideOutfitConfig): {
  dress: string;
  skirtTrim: string;
  bodiceLace: string;
  hijabColor: string;
  bouquetPrimary: string;
  bouquetSecondary: string;
  accentHex: string;
  shoe: string;
} {
  const accentHex =
    ATTIRE_ACCENT_OPTIONS.find((a) => a.id === outfit.accent)?.hex ?? '#d8b467';

  switch (outfit.style) {
    case 'rosegold_couture':
      return {
        dress: '#f4d9df',
        skirtTrim: '#e8c4ce',
        bodiceLace: '#fff6f8',
        hijabColor: '#f8e6ea',
        bouquetPrimary: '#e97a96',
        bouquetSecondary: '#fff5ee',
        accentHex,
        shoe: '#e8c0c8',
      };
    case 'champagne_lace':
      return {
        dress: '#f3e5cf',
        skirtTrim: '#e4cfa9',
        bodiceLace: '#fff9ef',
        hijabColor: '#f7ecda',
        bouquetPrimary: '#f6cad2',
        bouquetSecondary: '#fffaf2',
        accentHex,
        shoe: '#dfcaaa',
      };
    case 'ivory_ballgown':
    default:
      return {
        dress: '#fcfaf6',
        skirtTrim: '#f2ede4',
        bodiceLace: '#ffffff',
        hijabColor: '#faf6ef',
        bouquetPrimary: '#b81d38',
        bouquetSecondary: '#fff7f5',
        accentHex,
        shoe: '#f6f1e8',
      };
  }
}

export function resolveGroomColors(outfit: GroomOutfitConfig): {
  jacket: string;
  trousers: string;
  shirt: string;
  tie: string;
  trim: string;
  shoe: string;
} {
  const accentHex =
    ATTIRE_ACCENT_OPTIONS.find((a) => a.id === outfit.accent)?.hex ?? '#d8b467';

  switch (outfit.style) {
    case 'ivory_tailcoat':
      return {
        jacket: '#f3ede0',
        trousers: '#dfd5c3',
        shirt: '#ffffff',
        tie: accentHex,
        trim: accentHex,
        shoe: '#4a3525',
      };
    case 'champagne_sherwani':
      return {
        jacket: '#e7d2ad',
        trousers: '#f6efe0',
        shirt: '#f9f4ea',
        tie: '#c89b44',
        trim: '#d6ab56',
        shoe: '#6a4728',
      };
    case 'sage_linen':
      return {
        jacket: '#5f7666',
        trousers: '#4f6456',
        shirt: '#fbf9f4',
        tie: accentHex,
        trim: accentHex,
        shoe: '#523a29',
      };
    case 'midnight_tuxedo':
    default:
      return {
        jacket: '#12131a',
        trousers: '#0e0f14',
        shirt: '#faf8f4',
        tie: '#151720',
        trim: accentHex,
        shoe: '#0c0d12',
      };
  }
}

export const SECRET_ROMANTIC_LETTERS: ReadonlyArray<{
  id: string;
  title: string;
  date: string;
  body: string;
}> = [
  {
    id: 'letter-1',
    title: 'For Every Quiet Evening',
    date: 'Kept in Secret',
    body: 'Between every crowded room and grand photograph, my favorite place in the entire world is simply wherever your hand reaches for mine.',
  },
  {
    id: 'letter-2',
    title: 'What I Never Stop Noticing',
    date: 'Whispered Promise',
    body: 'You turn ordinary Tuesday walks into memories worth framing, and turn silence into something warm enough to live inside forever.',
  },
  {
    id: 'letter-3',
    title: 'Until Every Hair Turns Silver',
    date: 'Always Yours',
    body: 'No matter how many doors we open or years we gather, I would choose your laugh, your patience, and this exact journey every single time.',
  },
];
