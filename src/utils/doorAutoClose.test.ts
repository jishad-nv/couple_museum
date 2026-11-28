import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_DOOR_IDS,
  DOOR_SPECS,
  createInitialDoorTrackers,
  stepAllDoors,
  type DoorStepContext,
} from './doorAutoClose';
import {
  ENTRANCE_ARRIVAL_POS,
  GARDEN_ARRIVAL_POS,
  PRIVATE_CHAMBER_ARRIVAL_POS,
  PRIVATE_CHAMBER_RETURN_POS,
  SECRET_ARRIVAL_POS,
  SECRET_RETURN_POS,
  THEATRE_ARRIVAL_POS,
  WEDDING_ARRIVAL_POS,
  WEDDING_RETURN_POS,
  detectMuseumRoom,
} from './museumLayout';

function advanceFrames(
  trackers: ReturnType<typeof createInitialDoorTrackers>,
  ctx: DoorStepContext,
  frames = 8,
  dt = 0.05
) {
  let state = trackers;
  const closed = new Set<string>();
  for (let i = 0; i < frames; i++) {
    const res = stepAllDoors(state, ctx, dt);
    state = res.nextTrackers;
    for (const d of res.doorsToClose) {
      closed.add(d);
      ctx.doorOpenMap[d] = false;
    }
  }
  return { trackers: state, closed };
}

function makeCtx(overrides: Partial<DoorStepContext> = {}): DoorStepContext {
  return {
    doorOpenMap: {
      main: false,
      theatre: false,
      garden: false,
      secret: false,
      private: false,
      wedding: false,
    },
    playerPos: { x: 0, z: 14 },
    partnerPos: { x: 0.4, z: 13.5 },
    currentRoom: 'exterior',
    scriptedWalkTarget: null,
    interactionBusy: false,
    ...overrides,
  };
}

test('opening any door from outside keeps it open while walking in and while inside', () => {
  const rooms = [
    {
      door: 'main' as const,
      outside: { x: 0, z: 10 },
      outsideRoom: 'exterior' as const,
      inside: { x: ENTRANCE_ARRIVAL_POS[0], z: ENTRANCE_ARRIVAL_POS[2] },
      target: ENTRANCE_ARRIVAL_POS,
    },
    {
      door: 'theatre' as const,
      outside: { x: 0, z: -35.5 },
      outsideRoom: 'gallery' as const,
      inside: { x: THEATRE_ARRIVAL_POS[0], z: THEATRE_ARRIVAL_POS[2] },
      target: THEATRE_ARRIVAL_POS,
    },
    {
      door: 'garden' as const,
      outside: { x: 9.8, z: -31.3 },
      outsideRoom: 'gallery' as const,
      inside: { x: GARDEN_ARRIVAL_POS[0], z: GARDEN_ARRIVAL_POS[2] },
      target: GARDEN_ARRIVAL_POS,
    },
    {
      door: 'secret' as const,
      outside: { x: -13.8, z: -21.5 },
      outsideRoom: 'gallery' as const,
      inside: { x: SECRET_ARRIVAL_POS[0], z: SECRET_ARRIVAL_POS[2] },
      target: SECRET_ARRIVAL_POS,
    },
    {
      door: 'private' as const,
      outside: { x: -32.4, z: -21.5 },
      outsideRoom: 'secret' as const,
      inside: { x: PRIVATE_CHAMBER_ARRIVAL_POS[0], z: PRIVATE_CHAMBER_ARRIVAL_POS[2] },
      target: PRIVATE_CHAMBER_ARRIVAL_POS,
    },
    {
      door: 'wedding' as const,
      outside: { x: -9.6, z: -31.1 },
      outsideRoom: 'gallery' as const,
      inside: { x: WEDDING_ARRIVAL_POS[0], z: WEDDING_ARRIVAL_POS[2] },
      target: WEDDING_ARRIVAL_POS,
    },
  ];

  for (const r of rooms) {
    let trackers = createInitialDoorTrackers();
    const ctx = makeCtx({
      playerPos: r.outside,
      partnerPos: r.outside,
      currentRoom: r.outsideRoom,
      scriptedWalkTarget: r.target,
    });
    ctx.doorOpenMap[r.door] = true;

    // While walking from outside toward doorway
    const step1 = advanceFrames(trackers, ctx, 6);
    trackers = step1.trackers;
    assert.equal(step1.closed.has(r.door), false, `${r.door} must stay open while entering`);

    // Standing inside doorway threshold
    ctx.playerPos = { x: DOOR_SPECS[r.door].position[0], z: DOOR_SPECS[r.door].position[2] };
    ctx.currentRoom = detectMuseumRoom(ctx.playerPos.x, ctx.playerPos.z);
    const stepDoorway = advanceFrames(trackers, ctx, 8);
    trackers = stepDoorway.trackers;
    assert.equal(stepDoorway.closed.has(r.door), false, `${r.door} must stay open in doorway`);

    // Arrived inside room
    ctx.playerPos = r.inside;
    ctx.partnerPos = r.inside;
    ctx.currentRoom = detectMuseumRoom(r.inside.x, r.inside.z);
    ctx.scriptedWalkTarget = null;
    const stepInside = advanceFrames(trackers, ctx, 15);
    assert.equal(stepInside.closed.has(r.door), false, `${r.door} must stay open while inside`);
    assert.equal(stepInside.trackers[r.door].phase, 'inside_open');
  }
});

test('doors stay open in far corners of Memory Garden and while standing near doorway', () => {
  let trackers = createInitialDoorTrackers();
  const ctx = makeCtx({
    playerPos: { x: GARDEN_ARRIVAL_POS[0], z: GARDEN_ARRIVAL_POS[2] },
    partnerPos: { x: GARDEN_ARRIVAL_POS[0], z: GARDEN_ARRIVAL_POS[2] },
    currentRoom: 'garden',
  });
  ctx.doorOpenMap.garden = true;

  // Walk into south-west flower bed of Memory Garden (which sits east of Gallery curve)
  ctx.playerPos = { x: 17.4, z: -25.0 };
  ctx.partnerPos = { x: 17.6, z: -25.5 };
  ctx.currentRoom = detectMuseumRoom(ctx.playerPos.x, ctx.playerPos.z);
  assert.equal(ctx.currentRoom, 'garden');

  const res = advanceFrames(trackers, ctx, 20);
  trackers = res.trackers;
  assert.equal(res.closed.has('garden'), false);
  assert.equal(ctx.doorOpenMap.garden, true);

  // Stand right outside doorway threshold without fully clearing outward leaf sweep
  ctx.playerPos = { x: 11.4, z: -32.9 }; // ~0.85m outside garden door
  ctx.partnerPos = { x: 11.8, z: -33.2 };
  ctx.currentRoom = detectMuseumRoom(ctx.playerPos.x, ctx.playerPos.z);
  const nearRes = advanceFrames(trackers, ctx, 20);
  assert.equal(nearRes.closed.has('garden'), false);
  assert.equal(ctx.doorOpenMap.garden, true);
});

test('every room door automatically closes only after player and companion fully exit outside', () => {
  const exits = [
    {
      door: 'main' as const,
      inside: { x: 0, z: 1.5 },
      doorwayEdge: { x: 0, z: 4.8 },
      outsideClear: { x: 0, z: 6.2 },
    },
    {
      door: 'theatre' as const,
      inside: { x: 0, z: -41.5 },
      doorwayEdge: { x: 0, z: -37.6 },
      outsideClear: { x: 0, z: -36.5 },
    },
    {
      door: 'garden' as const,
      inside: { x: 15.5, z: -34.8 },
      doorwayEdge: { x: 11.1, z: -32.6 },
      outsideClear: { x: 9.8, z: -31.3 },
    },
    {
      door: 'secret' as const,
      inside: { x: -21.4, z: -21.5 },
      doorwayEdge: { x: -15.2, z: -21.5 }, // Still within 2.48m outward leaf sweep!
      outsideClear: { x: SECRET_RETURN_POS[0], z: SECRET_RETURN_POS[2] },
    },
    {
      door: 'private' as const,
      inside: { x: -39.0, z: -21.5 },
      doorwayEdge: { x: -34.7, z: -21.5 },
      outsideClear: { x: PRIVATE_CHAMBER_RETURN_POS[0], z: PRIVATE_CHAMBER_RETURN_POS[2] },
    },
    {
      door: 'wedding' as const,
      inside: { x: -26.5, z: -38.8 },
      doorwayEdge: { x: -11.1, z: -32.6 },
      outsideClear: { x: WEDDING_RETURN_POS[0], z: WEDDING_RETURN_POS[2] },
    },
  ];

  for (const ex of exits) {
    let trackers = createInitialDoorTrackers();
    const ctx = makeCtx({
      playerPos: ex.inside,
      partnerPos: ex.inside,
      currentRoom: detectMuseumRoom(ex.inside.x, ex.inside.z),
    });
    ctx.doorOpenMap[ex.door] = true;

    trackers = advanceFrames(trackers, ctx, 5).trackers;
    assert.equal(ctx.doorOpenMap[ex.door], true);

    // Standing partially outside doorway must NOT close door prematurely
    ctx.playerPos = ex.doorwayEdge;
    ctx.partnerPos = ex.inside;
    ctx.currentRoom = detectMuseumRoom(ex.doorwayEdge.x, ex.doorwayEdge.z);
    trackers = advanceFrames(trackers, ctx, 12).trackers;
    assert.equal(ctx.doorOpenMap[ex.door], true, `${ex.door} closed too early at doorway edge`);

    // Player just past clearance while companion still stands in doorway -> door waits for companion
    const spec = DOOR_SPECS[ex.door];
    const [nx, nz] = spec.outwardNormal;
    const nearOutsideDist = spec.outsideClearance + 0.35;
    ctx.playerPos = {
      x: spec.position[0] + nx * nearOutsideDist,
      z: spec.position[2] + nz * nearOutsideDist,
    };
    ctx.partnerPos = {
      x: spec.position[0],
      z: spec.position[2],
    };
    ctx.currentRoom = detectMuseumRoom(ctx.playerPos.x, ctx.playerPos.z);
    trackers = advanceFrames(trackers, ctx, 6).trackers;
    assert.equal(ctx.doorOpenMap[ex.door], true, `${ex.door} should wait while companion is in doorway`);

    // Companion clears to return point -> door auto-closes cleanly
    ctx.playerPos = ex.outsideClear;
    ctx.partnerPos = ex.outsideClear;
    ctx.currentRoom = detectMuseumRoom(ex.outsideClear.x, ex.outsideClear.z);
    const done = advanceFrames(trackers, ctx, 8);
    assert.equal(done.closed.has(ex.door), true, `${ex.door} failed to auto-close after full exit`);
    assert.equal(ctx.doorOpenMap[ex.door], false);
    assert.equal(done.trackers[ex.door].phase, 'closed');
  }
});

test('nested secret rooms keep outer secret door open while inside private chamber and close each door in sequence', () => {
  let trackers = createInitialDoorTrackers();
  const ctx = makeCtx({
    playerPos: { x: -44.8, z: -21.5 },
    partnerPos: { x: -44.2, z: -21.5 },
    currentRoom: 'private_chamber',
  });
  ctx.doorOpenMap.secret = true;
  ctx.doorOpenMap.private = true;

  // Both doors remain open inside private chamber
  let res = advanceFrames(trackers, ctx, 10);
  trackers = res.trackers;
  assert.equal(ctx.doorOpenMap.private, true);
  assert.equal(ctx.doorOpenMap.secret, true);

  // Exit private chamber into Pre-Secret Room -> private door closes, secret door stays open!
  ctx.playerPos = { x: PRIVATE_CHAMBER_RETURN_POS[0], z: PRIVATE_CHAMBER_RETURN_POS[2] };
  ctx.partnerPos = { x: PRIVATE_CHAMBER_RETURN_POS[0], z: PRIVATE_CHAMBER_RETURN_POS[2] };
  ctx.currentRoom = 'secret';
  res = advanceFrames(trackers, ctx, 10);
  trackers = res.trackers;
  assert.equal(ctx.doorOpenMap.private, false);
  assert.equal(ctx.doorOpenMap.secret, true);

  // Exit Pre-Secret Room into Gallery -> secret door closes too!
  ctx.playerPos = { x: SECRET_RETURN_POS[0], z: SECRET_RETURN_POS[2] };
  ctx.partnerPos = { x: SECRET_RETURN_POS[0], z: SECRET_RETURN_POS[2] };
  ctx.currentRoom = 'gallery';
  res = advanceFrames(trackers, ctx, 10);
  assert.equal(ctx.doorOpenMap.secret, false);
});

test('moving back and forth across doorway resets dwell and prevents repeated close triggers or glitches', () => {
  let trackers = createInitialDoorTrackers();
  const ctx = makeCtx({
    playerPos: { x: 0, z: -41.5 },
    partnerPos: { x: 0, z: -41.5 },
    currentRoom: 'cinema',
  });
  ctx.doorOpenMap.theatre = true;
  trackers = advanceFrames(trackers, ctx, 4).trackers;

  // Oscillate across doorway threshold without staying outside clear zone
  for (let i = 0; i < 6; i++) {
    ctx.playerPos = { x: 0, z: -36.8 }; // just past clearance for 1 frame (0.05s < 0.14s dwell)
    ctx.partnerPos = { x: 0, z: -36.8 };
    ctx.currentRoom = 'gallery';
    trackers = stepAllDoors(trackers, ctx, 0.05).nextTrackers;

    ctx.playerPos = { x: 0, z: -38.7 }; // step back into doorway
    ctx.partnerPos = { x: 0, z: -39.0 };
    ctx.currentRoom = 'cinema';
    const back = stepAllDoors(trackers, ctx, 0.05);
    trackers = back.nextTrackers;
    assert.equal(back.doorsToClose.length, 0);
    assert.equal(trackers.theatre.exitDwellTime, 0);
    assert.equal(ctx.doorOpenMap.theatre, true);
  }

  // Once settled outside, closes exactly once
  ctx.playerPos = { x: 0, z: -36.0 };
  ctx.partnerPos = { x: 0, z: -36.0 };
  ctx.currentRoom = 'gallery';
  const res = advanceFrames(trackers, ctx, 6);
  assert.deepEqual([...res.closed], ['theatre']);
  assert.equal(ctx.doorOpenMap.theatre, false);

  // Subsequent frames while closed never re-trigger close
  const extra = stepAllDoors(res.trackers, ctx, 0.05);
  assert.equal(extra.doorsToClose.length, 0);
  for (const id of ALL_DOOR_IDS) {
    assert.equal(extra.nextTrackers[id].phase, 'closed');
  }
});

test('interactionBusy (e.g. open modal) blocks premature closing', () => {
  let trackers = createInitialDoorTrackers();
  const ctx = makeCtx({
    playerPos: { x: 0, z: -41.5 },
    partnerPos: { x: 0, z: -41.5 },
    currentRoom: 'cinema',
  });
  ctx.doorOpenMap.theatre = true;
  trackers = advanceFrames(trackers, ctx, 4).trackers;

  ctx.playerPos = { x: 0, z: -36.0 };
  ctx.partnerPos = { x: 0, z: -36.0 };
  ctx.currentRoom = 'gallery';
  ctx.interactionBusy = true;

  const blocked = advanceFrames(trackers, ctx, 10);
  assert.equal(blocked.closed.size, 0);
  assert.equal(ctx.doorOpenMap.theatre, true);
});
