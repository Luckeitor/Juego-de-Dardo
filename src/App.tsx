/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GameState, Player, NEON_COLORS } from "./types";
import { Lobby } from "./components/Lobby";
import { MobileGame } from "./components/MobileGame";
import { TVGame } from "./components/TVGame";
import { BustScreen } from "./components/BustScreen";
import { VictoryScreen } from "./components/VictoryScreen";

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: "LOBBY",
    targetScore: 300,
    players: [
      { id: "1", name: "Tomás", color: NEON_COLORS[0], score: 0, history: [], turnsPlayed: 0, highestTurn: 0 },
      { id: "2", name: "Ana", color: NEON_COLORS[1], score: 0, history: [], turnsPlayed: 0, highestTurn: 0 },
      { id: "3", name: "Luis", color: NEON_COLORS[2], score: 0, history: [], turnsPlayed: 0, highestTurn: 0 },
      { id: "4", name: "Carla", color: NEON_COLORS[3], score: 0, history: [], turnsPlayed: 0, highestTurn: 0 },
    ],
    currentPlayerIndex: 0,
    currentTurnDarts: [null, null, null],
    round: 1,
  });

  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [isTvView, setIsTvView] = useState(false);
  const [isTurnLocked, setIsTurnLocked] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsTvView(window.innerWidth > 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addPlayer = () => {
    if (gameState.players.length >= 12) return;
    const newId = Math.random().toString(36).slice(2, 11);
    const newPlayer: Player = {
      id: newId,
      name: `Jugador ${gameState.players.length + 1}`,
      color: NEON_COLORS[gameState.players.length % NEON_COLORS.length],
      score: 0,
      history: [],
      turnsPlayed: 0,
      highestTurn: 0,
    };
    setGameState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
  };

  const removePlayer = (id: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  };

  const updatePlayerName = (id: string, name: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  };

  const shufflePlayers = () => {
    setGameState((prev) => ({
      ...prev,
      players: [...prev.players].sort(() => Math.random() - 0.5),
    }));
  };

  const startGame = () => {
    if (gameState.players.length < 2) return;
    setGameState((prev) => ({ ...prev, status: "PLAYING" }));
  };

  const handleScoreInput = (value: number) => {
    if (isTurnLocked) return;

    const score = value * multiplier;
    const newDarts = [...gameState.currentTurnDarts];
    const emptyIndex = newDarts.indexOf(null);

    if (emptyIndex !== -1) {
      newDarts[emptyIndex] = score;

      const turnSum = newDarts.reduce((a, b) => (a || 0) + (b || 0), 0) as number;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const nextTotal = currentPlayer.score + turnSum;

      if (nextTotal > gameState.targetScore) {
        setGameState((prev) => ({
          ...prev,
          currentTurnDarts: newDarts,
          lastBustPlayer: currentPlayer.name,
        }));
        setTimeout(() => {
          setGameState((prev) => ({ ...prev, status: "BUST" }));
          setIsTurnLocked(false);
        }, 500);
        return;
      }

      setGameState((prev) => ({ ...prev, currentTurnDarts: newDarts }));
      setMultiplier(1);

      if (emptyIndex === 2) {
        setIsTurnLocked(true);
      }
    }
  };

  const undoLastDart = () => {
    if (isTurnLocked) {
      setIsTurnLocked(false);
    }
    const newDarts = [...gameState.currentTurnDarts];
    const lastFilledIndex = [...newDarts].reverse().findIndex((d) => d !== null);
    if (lastFilledIndex !== -1) {
      const realIndex = 2 - lastFilledIndex;
      newDarts[realIndex] = null;
      setGameState((prev) => ({ ...prev, currentTurnDarts: newDarts }));
    }
  };

  const confirmTurn = useCallback(() => {
    if (!isTurnLocked) {
      setIsTurnLocked(true);
      return;
    }

    const turnSum = gameState.currentTurnDarts.reduce((a, b) => (a || 0) + (b || 0), 0) as number;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const nextTotal = currentPlayer.score + turnSum;

    if (nextTotal === gameState.targetScore) {
      const winner = {
        ...currentPlayer,
        score: nextTotal,
        turnsPlayed: currentPlayer.turnsPlayed + 1,
        highestTurn: Math.max(currentPlayer.highestTurn, turnSum),
      };
      setGameState((prev) => ({
        ...prev,
        status: "VICTORY",
        winner,
      }));
      setIsTurnLocked(false);
      return;
    }

    const updatedPlayers = gameState.players.map((p, i) => {
      if (i === gameState.currentPlayerIndex) {
        return {
          ...p,
          score: nextTotal,
          turnsPlayed: p.turnsPlayed + 1,
          highestTurn: Math.max(p.highestTurn, turnSum),
          history: [...p.history, gameState.currentTurnDarts.filter((d) => d !== null) as number[]],
        };
      }
      return p;
    });

    const nextIndex = (gameState.currentPlayerIndex + 1) % updatedPlayers.length;
    const nextRound = nextIndex === 0 ? gameState.round + 1 : gameState.round;

    setGameState((prev) => ({
      ...prev,
      players: updatedPlayers,
      currentPlayerIndex: nextIndex,
      currentTurnDarts: [null, null, null],
      round: nextRound,
    }));
    setIsTurnLocked(false);
  }, [gameState, isTurnLocked]);

  const resetGame = () => {
    setGameState((prev) => ({
      ...prev,
      status: "LOBBY",
      currentPlayerIndex: 0,
      currentTurnDarts: [null, null, null],
      round: 1,
      players: prev.players.map((p) => ({ ...p, score: 0, history: [], turnsPlayed: 0, highestTurn: 0 })),
    }));
  };

  const handleBustResume = () => {
    const updatedPlayers = gameState.players.map((p, i) => {
      if (i === gameState.currentPlayerIndex) {
        return {
          ...p,
          turnsPlayed: p.turnsPlayed + 1,
          history: [...p.history, []],
        };
      }
      return p;
    });

    const nextIndex = (gameState.currentPlayerIndex + 1) % updatedPlayers.length;
    const nextRound = nextIndex === 0 ? gameState.round + 1 : gameState.round;

    setGameState((prev) => ({
      ...prev,
      status: "PLAYING",
      players: updatedPlayers,
      currentPlayerIndex: nextIndex,
      currentTurnDarts: [null, null, null],
      round: nextRound,
    }));
  };

  const setTargetScore = (score: number) => {
    setGameState((prev) => ({ ...prev, targetScore: score }));
  };

  return (
    <div className="min-h-screen bg-base relative overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState.status === "LOBBY" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Lobby
              gameState={gameState}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onUpdatePlayerName={updatePlayerName}
              onShufflePlayers={shufflePlayers}
              onSetTargetScore={setTargetScore}
              onStartGame={startGame}
            />
          </motion.div>
        )}

        {gameState.status === "PLAYING" && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isTvView ? (
              <TVGame gameState={gameState} />
            ) : (
              <MobileGame
                gameState={gameState}
                multiplier={multiplier}
                isTurnLocked={isTurnLocked}
                onScoreInput={handleScoreInput}
                onMultiplierChange={setMultiplier}
                onUndo={undoLastDart}
                onConfirmTurn={confirmTurn}
                onExit={resetGame}
              />
            )}
          </motion.div>
        )}

        {gameState.status === "BUST" && (
          <BustScreen lastBustPlayer={gameState.lastBustPlayer} onResume={handleBustResume} />
        )}

        {gameState.status === "VICTORY" && gameState.winner && (
          <VictoryScreen
            winner={gameState.winner}
            targetScore={gameState.targetScore}
            round={gameState.round}
            onReset={resetGame}
          />
        )}
      </AnimatePresence>

      {/* View Toggle (Demo Helper) */}
      <div className="fixed bottom-4 right-4 z-[60] flex gap-2">
        <button
          onClick={() => setIsTvView(!isTvView)}
          className="bg-card/80 backdrop-blur-sm border border-white/10 p-3 rounded-full text-text-secondary hover:text-primary transition-colors flex items-center gap-2"
          title="Cambiar vista controlador/TV"
        >
          <div className={`w-2 h-2 rounded-full ${isTvView ? "bg-primary" : "bg-red-500"}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {isTvView ? "MODO TV" : "MODO CONTROLADOR"}
          </span>
        </button>
      </div>
    </div>
  );
}
