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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationStep(1);

    try {
      // 1. Search Wikipedia for the best matching article title
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
      const searchData = await searchRes.json();
      
      if (!searchData.query?.search?.length) {
        throw new Error("No historical data found for this event.");
      }
      
      const bestMatchTitle = searchData.query.search[0].title;

      setGenerationStep(2);

      // 2. Fetch the full page extract to build the deep dive
      const extractRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(bestMatchTitle)}&explaintext=1&origin=*`);
      const extractData = await extractRes.json();
      
      const pages = extractData.query?.pages;
      const pageId = Object.keys(pages || {})[0];
      const extract = pages?.[pageId]?.extract || "";

      setGenerationStep(3);

      // 3. Process the extract into rich deep dive sections
      // Split by double newlines (paragraphs or headers)
      const rawSections = extract.split(/\n\s*\n/).map((s: string) => s.trim()).filter((s: string) => s.length > 50);
      
      // Attempt to extract a year from the first paragraph
      const yearMatch = rawSections[0]?.match(/\b([12]\d{3})\b/);
      const generatedYear = yearMatch ? `${yearMatch[0]} CE` : "Unknown Era";

      // Map raw text chunks to our Deep Dive sections format
      const sectionTitles = ["Historical Context", "Root Causes", "Immediate Effects", "Long-Term Consequences", "Modern Impact"];
      const deepDiveContent = rawSections.slice(0, 5).map((content: string, idx: number) => ({
        title: sectionTitles[idx] || `Analysis ${idx + 1}`,
        content: content.replace(/==+([^=]+)==+/g, "").trim() // remove wiki headers
      }));

      // Fallback if not enough content
      if (deepDiveContent.length === 0) {
        deepDiveContent.push({
          title: "Historical Context",
          content: "Data corruption in timeline extraction. Minimal records found."
        });
      }

      // 4. Inject into Zustand
      const store = useExperienceStore.getState();
      const newNodeId = `ai_gen_${Date.now()}`;
      
      const newNode = {
        id: newNodeId,
        title: bestMatchTitle,
        date: generatedYear,
        description: rawSections[0]?.substring(0, 180) + "..." || `Synthesized mapping of ${bestMatchTitle}.`,
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

      // Scroll to bottom after state update
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);

    } catch (err) {
      console.error(err);
      alert("Catalyst Engine Error: Could not resolve timeline vector for this query.");
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-24 mb-32 border border-white/10 bg-[#0a0a0a] relative overflow-hidden group">
      {isGenerating && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent w-[200%]"
          animate={{ x: ["-100%", "50%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-12 h-[1px] bg-[#d4af37] mb-8" />
        <h3 className="font-serif text-3xl text-white mb-4">Map a Custom Event</h3>
        <p className="text-white/40 font-sans text-sm tracking-wide max-w-xl mb-12">
          Enter any historical or theoretical event. The Catalyst Intelligence Engine will map its causal roots, downstream consequences, and global influence score in real-time.
        </p>

        <form onSubmit={handleGenerate} className="w-full max-w-2xl relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. The Discovery of Penicillin, The Fall of Rome..."
            className="w-full bg-transparent border-b border-white/20 pb-4 text-center font-serif text-2xl text-white placeholder-white/20 focus:outline-none focus:border-[#d4af37] transition-colors"
          />
          
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="generating"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-12 flex flex-col items-center gap-4"
              >
                <div className="flex gap-2">
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                </div>
                <span className="text-[#d4af37] font-sans text-[10px] uppercase tracking-[0.3em]">
                  {generationStep === 1 && "Initializing Catalyst Engine..."}
                  {generationStep === 2 && "Tracing Causal Shockwaves..."}
                  {generationStep === 3 && "Synthesizing Node..."}
                </span>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-12"
              >
                <button 
                  type="submit"
                  disabled={!query.trim()}
                  className="px-8 py-3 border border-white/20 text-white/80 font-sans text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/80 cursor-pointer"
                >
                  Generate Timeline Node
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
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
