import type React from "react";
import { motion } from "motion/react";
import { Trophy, Check, History, TrendingUp, Clock, Target } from "lucide-react";
import { Player } from "../types";
import { Button } from "./ui/Button";

interface VictoryScreenProps {
  winner: Player;
  targetScore: number;
  round: number;
  onRematch: () => void;
  onNewGame: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winner,
  targetScore,
  round,
  onRematch,
  onNewGame,
}) => {
  // Efficiency: score per turn vs. theoretical max (180 = 3 darts × T20).
  const accuracy =
    winner.turnsPlayed > 0
      ? `${Math.round((winner.score / (winner.turnsPlayed * 180)) * 100)}%`
      : "—";

  const stats = [
    { label: "Turnos", value: winner.turnsPlayed, icon: History },
    { label: "Mejor Turno", value: winner.highestTurn, icon: TrendingUp },
    { label: "Ronda Final", value: round, icon: Clock },
    { label: "Eficiencia", value: accuracy, icon: Target },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-base overflow-y-auto"
    >
      {/* Background effects — pointer-events-none so they don't block clicks */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(0,255,136,0.1)_0%,transparent_70%)]" />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 min-h-full flex flex-col items-center justify-start px-4 py-8 md:py-12">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-6"
        >
          <span className="bebas text-xl md:text-2xl tracking-[10px] text-primary font-bold">CAMPEÓN</span>
          <Trophy className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto drop-shadow-neon mt-3" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="text-center"
        >
          <div className="relative inline-block mb-6 md:mb-10">
            <div
              className="w-32 h-32 md:w-56 md:h-56 rounded-sm shadow-2xl flex items-center justify-center bebas text-6xl md:text-9xl border-4 border-primary"
              style={{ backgroundColor: winner.color, color: "#000" }}
            >
              {winner.name.charAt(0)}
            </div>
            <div className="absolute -bottom-3 -right-3 bg-primary p-3 rounded-sm shadow-lg">
              <Check size={24} className="text-black" />
            </div>
          </div>

          <h1 className="bebas text-6xl md:text-9xl leading-none mb-3 tracking-wider text-white drop-shadow-neon break-words max-w-full px-4">
            {winner.name}
          </h1>
          <div className="flex items-center justify-center gap-3 bebas text-3xl md:text-5xl text-primary">
            <span>{winner.score}</span>
            <span className="text-white/30">/</span>
            <span>{targetScore}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-4xl w-full"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface border border-white/5 p-3 md:p-4 rounded-sm text-center">
              <stat.icon className="mx-auto mb-1 text-text-muted" size={16} />
              <span className="block text-text-muted text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                {stat.label}
              </span>
              <span className="bebas text-2xl md:text-3xl">{stat.value}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="mt-10 mb-16 flex flex-col sm:flex-row gap-3 w-full max-w-md"
        >
          <Button onClick={onRematch} className="flex-1 px-8 py-4 bebas text-2xl md:text-3xl rounded-sm">
            REVANCHA
          </Button>
          <Button
            variant="outline"
            onClick={onNewGame}
            className="flex-1 px-8 py-4 bebas text-2xl md:text-3xl rounded-sm"
          >
            NUEVA PARTIDA
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
