/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Shuffle, 
  Settings, 
  ChevronLeft, 
  RotateCcw, 
  Check, 
  X,
  Target,
  Trophy,
  History,
  TrendingUp,
  Clock
} from "lucide-react";
import { GameState, Player, NEON_COLORS, GameStatus } from "./types";

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "primary", 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: "primary" | "secondary" | "outline" | "ghost"; 
  className?: string;
}) => {
  const variants = {
    primary: "bg-primary text-black hover:bg-opacity-90 shadow-neon",
    secondary: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-primary text-primary hover:bg-primary/10",
    ghost: "text-text-secondary hover:text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- Mockup/Placeholder for TV vs Mobile ---
// We'll use a simple breakpoint or state to toggle views for demo purposes, 
// but design them to be fully functional.

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

  // Toggle TV view for preview purposes (responsive testing)
  useEffect(() => {
    const handleResize = () => setIsTvView(window.innerWidth > 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addPlayer = () => {
    if (gameState.players.length >= 12) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newPlayer: Player = {
      id: newId,
      name: `Player ${gameState.players.length + 1}`,
      color: NEON_COLORS[gameState.players.length % NEON_COLORS.length],
      score: 0,
      history: [],
      turnsPlayed: 0,
      highestTurn: 0,
    };
    setGameState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
  };

  const removePlayer = (id: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== id),
    }));
  };

  const updatePlayerName = (id: string, name: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, name } : p),
    }));
  };

  const shufflePlayers = () => {
    setGameState(prev => ({
      ...prev,
      players: [...prev.players].sort(() => Math.random() - 0.5),
    }));
  };

  const startGame = () => {
    if (gameState.players.length < 1) return;
    setGameState(prev => ({ ...prev, status: "PLAYING" }));
  };

  const handleScoreInput = (value: number) => {
    if (isTurnLocked) return;

    const score = value * multiplier;
    const newDarts = [...gameState.currentTurnDarts];
    const emptyIndex = newDarts.indexOf(null);
    
    if (emptyIndex !== -1) {
      newDarts[emptyIndex] = score;
      
      // Check for BUST or VICTORY immediately if it's the last dart or check intermediate sum
      const turnSum = newDarts.reduce((a, b) => (a || 0) + (b || 0), 0) as number;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const nextTotal = currentPlayer.score + turnSum;

      if (nextTotal > gameState.targetScore) {
        setGameState(prev => ({ 
          ...prev, 
          currentTurnDarts: newDarts,
          lastBustPlayer: currentPlayer.name
        }));
        setTimeout(() => {
          setGameState(prev => ({ ...prev, status: "BUST" }));
          setIsTurnLocked(false);
        }, 500);
        return;
      }

      setGameState(prev => ({ ...prev, currentTurnDarts: newDarts }));
      setMultiplier(1);

      // Automatically lock if it's the last dart
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
    const lastFilledIndex = [...newDarts].reverse().findIndex(d => d !== null);
    if (lastFilledIndex !== -1) {
      const realIndex = 2 - lastFilledIndex;
      newDarts[realIndex] = null;
      setGameState(prev => ({ ...prev, currentTurnDarts: newDarts }));
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
        highestTurn: Math.max(currentPlayer.highestTurn, turnSum)
      };
      setGameState(prev => ({ 
        ...prev, 
        status: "VICTORY", 
        winner 
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
          history: [...p.history, gameState.currentTurnDarts.filter(d => d !== null) as number[]]
        };
      }
      return p;
    });

    const nextIndex = (gameState.currentPlayerIndex + 1) % updatedPlayers.length;
    const nextRound = nextIndex === 0 ? gameState.round + 1 : gameState.round;

    setGameState(prev => ({
      ...prev,
      players: updatedPlayers,
      currentPlayerIndex: nextIndex,
      currentTurnDarts: [null, null, null],
      round: nextRound,
    }));
    setIsTurnLocked(false);
  }, [gameState, isTurnLocked]);

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      status: "LOBBY",
      currentPlayerIndex: 0,
      currentTurnDarts: [null, null, null],
      round: 1,
      players: prev.players.map(p => ({ ...p, score: 0, history: [], turnsPlayed: 0, highestTurn: 0 }))
    }));
  };

  const handleBustResume = () => {
    // Revert turn and move to next player
    const updatedPlayers = gameState.players.map((p, i) => {
      if (i === gameState.currentPlayerIndex) {
        return {
          ...p,
          turnsPlayed: p.turnsPlayed + 1,
          history: [...p.history, []] // Void turn
        };
      }
      return p;
    });

    const nextIndex = (gameState.currentPlayerIndex + 1) % updatedPlayers.length;
    const nextRound = nextIndex === 0 ? gameState.round + 1 : gameState.round;

    setGameState(prev => ({
      ...prev,
      status: "PLAYING",
      players: updatedPlayers,
      currentPlayerIndex: nextIndex,
      currentTurnDarts: [null, null, null],
      round: nextRound,
    }));
  };

  // --- Render Sections ---

  const renderLobby = () => (
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
          <h2 className="bebas text-6xl md:text-8xl tracking-tight">NEW GAME</h2>
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Target Score Selector</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {[200, 300, 400, 500].map(score => (
            <button
              key={score}
              onClick={() => setGameState(prev => ({ ...prev, targetScore: score }))}
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
        
        <p className="text-text-muted text-sm italic">First player to reach exactly {gameState.targetScore} points wins the match.</p>

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
          <h3 className="bebas text-2xl tracking-wider">PLAYERS ({gameState.players.length}/12)</h3>
          <Button variant="outline" onClick={shufflePlayers} className="px-2 py-1 flex items-center gap-2">
            <Shuffle size={14} /> <span className="text-xs">SHUFFLE</span>
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
                onChange={(e) => updatePlayerName(player.id, e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-bold focus:text-primary transition-colors h-10"
              />
              <button 
                onClick={() => removePlayer(player.id)}
                className="text-text-muted hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {gameState.players.length < 12 && (
            <button 
              onClick={addPlayer}
              className="w-full border-2 border-dashed border-white/5 rounded-sm p-4 text-text-muted hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 font-bold"
            >
              <Plus size={20} /> ADD PLAYER
            </button>
          )}
        </div>

        <div className="mt-8 space-y-4">
           {gameState.players.length < 2 && (
             <p className="text-secondary text-xs text-center font-bold">Add at least 2 players to start</p>
           )}
           <button 
             onClick={startGame}
             disabled={gameState.players.length < 2}
             className="w-full bg-primary text-black h-16 rounded-sm bebas text-2xl tracking-widest shadow-neon hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-30"
           >
             START GAME
           </button>
        </div>
      </div>
    </div>
  );

  const renderMobileGame = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const nextPlayer = gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];
    const turnSum = gameState.currentTurnDarts.reduce((a, b) => (a || 0) + (b || 0), 0) as number;
    const isTurnComplete = !gameState.currentTurnDarts.includes(null);

    return (
      <div className="flex flex-col h-screen max-w-[500px] mx-auto bg-base overflow-hidden">
        {/* Header Strip */}
        <div className="flex items-center justify-between p-4 bg-surface border-b border-divider">
          <button onClick={resetGame} className="text-text-secondary text-xs font-bold flex items-center gap-1">
            <ChevronLeft size={14} /> EXIT
          </button>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            <span className="mono text-xs font-bold uppercase tracking-widest">Target {gameState.targetScore}</span>
          </div>
          <button onClick={undoLastDart} className="text-text-secondary text-xs font-bold flex items-center gap-1">
             UNDO <RotateCcw size={14} />
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
                   <span className="mono text-[10px] text-text-muted">{Math.round((currentPlayer.score / gameState.targetScore) * 100)}%</span>
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
            {[0, 1, 2].map(idx => (
              <div 
                key={idx}
                className={`flex-1 h-20 rounded-sm border-2 flex flex-col items-center justify-center transition-all ${
                  gameState.currentTurnDarts[idx] === null 
                    ? "border-dashed border-white/10" 
                    : "border-primary bg-primary/5 shadow-[0_0_15px_rgba(0,255,136,0.1)]"
                } ${gameState.currentTurnDarts.indexOf(null) === idx && !isTurnLocked ? "border-primary/50 animate-pulse" : ""}`}
              >
                <span className="text-[10px] uppercase text-text-muted font-bold mb-1">Dart {idx + 1}</span>
                <span className="bebas text-3xl">
                  {gameState.currentTurnDarts[idx] !== null ? gameState.currentTurnDarts[idx] : "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between py-2 border-t border-divider">
             <span className="text-text-muted text-xs font-bold uppercase tracking-widest">Turn Total</span>
             <span className="bebas text-3xl text-primary glow-primary">+{turnSum}</span>
          </div>
          
          {(currentPlayer.score + turnSum) > gameState.targetScore && (
             <div className="bg-secondary/10 border border-secondary p-2 rounded-sm flex items-center justify-center gap-2">
                <X className="text-secondary" size={16} />
                <span className="bebas text-secondary text-sm tracking-widest">BUST RISK DETECTED</span>
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
                <h3 className="bebas text-5xl tracking-tight mb-2">TURN READY!</h3>
                <p className="text-text-secondary text-base mb-8 uppercase tracking-widest font-bold">
                  Pass the device to <span className="text-white">{nextPlayer.name}</span>
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmTurn}
                  className="bg-primary text-black bebas text-3xl px-10 py-5 rounded-sm shadow-neon flex items-center gap-4"
                >
                  START {nextPlayer.name.toUpperCase()}'S TURN <ChevronLeft className="rotate-180" size={24} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex flex-col gap-4 flex-1 transition-all duration-300 ${isTurnLocked ? "blur-sm grayscale opacity-50 pointer-events-none" : ""}`}>
            <div className="flex gap-2 h-14">
              {[1, 2, 3].map(m => (
                <button
                  key={m}
                  onClick={() => setMultiplier(m as 1 | 2 | 3)}
                  className={`flex-1 rounded-sm bebas text-xl transition-all ${
                    multiplier === m 
                      ? "bg-primary text-black" 
                      : "bg-card border border-white/5 text-text-secondary"
                  }`}
                >
                  {m === 1 ? "SINGLE" : m === 2 ? "DOUBLE" : "TRIPLE"}
                </button>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-5 gap-2">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => handleScoreInput(num)}
                  className="bg-card text-white hover:bg-white/10 active:bg-primary active:text-black transition-all rounded-sm bebas text-2xl flex items-center justify-center border border-white/5"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={() => handleScoreInput(25)} 
                className="col-span-2 bg-card text-white rounded-sm bebas text-lg hover:border-primary/50 border border-white/5"
              >
                BULL 25
              </button>
              <button 
                onClick={() => handleScoreInput(50)} 
                className="col-span-2 bg-secondary text-white rounded-sm bebas text-lg hover:bg-secondary/80 border border-white/5"
              >
                BULL 50
              </button>
              <button 
                onClick={() => handleScoreInput(0)} 
                className="bg-text-muted text-white rounded-sm bebas text-2xl hover:bg-white/10 border border-white/5"
              >
                0
              </button>
            </div>
          </div>

          <motion.button 
            onClick={confirmTurn}
            disabled={!isTurnComplete && turnSum === 0 && !isTurnLocked}
            whileTap={{ scale: 0.98 }}
            className={`w-full h-20 rounded-sm bebas text-2xl tracking-widest shadow-neon flex items-center justify-center gap-4 transition-all z-20 ${
              isTurnLocked 
                ? "bg-white text-black animate-pulse" 
                : (isTurnComplete || turnSum > 0) ? "bg-primary text-black" : "bg-card text-text-muted opacity-50"
            }`}
          >
            {isTurnLocked ? (
              <span className="flex items-center gap-3">
                SIGUIENTE: {nextPlayer.name.toUpperCase()} <ChevronLeft className="rotate-180" size={24} />
              </span>
            ) : (
              <span>{isTurnComplete ? "FINISH TURN" : "CONFIRM SCORE"}</span>
            )}
          </motion.button>
        </div>
      </div>
    );
  };

  const renderTvGame = () => {
     // Broadcast view
     const currentPlayer = gameState.players[gameState.currentPlayerIndex];
     const turnSum = gameState.currentTurnDarts.reduce((a, b) => (a || 0) + (b || 0), 0) as number;

     return (
       <div className="flex flex-col h-screen overflow-hidden p-8 space-y-8 bg-base">
         {/* Top Ticker */}
         <div className="h-16 bg-card border-l-4 border-l-primary flex items-center justify-between px-8 shadow-lg">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
                  <span className="bebas text-2xl tracking-widest">LIVE SCOREBOARD</span>
               </div>
               <div className="h-4 w-px bg-white/10" />
               <span className="mono text-primary text-sm font-bold">FRIDAY NIGHT COUNT-UP • {gameState.targetScore} PTS</span>
            </div>
            <div className="flex items-center gap-8">
               <span className="bebas text-2xl tracking-widest">ROUND {gameState.round}</span>
               <div className="mono text-sm flex items-center gap-2">
                 <Clock size={16} className="text-text-muted" />
                 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        ON TURN
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
                      <span className={`bebas text-8xl leading-none transition-colors ${idx === gameState.currentPlayerIndex ? "text-primary shadow-glow" : "text-white"}`}>
                        {player.score}
                      </span>
                      <span className="text-text-muted bebas text-2xl">/ {gameState.targetScore}</span>
                   </div>

                   <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="mono text-[10px] text-text-muted uppercase">Progress</span>
                         <span className="mono text-[10px] text-primary">{Math.round((player.score / gameState.targetScore) * 100)}%</span>
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
                    <span className="text-primary bebas text-xl tracking-[0.3em] font-bold">NOW THROWING</span>
                    <h2 className="bebas text-5xl tracking-wide">{currentPlayer.name}</h2>
                 </div>

                 <div className="flex-1 flex flex-col justify-center gap-6">
                    {[0, 1, 2].map(i => (
                       <div key={i} className={`h-24 border rounded-sm flex items-center px-8 transition-all duration-300 ${
                         gameState.currentTurnDarts[i] !== null 
                          ? "bg-primary/5 border-primary" 
                          : "bg-surface border-white/5"
                       }`}>
                         <span className="mono text-text-muted mr-auto font-bold uppercase text-xs">Dart {i + 1}</span>
                         <AnimatePresence mode="wait">
                            <motion.span 
                              key={gameState.currentTurnDarts[i]}
                              initial={{ scale: 1.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bebas text-5xl"
                            >
                               {gameState.currentTurnDarts[i] ?? "—"}
                            </motion.span>
                         </AnimatePresence>
                         {gameState.currentTurnDarts[i] !== null && (
                            <Check className="text-primary ml-4" size={24} />
                         )}
                       </div>
                    ))}
                 </div>

                 <div className="pt-6 border-t border-divider flex items-center justify-between">
                    <div className="space-y-1">
                       <span className="text-text-muted text-xs uppercase font-bold tracking-widest block">Turn Total</span>
                       <span className="bebas text-6xl text-primary glow-primary leading-none">+{turnSum}</span>
                    </div>
                    {currentPlayer.score + turnSum > gameState.targetScore && (
                       <div className="bg-secondary p-2 bebas text-sm text-center px-4 rounded-sm animate-bounce">
                          BUST REACHED
                       </div>
                    )}
                 </div>
              </div>

              {/* Ticker Bottom */}
              <div className="bg-surface p-4 border border-white/5 flex items-center gap-4">
                 <TrendingUp className="text-primary" size={20} />
                 <div className="flex-1">
                    <span className="text-text-muted text-[10px] font-bold uppercase block">Highest Turn</span>
                    <span className="bebas text-xl">
                      {gameState.players.reduce((max, p) => Math.max(max, p.highestTurn), 0)} PTS
                    </span>
                 </div>
                 <div className="h-8 w-px bg-white/10" />
                 <div className="flex-1">
                    <span className="text-text-muted text-[10px] font-bold uppercase block">Top Rank</span>
                    <span className="bebas text-xl">
                      {gameState.players.sort((a,b) => b.score - a.score)[0].name}
                    </span>
                 </div>
              </div>
           </div>
         </div>
       </div>
     );
  };

  const renderBust = () => (
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
             BUST!
           </h1>
         </motion.div>

         <div className="space-y-6">
            <h2 className="bebas text-4xl md:text-6xl tracking-wide">
              {gameState.lastBustPlayer} WENT OVER!
            </h2>
            <p className="text-text-secondary text-xl font-medium">Turn voided. Score remains the same.</p>
         </div>

         <div className="pt-12">
            <button 
              onClick={handleBustResume}
              className="bg-white text-black bebas text-4xl px-12 py-6 rounded-sm tracking-widest hover:scale-105 transition-transform"
            >
              NEXT PLAYER →
            </button>
         </div>
      </div>
      
      {/* Red Pulse Visual */}
      <div className="absolute inset-0 bg-secondary/10 animate-pulse pointer-events-none" />
    </motion.div>
  );

  const renderVictory = () => {
    const winner = gameState.winner;
    if (!winner) return null;

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
          <span className="bebas text-2xl tracking-[12px] text-primary font-bold">CHAMPION</span>
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
              <span>{gameState.targetScore}</span>
           </div>
        </motion.div>

        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl w-full"
        >
           {[
             { label: "Turns", value: winner.turnsPlayed, icon: History },
             { label: "Highest", value: winner.highestTurn, icon: TrendingUp },
             { label: "Final Round", value: gameState.round, icon: Clock },
             { label: "Accuracy", value: `${Math.round((winner.score / (winner.turnsPlayed * 60)) * 100)}%`, icon: Target }
           ].map(stat => (
             <div key={stat.label} className="bg-surface border border-white/5 p-4 rounded-sm text-center">
                <stat.icon className="mx-auto mb-2 text-text-muted" size={18} />
                <span className="block text-text-muted text-[10px] uppercase font-bold tracking-widest">{stat.label}</span>
                <span className="bebas text-3xl">{stat.value}</span>
             </div>
           ))}
        </motion.div>

        <div className="mt-16 flex gap-4">
           <Button onClick={resetGame} className="px-12 py-4 bebas text-3xl rounded-sm">NEW MATCH</Button>
           <Button variant="outline" onClick={resetGame} className="px-12 py-4 bebas text-3xl rounded-sm">REMATCH</Button>
        </div>
      </motion.div>
    );
  };

  // --- Main Router ---

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
            {renderLobby()}
          </motion.div>
        )}

        {gameState.status === "PLAYING" && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isTvView ? renderTvGame() : renderMobileGame()}
          </motion.div>
        )}

        {gameState.status === "BUST" && renderBust()}

        {gameState.status === "VICTORY" && renderVictory()}
      </AnimatePresence>

      {/* View Toggle (Demo Helper) */}
      <div className="fixed bottom-4 right-4 z-[60] flex gap-2">
         <button 
           onClick={() => setIsTvView(!isTvView)}
           className="bg-card/80 backdrop-blur-sm border border-white/10 p-3 rounded-full text-text-secondary hover:text-primary transition-colors flex items-center gap-2"
           title="Toggle Controller/Display View"
         >
           <div className={`w-2 h-2 rounded-full ${isTvView ? 'bg-primary' : 'bg-red-500'}`} />
           <span className="text-[10px] font-bold uppercase tracking-widest">{isTvView ? 'Display Mode' : 'Controller Mode'}</span>
         </button>
      </div>
    </div>
  );
}
