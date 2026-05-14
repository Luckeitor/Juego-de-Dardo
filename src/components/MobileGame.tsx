import type React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, RotateCcw, Check, X, Target } from "lucide-react";
import { GameState } from "../types";

interface MobileGameProps {
  gameState: GameState;
  multiplier: 1 | 2 | 3;
  isTurnLocked: boolean;
  onScoreInput: (value: number) => void;
  onMultiplierChange: (m: 1 | 2 | 3) => void;
  onUndo: () => void;
  onConfirmTurn: () => void;
  onExit: () => void;
}

export const MobileGame: React.FC<MobileGameProps> = ({
  gameState,
  multiplier,
  isTurnLocked,
  onScoreInput,
  onMultiplierChange,
  onUndo,
  onConfirmTurn,
  onExit,
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const nextPlayer = gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];
  const turnSum = gameState.currentTurnDarts.reduce((a, d) => a + (d ? d.score : 0), 0);
  const isTurnComplete = !gameState.currentTurnDarts.includes(null);

  return (
    <div className="flex flex-col h-screen max-w-[500px] mx-auto bg-base overflow-hidden">
      {/* Header Strip */}
      <div className="flex items-center justify-between p-4 bg-surface border-b border-divider">
        <button onClick={onExit} className="text-text-secondary text-xs font-bold flex items-center gap-1">
          <ChevronLeft size={14} /> SALIR
        </button>
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <span className="mono text-xs font-bold uppercase tracking-widest">Objetivo {gameState.targetScore}</span>
        </div>
        <button onClick={onUndo} className="text-text-secondary text-xs font-bold flex items-center gap-1">
          DESHACER <RotateCcw size={14} />
        </button>
      </div>

      {/* Current Player Card */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={isTurnLocked ? { scale: [1, 1.1, 1] } : {}}
              className="w-12 h-12 rounded-sm shadow-lg flex items-center justify-center bebas text-2xl font-bold transition-colors"
              style={{ backgroundColor: currentPlayer.color, color: "#000" }}
            >
              {gameState.currentPlayerIndex + 1}
            </motion.div>
            <div>
              <h2 className="bebas text-3xl tracking-wide">{currentPlayer.name}</h2>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentPlayer.score / gameState.targetScore) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
                <span className="mono text-[10px] text-text-muted">
                  {Math.round((currentPlayer.score / gameState.targetScore) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <motion.span
              animate={isTurnLocked ? { scale: 1.1, color: "#00FF88" } : {}}
              className="bebas text-7xl glow-primary leading-none"
            >
              {isTurnLocked ? (
                <span className="text-primary">{currentPlayer.score + turnSum}</span>
              ) : (
                <span className="text-white">{currentPlayer.score}</span>
              )}
            </motion.span>
            {!isTurnLocked && <span className="text-text-muted text-xl bebas ml-1">/ {gameState.targetScore}</span>}
          </div>
        </div>

        <div className="flex justify-between gap-4">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`flex-1 h-20 rounded-sm border-2 flex flex-col items-center justify-center transition-all ${
                gameState.currentTurnDarts[idx] === null
                  ? "border-dashed border-white/10"
                  : "border-primary bg-primary/5 shadow-[0_0_15px_rgba(0,255,136,0.1)]"
              } ${gameState.currentTurnDarts.indexOf(null) === idx && !isTurnLocked ? "border-primary/50 animate-pulse" : ""}`}
            >
              <span className="text-[10px] uppercase text-text-muted font-bold mb-1">Dardo {idx + 1}</span>
              <span className="bebas text-3xl">
                {gameState.currentTurnDarts[idx] !== null ? gameState.currentTurnDarts[idx]!.score : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between py-2 border-t border-divider">
          <span className="text-text-muted text-xs font-bold uppercase tracking-widest">Total Turno</span>
          <span className="bebas text-3xl text-primary glow-primary">+{turnSum}</span>
        </div>

        {currentPlayer.score + turnSum > gameState.targetScore && (
          <div className="bg-secondary/10 border border-secondary p-2 rounded-sm flex items-center justify-center gap-2">
            <X className="text-secondary" size={16} />
            <span className="bebas text-secondary text-sm tracking-widest">RIESGO DE BUST</span>
          </div>
        )}
      </div>

      {/* Input Pad */}
      <div className="flex-1 bg-surface p-4 flex flex-col gap-4 relative">
        <AnimatePresence>
          {isTurnLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-x-2 top-0 bottom-[100px] z-30 bg-base/95 backdrop-blur-md border border-primary/20 rounded-sm flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                <Check className="text-primary w-10 h-10" />
              </div>
              <h3 className="bebas text-5xl tracking-tight mb-2">¡TURNO LISTO!</h3>
              <p className="text-text-secondary text-base mb-8 uppercase tracking-widest font-bold">
                Pásale el dispositivo a <span className="text-white">{nextPlayer.name}</span>
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirmTurn}
                className="bg-primary text-black bebas text-3xl px-10 py-5 rounded-sm shadow-neon flex items-center gap-4"
              >
                TURNO DE {nextPlayer.name.toUpperCase()} <ChevronLeft className="rotate-180" size={24} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`flex flex-col gap-4 flex-1 transition-all duration-300 ${
            isTurnLocked ? "blur-sm grayscale opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex gap-2 h-14">
            {[1, 2, 3].map((m) => (
              <button
                key={m}
                onClick={() => onMultiplierChange(m as 1 | 2 | 3)}
                className={`flex-1 rounded-sm bebas text-xl transition-all ${
                  multiplier === m ? "bg-primary text-black" : "bg-card border border-white/5 text-text-secondary"
                }`}
              >
                {m === 1 ? "SIMPLE" : m === 2 ? "DOBLE" : "TRIPLE"}
              </button>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => onScoreInput(num)}
                className="bg-card text-white hover:bg-white/10 active:bg-primary active:text-black transition-all rounded-sm bebas text-2xl flex items-center justify-center border border-white/5"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => onScoreInput(25)}
              className="col-span-2 bg-card text-white rounded-sm bebas text-lg hover:border-primary/50 border border-white/5"
            >
              BULL 25
            </button>
            <button
              onClick={() => onScoreInput(50)}
              className="col-span-2 bg-secondary text-white rounded-sm bebas text-lg hover:bg-secondary/80 border border-white/5"
            >
              BULL 50
            </button>
            <button
              onClick={() => onScoreInput(0)}
              className="bg-text-muted text-white rounded-sm bebas text-2xl hover:bg-white/10 border border-white/5"
            >
              0
            </button>
          </div>
        </div>

        <motion.button
          onClick={onConfirmTurn}
          disabled={!isTurnComplete && turnSum === 0 && !isTurnLocked}
          whileTap={{ scale: 0.98 }}
          className={`w-full h-20 rounded-sm bebas text-2xl tracking-widest shadow-neon flex items-center justify-center gap-4 transition-all z-20 ${
            isTurnLocked
              ? "bg-white text-black animate-pulse"
              : isTurnComplete || turnSum > 0
              ? "bg-primary text-black"
              : "bg-card text-text-muted opacity-50"
          }`}
        >
          {isTurnLocked ? (
            <span className="flex items-center gap-3">
              SIGUIENTE: {nextPlayer.name.toUpperCase()} <ChevronLeft className="rotate-180" size={24} />
            </span>
          ) : (
            <span>{isTurnComplete ? "FINALIZAR TURNO" : "CONFIRMAR PUNTAJE"}</span>
          )}
        </motion.button>
      </div>
    </div>
  );
};
