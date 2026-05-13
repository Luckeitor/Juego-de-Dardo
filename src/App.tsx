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
import { IntroScreen } from "./components/IntroScreen";
import { useGameStore } from "./state/useGameStore";
import { DartMultiplier } from "./engine/gameEngine";
import { useKeyboard } from "./lib/keyboard";

const INTRO_SEEN_KEY = "dardos:intro-seen";

export default function App() {
  const store = useGameStore();
  const { state } = store;

  const [multiplier, setMultiplier] = useState<DartMultiplier>(1);
  const [isTvView, setIsTvView] = useState(false);
  const [isTurnLocked, setIsTurnLocked] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return typeof window !== "undefined" && !window.localStorage.getItem(INTRO_SEEN_KEY);
    } catch {
      return false;
    }
  });

  const dismissIntro = useCallback(() => {
    try {
      window.localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // ignore
    }
    setShowIntro(false);
  }, []);

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
    // If there are darts in the current turn, just undo the last dart.
    // Otherwise, pop the last event from the log (undo previous turn / bust / etc.).
    const hasDartInTurn = state.currentTurnDarts.some((d) => d !== null);
    if (hasDartInTurn) {
      store.undoDart();
    } else {
      store.undoLastEvent();
    }
  }, [isTurnLocked, store, state.currentTurnDarts]);

  const handleConfirmTurn = useCallback(() => {
    if (!isTurnLocked) {
      const filled = state.currentTurnDarts.filter((d) => d !== null).length;
      if (filled > 0) setIsTurnLocked(true);
      return;
    }
    store.confirmTurn();
    setIsTurnLocked(false);
  }, [isTurnLocked, store, state.currentTurnDarts]);

  // Keyboard shortcuts (active only during PLAYING)
  useKeyboard({
    enabled: state.status === "PLAYING",
    onScoreInput: handleScoreInput,
    onMultiplierChange: setMultiplier,
    onUndo: handleUndo,
    onConfirm: handleConfirmTurn,
  });

  return (
    <div className="min-h-screen bg-base relative overflow-hidden">
      {showIntro && <IntroScreen onDismiss={dismissIntro} />}

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
            onRematch={store.rematch}
            onNewGame={store.resetGame}
          />
        )}
      </AnimatePresence>

      {/* View Toggle — only visible during active gameplay or lobby */}
      {(state.status === "LOBBY" || state.status === "PLAYING") && (
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
      )}
    </div>
  );
}
