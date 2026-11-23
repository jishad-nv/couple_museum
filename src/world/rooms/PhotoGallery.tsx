import { Text } from '@react-three/drei';
import Wall from '../objects/Wall';
import Floor from '../objects/Floor';
import PhotoFrame from '../objects/PhotoFrame';
import { CeilingLight, Pillar } from '../objects/Decorations';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS, GALLERY_SIZE, PHOTO_CONFIG } from '../../utils/constants';

export default function PhotoGallery() {
  const { width, depth } = GALLERY_SIZE;
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallY = WALL_HEIGHT / 2;
  const offsetZ = 12; // Position after entrance

  return (
    <group position={[0, 0, offsetZ]}>
      {/* Floor */}
      <Floor position={[0, 0, 0]} size={[width, depth]} />

      {/* Ceiling */}
      <mesh position={[0, WALL_HEIGHT, 0]} receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.5} />
      </mesh>

      {/* Back wall - door to cinema */}
      <Wall
        position={[0, wallY, halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color={COLORS.wallWhite}
        hasDoor
        doorPosition={0}
        doorWidth={3}
        doorHeight={3.8}
      />

      {/* Front wall - door from entrance */}
      <Wall
        position={[0, wallY, -halfD]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color={COLORS.wallWhite}
        hasDoor
        doorPosition={0}
        doorWidth={3}
        doorHeight={3.8}
      />

      {/* Left wall - door to romantic corner */}
      <Wall
        position={[-halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color={COLORS.wallWarm}
        hasDoor
        doorPosition={0}
        doorWidth={2.5}
        doorHeight={3.5}
      />

      {/* Right wall */}
      <Wall
        position={[halfW, wallY, 0]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color={COLORS.wallWarm}
      />

      {/* Ceiling lights */}
      <CeilingLight position={[-5, WALL_HEIGHT, -3]} />
      <CeilingLight position={[0, WALL_HEIGHT, 0]} />
      <CeilingLight position={[5, WALL_HEIGHT, 3]} />
      <CeilingLight position={[-5, WALL_HEIGHT, 3]} />
      <CeilingLight position={[5, WALL_HEIGHT, -3]} />

      {/* Photo frames on left wall */}
      <PhotoFrame
        position={[-halfW + 0.2, 2.5, -4]}
        rotation={[0, Math.PI / 2, 0]}
        photoId="photo1"
        photoSrc="/photos/photo1.jpg"
        message="Where it all began..."
      />
      <PhotoFrame
        position={[-halfW + 0.2, 2.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        photoId="photo2"
        photoSrc="/photos/photo2.jpg"
        message="Our first adventure together"
      />
      <PhotoFrame
        position={[-halfW + 0.2, 2.5, 4]}
        rotation={[0, Math.PI / 2, 0]}
        photoId="photo3"
        photoSrc="/photos/photo3.jpg"
        message="The day I knew"
      />

      {/* Photo frames on right wall */}
      <PhotoFrame
        position={[halfW - 0.2, 2.5, -4]}
        rotation={[0, -Math.PI / 2, 0]}
        photoId="photo4"
        photoSrc="/photos/photo4.jpg"
        message="Forever and always"
      />
      <PhotoFrame
        position={[halfW - 0.2, 2.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        photoId="photo5"
        photoSrc="/photos/photo5.jpg"
        message="Our love story continues..."
      />
      <PhotoFrame
        position={[halfW - 0.2, 2.5, 4]}
        rotation={[0, -Math.PI / 2, 0]}
        photoId="photo6"
        photoSrc="/photos/photo6.jpg"
        message="Every moment is magic"
      />

      {/* Back wall photos */}
      <PhotoFrame
        position={[-4, 2.5, halfD - 0.2]}
        rotation={[0, Math.PI, 0]}
        photoId="photo7"
        photoSrc="/photos/photo7.jpg"
        message="You make every day beautiful"
      />
      <PhotoFrame
        position={[4, 2.5, halfD - 0.2]}
        rotation={[0, Math.PI, 0]}
        photoId="photo8"
        photoSrc="/photos/photo8.jpg"
        message="Together is my favorite place"
      />

      {/* Center pillars */}
      <Pillar position={[-3, 0, -3]} />
      <Pillar position={[3, 0, -3]} />
      <Pillar position={[-3, 0, 3]} />
      <Pillar position={[3, 0, 3]} />

      {/* Room label */}
      <Text
        position={[0, 4.2, -halfD + 0.5]}
        fontSize={0.25}
        color={COLORS.gold}
        anchorX="center"
        font={undefined}
      >
        ♡ Photo Gallery ♡
      </Text>

      {/* Direction signs */}
      <Text
        position={[-halfW + 0.5, 3.5, 0]}
        fontSize={0.1}
        color={COLORS.gold}
        anchorX="center"
        rotation={[0, Math.PI / 2, 0]}
        font={undefined}
      >
        ← Romantic Corner
      </Text>

      <Text
        position={[0, 3.5, halfD - 0.3]}
        fontSize={0.1}
        color={COLORS.gold}
        anchorX="center"
        rotation={[0, Math.PI, 0]}
        font={undefined}
      >
        → Memory Theatre →
      </Text>
    </group>
  );
}
