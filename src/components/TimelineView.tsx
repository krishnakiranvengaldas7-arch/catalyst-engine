import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore } from '../store/useExperienceStore';

const TimelineNode: React.FC<{ node: any; index: number; totalNodes: number }> = ({ node, index, totalNodes }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const nodes = useExperienceStore((state) => state.nodes);

  const yearMatch = node.date.match(/(\d{4})\s*(BCE|CE|AD|BC)?/);
  const year = yearMatch ? yearMatch[0] : node.date;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
      className="relative flex w-full max-w-5xl mx-auto items-start py-8 md:py-16 group"
    >
      {/* Central Axis Glow Line */}
      <div className="absolute left-[24px] md:left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2" />
      {index < totalNodes - 1 && (
        <motion.div 
          className="absolute left-[24px] md:left-1/2 top-[80px] bottom-[-80px] w-[2px] bg-gradient-to-b from-[#d4af37] to-transparent -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
        />
      )}

      {/* Axis Marker */}
      <div className="absolute left-[24px] md:left-1/2 top-[84px] w-3 h-3 bg-black border border-[#d4af37] rounded-full -translate-x-1/2 shadow-[0_0_15px_rgba(212,175,55,0)] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] group-hover:bg-[#d4af37] transition-all duration-500 z-20 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)} />

      {/* Date & Category (Left side on Desktop) */}
      <div className="hidden md:flex flex-col items-end w-1/2 pr-16 pt-[70px] cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="text-[#d4af37] font-serif text-3xl tracking-widest">{year}</span>
        <span className="text-white/40 font-sans text-xs uppercase tracking-[0.3em] mt-2">{node.category}</span>
        <span className="text-white/20 font-serif italic text-sm mt-4 text-right max-w-[250px]">{node.timelinePosition}</span>
      </div>

      {/* Content Card (Right side on Desktop) */}
      <div className="flex-1 pl-16 md:pl-16 pt-[64px] pb-4 md:w-1/2 w-full z-10 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="md:hidden mb-4">
          <span className="text-[#d4af37] font-serif text-2xl tracking-widest block">{year}</span>
          <span className="text-white/40 font-sans text-[10px] uppercase tracking-[0.3em] mt-1 block">{node.category}</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-serif text-white tracking-wide leading-tight group-hover:text-[#d4af37] transition-colors duration-500">
          {node.title}
        </h2>
        
        <p className="text-white/60 font-sans text-base md:text-lg font-light leading-relaxed mt-6">
          {node.description}
        </p>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-8 mt-8 border-t border-white/10 flex flex-col gap-8">
                
                {/* Deep Dive Content or Fallback Context */}
                {node.deepDiveContent ? (
                  <div className="flex flex-col gap-8">
                    {node.deepDiveContent.map((section: any, i: number) => (
                      <div key={i} className="flex flex-col gap-3">
                        <span className="text-[#d4af37] font-sans text-[10px] tracking-[0.3em] uppercase">{section.title}</span>
                        <p className="text-white/80 font-serif text-[17px] leading-relaxed border-l border-white/10 pl-6 py-1">
                          {/* Render citation tags beautifully if they exist (e.g. [label](citation:id)) */}
                          {section.content.split(/(\[.*?\]\(citation:.*?\))/).map((part: string, idx: number) => {
                            const match = part.match(/\[(.*?)\]\(citation:(.*?)\)/);
                            if (match) {
                              return <span key={idx} className="text-[#d4af37] border-b border-[#d4af37]/30 hover:border-[#d4af37] transition-colors cursor-pointer">{match[1]}</span>;
                            }
                            return <span key={idx}>{part}</span>;
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <span className="text-[#d4af37] font-sans text-[10px] tracking-[0.3em] uppercase">Historical Context</span>
                    <p className="text-white/80 font-serif text-[17px] leading-relaxed italic border-l border-white/10 pl-6 py-1">
                      "{node.historicalContext}"
                    </p>
                  </div>
                )}

                {/* Related Discoveries */}
                {node.relatedDiscoveries && node.relatedDiscoveries.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-white/40 font-sans text-[10px] tracking-[0.3em] uppercase">Simultaneous Discoveries</span>
                    <ul className="flex flex-col gap-2">
                      {node.relatedDiscoveries.map((disc: string, i: number) => (
                        <li key={i} className="text-white/60 font-sans text-sm flex items-center gap-3">
                          <div className="w-1 h-1 bg-white/30 rounded-full" />
                          {disc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Downstream Engine */}
                <div className="flex flex-wrap gap-8 bg-white/5 p-6 rounded-sm border border-white/5">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Influence Score</span>
                    <span className="text-[#d4af37] font-serif text-3xl">{node.influenceScore}<span className="text-lg text-white/30">%</span></span>
                  </div>
                  
                  {node.outgoingConsequences && node.outgoingConsequences.length > 0 && (
                    <div className="flex flex-col gap-3 flex-1">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Triggered</span>
                      <div className="flex flex-wrap gap-2">
                        {node.outgoingConsequences.map((conseqId: string) => {
                          const conseq = nodes.find(n => n.id === conseqId);
                          if (!conseq) return null;
                          return (
                            <span key={conseqId} className="px-3 py-1.5 text-[10px] uppercase tracking-wider border border-white/20 text-white/80 bg-black/40 rounded-sm hover:bg-white hover:text-black transition-colors">
                              {conseq.title}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator */}
        <div className="mt-8 flex items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-[1px] bg-[#d4af37]" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37]">
            {isExpanded ? 'Collapse Thread' : 'Expand Thread'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const AIEventGenerator: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationStep(1);

    try {
      // 1. Search Wikipedia for the best matching article title
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
      const searchData = await searchRes.json();
      
      let bestMatchTitle = query;
      let rawSections: string[] = [];

      if (searchData.query?.search?.length > 0) {
        bestMatchTitle = searchData.query.search[0].title;
        setGenerationStep(2);
        const extractRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(bestMatchTitle)}&explaintext=1&origin=*`);
        const extractData = await extractRes.json();
        
        const pages = extractData.query?.pages;
        const pageId = Object.keys(pages || {})[0];
        const extract = pages?.[pageId]?.extract || "";
        rawSections = extract.split(/\n\s*\n/).map((s: string) => s.trim()).filter((s: string) => s.length > 50);
      }

      setGenerationStep(3);

      // If no Wikipedia data found, check if it's gibberish
      if (rawSections.length === 0) {
        const clean = query.trim().toLowerCase();
        const isGibberish = 
          !/[aeiouy]/.test(clean) || // No vowels
          /[bcdfghjklmnpqrstvwxz]{6,}/.test(clean) || // 6+ consecutive consonants
          /(.)\1{3,}/.test(clean) || // 4+ repeated characters
          (clean.split(/\s+/).length === 1 && clean.length > 14); // Single massive word

        if (isGibberish) {
          throw new Error(`Invalid data signature: "${query}" appears to be gibberish or corrupt data.`);
        }

        // It's a real niche phrase, use synthetic generative fallback
        rawSections = [
          `The historical vector known as "${query}" represents a highly specific or culturally nascent phenomenon. Due to its niche or emergent nature, traditional archival consensus is fragmented, requiring the Catalyst Engine to synthesize its causal impact procedurally.`,
          `Root analysis suggests this event emerged from localized socio-economic friction or digital-cultural shifts, cascading into broader community behavioral changes that challenged existing paradigms.`,
          `While its immediate impact may seem contained, the long-term reverberations of "${query}" establish new precedents for collective action, systemic disruption, and grassroots momentum.`,
          `Unexpectedly, this event forced structural adaptations in its surrounding ecosystem, demonstrating how micro-catalysts can bypass traditional gatekeepers to achieve critical mass.`,
          `Today, its legacy serves as a testament to the fact that no event exists in isolation—even hyper-specific digital or cultural movements can reshape broader societal frameworks.`
        ];
      }

      // Attempt to extract a year from the first paragraph
      const yearMatch = rawSections[0]?.match(/\b([12]\d{3})\b/);
      const generatedYear = yearMatch ? `${yearMatch[0]} CE` : "Contemporary";

      // Create a solid summary (first 2 sentences) for the card description
      const firstSectionSentences = rawSections[0].split(/(?<=\.)\s+/);
      const summaryText = firstSectionSentences.slice(0, 2).join(" ") || rawSections[0].substring(0, 250) + "...";

      // Map raw text chunks to our Deep Dive sections format
      const sectionTitles = ["Historical Context", "Root Causes", "Immediate Effects", "Long-Term Consequences", "Modern Impact"];
      const deepDiveContent = rawSections.slice(0, 5).map((content: string, idx: number) => ({
        title: sectionTitles[idx] || `Analysis ${idx + 1}`,
        content: content.replace(/==+([^=]+)==+/g, "").trim() // remove wiki headers
      }));

      // 4. Inject into Zustand
      const store = useExperienceStore.getState();
      const newNodeId = `ai_gen_${Date.now()}`;
      
      const newNode = {
        id: newNodeId,
        title: bestMatchTitle,
        date: generatedYear,
        description: summaryText,
        category: "synthesized",
        connections: [],
        incomingCauses: [],
        outgoingConsequences: [],
        importance: 0.9,
        confidenceScore: 0.88,
        position: [0, 0, 0] as [number, number, number],
        historicalContext: deepDiveContent[0].content,
        deepDiveContent: deepDiveContent,
        influenceScore: Math.floor(Math.random() * 40 + 60),
        timelinePosition: "Synthesized Event",
        relatedDiscoveries: ["Algorithmic Determinism", "Synthetic Causality Engine"]
      };

      store.addNode(newNode as any);
      setQuery("");
      setIsGeneratorOpen(false);

      // Scroll to bottom after state update
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Catalyst Engine Error: Could not resolve timeline vector for this query.");
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsGeneratorOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/20 hover:border-[#d4af37] hover:scale-105 transition-all z-40 backdrop-blur-md group shadow-[0_0_20px_rgba(212,175,55,0.2)]"
      >
        <span className="text-2xl font-light tracking-tighter mb-1">+</span>
        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 border border-white/10 text-white/70 text-[10px] uppercase tracking-widest whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
          Map New Event
        </div>
      </button>

      {/* AI Event Generator Modal */}
      <AnimatePresence>
        {isGeneratorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="absolute inset-0" onClick={() => !isGenerating && setIsGeneratorOpen(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="max-w-2xl w-full border border-[#d4af37]/20 bg-[#050505] p-10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#d4af37]/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#d4af37]/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#d4af37]/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#d4af37]/50" />

              <button 
                onClick={() => !isGenerating && setIsGeneratorOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors text-xl font-light"
              >
                ✕
              </button>

              <div className="mb-10 text-center relative z-10">
                <h3 className="text-[#d4af37] font-sans text-xs tracking-[0.4em] uppercase mb-4">
                  Map a Custom Event
                </h3>
                <p className="text-white/50 font-serif text-sm italic max-w-md mx-auto leading-relaxed">
                  Enter any historical, cultural, or theoretical event to inject a new vector into the causality timeline.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="flex flex-col gap-8 relative z-10">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. The Fall of Rome, Invention of the Internet..."
                  disabled={isGenerating}
                  className="bg-transparent border-b border-white/20 pb-4 text-center font-serif text-xl md:text-2xl text-white placeholder-white/20 focus:outline-none focus:border-[#d4af37] transition-colors disabled:opacity-50"
                  autoFocus
                />

                <div className="flex flex-col items-center mt-4 h-16">
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="flex gap-2">
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                        </div>
                        <span className="text-[#d4af37] font-sans text-[10px] uppercase tracking-[0.3em]">
                          {generationStep === 1 && "Querying Global Archives..."}
                          {generationStep === 2 && "Tracing Causal Shockwaves..."}
                          {generationStep === 3 && "Synthesizing Deep Lore..."}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        type="submit"
                        disabled={!query.trim()}
                        className="px-8 py-3 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] font-sans text-[10px] tracking-[0.3em] uppercase hover:bg-[#d4af37]/20 hover:border-[#d4af37] transition-all disabled:opacity-30 disabled:hover:bg-[#d4af37]/10 disabled:hover:border-[#d4af37]/30 cursor-pointer"
                      >
                        Initiate Catalyst
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </form>

              {/* Background gradient effect during generation */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/5 to-[#d4af37]/0 -skew-x-12 translate-x-[-150%] animate-[scan_2s_ease-in-out_infinite] pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const TimelineView: React.FC = () => {
  const nodes = useExperienceStore((state) => state.nodes);
  const sortedNodes = [...nodes];

  return (
    <div className="w-full flex flex-col pointer-events-auto">
      {sortedNodes.map((node, index) => (
        <TimelineNode key={node.id} node={node} index={index} totalNodes={sortedNodes.length} />
      ))}
      <AIEventGenerator />
    </div>
  );
};
