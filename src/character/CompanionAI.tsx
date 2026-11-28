import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Character from './Character';
import { useGameStore } from '../store/gameStore';
import {
  DANCE_SPOT_POS,
  computeSeatAlignment,
  getDanceCouplePositions,
  getWeddingCeremonyPose,
} from '../utils/museumLayout';
import { getCakeCuttingPose } from '../utils/weddingCake';
import { getActiveBouquetReaction, getBouquetHandoverActions } from '../utils/bouquet';

function wrapAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export default function CompanionAI() {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(0.38, 0, 12.5));
  const targetPos = useRef(new THREE.Vector3(0.38, 0, 12.5));
  const currentRotation = useRef(Math.PI);

  const companionAction = useGameStore((s) => s.companionAction);
  const isHoldingHands = useGameStore((s) => s.isHoldingHands);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const brideOutfit = useGameStore((s) => s.brideOutfit);
  const createdBouquet = useGameStore((s) => s.createdBouquet);
  const heldBouquetBy = useGameStore((s) => s.heldBouquetBy);
  const bouquetHandoverStage = useGameStore((s) => s.bouquetHandoverStage);
  const bouquetHandoverAnchor = useGameStore((s) => s.bouquetHandoverAnchor);

  useFrame((_, rawDelta) => {
    if (!groupRef.current) return;
    const delta = Math.max(0, Math.min(rawDelta, 0.08));
    const state = useGameStore.getState();

    const pPos = state.playerPosition;
    const pRot = state.playerRotation;

    // 1. Sitting together on bench or cinema loveseat
    if (state.isSitting && state.sittingBenchPosition) {
      const rot = state.sittingBenchRotation;
      const aligned = computeSeatAlignment(state.sittingBenchPosition, rot);
      targetPos.current.set(aligned.partner[0], 0, aligned.partner[2]);
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-10 * delta));
      const diff = wrapAngle(rot - currentRotation.current);
      currentRotation.current += diff * (1 - Math.exp(-10 * delta));
      state.setCompanionAction('sit');
    }
    // 2. Wedding Cake Cutting & Mutual Feeding sequence
    else if (state.currentRoom === 'wedding' && state.cakeCuttingStage !== 'idle') {
      const pose = getCakeCuttingPose(state.cakeCuttingStage);
      targetPos.current.set(pose.partner[0], 0, pose.partner[2]);
      const dist = currentPos.current.distanceTo(targetPos.current);
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-8.5 * delta));
      const desiredFacing =
        state.cakeCuttingStage === 'approaching' && dist > 0.14
          ? Math.atan2(targetPos.current.x - currentPos.current.x, targetPos.current.z - currentPos.current.z)
          : pose.partnerFacing;
      const diff = wrapAngle(desiredFacing - currentRotation.current);
      currentRotation.current += diff * (1 - Math.exp(-10 * delta));
      state.setCompanionAction(
        state.cakeCuttingStage === 'approaching' && dist > 0.14 ? 'walk' : pose.partnerAction
      );
    }
    // 2b. Wedding Ceremony Altar Poses (vows, hug, celebrating)
    else if (
      state.currentRoom === 'wedding' &&
      (state.weddingStage === 'vows' ||
        state.weddingStage === 'hug' ||
        state.weddingStage === 'celebrating')
    ) {
      const pose = getWeddingCeremonyPose(state.weddingStage, state.weddingPhase);
      targetPos.current.set(pose.partner[0], 0, pose.partner[2]);
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-8 * delta));
      const diff = wrapAngle(pose.partnerFacing - currentRotation.current);
      currentRotation.current += diff * (1 - Math.exp(-10 * delta));
      state.setCompanionAction(
        state.weddingStage === 'celebrating'
          ? 'celebrate'
          : state.weddingStage === 'hug'
          ? 'hug'
          : 'vows'
      );
    }
    // 3. Synchronized Ballroom Dance Together at Dance Pavilion
    else if (state.isDancing) {
      const pose = getDanceCouplePositions(DANCE_SPOT_POS[0], DANCE_SPOT_POS[2], state.dancePhase);
      targetPos.current.set(pose.partner[0], 0, pose.partner[2]);
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-8 * delta));
      const diff = wrapAngle(pose.partnerFacing - currentRotation.current);
      currentRotation.current += diff * (1 - Math.exp(-10 * delta));
      state.setCompanionAction('dance');
    }
    // 3b. Active Proposal Sequence — partner moves smoothly to anchor, reacts, accepts, embraces, celebrates
    else if (state.proposalStage !== 'idle' && state.proposalAnchor) {
      const anchor = state.proposalAnchor;
      targetPos.current.set(anchor.partner[0], 0, anchor.partner[2]);
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-9 * delta));
      const diff = wrapAngle(anchor.partnerFacing - currentRotation.current);
      currentRotation.current += diff * (1 - Math.exp(-12 * delta));

      const distToAnchor = currentPos.current.distanceTo(targetPos.current);
      if (state.proposalStage === 'approaching') {
        state.setCompanionAction(distToAnchor > 0.08 ? 'walk' : 'idle');
      } else if (
        state.proposalStage === 'kneeling' ||
        state.proposalStage === 'awaiting_answer'
      ) {
        state.setCompanionAction('propose_surprised');
      } else if (state.proposalStage === 'accepted_standing') {
        state.setCompanionAction('propose_accept');
      } else if (state.proposalStage === 'embracing') {
        state.setCompanionAction('propose_embrace');
      } else if (state.proposalStage === 'celebrating') {
        state.setCompanionAction('celebrate');
      }
    }
    // 3c. Active Bouquet Handover Sequence — Girl approaches/receives/reacts smoothly
    else if (state.bouquetHandoverStage !== 'idle' && state.bouquetHandoverAnchor) {
      const seqDelta = Math.max(0, Math.min(rawDelta, 0.5));
      const anchor = state.bouquetHandoverAnchor;
      targetPos.current.set(anchor.girlPos[0], 0, anchor.girlPos[2]);
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-9 * seqDelta));
      const diff = wrapAngle(anchor.girlFacing - currentRotation.current);
      currentRotation.current += diff * (1 - Math.exp(-12 * seqDelta));

      const girlDist = currentPos.current.distanceTo(targetPos.current);
      const actions = getBouquetHandoverActions(state.bouquetHandoverStage, anchor.giver, girlDist);
      state.setCompanionAction(actions.girlAction);
    }
    // 4. Active Hug or Kiss sequence — face player at calibrated non-clipping spacing
    else if (state.activeCoupleSequence === 'hug' || state.activeCoupleSequence === 'kiss') {
      const spacing = state.activeCoupleSequence === 'hug' ? 0.5 : 0.43;
      targetPos.current.set(
        pPos.x + Math.sin(pRot) * spacing,
        0,
        pPos.z + Math.cos(pRot) * spacing
      );
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-9 * delta));
      const facePlayer = Math.atan2(pPos.x - currentPos.current.x, pPos.z - currentPos.current.z);
      const diff = wrapAngle(facePlayer - currentRotation.current);
      currentRotation.current += diff * (1 - Math.exp(-10 * delta));
      state.setCompanionAction(state.activeCoupleSequence);
    }
    // 3. Hand-holding / walking together side-by-side
    else if (state.isHoldingHands || state.isWalkingTogether) {
      // Side-by-side offset when holding hands (0.72m apart so hands clasp cleanly without shoulder clipping)
      const sideOffset = state.isHoldingHands ? 0.72 : 1.05;
      const backOffset = state.isHoldingHands ? 0.02 : 0.85;

      // Right-on-screen vector for viewer behind character facing pRot is (-cos(pRot), 0, sin(pRot))
      const rx = -Math.cos(pRot);
      const rz = Math.sin(pRot);
      const fx = Math.sin(pRot);
      const fz = Math.cos(pRot);

      targetPos.current.set(
        pPos.x + rx * sideOffset - fx * backOffset,
        0,
        pPos.z + rz * sideOffset - fz * backOffset
      );

      const dist = currentPos.current.distanceTo(targetPos.current);
      const followRate = state.isHoldingHands ? 10 : 5.5;
      currentPos.current.lerp(targetPos.current, 1 - Math.exp(-followRate * delta));

      if (dist > 0.14 || state.isMoving) {
        const desiredAction = state.isRunning
          ? 'run'
          : state.isHoldingHands
          ? 'hold_hands_walk'
          : 'walk';
        state.setCompanionAction(desiredAction);
        const diff = wrapAngle(pRot - currentRotation.current);
        currentRotation.current += diff * (1 - Math.exp(-9 * delta));
      } else {
        state.setCompanionAction('idle');
        const diff = wrapAngle(pRot - currentRotation.current);
        currentRotation.current += diff * (1 - Math.exp(-6 * delta));
      }
    }
    // 4. Independent gentle follow at comfortable distance
    else {
      const dx = pPos.x - currentPos.current.x;
      const dz = pPos.z - currentPos.current.z;
      const distToPlayer = Math.hypot(dx, dz);

      if (distToPlayer > 2.2) {
        const angle = Math.atan2(dx, dz);
        targetPos.current.set(
          pPos.x - Math.sin(angle) * 1.6,
          0,
          pPos.z - Math.cos(angle) * 1.6
        );
        currentPos.current.lerp(targetPos.current, 1 - Math.exp(-4.5 * delta));
        state.setCompanionAction(distToPlayer > 4 ? 'run' : 'walk');
        const diff = wrapAngle(angle - currentRotation.current);
        currentRotation.current += diff * (1 - Math.exp(-8 * delta));
      } else {
        state.setCompanionAction('idle');
        if (distToPlayer > 0.3) {
          const face = Math.atan2(dx, dz);
          const diff = wrapAngle(face - currentRotation.current);
          currentRotation.current += diff * (1 - Math.exp(-4 * delta));
        }
      }
    }

    state.setPartnerPosition(currentPos.current);
    state.setPartnerRotation(currentRotation.current);

    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.y = currentRotation.current;
  });

  return (
    <group ref={groupRef} position={[0.38, 0, 12.5]} rotation={[0, Math.PI, 0]}>
      <Character
        isMale={false}
        action={companionAction}
        isHoldingHands={isHoldingHands}
        weddingMode={currentRoom === 'wedding'}
        brideOutfit={brideOutfit}
        heldBouquet={heldBouquetBy === 'girl' ? createdBouquet : null}
        bouquetReaction={
          bouquetHandoverAnchor?.receiver === 'girl'
            ? getActiveBouquetReaction(bouquetHandoverStage, 'girl')
            : 'none'
        }
      />
    </group>
  );
}
