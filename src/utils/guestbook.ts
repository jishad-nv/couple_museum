export type GuestbookStamp = '♡' | '✦' | '✿' | '♪' | '❀' | '★';

export interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  stamp: GuestbookStamp;
  createdAt: number;
}

export interface GuestbookValidationResult {
  valid: boolean;
  authorError: string | null;
  messageError: string | null;
}

export const GUESTBOOK_STAMPS: ReadonlyArray<{ symbol: GuestbookStamp; label: string }> = [
  { symbol: '♡', label: 'Heart' },
  { symbol: '✦', label: 'Star' },
  { symbol: '✿', label: 'Bloom' },
  { symbol: '♪', label: 'Song' },
];

export const MAX_AUTHOR_LENGTH = 32;
export const MAX_MESSAGE_LENGTH = 200;
export const DEFAULT_RECENT_LIMIT = 3;

const SEED_BASE_TIME = Date.now();

export const INITIAL_GUESTBOOK_ENTRIES: GuestbookEntry[] = [
  {
    id: 'seed-1',
    author: 'Clara & Julian',
    message: 'Walking through the photo gallery brought tears to my eyes. Wishing you endless adventures.',
    stamp: '♡',
    createdAt: SEED_BASE_TIME - 45 * 60 * 1000,
  },
  {
    id: 'seed-2',
    author: 'Aunt Eleanor',
    message: 'The Memory Garden lanterns at dusk feel like a fairy tale. So happy for you both!',
    stamp: '✿',
    createdAt: SEED_BASE_TIME - 3 * 60 * 60 * 1000,
  },
  {
    id: 'seed-3',
    author: 'Marcus',
    message: 'Every corner here holds a story worth keeping forever. Beautiful museum.',
    stamp: '✦',
    createdAt: SEED_BASE_TIME - 21 * 60 * 60 * 1000,
  },
];

export function validateGuestbookInput(
  author: string,
  message: string
): GuestbookValidationResult {
  const trimmedAuthor = author.trim();
  const trimmedMessage = message.trim();

  let authorError: string | null = null;
  let messageError: string | null = null;

  if (!trimmedAuthor) {
    authorError = 'Please enter your name.';
  } else if (trimmedAuthor.length > MAX_AUTHOR_LENGTH) {
    authorError = `Name must be ${MAX_AUTHOR_LENGTH} characters or fewer.`;
  }

  if (!trimmedMessage) {
    messageError = 'Please write a note before signing.';
  } else if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    messageError = `Note must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  }

  return {
    valid: authorError === null && messageError === null,
    authorError,
    messageError,
  };
}

export function createGuestbookEntry(
  author: string,
  message: string,
  stamp: GuestbookStamp = '♡',
  now: number = Date.now(),
  id?: string
): GuestbookEntry {
  const validation = validateGuestbookInput(author, message);
  if (!validation.valid) {
    throw new Error(validation.authorError || validation.messageError || 'Invalid guestbook entry');
  }

  return {
    id: id ?? `note-${now}-${Math.random().toString(36).slice(2, 7)}`,
    author: author.trim(),
    message: message.trim(),
    stamp,
    createdAt: now,
  };
}

export function addGuestbookEntry(
  entries: GuestbookEntry[],
  newEntry: GuestbookEntry
): GuestbookEntry[] {
  return [newEntry, ...entries];
}

export function getRecentGuestbookEntries(
  entries: GuestbookEntry[],
  limit: number = DEFAULT_RECENT_LIMIT
): GuestbookEntry[] {
  if (limit <= 0) return [];
  return [...entries]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function formatGuestbookTime(timestamp: number, now: number = Date.now()): string {
  const diffMs = Math.max(0, now - timestamp);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
