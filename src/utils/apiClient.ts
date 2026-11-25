import type {
  MuseumContentBundle,
  MuseumGuestbookEntry,
  MuseumMusicTrack,
  MuseumPhotoItem,
  MuseumSettings,
  MuseumVideoItem,
} from './museumContentTypes';
import type {
  PrivateMemoryItem,
  SecretMysteryProgress,
  SecretQuizQuestion,
} from './secretMystery';
import type { GuestbookStamp } from './guestbook';

export interface AdminUserSummary {
  username: string;
  email: string;
  role: 'admin';
}

export interface AdminStatusResponse {
  setupRequired: boolean;
  authenticated: boolean;
  admin: AdminUserSummary | null;
}

export interface AdminAuthResponse {
  token: string;
  admin: AdminUserSummary;
}

export interface UploadResponse {
  url: string;
  publicUrl: string;
  signedPreviewUrl: string;
  filename: string;
  mime: string;
  mimeType: string;
  size: number;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Server returned invalid response (${res.status})`);
  }
  if (!res.ok) {
    const message =
      typeof data.error === 'string' && data.error.trim().length > 0
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMuseumContent(): Promise<MuseumContentBundle> {
  const res = await fetch('/api/museum-content');
  return parseJsonOrThrow<MuseumContentBundle>(res);
}

export async function postGuestbookNote(
  author: string,
  message: string,
  stamp: GuestbookStamp
): Promise<MuseumGuestbookEntry> {
  const res = await fetch('/api/guestbook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, message, stamp }),
  });
  const data = await parseJsonOrThrow<{ entry: MuseumGuestbookEntry }>(res);
  return data.entry;
}

export async function fetchAdminStatus(token: string | null): Promise<AdminStatusResponse> {
  const res = await fetch('/api/admin/status', {
    headers: authHeaders(token),
  });
  return parseJsonOrThrow<AdminStatusResponse>(res);
}

export async function bootstrapAdmin(
  username: string,
  email: string,
  password: string
): Promise<AdminAuthResponse> {
  const res = await fetch('/api/admin/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return parseJsonOrThrow<AdminAuthResponse>(res);
}

export async function loginAdmin(
  identifier: string,
  password: string
): Promise<AdminAuthResponse> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  return parseJsonOrThrow<AdminAuthResponse>(res);
}

export async function logoutAdmin(token: string | null): Promise<void> {
  if (!token) return;
  await fetch('/api/admin/logout', {
    method: 'POST',
    headers: authHeaders(token),
  }).catch(() => {});
}

export async function uploadAdminMedia(
  token: string,
  category: 'photos' | 'videos' | 'music',
  file: File
): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/admin/upload/${category}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  });
  const data = await parseJsonOrThrow<UploadResponse>(res);
  const resolvedUrl = data.publicUrl || data.url;
  return {
    ...data,
    publicUrl: resolvedUrl,
    url: resolvedUrl,
  };
}

export async function createAdminPhoto(
  token: string,
  payload: Omit<MuseumPhotoItem, 'id' | 'sortOrder'>
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function updateAdminPhoto(
  token: string,
  id: string,
  patch: Partial<Omit<MuseumPhotoItem, 'id'>>
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/photos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function reorderAdminPhotos(
  token: string,
  orderedIds: string[]
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/photos/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ orderedIds }),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function deleteAdminPhoto(
  token: string,
  id: string
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/photos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function createAdminVideo(
  token: string,
  payload: Omit<MuseumVideoItem, 'id' | 'sortOrder'>
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function updateAdminVideo(
  token: string,
  id: string,
  patch: Partial<Omit<MuseumVideoItem, 'id'>>
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/videos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function deleteAdminVideo(
  token: string,
  id: string
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/videos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function updateAdminTexts(
  token: string,
  texts: Array<{ key: string; value: string }>
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/texts', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ texts }),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function createAdminMusicTrack(
  token: string,
  payload: Omit<MuseumMusicTrack, 'id' | 'sortOrder' | 'isBuiltIn'>
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function updateAdminMusicTrack(
  token: string,
  id: string,
  patch: Partial<Omit<MuseumMusicTrack, 'id' | 'isBuiltIn'>>
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/music/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function reorderAdminMusicTracks(
  token: string,
  orderedIds: string[]
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/music/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ orderedIds }),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function deleteAdminMusicTrack(
  token: string,
  id: string
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/music/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function updateAdminSettings(
  token: string,
  settings: Partial<MuseumSettings>
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(settings),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function postSecretProgress(
  patch: Partial<Omit<SecretMysteryProgress, 'updatedAt'>>
): Promise<SecretMysteryProgress> {
  const res = await fetch('/api/secret/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonOrThrow<{ secretProgress: SecretMysteryProgress }>(res);
  return data.secretProgress;
}

export async function resetAdminSecretProgress(token: string): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/secret/reset-progress', {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function createAdminQuizQuestion(
  token: string,
  payload: Omit<SecretQuizQuestion, 'id' | 'sortOrder'>
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/secret-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function updateAdminQuizQuestion(
  token: string,
  id: string,
  patch: Partial<Omit<SecretQuizQuestion, 'id'>>
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/secret-quiz/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function reorderAdminQuizQuestions(
  token: string,
  orderedIds: string[]
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/secret-quiz/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ orderedIds }),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function deleteAdminQuizQuestion(
  token: string,
  id: string
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/secret-quiz/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function createAdminPrivateMemory(
  token: string,
  payload: Omit<PrivateMemoryItem, 'id' | 'sortOrder'>
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/private-memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function updateAdminPrivateMemory(
  token: string,
  id: string,
  patch: Partial<Omit<PrivateMemoryItem, 'id'>>
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/private-memories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function reorderAdminPrivateMemories(
  token: string,
  orderedIds: string[]
): Promise<MuseumContentBundle> {
  const res = await fetch('/api/admin/private-memories/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ orderedIds }),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}

export async function deleteAdminPrivateMemory(
  token: string,
  id: string
): Promise<MuseumContentBundle> {
  const res = await fetch(`/api/admin/private-memories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await parseJsonOrThrow<{ bundle: MuseumContentBundle }>(res);
  return data.bundle;
}
