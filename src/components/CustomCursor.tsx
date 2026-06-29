import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useExperienceStore } from "../store/useExperienceStore";

export const CustomCursor: React.FC = () => {
  const hoveredNodeId = useExperienceStore((state) => state.hoveredNodeId);
  const nodes = useExperienceStore((state) => state.nodes);
  const setIsIdle = useExperienceStore((state) => state.setIsIdle);

  const hoveredNode = nodes.find((n) => n.id === hoveredNodeId);
  const importance = hoveredNode ? hoveredNode.importance : 0;

  const [cursorType, setCursorType] = useState<"default" | "hover" | "active">("default");
  const [isVisible, setIsVisible] = useState(false);

  // Mouse position coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth physics springs for the outer ring follower to give weight and inertia
  const springConfig = { stiffness: 350, damping: 28, mass: 0.5 };
  const ringX = useSpring(mouseX, springConfig);
  const ringY = useSpring(mouseY, springConfig);

  const idleTimer = useRef<any>(null);

  useEffect(() => {
    // Hide standard cursor
    document.documentElement.classList.add("custom-cursor-active");

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setIsIdle(true);
      }, 6000); // 6 seconds of inactivity triggers ambient intelligence
    };

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      resetIdleTimer();

      // Check if hovering over a clickable/interactive element
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === "BUTTON" || 
        target.tagName === "INPUT" || 
        target.closest("button") || 
        target.closest("input") || 
        target.closest(".cursor-pointer") ||
        target.getAttribute("data-hover") === "true";

      // Apply magnetic pull if near a hovered button or input
      let targetX = e.clientX;
      let targetY = e.clientY;

      if (isInteractive) {
        setCursorType("hover");
        const interactiveEl = target.closest("button, input, .cursor-pointer") || target;
        const rect = interactiveEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = centerX - e.clientX;
        const dy = centerY - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Subtly attract cursor to center of the button (magnetic effect)
        if (dist < 80) {
          targetX = e.clientX + dx * 0.38;
          targetY = e.clientY + dy * 0.38;
        }
      } else if (hoveredNodeId) {
        setCursorType("hover");
      } else {
        setCursorType("default");
      }

      mouseX.set(targetX);
      mouseY.set(targetY);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsIdle(true);
    };

    const handleMouseDown = () => {
      setCursorType("active");
      resetIdleTimer();
    };

    const handleMouseUp = () => {
      setCursorType("hover");
      resetIdleTimer();
    };

    const handleKeyDown = () => {
      resetIdleTimer();
    };

    const handleWheel = () => {
      resetIdleTimer();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    // Initial timer set
    resetIdleTimer();

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [hoveredNodeId, setIsIdle, mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Outer Ring Follower with physics spring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: cursorType === "hover" ? 42 * (1.0 + importance * 0.8) : cursorType === "active" ? 18 : 24,
          height: cursorType === "hover" ? 42 * (1.0 + importance * 0.8) : cursorType === "active" ? 18 : 24,
          borderColor: cursorType === "hover" ? "#d4af37" : cursorType === "active" ? "#ffffff" : "rgba(255, 255, 255, 0.35)",
          borderWidth: cursorType === "active" ? 2 : 1,
          boxShadow: cursorType === "hover" ? `0 0 ${12 + importance * 12}px rgba(212, 175, 55, 0.4)` : "0 0 0px transparent",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute rounded-full border border-solid pointer-events-none flex items-center justify-center"
      >
        {/* Tiny outer crosshair ticks on hover */}
        {cursorType === "hover" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 rounded-full border border-dashed border-[#d4af37]/40 animate-spin"
            style={{ animationDuration: "10s" }}
          />
        )}
      </motion.div>

      {/* Inner Dot (Glued directly to mouse position for zero-latency feedback) */}
      <motion.div
        style={{
          left: mouseX,
          top: mouseY,
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          scale: cursorType === "hover" ? 0.45 + importance * 0.45 : cursorType === "active" ? 1.4 : 1.0,
          backgroundColor: cursorType === "hover" ? "#d4af37" : "#ffffff",
          boxShadow: cursorType === "hover" ? `0 0 ${8 + importance * 8}px #d4af37` : "0 0 4px rgba(255, 255, 255, 0.5)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
      />
    </div>
  );
};
