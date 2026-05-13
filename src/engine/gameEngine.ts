/**
 * Pure game engine for Count-Up darts.
 *
 * The state of the game is derived 100% from an ordered list of events.
 * Undo = pop the last event and recompute. No mutation, no side effects.
 */

import { GameStatus, Player, NEON_COLORS } from "../types";

export type DartMultiplier = 1 | 2 | 3;

export interface DartThrow {
  value: number;
  multiplier: DartMultiplier;
  score: number;
}

export type GameEvent =
  | {
      type: "GAME_CONFIGURED";
      targetScore: number;
      players: { id: string; name: string; color: string }[];
      timestamp: string;
    }
  | { type: "PLAYER_ADDED"; player: { id: string; name: string; color: string }; timestamp: string }
  | { type: "PLAYER_REMOVED"; playerId: string; timestamp: string }
  | { type: "PLAYER_RENAMED"; playerId: string; name: string; timestamp: string }
  | { type: "PLAYERS_SHUFFLED"; newOrder: string[]; timestamp: string }
  | { type: "TARGET_CHANGED"; targetScore: number; timestamp: string }
  | { type: "GAME_STARTED"; timestamp: string }
  | { type: "DART_THROWN"; playerId: string; value: number; multiplier: DartMultiplier; timestamp: string }
  | { type: "DART_UNDONE"; timestamp: string }
  | { type: "TURN_CONFIRMED"; playerId: string; turnSum: number; darts: DartThrow[]; timestamp: string }
  | { type: "TURN_BUSTED"; playerId: string; timestamp: string }
  | { type: "BUST_ACKNOWLEDGED"; timestamp: string }
  | { type: "GAME_WON"; playerId: string; finalScore: number; timestamp: string }
  | { type: "GAME_RESET"; timestamp: string };

export interface DerivedState {
  status: GameStatus;
  targetScore: number;
  players: Player[];
  currentPlayerIndex: number;
  currentTurnDarts: (DartThrow | null)[];
  round: number;
  winner?: Player;
  lastBustPlayer?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constructors
// ─────────────────────────────────────────────────────────────────────────────

export const now = (): string => new Date().toISOString();

export const createDart = (value: number, multiplier: DartMultiplier): DartThrow => ({
  value,
  multiplier,
  score: value * multiplier,
});

export const createPlayer = (id: string, name: string, color: string): Player => ({
  id,
  name,
  color,
  score: 0,
  history: [],
  turnsPlayed: 0,
  highestTurn: 0,
});

export const initialEvents = (): GameEvent[] => {
  const defaults = [
    { id: "p1", name: "Tomás" },
    { id: "p2", name: "Ana" },
    { id: "p3", name: "Luis" },
    { id: "p4", name: "Carla" },
  ];
  return [
    {
      type: "GAME_CONFIGURED",
      targetScore: 300,
      players: defaults.map((p, i) => ({ id: p.id, name: p.name, color: NEON_COLORS[i] })),
      timestamp: now(),
    },
  ];
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure predicates (used by UI for warnings + by reducer for transitions)
// ─────────────────────────────────────────────────────────────────────────────

export const sumDarts = (darts: (DartThrow | null)[]): number =>
  darts.reduce((acc, d) => acc + (d ? d.score : 0), 0);

export const wouldBust = (currentScore: number, addToScore: number, target: number): boolean =>
  currentScore + addToScore > target;

export const wouldWin = (currentScore: number, addToScore: number, target: number): boolean =>
  currentScore + addToScore === target;

// ─────────────────────────────────────────────────────────────────────────────
// Reducer: events → derived state
// Re-computes from zero every call. Cheap because the event log rarely exceeds
// a few thousand entries even for long sessions.
// ─────────────────────────────────────────────────────────────────────────────

export function reduce(events: GameEvent[]): DerivedState {
  let state: DerivedState = {
    status: "LOBBY",
    targetScore: 300,
    players: [],
    currentPlayerIndex: 0,
    currentTurnDarts: [null, null, null],
    round: 1,
  };

  for (const ev of events) {
    state = step(state, ev);
  }

  return state;
}

function step(state: DerivedState, ev: GameEvent): DerivedState {
  switch (ev.type) {
    case "GAME_CONFIGURED":
      return {
        ...state,
        targetScore: ev.targetScore,
        players: ev.players.map((p) => createPlayer(p.id, p.name, p.color)),
      };

    case "TARGET_CHANGED":
      return { ...state, targetScore: ev.targetScore };

    case "PLAYER_ADDED":
      return {
        ...state,
        players: [...state.players, createPlayer(ev.player.id, ev.player.name, ev.player.color)],
      };

    case "PLAYER_REMOVED":
      return { ...state, players: state.players.filter((p) => p.id !== ev.playerId) };

    case "PLAYER_RENAMED":
      return {
        ...state,
        players: state.players.map((p) => (p.id === ev.playerId ? { ...p, name: ev.name } : p)),
      };

    case "PLAYERS_SHUFFLED": {
      const order = new Map(ev.newOrder.map((id, i) => [id, i]));
      const sorted = [...state.players].sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
      );
      return { ...state, players: sorted };
    }

    case "GAME_STARTED":
      return {
        ...state,
        status: "PLAYING",
        currentPlayerIndex: 0,
        currentTurnDarts: [null, null, null],
        round: 1,
        players: state.players.map((p) => ({ ...p, score: 0, history: [], turnsPlayed: 0, highestTurn: 0 })),
      };

    case "DART_THROWN": {
      const darts = [...state.currentTurnDarts];
      const empty = darts.indexOf(null);
      if (empty === -1) return state;
      darts[empty] = createDart(ev.value, ev.multiplier);
      return { ...state, currentTurnDarts: darts };
    }

    case "DART_UNDONE": {
      const darts = [...state.currentTurnDarts];
      for (let i = darts.length - 1; i >= 0; i--) {
        if (darts[i] !== null) {
          darts[i] = null;
          return { ...state, currentTurnDarts: darts };
        }
      }
      return state;
    }

    case "TURN_CONFIRMED": {
      const updatedPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        return {
          ...p,
          score: p.score + ev.turnSum,
          turnsPlayed: p.turnsPlayed + 1,
          highestTurn: Math.max(p.highestTurn, ev.turnSum),
          history: [...p.history, ev.darts.map((d) => d.score)],
        };
      });
      const nextIndex = (state.currentPlayerIndex + 1) % updatedPlayers.length;
      const nextRound = nextIndex === 0 ? state.round + 1 : state.round;
      return {
        ...state,
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        currentTurnDarts: [null, null, null],
        round: nextRound,
      };
    }

    case "TURN_BUSTED": {
      // House rule: only the bust dart is voided. The valid darts thrown earlier
      // in the same turn still count. The store omits the bust DART_THROWN event,
      // so currentTurnDarts contains only the valid darts when we get here.
      const partial = sumDarts(state.currentTurnDarts);
      const filledScores = state.currentTurnDarts
        .filter((d): d is DartThrow => d !== null)
        .map((d) => d.score);

      const updatedPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        return {
          ...p,
          score: p.score + partial,
          turnsPlayed: p.turnsPlayed + 1,
          highestTurn: Math.max(p.highestTurn, partial),
          history: [...p.history, filledScores],
        };
      });
      const nextIndex = (state.currentPlayerIndex + 1) % updatedPlayers.length;
      const nextRound = nextIndex === 0 ? state.round + 1 : state.round;
      const bustedName = state.players[state.currentPlayerIndex]?.name;
      return {
        ...state,
        status: "BUST",
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        currentTurnDarts: [null, null, null],
        round: nextRound,
        lastBustPlayer: bustedName,
      };
    }

    case "BUST_ACKNOWLEDGED":
      return { ...state, status: "PLAYING", lastBustPlayer: undefined };

    case "GAME_WON": {
      // Look up the winner by id from the event — currentPlayerIndex may have
      // already advanced if TURN_CONFIRMED was applied first.
      const winnerBase = state.players.find((p) => p.id === ev.playerId);
      const winner = winnerBase ? { ...winnerBase, score: ev.finalScore } : undefined;
      return { ...state, status: "VICTORY", winner };
    }

    case "GAME_RESET":
      return {
        ...state,
        status: "LOBBY",
        currentPlayerIndex: 0,
        currentTurnDarts: [null, null, null],
        round: 1,
        winner: undefined,
        lastBustPlayer: undefined,
        players: state.players.map((p) => ({ ...p, score: 0, history: [], turnsPlayed: 0, highestTurn: 0 })),
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers used by the UI layer to decide which event to dispatch.
// They DO NOT mutate state — they only decide an outcome based on inputs.
// ─────────────────────────────────────────────────────────────────────────────

export interface TurnOutcome {
  kind: "BUST" | "VICTORY" | "CONTINUE";
}

export function evaluateTurn(
  currentScore: number,
  darts: (DartThrow | null)[],
  target: number
): TurnOutcome {
  const sum = sumDarts(darts);
  const next = currentScore + sum;
  if (next > target) return { kind: "BUST" };
  if (next === target) return { kind: "VICTORY" };
  return { kind: "CONTINUE" };
}

export function evaluatePartialDart(
  currentScore: number,
  darts: (DartThrow | null)[],
  target: number
): TurnOutcome {
  // Same as evaluateTurn but called after each dart to detect early bust.
  return evaluateTurn(currentScore, darts, target);
}
