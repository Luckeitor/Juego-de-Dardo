/**
 * localStorage wrapper for the dart game.
 *
 * Storage layout:
 *   dardos:current-game  → GameEvent[]   (single in-progress game)
 *   dardos:history       → ArchivedGame[] (max 10 finished games, newest first)
 */

import type { GameEvent } from "../engine/gameEngine";

const CURRENT_KEY = "dardos:current-game";
const HISTORY_KEY = "dardos:history";
const MAX_HISTORY = 10;

export interface ArchivedGame {
  finishedAt: string;
  events: GameEvent[];
}

const isAvailable = (): boolean => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

// ── Current game ─────────────────────────────────────────────────────────────
export function saveEvents(events: GameEvent[]): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.setItem(CURRENT_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn("[dardos] failed to save current game:", err);
  }
}

export function loadEvents(): GameEvent[] | null {
  if (!isAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as GameEvent[];
  } catch (err) {
    console.warn("[dardos] failed to load current game:", err);
    return null;
  }
}

export function clearCurrent(): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(CURRENT_KEY);
  } catch (err) {
    console.warn("[dardos] failed to clear current game:", err);
  }
}

// ── History ──────────────────────────────────────────────────────────────────
export function archiveGame(events: GameEvent[]): void {
  if (!isAvailable()) return;
  try {
    const history = loadHistory();
    const entry: ArchivedGame = { finishedAt: new Date().toISOString(), events };
    const next = [entry, ...history].slice(0, MAX_HISTORY);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn("[dardos] failed to archive game:", err);
  }
}

export function loadHistory(): ArchivedGame[] {
  if (!isAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ArchivedGame[];
  } catch (err) {
    console.warn("[dardos] failed to load history:", err);
    return [];
  }
}

export function clearHistory(): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn("[dardos] failed to clear history:", err);
  }
}
