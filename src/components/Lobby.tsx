import type React from "react";
import { Plus, Trash2, Shuffle, Target } from "lucide-react";
import { GameState } from "../types";
import { Button } from "./ui/Button";

interface LobbyProps {
  gameState: GameState;
  onAddPlayer: () => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayerName: (id: string, name: string) => void;
  onShufflePlayers: () => void;
  onSetTargetScore: (score: number) => void;
  onStartGame: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  gameState,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayerName,
  onShufflePlayers,
  onSetTargetScore,
  onStartGame,
}) => (
  <div className="max-w-[1280px] mx-auto p-6 flex flex-col lg:flex-row gap-12 min-h-screen">
    {/* Target Selector & Visual */}
    <div className="flex-1 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-sm shadow-neon">
          <span className="bebas text-black text-2xl">180</span>
        </div>
        <h1 className="bebas text-4xl tracking-widest">180° COUNT-UP</h1>
      </div>

      <div className="space-y-4">
        <h2 className="bebas text-6xl md:text-8xl tracking-tight">NUEVA PARTIDA</h2>
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Selector de Puntaje Objetivo</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {[200, 300, 400, 500].map((score) => (
          <button
            key={score}
            onClick={() => onSetTargetScore(score)}
            className={`bebas text-2xl w-24 h-14 flex items-center justify-center rounded-sm transition-all ${
              gameState.targetScore === score
                ? "bg-primary text-black shadow-neon scale-105"
                : "bg-surface border border-white/10 text-white hover:border-primary/50"
            }`}
          >
            {score}
          </button>
        ))}
      </div>

      <p className="text-text-muted text-sm italic">
        Gana el primero en llegar exacto a {gameState.targetScore} puntos.
      </p>

      <div className="hidden lg:block pt-12">
        <div className="relative w-full aspect-square max-w-[400px] border border-primary/20 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-[80%] h-[80%] border border-primary/10 rounded-full flex items-center justify-center">
            <div className="w-[60%] h-[60%] border border-primary/5 rounded-full flex items-center justify-center">
              <Target className="text-primary/10 w-24 h-24" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Players List */}
    <div className="w-full lg:w-[400px] bg-surface rounded-sm border border-white/5 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="bebas text-2xl tracking-wider">JUGADORES ({gameState.players.length}/12)</h3>
        <Button variant="outline" onClick={onShufflePlayers} className="px-2 py-1 flex items-center gap-2">
          <Shuffle size={14} /> <span className="text-xs">MEZCLAR</span>
        </Button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
        {gameState.players.map((player, idx) => (
          <div key={player.id} className="flex items-center gap-3 bg-card p-3 rounded-sm border border-white/5 group">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-sm font-bold bebas text-xl"
              style={{ backgroundColor: player.color, color: "#000" }}
            >
              {idx + 1}
            </div>
            <input
              value={player.name}
              onChange={(e) => onUpdatePlayerName(player.id, e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-bold focus:text-primary transition-colors h-10"
            />
            <button
              onClick={() => onRemovePlayer(player.id)}
              className="text-text-muted hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {gameState.players.length < 12 && (
          <button
            onClick={onAddPlayer}
            className="w-full border-2 border-dashed border-white/5 rounded-sm p-4 text-text-muted hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 font-bold"
          >
            <Plus size={20} /> AGREGAR JUGADOR
          </button>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {gameState.players.length < 2 && (
          <p className="text-secondary text-xs text-center font-bold">Necesitás al menos 2 jugadores para empezar</p>
        )}
        <button
          onClick={onStartGame}
          disabled={gameState.players.length < 2}
          className="w-full bg-primary text-black h-16 rounded-sm bebas text-2xl tracking-widest shadow-neon hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-30"
        >
          EMPEZAR PARTIDA
        </button>
      </div>
    </div>
  </div>
);
