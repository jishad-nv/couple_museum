import { useEffect } from 'react';
import BackgroundAudioManager from './audio/BackgroundAudioManager';
import Canvas3D from './components/Canvas3D';
import LoadingScreen from './components/LoadingScreen';
import HUD from './components/UI/HUD';
import EntranceGuestbook from './components/UI/EntranceGuestbook';
import GuestbookModal from './components/UI/GuestbookModal';
import LoveAlbumModal from './components/UI/LoveAlbumModal';
import MobileControls from './components/UI/MobileControls';
import PhotoViewer from './components/UI/PhotoViewer';
import VideoPlayer from './components/UI/VideoPlayer';
import SecretLetterModal from './components/UI/SecretLetterModal';
import DoYouLoveMeModal from './components/UI/DoYouLoveMeModal';
import LoveQuizModal from './components/UI/LoveQuizModal';
import PrivateMemoryViewerModal from './components/UI/PrivateMemoryViewerModal';
import ProposalModal from './components/UI/ProposalModal';
import AdminLoginModal from './components/Admin/AdminLoginModal';
import AdminPanel from './components/Admin/AdminPanel';
import { useGameStore } from './store/gameStore';
import { useMobile } from './hooks/useMobile';

export default function App() {
  const isLoading = useGameStore((s) => s.isLoading);
  const loadMuseumContent = useGameStore((s) => s.loadMuseumContent);
  useMobile();

  useEffect(() => {
    void loadMuseumContent();
  }, [loadMuseumContent]);

  return (
    <>
      <BackgroundAudioManager />
      <LoadingScreen />
      {!isLoading && (
        <>
          <Canvas3D />
          <HUD />
          <EntranceGuestbook />
          <GuestbookModal />
          <LoveAlbumModal />
          <SecretLetterModal />
          <DoYouLoveMeModal />
          <LoveQuizModal />
          <PrivateMemoryViewerModal />
          <ProposalModal />
          <MobileControls />
          <PhotoViewer />
          <VideoPlayer />
        </>
      )}
      <AdminLoginModal />
      <AdminPanel />
    </>
  );
}
