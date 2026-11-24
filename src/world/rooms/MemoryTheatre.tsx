import { useMemo } from 'react';
import Wall from '../objects/Wall';
import Floor from '../objects/Floor';
import CinemaScreen from '../objects/CinemaScreen';
import Bench from '../objects/Decorations';
import { COLORS, WALL_HEIGHT, WALL_THICKNESS, CINEMA_SIZE } from '../../utils/constants';
import { THEATRE_SIDE_SEATS, THEATRE_VIP_SEAT_POS } from '../../utils/museumLayout';

const ACOUSTIC_WALL_Z = [-42.0, -45.2, -48.4, -51.6, -54.2];

export default function MemoryTheatre() {
  const { width, depth } = CINEMA_SIZE; // 16 x 18
  const centerZ = -47.5; // Spans z = -38.5 (South entrance) to z = -56.5 (North front screen wall)
  const halfW = width / 2;
  const wallY = WALL_HEIGHT / 2;

  // Starry acoustic ceiling lights
  const ceilingStars = useMemo(() => {
    const arr: Array<[number, number]> = [];
    for (let i = 0; i < 24; i++) {
      const sx = (((i * 43 + 17) % 100) / 100 - 0.5) * 12;
      const sz = -40.5 - (((i * 61 + 29) % 100) / 100) * 14.5;
      arr.push([sx, sz]);
    }
    return arr;
  }, []);

  // Note: South Theatre doorway is mounted at z = -38.5 inside PhotoGallery; seal remaining left/right South corners cleanly
  return (
    <group>
      {/* Plush Dark Theatre Floor (top at y = 0, meets z = -38.5 cleanly) */}
      <Floor position={[0, 0, centerZ - 0.25]} size={[width, depth - 0.5]} color="#17101f" />

      {/* Dark Acoustic Ceiling */}
      <mesh position={[0, WALL_HEIGHT, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0e0914" roughness={0.9} />
      </mesh>

      {/* Subtle Starlight Ceiling Points */}
      {ceilingStars.map(([sx, sz], i) => (
        <mesh key={`cstar-${i}`} position={[sx, WALL_HEIGHT - 0.04, sz]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#ffe8b0" emissive="#ffd885" emissiveIntensity={1.6} />
        </mesh>
      ))}

      {/* North Screen Wall (front of cinema, z = -56.5) */}
      <Wall
        position={[0, wallY, -56.5]}
        size={[width, WALL_HEIGHT, WALL_THICKNESS]}
        color="#140d1b"
      />

      {/* East & West Acoustic Walls */}
      <Wall
        position={[-halfW, wallY, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color="#1c1226"
      />
      <Wall
        position={[halfW, wallY, centerZ]}
        size={[WALL_THICKNESS, WALL_HEIGHT, depth]}
        color="#1c1226"
      />

      {/* South Corner Wings (seal x = ±2.8..±8.0 at z = -38.5 without duplicating PhotoGallery center doorway) */}
      <Wall position={[-5.4, wallY, -38.5]} size={[5.2, WALL_HEIGHT, WALL_THICKNESS]} color="#1c1226" />
      <Wall position={[5.4, wallY, -38.5]} size={[5.2, WALL_HEIGHT, WALL_THICKNESS]} color="#1c1226" />

      {/* Acoustic Fluted Wall Panels & Warm Sconces along East/West Walls */}
      {ACOUSTIC_WALL_Z.map((zPos) => (
        <group key={`ap-${zPos}`}>
          <mesh position={[-halfW + 0.22, wallY, zPos]}>
            <boxGeometry args={[0.14, 4.1, 2.2]} />
            <meshStandardMaterial color="#2a1932" roughness={0.85} />
          </mesh>
          <mesh position={[halfW - 0.22, wallY, zPos]}>
            <boxGeometry args={[0.14, 4.1, 2.2]} />
            <meshStandardMaterial color="#2a1932" roughness={0.85} />
          </mesh>
          {/* Warm Wall Sconces */}
          <mesh position={[-halfW + 0.32, 3.0, zPos]}>
            <boxGeometry args={[0.08, 0.36, 0.14]} />
            <meshStandardMaterial color="#ffd58a" emissive="#ffbe55" emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[halfW - 0.32, 3.0, zPos]}>
            <boxGeometry args={[0.08, 0.36, 0.14]} />
            <meshStandardMaterial color="#ffd58a" emissive="#ffbe55" emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}

      {/* Crimson Red Carpet running straight down the center aisle */}
      <mesh position={[0, 0.014, -46.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, 16.0]} />
        <meshStandardMaterial color={COLORS.velvetRed} roughness={0.88} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh position={[-1.3, 0.016, -46.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 16.0]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh position={[1.3, 0.016, -46.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 16.0]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.35} polygonOffset polygonOffsetFactor={-2} />
      </mesh>

      {/* Large Cinematic Screen mounted directly on North Wall, facing South (+Z) toward seats */}
      <CinemaScreen position={[0, 3.05, -56.05]} rotation={[0, 0, 0]} size={[10.4, 5.0]} />

      {/* Raised Stage Lip beneath the Screen */}
      <mesh position={[0, 0.15, -55.4]} receiveShadow>
        <boxGeometry args={[12.5, 0.3, 1.4]} />
        <meshStandardMaterial color="#2a1628" roughness={0.75} />
      </mesh>

      {/* Interactive Center Couple VIP Loveseat facing the North Screen (rotation Y = Math.PI -> faces -Z) */}
      <Bench
        position={THEATRE_VIP_SEAT_POS}
        rotation={[0, Math.PI, 0]}
        benchId="cinema-vip-seat"
        benchLabel="Cinema VIP Loveseat"
        interactive
      />

      {/* Interactive Side Cinema Loveseats */}
      {THEATRE_SIDE_SEATS.map((seat) => (
        <Bench
          key={seat.id}
          position={seat.position}
          rotation={[0, seat.rotation, 0]}
          benchId={seat.id}
          benchLabel={seat.label}
          interactive
        />
      ))}
    </group>
  );
}
