import type React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface BustScreenProps {
  lastBustPlayer?: string;
  onResume: () => void;
}

export const BustScreen: React.FC<BustScreenProps> = ({ lastBustPlayer, onResume }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
  >
    <div className="text-center space-y-12 max-w-2xl w-full">
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        className="relative inline-block"
      >
        <X className="absolute -top-12 -right-12 text-secondary w-32 h-32 opacity-20 animate-pulse" />
        <h1 className="bebas text-[10rem] md:text-[15rem] leading-none text-secondary tracking-tighter drop-shadow-[0_0_50px_rgba(255,59,71,0.5)]">
          ¡BUST!
        </h1>
      </motion.div>

      <div className="space-y-6">
        <h2 className="bebas text-4xl md:text-6xl tracking-wide">
          {lastBustPlayer} SE PASÓ
        </h2>
        <p className="text-text-secondary text-xl font-medium">
          Solo el último dardo no contó. Los dardos anteriores del turno sí se suman.
        </p>
      </div>

      <div className="pt-12">
        <button
          onClick={onResume}
          className="bg-white text-black bebas text-4xl px-12 py-6 rounded-sm tracking-widest hover:scale-105 transition-transform"
        >
          SIGUIENTE JUGADOR →
        </button>
      </div>
    </div>

    {/* Red Pulse Visual */}
    <div className="absolute inset-0 bg-secondary/10 animate-pulse pointer-events-none" />
  </motion.div>
);
