import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DartMultiplier,
  DartThrow,
  GameEvent,
  createDart,
  evaluateTurn,
  initialEvents,
  now,
  reduce,
  sumDarts,
} from "../engine/gameEngine";
import { NEON_COLORS } from "../types";
import { archiveGame, clearCurrent, loadEvents, saveEvents } from "../lib/storage";

const newId = (): string => Math.random().toString(36).slice(2, 11);

export interface GameStore {
  events: GameEvent[];
  state: ReturnType<typeof reduce>;

  // Lobby actions
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;
  shufflePlayers: () => void;
  setTargetScore: (score: number) => void;
  startGame: () => void;

  // Game actions
  throwDart: (value: number, multiplier: DartMultiplier) => { resultKind: "BUST" | "VICTORY" | "CONTINUE" };
  undoDart: () => void;
  confirmTurn: () => { resultKind: "BUST" | "VICTORY" | "CONTINUE" };
  resolveBust: () => void;
  resetGame: () => void;
  rematch: () => void;

  // Time travel
  undoLastEvent: () => void;
  canUndo: boolean;

  // Persistence
  clearPersistedGame: () => void;
}

export function useGameStore(): GameStore {
  const [events, setEvents] = useState<GameEvent[]>(() => {
    const persisted = loadEvents();
    if (persisted && persisted.length > 0) return persisted;
    return initialEvents();
  });

  const state = useMemo(() => reduce(events), [events]);

  // Persist every event change.
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  // Archive on victory (once per game).
  const archivedKey = useRef<string | null>(null);
  useEffect(() => {
    if (state.status !== "VICTORY") return;
    const key = `${events.length}:${events[events.length - 1]?.timestamp ?? ""}`;
    if (archivedKey.current === key) return;
    archivedKey.current = key;
    archiveGame(events);
  }, [state.status, events]);

  const append = useCallback((ev: GameEvent | GameEvent[]) => {
    setEvents((prev) => [...prev, ...(Array.isArray(ev) ? ev : [ev])]);
  }, []);

  // ── Lobby ────────────────────────────────────────────────────────────────
  const addPlayer = useCallback(() => {
    if (state.players.length >= 12) return;
    append({
      type: "PLAYER_ADDED",
      player: {
        id: newId(),
        name: `Jugador ${state.players.length + 1}`,
        color: NEON_COLORS[state.players.length % NEON_COLORS.length],
      },
      timestamp: now(),
    });
  }, [state.players.length, append]);

  const removePlayer = useCallback(
    (id: string) => append({ type: "PLAYER_REMOVED", playerId: id, timestamp: now() }),
    [append]
  );

  const renamePlayer = useCallback(
    (id: string, name: string) => append({ type: "PLAYER_RENAMED", playerId: id, name, timestamp: now() }),
    [append]
  );

  const shufflePlayers = useCallback(() => {
    const ids = state.players.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    append({ type: "PLAYERS_SHUFFLED", newOrder: ids, timestamp: now() });
  }, [state.players, append]);

  const setTargetScore = useCallback(
    (score: number) => append({ type: "TARGET_CHANGED", targetScore: score, timestamp: now() }),
    [append]
  );

  const startGame = useCallback(() => {
    if (state.players.length < 2) return;
    append({ type: "GAME_STARTED", timestamp: now() });
  }, [state.players.length, append]);

  // ── Game ────────────────────────────────────────────────────────────────
  const throwDart = useCallback(
    (value: number, multiplier: DartMultiplier) => {
      const player = state.players[state.currentPlayerIndex];
      if (!player) return { resultKind: "CONTINUE" as const };

      const dart = createDart(value, multiplier);
      const provisionalDarts = [...state.currentTurnDarts];
      const empty = provisionalDarts.indexOf(null);
      if (empty === -1) return { resultKind: "CONTINUE" as const };
      provisionalDarts[empty] = dart;

      const outcome = evaluateTurn(player.score, provisionalDarts, state.targetScore);

      const dartEvent: GameEvent = {
        type: "DART_THROWN",
        playerId: player.id,
        value,
        multiplier,
        timestamp: now(),
      };

      if (outcome.kind === "BUST") {
        append([dartEvent, { type: "TURN_BUSTED", playerId: player.id, timestamp: now() }]);
        return { resultKind: "BUST" as const };
      }

      append(dartEvent);
      return { resultKind: "CONTINUE" as const };
    },
    [state, append]
  );

  const undoDart = useCallback(() => {
    const hasDart = state.currentTurnDarts.some((d) => d !== null);
    if (!hasDart) return;
    append({ type: "DART_UNDONE", timestamp: now() });
  }, [state.currentTurnDarts, append]);

  const confirmTurn = useCallback(() => {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return { resultKind: "CONTINUE" as const };

    const filledDarts = state.currentTurnDarts.filter((d): d is DartThrow => d !== null);
    if (filledDarts.length === 0) return { resultKind: "CONTINUE" as const };

    const turnSum = sumDarts(filledDarts);
    const outcome = evaluateTurn(player.score, filledDarts, state.targetScore);

    if (outcome.kind === "VICTORY") {
      append([
        {
          type: "TURN_CONFIRMED",
          playerId: player.id,
          turnSum,
          darts: filledDarts,
          timestamp: now(),
        },
        {
          type: "GAME_WON",
          playerId: player.id,
          finalScore: player.score + turnSum,
          timestamp: now(),
        },
      ]);
      return { resultKind: "VICTORY" as const };
    }

    if (outcome.kind === "BUST") {
      append({ type: "TURN_BUSTED", playerId: player.id, timestamp: now() });
      return { resultKind: "BUST" as const };
    }

    append({
      type: "TURN_CONFIRMED",
      playerId: player.id,
      turnSum,
      darts: filledDarts,
      timestamp: now(),
    });
    return { resultKind: "CONTINUE" as const };
  }, [state, append]);

  const resolveBust = useCallback(() => {
    append({ type: "BUST_ACKNOWLEDGED", timestamp: now() });
  }, [append]);

  const resetGame = useCallback(() => {
    // Hard-reset the event log to keep it bounded.
    // We snapshot the current players/target so the next match keeps the lobby intact.
    archivedKey.current = null;
    setEvents([
      {
        type: "GAME_CONFIGURED",
        targetScore: state.targetScore,
        players: state.players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
        timestamp: now(),
      },
    ]);
  }, [state.targetScore, state.players]);

  const rematch = useCallback(() => {
    // Same as resetGame but jumps straight into PLAYING (no lobby step).
    archivedKey.current = null;
    setEvents([
      {
        type: "GAME_CONFIGURED",
        targetScore: state.targetScore,
        players: state.players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
        timestamp: now(),
      },
      { type: "GAME_STARTED", timestamp: now() },
    ]);
  }, [state.targetScore, state.players]);

  const clearPersistedGame = useCallback(() => {
    clearCurrent();
  }, []);

  const undoLastEvent = useCallback(() => {
    setEvents((prev) => {
      if (prev.length <= 1) return prev; // keep GAME_CONFIGURED
      return prev.slice(0, -1);
    });
  }, []);

  return {
    events,
    state,
    addPlayer,
    removePlayer,
    renamePlayer,
    shufflePlayers,
    setTargetScore,
    startGame,
    throwDart,
    undoDart,
    confirmTurn,
    resolveBust,
    resetGame,
    rematch,
    undoLastEvent,
    canUndo: events.length > 1,
    clearPersistedGame,
  };
}
