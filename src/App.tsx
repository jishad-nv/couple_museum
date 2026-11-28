import { useEffect, useState } from 'react';
import BackgroundAudioManager from './audio/BackgroundAudioManager';
import Canvas3D from './components/Canvas3D';
import LoadingScreen from './components/LoadingScreen';
import HUD from './components/UI/HUD';
import EntranceGuestbook from './components/UI/EntranceGuestbook';
import GuestbookModal from './components/UI/GuestbookModal';
import LoveAlbumModal from './components/UI/LoveAlbumModal';
import MobileControls from './components/UI/MobileControls';
import LandscapeOrientationScreen from './components/UI/LandscapeOrientationScreen';
import PhotoViewer from './components/UI/PhotoViewer';
import VideoPlayer from './components/UI/VideoPlayer';
import SecretLetterModal from './components/UI/SecretLetterModal';
import DoYouLoveMeModal from './components/UI/DoYouLoveMeModal';
import LoveQuizModal from './components/UI/LoveQuizModal';
import PrivateMemoryViewerModal from './components/UI/PrivateMemoryViewerModal';
import ProposalModal from './components/UI/ProposalModal';
import PasswordPromptModal from './components/UI/PasswordPromptModal';
import GenderSelectionModal from './components/UI/GenderSelectionModal';
import BouquetCreatorModal from './components/UI/BouquetCreatorModal';
import AdminLoginModal from './components/Admin/AdminLoginModal';
import AdminPanel from './components/Admin/AdminPanel';
import { useGameStore } from './store/gameStore';
import { useMobile } from './hooks/useMobile';

export default function App() {
  const isLoading = useGameStore((s) => s.isLoading);
  const isMobile = useGameStore((s) => s.isMobile);
  const isPortrait = useGameStore((s) => s.isPortrait);
  const loadMuseumContent = useGameStore((s) => s.loadMuseumContent);
  useMobile();

  const orientationBlocked = isMobile && isPortrait;
  const [canvasBooted, setCanvasBooted] = useState(() => !orientationBlocked);

  useEffect(() => {
    if (!orientationBlocked && !canvasBooted) {
      setCanvasBooted(true);
    }
  }, [orientationBlocked, canvasBooted]);

  useEffect(() => {
    void loadMuseumContent();
  }, [loadMuseumContent]);

  return (
    <>
      <BackgroundAudioManager />
      <LoadingScreen />
      {canvasBooted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            visibility: orientationBlocked ? 'hidden' : 'visible',
            pointerEvents: orientationBlocked || isLoading ? 'none' : 'auto',
          }}
        >
          <Canvas3D />
          {!orientationBlocked && !isLoading && (
            <>
              <HUD />
              <EntranceGuestbook />
              <GuestbookModal />
              <LoveAlbumModal />
              <SecretLetterModal />
              <DoYouLoveMeModal />
              <LoveQuizModal />
              <PrivateMemoryViewerModal />
              <ProposalModal />
              <PasswordPromptModal />
              <GenderSelectionModal />
              <BouquetCreatorModal />
              <MobileControls />
              <PhotoViewer />
              <VideoPlayer />
            </>
          )}
        </div>
      )}
      {orientationBlocked && <LandscapeOrientationScreen />}
      <AdminLoginModal />
      <AdminPanel />
    </>
  );
}
