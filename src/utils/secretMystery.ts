import type { MemoryMotif } from './museumContentTypes.ts';

export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export interface SecretQuizQuestion {
  id: string;
  question: string;
  description: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: QuizOptionKey;
  sortOrder: number;
}

export type PrivateMemoryKind = 'photo' | 'letter' | 'message' | 'board' | 'code';

export interface PrivateMemoryItem {
  id: string;
  kind: PrivateMemoryKind;
  title: string;
  subtitle: string;
  dateLabel: string;
  body: string;
  secretCode: string;
  photoSrc: string;
  palette: [string, string, string];
  motif: MemoryMotif;
  sortOrder: number;
}

export interface SecretMysteryProgress {
  yesConfirmed: boolean;
  quizCompleted: boolean;
  keyCollected: boolean;
  secretDoorUnlocked: boolean;
  secondDoorUnlocked: boolean;
  chamberDiscovered: boolean;
  updatedAt: number;
}

export const DEFAULT_SECRET_PROGRESS: SecretMysteryProgress = {
  yesConfirmed: false,
  quizCompleted: false,
  keyCollected: false,
  secretDoorUnlocked: false,
  secondDoorUnlocked: false,
  chamberDiscovered: false,
  updatedAt: 0,
};

export const DEFAULT_SECRET_QUIZ_QUESTIONS: SecretQuizQuestion[] = [
  {
    id: 'quiz-1',
    question: 'Which colour instantly reminds us of our favorite evening sky?',
    description: 'Think of the glow we always pause to watch together.',
    options: {
      A: 'Blush Rose & Warm Gold',
      B: 'Midnight Navy Blue',
      C: 'Emerald Forest Green',
      D: 'Soft Lavender Mist',
    },
    correctOption: 'A',
    sortOrder: 1,
  },
  {
    id: 'quiz-2',
    question: 'What is our favorite shared comfort treat on rainy evenings?',
    description: 'The ritual that turns any long week into warmth.',
    options: {
      A: 'Midnight Gelato',
      B: 'Warm Pastries & Spiced Chai',
      C: 'Street Tacos by the Pier',
      D: 'Roasted Chestnut Crepes',
    },
    correctOption: 'B',
    sortOrder: 2,
  },
  {
    id: 'quiz-3',
    question: 'Which place holds the quietest memory of just the two of us?',
    description: 'Where time always seems to slow down when we arrive.',
    options: {
      A: 'The Busy Downtown Cafe',
      B: 'The Airport Terminal Gate',
      C: 'By the Water Under Lantern Lights',
      D: 'The Corner Bookshop',
    },
    correctOption: 'C',
    sortOrder: 3,
  },
  {
    id: 'quiz-4',
    question: 'What tiny gesture always brings out our happiest smile?',
    description: 'No grand occasion required—just an everyday habit.',
    options: {
      A: 'Reaching for my hand mid-walk',
      B: 'Sending a goodnight voice note',
      C: 'Saving the last bite without asking',
      D: 'All of these quiet promises',
    },
    correctOption: 'D',
    sortOrder: 4,
  },
  {
    id: 'quiz-5',
    question: 'Which moment from our journey would we relive a hundred times?',
    description: 'The memory framed at the very center of our story.',
    options: {
      A: 'Our first spontaneous late-night walk in the rain',
      B: 'Dancing barefoot under city stars',
      C: 'Watching sunrise from the coastal overlook',
      D: 'Every chapter we walked side by side',
    },
    correctOption: 'D',
    sortOrder: 5,
  },
];

export const DEFAULT_PRIVATE_MEMORIES: PrivateMemoryItem[] = [
  {
    id: 'priv-1',
    kind: 'board',
    title: 'Our Private Promise Board',
    subtitle: 'Central Sanctuary Keepsake',
    dateLabel: 'Milestone Zero · Forever',
    body: 'Every ordinary morning, every midnight laugh, and every quiet promise written between us lives right here behind closed doors—kept safe only for our two hearts.',
    secretCode: 'ALWAYS-143',
    photoSrc: '/photos/photo8.jpg',
    palette: ['#3b182c', '#8b2252', '#e8c488'],
    motif: 'roses',
    sortOrder: 1,
  },
  {
    id: 'priv-2',
    kind: 'photo',
    title: 'The Rainy Umbrella Photograph',
    subtitle: 'Unposted Polaroid Archive',
    dateLabel: 'First Autumn Rain',
    body: 'We stood half-soaked under a single trembling umbrella, laughing too hard to care about the storm—and that blurred candid smile became my favorite treasure.',
    secretCode: 'RAIN-UMBRELLA',
    photoSrc: '/photos/photo2.jpg',
    palette: ['#1b2845', '#4c658e', '#c8a55a'],
    motif: 'rain',
    sortOrder: 2,
  },
  {
    id: 'priv-3',
    kind: 'letter',
    title: 'Letter Sealed in Velvet',
    subtitle: 'For Quiet Nights',
    dateLabel: 'Written After Midnight',
    body: 'If you ever wonder when I fell completely in love with you, it was never a single dramatic moment—it was the hundred small ways you made silence feel like home.',
    secretCode: 'VELVET-SEAL',
    photoSrc: '',
    palette: ['#3d1f2b', '#7c344d', '#f1cf9b'],
    motif: 'lanterns',
    sortOrder: 3,
  },
  {
    id: 'priv-4',
    kind: 'message',
    title: 'Saved Text: "Text Me When You Get Home"',
    subtitle: 'Midnight Thread Archive',
    dateLabel: '01:18 AM · First Month',
    body: '"Made it inside—still smiling like an idiot because I didn’t want to let go of your hand at the corner."',
    secretCode: '0118-WALK',
    photoSrc: '',
    palette: ['#241b35', '#5b4278', '#f0b8c8'],
    motif: 'stars',
    sortOrder: 4,
  },
  {
    id: 'priv-5',
    kind: 'photo',
    title: 'Harbor Lanterns Keep-Close',
    subtitle: 'Private Holiday Roll',
    dateLabel: 'Harbor Eve',
    body: 'Before anyone else saw our trip photos, we kept this quiet portrait from the pier—gold reflections dancing across still water beside your laugh.',
    secretCode: 'PIER-LANTERN',
    photoSrc: '/photos/photo6.jpg',
    palette: ['#141b33', '#3f3d6b', '#f2b866'],
    motif: 'lanterns',
    sortOrder: 5,
  },
  {
    id: 'priv-6',
    kind: 'code',
    title: 'Our Secret Code: "22:22"',
    subtitle: 'Shared Inside Signal',
    dateLabel: 'Every Night Wish',
    body: 'Whenever either of us catches 22:22 on the clock—no matter how busy the day or how many miles apart—we pause, send the secret code, and make the exact same wish.',
    secretCode: '22:22 · SAME WISH',
    photoSrc: '',
    palette: ['#2b182a', '#7c385a', '#ffd28a'],
    motif: 'stars',
    sortOrder: 6,
  },
  {
    id: 'priv-7',
    kind: 'letter',
    title: 'Note Tucked Inside Your Coat',
    subtitle: 'Handwritten Keepsake',
    dateLabel: 'Winter Train Morning',
    body: 'I slipped this folded note into your left pocket before boarding so you would find warm words the moment you reached for your gloves.',
    secretCode: 'LEFT-POCKET',
    photoSrc: '/photos/photo13.jpg',
    palette: ['#241c38', '#6f4268', '#e8c28e'],
    motif: 'arch',
    sortOrder: 7,
  },
  {
    id: 'priv-8',
    kind: 'message',
    title: 'Milestone Card: Our Forever Vow',
    subtitle: 'Golden Anniversary Shelf',
    dateLabel: 'Every Chapter Ahead',
    body: 'One museum, a hundred rooms of memories, and still my favorite adventure is every tomorrow we get to build together.',
    secretCode: 'FOREVER-US',
    photoSrc: '/photos/photo15.jpg',
    palette: ['#2e1529', '#7d3055', '#f2cf88'],
    motif: 'sunrise',
    sortOrder: 8,
  },
];

const NO_ESCAPE_OFFSETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 18, y: 18 },
  { x: 196, y: 16 },
  { x: 24, y: 88 },
  { x: 210, y: 86 },
  { x: 112, y: 14 },
  { x: 120, y: 92 },
];

export function pickNextNoButtonPosition(
  current: { x: number; y: number },
  stageWidth: number,
  stageHeight: number,
  buttonWidth: number,
  buttonHeight: number,
  yesRect: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  const maxX = Math.max(12, stageWidth - buttonWidth - 12);
  const maxY = Math.max(10, stageHeight - buttonHeight - 10);

  let best = { x: maxX, y: maxY };
  let bestScore = -1;

  for (const candidate of NO_ESCAPE_OFFSETS) {
    const cx = Math.max(12, Math.min(maxX, (candidate.x / 320) * stageWidth));
    const cy = Math.max(10, Math.min(maxY, (candidate.y / 140) * stageHeight));

    const overlapsYes =
      cx < yesRect.x + yesRect.width + 14 &&
      cx + buttonWidth + 14 > yesRect.x &&
      cy < yesRect.y + yesRect.height + 10 &&
      cy + buttonHeight + 10 > yesRect.y;

    if (overlapsYes) continue;

    const distFromCurrent = Math.hypot(cx - current.x, cy - current.y);
    if (distFromCurrent > bestScore) {
      bestScore = distFromCurrent;
      best = { x: Math.round(cx), y: Math.round(cy) };
    }
  }

  return best;
}
