import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";
import { causalityAudio } from "../utils/sound";

// Morphing Digit Component for Odometer Effect
const Digit: React.FC<{ char: string }> = ({ char }) => {
  return (
    <span className="relative inline-block h-[1.25em] overflow-hidden w-[0.62em] text-center font-serif text-3xl md:text-5xl font-medium">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={char}
          initial={{ y: "100%", opacity: 0, filter: "blur(2px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(2px)" }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="absolute inset-0 flex justify-center items-center text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-300 drop-"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export const TimelineControl: React.FC = () => {
  const timelineYear = useExperienceStore((state) => state.timelineYear);
  const setTimelineYear = useExperienceStore((state) => state.setTimelineYear);
  const setTimelineScrubbing = useExperienceStore((state) => state.setTimelineScrubbing);
  const setTimelineSpeed = useExperienceStore((state) => state.setTimelineSpeed);
  const currentState = useExperienceStore((state) => state.currentState);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Physics reference to track velocities and drag in a zero-allocation loop
  const physicsRef = useRef({
    year: 2026,
    velocity: 0,
    isDragging: false,
    startX: 0,
    startYear: 2026,
    lastX: 0,
    lastTime: 0,
  });

  const [localYear, setLocalYear] = useState(2026);

  // Bidirectional sync: store -> physics ref
  useEffect(() => {
    if (!physicsRef.current.isDragging) {
      physicsRef.current.year = timelineYear;
      setLocalYear(timelineYear);
    }
  }, [timelineYear]);

  // Key historical milestones drawn directly on the timeline ruler
  const milestones = useMemo(() => [
    { year: -3000, label: "Writing Systems" },
    { year: -2500, label: "Rise of Cities" },
    { year: -1750, label: "Code of Hammurabi" },
    { year: -508, label: "Athenian Democracy" },
    { year: 1440, label: "Gutenberg Press" },
    { year: 1543, label: "Scientific Revolution" },
    { year: 1700, label: "The Enlightenment" },
    { year: 1760, label: "Industrial Revolution" },
    { year: 1969, label: "Digital Revolution" },
    { year: 2026, label: "Artificial Mind" },
    { year: 2050, label: "Future Frontier" },
  ], []);

  // Map year to horizontal pixel offset (1.5 pixels per year)
  const YEAR_SCALE = 1.6;
  const startLimit = -3000;
  const endLimit = 2050;

  // Real-time inertia and boundary elastic physics loop
  useEffect(() => {
    let active = true;

    const updatePhysics = () => {
      if (!active) return;

      const state = physicsRef.current;

      if (!state.isDragging) {
        if (Math.abs(state.velocity) > 0.05) {
          // A. Apply inertia friction (damping)
          state.velocity *= 0.935;
          state.year += state.velocity;

          // B. Apply elastic boundaries spring force
          if (state.year < startLimit) {
            const delta = state.year - startLimit;
            state.velocity -= delta * 0.065; // spring constant
            state.velocity *= 0.8; // extra boundary damp
          } else if (state.year > endLimit) {
            const delta = state.year - endLimit;
            state.velocity -= delta * 0.065;
            state.velocity *= 0.8;
          }

          const rounded = Math.round(state.year);
          setTimelineYear(rounded);
          setLocalYear(rounded);
          setTimelineSpeed(Math.abs(state.velocity));
        } else {
          state.velocity = 0;
          setTimelineSpeed(0);

          // C. Elastic snap-back if settled slightly out of boundaries
          if (state.year < startLimit) {
            state.year = THREE.MathUtils.lerp(state.year, startLimit, 0.16);
            const rounded = Math.round(state.year);
            setTimelineYear(rounded);
            setLocalYear(rounded);
          } else if (state.year > endLimit) {
            state.year = THREE.MathUtils.lerp(state.year, endLimit, 0.16);
            const rounded = Math.round(state.year);
            setTimelineYear(rounded);
            setLocalYear(rounded);
          } else {
            // D. Soft snapping to nearest integer year when almost static
            const snap = Math.round(state.year);
            if (Math.abs(state.year - snap) > 0.005) {
              state.year = THREE.MathUtils.lerp(state.year, snap, 0.18);
              setLocalYear(snap);
              setTimelineYear(snap);
            }
          }
        }
      }

      requestAnimationFrame(updatePhysics);
    };

    requestAnimationFrame(updatePhysics);

    return () => {
      active = false;
    };
  }, [setTimelineYear, setTimelineSpeed]);

  // Drag Gesture Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Prevent dragging if clicking a button
    if (target.closest("button")) return;

    e.preventDefault();
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }

    const state = physicsRef.current;
    state.isDragging = true;
    state.startX = e.clientX;
    state.startYear = state.year;
    state.lastX = e.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;

    setTimelineScrubbing(true);
    causalityAudio.playTick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = physicsRef.current;
    if (!state.isDragging) return;

    e.preventDefault();
    const now = performance.now();
    const dt = Math.max(0.1, now - state.lastTime);
    const dx = e.clientX - state.startX;
    const deltaX = e.clientX - state.lastX;

    // Convert pixel delta to year delta (1 pixel = 2.2 years for highly responsive scrub)
    const yearDelta = -dx * 2.2 / YEAR_SCALE;
    let nextYear = state.startYear + yearDelta;

    // Elastic drag drag-resistance beyond bounds
    if (nextYear < startLimit) {
      const over = startLimit - nextYear;
      nextYear = startLimit - over * 0.38; // drag elasticity
    } else if (nextYear > endLimit) {
      const over = nextYear - endLimit;
      nextYear = endLimit + over * 0.38;
    }

    // Calculate real-time drag velocity
    const instantaneousVelocity = -deltaX * 2.2 / YEAR_SCALE / (dt / 16.666);
    state.velocity = THREE.MathUtils.lerp(state.velocity, instantaneousVelocity, 0.35);

    state.year = nextYear;
    state.lastX = e.clientX;
    state.lastTime = now;

    const rounded = Math.round(nextYear);
    setLocalYear(rounded);
    setTimelineYear(rounded);
    setTimelineSpeed(Math.abs(state.velocity));

    // Subtle audio clicks while dragging over centuries
    if (Math.abs(deltaX) > 4 && Math.round(nextYear) % 50 === 0) {
      causalityAudio.playHover();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const state = physicsRef.current;
    if (!state.isDragging) return;

    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
    state.isDragging = false;
    setTimelineScrubbing(false);
    causalityAudio.playTick();

    // Clamp high launch velocities to prevent physics explosion
    state.velocity = Math.max(-42, Math.min(42, state.velocity));
  };

  // Mouse Wheel Scrubbing Support
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const state = physicsRef.current;
    
    // Add velocity based on scroll delta
    const scrollForce = e.deltaY * 0.08;
    state.velocity = Math.max(-30, Math.min(30, state.velocity + scrollForce));
    
    if (!state.isDragging) {
      setTimelineScrubbing(true);
      // Automatically clear scrubbing state after a short delay of scroll inactivity
      const timer = (e as any)._scrollTimer;
      if (timer) clearTimeout(timer);
      (e as any)._scrollTimer = setTimeout(() => {
        setTimelineScrubbing(false);
      }, 350);
    }
  };

  // Keyboard Shortcuts Support (Left / Right Arrow scrubbing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentState !== "explore" || entranceProgress < 0.75) return;
      // Skip if typing in the search input
      if (document.activeElement?.tagName === "INPUT") return;

      const state = physicsRef.current;
      let handled = false;

      if (e.key === "ArrowLeft") {
        state.velocity = Math.max(-25, state.velocity - 4.5);
        handled = true;
      } else if (e.key === "ArrowRight") {
        state.velocity = Math.min(25, state.velocity + 4.5);
        handled = true;
      }

      if (handled) {
        setTimelineScrubbing(true);
        const timer = (physicsRef as any)._kbTimer;
        if (timer) clearTimeout(timer);
        (physicsRef as any)._kbTimer = setTimeout(() => {
          setTimelineScrubbing(false);
        }, 350);
        causalityAudio.playHover();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentState, entranceProgress]);

  // Format Year for display: BCE / CE morphing
  const yearVal = Math.abs(localYear);
  const digits = yearVal.toString().split("");
  const era = localYear < 0 ? "BC" : "CE";

  // Calculate pixel translation for the sliding ruler track
  // Moves opposite to drag direction to align the selected year with the central reticle
  const trackTranslation = -(localYear - startLimit) * YEAR_SCALE;

  const showTimeline = currentState === "explore" && entranceProgress >= 0.75;

  if (!showTimeline) return null;

  // Generate ruler tick marks programmatically (every 100 years)
  const ticks = [];
  for (let y = startLimit; y <= endLimit; y += 100) {
    const isMajor = y % 500 === 0;
    const isEraEnd = y === startLimit || y === endLimit || y === 2026;
    const offset = (y - startLimit) * YEAR_SCALE;

    ticks.push({
      year: y,
      isMajor,
      isEraEnd,
      offset,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl h-36 rounded-sm border border-white/10 bg-black/45 backdrop-blur-2xl shadow-3xl flex flex-col items-center justify-between p-4 px-8 pointer-events-auto select-none z-30 overflow-hidden"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* 1. TYPOGRAPHIC MORPHING YEAR INDICATOR */}
      <div className="flex flex-col items-center gap-0.5 pointer-events-none">
        <div className="flex items-center select-none">
          {digits.map((digit, idx) => (
            <Digit key={`${digits.length - idx}-${digit}`} char={digit} />
          ))}
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#d4af37] ml-2 font-sans font-medium">
            {era}
          </span>
        </div>
        <div className="text-[7.5px] tracking-[0.35em] uppercase text-white/35 font-serif">
          Time Travel Engine
        </div>
      </div>

      {/* 2. INFINITE DRAG INTERACTIVE SLIDER VIEWPORT */}
      <div 
        className="relative w-full h-14 overflow-hidden cursor-ew-resize select-none"
        style={{
          maskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)",
        }}
        ref={trackRef}
      >
        {/* Glowing Sight Center Reticle (Sight Glass) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#d4af37] via-[#d4af37]/65 to-transparent  -translate-x-1/2 pointer-events-none z-20" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#d4af37]  z-20 pointer-events-none" />

        {/* Sliding Ruler Track (Physical slide driven by physics offset) */}
        <div
          className="absolute inset-y-0 flex items-center"
          style={{
            transform: `translate3d(${trackTranslation}px, 0, 0)`,
            width: `${(endLimit - startLimit) * YEAR_SCALE}px`,
            left: "50%", // Anchor center of viewport
          }}
        >
          {/* Programmatic Tick Marks */}
          {ticks.map((tick) => (
            <div
              key={tick.year}
              className="absolute flex flex-col items-center justify-start h-full"
              style={{ left: `${tick.offset}px` }}
            >
              <div 
                className={`w-[1px] transition-all duration-300 ${
                  tick.isEraEnd 
                    ? "h-5 bg-[#d4af37]/80" 
                    : tick.isMajor 
                    ? "h-3.5 bg-white/40" 
                    : "h-2 bg-white/15"
                }`} 
              />
              {(tick.isMajor || tick.isEraEnd) && (
                <span className="text-[7.5px] font-sans text-white/30 tracking-widest mt-1 uppercase">
                  {Math.abs(tick.year)}
                </span>
              )}
            </div>
          ))}

          {/* Glowing Milestone Labels Floating on the Ruler */}
          {milestones.map((ms, index) => {
            const offset = (ms.year - startLimit) * YEAR_SCALE;
            const isActive = Math.abs(localYear - ms.year) < 120;
            // Alternate height to prevent text collision
            const verticalOffset = index % 2 === 0 ? "0px" : "-18px";

            return (
              <div
                key={`label-${ms.year}`}
                className="absolute flex flex-col items-center justify-end h-[48px] pointer-events-none"
                style={{ 
                  left: `${offset}px`,
                  transform: `translateX(-50%) translateY(${verticalOffset})`,
                  opacity: isActive ? 1 : 0.3
                }}
              >
                <span 
                  className={`text-[6.5px] tracking-[0.2em] font-serif uppercase text-center transition-all duration-500 whitespace-nowrap ${
                    isActive 
                      ? "text-[#d4af37] drop- font-semibold scale-110" 
                      : "text-white/20 scale-100"
                  }`}
                >
                  {ms.label}
                </span>
                <div className={`w-1 h-1 rounded-full mt-1.5 transition-all duration-500 ${isActive ? "bg-[#d4af37] scale-125 " : "bg-white/10"}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TACTILE INSTRUCTION/STATUS BAR */}
      <div className="text-[6.5px] tracking-[0.3em] text-white/25 uppercase font-sans flex items-center gap-1.5 pointer-events-none">
        <span>DRAG TO TRAVEL</span>
        <span className="w-1 h-1 rounded-full bg-white/10" />
        <span>SCROLL TO ZOOM TIME</span>
        <span className="w-1 h-1 rounded-full bg-white/10" />
        <span>ARROW KEYS SCRUB</span>
      </div>
    </motion.div>
  );
};
