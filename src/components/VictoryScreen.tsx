import type React from "react";
import { motion } from "motion/react";
import { Trophy, Check, History, TrendingUp, Clock, Target } from "lucide-react";
import { Player } from "../types";
import { Button } from "./ui/Button";

interface VictoryScreenProps {
  winner: Player;
  targetScore: number;
  round: number;
  onReset: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ winner, targetScore, round, onReset }) => {
  const accuracy =
    winner.turnsPlayed > 0 ? `${Math.round((winner.score / (winner.turnsPlayed * 60)) * 100)}%` : "—";

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
      className="fixed inset-0 z-50 bg-base flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />

      {/* Ray Lights Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(0,255,136,0.1)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-4 mb-8"
      >
        <span className="bebas text-2xl tracking-[12px] text-primary font-bold">CAMPEÓN</span>
        <Trophy className="w-16 h-16 text-primary mx-auto drop-shadow-neon mt-4" />
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="relative z-10 text-center"
      >
        <div className="relative inline-block mb-12">
          <div
            className="w-48 h-48 md:w-64 md:h-64 rounded-sm shadow-2xl flex items-center justify-center bebas text-8xl md:text-[10rem] border-4 border-primary"
            style={{ backgroundColor: winner.color, color: "#000" }}
          >
            {winner.name.charAt(0)}
          </div>
          <div className="absolute -bottom-4 -right-4 bg-primary p-4 rounded-sm shadow-lg">
            <Check size={32} className="text-black" />
          </div>
        </div>

        <h1 className="bebas text-8xl md:text-[12rem] leading-none mb-4 tracking-wider text-white drop-shadow-neon">
          {winner.name}
        </h1>
        <div className="flex items-center justify-center gap-4 bebas text-4xl md:text-6xl text-primary">
          <span>{winner.score}</span>
          <span className="text-white/30">/</span>
          <span>{targetScore}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl w-full"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface border border-white/5 p-4 rounded-sm text-center">
            <stat.icon className="mx-auto mb-2 text-text-muted" size={18} />
            <span className="block text-text-muted text-[10px] uppercase font-bold tracking-widest">{stat.label}</span>
            <span className="bebas text-3xl">{stat.value}</span>
          </div>
        ))}
      </motion.div>

      <div className="mt-16 flex gap-4">
        <Button onClick={onReset} className="px-12 py-4 bebas text-3xl rounded-sm">
          NUEVA PARTIDA
        </Button>
        <Button variant="outline" onClick={onReset} className="px-12 py-4 bebas text-3xl rounded-sm">
          REVANCHA
        </Button>
      </div>
    </motion.div>
  );
};
