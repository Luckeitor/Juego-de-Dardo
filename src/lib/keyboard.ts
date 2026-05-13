import { useEffect, useRef } from "react";
import type { DartMultiplier } from "../engine/gameEngine";

export interface KeyboardHandlers {
  onScoreInput: (value: number) => void;
  onMultiplierChange: (m: DartMultiplier) => void;
  onUndo: () => void;
  onConfirm: () => void;
  enabled: boolean;
}

const PREFIX_TIMEOUT = 700; // ms to wait for a 2nd digit when first key is 1 or 2

export function useKeyboard(handlers: KeyboardHandlers): void {
  const { onScoreInput, onMultiplierChange, onUndo, onConfirm, enabled } = handlers;

  const bufferRef = useRef("");
  const timerRef = useRef<number | null>(null);

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const flush = () => {
      const buf = bufferRef.current;
      bufferRef.current = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (buf === "") return;
      const num = parseInt(buf, 10);
      if (Number.isFinite(num) && num >= 0 && num <= 20) {
        handlersRef.current.onScoreInput(num);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // Digits 0-9
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        if (bufferRef.current === "" && (key === "1" || key === "2")) {
          // Could be prefix of 10-20. Wait briefly for a 2nd digit.
          bufferRef.current = key;
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(flush, PREFIX_TIMEOUT);
          return;
        }
        if (bufferRef.current === "1" || bufferRef.current === "2") {
          // Combine into 10-19 or 20-29 (cap at 20).
          const combined = parseInt(bufferRef.current + key, 10);
          bufferRef.current = "";
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = null;
          if (combined <= 20) {
            handlersRef.current.onScoreInput(combined);
          } else {
            // 21+ doesn't exist on a board; fall back to first digit.
            handlersRef.current.onScoreInput(parseInt(bufferRef.current || key, 10));
          }
          return;
        }
        // Direct single digit 0, 3-9
        handlersRef.current.onScoreInput(parseInt(key, 10));
        return;
      }

      // Multipliers
      if (key === "s" || key === "S") {
        e.preventDefault();
        handlersRef.current.onMultiplierChange(1);
        return;
      }
      if (key === "d" || key === "D") {
        e.preventDefault();
        handlersRef.current.onMultiplierChange(2);
        return;
      }
      if (key === "t" || key === "T") {
        e.preventDefault();
        handlersRef.current.onMultiplierChange(3);
        return;
      }

      // Bull
      if (key === "b" || key === "B") {
        e.preventDefault();
        handlersRef.current.onScoreInput(e.shiftKey ? 50 : 25);
        return;
      }

      // Undo
      if (key === "Backspace" || key === "u" || key === "U") {
        e.preventDefault();
        handlersRef.current.onUndo();
        return;
      }

      // Confirm
      if (key === "Enter") {
        e.preventDefault();
        handlersRef.current.onConfirm();
        return;
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, onScoreInput, onMultiplierChange, onUndo, onConfirm]);
}
