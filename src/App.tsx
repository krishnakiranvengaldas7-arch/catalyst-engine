import { useEffect } from "react";
import { AnimationProvider } from "./providers/AnimationProvider";
import { ExperienceProvider } from "./providers/ExperienceProvider";
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
        <div className="relative w-full min-h-screen bg-[#050505] text-white selection:bg-[#d4af37]/30">
          
          {/* Ultra-minimal ambient noise background */}
          <div 
            className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
          />
          
          {/* Subtle central glow */}
          <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-white opacity-[0.015] blur-[100px] rounded-full mix-blend-screen" />
          </div>

          {/* Foreground Scrolling Content */}
          <div className="relative z-10 w-full min-h-screen flex flex-col">
            <HUD />
          </div>

          <CustomCursor />
        </div>
      </ExperienceProvider>
    </AnimationProvider>
  );
}

export default App;
