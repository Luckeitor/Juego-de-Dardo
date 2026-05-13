/**
 * Engine tests — no framework, just `assert` + a tiny runner.
 * Run with: npm test
 */

import { strict as assert } from "node:assert";
import {
  createDart,
  evaluateTurn,
  GameEvent,
  reduce,
  sumDarts,
  wouldBust,
  wouldWin,
} from "../src/engine/gameEngine";

type TestCase = { name: string; fn: () => void };

const tests: TestCase[] = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TS = "2026-05-13T12:00:00.000Z";
const player = (id: string, name = id) => ({ id, name, color: "#000" });

const setup = (players: ReturnType<typeof player>[], target = 300): GameEvent[] => [
  { type: "GAME_CONFIGURED", targetScore: target, players, timestamp: TS },
  { type: "GAME_STARTED", timestamp: TS },
];

const dart = (playerId: string, value: number, multiplier: 1 | 2 | 3): GameEvent => ({
  type: "DART_THROWN",
  playerId,
  value,
  multiplier,
  timestamp: TS,
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Setup / lobby
// ─────────────────────────────────────────────────────────────────────────────

test("GAME_CONFIGURED sets target and players", () => {
  const s = reduce([{ type: "GAME_CONFIGURED", targetScore: 200, players: [player("a"), player("b")], timestamp: TS }]);
  assert.equal(s.targetScore, 200);
  assert.equal(s.players.length, 2);
  assert.equal(s.players[0].score, 0);
  assert.equal(s.status, "LOBBY");
});

test("GAME_STARTED puts status in PLAYING", () => {
  const s = reduce(setup([player("a"), player("b")]));
  assert.equal(s.status, "PLAYING");
  assert.equal(s.currentPlayerIndex, 0);
});

test("PLAYER_ADDED appends a player up to 12", () => {
  const events: GameEvent[] = [
    { type: "GAME_CONFIGURED", targetScore: 300, players: [player("a")], timestamp: TS },
    { type: "PLAYER_ADDED", player: player("b"), timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.players.length, 2);
});

test("PLAYER_REMOVED filters out the player", () => {
  const events: GameEvent[] = [
    { type: "GAME_CONFIGURED", targetScore: 300, players: [player("a"), player("b")], timestamp: TS },
    { type: "PLAYER_REMOVED", playerId: "a", timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.players.length, 1);
  assert.equal(s.players[0].id, "b");
});

test("PLAYERS_SHUFFLED reorders players by new order", () => {
  const events: GameEvent[] = [
    {
      type: "GAME_CONFIGURED",
      targetScore: 300,
      players: [player("a"), player("b"), player("c")],
      timestamp: TS,
    },
    { type: "PLAYERS_SHUFFLED", newOrder: ["c", "a", "b"], timestamp: TS },
  ];
  const s = reduce(events);
  assert.deepEqual(
    s.players.map((p) => p.id),
    ["c", "a", "b"]
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Throwing darts
// ─────────────────────────────────────────────────────────────────────────────

test("createDart computes score correctly", () => {
  assert.deepEqual(createDart(20, 3), { value: 20, multiplier: 3, score: 60 });
  assert.deepEqual(createDart(25, 1), { value: 25, multiplier: 1, score: 25 });
  assert.deepEqual(createDart(50, 1), { value: 50, multiplier: 1, score: 50 });
  assert.deepEqual(createDart(0, 1), { value: 0, multiplier: 1, score: 0 });
});

test("DART_THROWN fills slots in order", () => {
  const events = [...setup([player("a"), player("b")]), dart("a", 20, 1), dart("a", 19, 1)];
  const s = reduce(events);
  assert.equal(s.currentTurnDarts[0]?.score, 20);
  assert.equal(s.currentTurnDarts[1]?.score, 19);
  assert.equal(s.currentTurnDarts[2], null);
});

test("DART_THROWN ignored once 3 slots are full", () => {
  const events = [
    ...setup([player("a"), player("b")]),
    dart("a", 20, 1),
    dart("a", 19, 1),
    dart("a", 18, 1),
    dart("a", 17, 1), // should be ignored
  ];
  const s = reduce(events);
  assert.equal(s.currentTurnDarts.filter((d) => d !== null).length, 3);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Turn confirmation and score accumulation
// ─────────────────────────────────────────────────────────────────────────────

test("TURN_CONFIRMED adds turnSum to player score and advances index", () => {
  const events: GameEvent[] = [
    ...setup([player("a"), player("b")]),
    dart("a", 20, 1),
    dart("a", 19, 1),
    dart("a", 18, 1),
    {
      type: "TURN_CONFIRMED",
      playerId: "a",
      turnSum: 57,
      darts: [createDart(20, 1), createDart(19, 1), createDart(18, 1)],
      timestamp: TS,
    },
  ];
  const s = reduce(events);
  assert.equal(s.players[0].score, 57);
  assert.equal(s.players[0].turnsPlayed, 1);
  assert.equal(s.players[0].highestTurn, 57);
  assert.equal(s.currentPlayerIndex, 1);
  assert.deepEqual(s.currentTurnDarts, [null, null, null]);
});

test("TURN_BUSTED with no prior darts keeps score at 0 (edge case: bust on dart 1)", () => {
  const events: GameEvent[] = [
    ...setup([player("a"), player("b")], 200),
    { type: "TURN_BUSTED", playerId: "a", timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.players[0].score, 0, "no prior darts → score stays 0");
  assert.equal(s.players[0].turnsPlayed, 1);
  assert.equal(s.players[0].history.length, 1);
  assert.equal(s.players[0].history[0].length, 0);
  assert.equal(s.status, "BUST");
  assert.equal(s.lastBustPlayer, "a");
  assert.equal(s.currentPlayerIndex, 1);
});

test("TURN_BUSTED sums prior valid darts to player score (house rule)", () => {
  // Tomás starts turn at 0, throws S20 (20), S10 (10), and the 3rd dart busts.
  // Expected: score = 30 (the two valid darts), only the bust dart is voided.
  const events: GameEvent[] = [
    ...setup([player("a"), player("b")], 300),
    dart("a", 20, 1),
    dart("a", 10, 1),
    { type: "TURN_BUSTED", playerId: "a", timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.players[0].score, 30, "partial darts must be added to score");
  assert.deepEqual(s.players[0].history[0], [20, 10], "history records only the valid darts");
  assert.equal(s.players[0].highestTurn, 30);
  assert.equal(s.status, "BUST");
  assert.equal(s.currentPlayerIndex, 1, "still advances to next player");
});

test("BUST_ACKNOWLEDGED flips status back to PLAYING without changing scores", () => {
  const events: GameEvent[] = [
    ...setup([player("a"), player("b")], 200),
    { type: "TURN_BUSTED", playerId: "a", timestamp: TS },
    { type: "BUST_ACKNOWLEDGED", timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.status, "PLAYING");
  assert.equal(s.lastBustPlayer, undefined);
  assert.equal(s.players[0].score, 0);
});

test("GAME_WON sets status to VICTORY and records winner", () => {
  const events: GameEvent[] = [
    ...setup([player("a"), player("b")], 60),
    dart("a", 20, 3),
    {
      type: "TURN_CONFIRMED",
      playerId: "a",
      turnSum: 60,
      darts: [createDart(20, 3)],
      timestamp: TS,
    },
    { type: "GAME_WON", playerId: "a", finalScore: 60, timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.status, "VICTORY");
  assert.equal(s.winner?.id, "a");
  assert.equal(s.winner?.score, 60);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Pure predicates
// ─────────────────────────────────────────────────────────────────────────────

test("wouldBust true when sum overshoots target", () => {
  assert.equal(wouldBust(180, 30, 200), true);
  assert.equal(wouldBust(180, 20, 200), false, "exact must not bust");
  assert.equal(wouldBust(0, 60, 60), false);
});

test("wouldWin true only on exact target", () => {
  assert.equal(wouldWin(180, 20, 200), true);
  assert.equal(wouldWin(180, 21, 200), false);
  assert.equal(wouldWin(0, 60, 200), false);
});

test("evaluateTurn returns BUST/VICTORY/CONTINUE", () => {
  assert.equal(evaluateTurn(180, [createDart(20, 1), null, null], 200).kind, "VICTORY");
  assert.equal(evaluateTurn(180, [createDart(20, 3), null, null], 200).kind, "BUST");
  assert.equal(evaluateTurn(100, [createDart(20, 1), createDart(19, 1), null], 200).kind, "CONTINUE");
});

test("sumDarts adds dart scores ignoring nulls", () => {
  assert.equal(sumDarts([createDart(20, 1), createDart(19, 1), createDart(18, 1)]), 57);
  assert.equal(sumDarts([createDart(20, 3), null, null]), 60);
  assert.equal(sumDarts([null, null, null]), 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Player rotation across all sizes
// ─────────────────────────────────────────────────────────────────────────────

test("currentPlayerIndex wraps around after last player", () => {
  const players = ["a", "b", "c"].map((id) => player(id));
  const events: GameEvent[] = [
    ...setup(players, 300),
    ...players.flatMap((p) => [
      dart(p.id, 1, 1),
      {
        type: "TURN_CONFIRMED" as const,
        playerId: p.id,
        turnSum: 1,
        darts: [createDart(1, 1)],
        timestamp: TS,
      },
    ]),
  ];
  const s = reduce(events);
  assert.equal(s.currentPlayerIndex, 0, "should wrap back to player 0");
  assert.equal(s.round, 2, "round should increment when wrapping");
});

test("12 players rotate in order with no skips", () => {
  const players = Array.from({ length: 12 }, (_, i) => player(`p${i}`));
  const events: GameEvent[] = [
    ...setup(players, 1000),
    ...players.slice(0, 11).flatMap((p) => [
      dart(p.id, 1, 1),
      {
        type: "TURN_CONFIRMED" as const,
        playerId: p.id,
        turnSum: 1,
        darts: [createDart(1, 1)],
        timestamp: TS,
      },
    ]),
  ];
  const s = reduce(events);
  assert.equal(s.currentPlayerIndex, 11, "after 11 turns it should be p11's turn");
  assert.equal(s.round, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Undo via log-pop
// ─────────────────────────────────────────────────────────────────────────────

test("popping the last DART_THROWN reverts to previous state exactly", () => {
  const before: GameEvent[] = [
    ...setup([player("a"), player("b")]),
    dart("a", 20, 1),
    dart("a", 19, 1),
  ];
  const after: GameEvent[] = [...before, dart("a", 18, 1)];

  const sBefore = reduce(before);
  const sAfter = reduce(after);
  assert.equal(sAfter.currentTurnDarts[2]?.score, 18);

  // Pop the last event → must equal sBefore exactly.
  const sPopped = reduce(after.slice(0, -1));
  assert.deepEqual(sPopped, sBefore);
});

test("DART_UNDONE removes the last filled dart", () => {
  const events: GameEvent[] = [
    ...setup([player("a"), player("b")]),
    dart("a", 20, 1),
    dart("a", 19, 1),
    { type: "DART_UNDONE", timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.currentTurnDarts[0]?.score, 20);
  assert.equal(s.currentTurnDarts[1], null);
  assert.equal(s.currentTurnDarts[2], null);
});

test("TARGET_CHANGED updates target without affecting players", () => {
  const events: GameEvent[] = [
    { type: "GAME_CONFIGURED", targetScore: 300, players: [player("a")], timestamp: TS },
    { type: "TARGET_CHANGED", targetScore: 500, timestamp: TS },
  ];
  const s = reduce(events);
  assert.equal(s.targetScore, 500);
  assert.equal(s.players.length, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: { name: string; err: unknown }[] = [];

for (const t of tests) {
  try {
    t.fn();
    passed++;
    console.log(`  ✓ ${t.name}`);
  } catch (err) {
    failed++;
    failures.push({ name: t.name, err });
    console.log(`  ✗ ${t.name}`);
  }
}

console.log();
console.log(`${passed} passed, ${failed} failed (total ${tests.length})`);

if (failed > 0) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`\n  ✗ ${f.name}`);
    console.log(`    ${f.err instanceof Error ? f.err.message : String(f.err)}`);
  }
  process.exit(1);
}

process.exit(0);
