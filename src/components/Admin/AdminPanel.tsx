import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  createAdminMusicTrack,
  createAdminPhoto,
  createAdminPrivateMemory,
  createAdminQuizQuestion,
  createAdminVideo,
  deleteAdminMusicTrack,
  deleteAdminPhoto,
  deleteAdminPrivateMemory,
  deleteAdminQuizQuestion,
  deleteAdminVideo,
  reorderAdminMusicTracks,
  reorderAdminPhotos,
  reorderAdminPrivateMemories,
  reorderAdminQuizQuestions,
  resetAdminSecretPassword,
  resetAdminSecretProgress,
  updateAdminMusicTrack,
  updateAdminPhoto,
  updateAdminPrivateMemory,
  updateAdminQuizQuestion,
  updateAdminSecretPassword,
  updateAdminSettings,
  updateAdminTexts,
  updateAdminVideo,
  uploadAdminMedia,
} from '../../utils/apiClient';
import { getMemoryArtworkDataUrl } from '../../utils/memoryArt';
import { buildAlbumSpreads } from '../../utils/loveAlbum';
import type {
  MemoryMotif,
  MemorySection,
  MuseumMusicTrack,
  MuseumPhotoItem,
  MuseumVideoItem,
  MusicZoneTarget,
  PhotoRoomTarget,
} from '../../utils/museumContentTypes';
import type {
  PrivateMemoryItem,
  PrivateMemoryKind,
  QuizOptionKey,
  SecretQuizQuestion,
} from '../../utils/secretMystery';
import { COLORS } from '../../utils/constants';

type AdminTab = 'photos' | 'videos' | 'texts' | 'music' | 'quiz' | 'private' | 'settings';

const PHOTO_SECTIONS: MemorySection[] = [
  'Our First Memories',
  'Our First Holidays Together',
  'Special Moments',
  'Beautiful Memories',
  'Forever Together',
  'Garden Memories',
];

const PHOTO_MOTIFS: MemoryMotif[] = [
  'sunrise',
  'beach',
  'lanterns',
  'roses',
  'stars',
  'rain',
  'autumn',
  'arch',
];

const panelInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 7,
  border: '1px solid rgba(200, 165, 90, 0.34)',
  background: '#23162c',
  color: '#fbf4e7',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const goldBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: `1px solid ${COLORS.gold}`,
  background: COLORS.gold,
  color: '#1b1020',
  fontSize: 12.5,
  fontWeight: 700,
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
};

const subtleBtnStyle: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid rgba(200, 165, 90, 0.35)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#f6ebd6',
  fontSize: 12,
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
};

const dangerBtnStyle: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid rgba(240, 123, 138, 0.55)',
  background: 'rgba(160, 42, 62, 0.28)',
  color: '#ffd5dc',
  fontSize: 12,
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
};

function PhotoItemRow({
  photo,
  index,
  total,
  token,
  onSaved,
  onStatus,
}: {
  photo: MuseumPhotoItem;
  index: number;
  total: number;
  token: string;
  onSaved: (bundle: Awaited<ReturnType<typeof updateAdminPhoto>>) => void;
  onStatus: (msg: string, isError?: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(photo.title);
  const [section, setSection] = useState<MemorySection>(photo.section);
  const [date, setDate] = useState(photo.date);
  const [description, setDescription] = useState(photo.description);
  const [roomTarget, setRoomTarget] = useState<PhotoRoomTarget>(photo.roomTarget);
  const [albumPage, setAlbumPage] = useState<string>(photo.albumPage ? String(photo.albumPage) : '');
  const [motif, setMotif] = useState<MemoryMotif>(photo.motif);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(photo.title);
    setSection(photo.section);
    setDate(photo.date);
    setDescription(photo.description);
    setRoomTarget(photo.roomTarget);
    setAlbumPage(photo.albumPage ? String(photo.albumPage) : '');
    setMotif(photo.motif);
  }, [photo]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSave = async () => {
    if (!title.trim()) {
      onStatus('Photo title cannot be empty.', true);
      return;
    }
    setBusy(true);
    try {
      let nextPhotoSrc = photo.photoSrc;
      if (pendingFile) {
        const uploaded = await uploadAdminMedia(token, 'photos', pendingFile);
        nextPhotoSrc = uploaded.url;
      }
      const bundle = await updateAdminPhoto(token, photo.id, {
        title: title.trim(),
        section,
        date: date.trim(),
        description: description.trim(),
        roomTarget,
        albumPage: albumPage.trim() ? Number(albumPage) : null,
        motif,
        photoSrc: nextPhotoSrc,
      });
      onSaved(bundle);
      setPendingFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setEditing(false);
      onStatus(`Updated photograph “${title.trim()}”.`);
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Failed to update photograph.', true);
    } finally {
      setBusy(false);
    }
  };

  const thumbUrl = previewUrl ?? getMemoryArtworkDataUrl(photo);

  return (
    <div
      data-testid={`admin-photo-row-${photo.id}`}
      style={{
        background: 'rgba(255, 250, 240, 0.04)',
        border: '1px solid rgba(200, 165, 90, 0.25)',
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <img
          src={thumbUrl}
          alt={photo.title}
          style={{
            width: 84,
            height: 64,
            objectFit: 'cover',
            borderRadius: 6,
            border: '1px solid rgba(200, 165, 90, 0.45)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff4da' }}>{photo.title}</div>
          <div style={{ fontSize: 11.5, color: '#d7c39c', marginTop: 2 }}>
            {photo.section} · {photo.date} · Room: <strong>{photo.roomTarget}</strong>
            {photo.albumPage ? ` · Album Page ${photo.albumPage}` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(248, 241, 229, 0.72)', marginTop: 3 }}>
            {photo.description}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={async () => {
              const photos = useGameStore.getState().photos;
              const ids = photos.map((p) => p.id);
              const idx = ids.indexOf(photo.id);
              if (idx > 0) {
                [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                const bundle = await reorderAdminPhotos(token, ids);
                onSaved(bundle);
                onStatus(`Moved “${photo.title}” up.`);
              }
            }}
            aria-label={`Move ${photo.title} up`}
            style={{ ...subtleBtnStyle, opacity: index === 0 ? 0.4 : 1 }}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1 || busy}
            onClick={async () => {
              const photos = useGameStore.getState().photos;
              const ids = photos.map((p) => p.id);
              const idx = ids.indexOf(photo.id);
              if (idx >= 0 && idx < ids.length - 1) {
                [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
                const bundle = await reorderAdminPhotos(token, ids);
                onSaved(bundle);
                onStatus(`Moved “${photo.title}” down.`);
              }
            }}
            aria-label={`Move ${photo.title} down`}
            style={{ ...subtleBtnStyle, opacity: index === total - 1 ? 0.4 : 1 }}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            style={subtleBtnStyle}
          >
            {editing ? 'Cancel' : 'Edit / Replace'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const bundle = await deleteAdminPhoto(token, photo.id);
                onSaved(bundle);
                onStatus(`Removed “${photo.title}”.`);
              } catch (err) {
                onStatus(err instanceof Error ? err.message : 'Failed to delete photograph.', true);
              } finally {
                setBusy(false);
              }
            }}
            style={dangerBtnStyle}
          >
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(200, 165, 90, 0.2)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 10,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={panelInputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>Date / Caption</label>
            <input value={date} onChange={(e) => setDate(e.target.value)} style={panelInputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>Gallery Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value as MemorySection)} style={panelInputStyle}>
              {PHOTO_SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>Placement</label>
            <select value={roomTarget} onChange={(e) => setRoomTarget(e.target.value as PhotoRoomTarget)} style={panelInputStyle}>
              <option value="gallery">Circular Gallery Walls</option>
              <option value="garden">Garden Blossom Trees</option>
              <option value="album">Love Album Exclusive</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>Album Page # (optional)</label>
            <input
              type="number"
              min={1}
              max={200}
              value={albumPage}
              onChange={(e) => setAlbumPage(e.target.value)}
              placeholder="Auto / Unassigned"
              style={panelInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>Art Motif (fallback)</label>
            <select value={motif} onChange={(e) => setMotif(e.target.value as MemoryMotif)} style={panelInputStyle}>
              {PHOTO_MOTIFS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>Memory Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} style={panelInputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <label style={{ fontSize: 12, color: '#e8d7b3' }}>
              Replace Image File:{' '}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPendingFile(f);
                  setPreviewUrl(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>
            <button type="button" disabled={busy} onClick={handleSave} style={goldBtnStyle}>
              {busy ? 'Saving...' : 'Save Photo Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const showAdminPanel = useGameStore((s) => s.showAdminPanel);
  const adminToken = useGameStore((s) => s.adminToken);
  const adminUser = useGameStore((s) => s.adminUser);

  const photos = useGameStore((s) => s.photos);
  const videos = useGameStore((s) => s.videos);
  const texts = useGameStore((s) => s.texts);
  const musicTracks = useGameStore((s) => s.musicTracks);
  const museumSettings = useGameStore((s) => s.museumSettings);
  const secretQuiz = useGameStore((s) => s.secretQuiz);
  const privateMemories = useGameStore((s) => s.privateMemories);
  const secretProgress = useGameStore((s) => s.secretProgress);
  const secretPasswordConfigured = useGameStore((s) => s.secretPasswordConfigured);

  const setShowAdminPanel = useGameStore((s) => s.setShowAdminPanel);
  const setShowLoveAlbum = useGameStore((s) => s.setShowLoveAlbum);
  const setShowLoveQuizModal = useGameStore((s) => s.setShowLoveQuizModal);
  const openPrivateMemory = useGameStore((s) => s.openPrivateMemory);
  const applyMuseumBundle = useGameStore((s) => s.applyMuseumBundle);
  const loadMuseumContent = useGameStore((s) => s.loadMuseumContent);
  const signOutAdmin = useGameStore((s) => s.signOutAdmin);

  const [tab, setTab] = useState<AdminTab>('photos');
  const [statusBanner, setStatusBanner] = useState<{ msg: string; error: boolean } | null>(null);

  // Add Photo state
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoSection, setNewPhotoSection] = useState<MemorySection>('Our First Memories');
  const [newPhotoDate, setNewPhotoDate] = useState('Cherished Day');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');
  const [newPhotoRoom, setNewPhotoRoom] = useState<PhotoRoomTarget>('gallery');
  const [newPhotoAlbumPage, setNewPhotoAlbumPage] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [creatingPhoto, setCreatingPhoto] = useState(false);

  // Add Video state
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoSubtitle, setNewVideoSubtitle] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null);
  const [newVideoTheatreActive, setNewVideoTheatreActive] = useState(true);
  const [newVideoStory, setNewVideoStory] = useState(true);
  const [creatingVideo, setCreatingVideo] = useState(false);

  // Texts state
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
  const [savingTexts, setSavingTexts] = useState(false);

  // Add Music state
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackSubtitle, setNewTrackSubtitle] = useState('Curated Love Melody');
  const [newTrackZone, setNewTrackZone] = useState<MusicZoneTarget>('playlist');
  const [newTrackVolume, setNewTrackVolume] = useState(0.8);
  const [newTrackFile, setNewTrackFile] = useState<File | null>(null);
  const [newTrackPreview, setNewTrackPreview] = useState<string | null>(null);
  const [creatingTrack, setCreatingTrack] = useState(false);

  // Secret Quiz state
  const [newQuizQuestion, setNewQuizQuestion] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizOptA, setNewQuizOptA] = useState('');
  const [newQuizOptB, setNewQuizOptB] = useState('');
  const [newQuizOptC, setNewQuizOptC] = useState('');
  const [newQuizOptD, setNewQuizOptD] = useState('');
  const [newQuizCorrect, setNewQuizCorrect] = useState<QuizOptionKey>('A');
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);

  // Secret Room Password Settings state
  const [secretPw, setSecretPw] = useState('');
  const [secretPwConfirm, setSecretPwConfirm] = useState('');
  const [savingSecretPw, setSavingSecretPw] = useState(false);
  const [resettingSecretPw, setResettingSecretPw] = useState(false);

  // Private Memories state
  const [newPrivKind, setNewPrivKind] = useState<PrivateMemoryKind>('letter');
  const [newPrivTitle, setNewPrivTitle] = useState('');
  const [newPrivSubtitle, setNewPrivSubtitle] = useState('');
  const [newPrivDate, setNewPrivDate] = useState('Private Date');
  const [newPrivCode, setNewPrivCode] = useState('');
  const [newPrivBody, setNewPrivBody] = useState('');
  const [newPrivMotif, setNewPrivMotif] = useState<MemoryMotif>('roses');
  const [newPrivFile, setNewPrivFile] = useState<File | null>(null);
  const [creatingPriv, setCreatingPriv] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const item of texts) map[item.key] = item.value;
    setTextDrafts(map);
  }, [texts]);

  useEffect(() => {
    return () => {
      if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
      if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
      if (newTrackPreview) URL.revokeObjectURL(newTrackPreview);
    };
  }, [newPhotoPreview, newVideoPreview, newTrackPreview]);

  useEffect(() => {
    if (!showAdminPanel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAdminPanel(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAdminPanel, setShowAdminPanel]);

  if (!showAdminPanel || !adminToken) return null;

  const notify = (msg: string, error = false) => setStatusBanner({ msg, error });

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoTitle.trim()) {
      notify('Please provide a photograph title.', true);
      return;
    }
    if (!newPhotoFile) {
      notify('Please choose an image file (JPG, PNG, or WEBP) to upload.', true);
      return;
    }
    setCreatingPhoto(true);
    try {
      const uploaded = await uploadAdminMedia(adminToken, 'photos', newPhotoFile);
      const bundle = await createAdminPhoto(adminToken, {
        title: newPhotoTitle.trim(),
        section: newPhotoSection,
        date: newPhotoDate.trim() || 'Special Moment',
        description: newPhotoDesc.trim(),
        photoSrc: uploaded.url,
        palette: ['#3d233a', '#9c5268', '#f0b898'],
        motif: 'roses',
        roomTarget: newPhotoRoom,
        albumPage: newPhotoAlbumPage.trim() ? Number(newPhotoAlbumPage) : null,
      });
      applyMuseumBundle(bundle);
      setNewPhotoTitle('');
      setNewPhotoDesc('');
      setNewPhotoAlbumPage('');
      setNewPhotoFile(null);
      if (newPhotoPreview) {
        URL.revokeObjectURL(newPhotoPreview);
        setNewPhotoPreview(null);
      }
      notify(`Uploaded and saved “${newPhotoTitle.trim()}”.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to upload photograph.', true);
    } finally {
      setCreatingPhoto(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim()) {
      notify('Please provide a video title.', true);
      return;
    }
    if (!newVideoFile) {
      notify('Please select an MP4/WebM video file to upload.', true);
      return;
    }
    setCreatingVideo(true);
    try {
      const uploaded = await uploadAdminMedia(adminToken, 'videos', newVideoFile);
      const bundle = await createAdminVideo(adminToken, {
        title: newVideoTitle.trim(),
        subtitle: newVideoSubtitle.trim(),
        description: newVideoDesc.trim(),
        videoSrc: uploaded.url,
        posterSrc: '/videos/poster.jpg',
        isTheatreActive: newVideoTheatreActive,
        isStoryVideo: newVideoStory,
      });
      applyMuseumBundle(bundle);
      setNewVideoTitle('');
      setNewVideoSubtitle('');
      setNewVideoDesc('');
      setNewVideoFile(null);
      if (newVideoPreview) {
        URL.revokeObjectURL(newVideoPreview);
        setNewVideoPreview(null);
      }
      notify(`Uploaded video “${newVideoTitle.trim()}”.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to upload video.', true);
    } finally {
      setCreatingVideo(false);
    }
  };

  const handleSaveTexts = async () => {
    setSavingTexts(true);
    try {
      const payload = texts.map((t) => ({
        key: t.key,
        value: textDrafts[t.key] ?? t.value,
      }));
      const bundle = await updateAdminTexts(adminToken, payload);
      applyMuseumBundle(bundle);
      notify('Saved museum headings and captions.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update texts.', true);
    } finally {
      setSavingTexts(false);
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) {
      notify('Please enter a song title.', true);
      return;
    }
    if (!newTrackFile) {
      notify('Please choose an MP3, WAV, or OGG audio file to upload.', true);
      return;
    }
    setCreatingTrack(true);
    try {
      const uploaded = await uploadAdminMedia(adminToken, 'music', newTrackFile);
      const bundle = await createAdminMusicTrack(adminToken, {
        title: newTrackTitle.trim(),
        subtitle: newTrackSubtitle.trim() || 'Curated Museum Track',
        zone: newTrackZone,
        audioSrc: uploaded.url,
        volume: newTrackVolume,
      });
      applyMuseumBundle(bundle);
      setNewTrackTitle('');
      setNewTrackFile(null);
      if (newTrackPreview) {
        URL.revokeObjectURL(newTrackPreview);
        setNewTrackPreview(null);
      }
      notify(`Added music track “${newTrackTitle.trim()}”.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to upload audio track.', true);
    } finally {
      setCreatingTrack(false);
    }
  };

  const updateZoneTrack = async (
    field:
      | 'defaultMusicTrackId'
      | 'galleryMusicTrackId'
      | 'theatreMusicTrackId'
      | 'gardenMusicTrackId'
      | 'danceMusicTrackId',
    trackId: string
  ) => {
    try {
      const bundle = await updateAdminSettings(adminToken, { [field]: trackId });
      applyMuseumBundle(bundle);
      notify('Updated zone music assignment.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save music assignment.', true);
    }
  };

  const handleSaveSecretPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = secretPw.trim();
    const trimmedConfirm = secretPwConfirm.trim();
    if (!trimmed) {
      notify('Please enter a Secret Room password.', true);
      return;
    }
    if (trimmed.length < 2) {
      notify('Secret Room password must be at least 2 characters.', true);
      return;
    }
    if (trimmed !== trimmedConfirm) {
      notify('New password and confirmation do not match.', true);
      return;
    }
    setSavingSecretPw(true);
    try {
      const bundle = await updateAdminSecretPassword(adminToken, trimmed, trimmedConfirm);
      applyMuseumBundle(bundle);
      setSecretPw('');
      setSecretPwConfirm('');
      notify(
        secretPasswordConfigured
          ? 'Updated Secret Room password. Visitors must enter the new password to unlock the inner room.'
          : 'Secret Room password saved and protected.'
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save Secret Room password.', true);
    } finally {
      setSavingSecretPw(false);
    }
  };

  const handleResetSecretPassword = async () => {
    setResettingSecretPw(true);
    try {
      const bundle = await resetAdminSecretPassword(adminToken);
      applyMuseumBundle(bundle);
      setSecretPw('');
      setSecretPwConfirm('');
      notify('Cleared Secret Room password and locked the inner Secret Room door.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to reset Secret Room password.', true);
    } finally {
      setResettingSecretPw(false);
    }
  };

  const renderSecretPasswordCard = () => (
    <form
      onSubmit={handleSaveSecretPassword}
      data-testid="admin-secret-password-card"
      style={{
        background: 'rgba(200, 165, 90, 0.08)',
        border: '1px solid rgba(200, 165, 90, 0.34)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, color: COLORS.goldLight }}>
            Secret Room Password Settings
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(248, 241, 229, 0.72)' }}>
            Set or change the password required to unlock the inner Secret Room behind the Pre-Secret Room door. Passwords are hashed on the server and never exposed in client code.
          </p>
        </div>
        <span
          data-testid="admin-secret-password-status"
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 600,
            border: secretPasswordConfigured
              ? '1px solid rgba(145, 218, 158, 0.45)'
              : '1px solid rgba(240, 180, 110, 0.45)',
            background: secretPasswordConfigured
              ? 'rgba(62, 118, 72, 0.28)'
              : 'rgba(130, 82, 32, 0.28)',
            color: secretPasswordConfigured ? '#d8ffe0' : '#ffe4be',
          }}
        >
          {secretPasswordConfigured ? 'Password Protected ✓' : 'Not Configured'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
        <div>
          <label
            htmlFor="admin-secret-pw"
            style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}
          >
            {secretPasswordConfigured ? 'New Secret Room Password' : 'Set Secret Room Password'}
          </label>
          <input
            id="admin-secret-pw"
            data-testid="admin-secret-password-input"
            type="password"
            autoComplete="new-password"
            value={secretPw}
            onChange={(e) => setSecretPw(e.target.value)}
            placeholder={secretPasswordConfigured ? 'Enter new password' : 'Enter password to enable door'}
            style={panelInputStyle}
          />
        </div>
        <div>
          <label
            htmlFor="admin-secret-pw-confirm"
            style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}
          >
            Confirm Password
          </label>
          <input
            id="admin-secret-pw-confirm"
            data-testid="admin-secret-password-confirm"
            type="password"
            autoComplete="new-password"
            value={secretPwConfirm}
            onChange={(e) => setSecretPwConfirm(e.target.value)}
            placeholder="Re-enter password to confirm"
            style={panelInputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <button
          type="button"
          data-testid="btn-admin-reset-secret-password"
          disabled={!secretPasswordConfigured || resettingSecretPw || savingSecretPw}
          onClick={handleResetSecretPassword}
          style={{
            ...dangerBtnStyle,
            opacity: !secretPasswordConfigured || resettingSecretPw ? 0.45 : 1,
          }}
        >
          {resettingSecretPw ? 'Resetting…' : 'Reset Password'}
        </button>

        <button
          type="submit"
          data-testid="btn-admin-save-secret-password"
          disabled={savingSecretPw || resettingSecretPw}
          style={goldBtnStyle}
        >
          {savingSecretPw
            ? 'Saving…'
            : secretPasswordConfigured
              ? 'Change Secret Password'
              : 'Set Secret Password'}
        </button>
      </div>
    </form>
  );

  const spreads = buildAlbumSpreads(photos);
  const textCategories: Array<'Museum' | 'Album' | 'Theatre' | 'Garden' | 'Dance'> = [
    'Museum',
    'Album',
    'Theatre',
    'Garden',
    'Dance',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-studio-title"
      data-testid="admin-panel"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 5, 12, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        zIndex: 1300,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(97vw, 1060px)',
          height: 'min(93vh, 840px)',
          background: '#170f1d',
          border: `1px solid ${COLORS.gold}`,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8f1e5',
          fontFamily: 'Georgia, serif',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* Top Studio Bar */}
        <header
          style={{
            padding: '14px 20px',
            background: '#211429',
            borderBottom: '1px solid rgba(200, 165, 90, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 1.8, textTransform: 'uppercase', color: COLORS.goldLight }}>
              Museum Curator Studio · {adminUser?.username}
            </div>
            <h2 id="admin-studio-title" style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 500, color: '#fff8e8' }}>
              Manage Museum Content & Media
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={async () => {
                await loadMuseumContent();
                notify('Refreshed live museum data.');
              }}
              style={subtleBtnStyle}
            >
              ↻ Sync Museum
            </button>
            <button
              type="button"
              onClick={() => signOutAdmin()}
              style={dangerBtnStyle}
            >
              Sign Out
            </button>
            <button
              type="button"
              data-testid="btn-close-admin-panel"
              onClick={() => setShowAdminPanel(false)}
              style={goldBtnStyle}
            >
              Return to Museum ✕
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav
          aria-label="Curator Sections"
          style={{
            display: 'flex',
            gap: 6,
            padding: '10px 20px',
            background: '#1b1122',
            borderBottom: '1px solid rgba(200, 165, 90, 0.22)',
            flexWrap: 'wrap',
          }}
        >
          {(
            [
              ['photos', `Photos (${photos.length})`],
              ['videos', `Videos (${videos.length})`],
              ['texts', 'Museum Text'],
              ['music', `Music (${musicTracks.length})`],
              ['quiz', `Secret Quiz (${secretQuiz.length})`],
              ['private', `Private Chamber (${privateMemories.length})`],
              ['settings', 'Album & Settings'],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                data-testid={`admin-tab-${id}`}
                onClick={() => setTab(id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 9,
                  border: active ? `1px solid ${COLORS.gold}` : '1px solid rgba(200, 165, 90, 0.22)',
                  background: active ? 'rgba(200, 165, 90, 0.24)' : 'rgba(255, 255, 255, 0.04)',
                  color: active ? '#fff7e0' : '#d5c5ab',
                  fontSize: 12.5,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Status Toast Banner */}
        {statusBanner && (
          <div
            role="status"
            data-testid="admin-status-banner"
            style={{
              padding: '9px 20px',
              background: statusBanner.error ? 'rgba(165, 40, 60, 0.34)' : 'rgba(62, 118, 72, 0.34)',
              borderBottom: statusBanner.error
                ? '1px solid rgba(240, 123, 138, 0.5)'
                : '1px solid rgba(145, 218, 158, 0.45)',
              color: statusBanner.error ? '#ffd7de' : '#e6ffea',
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{statusBanner.msg}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {/* ─── TAB A: PHOTO MANAGEMENT ─── */}
          {tab === 'photos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <form
                onSubmit={handleCreatePhoto}
                data-testid="admin-add-photo-form"
                style={{
                  background: 'rgba(200, 165, 90, 0.08)',
                  border: '1px solid rgba(200, 165, 90, 0.32)',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: 15, color: COLORS.goldLight }}>
                  + Add New Photograph
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
                    gap: 10,
                  }}
                >
                  <div>
                    <label htmlFor="new-photo-title" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Title *
                    </label>
                    <input
                      id="new-photo-title"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      placeholder="e.g. Summer Lantern Walk"
                      style={panelInputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-photo-date" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Date / Label
                    </label>
                    <input
                      id="new-photo-date"
                      value={newPhotoDate}
                      onChange={(e) => setNewPhotoDate(e.target.value)}
                      style={panelInputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-photo-section" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Section
                    </label>
                    <select
                      id="new-photo-section"
                      value={newPhotoSection}
                      onChange={(e) => setNewPhotoSection(e.target.value as MemorySection)}
                      style={panelInputStyle}
                    >
                      {PHOTO_SECTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="new-photo-room" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Room Placement
                    </label>
                    <select
                      id="new-photo-room"
                      value={newPhotoRoom}
                      onChange={(e) => setNewPhotoRoom(e.target.value as PhotoRoomTarget)}
                      style={panelInputStyle}
                    >
                      <option value="gallery">Circular Gallery Walls</option>
                      <option value="garden">Garden Blossom Trees</option>
                      <option value="album">Love Album Only</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="new-photo-page" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Album Page # (optional)
                    </label>
                    <input
                      id="new-photo-page"
                      type="number"
                      min={1}
                      max={200}
                      value={newPhotoAlbumPage}
                      onChange={(e) => setNewPhotoAlbumPage(e.target.value)}
                      placeholder="e.g. 19"
                      style={panelInputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-photo-file" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Choose Photograph *
                    </label>
                    <input
                      id="new-photo-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
                        setNewPhotoFile(f);
                        setNewPhotoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                      style={{ fontSize: 12, color: '#f3e7d2' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="new-photo-desc" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Description
                    </label>
                    <textarea
                      id="new-photo-desc"
                      rows={2}
                      value={newPhotoDesc}
                      onChange={(e) => setNewPhotoDesc(e.target.value)}
                      placeholder="Write the story behind this photograph..."
                      style={panelInputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  {newPhotoPreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={newPhotoPreview}
                        alt="New upload preview"
                        style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 6, border: `1px solid ${COLORS.gold}` }}
                      />
                      <span style={{ fontSize: 12, color: '#d7c39c' }}>Ready to upload ({newPhotoFile?.name})</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(248,241,229,0.6)' }}>
                      Preview appears automatically when an image is chosen.
                    </span>
                  )}
                  <button
                    type="submit"
                    data-testid="btn-admin-save-new-photo"
                    disabled={creatingPhoto}
                    style={goldBtnStyle}
                  >
                    {creatingPhoto ? 'Uploading & Saving...' : 'Upload & Add Photograph'}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {photos.map((photo, idx) => (
                  <PhotoItemRow
                    key={photo.id}
                    photo={photo}
                    index={idx}
                    total={photos.length}
                    token={adminToken}
                    onSaved={(bundle) => applyMuseumBundle(bundle)}
                    onStatus={notify}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB B: VIDEO MANAGEMENT ─── */}
          {tab === 'videos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <form
                onSubmit={handleCreateVideo}
                style={{
                  background: 'rgba(200, 165, 90, 0.08)',
                  border: '1px solid rgba(200, 165, 90, 0.32)',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: 15, color: COLORS.goldLight }}>
                  + Upload Theatre or Story Video
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
                  <div>
                    <label htmlFor="new-video-title" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Video Title *
                    </label>
                    <input
                      id="new-video-title"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      placeholder="e.g. Anniversary Highlights"
                      style={panelInputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-video-sub" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Subtitle
                    </label>
                    <input
                      id="new-video-sub"
                      value={newVideoSubtitle}
                      onChange={(e) => setNewVideoSubtitle(e.target.value)}
                      placeholder="Chapter label or location"
                      style={panelInputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-video-file" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Video File (MP4 / WebM) *
                    </label>
                    <input
                      id="new-video-file"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
                        setNewVideoFile(f);
                        setNewVideoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                      style={{ fontSize: 12, color: '#f3e7d2' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="new-video-desc" style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Description
                    </label>
                    <textarea
                      id="new-video-desc"
                      rows={2}
                      value={newVideoDesc}
                      onChange={(e) => setNewVideoDesc(e.target.value)}
                      style={panelInputStyle}
                    />
                  </div>
                </div>

                {newVideoPreview && (
                  <video
                    src={newVideoPreview}
                    controls
                    style={{ width: '100%', maxHeight: 210, marginTop: 10, borderRadius: 8, background: '#0c080f' }}
                  />
                )}

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12.5 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={newVideoTheatreActive}
                        onChange={(e) => setNewVideoTheatreActive(e.target.checked)}
                      />
                      Play on Memory Theatre Screen
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={newVideoStory}
                        onChange={(e) => setNewVideoStory(e.target.checked)}
                      />
                      Include in Story Videos
                    </label>
                  </div>
                  <button type="submit" disabled={creatingVideo} style={goldBtnStyle}>
                    {creatingVideo ? 'Uploading Video...' : 'Upload & Save Video'}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {videos.map((vid: MuseumVideoItem) => (
                  <VideoItemCard
                    key={vid.id}
                    video={vid}
                    token={adminToken}
                    canDelete={videos.length > 1}
                    onSaved={(bundle) => applyMuseumBundle(bundle)}
                    onStatus={notify}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB C: TEXT MANAGEMENT ─── */}
          {tab === 'texts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {textCategories.map((cat) => {
                const group = texts.filter((t) => t.category === cat);
                if (group.length === 0) return null;
                return (
                  <div
                    key={cat}
                    style={{
                      background: 'rgba(255, 250, 240, 0.04)',
                      border: '1px solid rgba(200, 165, 90, 0.25)',
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <h3 style={{ margin: '0 0 10px', fontSize: 14.5, color: COLORS.goldLight }}>
                      {cat} Labels & Headings
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                      {group.map((item) => (
                        <div key={item.key}>
                          <label
                            htmlFor={`admin-text-${item.key}`}
                            style={{ display: 'block', fontSize: 11.5, color: '#e8d7b3', marginBottom: 4 }}
                          >
                            {item.label}
                          </label>
                          <input
                            id={`admin-text-${item.key}`}
                            data-testid={`admin-text-input-${item.key}`}
                            value={textDrafts[item.key] ?? ''}
                            onChange={(e) =>
                              setTextDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))
                            }
                            style={panelInputStyle}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  data-testid="btn-admin-save-texts"
                  disabled={savingTexts}
                  onClick={handleSaveTexts}
                  style={goldBtnStyle}
                >
                  {savingTexts ? 'Saving All Text...' : 'Save All Text Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ─── TAB D: MUSIC & PLAYLIST MANAGEMENT ─── */}
          {tab === 'music' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  background: 'rgba(255, 250, 240, 0.04)',
                  border: '1px solid rgba(200, 165, 90, 0.28)',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <h3 style={{ margin: '0 0 10px', fontSize: 15, color: COLORS.goldLight }}>
                  Zone Music Assignments
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {(
                    [
                      ['defaultMusicTrackId', 'Default Museum Track'],
                      ['galleryMusicTrackId', 'Gallery Area'],
                      ['theatreMusicTrackId', 'Memory Theatre'],
                      ['gardenMusicTrackId', 'Night Garden'],
                      ['danceMusicTrackId', 'Dance Together Waltz'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                        {label}
                      </label>
                      <select
                        value={museumSettings[field]}
                        onChange={(e) => updateZoneTrack(field, e.target.value)}
                        style={panelInputStyle}
                      >
                        {musicTracks.map((tr) => (
                          <option key={tr.id} value={tr.id}>
                            {tr.title} {tr.isBuiltIn ? '(Built-in)' : '(Custom)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleCreateTrack}
                style={{
                  background: 'rgba(200, 165, 90, 0.08)',
                  border: '1px solid rgba(200, 165, 90, 0.32)',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <h3 style={{ margin: '0 0 10px', fontSize: 15, color: COLORS.goldLight }}>
                  + Upload Background Music Track
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Track Title *
                    </label>
                    <input
                      value={newTrackTitle}
                      onChange={(e) => setNewTrackTitle(e.target.value)}
                      placeholder="e.g. Our Wedding First Dance"
                      style={panelInputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Artist / Subtitle
                    </label>
                    <input
                      value={newTrackSubtitle}
                      onChange={(e) => setNewTrackSubtitle(e.target.value)}
                      style={panelInputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Target Zone
                    </label>
                    <select
                      value={newTrackZone}
                      onChange={(e) => setNewTrackZone(e.target.value as MusicZoneTarget)}
                      style={panelInputStyle}
                    >
                      <option value="playlist">General Playlist</option>
                      <option value="gallery">Gallery</option>
                      <option value="theatre">Theatre</option>
                      <option value="garden">Garden</option>
                      <option value="dance">Dance Together</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#e8d7b3', marginBottom: 4 }}>
                      Audio File (MP3 / WAV / OGG / M4A / FLAC) *
                    </label>
                    <input
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/flac"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (newTrackPreview) URL.revokeObjectURL(newTrackPreview);
                        setNewTrackFile(f);
                        setNewTrackPreview(f ? URL.createObjectURL(f) : null);
                      }}
                      style={{ fontSize: 12, color: '#f3e7d2' }}
                    />
                  </div>
                </div>
                {newTrackPreview && (
                  <audio controls src={newTrackPreview} style={{ width: '100%', marginTop: 10 }} />
                )}
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ fontSize: 12, color: '#e8d7b3' }}>
                    Track Gain ({Math.round(newTrackVolume * 100)}%):{' '}
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={newTrackVolume}
                      onChange={(e) => setNewTrackVolume(parseFloat(e.target.value))}
                      style={{ accentColor: COLORS.gold, verticalAlign: 'middle' }}
                    />
                  </label>
                  <button type="submit" disabled={creatingTrack} style={goldBtnStyle}>
                    {creatingTrack ? 'Uploading Audio...' : 'Upload & Add Track'}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {musicTracks.map((tr, idx) => (
                  <MusicTrackCard
                    key={tr.id}
                    track={tr}
                    index={idx}
                    total={musicTracks.length}
                    token={adminToken}
                    onSaved={(bundle) => applyMuseumBundle(bundle)}
                    onStatus={notify}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB E: LOVE ALBUM PLANNER & MUSEUM SETTINGS ─── */}
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  background: 'rgba(255, 250, 240, 0.04)',
                  border: '1px solid rgba(200, 165, 90, 0.28)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 15, color: COLORS.goldLight }}>
                  Museum Audio & Atmosphere Controls
                </h3>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                  <input
                    type="checkbox"
                    checked={museumSettings.musicEnabled}
                    onChange={async (e) => {
                      const bundle = await updateAdminSettings(adminToken, {
                        musicEnabled: e.target.checked,
                      });
                      applyMuseumBundle(bundle);
                      notify(e.target.checked ? 'Museum music enabled.' : 'Museum music paused by default.');
                    }}
                  />
                  Enable Background Music for Museum Visitors
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, color: '#e8d7b3', marginBottom: 6 }}>
                    Master Music Volume: {Math.round(museumSettings.musicVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={museumSettings.musicVolume}
                    onChange={async (e) => {
                      const vol = parseFloat(e.target.value);
                      const bundle = await updateAdminSettings(adminToken, { musicVolume: vol });
                      applyMuseumBundle(bundle);
                    }}
                    style={{ width: '100%', maxWidth: 340, accentColor: COLORS.gold }}
                  />
                </div>
              </div>

              {renderSecretPasswordCard()}

              <div
                style={{
                  background: 'rgba(255, 250, 240, 0.04)',
                  border: '1px solid rgba(200, 165, 90, 0.28)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, color: COLORS.goldLight }}>
                      Open Love Album Spread Overview ({spreads.length} spreads)
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(248, 241, 229, 0.7)' }}>
                      Assign page numbers in the Photos tab to reorder spreads inside the central hardcover book.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPanel(false);
                      setShowLoveAlbum(true);
                    }}
                    style={goldBtnStyle}
                  >
                    Preview Open Love Album ✦
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {spreads.map((sp) => (
                    <div
                      key={sp.spreadIndex}
                      style={{
                        background: '#22152a',
                        border: '1px solid rgba(200, 165, 90, 0.24)',
                        borderRadius: 8,
                        padding: 10,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ color: COLORS.gold, fontWeight: 600, marginBottom: 4 }}>
                        Spread {sp.spreadIndex + 1} (Pages {sp.leftPageNumber}–{sp.rightPageNumber})
                      </div>
                      <div>Left: {sp.leftPage ? sp.leftPage.title : '— Dedication Blank —'}</div>
                      <div>Right: {sp.rightPage ? sp.rightPage.title : '— Dedication Blank —'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB F: SECRET ROOM QUIZ MASTER & PROGRESS ─── */}
          {tab === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Visitor Progress & Live Quiz Preview */}
              <div
                style={{
                  background: 'rgba(255, 250, 240, 0.04)',
                  border: '1px solid rgba(200, 165, 90, 0.28)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, color: COLORS.goldLight }}>
                      Secret Room Mystery Progress & Preview
                    </h3>
                    <div style={{ fontSize: 12, color: '#d7c39c', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>Yes Confirmed: {secretProgress.yesConfirmed ? '✓' : '—'}</span>
                      <span>Quiz Passed: {secretProgress.quizCompleted ? '✓' : '—'}</span>
                      <span>Key Collected: {secretProgress.keyCollected ? '✓' : '—'}</span>
                      <span>Secret Door: {secretProgress.secretDoorUnlocked ? '✓' : '—'}</span>
                      <span>2nd Door Open: {secretProgress.secondDoorUnlocked ? '✓' : '—'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      data-testid="btn-admin-preview-quiz"
                      onClick={() => {
                        setShowAdminPanel(false);
                        setShowLoveQuizModal(true, true);
                      }}
                      style={goldBtnStyle}
                    >
                      Preview Full Quiz ✦
                    </button>
                    <button
                      type="button"
                      data-testid="btn-admin-reset-secret-progress"
                      disabled={resettingProgress}
                      onClick={async () => {
                        setResettingProgress(true);
                        try {
                          const bundle = await resetAdminSecretProgress(adminToken);
                          applyMuseumBundle(bundle);
                          notify('Reset Secret Room visitor progress back to locked start state.');
                        } catch (err) {
                          notify(err instanceof Error ? err.message : 'Reset failed.', true);
                        } finally {
                          setResettingProgress(false);
                        }
                      }}
                      style={dangerBtnStyle}
                    >
                      {resettingProgress ? 'Resetting…' : 'Reset Visitor Progress'}
                    </button>
                  </div>
                </div>
              </div>

              {renderSecretPasswordCard()}

              {/* Add Quiz Question Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newQuizQuestion.trim() || !newQuizOptA.trim() || !newQuizOptB.trim() || !newQuizOptC.trim() || !newQuizOptD.trim()) {
                    notify('Please enter the question and all four options A–D.', true);
                    return;
                  }
                  setCreatingQuiz(true);
                  try {
                    const bundle = await createAdminQuizQuestion(adminToken, {
                      question: newQuizQuestion.trim(),
                      description: newQuizDescription.trim(),
                      options: {
                        A: newQuizOptA.trim(),
                        B: newQuizOptB.trim(),
                        C: newQuizOptC.trim(),
                        D: newQuizOptD.trim(),
                      },
                      correctOption: newQuizCorrect,
                    });
                    applyMuseumBundle(bundle);
                    setNewQuizQuestion('');
                    setNewQuizDescription('');
                    setNewQuizOptA('');
                    setNewQuizOptB('');
                    setNewQuizOptC('');
                    setNewQuizOptD('');
                    setNewQuizCorrect('A');
                    notify('Added new Love Quiz question.');
                  } catch (err) {
                    notify(err instanceof Error ? err.message : 'Failed to create question.', true);
                  } finally {
                    setCreatingQuiz(false);
                  }
                }}
                style={{
                  background: 'rgba(255, 250, 240, 0.04)',
                  border: '1px solid rgba(200, 165, 90, 0.28)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 15, color: COLORS.goldLight }}>
                  Add Personalized Love Quiz Question
                </h3>
                <input
                  data-testid="input-new-quiz-question"
                  placeholder="Question prompt (e.g. What is my favorite colour?)"
                  value={newQuizQuestion}
                  onChange={(e) => setNewQuizQuestion(e.target.value)}
                  style={panelInputStyle}
                />
                <input
                  placeholder="Optional hint or sweet description"
                  value={newQuizDescription}
                  onChange={(e) => setNewQuizDescription(e.target.value)}
                  style={panelInputStyle}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                  <input data-testid="input-new-quiz-opt-a" placeholder="Option A" value={newQuizOptA} onChange={(e) => setNewQuizOptA(e.target.value)} style={panelInputStyle} />
                  <input data-testid="input-new-quiz-opt-b" placeholder="Option B" value={newQuizOptB} onChange={(e) => setNewQuizOptB(e.target.value)} style={panelInputStyle} />
                  <input data-testid="input-new-quiz-opt-c" placeholder="Option C" value={newQuizOptC} onChange={(e) => setNewQuizOptC(e.target.value)} style={panelInputStyle} />
                  <input data-testid="input-new-quiz-opt-d" placeholder="Option D" value={newQuizOptD} onChange={(e) => setNewQuizOptD(e.target.value)} style={panelInputStyle} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ fontSize: 12, color: '#e8d7b3', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Preferred Answer:
                    <select
                      value={newQuizCorrect}
                      onChange={(e) => setNewQuizCorrect(e.target.value as QuizOptionKey)}
                      style={{ ...panelInputStyle, width: 80 }}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    data-testid="btn-admin-add-quiz"
                    disabled={creatingQuiz}
                    style={goldBtnStyle}
                  >
                    {creatingQuiz ? 'Publishing…' : 'Publish Quiz Question'}
                  </button>
                </div>
              </form>

              {/* Existing Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {secretQuiz.map((q, idx) => (
                  <QuizQuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    total={secretQuiz.length}
                    token={adminToken}
                    onSaved={applyMuseumBundle}
                    onStatus={notify}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB G: OUR PRIVATE MEMORIES CHAMBER ─── */}
          {tab === 'private' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newPrivTitle.trim()) {
                    notify('Please enter a title for the private memory.', true);
                    return;
                  }
                  if (!newPrivBody.trim() && !newPrivFile) {
                    notify('Please enter a message or upload a photograph.', true);
                    return;
                  }
                  setCreatingPriv(true);
                  try {
                    let photoSrc = '';
                    if (newPrivFile) {
                      const uploaded = await uploadAdminMedia(adminToken, 'photos', newPrivFile);
                      photoSrc = uploaded.url;
                    }
                    const bundle = await createAdminPrivateMemory(adminToken, {
                      kind: newPrivKind,
                      title: newPrivTitle.trim(),
                      subtitle: newPrivSubtitle.trim() || 'Private Chamber Keepsake',
                      dateLabel: newPrivDate.trim() || 'Timeless Memory',
                      body: newPrivBody.trim(),
                      secretCode: newPrivCode.trim(),
                      photoSrc,
                      palette: ['#3b182c', '#8b2252', '#e8c488'],
                      motif: newPrivMotif,
                    });
                    applyMuseumBundle(bundle);
                    setNewPrivTitle('');
                    setNewPrivSubtitle('');
                    setNewPrivCode('');
                    setNewPrivBody('');
                    setNewPrivFile(null);
                    notify(`Published “${newPrivTitle.trim()}” to Our Private Memories.`);
                  } catch (err) {
                    notify(err instanceof Error ? err.message : 'Failed to create private memory.', true);
                  } finally {
                    setCreatingPriv(false);
                  }
                }}
                style={{
                  background: 'rgba(255, 250, 240, 0.04)',
                  border: '1px solid rgba(200, 165, 90, 0.28)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 15, color: COLORS.goldLight }}>
                  Add Private Memory, Letter, Code or Board Display
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                  <select
                    data-testid="select-new-priv-kind"
                    value={newPrivKind}
                    onChange={(e) => setNewPrivKind(e.target.value as PrivateMemoryKind)}
                    style={panelInputStyle}
                  >
                    <option value="photo">Private Photograph</option>
                    <option value="letter">Hidden Love Letter</option>
                    <option value="message">Saved Text / Message</option>
                    <option value="code">Secret Code Display</option>
                    <option value="board">Central Memory Board</option>
                  </select>
                  <input
                    data-testid="input-new-priv-title"
                    placeholder="Title"
                    value={newPrivTitle}
                    onChange={(e) => setNewPrivTitle(e.target.value)}
                    style={panelInputStyle}
                  />
                  <input
                    placeholder="Subtitle / Category"
                    value={newPrivSubtitle}
                    onChange={(e) => setNewPrivSubtitle(e.target.value)}
                    style={panelInputStyle}
                  />
                  <input
                    placeholder="Special Date Label"
                    value={newPrivDate}
                    onChange={(e) => setNewPrivDate(e.target.value)}
                    style={panelInputStyle}
                  />
                  <input
                    data-testid="input-new-priv-code"
                    placeholder="Secret Code (optional)"
                    value={newPrivCode}
                    onChange={(e) => setNewPrivCode(e.target.value)}
                    style={panelInputStyle}
                  />
                  <select
                    value={newPrivMotif}
                    onChange={(e) => setNewPrivMotif(e.target.value as MemoryMotif)}
                    style={panelInputStyle}
                  >
                    {PHOTO_MOTIFS.map((m) => (
                      <option key={m} value={m}>
                        Motif: {m}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  data-testid="input-new-priv-body"
                  rows={3}
                  placeholder="Write private message, love letter prose, or milestone text..."
                  value={newPrivBody}
                  onChange={(e) => setNewPrivBody(e.target.value)}
                  style={{ ...panelInputStyle, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ fontSize: 12, color: '#e8d7b3' }}>
                    Attach Photo (optional):{' '}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setNewPrivFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="submit"
                    data-testid="btn-admin-add-priv"
                    disabled={creatingPriv}
                    style={goldBtnStyle}
                  >
                    {creatingPriv ? 'Publishing…' : 'Publish Private Memory'}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {privateMemories.map((item, idx) => (
                  <PrivateMemoryCard
                    key={item.id}
                    item={item}
                    index={idx}
                    total={privateMemories.length}
                    token={adminToken}
                    onSaved={applyMuseumBundle}
                    onPreview={(pm) => {
                      setShowAdminPanel(false);
                      openPrivateMemory(pm);
                    }}
                    onStatus={notify}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoItemCard({
  video,
  token,
  canDelete,
  onSaved,
  onStatus,
}: {
  video: MuseumVideoItem;
  token: string;
  canDelete: boolean;
  onSaved: (bundle: Awaited<ReturnType<typeof updateAdminVideo>>) => void;
  onStatus: (msg: string, error?: boolean) => void;
}) {
  const [title, setTitle] = useState(video.title);
  const [subtitle, setSubtitle] = useState(video.subtitle);
  const [description, setDescription] = useState(video.description);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div
      style={{
        background: 'rgba(255, 250, 240, 0.04)',
        border: '1px solid rgba(200, 165, 90, 0.26)',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <strong style={{ fontSize: 14, color: '#fff5dd' }}>{video.title}</strong>
          <span style={{ marginLeft: 10, fontSize: 11, color: video.isTheatreActive ? '#9de6ab' : '#c8b8a4' }}>
            {video.isTheatreActive ? '● Active on Theatre Screen' : 'Story Video'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {!video.isTheatreActive && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const bundle = await updateAdminVideo(token, video.id, { isTheatreActive: true });
                  onSaved(bundle);
                  onStatus(`Set “${video.title}” active in Memory Theatre.`);
                } finally {
                  setBusy(false);
                }
              }}
              style={goldBtnStyle}
            >
              Set Active in Theatre
            </button>
          )}
          <button
            type="button"
            disabled={!canDelete || busy}
            onClick={async () => {
              setBusy(true);
              try {
                const bundle = await deleteAdminVideo(token, video.id);
                onSaved(bundle);
                onStatus(`Deleted video “${video.title}”.`);
              } catch (err) {
                onStatus(err instanceof Error ? err.message : 'Unable to delete video.', true);
              } finally {
                setBusy(false);
              }
            }}
            style={{ ...dangerBtnStyle, opacity: canDelete ? 1 : 0.45 }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={panelInputStyle} />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" style={panelInputStyle} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={panelInputStyle} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <label style={{ fontSize: 12, color: '#e8d7b3' }}>
          Replace Video:{' '}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              let videoSrc = video.videoSrc;
              if (replaceFile) {
                const uploaded = await uploadAdminMedia(token, 'videos', replaceFile);
                videoSrc = uploaded.url;
              }
              const bundle = await updateAdminVideo(token, video.id, {
                title: title.trim() || video.title,
                subtitle: subtitle.trim(),
                description: description.trim(),
                videoSrc,
              });
              onSaved(bundle);
              setReplaceFile(null);
              onStatus(`Saved changes for “${title.trim() || video.title}”.`);
            } catch (err) {
              onStatus(err instanceof Error ? err.message : 'Failed to save video.', true);
            } finally {
              setBusy(false);
            }
          }}
          style={subtleBtnStyle}
        >
          Save Video Edits
        </button>
      </div>
    </div>
  );
}

function MusicTrackCard({
  track,
  index,
  total,
  token,
  onSaved,
  onStatus,
}: {
  track: MuseumMusicTrack;
  index: number;
  total: number;
  token: string;
  onSaved: (bundle: Awaited<ReturnType<typeof updateAdminMusicTrack>>) => void;
  onStatus: (msg: string, error?: boolean) => void;
}) {
  const [title, setTitle] = useState(track.title);
  const [subtitle, setSubtitle] = useState(track.subtitle);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div
      style={{
        background: 'rgba(255, 250, 240, 0.04)',
        border: '1px solid rgba(200, 165, 90, 0.25)',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <strong style={{ color: '#fff5dd', fontSize: 13.5 }}>{track.title}</strong>
          <span style={{ marginLeft: 8, fontSize: 11, color: '#d7c39c' }}>
            Zone: {track.zone} · {track.isBuiltIn ? 'Built-in Score' : 'Uploaded Audio'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={async () => {
              const ids = useGameStore.getState().musicTracks.map((m) => m.id);
              const idx = ids.indexOf(track.id);
              if (idx > 0) {
                [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                const bundle = await reorderAdminMusicTracks(token, ids);
                onSaved(bundle);
              }
            }}
            style={{ ...subtleBtnStyle, opacity: index === 0 ? 0.4 : 1 }}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1 || busy}
            onClick={async () => {
              const ids = useGameStore.getState().musicTracks.map((m) => m.id);
              const idx = ids.indexOf(track.id);
              if (idx >= 0 && idx < ids.length - 1) {
                [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
                const bundle = await reorderAdminMusicTracks(token, ids);
                onSaved(bundle);
              }
            }}
            style={{ ...subtleBtnStyle, opacity: index === total - 1 ? 0.4 : 1 }}
          >
            ↓
          </button>
          <button
            type="button"
            disabled={track.isBuiltIn || busy}
            onClick={async () => {
              setBusy(true);
              try {
                const bundle = await deleteAdminMusicTrack(token, track.id);
                onSaved(bundle);
                onStatus(`Removed track “${track.title}”.`);
              } catch (err) {
                onStatus(err instanceof Error ? err.message : 'Unable to delete track.', true);
              } finally {
                setBusy(false);
              }
            }}
            style={{ ...dangerBtnStyle, opacity: track.isBuiltIn ? 0.4 : 1 }}
          >
            {track.isBuiltIn ? 'Built-in' : 'Delete'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={panelInputStyle} />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" style={panelInputStyle} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/flac"
            onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 11, color: '#f3e7d2', flex: 1 }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                let audioSrc = track.audioSrc;
                if (replaceFile) {
                  const uploaded = await uploadAdminMedia(token, 'music', replaceFile);
                  audioSrc = uploaded.url;
                }
                const bundle = await updateAdminMusicTrack(token, track.id, {
                  title: title.trim() || track.title,
                  subtitle: subtitle.trim(),
                  audioSrc,
                });
                onSaved(bundle);
                setReplaceFile(null);
                onStatus(`Updated track “${title.trim() || track.title}”.`);
              } catch (err) {
                onStatus(err instanceof Error ? err.message : 'Failed to save track.', true);
              } finally {
                setBusy(false);
              }
            }}
            style={subtleBtnStyle}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizQuestionCard({
  question,
  index,
  total,
  token,
  onSaved,
  onStatus,
}: {
  question: SecretQuizQuestion;
  index: number;
  total: number;
  token: string;
  onSaved: (bundle: Awaited<ReturnType<typeof updateAdminQuizQuestion>>) => void;
  onStatus: (msg: string, error?: boolean) => void;
}) {
  const [prompt, setPrompt] = useState(question.question);
  const [desc, setDesc] = useState(question.description);
  const [optA, setOptA] = useState(question.options.A);
  const [optB, setOptB] = useState(question.options.B);
  const [optC, setOptC] = useState(question.options.C);
  const [optD, setOptD] = useState(question.options.D);
  const [correct, setCorrect] = useState<QuizOptionKey>(question.correctOption);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrompt(question.question);
    setDesc(question.description);
    setOptA(question.options.A);
    setOptB(question.options.B);
    setOptC(question.options.C);
    setOptD(question.options.D);
    setCorrect(question.correctOption);
  }, [question]);

  return (
    <div
      data-testid={`admin-quiz-row-${question.id}`}
      style={{
        background: 'rgba(255, 250, 240, 0.04)',
        border: '1px solid rgba(200, 165, 90, 0.25)',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ color: COLORS.goldLight, fontSize: 13 }}>
          Question {index + 1} · Preferred: {correct}
        </strong>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={async () => {
              const ids = useGameStore.getState().secretQuiz.map((q) => q.id);
              const idx = ids.indexOf(question.id);
              if (idx > 0) {
                [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                const bundle = await reorderAdminQuizQuestions(token, ids);
                onSaved(bundle);
              }
            }}
            style={{ ...subtleBtnStyle, opacity: index === 0 ? 0.4 : 1 }}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1 || busy}
            onClick={async () => {
              const ids = useGameStore.getState().secretQuiz.map((q) => q.id);
              const idx = ids.indexOf(question.id);
              if (idx >= 0 && idx < ids.length - 1) {
                [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
                const bundle = await reorderAdminQuizQuestions(token, ids);
                onSaved(bundle);
              }
            }}
            style={{ ...subtleBtnStyle, opacity: index === total - 1 ? 0.4 : 1 }}
          >
            ↓
          </button>
          <button
            type="button"
            disabled={total <= 1 || busy}
            onClick={async () => {
              setBusy(true);
              try {
                const bundle = await deleteAdminQuizQuestion(token, question.id);
                onSaved(bundle);
                onStatus('Deleted quiz question.');
              } catch (err) {
                onStatus(err instanceof Error ? err.message : 'Delete failed.', true);
              } finally {
                setBusy(false);
              }
            }}
            style={{ ...dangerBtnStyle, opacity: total <= 1 ? 0.4 : 1 }}
          >
            Delete
          </button>
        </div>
      </div>

      <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Question" style={panelInputStyle} />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description / Hint" style={panelInputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
        <input value={optA} onChange={(e) => setOptA(e.target.value)} placeholder="Option A" style={panelInputStyle} />
        <input value={optB} onChange={(e) => setOptB(e.target.value)} placeholder="Option B" style={panelInputStyle} />
        <input value={optC} onChange={(e) => setOptC(e.target.value)} placeholder="Option C" style={panelInputStyle} />
        <input value={optD} onChange={(e) => setOptD(e.target.value)} placeholder="Option D" style={panelInputStyle} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, color: '#e8d7b3', display: 'flex', alignItems: 'center', gap: 8 }}>
          Preferred Answer:
          <select
            value={correct}
            onChange={(e) => setCorrect(e.target.value as QuizOptionKey)}
            style={{ ...panelInputStyle, width: 76 }}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </label>
        <button
          type="button"
          data-testid={`btn-save-quiz-${question.id}`}
          disabled={busy}
          onClick={async () => {
            if (!prompt.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
              onStatus('Question and all 4 options are required.', true);
              return;
            }
            setBusy(true);
            try {
              const bundle = await updateAdminQuizQuestion(token, question.id, {
                question: prompt.trim(),
                description: desc.trim(),
                options: {
                  A: optA.trim(),
                  B: optB.trim(),
                  C: optC.trim(),
                  D: optD.trim(),
                },
                correctOption: correct,
              });
              onSaved(bundle);
              onStatus(`Saved Question ${index + 1}.`);
            } catch (err) {
              onStatus(err instanceof Error ? err.message : 'Failed to save question.', true);
            } finally {
              setBusy(false);
            }
          }}
          style={goldBtnStyle}
        >
          Save Question
        </button>
      </div>
    </div>
  );
}

function PrivateMemoryCard({
  item,
  index,
  total,
  token,
  onSaved,
  onPreview,
  onStatus,
}: {
  item: PrivateMemoryItem;
  index: number;
  total: number;
  token: string;
  onSaved: (bundle: Awaited<ReturnType<typeof updateAdminPrivateMemory>>) => void;
  onPreview: (item: PrivateMemoryItem) => void;
  onStatus: (msg: string, error?: boolean) => void;
}) {
  const [kind, setKind] = useState<PrivateMemoryKind>(item.kind);
  const [title, setTitle] = useState(item.title);
  const [subtitle, setSubtitle] = useState(item.subtitle);
  const [dateLabel, setDateLabel] = useState(item.dateLabel);
  const [secretCode, setSecretCode] = useState(item.secretCode);
  const [body, setBody] = useState(item.body);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setKind(item.kind);
    setTitle(item.title);
    setSubtitle(item.subtitle);
    setDateLabel(item.dateLabel);
    setSecretCode(item.secretCode);
    setBody(item.body);
  }, [item]);

  return (
    <div
      data-testid={`admin-priv-row-${item.id}`}
      style={{
        background: 'rgba(255, 250, 240, 0.04)',
        border: '1px solid rgba(200, 165, 90, 0.25)',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {item.photoSrc && (
            <img
              src={item.photoSrc}
              alt={item.title}
              style={{ width: 52, height: 42, objectFit: 'cover', borderRadius: 6 }}
            />
          )}
          <div>
            <strong style={{ color: '#fff5dd', fontSize: 13.5 }}>{item.title}</strong>
            <div style={{ fontSize: 11, color: '#d7c39c' }}>
              {item.kind.toUpperCase()} · {item.dateLabel}
              {item.secretCode ? ` · Code: ${item.secretCode}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => onPreview(item)} style={subtleBtnStyle}>
            Preview
          </button>
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={async () => {
              const ids = useGameStore.getState().privateMemories.map((p) => p.id);
              const idx = ids.indexOf(item.id);
              if (idx > 0) {
                [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                const bundle = await reorderAdminPrivateMemories(token, ids);
                onSaved(bundle);
              }
            }}
            style={{ ...subtleBtnStyle, opacity: index === 0 ? 0.4 : 1 }}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1 || busy}
            onClick={async () => {
              const ids = useGameStore.getState().privateMemories.map((p) => p.id);
              const idx = ids.indexOf(item.id);
              if (idx >= 0 && idx < ids.length - 1) {
                [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
                const bundle = await reorderAdminPrivateMemories(token, ids);
                onSaved(bundle);
              }
            }}
            style={{ ...subtleBtnStyle, opacity: index === total - 1 ? 0.4 : 1 }}
          >
            ↓
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const bundle = await deleteAdminPrivateMemory(token, item.id);
                onSaved(bundle);
                onStatus(`Removed “${item.title}”.`);
              } catch (err) {
                onStatus(err instanceof Error ? err.message : 'Unable to delete.', true);
              } finally {
                setBusy(false);
              }
            }}
            style={dangerBtnStyle}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 8 }}>
        <select value={kind} onChange={(e) => setKind(e.target.value as PrivateMemoryKind)} style={panelInputStyle}>
          <option value="photo">Private Photograph</option>
          <option value="letter">Hidden Love Letter</option>
          <option value="message">Saved Text / Message</option>
          <option value="code">Secret Code Display</option>
          <option value="board">Central Memory Board</option>
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={panelInputStyle} />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" style={panelInputStyle} />
        <input value={dateLabel} onChange={(e) => setDateLabel(e.target.value)} placeholder="Date Label" style={panelInputStyle} />
        <input value={secretCode} onChange={(e) => setSecretCode(e.target.value)} placeholder="Secret Code" style={panelInputStyle} />
      </div>

      <textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message / letter / keepsake text"
        style={{ ...panelInputStyle, resize: 'vertical' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <label style={{ fontSize: 11.5, color: '#e8d7b3' }}>
          Replace Photo:{' '}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          data-testid={`btn-save-priv-${item.id}`}
          disabled={busy}
          onClick={async () => {
            if (!title.trim()) {
              onStatus('Title cannot be empty.', true);
              return;
            }
            setBusy(true);
            try {
              let photoSrc = item.photoSrc;
              if (replaceFile) {
                const uploaded = await uploadAdminMedia(token, 'photos', replaceFile);
                photoSrc = uploaded.url;
              }
              const bundle = await updateAdminPrivateMemory(token, item.id, {
                kind,
                title: title.trim(),
                subtitle: subtitle.trim(),
                dateLabel: dateLabel.trim(),
                secretCode: secretCode.trim(),
                body: body.trim(),
                photoSrc,
              });
              onSaved(bundle);
              setReplaceFile(null);
              onStatus(`Saved “${title.trim()}”.`);
            } catch (err) {
              onStatus(err instanceof Error ? err.message : 'Failed to save.', true);
            } finally {
              setBusy(false);
            }
          }}
          style={goldBtnStyle}
        >
          Save Memory
        </button>
      </div>
    </div>
  );
}
