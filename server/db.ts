import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  DEFAULT_MUSEUM_MUSIC,
  DEFAULT_MUSEUM_PHOTOS,
  DEFAULT_MUSEUM_SETTINGS,
  DEFAULT_MUSEUM_TEXTS,
  DEFAULT_MUSEUM_VIDEOS,
  type MemoryMotif,
  type MemorySection,
  type MuseumContentBundle,
  type MuseumGuestbookEntry,
  type MuseumMusicTrack,
  type MuseumPhotoItem,
  type MuseumSettings,
  type MuseumTextEntry,
  type MuseumVideoItem,
  type MusicZoneTarget,
  type PhotoRoomTarget,
} from '../src/utils/museumContentTypes.ts';
import {
  DEFAULT_PRIVATE_MEMORIES,
  DEFAULT_SECRET_PROGRESS,
  DEFAULT_SECRET_QUIZ_QUESTIONS,
  type PrivateMemoryItem,
  type PrivateMemoryKind,
  type QuizOptionKey,
  type SecretMysteryProgress,
  type SecretQuizQuestion,
} from '../src/utils/secretMystery.ts';

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin';
  createdAt: number;
}

const VALID_SECTIONS = new Set<MemorySection>([
  'Our First Memories',
  'Our First Holidays Together',
  'Special Moments',
  'Beautiful Memories',
  'Forever Together',
  'Garden Memories',
]);

const VALID_MOTIFS = new Set<MemoryMotif>([
  'sunrise',
  'beach',
  'lanterns',
  'roses',
  'stars',
  'rain',
  'autumn',
  'arch',
]);

const VALID_ROOM_TARGETS = new Set<PhotoRoomTarget>(['gallery', 'garden', 'album', 'secret']);
const VALID_MUSIC_ZONES = new Set<MusicZoneTarget>([
  'gallery',
  'theatre',
  'garden',
  'dance',
  'secret',
  'wedding',
  'playlist',
]);
const VALID_STAMPS = new Set<MuseumGuestbookEntry['stamp']>(['♡', '✦', '❀', '★']);
const VALID_QUIZ_OPTIONS = new Set<QuizOptionKey>(['A', 'B', 'C', 'D']);
const VALID_PRIVATE_KINDS = new Set<PrivateMemoryKind>(['photo', 'letter', 'message', 'board', 'code']);

export class MuseumDatabase {
  private readonly db: DatabaseSync;

  constructor(dbPath = path.resolve(process.cwd(), 'data', 'museum.db')) {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
    this.seedDefaults();
  }

  close(): void {
    this.db.close();
  }

  private initSchema(): void {
    this.db.exec(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        section TEXT NOT NULL,
        date_label TEXT NOT NULL,
        description TEXT NOT NULL,
        photo_src TEXT NOT NULL,
        palette_json TEXT NOT NULL,
        motif TEXT NOT NULL,
        room_target TEXT NOT NULL,
        album_page INTEGER,
        sort_order INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        description TEXT NOT NULL,
        video_src TEXT NOT NULL,
        poster_src TEXT NOT NULL,
        is_theatre_active INTEGER NOT NULL DEFAULT 0,
        is_story_video INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS museum_texts (
        key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        category TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS music_tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        zone TEXT NOT NULL,
        audio_src TEXT NOT NULL,
        volume REAL NOT NULL DEFAULT 0.78,
        sort_order INTEGER NOT NULL,
        is_built_in INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS guestbook_entries (
        id TEXT PRIMARY KEY,
        author TEXT NOT NULL,
        message TEXT NOT NULL,
        stamp TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS secret_quiz_questions (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        description TEXT NOT NULL,
        opt_a TEXT NOT NULL,
        opt_b TEXT NOT NULL,
        opt_c TEXT NOT NULL,
        opt_d TEXT NOT NULL,
        correct_option TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS private_memories (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        date_label TEXT NOT NULL,
        body TEXT NOT NULL,
        secret_code TEXT NOT NULL,
        photo_src TEXT NOT NULL,
        palette_json TEXT NOT NULL,
        motif TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS secret_progress (
        id TEXT PRIMARY KEY,
        yes_confirmed INTEGER NOT NULL DEFAULT 0,
        quiz_completed INTEGER NOT NULL DEFAULT 0,
        key_collected INTEGER NOT NULL DEFAULT 0,
        secret_door_unlocked INTEGER NOT NULL DEFAULT 0,
        second_door_unlocked INTEGER NOT NULL DEFAULT 0,
        chamber_discovered INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
    `);

    // Safe migration for pre-existing databases lacking secret_door_unlocked
    const cols = this.db.prepare('PRAGMA table_info(secret_progress)').all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'secret_door_unlocked')) {
      this.db.exec(
        'ALTER TABLE secret_progress ADD COLUMN secret_door_unlocked INTEGER NOT NULL DEFAULT 0;'
      );
    }
  }

  private seedDefaults(): void {
    const now = Date.now();

    const photoCount = (this.db.prepare('SELECT COUNT(*) AS count FROM photos').get() as { count: number }).count;
    if (photoCount === 0) {
      const insertPhoto = this.db.prepare(`
        INSERT INTO photos (id, title, section, date_label, description, photo_src, palette_json, motif, room_target, album_page, sort_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of DEFAULT_MUSEUM_PHOTOS) {
        insertPhoto.run(
          p.id,
          p.title,
          p.section,
          p.date,
          p.description,
          p.photoSrc,
          JSON.stringify(p.palette),
          p.motif,
          p.roomTarget,
          p.albumPage,
          p.sortOrder,
          now
        );
      }
    }

    const videoCount = (this.db.prepare('SELECT COUNT(*) AS count FROM videos').get() as { count: number }).count;
    if (videoCount === 0) {
      const insertVideo = this.db.prepare(`
        INSERT INTO videos (id, title, subtitle, description, video_src, poster_src, is_theatre_active, is_story_video, sort_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const v of DEFAULT_MUSEUM_VIDEOS) {
        insertVideo.run(
          v.id,
          v.title,
          v.subtitle,
          v.description,
          v.videoSrc,
          v.posterSrc,
          v.isTheatreActive ? 1 : 0,
          v.isStoryVideo ? 1 : 0,
          v.sortOrder,
          now
        );
      }
    }

    const upsertText = this.db.prepare(`
      INSERT OR IGNORE INTO museum_texts (key, label, category, value, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const t of DEFAULT_MUSEUM_TEXTS) {
      upsertText.run(t.key, t.label, t.category, t.value, now);
    }

    const musicCount = (this.db.prepare('SELECT COUNT(*) AS count FROM music_tracks').get() as { count: number }).count;
    if (musicCount === 0) {
      const insertMusic = this.db.prepare(`
        INSERT INTO music_tracks (id, title, subtitle, zone, audio_src, volume, sort_order, is_built_in, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const m of DEFAULT_MUSEUM_MUSIC) {
        insertMusic.run(
          m.id,
          m.title,
          m.subtitle,
          m.zone,
          m.audioSrc,
          m.volume,
          m.sortOrder,
          m.isBuiltIn ? 1 : 0,
          now
        );
      }
    }

    const insertSetting = this.db.prepare(`
      INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)
    `);
    insertSetting.run('musicEnabled', String(DEFAULT_MUSEUM_SETTINGS.musicEnabled));
    insertSetting.run('musicVolume', String(DEFAULT_MUSEUM_SETTINGS.musicVolume));
    insertSetting.run('defaultMusicTrackId', DEFAULT_MUSEUM_SETTINGS.defaultMusicTrackId);
    insertSetting.run('galleryMusicTrackId', DEFAULT_MUSEUM_SETTINGS.galleryMusicTrackId);
    insertSetting.run('theatreMusicTrackId', DEFAULT_MUSEUM_SETTINGS.theatreMusicTrackId);
    insertSetting.run('gardenMusicTrackId', DEFAULT_MUSEUM_SETTINGS.gardenMusicTrackId);
    insertSetting.run('danceMusicTrackId', DEFAULT_MUSEUM_SETTINGS.danceMusicTrackId);

    const gbCount = (this.db.prepare('SELECT COUNT(*) AS count FROM guestbook_entries').get() as { count: number }).count;
    if (gbCount === 0) {
      const insertGb = this.db.prepare(`
        INSERT INTO guestbook_entries (id, author, message, stamp, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertGb.run(
        'seed-1',
        'Clara & Julian',
        'Walking through the photo gallery brought tears to my eyes. Wishing you endless adventures.',
        '♡',
        now - 45 * 60 * 1000
      );
      insertGb.run(
        'seed-2',
        'Aunt Eleanor',
        'The Memory Garden lanterns at dusk feel like a fairy tale. So happy for you both!',
        '❀',
        now - 3 * 60 * 60 * 1000
      );
      insertGb.run(
        'seed-3',
        'Marcus',
        'Every corner here holds a story worth keeping forever. Beautiful museum.',
        '✦',
        now - 21 * 60 * 60 * 1000
      );
    }

    const quizCount = (
      this.db.prepare('SELECT COUNT(*) AS count FROM secret_quiz_questions').get() as { count: number }
    ).count;
    if (quizCount === 0) {
      const insertQuiz = this.db.prepare(`
        INSERT INTO secret_quiz_questions (id, question, description, opt_a, opt_b, opt_c, opt_d, correct_option, sort_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const q of DEFAULT_SECRET_QUIZ_QUESTIONS) {
        insertQuiz.run(
          q.id,
          q.question,
          q.description,
          q.options.A,
          q.options.B,
          q.options.C,
          q.options.D,
          q.correctOption,
          q.sortOrder,
          now
        );
      }
    }

    const privCount = (
      this.db.prepare('SELECT COUNT(*) AS count FROM private_memories').get() as { count: number }
    ).count;
    if (privCount === 0) {
      const insertPriv = this.db.prepare(`
        INSERT INTO private_memories (id, kind, title, subtitle, date_label, body, secret_code, photo_src, palette_json, motif, sort_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const pm of DEFAULT_PRIVATE_MEMORIES) {
        insertPriv.run(
          pm.id,
          pm.kind,
          pm.title,
          pm.subtitle,
          pm.dateLabel,
          pm.body,
          pm.secretCode,
          pm.photoSrc,
          JSON.stringify(pm.palette),
          pm.motif,
          pm.sortOrder,
          now
        );
      }
    }

    this.db
      .prepare(
        `INSERT OR IGNORE INTO secret_progress (id, yes_confirmed, quiz_completed, key_collected, second_door_unlocked, chamber_discovered, updated_at)
         VALUES ('default', 0, 0, 0, 0, 0, ?)`
      )
      .run(now);
  }

  // ─── Admin Auth & Revocation ───────────────────────────────────────────────

  hasAdminUser(): boolean {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM admin_users').get() as { count: number };
    return row.count > 0;
  }

  createInitialAdmin(username: string, email: string, passwordHash: string): AdminUserRecord {
    if (this.hasAdminUser()) {
      throw new Error('Admin account already initialized.');
    }
    const id = `admin-${crypto.randomUUID()}`;
    const createdAt = Date.now();
    this.db
      .prepare(
        'INSERT INTO admin_users (id, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, username.toLowerCase(), email.toLowerCase(), passwordHash, 'admin', createdAt);
    return {
      id,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      createdAt,
    };
  }

  findAdminByIdentifier(identifier: string): AdminUserRecord | null {
    const normalized = identifier.trim().toLowerCase();
    const row = this.db
      .prepare(
        'SELECT id, username, email, password_hash, role, created_at FROM admin_users WHERE lower(username) = ? OR lower(email) = ? LIMIT 1'
      )
      .get(normalized, normalized) as
      | {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          role: 'admin';
          created_at: number;
        }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  revokeToken(jti: string, expiresAtSec: number): void {
    this.db.prepare('DELETE FROM revoked_tokens WHERE expires_at < ?').run(Math.floor(Date.now() / 1000));
    this.db.prepare('INSERT OR REPLACE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)').run(jti, expiresAtSec);
  }

  isTokenRevoked(jti: string): boolean {
    const row = this.db.prepare('SELECT jti FROM revoked_tokens WHERE jti = ? LIMIT 1').get(jti);
    return Boolean(row);
  }

  // ─── Content Reads ─────────────────────────────────────────────────────────

  getPhotos(): MuseumPhotoItem[] {
    const rows = this.db
      .prepare(
        'SELECT id, title, section, date_label, description, photo_src, palette_json, motif, room_target, album_page, sort_order FROM photos ORDER BY sort_order ASC, updated_at ASC'
      )
      .all() as Array<{
      id: string;
      title: string;
      section: string;
      date_label: string;
      description: string;
      photo_src: string;
      palette_json: string;
      motif: string;
      room_target: string;
      album_page: number | null;
      sort_order: number;
    }>;

    return rows.map((r) => {
      let palette: [string, string, string] = ['#3d233a', '#9c5268', '#f0b898'];
      try {
        const parsed = JSON.parse(r.palette_json) as string[];
        if (Array.isArray(parsed) && parsed.length === 3) {
          palette = [parsed[0], parsed[1], parsed[2]];
        }
      } catch {
        // default fallback
      }
      return {
        id: r.id,
        title: r.title,
        section: VALID_SECTIONS.has(r.section as MemorySection)
          ? (r.section as MemorySection)
          : 'Our First Memories',
        date: r.date_label,
        description: r.description,
        photoSrc: r.photo_src,
        palette,
        motif: VALID_MOTIFS.has(r.motif as MemoryMotif) ? (r.motif as MemoryMotif) : 'roses',
        roomTarget: VALID_ROOM_TARGETS.has(r.room_target as PhotoRoomTarget)
          ? (r.room_target as PhotoRoomTarget)
          : 'gallery',
        albumPage: typeof r.album_page === 'number' ? r.album_page : null,
        sortOrder: r.sort_order,
      };
    });
  }

  getVideos(): MuseumVideoItem[] {
    const rows = this.db
      .prepare(
        'SELECT id, title, subtitle, description, video_src, poster_src, is_theatre_active, is_story_video, sort_order FROM videos ORDER BY sort_order ASC, updated_at ASC'
      )
      .all() as Array<{
      id: string;
      title: string;
      subtitle: string;
      description: string;
      video_src: string;
      poster_src: string;
      is_theatre_active: number;
      is_story_video: number;
      sort_order: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      description: r.description,
      videoSrc: r.video_src,
      posterSrc: r.poster_src,
      isTheatreActive: Boolean(r.is_theatre_active),
      isStoryVideo: Boolean(r.is_story_video),
      sortOrder: r.sort_order,
    }));
  }

  getTexts(): MuseumTextEntry[] {
    const rows = this.db
      .prepare('SELECT key, label, category, value FROM museum_texts ORDER BY category ASC, key ASC')
      .all() as Array<{
      key: string;
      label: string;
      category: MuseumTextEntry['category'];
      value: string;
    }>;
    return rows;
  }

  getMusicTracks(): MuseumMusicTrack[] {
    const rows = this.db
      .prepare(
        'SELECT id, title, subtitle, zone, audio_src, volume, sort_order, is_built_in FROM music_tracks ORDER BY sort_order ASC, updated_at ASC'
      )
      .all() as Array<{
      id: string;
      title: string;
      subtitle: string;
      zone: string;
      audio_src: string;
      volume: number;
      sort_order: number;
      is_built_in: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      zone: VALID_MUSIC_ZONES.has(r.zone as MusicZoneTarget)
        ? (r.zone as MusicZoneTarget)
        : 'playlist',
      audioSrc: r.audio_src,
      volume: Math.max(0, Math.min(1, Number(r.volume) || 0.75)),
      sortOrder: r.sort_order,
      isBuiltIn: Boolean(r.is_built_in),
    }));
  }

  getSettings(): MuseumSettings {
    const rows = this.db.prepare('SELECT key, value FROM site_settings').all() as Array<{
      key: string;
      value: string;
    }>;
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      musicEnabled: map.get('musicEnabled') !== 'false',
      musicVolume: Math.max(
        0,
        Math.min(1, Number(map.get('musicVolume') ?? DEFAULT_MUSEUM_SETTINGS.musicVolume))
      ),
      defaultMusicTrackId:
        map.get('defaultMusicTrackId') ?? DEFAULT_MUSEUM_SETTINGS.defaultMusicTrackId,
      galleryMusicTrackId:
        map.get('galleryMusicTrackId') ?? DEFAULT_MUSEUM_SETTINGS.galleryMusicTrackId,
      theatreMusicTrackId:
        map.get('theatreMusicTrackId') ?? DEFAULT_MUSEUM_SETTINGS.theatreMusicTrackId,
      gardenMusicTrackId:
        map.get('gardenMusicTrackId') ?? DEFAULT_MUSEUM_SETTINGS.gardenMusicTrackId,
      danceMusicTrackId: map.get('danceMusicTrackId') ?? DEFAULT_MUSEUM_SETTINGS.danceMusicTrackId,
    };
  }

  getGuestbookEntries(): MuseumGuestbookEntry[] {
    const rows = this.db
      .prepare(
        'SELECT id, author, message, stamp, created_at FROM guestbook_entries ORDER BY created_at DESC LIMIT 100'
      )
      .all() as Array<{
      id: string;
      author: string;
      message: string;
      stamp: string;
      created_at: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      author: r.author,
      message: r.message,
      stamp: VALID_STAMPS.has(r.stamp as MuseumGuestbookEntry['stamp'])
        ? (r.stamp as MuseumGuestbookEntry['stamp'])
        : '♡',
      createdAt: r.created_at,
    }));
  }

  getSecretQuiz(): SecretQuizQuestion[] {
    const rows = this.db
      .prepare(
        'SELECT id, question, description, opt_a, opt_b, opt_c, opt_d, correct_option, sort_order FROM secret_quiz_questions ORDER BY sort_order ASC, updated_at ASC'
      )
      .all() as Array<{
      id: string;
      question: string;
      description: string;
      opt_a: string;
      opt_b: string;
      opt_c: string;
      opt_d: string;
      correct_option: string;
      sort_order: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      question: r.question,
      description: r.description,
      options: {
        A: r.opt_a,
        B: r.opt_b,
        C: r.opt_c,
        D: r.opt_d,
      },
      correctOption: VALID_QUIZ_OPTIONS.has(r.correct_option as QuizOptionKey)
        ? (r.correct_option as QuizOptionKey)
        : 'A',
      sortOrder: r.sort_order,
    }));
  }

  getPrivateMemories(): PrivateMemoryItem[] {
    const rows = this.db
      .prepare(
        'SELECT id, kind, title, subtitle, date_label, body, secret_code, photo_src, palette_json, motif, sort_order FROM private_memories ORDER BY sort_order ASC, updated_at ASC'
      )
      .all() as Array<{
      id: string;
      kind: string;
      title: string;
      subtitle: string;
      date_label: string;
      body: string;
      secret_code: string;
      photo_src: string;
      palette_json: string;
      motif: string;
      sort_order: number;
    }>;

    return rows.map((r) => {
      let palette: [string, string, string] = ['#3b182c', '#8b2252', '#e8c488'];
      try {
        const parsed = JSON.parse(r.palette_json) as string[];
        if (Array.isArray(parsed) && parsed.length === 3) {
          palette = [parsed[0], parsed[1], parsed[2]];
        }
      } catch {
        // default fallback
      }
      return {
        id: r.id,
        kind: VALID_PRIVATE_KINDS.has(r.kind as PrivateMemoryKind)
          ? (r.kind as PrivateMemoryKind)
          : 'letter',
        title: r.title,
        subtitle: r.subtitle,
        dateLabel: r.date_label,
        body: r.body,
        secretCode: r.secret_code,
        photoSrc: r.photo_src,
        palette,
        motif: VALID_MOTIFS.has(r.motif as MemoryMotif) ? (r.motif as MemoryMotif) : 'roses',
        sortOrder: r.sort_order,
      };
    });
  }

  getSecretProgress(): SecretMysteryProgress {
    const row = this.db
      .prepare(
        'SELECT yes_confirmed, quiz_completed, key_collected, secret_door_unlocked, second_door_unlocked, chamber_discovered, updated_at FROM secret_progress WHERE id = ? LIMIT 1'
      )
      .get('default') as
      | {
          yes_confirmed: number;
          quiz_completed: number;
          key_collected: number;
          secret_door_unlocked: number;
          second_door_unlocked: number;
          chamber_discovered: number;
          updated_at: number;
        }
      | undefined;

    if (!row) return { ...DEFAULT_SECRET_PROGRESS };
    return {
      yesConfirmed: Boolean(row.yes_confirmed),
      quizCompleted: Boolean(row.quiz_completed),
      keyCollected: Boolean(row.key_collected),
      secretDoorUnlocked: Boolean(row.secret_door_unlocked),
      secondDoorUnlocked: Boolean(row.second_door_unlocked),
      chamberDiscovered: Boolean(row.chamber_discovered),
      updatedAt: row.updated_at,
    };
  }

  getFullBundle(): MuseumContentBundle {
    return {
      photos: this.getPhotos(),
      videos: this.getVideos(),
      texts: this.getTexts(),
      musicTracks: this.getMusicTracks(),
      settings: this.getSettings(),
      guestbookEntries: this.getGuestbookEntries(),
      secretQuiz: this.getSecretQuiz(),
      privateMemories: this.getPrivateMemories(),
      secretProgress: this.getSecretProgress(),
    };
  }

  getReferencedMediaUrls(): Set<string> {
    const urls = new Set<string>();
    for (const p of this.getPhotos()) urls.add(p.photoSrc);
    for (const pm of this.getPrivateMemories()) {
      if (pm.photoSrc) urls.add(pm.photoSrc);
    }
    for (const v of this.getVideos()) {
      urls.add(v.videoSrc);
      urls.add(v.posterSrc);
    }
    for (const m of this.getMusicTracks()) {
      if (m.audioSrc) urls.add(m.audioSrc);
    }
    return urls;
  }

  // ─── Guestbook Mutation ────────────────────────────────────────────────────

  addGuestbookEntry(author: string, message: string, stamp: MuseumGuestbookEntry['stamp']): MuseumGuestbookEntry {
    const entry: MuseumGuestbookEntry = {
      id: `note-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
      author,
      message,
      stamp: VALID_STAMPS.has(stamp) ? stamp : '♡',
      createdAt: Date.now(),
    };
    this.db
      .prepare('INSERT INTO guestbook_entries (id, author, message, stamp, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(entry.id, entry.author, entry.message, entry.stamp, entry.createdAt);
    return entry;
  }

  // ─── Admin Mutations ───────────────────────────────────────────────────────

  createPhoto(input: Omit<MuseumPhotoItem, 'id' | 'sortOrder'> & { sortOrder?: number }): MuseumPhotoItem {
    const maxOrder = (
      this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM photos').get() as {
        max_order: number;
      }
    ).max_order;
    const item: MuseumPhotoItem = {
      ...input,
      id: `mem-${crypto.randomUUID().slice(0, 8)}`,
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : maxOrder + 1,
    };
    this.db
      .prepare(
        `INSERT INTO photos (id, title, section, date_label, description, photo_src, palette_json, motif, room_target, album_page, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        item.id,
        item.title,
        item.section,
        item.date,
        item.description,
        item.photoSrc,
        JSON.stringify(item.palette),
        item.motif,
        item.roomTarget,
        item.albumPage,
        item.sortOrder,
        Date.now()
      );
    return item;
  }

  updatePhoto(
    id: string,
    patch: Partial<Omit<MuseumPhotoItem, 'id'>>
  ): { updated: MuseumPhotoItem | null; oldPhotoSrc: string | null } {
    const existing = this.getPhotos().find((p) => p.id === id);
    if (!existing) return { updated: null, oldPhotoSrc: null };

    const next: MuseumPhotoItem = {
      ...existing,
      ...patch,
      id: existing.id,
    };
    this.db
      .prepare(
        `UPDATE photos
         SET title = ?, section = ?, date_label = ?, description = ?, photo_src = ?, palette_json = ?, motif = ?, room_target = ?, album_page = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        next.title,
        next.section,
        next.date,
        next.description,
        next.photoSrc,
        JSON.stringify(next.palette),
        next.motif,
        next.roomTarget,
        next.albumPage,
        next.sortOrder,
        Date.now(),
        id
      );

    return {
      updated: next,
      oldPhotoSrc: existing.photoSrc !== next.photoSrc ? existing.photoSrc : null,
    };
  }

  reorderPhotos(orderedIds: string[]): void {
    const stmt = this.db.prepare('UPDATE photos SET sort_order = ?, updated_at = ? WHERE id = ?');
    const now = Date.now();
    this.db.exec('BEGIN');
    try {
      orderedIds.forEach((id, idx) => {
        stmt.run(idx + 1, now, id);
      });
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  deletePhoto(id: string): { deleted: boolean; oldPhotoSrc: string | null } {
    const existing = this.getPhotos().find((p) => p.id === id);
    if (!existing) return { deleted: false, oldPhotoSrc: null };
    this.db.prepare('DELETE FROM photos WHERE id = ?').run(id);
    return { deleted: true, oldPhotoSrc: existing.photoSrc };
  }

  createVideo(input: Omit<MuseumVideoItem, 'id' | 'sortOrder'>): MuseumVideoItem {
    const maxOrder = (
      this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM videos').get() as {
        max_order: number;
      }
    ).max_order;
    const item: MuseumVideoItem = {
      ...input,
      id: `vid-${crypto.randomUUID().slice(0, 8)}`,
      sortOrder: maxOrder + 1,
    };
    this.db.exec('BEGIN');
    try {
      if (item.isTheatreActive) {
        this.db.prepare('UPDATE videos SET is_theatre_active = 0').run();
      }
      this.db
        .prepare(
          `INSERT INTO videos (id, title, subtitle, description, video_src, poster_src, is_theatre_active, is_story_video, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          item.id,
          item.title,
          item.subtitle,
          item.description,
          item.videoSrc,
          item.posterSrc,
          item.isTheatreActive ? 1 : 0,
          item.isStoryVideo ? 1 : 0,
          item.sortOrder,
          Date.now()
        );
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
    return item;
  }

  updateVideo(
    id: string,
    patch: Partial<Omit<MuseumVideoItem, 'id'>>
  ): { updated: MuseumVideoItem | null; removedUrls: string[] } {
    const existing = this.getVideos().find((v) => v.id === id);
    if (!existing) return { updated: null, removedUrls: [] };

    const next: MuseumVideoItem = { ...existing, ...patch, id: existing.id };
    this.db.exec('BEGIN');
    try {
      if (next.isTheatreActive) {
        this.db.prepare('UPDATE videos SET is_theatre_active = 0 WHERE id != ?').run(id);
      }
      this.db
        .prepare(
          `UPDATE videos
           SET title = ?, subtitle = ?, description = ?, video_src = ?, poster_src = ?, is_theatre_active = ?, is_story_video = ?, sort_order = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(
          next.title,
          next.subtitle,
          next.description,
          next.videoSrc,
          next.posterSrc,
          next.isTheatreActive ? 1 : 0,
          next.isStoryVideo ? 1 : 0,
          next.sortOrder,
          Date.now(),
          id
        );
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }

    const removedUrls: string[] = [];
    if (existing.videoSrc !== next.videoSrc) removedUrls.push(existing.videoSrc);
    if (existing.posterSrc !== next.posterSrc) removedUrls.push(existing.posterSrc);
    return { updated: next, removedUrls };
  }

  deleteVideo(id: string): { deleted: boolean; removedUrls: string[] } {
    const existing = this.getVideos().find((v) => v.id === id);
    if (!existing) return { deleted: false, removedUrls: [] };
    this.db.prepare('DELETE FROM videos WHERE id = ?').run(id);
    return { deleted: true, removedUrls: [existing.videoSrc, existing.posterSrc] };
  }

  updateTexts(updates: Array<{ key: string; value: string }>): MuseumTextEntry[] {
    const stmt = this.db.prepare('UPDATE museum_texts SET value = ?, updated_at = ? WHERE key = ?');
    const now = Date.now();
    this.db.exec('BEGIN');
    try {
      for (const u of updates) {
        stmt.run(u.value, now, u.key);
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
    return this.getTexts();
  }

  createMusicTrack(input: Omit<MuseumMusicTrack, 'id' | 'sortOrder' | 'isBuiltIn'>): MuseumMusicTrack {
    const maxOrder = (
      this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM music_tracks').get() as {
        max_order: number;
      }
    ).max_order;
    const item: MuseumMusicTrack = {
      ...input,
      id: `track-${crypto.randomUUID().slice(0, 8)}`,
      sortOrder: maxOrder + 1,
      isBuiltIn: false,
    };
    this.db
      .prepare(
        `INSERT INTO music_tracks (id, title, subtitle, zone, audio_src, volume, sort_order, is_built_in, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        item.id,
        item.title,
        item.subtitle,
        item.zone,
        item.audioSrc,
        item.volume,
        item.sortOrder,
        0,
        Date.now()
      );
    return item;
  }

  updateMusicTrack(
    id: string,
    patch: Partial<Omit<MuseumMusicTrack, 'id' | 'isBuiltIn'>>
  ): { updated: MuseumMusicTrack | null; oldAudioSrc: string | null } {
    const existing = this.getMusicTracks().find((m) => m.id === id);
    if (!existing) return { updated: null, oldAudioSrc: null };

    const next: MuseumMusicTrack = {
      ...existing,
      ...patch,
      id: existing.id,
      isBuiltIn: existing.isBuiltIn,
    };
    this.db
      .prepare(
        `UPDATE music_tracks
         SET title = ?, subtitle = ?, zone = ?, audio_src = ?, volume = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        next.title,
        next.subtitle,
        next.zone,
        next.audioSrc,
        next.volume,
        next.sortOrder,
        Date.now(),
        id
      );

    return {
      updated: next,
      oldAudioSrc: existing.audioSrc && existing.audioSrc !== next.audioSrc ? existing.audioSrc : null,
    };
  }

  reorderMusicTracks(orderedIds: string[]): void {
    const stmt = this.db.prepare('UPDATE music_tracks SET sort_order = ?, updated_at = ? WHERE id = ?');
    const now = Date.now();
    this.db.exec('BEGIN');
    try {
      orderedIds.forEach((id, idx) => {
        stmt.run(idx + 1, now, id);
      });
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  deleteMusicTrack(id: string): { deleted: boolean; oldAudioSrc: string | null } {
    const existing = this.getMusicTracks().find((m) => m.id === id);
    if (!existing) return { deleted: false, oldAudioSrc: null };
    if (existing.isBuiltIn) {
      throw new Error('Built-in museum scores cannot be deleted; replace or assign a custom track instead.');
    }
    this.db.prepare('DELETE FROM music_tracks WHERE id = ?').run(id);
    return { deleted: true, oldAudioSrc: existing.audioSrc || null };
  }

  updateSettings(patch: Partial<MuseumSettings>): MuseumSettings {
    const current = this.getSettings();
    const next: MuseumSettings = {
      ...current,
      ...patch,
      musicVolume:
        typeof patch.musicVolume === 'number'
          ? Math.max(0, Math.min(1, patch.musicVolume))
          : current.musicVolume,
    };
    const stmt = this.db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)');
    this.db.exec('BEGIN');
    try {
      stmt.run('musicEnabled', String(next.musicEnabled));
      stmt.run('musicVolume', String(next.musicVolume));
      stmt.run('defaultMusicTrackId', next.defaultMusicTrackId);
      stmt.run('galleryMusicTrackId', next.galleryMusicTrackId);
      stmt.run('theatreMusicTrackId', next.theatreMusicTrackId);
      stmt.run('gardenMusicTrackId', next.gardenMusicTrackId);
      stmt.run('danceMusicTrackId', next.danceMusicTrackId);
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
    return next;
  }

  // ─── Secret Room Mystery Progress & Content CRUD ───────────────────────────

  updateSecretProgress(
    patch: Partial<Omit<SecretMysteryProgress, 'updatedAt'>>
  ): SecretMysteryProgress {
    const cur = this.getSecretProgress();
    const yesConfirmed = cur.yesConfirmed || Boolean(patch.yesConfirmed);
    const quizCompleted = cur.quizCompleted || (yesConfirmed && Boolean(patch.quizCompleted));
    const keyCollected = cur.keyCollected || (quizCompleted && Boolean(patch.keyCollected));
    const secretDoorUnlocked =
      cur.secretDoorUnlocked || (keyCollected && Boolean(patch.secretDoorUnlocked));
    const secondDoorUnlocked =
      cur.secondDoorUnlocked || (keyCollected && Boolean(patch.secondDoorUnlocked));
    const chamberDiscovered =
      cur.chamberDiscovered || (secondDoorUnlocked && Boolean(patch.chamberDiscovered));
    const updatedAt = Date.now();

    this.db
      .prepare(
        `INSERT OR REPLACE INTO secret_progress
         (id, yes_confirmed, quiz_completed, key_collected, secret_door_unlocked, second_door_unlocked, chamber_discovered, updated_at)
         VALUES ('default', ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        yesConfirmed ? 1 : 0,
        quizCompleted ? 1 : 0,
        keyCollected ? 1 : 0,
        secretDoorUnlocked ? 1 : 0,
        secondDoorUnlocked ? 1 : 0,
        chamberDiscovered ? 1 : 0,
        updatedAt
      );

    return {
      yesConfirmed,
      quizCompleted,
      keyCollected,
      secretDoorUnlocked,
      secondDoorUnlocked,
      chamberDiscovered,
      updatedAt,
    };
  }

  resetSecretProgress(): SecretMysteryProgress {
    const updatedAt = Date.now();
    this.db
      .prepare(
        `INSERT OR REPLACE INTO secret_progress
         (id, yes_confirmed, quiz_completed, key_collected, secret_door_unlocked, second_door_unlocked, chamber_discovered, updated_at)
         VALUES ('default', 0, 0, 0, 0, 0, 0, ?)`
      )
      .run(updatedAt);
    return { ...DEFAULT_SECRET_PROGRESS, updatedAt };
  }

  createQuizQuestion(
    input: Omit<SecretQuizQuestion, 'id' | 'sortOrder'> & { sortOrder?: number }
  ): SecretQuizQuestion {
    const maxOrder = (
      this.db
        .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM secret_quiz_questions')
        .get() as { max_order: number }
    ).max_order;
    const item: SecretQuizQuestion = {
      ...input,
      id: `quiz-${crypto.randomUUID().slice(0, 8)}`,
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : maxOrder + 1,
    };
    this.db
      .prepare(
        `INSERT INTO secret_quiz_questions (id, question, description, opt_a, opt_b, opt_c, opt_d, correct_option, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        item.id,
        item.question,
        item.description,
        item.options.A,
        item.options.B,
        item.options.C,
        item.options.D,
        item.correctOption,
        item.sortOrder,
        Date.now()
      );
    return item;
  }

  updateQuizQuestion(
    id: string,
    patch: Partial<Omit<SecretQuizQuestion, 'id'>>
  ): SecretQuizQuestion | null {
    const existing = this.getSecretQuiz().find((q) => q.id === id);
    if (!existing) return null;
    const next: SecretQuizQuestion = {
      ...existing,
      ...patch,
      options: patch.options ? { ...existing.options, ...patch.options } : existing.options,
      id: existing.id,
    };
    this.db
      .prepare(
        `UPDATE secret_quiz_questions
         SET question = ?, description = ?, opt_a = ?, opt_b = ?, opt_c = ?, opt_d = ?, correct_option = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        next.question,
        next.description,
        next.options.A,
        next.options.B,
        next.options.C,
        next.options.D,
        next.correctOption,
        next.sortOrder,
        Date.now(),
        id
      );
    return next;
  }

  reorderQuizQuestions(orderedIds: string[]): void {
    const stmt = this.db.prepare(
      'UPDATE secret_quiz_questions SET sort_order = ?, updated_at = ? WHERE id = ?'
    );
    const now = Date.now();
    this.db.exec('BEGIN');
    try {
      orderedIds.forEach((id, idx) => {
        stmt.run(idx + 1, now, id);
      });
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  deleteQuizQuestion(id: string): boolean {
    const existing = this.getSecretQuiz().find((q) => q.id === id);
    if (!existing) return false;
    this.db.prepare('DELETE FROM secret_quiz_questions WHERE id = ?').run(id);
    return true;
  }

  createPrivateMemory(
    input: Omit<PrivateMemoryItem, 'id' | 'sortOrder'> & { sortOrder?: number }
  ): PrivateMemoryItem {
    const maxOrder = (
      this.db
        .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM private_memories')
        .get() as { max_order: number }
    ).max_order;
    const item: PrivateMemoryItem = {
      ...input,
      id: `priv-${crypto.randomUUID().slice(0, 8)}`,
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : maxOrder + 1,
    };
    this.db
      .prepare(
        `INSERT INTO private_memories (id, kind, title, subtitle, date_label, body, secret_code, photo_src, palette_json, motif, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        item.id,
        item.kind,
        item.title,
        item.subtitle,
        item.dateLabel,
        item.body,
        item.secretCode,
        item.photoSrc,
        JSON.stringify(item.palette),
        item.motif,
        item.sortOrder,
        Date.now()
      );
    return item;
  }

  updatePrivateMemory(
    id: string,
    patch: Partial<Omit<PrivateMemoryItem, 'id'>>
  ): { updated: PrivateMemoryItem | null; oldPhotoSrc: string | null } {
    const existing = this.getPrivateMemories().find((pm) => pm.id === id);
    if (!existing) return { updated: null, oldPhotoSrc: null };
    const next: PrivateMemoryItem = {
      ...existing,
      ...patch,
      id: existing.id,
    };
    this.db
      .prepare(
        `UPDATE private_memories
         SET kind = ?, title = ?, subtitle = ?, date_label = ?, body = ?, secret_code = ?, photo_src = ?, palette_json = ?, motif = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        next.kind,
        next.title,
        next.subtitle,
        next.dateLabel,
        next.body,
        next.secretCode,
        next.photoSrc,
        JSON.stringify(next.palette),
        next.motif,
        next.sortOrder,
        Date.now(),
        id
      );
    return {
      updated: next,
      oldPhotoSrc: existing.photoSrc && existing.photoSrc !== next.photoSrc ? existing.photoSrc : null,
    };
  }

  reorderPrivateMemories(orderedIds: string[]): void {
    const stmt = this.db.prepare(
      'UPDATE private_memories SET sort_order = ?, updated_at = ? WHERE id = ?'
    );
    const now = Date.now();
    this.db.exec('BEGIN');
    try {
      orderedIds.forEach((id, idx) => {
        stmt.run(idx + 1, now, id);
      });
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  deletePrivateMemory(id: string): { deleted: boolean; oldPhotoSrc: string | null } {
    const existing = this.getPrivateMemories().find((pm) => pm.id === id);
    if (!existing) return { deleted: false, oldPhotoSrc: null };
    this.db.prepare('DELETE FROM private_memories WHERE id = ?').run(id);
    return { deleted: true, oldPhotoSrc: existing.photoSrc || null };
  }
}
