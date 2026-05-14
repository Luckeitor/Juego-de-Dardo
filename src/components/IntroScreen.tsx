import type React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface IntroScreenProps {
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 3500;

export const IntroScreen: React.FC<IntroScreenProps> = ({ onDismiss }) => {
  const [leaving, setLeaving] = useState(false);

  const dismiss = () => {
    if (leaving) return;
    setLeaving(true);
    // Wait for exit animation before unmounting.
    setTimeout(onDismiss, 400);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={dismiss}
          className="fixed inset-0 z-[100] bg-base flex flex-col items-center justify-center cursor-pointer overflow-hidden"
          role="button"
          aria-label="Continuar a la app"
        >
          {/* Soft glow background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[radial-gradient(circle,rgba(0,255,136,0.08)_0%,transparent_70%)]" />
          </div>

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-8 px-8 text-center max-w-md"
          >
            <span className="text-text-secondary text-xs md:text-sm tracking-[6px] md:tracking-[8px] uppercase font-bold">
              Un desarrollo de
            </span>

            <div className="w-full max-w-[320px] md:max-w-[420px]">
              <img
                src="/tomconsultor-dark.svg"
                alt="Tom Consultor"
                className="w-full h-auto drop-shadow-[0_0_24px_rgba(255,138,80,0.25)]"
              />
            </div>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="text-text-muted text-[10px] md:text-xs tracking-[4px] uppercase"
            >
              Toca para continuar
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
