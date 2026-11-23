import { useEffect } from 'react';
import Canvas3D from './components/Canvas3D';
import LoadingScreen from './components/LoadingScreen';
import HUD from './components/UI/HUD';
import MobileControls from './components/UI/MobileControls';
import PhotoViewer from './components/UI/PhotoViewer';
import VideoPlayer from './components/UI/VideoPlayer';
import { useGameStore } from './store/gameStore';
import { useMobile } from './hooks/useMobile';

export default function App() {
  const { isLoading } = useGameStore();
  useMobile();

  // Detect current room based on player position
  const playerPosition = useGameStore((s) => s.playerPosition);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);

  useEffect(() => {
    const z = playerPosition.z;
    const x = playerPosition.x;

    if (z < 6) {
      setCurrentRoom('entrance');
    } else if (z < 19 && x > -10) {
      setCurrentRoom('gallery');
    } else if (x < -10) {
      setCurrentRoom('romantic');
    } else if (z < 33) {
      setCurrentRoom('cinema');
    } else {
      setCurrentRoom('garden');
    }
  }, [playerPosition, setCurrentRoom]);

  return (
    <>
      <LoadingScreen />
      {!isLoading && (
        <>
          <Canvas3D />
          <HUD />
          <MobileControls />
          <PhotoViewer />
          <VideoPlayer />
        </>
      )}
    </>
  );
}
