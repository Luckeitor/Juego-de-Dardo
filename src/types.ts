import type { DartThrow } from "./engine/gameEngine";

export type GameStatus = "LOBBY" | "PLAYING" | "BUST" | "VICTORY";

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  history: number[][]; // [round][dartIndex] — flat scores for compactness
  turnsPlayed: number;
  highestTurn: number;
}

export interface GameState {
  status: GameStatus;
  targetScore: number;
  players: Player[];
  currentPlayerIndex: number;
  currentTurnDarts: (DartThrow | null)[];
  lastBustPlayer?: string;
  winner?: Player;
  round: number;
}

export const NEON_COLORS = [
  "#00FF88", // Neon Green
  "#FF3B47", // Dartboard Red
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#D946EF", // Fuchsia
  "#00FFCC", // Teal
];
