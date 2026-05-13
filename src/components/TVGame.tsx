import type React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, TrendingUp, Clock } from "lucide-react";
import { GameState } from "../types";

interface TVGameProps {
  gameState: GameState;
}

export const TVGame: React.FC<TVGameProps> = ({ gameState }) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const turnSum = gameState.currentTurnDarts.reduce((a, d) => a + (d ? d.score : 0), 0);
  const highestTurn = gameState.players.reduce((max, p) => Math.max(max, p.highestTurn), 0);
  const topPlayer = [...gameState.players].sort((a, b) => b.score - a.score)[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden p-8 space-y-8 bg-base">
      {/* Top Ticker */}
      <div className="h-16 bg-card border-l-4 border-l-primary flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            <span className="bebas text-2xl tracking-widest">MARCADOR EN VIVO</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="mono text-primary text-sm font-bold">NOCHE DE DARDOS • {gameState.targetScore} PTS</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="bebas text-2xl tracking-widest">RONDA {gameState.round}</span>
          <div className="mono text-sm flex items-center gap-2">
            <Clock size={16} className="text-text-muted" />
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-8 min-h-0">
        {/* Player Grid */}
        <div className="flex-1 grid grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-4 custom-scrollbar">
          {gameState.players.map((player, idx) => (
            <div
              key={player.id}
              className={`bg-surface border overflow-hidden p-6 relative flex flex-col justify-between transition-all duration-500 ${
                idx === gameState.currentPlayerIndex
                  ? "border-primary neon-border ring-2 ring-primary/20 scale-[1.02] z-10"
                  : "border-white/5 opacity-80"
              }`}
            >
              {idx === gameState.currentPlayerIndex && (
                <div className="absolute top-0 right-0 bg-primary px-3 py-1 bebas text-black text-sm tracking-widest">
                  EN TURNO
                </div>
              )}

              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-sm flex items-center justify-center bebas text-2xl font-bold"
                  style={{ backgroundColor: player.color, color: "#000" }}
                >
                  {idx + 1}
                </div>
                <h3 className="bebas text-3xl tracking-wide truncate max-w-[150px]">{player.name}</h3>
              </div>

              <div className="mt-8 flex items-baseline justify-between transition-all">
                <span
                  className={`bebas text-8xl leading-none transition-colors ${
                    idx === gameState.currentPlayerIndex ? "text-primary shadow-glow" : "text-white"
                  }`}
                >
                  {player.score}
                </span>
                <span className="text-text-muted bebas text-2xl">/ {gameState.targetScore}</span>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="mono text-[10px] text-text-muted uppercase">Progreso</span>
                  <span className="mono text-[10px] text-primary">
                    {Math.round((player.score / gameState.targetScore) * 100)}%
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(player.score / gameState.targetScore) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Turn Sidebar */}
        <div className="w-[400px] flex flex-col gap-6">
          <div className="bg-card border-t-2 border-primary p-8 flex flex-col gap-6 flex-1">
            <div className="text-center space-y-2">
              <span className="text-primary bebas text-xl tracking-[0.3em] font-bold">LANZANDO AHORA</span>
              <h2 className="bebas text-5xl tracking-wide">{currentPlayer.name}</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-24 border rounded-sm flex items-center px-8 transition-all duration-300 ${
                    gameState.currentTurnDarts[i] !== null ? "bg-primary/5 border-primary" : "bg-surface border-white/5"
                  }`}
                >
                  <span className="mono text-text-muted mr-auto font-bold uppercase text-xs">Dardo {i + 1}</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={gameState.currentTurnDarts[i]?.score ?? "empty"}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bebas text-5xl"
                    >
                      {gameState.currentTurnDarts[i]?.score ?? "—"}
                    </motion.span>
                  </AnimatePresence>
                  {gameState.currentTurnDarts[i] !== null && <Check className="text-primary ml-4" size={24} />}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-divider flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-text-muted text-xs uppercase font-bold tracking-widest block">Total Turno</span>
                <span className="bebas text-6xl text-primary glow-primary leading-none">+{turnSum}</span>
              </div>
              {currentPlayer.score + turnSum > gameState.targetScore && (
                <div className="bg-secondary p-2 bebas text-sm text-center px-4 rounded-sm animate-bounce">
                  BUST DETECTADO
                </div>
              )}
            </div>
          </div>

          {/* Ticker Bottom */}
          <div className="bg-surface p-4 border border-white/5 flex items-center gap-4">
            <TrendingUp className="text-primary" size={20} />
            <div className="flex-1">
              <span className="text-text-muted text-[10px] font-bold uppercase block">Mejor Turno</span>
              <span className="bebas text-xl">{highestTurn} PTS</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex-1">
              <span className="text-text-muted text-[10px] font-bold uppercase block">Puntero</span>
              <span className="bebas text-xl">{topPlayer.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
