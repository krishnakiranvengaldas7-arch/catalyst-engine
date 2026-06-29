import { useEffect } from "react";
import { AnimationProvider } from "./providers/AnimationProvider";
import { ExperienceProvider } from "./providers/ExperienceProvider";
import { Pipeline } from "./experience/Pipeline";
import { HUD } from "./components/HUD";
import { CustomCursor } from "./components/CustomCursor";
import { useExperienceStore } from "./store/useExperienceStore";
import { causalityAudio } from "./utils/sound";

function App() {
  const isPaused = useExperienceStore((state) => state.isPaused);
  const setIsPaused = useExperienceStore((state) => state.setIsPaused);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const activeEl = document.activeElement;
        // Don't intercept Space key if the user is currently typing in input boxes
        if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
          return;
        }
        e.preventDefault();
        const nextVal = !isPaused;
        setIsPaused(nextVal);
        causalityAudio.playTick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, setIsPaused]);

  return (
    <AnimationProvider>
      <ExperienceProvider>
        <div className="relative w-full h-screen bg-black overflow-hidden select-none">
          {/* Three.js WebGL Rendering Pipeline */}
          <Pipeline />

          {/* Premium UI Overlay HUD */}
          <HUD />

          {/* Elegant custom cursor and ambient controller */}
          <CustomCursor />
        </div>
      </ExperienceProvider>
    </AnimationProvider>
  );
}

export default App;
