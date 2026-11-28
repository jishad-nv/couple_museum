import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { useInput } from '../hooks/useInput';
import Character from './Character';
import {
  PLAYER_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_FORCE,
} from '../utils/constants';
import {
  DANCE_SPOT_POS,
  computeSeatAlignment,
  detectMuseumRoom,
  getDanceCouplePositions,
  getWeddingCeremonyPose,
} from '../utils/museumLayout';
import { isProposalBusy } from '../utils/proposal';
import { advanceCakeCuttingStage, getCakeCuttingPose } from '../utils/weddingCake';
import {
  advanceBouquetHandoverStage,
  getActiveBouquetReaction,
  getBouquetHandoverActions,
} from '../utils/bouquet';

function wrapAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export default function CharacterController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const characterRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(Math.PI);
  const isGrounded = useRef(true);
  const coupleSeqTimer = useRef(0);
  const proposalTimer = useRef(0);
  const lastProposalStage = useRef('idle');
  const cakeTimerRef = useRef(0);
  const lastCakeStageRef = useRef('idle');
  const bouquetTimerRef = useRef(0);
  const lastBouquetStageRef = useRef('idle');
  const dancePhaseRef = useRef(0);
  const wasSitting = useRef(false);
  const lastBenchPos = useRef<[number, number, number] | null>(null);
  const lastBenchRot = useRef(0);
  const scriptedWalkElapsed = useRef(0);
  const lastScriptedDist = useRef(Infinity);
  const lastScriptedKey = useRef('');
  const { getInput } = useInput();

  const characterAction = useGameStore((s) => s.characterAction);
  const isHoldingHands = useGameStore((s) => s.isHoldingHands);
  const isSitting = useGameStore((s) => s.isSitting);
  const isDancing = useGameStore((s) => s.isDancing);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const groomOutfit = useGameStore((s) => s.groomOutfit);
  const weddingStage = useGameStore((s) => s.weddingStage);
  const cakeCuttingStage = useGameStore((s) => s.cakeCuttingStage);
  const proposalStage = useGameStore((s) => s.proposalStage);
  const createdBouquet = useGameStore((s) => s.createdBouquet);
  const heldBouquetBy = useGameStore((s) => s.heldBouquetBy);
  const bouquetHandoverStage = useGameStore((s) => s.bouquetHandoverStage);
  const bouquetHandoverAnchor = useGameStore((s) => s.bouquetHandoverAnchor);
  const isWalkingToSeat = useGameStore(
    (s) =>
      s.scriptedWalk?.onArrive === 'sit_cinema' ||
      s.scriptedWalk?.onArrive === 'sit_garden' ||
      s.scriptedWalk?.onArrive === 'sit_secret' ||
      s.scriptedWalk?.onArrive === 'sit_wedding'
  );

  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const moveDirection = useRef(new THREE.Vector3());
  const scratchPos = useRef(new THREE.Vector3());

  useFrame((_, rawDelta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;
    const delta = Math.min(rawDelta, 0.08);

    const state = useGameStore.getState();

    // If transitioning from sitting -> standing (via button, WASD, or hug/kiss), place cleanly in front of bench
    if (wasSitting.current && !state.isSitting && lastBenchPos.current) {
      const aligned = computeSeatAlignment(lastBenchPos.current, lastBenchRot.current);
      rb.setTranslation(
        { x: aligned.exitPos[0], y: aligned.exitPos[1], z: aligned.exitPos[2] },
        true
      );
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      wasSitting.current = false;
      lastBenchPos.current = null;
    }

    const pos = rb.translation();
    // Safety recovery if physics ever dips below y = 0
    if (pos.y < -0.15) {
      rb.setTranslation({ x: pos.x, y: 0.02, z: pos.z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    scratchPos.current.set(pos.x, Math.max(0, pos.y), pos.z);
    state.setPlayerPosition(scratchPos.current);

    // Update current room cleanly only when room changes
    const room = detectMuseumRoom(pos.x, pos.z);
    if (room !== state.currentRoom) {
      state.setCurrentRoom(room);
    }

    // Pause gameplay movement while mobile portrait orientation prompt is active
    if (state.isMobile && state.isPortrait) {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      state.setIsMoving(false);
      state.setIsRunning(false);
      return;
    }

    // Handle active Proposal sequence (approaching -> kneeling -> awaiting_answer -> accepted_standing -> embracing -> celebrating)
    if (state.proposalStage !== 'idle' && state.proposalAnchor) {
      if (state.proposalStage !== lastProposalStage.current) {
        lastProposalStage.current = state.proposalStage;
        proposalTimer.current = 0;
      }
      proposalTimer.current += delta;

      const anchor = state.proposalAnchor;
      const moveAlpha = 1 - Math.exp(-9 * delta);
      const nx = THREE.MathUtils.lerp(pos.x, anchor.proposer[0], moveAlpha);
      const ny = THREE.MathUtils.lerp(pos.y, 0, 1 - Math.exp(-12 * delta));
      const nz = THREE.MathUtils.lerp(pos.z, anchor.proposer[2], moveAlpha);

      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setTranslation({ x: nx, y: ny, z: nz }, true);

      targetRotation.current = anchor.proposerFacing;
      state.setPlayerRotation(anchor.proposerFacing);
      if (characterRef.current) {
        const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
        characterRef.current.rotation.y += diff * Math.min(1, delta * 12);
      }

      const distToAnchor = Math.hypot(anchor.proposer[0] - pos.x, anchor.proposer[2] - pos.z);

      if (state.proposalStage === 'approaching') {
        state.setIsMoving(distToAnchor > 0.08);
        state.setCharacterAction(distToAnchor > 0.08 ? 'walk' : 'idle');
        if ((distToAnchor <= 0.08 && proposalTimer.current >= 0.55) || proposalTimer.current >= 1.5) {
          state.setProposalStage('kneeling');
        }
      } else if (state.proposalStage === 'kneeling') {
        state.setIsMoving(false);
        state.setCharacterAction('propose_kneel');
        if (proposalTimer.current >= 1.25) {
          state.setProposalStage('awaiting_answer');
        }
      } else if (state.proposalStage === 'awaiting_answer') {
        state.setIsMoving(false);
        state.setCharacterAction('propose_kneel');
      } else if (state.proposalStage === 'accepted_standing') {
        state.setIsMoving(false);
        state.setCharacterAction('propose_stand');
        if (proposalTimer.current >= 1.35) {
          state.setProposalStage('embracing');
        }
      } else if (state.proposalStage === 'embracing') {
        state.setIsMoving(false);
        state.setCharacterAction('propose_embrace');
        if (proposalTimer.current >= 2.6) {
          state.setProposalStage('celebrating');
        }
      } else if (state.proposalStage === 'celebrating') {
        state.setIsMoving(false);
        state.setCharacterAction('celebrate');
        if (proposalTimer.current >= 1.7) {
          state.finishProposal();
        }
      }
      return;
    } else {
      lastProposalStage.current = 'idle';
      proposalTimer.current = 0;
    }

    // Handle active Bouquet Handover sequence (approaching -> offering -> receiving -> reaction)
    if (state.bouquetHandoverStage !== 'idle' && state.bouquetHandoverAnchor) {
      const seqDelta = Math.min(rawDelta, 0.5);
      if (state.bouquetHandoverStage !== lastBouquetStageRef.current) {
        lastBouquetStageRef.current = state.bouquetHandoverStage;
        bouquetTimerRef.current = 0;
      }
      bouquetTimerRef.current += seqDelta;

      const anchor = state.bouquetHandoverAnchor;
      const boyAlpha = 1 - Math.exp(-9 * seqDelta);
      const nx = THREE.MathUtils.lerp(pos.x, anchor.boyPos[0], boyAlpha);
      const ny = THREE.MathUtils.lerp(pos.y, 0, 1 - Math.exp(-12 * seqDelta));
      const nz = THREE.MathUtils.lerp(pos.z, anchor.boyPos[2], boyAlpha);

      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setTranslation({ x: nx, y: ny, z: nz }, true);

      targetRotation.current = anchor.boyFacing;
      state.setPlayerRotation(anchor.boyFacing);
      if (characterRef.current) {
        const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
        characterRef.current.rotation.y += diff * Math.min(1, seqDelta * 12);
      }

      const boyDist = Math.hypot(anchor.boyPos[0] - pos.x, anchor.boyPos[2] - pos.z);
      const girlDist = Math.hypot(
        anchor.girlPos[0] - state.partnerPosition.x,
        anchor.girlPos[2] - state.partnerPosition.z
      );
      const giverDist = anchor.giver === 'boy' ? boyDist : girlDist;
      const actions = getBouquetHandoverActions(state.bouquetHandoverStage, anchor.giver, giverDist);
      state.setIsMoving(
        anchor.giver === 'boy' && state.bouquetHandoverStage === 'approaching' && giverDist > 0.16
      );
      state.setCharacterAction(actions.boyAction);

      const nextStage = advanceBouquetHandoverStage(
        state.bouquetHandoverStage,
        bouquetTimerRef.current,
        giverDist
      );
      if (nextStage === 'done') {
        bouquetTimerRef.current = 0;
        lastBouquetStageRef.current = 'idle';
        state.finishGiveBouquet();
      } else if (nextStage !== state.bouquetHandoverStage) {
        bouquetTimerRef.current = 0;
        lastBouquetStageRef.current = nextStage;
        state.setBouquetHandoverStage(nextStage);
      }
      return;
    } else {
      lastBouquetStageRef.current = 'idle';
      bouquetTimerRef.current = 0;
    }

    // Handle active couple sequence (hug / kiss)
    if (state.activeCoupleSequence === 'hug' || state.activeCoupleSequence === 'kiss') {
      coupleSeqTimer.current += delta;
      rb.setLinvel({ x: 0, y: rb.linvel().y, z: 0 }, true);

      // Face toward partner smoothly
      const dx = state.partnerPosition.x - pos.x;
      const dz = state.partnerPosition.z - pos.z;
      if (Math.hypot(dx, dz) > 0.05) {
        targetRotation.current = Math.atan2(dx, dz);
      }
      if (characterRef.current) {
        const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
        characterRef.current.rotation.y += diff * Math.min(1, delta * 10);
      }

      if (coupleSeqTimer.current >= 3.2) {
        coupleSeqTimer.current = 0;
        state.endCoupleSequence();
      }
      return;
    } else {
      coupleSeqTimer.current = 0;
    }

    // Handle scripted smooth walk (opening museum door, entering theatre/garden, walking to seat or dance spot)
    if (state.scriptedWalk) {
      const { target, waypoints, waypointIndex = 0, facing, onArrive, benchPos, benchRot } = state.scriptedWalk;
      const hasWaypoints = Array.isArray(waypoints) && waypoints.length > 0;
      const activeIdx = hasWaypoints ? Math.min(waypointIndex, waypoints.length - 1) : 0;
      const isIntermediateWaypoint = hasWaypoints && activeIdx < waypoints.length - 1;
      const activePoint = hasWaypoints ? waypoints[activeIdx] : target;

      let destX = activePoint[0];
      let destZ = activePoint[2];
      const arrivingToSit =
        !isIntermediateWaypoint &&
        (onArrive === 'sit_cinema' ||
          onArrive === 'sit_garden' ||
          onArrive === 'sit_secret' ||
          onArrive === 'sit_wedding') &&
        Boolean(benchPos);
      if (arrivingToSit && benchPos) {
        const rot = benchRot ?? Math.PI;
        const aligned = computeSeatAlignment(benchPos, rot);
        destX = aligned.player[0];
        destZ = aligned.player[2];
      } else if (!isIntermediateWaypoint && onArrive === 'dance_together') {
        const dancePose = getDanceCouplePositions(DANCE_SPOT_POS[0], DANCE_SPOT_POS[2], dancePhaseRef.current);
        destX = dancePose.player[0];
        destZ = dancePose.player[2];
      } else if (!isIntermediateWaypoint && onArrive === 'wedding_aisle') {
        const aislePose = getWeddingCeremonyPose('aisle_walk');
        destX = aislePose.player[0];
        destZ = aislePose.player[2];
      }

      const key = `${destX.toFixed(2)},${destZ.toFixed(2)},${activeIdx},${onArrive ?? ''}`;
      if (key !== lastScriptedKey.current) {
        lastScriptedKey.current = key;
        scriptedWalkElapsed.current = 0;
        lastScriptedDist.current = Infinity;
      }
      scriptedWalkElapsed.current += Math.min(rawDelta, 0.25);

      const dx = destX - pos.x;
      const dz = destZ - pos.z;
      const dist = Math.hypot(dx, dz);
      const crossedTarget = lastScriptedDist.current < 1.1 && dist > lastScriptedDist.current + 0.04;
      const timedOut = scriptedWalkElapsed.current > 10.0;
      const arrivalThreshold = isIntermediateWaypoint ? 0.38 : arrivingToSit ? 0.36 : 0.28;

      if (dist > arrivalThreshold && !crossedTarget && !timedOut) {
        lastScriptedDist.current = dist;
        const maxWalkSpeed = onArrive === 'wedding_aisle' ? 2.6 : 4.8;
        const walkSpeed =
          !isIntermediateWaypoint && dist < 1.6
            ? Math.min(maxWalkSpeed, Math.max(1.05, dist * 2.5))
            : maxWalkSpeed;
        const vx = (dx / dist) * walkSpeed;
        const vz = (dz / dist) * walkSpeed;
        rb.setLinvel({ x: vx, y: rb.linvel().y, z: vz }, true);
        targetRotation.current = Math.atan2(dx, dz);
        state.setPlayerRotation(targetRotation.current);
        state.setIsMoving(true);
        state.setCharacterAction(state.isHoldingHands ? 'hold_hands_walk' : 'walk');
      } else if (isIntermediateWaypoint) {
        scriptedWalkElapsed.current = 0;
        lastScriptedDist.current = Infinity;
        lastScriptedKey.current = '';
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setTranslation({ x: destX, y: 0, z: destZ }, true);
        useGameStore.setState({
          scriptedWalk: {
            ...state.scriptedWalk,
            waypointIndex: activeIdx + 1,
          },
        });
      } else {
        scriptedWalkElapsed.current = 0;
        lastScriptedDist.current = Infinity;
        lastScriptedKey.current = '';

        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setTranslation({ x: destX, y: 0, z: destZ }, true);
        targetRotation.current = facing;
        state.setPlayerRotation(facing);
        state.setIsMoving(false);

        if (arrivingToSit && benchPos) {
          state.sitDown(benchPos, benchRot ?? facing);
          if (onArrive === 'sit_cinema') {
            state.setCinemaPlaying(true);
          }
        } else if (onArrive === 'dance_together') {
          state.activateDanceInPlace();
        } else if (onArrive === 'wedding_aisle') {
          state.clearScriptedWalk();
          state.setWeddingStage('ready');
          useGameStore.setState({
            weddingBannerMessage: 'At the floral arch! Press Exchange Vows when ready',
          });
          state.setCharacterAction('idle');
        } else {
          state.clearScriptedWalk();
          state.setCharacterAction('idle');
        }
      }

      if (characterRef.current) {
        const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
        characterRef.current.rotation.y += diff * Math.min(1, delta * 10);
      }
      return;
    } else {
      scriptedWalkElapsed.current = 0;
      lastScriptedDist.current = Infinity;
      lastScriptedKey.current = '';
    }

    const input = getInput();

    // Separate Wedding Cake Cutting & Mutual Feeding sequence — exits cleanly on WASD/Jump
    if (state.currentRoom === 'wedding' && state.cakeCuttingStage !== 'idle') {
      if (input.forward || input.backward || input.left || input.right || input.jump) {
        cakeTimerRef.current = 0;
        lastCakeStageRef.current = 'idle';
        state.finishCakeCutting();
      } else {
        if (state.cakeCuttingStage !== lastCakeStageRef.current) {
          lastCakeStageRef.current = state.cakeCuttingStage;
          cakeTimerRef.current = 0;
        }
        cakeTimerRef.current += delta;

        const pose = getCakeCuttingPose(state.cakeCuttingStage);
        const dx = pose.player[0] - pos.x;
        const dz = pose.player[2] - pos.z;
        const dist = Math.hypot(dx, dz);

        if (state.cakeCuttingStage === 'approaching' && dist > 0.16) {
          const approachSpeed = Math.min(6.4, Math.max(1.5, dist * 3.5));
          const vx = (dx / dist) * approachSpeed;
          const vz = (dz / dist) * approachSpeed;
          rb.setLinvel({ x: vx, y: 0, z: vz }, true);
          targetRotation.current = Math.atan2(dx, dz);
          state.setPlayerRotation(targetRotation.current);
          state.setIsMoving(true);
          state.setCharacterAction('walk');
        } else {
          const cakeLerp = 1 - Math.exp(-12 * delta);
          const nx = THREE.MathUtils.lerp(pos.x, pose.player[0], cakeLerp);
          const nz = THREE.MathUtils.lerp(pos.z, pose.player[2], cakeLerp);
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rb.setTranslation({ x: nx, y: 0, z: nz }, true);
          targetRotation.current = pose.playerFacing;
          state.setPlayerRotation(pose.playerFacing);
          state.setIsMoving(false);
          state.setCharacterAction(pose.playerAction);
        }

        if (characterRef.current) {
          const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
          characterRef.current.rotation.y += diff * Math.min(1, delta * 12);
        }

        const nextStage = advanceCakeCuttingStage(state.cakeCuttingStage, cakeTimerRef.current, dist);
        if (nextStage === 'done') {
          cakeTimerRef.current = 0;
          lastCakeStageRef.current = 'idle';
          state.finishCakeCutting();
        } else if (nextStage !== state.cakeCuttingStage) {
          cakeTimerRef.current = 0;
          lastCakeStageRef.current = nextStage;
          if (nextStage === 'cutting') {
            const cutPose = getCakeCuttingPose('cutting');
            rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rb.setTranslation({ x: cutPose.player[0], y: 0, z: cutPose.player[2] }, true);
            targetRotation.current = cutPose.playerFacing;
            if (characterRef.current) characterRef.current.rotation.y = cutPose.playerFacing;
          }
          state.setCakeCuttingStage(nextStage);
        }
        return;
      }
    } else {
      cakeTimerRef.current = 0;
      lastCakeStageRef.current = 'idle';
    }

    // Wedding Ceremony active altar stages (vows, hug, celebrating) — exits cleanly if user presses WASD
    if (
      state.currentRoom === 'wedding' &&
      (state.weddingStage === 'vows' ||
        state.weddingStage === 'hug' ||
        state.weddingStage === 'celebrating')
    ) {
      if (input.forward || input.backward || input.left || input.right || input.jump) {
        state.setWeddingStage('ready');
      } else {
        const nextPhase =
          state.weddingStage === 'celebrating' ? state.weddingPhase + delta * 1.4 : state.weddingPhase;
        if (state.weddingStage === 'celebrating') {
          state.setWeddingPhase(nextPhase);
        }
        const pose = getWeddingCeremonyPose(state.weddingStage, nextPhase);
        const cerLerp = 1 - Math.exp(-8 * delta);
        const nx = THREE.MathUtils.lerp(pos.x, pose.player[0], cerLerp);
        const nz = THREE.MathUtils.lerp(pos.z, pose.player[2], cerLerp);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setTranslation({ x: nx, y: 0, z: nz }, true);
        targetRotation.current = pose.playerFacing;
        state.setPlayerRotation(pose.playerFacing);
        if (characterRef.current) {
          const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
          characterRef.current.rotation.y += diff * Math.min(1, delta * 10);
        }
        state.setCharacterAction(
          state.weddingStage === 'celebrating'
            ? 'celebrate'
            : state.weddingStage === 'hug'
            ? 'hug'
            : 'vows'
        );
        return;
      }
    }

    // Synchronized Dance Together Mode (exits cleanly if user presses WASD / Jump)
    if (state.isDancing) {
      if (input.forward || input.backward || input.left || input.right || input.jump) {
        state.stopDanceMode();
      } else {
        dancePhaseRef.current += delta * 0.62;
        state.setDancePhase(dancePhaseRef.current);
        const pose = getDanceCouplePositions(
          DANCE_SPOT_POS[0],
          DANCE_SPOT_POS[2],
          dancePhaseRef.current
        );
        const danceLerp = 1 - Math.exp(-8 * delta);
        const nx = THREE.MathUtils.lerp(pos.x, pose.player[0], danceLerp);
        const nz = THREE.MathUtils.lerp(pos.z, pose.player[2], danceLerp);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setTranslation({ x: nx, y: 0, z: nz }, true);
        targetRotation.current = pose.playerFacing;
        state.setPlayerRotation(pose.playerFacing);
        if (characterRef.current) {
          const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
          characterRef.current.rotation.y += diff * Math.min(1, delta * 10);
        }
        state.setCharacterAction('dance');
        return;
      }
    }

    // If sitting, stand up cleanly when user presses movement or jump
    if (state.isSitting) {
      if (input.forward || input.backward || input.left || input.right || input.jump) {
        state.standUp();
      } else if (state.sittingBenchPosition) {
        wasSitting.current = true;
        lastBenchPos.current = state.sittingBenchPosition;
        lastBenchRot.current = state.sittingBenchRotation;
        const rot = state.sittingBenchRotation;
        const aligned = computeSeatAlignment(
          state.sittingBenchPosition,
          rot
        );
        const seatLerp = 1 - Math.exp(-14 * delta);
        const sx = THREE.MathUtils.lerp(pos.x, aligned.player[0], seatLerp);
        const sy = THREE.MathUtils.lerp(pos.y, 0, seatLerp);
        const sz = THREE.MathUtils.lerp(pos.z, aligned.player[2], seatLerp);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setTranslation({ x: sx, y: sy, z: sz }, true);
        targetRotation.current = rot;
        state.setPlayerRotation(rot);
        if (characterRef.current) {
          const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
          characterRef.current.rotation.y += diff * Math.min(1, delta * 12);
        }
        state.setCharacterAction('sit');
        return;
      }
    }

    // Manual WASD / Arrow movement relative to camera angle
    const camAngleX = state.cameraAngleX;
    forwardVec.current.set(-Math.sin(camAngleX), 0, -Math.cos(camAngleX));
    rightVec.current.set(Math.cos(camAngleX), 0, -Math.sin(camAngleX));

    moveDirection.current.set(0, 0, 0);
    if (input.forward) moveDirection.current.add(forwardVec.current);
    if (input.backward) moveDirection.current.sub(forwardVec.current);
    if (input.left) moveDirection.current.sub(rightVec.current);
    if (input.right) moveDirection.current.add(rightVec.current);

    const isMoving = moveDirection.current.lengthSq() > 0.001;
    const speed = input.run ? PLAYER_RUN_SPEED : PLAYER_SPEED;

    if (isMoving) {
      moveDirection.current.normalize();
      targetRotation.current = Math.atan2(moveDirection.current.x, moveDirection.current.z);
    }

    const vel = rb.linvel();
    const lerpFactor = 1 - Math.exp(-16 * delta);
    const newVelX = THREE.MathUtils.lerp(vel.x, moveDirection.current.x * speed, lerpFactor);
    const newVelZ = THREE.MathUtils.lerp(vel.z, moveDirection.current.z * speed, lerpFactor);

    rb.setLinvel({ x: newVelX, y: vel.y, z: newVelZ }, true);

    isGrounded.current = pos.y < 0.35;
    if (input.jump && isGrounded.current) {
      rb.setLinvel({ x: newVelX, y: PLAYER_JUMP_FORCE, z: newVelZ }, true);
    }

    if (characterRef.current) {
      const diff = wrapAngle(targetRotation.current - characterRef.current.rotation.y);
      characterRef.current.rotation.y += diff * Math.min(1, delta * 10);
    }

    state.setPlayerRotation(targetRotation.current);
    state.setIsMoving(isMoving);
    state.setIsRunning(input.run && isMoving);

    if (!isMoving) {
      state.setCharacterAction('idle');
    } else if (input.run) {
      state.setCharacterAction('run');
    } else {
      state.setCharacterAction(state.isHoldingHands ? 'hold_hands_walk' : 'walk');
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[-0.38, 0.01, 12.5]}
      enabledRotations={[false, false, false]}
      linearDamping={0.5}
      mass={1}
      type="dynamic"
      colliders={false}
      lockRotations
    >
      <CapsuleCollider
        args={[0.5, 0.3]}
        position={[0, 0.8, 0]}
        sensor={
          isSitting ||
          isWalkingToSeat ||
          isDancing ||
          isProposalBusy(proposalStage) ||
          weddingStage === 'vows' ||
          weddingStage === 'hug' ||
          weddingStage === 'celebrating' ||
          cakeCuttingStage !== 'idle' ||
          bouquetHandoverStage !== 'idle'
        }
      />
      <group ref={characterRef} rotation={[0, Math.PI, 0]}>
        <Character
          action={characterAction}
          isMale={true}
          isHoldingHands={isHoldingHands}
          weddingMode={currentRoom === 'wedding'}
          groomOutfit={groomOutfit}
          heldBouquet={heldBouquetBy === 'boy' ? createdBouquet : null}
          bouquetReaction={
            bouquetHandoverAnchor?.receiver === 'boy'
              ? getActiveBouquetReaction(bouquetHandoverStage, 'boy')
              : 'none'
          }
        />
      </group>
    </RigidBody>
  );
}
