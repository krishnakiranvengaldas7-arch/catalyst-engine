import React, { createContext, useContext, useEffect } from "react";
import { gsap } from "gsap";
import { useExperienceStore, type HistoricalNode } from "../store/useExperienceStore";
import { historicalCausalDb } from "../utils/aiExplanationService";

interface ExperienceContextType {
  startExploration: () => void;
  resetExperience: () => void;
}

const ExperienceContext = createContext<ExperienceContextType | null>(null);

export const useExperience = () => {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within an ExperienceProvider");
  }
  return context;
};

// Seed data for the historical cause-and-effect nodes
const historicalTimelineNodes: HistoricalNode[] = [
  {
    id: "agricultural_revolution",
    title: "Agricultural Revolution",
    date: "c. 10,000 BCE",
    description: "Transition from hunter-gatherer lifestyles to farming, enabling permanent settlements, population growth, and specialization.",
    category: "science",
    connections: ["writing_system", "rise_of_cities"],
    incomingCauses: [],
    outgoingConsequences: ["rise_of_cities", "writing_system"],
    importance: 0.95,
    confidenceScore: 0.98,
    position: [-8, 2, -12],
    historicalContext: "Triggered by the end of the last Ice Age, rising temperatures, and the extinction of large game, forcing human groups to settle near fertile river valleys.",
    influenceScore: 98,
    timelinePosition: "Neolithic Era (c. 10,000 BCE)",
    relatedDiscoveries: ["Animal Domestication", "Sickle Tools", "Irrigation Channels"],
  },
  {
    id: "rise_of_cities",
    title: "Rise of Cities",
    date: "c. 4500 BCE",
    description: "The birth of urbanization in Mesopotamia and Egypt, creating complex societies, governance, and centralized culture.",
    category: "politics",
    connections: ["code_of_hammurabi"],
    incomingCauses: ["agricultural_revolution"],
    outgoingConsequences: ["code_of_hammurabi"],
    importance: 0.85,
    confidenceScore: 0.95,
    position: [-5, -2, -9],
    historicalContext: "Enabled by agricultural surpluses in the Fertile Crescent, prompting populations to cluster, cooperate on massive infrastructure, and establish administrative structures.",
    influenceScore: 88,
    timelinePosition: "Early Bronze Age (c. 4500 BCE)",
    relatedDiscoveries: ["Granary Systems", "Mud-brick Architecture", "Taxation Registers"],
  },
  {
    id: "writing_system",
    title: "Cuneiform & Writing Systems",
    date: "c. 3400 BCE",
    description: "The invention of writing in Sumer, transforming human memory, commerce, and enabling the preservation of knowledge.",
    category: "science",
    connections: ["printing_press", "scientific_revolution"],
    incomingCauses: ["agricultural_revolution"],
    outgoingConsequences: ["printing_press", "scientific_revolution"],
    importance: 0.92,
    confidenceScore: 0.96,
    position: [-4, 3, -6],
    historicalContext: "Emerged from the administrative necessity of tracking trade transactions, grain storage, and labor distribution in early urban temples.",
    influenceScore: 96,
    timelinePosition: "Bronze Age (c. 3400 BCE)",
    relatedDiscoveries: ["Stylus Tools", "Clay Tablets", "Pictographic Glyphs"],
  },
  {
    id: "code_of_hammurabi",
    title: "Code of Hammurabi",
    date: "1750 BCE",
    description: "One of the earliest and most complete written legal codes, establishing the principle of law as a public and objective standard.",
    category: "politics",
    connections: ["democratic_foundation"],
    incomingCauses: ["rise_of_cities"],
    outgoingConsequences: ["democratic_foundation"],
    importance: 0.80,
    confidenceScore: 0.94,
    position: [-2, -3, -3],
    historicalContext: "Created to unify the diverse territories of the Babylonian Empire under a singular, public legal framework, ending arbitrary rulings.",
    influenceScore: 82,
    timelinePosition: "Middle Bronze Age (1750 BCE)",
    relatedDiscoveries: ["Stele Monuments", "Codified Penalties", "Legal Oaths"],
  },
  {
    id: "democratic_foundation",
    title: "Athenian Democracy",
    date: "508 BCE",
    description: "The establishment of direct democracy in Athens, introducing concepts of civic participation and rule by the assembly.",
    category: "politics",
    connections: ["printing_press", "enlightenment"],
    incomingCauses: ["code_of_hammurabi"],
    outgoingConsequences: ["printing_press", "enlightenment"],
    importance: 0.88,
    confidenceScore: 0.92,
    position: [0, -1, 0],
    historicalContext: "Born from civil unrest and socio-economic crises in Athens, leading to the reforms of Cleisthenes to curb aristocratic monopoly.",
    influenceScore: 90,
    timelinePosition: "Classical Antiquity (508 BCE)",
    relatedDiscoveries: ["Sortition Machines", "The Pnyx Assembly", "Ostracism Ballots"],
  },
  {
    id: "printing_press",
    title: "Gutenberg Printing Press",
    date: "1440 CE",
    description: "The invention of movable metal type, democratizing information, accelerating literacy, and sparking global transformations.",
    category: "arts",
    connections: ["scientific_revolution", "enlightenment"],
    incomingCauses: ["writing_system", "democratic_foundation"],
    outgoingConsequences: ["scientific_revolution", "enlightenment"],
    importance: 0.94,
    confidenceScore: 0.99,
    position: [3, 2, 3],
    historicalContext: "Emerging in Renaissance Europe amidst rising literacy rates, the collapse of the Byzantine Empire sending scholars west, and a severe scribe shortage.",
    influenceScore: 99,
    timelinePosition: "Early Modern Era (1440 CE)",
    relatedDiscoveries: ["Movable Metal Type", "Oil-based Inks", "Screw-press Mechanics"],
  },
  {
    id: "scientific_revolution",
    title: "Scientific Revolution",
    date: "1543 CE",
    description: "A shift in human thought prioritizing empirical observation, mathematics, and experimentation, rewriting our place in the universe.",
    category: "science",
    connections: ["industrial_revolution"],
    incomingCauses: ["printing_press", "writing_system"],
    outgoingConsequences: ["industrial_revolution"],
    importance: 0.96,
    confidenceScore: 0.97,
    position: [5, 4, 6],
    historicalContext: "Fostered by the rediscovery of classical texts, the spread of print, and maritime voyages requiring precise navigation and celestial maps.",
    influenceScore: 97,
    timelinePosition: "Scientific Renaissance (1543 CE)",
    relatedDiscoveries: ["Telescopic Optics", "Heliocentric Models", "Experimental Method"],
  },
  {
    id: "enlightenment",
    title: "The Enlightenment",
    date: "c. 1700 CE",
    description: "An intellectual movement promoting reason, individual liberty, and progress, directly inspiring democratic revolutions.",
    category: "philosophy",
    connections: ["industrial_revolution"],
    incomingCauses: ["printing_press", "democratic_foundation"],
    outgoingConsequences: ["industrial_revolution"],
    importance: 0.86,
    confidenceScore: 0.93,
    position: [6, -2, 8],
    historicalContext: "Spurred by the Scientific Revolution, challenging traditional religious authority and absolute monarchies, fostering salons and coffeehouses.",
    influenceScore: 89,
    timelinePosition: "Age of Reason (c. 1700 CE)",
    relatedDiscoveries: ["Social Contract Theory", "The Encyclopédie", "Secular Ethics"],
  },
  {
    id: "industrial_revolution",
    title: "Industrial Revolution",
    date: "1760 CE",
    description: "The transition to steam-powered manufacturing, reshaping economies, urbanization, and triggering modern environmental challenges.",
    category: "science",
    connections: ["digital_revolution"],
    incomingCauses: ["scientific_revolution", "enlightenment"],
    outgoingConsequences: ["digital_revolution"],
    importance: 0.95,
    confidenceScore: 0.98,
    position: [8, 1, 11],
    historicalContext: "Fueled by British coal deposits, colonial trade wealth, patent protections, and agricultural advances that freed up labor for factories.",
    influenceScore: 95,
    timelinePosition: "Industrial Age (1760 CE)",
    relatedDiscoveries: ["Steam Engine", "Spinning Jenny", "Factory Assembly Lines"],
  },
  {
    id: "digital_revolution",
    title: "Digital Revolution",
    date: "1969 CE",
    description: "The birth of ARPANET and microprocessors, introducing the information age and linking humanity in a global neural network.",
    category: "science",
    connections: ["artificial_intelligence"],
    incomingCauses: ["industrial_revolution"],
    outgoingConsequences: ["artificial_intelligence"],
    importance: 0.92,
    confidenceScore: 0.99,
    position: [11, 3, 14],
    historicalContext: "Catalyzed by WWII cryptography, the invention of the transistor, and the Cold War push for decentralized military communications.",
    influenceScore: 94,
    timelinePosition: "Information Age (1969 CE)",
    relatedDiscoveries: ["Silicon Transistors", "TCP/IP Protocol", "Microprocessor Chips"],
  },
  {
    id: "artificial_intelligence",
    title: "Artificial Intelligence",
    date: "21st Century",
    description: "The emergence of deep learning and cognitive computing, challenging our understanding of intelligence, work, and creativity.",
    category: "philosophy",
    connections: [],
    incomingCauses: ["digital_revolution"],
    outgoingConsequences: [],
    importance: 0.98,
    confidenceScore: 0.95,
    position: [14, -1, 18],
    historicalContext: "Enabled by the exponential growth of digital data, massive GPU parallel computing, and breakthrough transformer neural architectures.",
    influenceScore: 98,
    timelinePosition: "Cognitive Era (21st Century)",
    relatedDiscoveries: ["Neural Networks", "Transformer Models", "GPU Clusters"],
  },
];

export const ExperienceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setCurrentState = useExperienceStore((state) => state.setCurrentState);
  const setCameraTarget = useExperienceStore((state) => state.setCameraTarget);
  const setCameraPosition = useExperienceStore((state) => state.setCameraPosition);

  // Initialize the store with seed data on mount
  useEffect(() => {
    // Attach the highly detailed Wikipedia-like deep dive content to each node
    const enrichedNodes = historicalTimelineNodes.map(node => {
      const dbEntry = historicalCausalDb[node.id];
      if (dbEntry) {
        return {
          ...node,
          deepDiveContent: dbEntry.map(section => ({ title: section.title, content: section.content }))
        };
      }
      return node;
    });

    useExperienceStore.setState({ nodes: enrichedNodes });
    console.log("Nodes seeded into store:", enrichedNodes.length);
  }, []);

  const startExploration = () => {
    setCurrentState("explore");
    
    // Reset active state
    useExperienceStore.getState().setActiveNodeId(null);
    useExperienceStore.getState().setEntranceProgress(0);

    // Animate entranceProgress from 0 to 1 over 2.2 seconds (very snappy and responsive)
    const animObj = { val: 0 };
    gsap.to(animObj, {
      val: 1,
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate: () => {
        useExperienceStore.getState().setEntranceProgress(animObj.val);
      },
      onComplete: () => {
        // Automatically focus on the first historical node as the reveal finishes
        const firstNode = useExperienceStore.getState().nodes[0];
        if (firstNode) {
          useExperienceStore.getState().setActiveNodeId(firstNode.id);
          setCameraTarget(firstNode.position);
          setCameraPosition([
            firstNode.position[0],
            firstNode.position[1] + 1.0,
            firstNode.position[2] + 4.5,
          ]);
        }
      },
    });
  };

  const resetExperience = () => {
    setCurrentState("intro");
    useExperienceStore.getState().setEntranceProgress(0);
    useExperienceStore.getState().setActiveNodeId(null);
    setCameraTarget([0, 0, 0]);
    setCameraPosition([0, 0, 9]);
  };

  return (
    <ExperienceContext.Provider value={{ startExploration, resetExperience }}>
      {children}
    </ExperienceContext.Provider>
  );
};
