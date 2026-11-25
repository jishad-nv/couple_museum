import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  AUDIO_TRACKS,
  CROSSFADE_DURATION_SECONDS,
  TOGGLE_FADE_SECONDS,
  computeZoneMixGains,
  midiToFreq,
  roomToAudioZone,
  type AudioZoneId,
} from '../utils/audioZones';
import type { MuseumMusicTrack, MuseumSettings } from '../utils/museumContentTypes';

const ALL_ZONES: readonly AudioZoneId[] = [
  'gallery',
  'theatre',
  'garden',
  'dance',
  'secret',
  'wedding',
];

interface ZoneBus {
  synthGain: GainNode;
  customGain: GainNode;
  totalGain: number;
  stepIndex: number;
  nextNoteTime: number;
  customSrc: string;
  customEl: HTMLAudioElement | null;
  customSource: MediaElementAudioSourceNode | null;
}

export interface AudioDebugSnapshot {
  activeZone: AudioZoneId;
  trackTitle: string;
  trackSubtitle: string;
  isMusicPlaying: boolean;
  isMuted: boolean;
  contextState: AudioContextState | 'uninitialized';
  targetGains: Record<AudioZoneId, number>;
  currentGains: Record<AudioZoneId, number>;
}

declare global {
  interface Window {
    __LOVE_MUSEUM_AUDIO__?: AudioDebugSnapshot;
  }
}

let sharedAudioCtx: AudioContext | null = null;

/**
 * Unlocks or resumes the shared Web Audio context directly inside a user gesture handler.
 */
export function unlockBackgroundAudio(): void {
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
}

export function resolveAssignedZoneTrack(
  zone: AudioZoneId,
  tracks: MuseumMusicTrack[],
  settings: MuseumSettings
): { title: string; subtitle: string; audioSrc: string; volume: number } {
  const zoneIdMap: Record<AudioZoneId, string> = {
    gallery: settings.galleryMusicTrackId,
    theatre: settings.theatreMusicTrackId,
    garden: settings.gardenMusicTrackId,
    dance: settings.danceMusicTrackId,
    secret: settings.secretMusicTrackId || 'track-secret',
    wedding: settings.weddingMusicTrackId || 'track-wedding',
  };
  const preferredId = zoneIdMap[zone] || settings.defaultMusicTrackId;
  const found =
    tracks.find((t) => t.id === preferredId) ??
    tracks.find((t) => t.zone === zone) ??
    tracks.find((t) => t.id === settings.defaultMusicTrackId) ??
    null;

  if (found) {
    return {
      title: found.title,
      subtitle: found.subtitle,
      audioSrc: found.audioSrc,
      volume: found.volume,
    };
  }
  const fallback = AUDIO_TRACKS[zone];
  return {
    title: fallback.title,
    subtitle: fallback.subtitle,
    audioSrc: '',
    volume: fallback.baseGain,
  };
}

function createHallImpulse(ctx: AudioContext, duration = 2.4, decay = 2.8): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const seed = Math.sin((i + 1) * (ch === 0 ? 12.9898 : 78.233)) * 43758.5453;
      const white = (seed - Math.floor(seed)) * 2 - 1;
      const env = Math.pow(1 - i / length, decay);
      lp = lp * 0.72 + white * 0.28;
      channelData[i] = lp * env;
    }
  }
  return impulse;
}

function triggerFeltPianoNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  when: number,
  duration: number,
  velocity: number
): void {
  const env = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(2600, freq * 5.5), when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(340, freq * 1.6), when + duration * 0.75);
  filter.Q.value = 0.7;

  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, when);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, when);

  const g2 = ctx.createGain();
  g2.gain.value = 0.24;

  env.gain.setValueAtTime(0.0001, when);
  env.gain.linearRampToValueAtTime(velocity, when + 0.018);
  env.gain.exponentialRampToValueAtTime(velocity * 0.42, when + 0.35);
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  osc1.connect(filter);
  osc2.connect(g2);
  g2.connect(filter);
  filter.connect(env);
  env.connect(dest);

  osc1.start(when);
  osc2.start(when);
  osc1.stop(when + duration + 0.05);
  osc2.stop(when + duration + 0.05);
}

function triggerHarpCelestaNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  when: number,
  duration: number,
  velocity: number,
  shimmer = false
): void {
  const env = ctx.createGain();
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, when);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * (shimmer ? 3 : 2), when);

  const g2 = ctx.createGain();
  g2.gain.value = shimmer ? 0.14 : 0.28;

  env.gain.setValueAtTime(0.0001, when);
  env.gain.linearRampToValueAtTime(velocity, when + 0.012);
  env.gain.exponentialRampToValueAtTime(velocity * 0.32, when + 0.3);
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  osc1.connect(env);
  osc2.connect(g2);
  g2.connect(env);
  env.connect(dest);

  osc1.start(when);
  osc2.start(when);
  osc1.stop(when + duration + 0.05);
  osc2.stop(when + duration + 0.05);
}

function triggerStringPadChord(
  ctx: AudioContext,
  dest: AudioNode,
  bassMidi: number,
  padMidis: readonly number[],
  when: number,
  duration: number,
  cutoffHz: number,
  zone: AudioZoneId
): void {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoffHz, when);
  filter.Q.value = 0.6;

  const env = ctx.createGain();
  const peak = zone === 'theatre' ? 0.105 : zone === 'dance' ? 0.088 : 0.075;
  const attack = Math.min(1.1, duration * 0.25);

  env.gain.setValueAtTime(0.0001, when);
  env.gain.linearRampToValueAtTime(peak, when + attack);
  env.gain.setValueAtTime(peak * 0.88, when + duration * 0.72);
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.65);

  filter.connect(env);
  env.connect(dest);

  const bassOsc = ctx.createOscillator();
  bassOsc.type = 'triangle';
  bassOsc.frequency.setValueAtTime(midiToFreq(bassMidi), when);
  const bassGain = ctx.createGain();
  bassGain.gain.value = zone === 'theatre' ? 0.68 : 0.52;
  bassOsc.connect(bassGain);
  bassGain.connect(filter);
  bassOsc.start(when);
  bassOsc.stop(when + duration + 0.7);

  for (let i = 0; i < padMidis.length; i++) {
    const f = midiToFreq(padMidis[i]);
    const oscA = ctx.createOscillator();
    oscA.type = zone === 'theatre' ? 'sawtooth' : 'triangle';
    oscA.frequency.setValueAtTime(f, when);
    oscA.detune.setValueAtTime(-5, when);

    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.setValueAtTime(f, when);
    oscB.detune.setValueAtTime(6, when);

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0.26 / padMidis.length;

    oscA.connect(voiceGain);
    oscB.connect(voiceGain);
    voiceGain.connect(filter);

    oscA.start(when);
    oscB.start(when);
    oscA.stop(when + duration + 0.7);
    oscB.stop(when + duration + 0.7);
  }
}

function scheduleZoneStep(ctx: AudioContext, bus: ZoneBus, zone: AudioZoneId, when: number): void {
  const spec = AUDIO_TRACKS[zone];
  const stepDur = 60 / spec.tempoBpm;
  const totalSteps = spec.chords.length * spec.stepsPerChord;
  const step = bus.stepIndex % totalSteps;
  const chordIdx = Math.floor(step / spec.stepsPerChord);
  const localStep = step % spec.stepsPerChord;
  const chord = spec.chords[chordIdx];

  if (localStep === 0) {
    triggerStringPadChord(
      ctx,
      bus.synthGain,
      chord.bassMidi,
      chord.padMidis,
      when,
      stepDur * spec.stepsPerChord,
      spec.padCutoffHz,
      zone
    );
  }

  const arpMidi = chord.arpMidis[localStep];
  const arpFreq = midiToFreq(arpMidi);
  if (zone === 'gallery' || zone === 'dance' || zone === 'secret') {
    const accent = localStep === 0 || localStep === 3 ? 0.135 : 0.085;
    triggerFeltPianoNote(ctx, bus.synthGain, arpFreq, when, stepDur * 2.1, accent);
  } else if (zone === 'theatre') {
    triggerHarpCelestaNote(ctx, bus.synthGain, arpFreq, when, stepDur * 2.2, 0.085, false);
  } else {
    triggerHarpCelestaNote(ctx, bus.synthGain, arpFreq, when, stepDur * 2.4, 0.09, localStep % 2 === 1);
  }

  const melodyMidi = chord.melodyMidis[localStep];
  if (melodyMidi !== null) {
    const melFreq = midiToFreq(melodyMidi);
    if (zone === 'gallery' || zone === 'secret') {
      triggerFeltPianoNote(
        ctx,
        bus.synthGain,
        melFreq,
        when,
        stepDur * 2.6,
        zone === 'secret' ? 0.125 : 0.145
      );
    } else if (zone === 'dance' || zone === 'wedding') {
      triggerFeltPianoNote(ctx, bus.synthGain, melFreq, when, stepDur * 2.8, 0.155);
      triggerHarpCelestaNote(ctx, bus.synthGain, melFreq, when, stepDur * 2.4, 0.08, true);
    } else if (zone === 'theatre') {
      const melEnv = ctx.createGain();
      const melFilter = ctx.createBiquadFilter();
      melFilter.type = 'lowpass';
      melFilter.frequency.setValueAtTime(1150, when);

      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(melFreq, when);
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(melFreq, when);
      osc2.detune.setValueAtTime(4, when);

      melEnv.gain.setValueAtTime(0.0001, when);
      melEnv.gain.linearRampToValueAtTime(0.115, when + 0.16);
      melEnv.gain.exponentialRampToValueAtTime(0.0001, when + stepDur * 2.8);

      osc1.connect(melFilter);
      osc2.connect(melFilter);
      melFilter.connect(melEnv);
      melEnv.connect(bus.synthGain);

      osc1.start(when);
      osc2.start(when);
      osc1.stop(when + stepDur * 2.9);
      osc2.stop(when + stepDur * 2.9);
    } else {
      triggerHarpCelestaNote(ctx, bus.synthGain, melFreq, when, stepDur * 2.9, 0.125, true);
    }
  }

  bus.stepIndex = (step + 1) % totalSteps;
  bus.nextNoteTime = when + stepDur;
}

function cleanupCustomElement(bus: ZoneBus): void {
  if (bus.customEl) {
    bus.customEl.pause();
    bus.customEl.removeAttribute('src');
    bus.customEl.load();
    bus.customEl = null;
  }
  if (bus.customSource) {
    try {
      bus.customSource.disconnect();
    } catch {
      // ignore already disconnected nodes
    }
    bus.customSource = null;
  }
  bus.customSrc = '';
}

export default function BackgroundAudioManager() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const isDancing = useGameStore((s) => s.isDancing);
  const isMusicPlaying = useGameStore((s) => s.isMusicPlaying);
  const isMuted = useGameStore((s) => s.isMuted);
  const showVideoPlayer = useGameStore((s) => s.showVideoPlayer);
  const musicTracks = useGameStore((s) => s.musicTracks);
  const museumSettings = useGameStore((s) => s.museumSettings);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const busesRef = useRef<Record<AudioZoneId, ZoneBus> | null>(null);
  const activeZoneRef = useRef<AudioZoneId>(roomToAudioZone(currentRoom, isDancing));
  const targetGainsRef = useRef<Record<AudioZoneId, number>>({
    gallery: 0,
    theatre: 0,
    garden: 0,
    dance: 0,
    secret: 0,
    wedding: 0,
  });

  // Helper to attach/sync custom audio stream for a zone when a custom audioSrc is assigned
  const syncZoneAudioNodes = () => {
    const ctx = ctxRef.current;
    const buses = busesRef.current;
    if (!ctx || !buses) return;

    const s = useGameStore.getState();
    const zone = roomToAudioZone(s.currentRoom, s.isDancing);
    const prevZone = activeZoneRef.current;
    activeZoneRef.current = zone;

    const duckFactor = s.showVideoPlayer ? 0.55 : 1.0;
    const mix = computeZoneMixGains(zone, s.isMusicPlaying, s.isMuted);
    const t = ctx.currentTime;

    if (masterGainRef.current) {
      const targetMaster = s.isMuted ? 0 : Math.max(0, Math.min(1, s.museumSettings.musicVolume));
      masterGainRef.current.gain.setTargetAtTime(targetMaster, t, 0.08);
    }

    const isCrossfading = prevZone !== zone && s.isMusicPlaying && !s.isMuted;
    const tau = (isCrossfading ? CROSSFADE_DURATION_SECONDS : TOGGLE_FADE_SECONDS) / 3.2;

    const totalTargets: Record<AudioZoneId, number> = {
      gallery: 0,
      theatre: 0,
      garden: 0,
      dance: 0,
      secret: 0,
      wedding: 0,
    };

    for (const z of ALL_ZONES) {
      const bus = buses[z];
      const assigned = resolveAssignedZoneTrack(z, s.musicTracks, s.museumSettings);
      const desiredTotal = mix[z] * Math.max(0.1, assigned.volume) * duckFactor;
      totalTargets[z] = desiredTotal;

      const hasCustomAudio = Boolean(assigned.audioSrc && assigned.audioSrc.trim().length > 0);

      if (hasCustomAudio) {
        if (bus.customSrc !== assigned.audioSrc) {
          cleanupCustomElement(bus);
          const el = new Audio();
          el.src = assigned.audioSrc;
          el.crossOrigin = 'anonymous';
          el.loop = true;
          el.preload = 'auto';
          try {
            const srcNode = ctx.createMediaElementSource(el);
            srcNode.connect(bus.customGain);
            bus.customEl = el;
            bus.customSource = srcNode;
            bus.customSrc = assigned.audioSrc;
          } catch {
            cleanupCustomElement(bus);
          }
        }

        // Crossfade procedural off and custom on
        bus.synthGain.gain.setTargetAtTime(0, t, tau);
        bus.customGain.gain.setTargetAtTime(desiredTotal, t, tau);

        if (bus.customEl) {
          if (desiredTotal > 0.005 && ctx.state === 'running') {
            bus.customEl.play().catch(() => {});
          }
        }
      } else {
        if (bus.customEl) {
          cleanupCustomElement(bus);
        }
        bus.customGain.gain.setTargetAtTime(0, t, tau);
        if (desiredTotal > 0.01 && bus.synthGain.gain.value < 0.005) {
          bus.nextNoteTime = Math.max(bus.nextNoteTime, t + 0.06);
        }
        bus.synthGain.gain.setTargetAtTime(desiredTotal, t, tau);
      }

      bus.totalGain = desiredTotal;
    }

    targetGainsRef.current = totalTargets;
  };

  // Initialize Web Audio graph & gesture unlock once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;

    let ctx: AudioContext;
    try {
      ctx = new AC();
    } catch {
      return;
    }

    sharedAudioCtx = ctx;
    ctxRef.current = ctx;

    const initialState = useGameStore.getState();
    const masterGain = ctx.createGain();
    masterGain.gain.value = initialState.isMuted ? 0 : initialState.museumSettings.musicVolume;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.25;
    compressor.connect(masterGain);

    const dryBus = ctx.createGain();
    dryBus.gain.value = 0.85;
    dryBus.connect(compressor);

    const wetBus = ctx.createGain();
    wetBus.gain.value = 0.34;
    const convolver = ctx.createConvolver();
    convolver.buffer = createHallImpulse(ctx);
    const reverbTone = ctx.createBiquadFilter();
    reverbTone.type = 'lowpass';
    reverbTone.frequency.value = 2200;
    wetBus.connect(convolver);
    convolver.connect(reverbTone);
    reverbTone.connect(compressor);

    const now = ctx.currentTime;
    activeZoneRef.current = roomToAudioZone(initialState.currentRoom, initialState.isDancing);

    const buses = {} as Record<AudioZoneId, ZoneBus>;
    for (const zone of ALL_ZONES) {
      const synthGain = ctx.createGain();
      synthGain.gain.value = 0;
      synthGain.connect(dryBus);
      synthGain.connect(wetBus);

      const customGain = ctx.createGain();
      customGain.gain.value = 0;
      customGain.connect(dryBus);

      buses[zone] = {
        synthGain,
        customGain,
        totalGain: 0,
        stepIndex: 0,
        nextNoteTime: now + 0.08,
        customSrc: '',
        customEl: null,
        customSource: null,
      };
    }
    busesRef.current = buses;

    syncZoneAudioNodes();

    const onGestureUnlock = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().then(syncZoneAudioNodes).catch(() => {});
      }
    };

    window.addEventListener('pointerdown', onGestureUnlock, { passive: true });
    window.addEventListener('keydown', onGestureUnlock, { passive: true });
    window.addEventListener('touchstart', onGestureUnlock, { passive: true });

    const schedulerId = window.setInterval(() => {
      const s = useGameStore.getState();
      const t = ctx.currentTime;

      if (ctx.state === 'running' && s.isMusicPlaying && !s.isMuted) {
        for (const zone of ALL_ZONES) {
          const bus = buses[zone];
          const target = targetGainsRef.current[zone];

          // Handle custom audio element fade-out pause so two tracks never overlap invisibly
          if (bus.customEl) {
            if (target > 0.005) {
              if (bus.customEl.paused) bus.customEl.play().catch(() => {});
            } else if (bus.customGain.gain.value < 0.01 && !bus.customEl.paused) {
              bus.customEl.pause();
            }
          }

          const audibleSynth = !bus.customEl && (target > 0.002 || bus.synthGain.gain.value > 0.012);
          if (!audibleSynth) {
            bus.nextNoteTime = t + 0.08;
            continue;
          }
          if (bus.nextNoteTime < t - 0.5) {
            bus.nextNoteTime = t + 0.05;
          }
          while (bus.nextNoteTime < t + 0.22) {
            scheduleZoneStep(ctx, bus, zone, bus.nextNoteTime);
          }
        }
      } else {
        for (const zone of ALL_ZONES) {
          const bus = buses[zone];
          bus.nextNoteTime = t + 0.08;
          if (bus.customEl && !bus.customEl.paused && bus.customGain.gain.value < 0.015) {
            bus.customEl.pause();
          }
        }
      }

      const active = activeZoneRef.current;
      const resolvedTrack = resolveAssignedZoneTrack(active, s.musicTracks, s.museumSettings);
      window.__LOVE_MUSEUM_AUDIO__ = {
        activeZone: active,
        trackTitle: resolvedTrack.title,
        trackSubtitle: resolvedTrack.subtitle,
        isMusicPlaying: s.isMusicPlaying,
        isMuted: s.isMuted,
        contextState: ctx.state,
        targetGains: { ...targetGainsRef.current },
        currentGains: {
          gallery: Number((buses.gallery.synthGain.gain.value + buses.gallery.customGain.gain.value).toFixed(3)),
          theatre: Number((buses.theatre.synthGain.gain.value + buses.theatre.customGain.gain.value).toFixed(3)),
          garden: Number((buses.garden.synthGain.gain.value + buses.garden.customGain.gain.value).toFixed(3)),
          dance: Number((buses.dance.synthGain.gain.value + buses.dance.customGain.gain.value).toFixed(3)),
          secret: Number((buses.secret.synthGain.gain.value + buses.secret.customGain.gain.value).toFixed(3)),
          wedding: Number((buses.wedding.synthGain.gain.value + buses.wedding.customGain.gain.value).toFixed(3)),
        },
      };
    }, 100);

    return () => {
      window.clearInterval(schedulerId);
      window.removeEventListener('pointerdown', onGestureUnlock);
      window.removeEventListener('keydown', onGestureUnlock);
      window.removeEventListener('touchstart', onGestureUnlock);
      for (const zone of ALL_ZONES) {
        cleanupCustomElement(buses[zone]);
      }
      sharedAudioCtx = null;
      ctxRef.current = null;
      masterGainRef.current = null;
      busesRef.current = null;
      ctx.close().catch(() => {});
    };
  }, []);

  // Re-sync crossfades, zone music assignments, volume, and dance mode live
  useEffect(() => {
    syncZoneAudioNodes();
    const s = useGameStore.getState();
    const buses = busesRef.current;
    const ctx = ctxRef.current;
    if (!buses || !ctx) return;
    const active = activeZoneRef.current;
    const resolvedTrack = resolveAssignedZoneTrack(active, s.musicTracks, s.museumSettings);
    window.__LOVE_MUSEUM_AUDIO__ = {
      activeZone: active,
      trackTitle: resolvedTrack.title,
      trackSubtitle: resolvedTrack.subtitle,
      isMusicPlaying,
      isMuted,
      contextState: ctx.state,
      targetGains: { ...targetGainsRef.current },
      currentGains: {
        gallery: Number((buses.gallery.synthGain.gain.value + buses.gallery.customGain.gain.value).toFixed(3)),
        theatre: Number((buses.theatre.synthGain.gain.value + buses.theatre.customGain.gain.value).toFixed(3)),
        garden: Number((buses.garden.synthGain.gain.value + buses.garden.customGain.gain.value).toFixed(3)),
        dance: Number((buses.dance.synthGain.gain.value + buses.dance.customGain.gain.value).toFixed(3)),
        secret: Number((buses.secret.synthGain.gain.value + buses.secret.customGain.gain.value).toFixed(3)),
        wedding: Number((buses.wedding.synthGain.gain.value + buses.wedding.customGain.gain.value).toFixed(3)),
      },
    };
  }, [currentRoom, isDancing, isMusicPlaying, isMuted, showVideoPlayer, musicTracks, museumSettings]);

  return null;
}
