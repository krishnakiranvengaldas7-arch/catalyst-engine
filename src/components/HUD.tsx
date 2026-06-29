import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useExperienceStore, type HistoricalNode } from "../store/useExperienceStore";
import { useExperience } from "../providers/ExperienceProvider";
import { useAnimation } from "../providers/AnimationProvider";
import { causalityAudio } from "../utils/sound";
import { TimelineControl } from "./TimelineControl";
import { aiExplanationService } from "../utils/aiExplanationService";


interface CausalResultRowProps {
  node: HistoricalNode;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

const CausalResultRow: React.FC<CausalResultRowProps> = ({ node, isSelected, onClick, index }) => {
  const influence = useMemo(() => {
    return 42 + node.connections.length * 15 + (node.title.length % 7) * 4;
  }, [node]);

  const particles = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 50;
      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 0.12,
        duration: 0.35 + Math.random() * 0.25,
      };
    });
  }, []);

  const titleChars = node.title.split("");

  return (
    <motion.div
      onClick={() => {
        causalityAudio.playClick();
        onClick();
      }}
      onPointerEnter={() => {
        causalityAudio.playHover();
      }}
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.65,
        delay: index * 0.04,
        type: 'spring', stiffness: 250, damping: 25, mass: 0.8
      }}
      className={`relative overflow-hidden flex justify-between items-center py-2.5 px-3.5 rounded-sm cursor-pointer transition-all duration-300 border ${
        isSelected
          ? "bg-[#d4af37]/10 border-[#d4af37]/35 text-white "
          : "bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
      }`}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[#d4af37] pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: "50%",
            top: "50%",
          }}
          initial={{ x: p.x, y: p.y, scale: 1.5, opacity: 1 }}
          animate={{ x: 0, y: 0, scale: 0, opacity: [1, 1, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            type: 'spring', stiffness: 250, damping: 25, mass: 0.8,
          }}
        />
      ))}

      <div className="flex flex-col gap-1 relative z-10">
        <span className="text-[10px] font-medium tracking-widest uppercase font-sans flex flex-wrap">
          {titleChars.map((char, charIdx) => (
            <motion.span
              key={charIdx}
              initial={{ scale: 0, filter: "brightness(4) drop-shadow(0 0 3px #d4af37)" }}
              animate={{ scale: 1, filter: "brightness(1) drop-shadow(0 0 0px transparent)" }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 24,
                delay: index * 0.04 + charIdx * 0.015,
              }}
              className="inline-block whitespace-pre text-white"
            >
              {char}
            </motion.span>
          ))}
        </span>

        <motion.div
          initial={{ scale: 0.9, filter: "brightness(2)" }}
          animate={{ scale: 1, filter: "brightness(1)" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            delay: index * 0.04 + 0.15,
          }}
          className="flex items-center gap-2"
        >
          <span className="text-[8px] tracking-wider uppercase text-white/40">
            {node.date}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full "
            style={{
              color:
                node.category === "science" ? "#f59e0b" :
                node.category === "politics" ? "#ef4444" :
                node.category === "arts" ? "#a855f7" :
                node.category === "disaster" ? "#ec4899" : "#3b82f6",
              backgroundColor: "currentColor"
            }}
          />
          <span className="text-[7.5px] tracking-widest uppercase text-white/35">
            {node.category}
          </span>
        </motion.div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="relative w-14 h-5 flex items-center justify-center">
          <svg className={`w-full h-full ${isSelected ? "text-[#d4af37]/80" : "text-white/20"}`} viewBox="0 0 100 30" fill="none">
            <motion.path
              d={`M 0 15 C 20 ${isSelected ? "2" : "15"}, 40 ${isSelected ? "28" : "15"}, 60 ${isSelected ? "5" : "15"}, 80 ${isSelected ? "25" : "15"}, 100 15`}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={isSelected ? "none" : "3 3"}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.8,
                delay: index * 0.04 + 0.2,
                ease: "easeOut",
              }}
            />
            {isSelected && (
              <motion.circle
                cx="100"
                cy="15"
                r="2"
                fill="#d4af37"
                animate={{ r: [2, 4, 2], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </svg>
        </div>

        <motion.div
          initial={{ scale: 0.8, filter: "brightness(2)" }}
          animate={{ scale: 1, filter: "brightness(1)" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 22,
            delay: index * 0.04 + 0.1,
          }}
          className="flex flex-col items-end"
        >
          <span className={`text-[10px] font-serif ${isSelected ? "text-[#d4af37] font-medium" : "text-white/50"}`}>
            {influence}%
          </span>
          <span className="text-[6.5px] tracking-widest uppercase text-white/30">
            Influence
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const HUD: React.FC = () => {
  const currentState = useExperienceStore((state) => state.currentState);
  const loadingText = useExperienceStore((state) => state.loadingText);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);
  const soundEnabled = useExperienceStore((state) => state.soundEnabled);
  const setSoundEnabled = useExperienceStore((state) => state.setSoundEnabled);
  const influenceMode = useExperienceStore((state) => state.influenceMode);
  const setInfluenceMode = useExperienceStore((state) => state.setInfluenceMode);
  const compareMode = useExperienceStore((state) => state.compareMode);
  const compareSourceNodeId = useExperienceStore((state) => state.compareSourceNodeId);
  const compareDisappearedNodeIds = useExperienceStore((state) => state.compareDisappearedNodeIds);
  const setCompareMode = useExperienceStore((state) => state.setCompareMode);
  const cinematicEffects = useExperienceStore((state) => state.cinematicEffects);
  const setCinematicEffects = useExperienceStore((state) => state.setCinematicEffects);

  // Cluster State Selectors
  const selectedClusterId = useExperienceStore((state) => state.selectedClusterId);
  const clusters = useExperienceStore((state) => state.clusters);
  const setSelectedClusterId = useExperienceStore((state) => state.setSelectedClusterId);

  // Search State Selectors
  const searchFocused = useExperienceStore((state) => state.searchFocused);
  const setSearchFocused = useExperienceStore((state) => state.setSearchFocused);
  const searchQuery = useExperienceStore((state) => state.searchQuery);
  const setSearchQuery = useExperienceStore((state) => state.setSearchQuery);
  const searchHistory = useExperienceStore((state) => state.searchHistory);
  const addSearchHistory = useExperienceStore((state) => state.addSearchHistory);
  const triggerKeystroke = useExperienceStore((state) => state.triggerKeystroke);
  
  const signatureSearchPhase = useExperienceStore((state) => state.signatureSearchPhase);
  const signatureSearchText = useExperienceStore((state) => state.signatureSearchText);
  const startSignatureSearch = useExperienceStore((state) => state.startSignatureSearch);
  const setSignatureSearchPhase = useExperienceStore((state) => state.setSignatureSearchPhase);
  
  const nodes = useExperienceStore((state) => state.nodes);
  const setActiveNodeId = useExperienceStore((state) => state.setActiveNodeId);
  const setCameraTarget = useExperienceStore((state) => state.setCameraTarget);
  const setCameraPosition = useExperienceStore((state) => state.setCameraPosition);
  
  const activeNodeId = useExperienceStore((state) => state.activeNodeId);
  const showFullChain = useExperienceStore((state) => state.showFullChain);
  const setShowFullChain = useExperienceStore((state) => state.setShowFullChain);

  // Reality Threads selectors
  const rippleActive = useExperienceStore((state) => state.rippleActive);
  const ripplePaused = useExperienceStore((state) => state.ripplePaused);
  const ripplePlaybackSpeed = useExperienceStore((state) => state.ripplePlaybackSpeed);
  const startRipple = useExperienceStore((state) => state.startRipple);
  const stopRipple = useExperienceStore((state) => state.stopRipple);
  const setRipplePaused = useExperienceStore((state) => state.setRipplePaused);
  const setRipplePlaybackSpeed = useExperienceStore((state) => state.setRipplePlaybackSpeed);
  const setRippleTime = useExperienceStore((state) => state.setRippleTime);

  // Butterfly Mode selectors
  const butterflyActive = useExperienceStore((state) => state.butterflyActive);
  const butterflyPaused = useExperienceStore((state) => state.butterflyPaused);
  const butterflyPlaybackSpeed = useExperienceStore((state) => state.butterflyPlaybackSpeed);
  const startButterfly = useExperienceStore((state) => state.startButterfly);
  const stopButterfly = useExperienceStore((state) => state.stopButterfly);
  const setButterflyPaused = useExperienceStore((state) => state.setButterflyPaused);
  const setButterflyPlaybackSpeed = useExperienceStore((state) => state.setButterflyPlaybackSpeed);
  const setButterflyTime = useExperienceStore((state) => state.setButterflyTime);

  // Automatically restart cascade ripple if active node changes while simulation is active
  useEffect(() => {
    if (rippleActive && activeNodeId) {
      startRipple(activeNodeId);
    }
  }, [activeNodeId]);

  // Automatically restart Butterfly Mode if active node changes while simulation is active
  useEffect(() => {
    if (butterflyActive && activeNodeId) {
      startButterfly(activeNodeId);
    }
  }, [activeNodeId]);

  const { startExploration } = useExperience();
  const { lenisRef } = useAnimation();

  // Component Refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Local UI States
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // AI Explanation Engine local UI states
  const [aiExplanationExpanded, setAiExplanationExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiExplanationData, setAiExplanationData] = useState<Record<string, string>>({});
  const [aiCurrentSection, setAiCurrentSection] = useState<string | null>(null);

  // RAG / API settings (stored in localStorage if set, otherwise fallback to mock)
  const [aiProvider, setAiProvider] = useState<"mock" | "openai" | "local">(() => {
    return (localStorage.getItem("catalyst_ai_provider") as any) || "mock";
  });
  const [aiOpenAIKey, setAiOpenAIKey] = useState(() => {
    return localStorage.getItem("catalyst_openai_key") || "";
  });
  const [aiLocalUrl, setAiLocalUrl] = useState(() => {
    return localStorage.getItem("catalyst_local_url") || "http://localhost:11434/api/generate";
  });
  const [showAiSettings, setShowAiSettings] = useState(false);

  // Save changes helper
  const handleSaveProvider = (provider: "mock" | "openai" | "local") => {
    setAiProvider(provider);
    localStorage.setItem("catalyst_ai_provider", provider);
  };

  const handleSaveOpenAIKey = (key: string) => {
    setAiOpenAIKey(key);
    localStorage.setItem("catalyst_openai_key", key);
  };

  const handleSaveLocalUrl = (url: string) => {
    setAiLocalUrl(url);
    localStorage.setItem("catalyst_local_url", url);
  };

  // Trigger AI causal analysis streaming when active node changes or panel is expanded
  useEffect(() => {
    if (!activeNodeId || !aiExplanationExpanded) {
      setAiExplanationData({});
      setAiCurrentSection(null);
      setAiLoading(false);
      setAiStreaming(false);
      return;
    }

    const activeNode = nodes.find(n => n.id === activeNodeId);
    if (!activeNode) return;

    setAiExplanationData({});
    setAiCurrentSection(null);
    setAiLoading(true);
    setAiStreaming(false);

    const cancelStream = aiExplanationService.streamExplanation(
      activeNode,
      (chunk) => {
        if (chunk.isDone) {
          setAiLoading(false);
          setAiStreaming(false);
          setAiCurrentSection(null);
          return;
        }

        if (chunk.text.startsWith("##SECTION_START##")) {
          setAiLoading(false);
          setAiStreaming(true);
          const parts = chunk.text.split("##");
          const sectionId = parts[2];
          setAiCurrentSection(sectionId);
          return;
        }

        if (chunk.text.startsWith("##SECTION_END##")) {
          return;
        }

        if (chunk.sectionIndex !== undefined) {
          const sections = ["root_causes", "immediate_effects", "long_term_effects", "unexpected_consequences", "hidden_connections", "modern_impact"];
          const sectionKey = sections[chunk.sectionIndex];
          
          setAiExplanationData((prev) => ({
            ...prev,
            [sectionKey]: chunk.text
          }));
        }
      },
      {
        provider: aiProvider,
        apiKey: aiOpenAIKey,
        localUrl: aiLocalUrl
      }
    );

    return () => {
      cancelStream();
    };
  }, [activeNodeId, aiExplanationExpanded, aiProvider, aiOpenAIKey, aiLocalUrl, nodes]);

  // Collapse AI panel when activeNodeId becomes null
  useEffect(() => {
    if (!activeNodeId) {
      setAiExplanationExpanded(false);
    }
  }, [activeNodeId]);

  // Render parsed citation text on the fly
  const renderParsedText = (text: string) => {
    if (!text) return null;
    
    const regex = /\[([^\]]+)\]\(citation:([^\)]+)\)/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const label = match[1];
      const targetNodeId = match[2];

      if (matchIndex > lastIndex) {
        elements.push(<span key={`txt-${matchIndex}`}>{text.substring(lastIndex, matchIndex)}</span>);
      }

      elements.push(
        <motion.button
          key={`cit-${matchIndex}`}
          onClick={(e) => {
            e.stopPropagation();
            causalityAudio.playClick();
            const targetNode = nodes.find(n => n.id === targetNodeId);
            if (targetNode) {
              setActiveNodeId(targetNode.id);
              setCameraTarget(targetNode.position);
              setCameraPosition([
                targetNode.position[0],
                targetNode.position[1] + 1.0,
                targetNode.position[2] + 4.5
              ]);
            }
          }}
          onPointerEnter={() => {
            causalityAudio.playHover();
          }}
          whileHover={{ scale: 1.04, y: -0.5, backgroundColor: "rgba(212,175,55,0.18)" }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-1 font-serif text-[#d4af37] hover:text-white transition-colors duration-200 border-b border-dashed border-[#d4af37]/45 hover:border-white cursor-pointer px-1.5 py-0.5 mx-0.5 rounded bg-[#d4af37]/5 hover:bg-[#d4af37]/20 text-[9px] leading-none align-middle font-semibold "
        >
          <svg className="w-2 h-2 fill-current opacity-70" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          {label}
        </motion.button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(<span key={`txt-end`}>{text.substring(lastIndex)}</span>);
    }

    return <>{elements}</>;
  };




  const placeholders = [
    "What caused the Renaissance?",
    "What created Artificial Intelligence?",
    "Why did Rome collapse?",
    "What led to World War II?",
    "What changed after Electricity?",
    "What caused Bitcoin?",
  ];

  // Rotate placeholders every 4.8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4800);
    return () => clearInterval(interval);
  }, []);

  // Track cursor offsets for the 3D parallax drift effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const yLimitRatio = window.innerHeight > 0 ? (e.clientY / window.innerHeight) * 2 - 1 : 0;
      setMouseOffset({ x: nx, y: yLimitRatio });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Scroll/Swipe initiated entrance trigger
  useEffect(() => {
    if (currentState !== "intro") return;

    const trigger = () => {
      startExploration();
    };

    window.addEventListener("wheel", trigger, { passive: true });
    window.addEventListener("touchmove", trigger, { passive: true });

    const lenis = lenisRef?.current;
    if (lenis) {
      lenis.on("scroll", trigger);
    }

    return () => {
      window.removeEventListener("wheel", trigger);
      window.removeEventListener("touchmove", trigger);
      if (lenis) {
        lenis.off("scroll", trigger);
      }
    };
  }, [currentState, startExploration, lenisRef]);

  // Autocomplete filtering based on query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return nodes.filter(
      (node) =>
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, nodes]);

  // Handle selected prediction index clamping
  const maxIndex = searchQuery.trim()
    ? filteredResults.length
    : searchHistory.length + 3; // Recent searches + 3 trending items

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Execute a search query and trigger camera flight
  const executeSearch = (queryText: string) => {
    if (!queryText.trim()) return;

    // Find closest node match
    const match = nodes.find(
      (n) =>
        n.title.toLowerCase().includes(queryText.toLowerCase()) ||
        queryText.toLowerCase().includes(n.title.toLowerCase())
    );

    if (match) {
      let cinematicText = `This is why ${match.title} happened.`;
      
      // Custom overrides for goosebump moments
      if (match.id === "artificial_intelligence") {
        cinematicText = "This is why modern AI exists.";
      } else if (match.id === "fall_of_rome") {
        cinematicText = "This is why Rome fell.";
      } else if (match.id === "digital_revolution" || match.id === "internet") {
        cinematicText = "This is why the Internet happened.";
      } else if (match.id === "printing_press") {
        cinematicText = "This is why knowledge became free.";
      }
      
      startSignatureSearch(match.id, cinematicText);
    }

    addSearchHistory(queryText);
    setSearchQuery("");
    setSearchFocused(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchFocused(false);
      if (inputRef.current) inputRef.current.blur();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % maxIndex);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + maxIndex) % maxIndex);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      
      // If we have text query and predictions
      if (searchQuery.trim()) {
        if (filteredResults.length > 0 && selectedIndex < filteredResults.length) {
          executeSearch(filteredResults[selectedIndex].title);
        } else {
          executeSearch(searchQuery);
        }
      } else {
        // Empty query: select history or trending
        const trendingItems = [
          "What created Artificial Intelligence?",
          "Why did Rome collapse?",
          "What caused the Renaissance?"
        ];
        
        if (selectedIndex < searchHistory.length) {
          executeSearch(searchHistory[selectedIndex]);
        } else {
          const trendIdx = selectedIndex - searchHistory.length;
          if (trendIdx < trendingItems.length) {
            executeSearch(trendingItems[trendIdx]);
          }
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    triggerKeystroke(); // Trigger 3D ripples
  };

  // 3D Parallax floating drift transform calculation
  const getFloatingStyle = () => {
    // Constant slow float
    const t = Date.now() * 0.001;
    const driftX = Math.sin(t * 0.9) * 4.5;
    const driftY = Math.cos(t * 1.1) * 3.0;

    // Direct cursor pull banking
    const rx = mouseOffset.y * -8.0 + driftY * 0.2;
    const ry = mouseOffset.x * 12.0 + driftX * 0.2;
    const tx = mouseOffset.x * 18.0 + driftX;
    const ty = mouseOffset.y * -12.0 + driftY;
    const tz = searchFocused ? 18.0 : 0.0; // Zoom forward slightly in 3D space when focused

    return {
      transform: `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, ${tz}px)`,
      transition: "transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
    };
  };

  const showSearchBar = currentState === "explore" && entranceProgress >= 0.75;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-6 md:p-12">
      {/* Blinking Caret Inline Styles */}
      <style>{`
        @keyframes caret-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-caret {
          animation: caret-blink 0.9s steps(2, start) infinite;
        }
      `}</style>

      {/* CINEMATIC LOADING OVERLAY */}
      <AnimatePresence>
        {currentState === "loading" && (
          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none bg-transparent">
            <AnimatePresence mode="wait">
              {loadingText && (
                <motion.div
                  key={loadingText}
                  initial={{ opacity: 0, letterSpacing: "0.15em", filter: "blur(6px)" }}
                  animate={{ opacity: 0.85, letterSpacing: "0.3em", filter: "blur(0px)" }}
                  exit={{ opacity: 0, letterSpacing: "0.45em", filter: "blur(10px)" }}
                  transition={{
                    opacity: { duration: 0.8, ease: "easeOut" },
                    letterSpacing: { duration: 1.2, ease: "easeOut" },
                    filter: { duration: 0.8, ease: "easeOut" },
                  }}
                  className="text-center select-none ml-[0.3em]"
                >
                  <span className="font-serif text-sm md:text-base uppercase tracking-[inherit] text-[#d4af37] drop-">
                    {loadingText}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* 3D FLOATING SEARCH BAR INSTRUMENT */}
      <AnimatePresence>
        {showSearchBar && (
          <motion.div
            initial={{ clipPath: "inset(0% 50% 0% 50% rounded 9999px)", scale: 0.9 }}
            animate={{ clipPath: "inset(0% 0% 0% 0% rounded 9999px)", scale: 1 }}
            exit={{ clipPath: "inset(0% 50% 0% 50% rounded 9999px)", scale: 0.9 }}
            transition={{ duration: 1.2, type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-auto z-30 flex flex-col gap-2"
            ref={searchContainerRef}
            style={getFloatingStyle()}
          >
            {/* Search Pill Bar */}
            <div 
              className={`w-full bg-black/45 backdrop-blur-xl border rounded-full py-3 px-5 flex items-center gap-4  transition-all duration-300 pointer-events-auto ${
                searchFocused 
                  ? "border-[#d4af37]/60 " 
                  : "border-white/10 hover:border-white/20 hover:"
              }`}
            >
              {/* Glowing Search Icon */}
              <svg 
                className={`w-4 h-4 transition-colors duration-300 ${searchFocused ? "text-[#d4af37]" : "text-[#d4af37]/65"}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Custom Caret Input Wrapper */}
              <div className="relative w-full flex items-center h-5">
                {/* Opaque focused hidden input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 240)}
                  onKeyDown={handleKeyDown}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text pointer-events-auto z-10 border-none outline-none"
                  ref={inputRef}
                />

                {/* Premium Typographic Render Layer */}
                <div className="text-[11px] tracking-[0.2em] uppercase font-sans font-light flex items-center pointer-events-none select-none w-full h-full text-white">
                  {searchQuery ? (
                    <span className="flex items-center flex-wrap">
                      {searchQuery.split("").map((char, index) => (
                        <motion.span
                          key={index}
                          initial={{ scale: 0.5, filter: "brightness(3) drop-shadow(0 0 2px #d4af37)" }}
                          animate={{ scale: 1, filter: "brightness(1) drop-shadow(0 0 0px transparent)" }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className="inline-block whitespace-pre text-white"
                        >
                          {char}
                        </motion.span>
                      ))}
                      {/* Blinking Golden Caret */}
                      <span className="w-[2px] h-3.5 bg-[#d4af37] ml-0.5  animate-caret" />
                    </span>
                  ) : (
                    <span className="text-white/25 flex items-center">
                      {placeholders[placeholderIndex]}
                      {/* Faint caret */}
                      <span className="w-[1px] h-3.5 bg-white/20 ml-1 animate-caret" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* FLOATING PREDICTION / DISCOVERY PANEL */}
            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  initial={{ clipPath: "inset(0% 0% 100% 0% rounded 16px)", scale: 0.96 }}
                  animate={{ clipPath: "inset(0% 0% 0% 0% rounded 16px)", scale: 1 }}
                  exit={{ clipPath: "inset(0% 0% 100% 0% rounded 16px)", scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-sm p-4 shadow-3xl flex flex-col gap-3 pointer-events-auto"
                >
                  {searchQuery.trim() ? (
                    /* 1. QUERY RESULTS */
                    <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
                      <div className="text-[8px] tracking-[0.25em] text-[#d4af37]/60 font-serif uppercase mb-1">
                        Causal Predictions ({filteredResults.length})
                      </div>
                      
                      {filteredResults.length > 0 ? (
                        filteredResults.map((node: HistoricalNode, index: number) => (
                          <CausalResultRow
                            key={node.id}
                            node={node}
                            isSelected={index === selectedIndex}
                            onClick={() => executeSearch(node.title)}
                            index={index}
                          />
                        ))
                      ) : (
                        <div className="text-[9px] tracking-widest uppercase text-white/30 text-center py-4">
                          No realities found matching query
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 2. DISCOVERY PANEL (Empty Query - History & Trends) */
                    <div className="flex flex-col gap-4">
                      {/* Recent Searches */}
                      {searchHistory.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[8px] tracking-[0.25em] text-white/40 font-serif uppercase">
                            Recent Searches
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {searchHistory.map((query, index) => {
                              const isSelected = index === selectedIndex;
                              return (
                                <motion.span
                                  key={index}
                                  initial={{ scale: 0, filter: "brightness(2)" }}
                                  animate={{ scale: 1, filter: "brightness(1)" }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 450,
                                    damping: 24,
                                    delay: index * 0.03,
                                  }}
                                  onClick={() => executeSearch(query)}
                                  className={`text-[8.5px] tracking-wider uppercase px-2.5 py-1 rounded-full cursor-pointer border transition-all duration-200 ${
                                    isSelected
                                      ? "bg-[#d4af37]/15 border-[#d4af37]/40 text-white "
                                      : "bg-white/5 border-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  {query}
                                </motion.span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Trending Discoveries */}
                      <div className="flex flex-col gap-2">
                        <div className="text-[8px] tracking-[0.25em] text-[#d4af37]/60 font-serif uppercase">
                          Trending Discoveries
                        </div>
                        <div className="flex flex-col gap-1">
                          {[
                            "What created Artificial Intelligence?",
                            "Why did Rome collapse?",
                            "What caused the Renaissance?"
                          ].map((trend, idx) => {
                            const actualIdx = searchHistory.length + idx;
                            const isSelected = actualIdx === selectedIndex;
                            return (
                              <motion.div
                                key={idx}
                                initial={{ scale: 0.95, filter: "brightness(2)" }}
                                animate={{ scale: 1, filter: "brightness(1)" }}
                                transition={{
                                  type: "spring",
                                  stiffness: 450,
                                  damping: 24,
                                  delay: idx * 0.04,
                                }}
                                onClick={() => executeSearch(trend)}
                                className={`flex items-center justify-between py-1.5 px-2.5 rounded-sm cursor-pointer transition-all duration-200 border text-[9.5px] uppercase tracking-widest ${
                                  isSelected
                                    ? "bg-[#d4af37]/10 border-[#d4af37]/25 text-white"
                                    : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span className="font-sans font-light">{trend}</span>
                                <svg className="w-3 h-3 text-[#d4af37]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER INTRO SCREEN (Clean Cinematic Title) */}
      <AnimatePresence>
        {(currentState === "intro" || (currentState === "explore" && entranceProgress < 0.2)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(12px)", scale: 1.05 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none px-4 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)] backdrop-blur-sm"
          >
            {/* Tagline Phase 1 */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 2.0, ease: "easeOut" }}
              className="text-[8px] uppercase tracking-[0.5em] text-[#d4af37]/80 font-serif whitespace-nowrap mb-4 pl-[0.5em]"
            >
              EVERYTHING IS CONNECTED
            </motion.div>

            {/* Title Phase 2 (Staggered Letters) */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.12,
                    delayChildren: 1.2,
                  },
                },
              }}
              className="flex items-center justify-center pl-[0.35em]"
            >
              {"CATALYST".split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={{
                    hidden: { opacity: 0, filter: "blur(8px)", scale: 1.1 },
                    visible: { opacity: 1, filter: "blur(0px)", scale: 1 },
                  }}
                  transition={{ duration: 2.0, ease: "easeOut" }}
                  className="font-serif text-5xl md:text-7xl tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 select-none drop-"
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>

            {/* Context Subtitle Phase 3 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 2.0, ease: "easeOut" }}
              className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-sans mt-5 font-light pl-[0.2em]"
            >
              An Interactive Observatory of Cause and Effect
            </motion.div>

            {/* Scroll Indicator (Minimalist Animated Line) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.0, duration: 2.0 }}
              className="absolute bottom-16 flex flex-col items-center gap-2 select-none"
            >
              <div className="w-[1px] h-12 bg-white/10 relative overflow-hidden">
                <motion.div
                  animate={{ y: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-transparent via-[#d4af37] to-transparent "
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CINEMATIC LIGHT-SCULPTED CAUSALITY PANEL */}
      <AnimatePresence>
        {currentState === "explore" && activeNodeId && (
          (() => {
            const activeNode = nodes.find((n) => n.id === activeNodeId);
            if (!activeNode) return null;

            // Gather immediate causes and consequences
            const causes = activeNode.incomingCauses.map(id => nodes.find(n => n.id === id)).filter(Boolean) as HistoricalNode[];
            const consequences = activeNode.outgoingConsequences.map(id => nodes.find(n => n.id === id)).filter(Boolean) as HistoricalNode[];

            // Determine long-term consequences (deeper generation consequences)
            const longTermConsequences = consequences.flatMap(c => 
              c.outgoingConsequences.map(id => nodes.find(n => n.id === id)).filter(Boolean)
            ) as HistoricalNode[];

            // Find related discoveries (same category, excluding self)
            const related = nodes.filter(n => n.category === activeNode.category && n.id !== activeNode.id).slice(0, 2);

            // Staggered particle reconstruction array for panel materialization
            const reconstructionParticles = Array.from({ length: 22 }).map((_, i) => ({
              id: i,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              size: Math.random() * 2 + 1,
              delay: Math.random() * 0.7,
              duration: 0.9 + Math.random() * 0.9,
              yOffset: -30 - Math.random() * 60,
            }));

            return (
              <motion.div
                initial={{ opacity: 0, x: -60, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -40, filter: "blur(8px)" }}
                transition={{ duration: 1.0, type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
                className="absolute left-0 top-0 bottom-0 w-full max-w-sm bg-black/85 backdrop-blur-md z-25 pointer-events-auto flex flex-col justify-between p-8 pt-24 overflow-hidden"
              >
                {/* Panel Particle Reconstruction Overlay */}
                {reconstructionParticles.map((p) => (
                  <motion.span
                    key={p.id}
                    className="absolute rounded-full bg-[#d4af37] pointer-events-none z-0"
                    style={{
                      width: p.size,
                      height: p.size,
                      left: p.left,
                      top: p.top,
                    }}
                    initial={{ opacity: 0, y: 40, scale: 0 }}
                    animate={{ 
                      opacity: [0, 0.95, 0], 
                      y: [40, p.yOffset], 
                      scale: [0, 1.6, 0] 
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* Glowing Laser Divider Line */}
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#d4af37]/35 to-transparent  pointer-events-none" />

                 {/* Content Container (Scrollable) */}
                <div className="flex flex-col gap-5 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden relative z-10">
                  {/* Category & Date Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[9px] uppercase tracking-[0.3em] font-serif text-[#d4af37]">
                      {activeNode.date}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{
                      backgroundColor: 
                        activeNode.category === "science" ? "#f59e0b" :
                        activeNode.category === "politics" ? "#ef4444" :
                        activeNode.category === "arts" ? "#a855f7" :
                        activeNode.category === "disaster" ? "#ec4899" : "#3b82f6"
                    }} />
                    <span className="text-[8px] uppercase tracking-widest text-white/45">
                      {activeNode.category}
                    </span>
                  </motion.div>

                  {/* Event Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl font-serif tracking-widest text-white uppercase mt-1 leading-tight drop-"
                  >
                    {activeNode.title}
                  </motion.h1>

                  {/* Progressive Causal Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-4 border-y border-white/5 py-4.5 mt-1"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[7.5px] tracking-wider uppercase text-white/35">Influence Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-serif text-[#d4af37] font-medium">{activeNode.influenceScore}%</span>
                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeNode.influenceScore}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                            className="h-full bg-[#d4af37] "
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[7.5px] tracking-wider uppercase text-white/35">Timeline Position</span>
                      <span className="text-[9.5px] font-sans font-light tracking-wide text-white/80 leading-snug truncate" title={activeNode.timelinePosition}>
                        {activeNode.timelinePosition}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[7.5px] tracking-wider uppercase text-white/35">Causal Weight</span>
                      <span className="text-xs font-serif text-white/70">{(activeNode.importance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[7.5px] tracking-wider uppercase text-white/35">Confidence Index</span>
                      <span className="text-xs font-serif text-white/70">{(activeNode.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                  </motion.div>

                  {/* Summary Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col gap-1"
                  >
                    <span className="text-[8px] tracking-widest uppercase text-[#d4af37] font-serif">Summary</span>
                    <p className="text-[11px] font-sans font-light tracking-wide text-white/80 leading-relaxed">
                      {activeNode.description}
                    </p>
                  </motion.div>

                  {/* Historical Context */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-1"
                  >
                    <span className="text-[8px] tracking-widest uppercase text-[#d4af37] font-serif">Historical Context</span>
                    <p className="text-[11px] font-sans font-light tracking-wide text-white/75 leading-relaxed italic border-l-2 border-[#d4af37]/45 pl-3">
                      {activeNode.historicalContext}
                    </p>
                  </motion.div>

                  {/* AI Explanation Engine Section ("Why did this matter?") */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                    className="flex flex-col gap-2 border border-[#d4af37]/25 rounded-sm bg-[#d4af37]/[0.02]  overflow-hidden transition-all duration-300"
                  >
                    {/* Header Toggle */}
                    <div 
                      onClick={() => {
                        causalityAudio.playClick();
                        setAiExplanationExpanded(!aiExplanationExpanded);
                      }}
                      className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-[#d4af37]/5 transition-colors duration-300 select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex items-center justify-center">
                          {aiStreaming ? (
                            <span className="absolute flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
                            </span>
                          ) : (
                            <svg className="w-4 h-4 text-[#d4af37] drop-" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.1V17m0-9a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V8m0 0a4 4 0 118 0 4 4 0 01-8 0z" />
                            </svg>
                          )}
                          {aiStreaming && <div className="w-4 h-4" />} {/* Spacer */}
                        </div>
                        <span className="text-[11px] font-serif tracking-[0.2em] uppercase text-white/90 font-medium">
                          Why did this matter?
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Settings Button */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            causalityAudio.playClick();
                            setShowAiSettings(!showAiSettings);
                          }}
                          whileHover={{ scale: 1.15, rotate: 30 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-white/45 hover:text-[#d4af37] transition-colors duration-200 p-1 rounded-md hover:bg-white/5 cursor-pointer"
                          title="Explanation Engine Settings"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                          </svg>
                        </motion.button>

                        {/* Expand Chevron */}
                        <motion.div
                          animate={{ rotate: aiExplanationExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-[#d4af37]/70"
                        >
                          <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>

                    {/* Expandable Panel Body */}
                    <AnimatePresence initial={false}>
                      {aiExplanationExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
                          className="border-t border-[#d4af37]/15 bg-black/40 backdrop-blur-md"
                        >
                          <div className="p-4 flex flex-col gap-4.5">
                            {/* Settings Panel Overlay */}
                            {showAiSettings && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-sm border border-white/10 bg-white/[0.03] flex flex-col gap-3 relative z-20 text-[10px] pointer-events-auto"
                              >
                                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                                  <span className="font-serif tracking-widest text-[#d4af37] uppercase font-semibold">Engine Configuration</span>
                                  <button onClick={() => setShowAiSettings(false)} className="text-white/45 hover:text-white uppercase text-[8px] tracking-wider cursor-pointer">Close</button>
                                </div>

                                {/* Provider Select */}
                                <div className="flex flex-col gap-1">
                                  <span className="text-white/40 uppercase tracking-wider text-[7.5px]">Causal Intelligence Source</span>
                                  <div className="flex gap-1 bg-black/40 p-0.5 rounded-sm border border-white/5">
                                    {(["mock", "openai", "local"] as const).map((p) => (
                                      <button
                                        key={p}
                                        onClick={() => handleSaveProvider(p)}
                                        className={`flex-1 py-1 rounded-md text-center text-[8px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                          aiProvider === p 
                                            ? "bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 font-medium" 
                                            : "text-white/50 hover:text-white hover:bg-white/5"
                                        }`}
                                      >
                                        {p === "mock" ? "Historian Core" : p === "openai" ? "OpenAI RAG" : "Local Ollama"}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* OpenAI Options */}
                                {aiProvider === "openai" && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1">
                                    <span className="text-white/40 uppercase tracking-wider text-[7.5px]">OpenAI API Key</span>
                                    <input
                                      type="password"
                                      value={aiOpenAIKey}
                                      onChange={(e) => handleSaveOpenAIKey(e.target.value)}
                                      placeholder="sk-proj-..."
                                      className="bg-black/60 border border-white/10 rounded-sm px-2.5 py-1.5 text-white placeholder-white/20 focus:outline-none focus:border-[#d4af37]/50 w-full text-[9px] pointer-events-auto"
                                    />
                                    <span className="text-white/25 text-[7px] leading-normal mt-0.5">Your key is stored locally in your browser and sent directly to OpenAI.</span>
                                  </motion.div>
                                )}

                                {/* Local Ollama Options */}
                                {aiProvider === "local" && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1">
                                    <span className="text-white/40 uppercase tracking-wider text-[7.5px]">Inference Endpoint URL</span>
                                    <input
                                      type="text"
                                      value={aiLocalUrl}
                                      onChange={(e) => handleSaveLocalUrl(e.target.value)}
                                      placeholder="http://localhost:11434/api/generate"
                                      className="bg-black/60 border border-white/10 rounded-sm px-2.5 py-1.5 text-white focus:outline-none focus:border-[#d4af37]/50 w-full text-[9px] pointer-events-auto"
                                    />
                                    <span className="text-white/25 text-[7px] leading-normal mt-0.5">Ensure your local inference server (e.g. Ollama or Llama.cpp) is running and CORS is enabled.</span>
                                  </motion.div>
                                )}
                              </motion.div>
                            )}

                            {/* Loading Skeletons */}
                            {aiLoading ? (
                              <div className="flex flex-col gap-4">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex flex-col gap-2 animate-pulse">
                                    <div className="h-3 bg-[#d4af37]/15 rounded-md w-1/3" />
                                    <div className="h-2 bg-white/5 rounded-md w-full" />
                                    <div className="h-2 bg-white/5 rounded-md w-5/6" />
                                    {i === 1 && <div className="h-2 bg-white/5 rounded-md w-4/5" />}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Curated Scholarly Causal Sections
                              <div className="flex flex-col gap-5 relative z-10">
                                {[
                                  { key: "root_causes", title: "Root Causes" },
                                  { key: "immediate_effects", title: "Immediate Effects" },
                                  { key: "long_term_effects", title: "Long-Term Effects" },
                                  { key: "unexpected_consequences", title: "Unexpected Consequences" },
                                  { key: "hidden_connections", title: "Hidden Connections" },
                                  { key: "modern_impact", title: "Modern Impact" }
                                ].map((sec) => {
                                  const text = aiExplanationData[sec.key] || "";
                                  if (!text && aiCurrentSection !== sec.key) return null;

                                  return (
                                    <motion.div
                                      key={sec.key}
                                      initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
                                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                      transition={{ duration: 0.6, ease: "easeOut" }}
                                      className="flex flex-col gap-1.5 group"
                                    >
                                      {/* Section Title */}
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/80 group-hover:scale-125 transition-transform duration-300" />
                                        <span className="text-[8.5px] tracking-[0.25em] uppercase text-[#d4af37] font-serif font-semibold">
                                          {sec.title}
                                        </span>
                                      </div>

                                      {/* Section Paragraph Body */}
                                      <div className="text-[10.5px] font-sans font-light tracking-wide text-white/85 leading-relaxed pl-3 border-l border-white/5 group-hover:border-[#d4af37]/20 transition-colors duration-300">
                                        {renderParsedText(text)}
                                        
                                        {/* Blinking Dot Cursor on Currently Streaming Section */}
                                        {aiCurrentSection === sec.key && (
                                          <span className="inline-block w-1.5 h-1.5 bg-[#d4af37] rounded-full ml-1 animate-pulse" />
                                        )}
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Related Discoveries */}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col gap-1.5"
                  >
                    <span className="text-[8px] tracking-widest uppercase text-[#d4af37] font-serif">Related Discoveries</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeNode.relatedDiscoveries.map((disc, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 + idx * 0.06 }}
                          className="text-[8px] tracking-wider uppercase px-2.5 py-1 bg-white/[0.03] border border-white/5 text-white/65 rounded-full hover:bg-white/10 hover:text-white transition-all duration-200"
                        >
                          {disc}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Causal Node Navigation Section */}
                  <div className="flex flex-col gap-4 mt-2 border-t border-white/5 pt-4">
                    {causes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, type: 'spring', stiffness: 250, damping: 25, mass: 0.8, duration: 0.8 }}
                        className="flex flex-col gap-1.5"
                      >
                        <span className="text-[8px] tracking-[0.3em] uppercase text-white/40 font-serif">Causes (Incoming)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {causes.map((c, idx) => (
                            <motion.button
                              key={c.id}
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{
                                delay: 0.45 + idx * 0.04,
                                type: 'spring', stiffness: 250, damping: 25, mass: 0.8,
                                duration: 0.5
                              }}
                              onClick={() => {
                                causalityAudio.playClick();
                                setActiveNodeId(c.id);
                                setCameraTarget(c.position);
                                setCameraPosition([c.position[0], c.position[1] + 1.0, c.position[2] + 4.5]);
                              }}
                              onPointerEnter={() => {
                                causalityAudio.playHover();
                              }}
                              whileHover={{ scale: 0.96, y: 0.5, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
                              whileTap={{ scale: 0.92, y: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                              className="text-[8px] tracking-widest uppercase px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-md text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
                            >
                              {c.title}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {consequences.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 250, damping: 25, mass: 0.8, duration: 0.8 }}
                        className="flex flex-col gap-1.5"
                      >
                        <span className="text-[8px] tracking-[0.3em] uppercase text-white/40 font-serif">Immediate Consequences</span>
                        <div className="flex flex-wrap gap-1.5">
                          {consequences.map((c, idx) => (
                            <motion.button
                              key={c.id}
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{
                                delay: 0.5 + idx * 0.04,
                                type: 'spring', stiffness: 250, damping: 25, mass: 0.8,
                                duration: 0.5
                              }}
                              onClick={() => {
                                causalityAudio.playClick();
                                setActiveNodeId(c.id);
                                setCameraTarget(c.position);
                                setCameraPosition([c.position[0], c.position[1] + 1.0, c.position[2] + 4.5]);
                              }}
                              onPointerEnter={() => {
                                causalityAudio.playHover();
                              }}
                              whileHover={{ scale: 0.96, y: 0.5, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
                              whileTap={{ scale: 0.92, y: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                              className="text-[8px] tracking-widest uppercase px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-md text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
                            >
                              {c.title}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {longTermConsequences.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, type: 'spring', stiffness: 250, damping: 25, mass: 0.8, duration: 0.8 }}
                        className="flex flex-col gap-1.5"
                      >
                        <span className="text-[8px] tracking-[0.3em] uppercase text-white/40 font-serif">Long-Term Consequences</span>
                        <div className="flex flex-wrap gap-1.5">
                          {longTermConsequences.map((c, idx) => (
                            <motion.button
                              key={c.id}
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{
                                delay: 0.55 + idx * 0.04,
                                type: 'spring', stiffness: 250, damping: 25, mass: 0.8,
                                duration: 0.5
                              }}
                              onClick={() => {
                                causalityAudio.playClick();
                                setActiveNodeId(c.id);
                                setCameraTarget(c.position);
                                setCameraPosition([c.position[0], c.position[1] + 1.0, c.position[2] + 4.5]);
                              }}
                              onPointerEnter={() => {
                                causalityAudio.playHover();
                              }}
                              whileHover={{ scale: 0.96, y: 0.5, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
                              whileTap={{ scale: 0.92, y: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                              className="text-[8px] tracking-widest uppercase px-2.5 py-1.5 bg-white/[0.02] border border-white/5 rounded-md text-white/45 hover:text-white transition-colors duration-200 cursor-pointer"
                            >
                              {c.title}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {related.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 250, damping: 25, mass: 0.8, duration: 0.8 }}
                        className="flex flex-col gap-1.5"
                      >
                        <span className="text-[8px] tracking-[0.3em] uppercase text-white/40 font-serif">Connected Realities</span>
                        <div className="flex flex-wrap gap-1.5">
                          {related.map((r, idx) => (
                            <motion.button
                              key={r.id}
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{
                                delay: 0.6 + idx * 0.04,
                                type: 'spring', stiffness: 250, damping: 25, mass: 0.8,
                                duration: 0.5
                              }}
                              onClick={() => {
                                causalityAudio.playClick();
                                setActiveNodeId(r.id);
                                setCameraTarget(r.position);
                                setCameraPosition([r.position[0], r.position[1] + 1.0, r.position[2] + 4.5]);
                              }}
                              onPointerEnter={() => {
                                causalityAudio.playHover();
                              }}
                              whileHover={{ scale: 0.96, y: 0.5, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
                              whileTap={{ scale: 0.92, y: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                              className="text-[8px] tracking-wider uppercase px-2.5 py-1 bg-white/5 border border-white/5 rounded-md text-white/55 hover:text-white transition-colors duration-200 cursor-pointer"
                            >
                              {r.title}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6 border-t border-white/5 pt-4 flex flex-col gap-2.5 relative z-10"
                >
                  {/* Butterfly Mode Section */}
                  {!butterflyActive ? (
                    <div className="flex flex-col gap-2.5 w-full">
                      <motion.button
                        onClick={() => {
                          causalityAudio.playButterfly();
                          startButterfly(activeNodeId!);
                        }}
                        whileHover={{ scale: 0.98, y: 0.5, boxShadow: "0 2px 15px rgba(99, 102, 241, 0.25)" }}
                        whileTap={{ scale: 0.95, y: 1.5, boxShadow: "0 1px 2px rgba(99, 102, 241, 0.1)" }}
                        transition={{ type: "spring", stiffness: 450, damping: 18 }}
                        className="w-full py-3 px-4 rounded-sm border border-indigo-500/30 bg-indigo-500/10 text-white/50 uppercase tracking-[0.18em] text-[8.5px] font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:bg-indigo-500/20 hover:border-indigo-500/50 "
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                        </span>
                        What if this never happened?
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          causalityAudio.playRipple();
                          setCompareMode(true, activeNodeId!);
                        }}
                        whileHover={{ scale: 0.98, y: 0.5, boxShadow: "0 2px 15px rgba(212, 175, 55, 0.25)" }}
                        whileTap={{ scale: 0.95, y: 1.5, boxShadow: "0 1px 2px rgba(212, 175, 55, 0.1)" }}
                        transition={{ type: "spring", stiffness: 450, damping: 18 }}
                        className="w-full py-3 px-4 rounded-sm border border-[#d4af37]/30 bg-[#d4af37]/10 text-amber-200 uppercase tracking-[0.18em] text-[8.5px] font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#d4af37]/20 hover:border-[#d4af37]/50 "
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d4af37]"></span>
                        </span>
                        Compare realities
                      </motion.button>
                    </div>
                  ) : (
                    <div className="w-full bg-indigo-950/25 border border-indigo-500/25 rounded-sm px-2.5 py-1.5 flex items-center justify-between gap-1  backdrop-blur-md">
                      {/* Play/Pause Button */}
                      <motion.button
                        onClick={() => {
                          causalityAudio.playTick();
                          setButterflyPaused(!butterflyPaused);
                        }}
                        whileHover={{ scale: 1.15, y: -0.5 }}
                        whileTap={{ scale: 0.9, y: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        title={butterflyPaused ? "Resume Rewrite" : "Pause Rewrite"}
                        className="flex items-center justify-center p-1.5 rounded-sm hover:bg-white/10 text-white/50/80 hover:text-white transition-colors duration-200 cursor-pointer w-7 h-7"
                      >
                        {butterflyPaused ? (
                          <svg className="w-3.5 h-3.5 fill-current text-white/60" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 fill-current text-white/60" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        )}
                      </motion.button>

                      {/* Rewind/Reset Button */}
                      <motion.button
                        onClick={() => {
                          causalityAudio.playTick();
                          setButterflyTime(0);
                        }}
                        whileHover={{ scale: 1.15, y: -0.5 }}
                        whileTap={{ scale: 0.9, y: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        title="Restart Rewrite"
                        className="flex items-center justify-center p-1.5 rounded-sm hover:bg-white/10 text-white/50/80 hover:text-white transition-colors duration-200 cursor-pointer w-7 h-7"
                      >
                        <svg className="w-3.5 h-3.5 fill-none stroke-current text-white/60" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </motion.button>

                      {/* Direction Toggle (Forward / Reverse) */}
                      <motion.button
                        onClick={() => {
                          causalityAudio.playTick();
                          setButterflyPlaybackSpeed(butterflyPlaybackSpeed * -1);
                        }}
                        whileHover={{ scale: 1.15, y: -0.5 }}
                        whileTap={{ scale: 0.9, y: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        title={butterflyPlaybackSpeed < 0 ? "Play Forward" : "Play Reverse"}
                        className="flex items-center justify-center p-1.5 rounded-sm hover:bg-white/10 text-white/50/80 hover:text-white transition-colors duration-200 cursor-pointer w-7 h-7"
                      >
                        {butterflyPlaybackSpeed < 0 ? (
                          <svg className="w-3.5 h-3.5 fill-current text-white/60 animate-pulse" viewBox="0 0 24 24">
                            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6-8.5 6V6l8.5 6z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 fill-current text-white/60" viewBox="0 0 24 24">
                            <path d="M4 18l8.5-6L4 6v12zm8.5 0l8.5-6-8.5-6v12z" />
                          </svg>
                        )}
                      </motion.button>

                      {/* Speed Selector Button */}
                      <motion.button
                        onClick={() => {
                          causalityAudio.playTick();
                          const absSpeed = Math.abs(butterflyPlaybackSpeed);
                          const nextAbs = absSpeed === 0.5 ? 1.0 : absSpeed === 1.0 ? 2.0 : 0.5;
                          const sign = butterflyPlaybackSpeed < 0 ? -1 : 1;
                          setButterflyPlaybackSpeed(nextAbs * sign);
                        }}
                        whileHover={{ scale: 1.1, y: -0.5 }}
                        whileTap={{ scale: 0.9, y: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        title="Cycle Playback Speed"
                        className="flex items-center justify-center px-1.5 py-1 rounded-sm hover:bg-white/10 text-white/60 font-serif text-[9px] tracking-wide font-bold transition-colors duration-200 cursor-pointer h-7 min-w-8"
                      >
                        {Math.abs(butterflyPlaybackSpeed).toFixed(1)}x
                      </motion.button>

                      {/* Stop / Revert Button */}
                      <motion.button
                        onClick={() => {
                          causalityAudio.playTick();
                          stopButterfly();
                        }}
                        whileHover={{ scale: 1.15, y: -0.5 }}
                        whileTap={{ scale: 0.9, y: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        title="Restore Original Timeline"
                        className="flex items-center justify-center p-1.5 rounded-sm hover:bg-white/10 text-[#d4af37]/80 hover:text-[#d4af37] transition-colors duration-200 cursor-pointer w-7 h-7"
                      >
                        <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  )}

                  {/* Causal Chain / Ripple Section */}
                  {!butterflyActive ? (
                    <div className="flex gap-2 w-full">
                      {/* Show Full Chain Button */}
                      <motion.button
                        onClick={() => {
                          causalityAudio.playTick();
                          setShowFullChain(!showFullChain);
                        }}
                        whileHover={{ scale: 0.98, y: 0.5, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
                        whileTap={{ scale: 0.94, y: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                        transition={{ type: "spring", stiffness: 450, damping: 18 }}
                        className={`w-1/2 py-2.5 px-3 rounded-sm border uppercase tracking-[0.15em] text-[8.5px] font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                          showFullChain 
                            ? "bg-[#d4af37]/15 border-[#d4af37]/45 text-white " 
                            : "bg-white/5 border-white/5 text-white/80 hover:text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        {showFullChain ? (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#d4af37] animate-pulse" />
                            Collapse Chain
                          </>
                        ) : (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            Full Chain
                          </>
                        )}
                      </motion.button>

                      {/* Ripple / Playback Controller */}
                      {!rippleActive ? (
                        <motion.button
                          onClick={() => {
                            causalityAudio.playRipple();
                            startRipple(activeNodeId!);
                          }}
                          whileHover={{ scale: 0.98, y: 0.5, boxShadow: "0 2px 12px rgba(212,175,55,0.25)" }}
                          whileTap={{ scale: 0.94, y: 2, boxShadow: "0 1px 2px rgba(212,175,55,0.1)" }}
                          transition={{ type: "spring", stiffness: 450, damping: 18 }}
                          className="w-1/2 py-2.5 px-3 rounded-sm border border-[#d4af37]/40 bg-[#d4af37]/10 text-white uppercase tracking-[0.15em] text-[8.5px] font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#d4af37]/20 hover:border-[#d4af37]/60 "
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d4af37]"></span>
                          </span>
                          Show Ripple
                        </motion.button>
                      ) : (
                        <div className="w-1/2 bg-white/[0.03] border border-white/10 rounded-sm px-2 py-1.5 flex items-center justify-between gap-1  backdrop-blur-sm">
                          {/* Play/Pause Button */}
                          <motion.button
                            onClick={() => {
                              causalityAudio.playTick();
                              setRipplePaused(!ripplePaused);
                            }}
                            whileHover={{ scale: 1.15, y: -0.5 }}
                            whileTap={{ scale: 0.9, y: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            title={ripplePaused ? "Resume Ripple" : "Pause Ripple"}
                            className="flex items-center justify-center p-1.5 rounded-sm hover:bg-white/10 text-white/80 hover:text-white transition-colors duration-200 cursor-pointer w-7 h-7"
                          >
                            {ripplePaused ? (
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                              </svg>
                            )}
                          </motion.button>

                          {/* Rewind/Reset Button */}
                          <motion.button
                            onClick={() => {
                              causalityAudio.playTick();
                              setRippleTime(0);
                            }}
                            whileHover={{ scale: 1.15, y: -0.5 }}
                            whileTap={{ scale: 0.9, y: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            title="Restart Ripple"
                            className="flex items-center justify-center p-1.5 rounded-sm hover:bg-white/10 text-white/80 hover:text-white transition-colors duration-200 cursor-pointer w-7 h-7"
                          >
                            <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                          </motion.button>

                          {/* Speed Selector Button */}
                          <motion.button
                            onClick={() => {
                              causalityAudio.playTick();
                              const nextSpeed = ripplePlaybackSpeed === 0.5 ? 1.0 : ripplePlaybackSpeed === 1.0 ? 2.0 : 0.5;
                              setRipplePlaybackSpeed(nextSpeed);
                            }}
                            whileHover={{ scale: 1.1, y: -0.5 }}
                            whileTap={{ scale: 0.9, y: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            title="Cycle Playback Speed"
                            className="flex items-center justify-center px-1.5 py-1 rounded-sm hover:bg-white/10 text-[#d4af37] font-serif text-[9px] tracking-wide font-bold transition-colors duration-200 cursor-pointer h-7 min-w-8"
                          >
                            {ripplePlaybackSpeed.toFixed(1)}x
                          </motion.button>

                          {/* Stop Button */}
                          <motion.button
                            onClick={() => {
                              causalityAudio.playTick();
                              stopRipple();
                            }}
                            whileHover={{ scale: 1.15, y: -0.5 }}
                            whileTap={{ scale: 0.9, y: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            title="Stop Ripple"
                            className="flex items-center justify-center p-1.5 rounded-sm hover:bg-white/10 text-white/60/80 hover:text-white/60 transition-colors duration-200 cursor-pointer w-7 h-7"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <rect x="4" y="4" width="16" height="16" rx="2" />
                            </svg>
                          </motion.button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[7.5px] tracking-[0.25em] text-center uppercase text-white/60 font-serif animate-pulse py-2.5 border border-white/10 rounded-sm bg-black/60 ">
                      Reality Altered • Exploring Alternate Path
                    </div>
                  )}

                  {/* Deselect Event Button */}
                  <motion.button
                    onClick={() => {
                      causalityAudio.playTick();
                      setActiveNodeId(null);
                      setShowFullChain(false);
                      stopRipple();
                      stopButterfly(); // Stop rewrite if deselecting
                    }}
                    whileHover={{ scale: 0.98, y: 0.5 }}
                    whileTap={{ scale: 0.95, y: 1.5 }}
                    transition={{ type: "spring", stiffness: 450, damping: 18 }}
                    className="w-full text-center text-[7.5px] tracking-[0.3em] uppercase text-white/35 hover:text-white/70 transition-colors duration-200 py-1.5 cursor-pointer mt-1"
                  >
                    Deselect Event
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      {/* MINIMALIST ACTIVE CONSTELLATION OVERLAY */}
      <AnimatePresence>
        {currentState === "explore" && selectedClusterId && (
          (() => {
            const selectedCluster = clusters.find((c) => c.id === selectedClusterId);
            if (!selectedCluster) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.8, type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 pointer-events-auto z-20 flex flex-col items-center gap-1 text-center"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: selectedCluster.color }} />
                  <span className="text-[9px] uppercase tracking-[0.35em] font-serif" style={{ color: selectedCluster.color }}>
                    Active Constellation
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-serif tracking-widest text-white mt-1 uppercase">
                  {selectedCluster.title}
                </h2>
                <p className="text-[10px] md:text-[11px] font-sans font-light tracking-wide text-white/50 max-w-md mt-1 leading-relaxed">
                  {selectedCluster.description}
                </p>
                <motion.button
                  onClick={() => {
                    causalityAudio.playTick();
                    setSelectedClusterId(null);
                    setCameraTarget([3.0, 0.0, 3.0]);
                    setCameraPosition([3.0, 1.5, 11.0]);
                  }}
                  whileHover={{ scale: 0.98, y: 0.5 }}
                  whileTap={{ scale: 0.95, y: 1.5 }}
                  transition={{ type: "spring", stiffness: 450, damping: 18 }}
                  className="mt-3 text-[8px] tracking-[0.3em] text-[#d4af37] hover:text-white uppercase transition-colors duration-200 border-b border-[#d4af37]/30 hover:border-white/40 pb-0.5 cursor-pointer"
                >
                  Return to Timeline Thread
                </motion.button>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      {/* Multiverse Comparison Dedicated Overlay */}
      <AnimatePresence>
        {compareMode && compareSourceNodeId && (
          <>
            {/* Top-Left Universe A Indicator */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-12 left-6 md:left-12 pointer-events-auto z-40 bg-black/40 border border-white/5 backdrop-blur-xl px-5 py-3 rounded-sm max-w-xs "
            >
              <div className="text-[9px] uppercase tracking-[0.25em] font-serif text-[#d4af37]/80">Universe A</div>
              <h3 className="text-sm font-sans font-bold text-white mt-1">Primary Timeline</h3>
              <p className="text-[10px] text-white/50 mt-1 font-light leading-relaxed">
                Contains the complete historical cause-and-effect cascade.
              </p>
            </motion.div>

            {/* Top-Right Universe B Indicator */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-12 right-28 md:right-36 pointer-events-auto z-40 bg-black/40 border border-white/5 backdrop-blur-xl px-5 py-3 rounded-sm max-w-xs "
            >
              <div className="text-[9px] uppercase tracking-[0.25em] font-serif text-white/60/80">Universe B</div>
              <h3 className="text-sm font-sans font-bold text-white mt-1">Altered Reality</h3>
              <p className="text-[10px] text-white/50 mt-1 font-light leading-relaxed">
                Timeline rewritten without the selected focal anchor point.
              </p>
            </motion.div>

            {/* Left Sidebar: Detailed Divergence Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-36 left-6 md:left-12 bottom-36 w-80 pointer-events-auto z-30 bg-black/50 border border-white/10 backdrop-blur-2xl px-6 py-6 rounded-sm flex flex-col justify-between "
            >
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-serif text-amber-400">Multiverse Comparison</h4>
                <h2 className="text-lg font-sans font-bold text-white mt-1 leading-tight">Timeline Divergence</h2>
                
                {/* Focal event description */}
                <div className="mt-5 bg-white/[0.03] border border-white/5 rounded-sm p-4">
                  <div className="text-[8.5px] uppercase tracking-wider text-[#d4af37] font-medium">Focal Point Removed</div>
                  <div className="text-sm font-sans font-bold text-white mt-1.5">
                    {nodes.find(n => n.id === compareSourceNodeId)?.title || "Selected Event"}
                  </div>
                  <p className="text-[10.5px] text-white/50 mt-1.5 font-light leading-relaxed">
                    This event has been dissolved in Universe B, causing future consequences to collapse or bypass through alternative roots.
                  </p>
                </div>

                {/* List of collapsed nodes */}
                <div className="mt-5">
                  <h5 className="text-[9px] uppercase tracking-widest text-white/40 font-medium">Dissolved in Universe B</h5>
                  <div className="mt-2.5 max-h-48 overflow-y-auto pr-1 flex flex-col gap-1.5 [&::-webkit-scrollbar]:hidden">
                    {Array.from(compareDisappearedNodeIds)
                      .filter(id => id !== compareSourceNodeId)
                      .map(id => nodes.find(n => n.id === id))
                      .filter(Boolean)
                      .map(n => (
                        <div key={n!.id} className="flex items-center gap-2 text-[11px] font-sans text-[#d4af37]/80 bg-black/60/10 border border-white/10/20 px-3 py-1.5 rounded-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                          <span className="font-light">{n!.title}</span>
                        </div>
                      ))}
                    {compareDisappearedNodeIds.size <= 1 && (
                      <div className="text-[10.5px] text-white/30 font-light italic">No descendant consequences were dissolved.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                onClick={() => {
                  causalityAudio.playTick();
                  setCompareMode(false);
                }}
                whileHover={{ scale: 0.98, y: 0.5, boxShadow: "0 2px 12px rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95, y: 1.5 }}
                className="w-full py-3 rounded-sm border border-white/10 bg-white/5 text-white/80 hover:text-white uppercase tracking-[0.2em] text-[8.5px] font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/[0.08]"
              >
                Exit Comparison
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sleek, Glassmorphic Cinematic Post-Processing Toggle */}
      {currentState === "explore" && entranceProgress >= 0.75 && (
        <div className="absolute top-12 right-26 md:right-36 pointer-events-auto z-40">
          <motion.button
            onClick={() => {
              const nextVal = !cinematicEffects;
              setCinematicEffects(nextVal);
              causalityAudio.playClick();
            }}
            whileHover={{ scale: 1.08, y: -0.5, boxShadow: "0 4px 12px rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95, y: 1 }}
            className={`flex items-center justify-center w-9 h-9 rounded-full border backdrop-blur-xl transition-all duration-300  cursor-pointer ${
              cinematicEffects
                ? "bg-[#d4af37]/10 border-[#d4af37]/45 text-[#d4af37] "
                : "bg-black/35 border-white/10 text-white/50 hover:border-white/25 hover:text-white"
            }`}
            title={cinematicEffects ? "Disable Cinematic Shader Effects" : "Enable Cinematic Shader Effects"}
          >
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v18M17 3v18M3 8h18M3 16h18" className="opacity-30" />
            </svg>
          </motion.button>
        </div>
      )}

      {/* Sleek, Glassmorphic Influence Mode Toggle */}
      {currentState === "explore" && entranceProgress >= 0.75 && (
        <div className="absolute top-12 right-16 md:right-24 pointer-events-auto z-40">
          <motion.button
            onClick={() => {
              const nextVal = !influenceMode;
              setInfluenceMode(nextVal);
              causalityAudio.playClick();
            }}
            whileHover={{ scale: 1.08, y: -0.5, boxShadow: "0 4px 12px rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95, y: 1 }}
            className={`flex items-center justify-center w-9 h-9 rounded-full border backdrop-blur-xl transition-all duration-300  cursor-pointer ${
              influenceMode
                ? "bg-[#d4af37]/10 border-[#d4af37]/45 text-[#d4af37] "
                : "bg-black/35 border-white/10 text-white/50 hover:border-white/25 hover:text-white"
            }`}
            title={influenceMode ? "Disable Gravity Influence Mode" : "Enable Gravity Influence Mode"}
          >
            <svg className="w-4.5 h-4.5 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 12" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-5 0a5 5 0 1110 0 5 5 0 01-10 0" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </motion.button>
        </div>
      )}

      {/* Sleek, Glassmorphic Audio Indicator/Mute Toggle */}
      {currentState === "explore" && entranceProgress >= 0.75 && (
        <div className="absolute top-12 right-6 md:right-12 pointer-events-auto z-40">
          <motion.button
            onClick={() => {
              const nextVal = !soundEnabled;
              setSoundEnabled(nextVal);
              if (nextVal) {
                setTimeout(() => {
                  import("../utils/sound").then(({ causalityAudio }) => {
                    causalityAudio.playTick();
                  });
                }, 50);
              }
            }}
            whileHover={{ scale: 1.08, y: -0.5, boxShadow: "0 4px 12px rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95, y: 1 }}
            className={`flex items-center justify-center w-9 h-9 rounded-full border backdrop-blur-xl transition-all duration-300  cursor-pointer ${
              soundEnabled
                ? "bg-[#d4af37]/10 border-[#d4af37]/45 text-[#d4af37] "
                : "bg-black/35 border-white/10 text-white/50 hover:border-white/25 hover:text-white"
            }`}
            title={soundEnabled ? "Mute Audio Hooks" : "Unmute Audio Hooks"}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            )}
          </motion.button>
        </div>
      )}

      {/* Premium Time Travel Engine Timeline Control */}
      <TimelineControl />

      {/* Signature Search Cinematic Closing Text */}
      <AnimatePresence>
        {signatureSearchPhase === 'finish' && signatureSearchText && (
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
            transition={{ duration: 3.5, type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm"
            onClick={() => setSignatureSearchPhase('none')}
          >
            <div className="flex flex-col items-center">
              <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest uppercase drop- text-center max-w-4xl px-8 leading-tight">
                {signatureSearchText}
              </h1>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 3.0, duration: 2.0 }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                className="mt-12 text-[9px] uppercase tracking-[0.4em] font-sans border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-500"
                onClick={() => setSignatureSearchPhase('none')}
              >
                Return to History
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

