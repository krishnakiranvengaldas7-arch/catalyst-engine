import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineView } from "./TimelineView";

export const HUD: React.FC = () => {
  const [entrancePhase, setEntrancePhase] = useState<0 | 1 | 2 | 3 | 4>(0);

  useEffect(() => {
    // Phase 0: Singularity (Dot appears) 0-1.5s
    const t1 = setTimeout(() => setEntrancePhase(1), 1500); 
    // Phase 1: Horizon (Dot stretches into horizontal line) 1.5s-3s
    const t2 = setTimeout(() => setEntrancePhase(2), 3000); 
    // Phase 2: Arrow of Time (Line rotates to vertical) 3s-4.5s
    const t3 = setTimeout(() => setEntrancePhase(3), 4500);
    // Phase 3: The Catalyst (Gold pulse and text) 4.5s-6.5s
    const t4 = setTimeout(() => setEntrancePhase(4), 6500); // Reveal

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* 
        SYMBOLIC ENTRANCE 
        A deeply meaningful geometric representation of the arrow of time and causality.
      */}
      <AnimatePresence>
        {entrancePhase < 4 && (
          <motion.div
            key="symbolic-entrance"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center pointer-events-none"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* The Singularity (Phase 0) */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: entrancePhase === 0 ? 1 : 0, 
                  opacity: entrancePhase === 0 ? 1 : 0 
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"
              />

              {/* The Horizon / Space (Phase 1) */}
              <motion.div
                initial={{ width: "0vw", height: "1px", opacity: 0 }}
                animate={{ 
                  width: entrancePhase === 1 ? "100vw" : "0vw", 
                  opacity: entrancePhase === 1 ? 1 : 0 
                }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute bg-white/40"
              />

              {/* The Arrow of Time (Phase 2) */}
              <motion.div
                initial={{ height: "0vh", width: "1px", opacity: 0 }}
                animate={{ 
                  height: entrancePhase >= 2 ? "100vh" : "0vh", 
                  opacity: entrancePhase >= 2 ? 1 : 0 
                }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute bg-gradient-to-b from-transparent via-white/40 to-transparent"
              />

              {/* The Catalyst Pulse (Phase 3) */}
              <AnimatePresence>
                {entrancePhase === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute flex flex-col items-center"
                  >
                    <div className="w-2 h-2 bg-[#d4af37] rounded-full shadow-[0_0_20px_#d4af37]" />
                    <span className="text-[#d4af37] font-serif text-[10px] tracking-[0.6em] uppercase mt-6 opacity-80">
                      The Catalyst
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimalist Hero Section */}
      <div className="w-full min-h-[100vh] flex flex-col items-center justify-center text-center px-6 relative pointer-events-auto max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: entrancePhase === 4 ? 1 : 0, y: entrancePhase === 4 ? 0 : 20 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="max-w-4xl flex flex-col items-center"
        >
          <span className="text-[#d4af37] font-sans tracking-[0.4em] text-xs uppercase mb-6 opacity-80">
            A Journey Through History
          </span>
          <h1 className="text-5xl md:text-8xl font-serif text-white tracking-widest uppercase leading-tight">
            Catalyst
          </h1>
          <p className="mt-8 text-white/60 font-sans text-lg md:text-xl font-light tracking-wide max-w-2xl leading-relaxed">
            The causal tapestry of human innovation. Every event is a thread; pull one, and watch the entire timeline unravel.
          </p>
        </motion.div>

        {/* Scroll down indicator - absolute positioning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entrancePhase === 4 ? 1 : 0 }}
          transition={{ delay: 1.5, duration: 2.0 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center h-32"
        >
          <div className="w-[1px] h-full bg-white/10 relative overflow-hidden">
            <motion.div
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-transparent via-[#d4af37] to-transparent"
            />
          </div>
        </motion.div>
      </div>

      {/* The scrolling timeline content */}
      {entrancePhase === 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.5 }}
          className="w-full relative"
        >
          {/* Continue the vertical line from hero into the timeline */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5 -translate-x-1/2 z-0 hidden md:block" />
          
          <TimelineView />
        </motion.div>
      )}
      
      {/* Footer padding */}
      <div className="h-32" />
    </div>
  );
};
