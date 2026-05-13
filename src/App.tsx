/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lobby } from "./components/Lobby";
import { MobileGame } from "./components/MobileGame";
import { TVGame } from "./components/TVGame";
import { BustScreen } from "./components/BustScreen";
import { VictoryScreen } from "./components/VictoryScreen";
import { useGameStore } from "./state/useGameStore";
import { DartMultiplier } from "./engine/gameEngine";

export default function App() {
  const store = useGameStore();
  const { state } = store;

  const [multiplier, setMultiplier] = useState<DartMultiplier>(1);
  const [isTvView, setIsTvView] = useState(false);
  const [isTurnLocked, setIsTurnLocked] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsTvView(window.innerWidth > 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset turn lock when status changes
  useEffect(() => {
    if (state.status !== "PLAYING") setIsTurnLocked(false);
  }, [state.status]);

  const handleScoreInput = useCallback(
    (value: number) => {
      if (isTurnLocked) return;
      const result = store.throwDart(value, multiplier);
      setMultiplier(1);
      // If the user just filled the third dart, lock the turn for confirmation
      // (the engine has already advanced state; we read post-throw state below)
      if (result.resultKind === "CONTINUE") {
        const filled = state.currentTurnDarts.filter((d) => d !== null).length;
        // After dispatch, this throw added 1 dart, so check if it was the 3rd
        if (filled === 2) setIsTurnLocked(true);
      }
    },
    [isTurnLocked, multiplier, store, state.currentTurnDarts]
  );

  const handleUndo = useCallback(() => {
    if (isTurnLocked) setIsTurnLocked(false);
    store.undoDart();
  }, [isTurnLocked, store]);

  const handleConfirmTurn = useCallback(() => {
    if (!isTurnLocked) {
      const filled = state.currentTurnDarts.filter((d) => d !== null).length;
      if (filled > 0) setIsTurnLocked(true);
      return;
    }
    store.confirmTurn();
    setIsTurnLocked(false);
  }, [isTurnLocked, store, state.currentTurnDarts]);

  return (
    <div className="min-h-screen bg-base relative overflow-hidden">
      <AnimatePresence mode="wait">
        {state.status === "LOBBY" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Lobby
              gameState={state}
              onAddPlayer={store.addPlayer}
              onRemovePlayer={store.removePlayer}
              onUpdatePlayerName={store.renamePlayer}
              onShufflePlayers={store.shufflePlayers}
              onSetTargetScore={store.setTargetScore}
              onStartGame={store.startGame}
            />
          </motion.div>
        )}

        {state.status === "PLAYING" && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isTvView ? (
              <TVGame gameState={state} />
            ) : (
              <MobileGame
                gameState={state}
                multiplier={multiplier}
                isTurnLocked={isTurnLocked}
                onScoreInput={handleScoreInput}
                onMultiplierChange={setMultiplier}
                onUndo={handleUndo}
                onConfirmTurn={handleConfirmTurn}
                onExit={store.resetGame}
              />
            )}
          </motion.div>
        )}

        {state.status === "BUST" && (
          <BustScreen lastBustPlayer={state.lastBustPlayer} onResume={store.resolveBust} />
        )}

        {state.status === "VICTORY" && state.winner && (
          <VictoryScreen
            winner={state.winner}
            targetScore={state.targetScore}
            round={state.round}
            onReset={store.resetGame}
          />
        )}
      </AnimatePresence>

      {/* View Toggle */}
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
