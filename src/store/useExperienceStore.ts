import { create } from "zustand";

export type ExperienceState = "intro" | "loading" | "explore" | "timeline" | "detail";

export interface HistoricalNode {
  id: string;
  title: string;
  date: string;
  description: string;
  category: "science" | "politics" | "arts" | "disaster" | "philosophy";
  connections: string[]; // IDs of nodes this node affects
  incomingCauses: string[];
  outgoingConsequences: string[];
  importance: number;
  confidenceScore: number;
  position: [number, number, number]; // Position in 3D space
  historicalContext: string;
  deepDiveContent?: { title: string; content: string }[];
  influenceScore: number;
  timelinePosition: string;
  relatedDiscoveries: string[];
}

export interface DiscoveryCluster {
  id: string;
  title: string;
  description: string;
  position: [number, number, number];
  nodeIds: string[]; // List of node IDs that belong to this cluster
  color: string;     // Cosmic personality color
}

interface ExperienceStore {
  // State Flow
  currentState: ExperienceState;
  setCurrentState: (state: ExperienceState) => void;

  // Asset Loading
  loadingProgress: number;
  isLoaded: boolean;
  setLoadingProgress: (progress: number) => void;
  setLoaded: (loaded: boolean) => void;

  // Cinematic Loader
  loadingText: string;
  setLoadingText: (text: string) => void;

  // Entrance Choreography
  entranceProgress: number;
  setEntranceProgress: (progress: number) => void;

  // Interactive Nodes
  nodes: HistoricalNode[];
  activeNodeId: string | null;
  hoveredNodeId: string | null;
  setActiveNodeId: (id: string | null) => void;
  setHoveredNodeId: (id: string | null) => void;
  addNode: (node: HistoricalNode) => void;

  // Exploration & Discovery Clusters
  selectedClusterId: string | null;
  hoveredClusterId: string | null;
  setSelectedClusterId: (id: string | null) => void;
  setHoveredClusterId: (id: string | null) => void;
  clusters: DiscoveryCluster[];

  // Camera controls (managed by CameraManager)
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraPosition: (pos: [number, number, number]) => void;

  // Global settings
  interactionEnabled: boolean;
  setInteractionEnabled: (enabled: boolean) => void;

  // Advanced Search Experience State
  searchFocused: boolean;
  setSearchFocused: (focused: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  keystrokeTrigger: number;
  triggerKeystroke: () => void;

  // Signature Search Cinematic State
  signatureSearchPhase: 'none' | 'freeze' | 'glow' | 'unfold' | 'finish';
  signatureSearchTargetId: string | null;
  signatureSearchText: string | null;
  startSignatureSearch: (targetId: string, text: string) => void;
  setSignatureSearchPhase: (phase: 'none' | 'freeze' | 'glow' | 'unfold' | 'finish') => void;

  // Ambient Intelligence State
  isIdle: boolean;
  setIsIdle: (idle: boolean) => void;
  discoverActiveNodeId: string | null;
  setDiscoverActiveNodeId: (id: string | null) => void;
  discoverHookText: string | null;
  setDiscoverHookText: (text: string | null) => void;

  // Causality Engine chain expansion
  showFullChain: boolean;
  setShowFullChain: (show: boolean) => void;

  // Reality Threads Ripple Simulation State
  rippleActive: boolean;
  ripplePaused: boolean;
  ripplePlaybackSpeed: number;
  rippleTime: number;
  rippleActivationTimes: Record<string, number>;
  rippleEdgeDurations: Record<string, number>;
  startRipple: (startNodeId: string) => void;
  stopRipple: () => void;
  setRipplePaused: (paused: boolean) => void;
  setRipplePlaybackSpeed: (speed: number) => void;
  setRippleTime: (time: number) => void;

  // Butterfly Mode State
  butterflyActive: boolean;
  butterflyPaused: boolean;
  butterflyPlaybackSpeed: number;
  butterflyTime: number;
  butterflyTargetId: string | null;
  butterflyDisappearedNodeIds: Set<string>;
  butterflyUncertainNodeIds: Set<string>;
  butterflyAlternativeEdges: Array<{ from: string, to: string }>;
  startButterfly: (targetId: string) => void;
  stopButterfly: () => void;
  setButterflyPaused: (paused: boolean) => void;
  setButterflyPlaybackSpeed: (speed: number) => void;
  setButterflyTime: (time: number) => void;
  // Sound state
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Time Travel Engine State
  timelineYear: number;
  setTimelineYear: (year: number) => void;
  timelineScrubbing: boolean;
  setTimelineScrubbing: (scrubbing: boolean) => void;
  timelineSpeed: number;
  setTimelineSpeed: (speed: number) => void;

  // Influence Gravity System State
  influenceMode: boolean;
  setInfluenceMode: (active: boolean) => void;

  // Multiverse Comparison State
  compareMode: boolean;
  compareSourceNodeId: string | null;
  compareDisappearedNodeIds: Set<string>;
  compareUncertainNodeIds: Set<string>;
  compareAlternativeEdges: Array<{ from: string, to: string }>;
  setCompareMode: (active: boolean, sourceNodeId?: string | null) => void;

  // Cinematic Upgrades State
  cinematicEffects: boolean;
  setCinematicEffects: (active: boolean) => void;

  // The Observatory Mode State
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  isIdle: false,
  setIsIdle: (isIdle) => set({ isIdle }),
  discoverActiveNodeId: null,
  setDiscoverActiveNodeId: (discoverActiveNodeId) => set({ discoverActiveNodeId }),
  discoverHookText: null,
  setDiscoverHookText: (discoverHookText) => set({ discoverHookText }),
  
  currentState: "explore",
  setCurrentState: (currentState) => set({ currentState }),

  loadingProgress: 0,
  isLoaded: false,
  setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
  setLoaded: (isLoaded) => set({ isLoaded }),

  loadingText: "",
  setLoadingText: (loadingText) => set({ loadingText }),

  entranceProgress: 1,
  setEntranceProgress: (entranceProgress) => set({ entranceProgress }),

  nodes: [], // Will be populated with historical nodes
  activeNodeId: null,
  hoveredNodeId: null,
  setActiveNodeId: (activeNodeId) => set({ activeNodeId }),
  setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  selectedClusterId: null,
  hoveredClusterId: null,
  setSelectedClusterId: (selectedClusterId) => set({ selectedClusterId }),
  setHoveredClusterId: (hoveredClusterId) => set({ hoveredClusterId }),
  clusters: [
    {
      id: "science_revolutions",
      title: "Scientific Revolutions",
      description: "Empirical breakthroughs that shattered old paradigms and rewrote human understanding of reality.",
      position: [6, 5, -5],
      nodeIds: ["agricultural_revolution", "writing_system", "scientific_revolution", "industrial_revolution"],
      color: "#f59e0b", // Warm Amber
    },
    {
      id: "tech_explosions",
      title: "Technological Explosions",
      description: "Rapid accelerations in tools, media, and computation that rewired human connectivity.",
      position: [-8, 4, 6],
      nodeIds: ["writing_system", "printing_press", "industrial_revolution", "digital_revolution", "artificial_intelligence"],
      color: "#10b981", // Emerald Neon
    },
    {
      id: "empires",
      title: "Empires & Politics",
      description: "The rise and fall of civilizations, governance models, and codified laws shaping societies.",
      position: [-6, -5, -8],
      nodeIds: ["rise_of_cities", "code_of_hammurabi", "democratic_foundation"],
      color: "#ef4444", // Crimson Red
    },
    {
      id: "cultural_movements",
      title: "Cultural Movements",
      description: "Intellectual, artistic, and philosophical shifts that reshaped values and subjective human experience.",
      position: [8, -4, 4],
      nodeIds: ["writing_system", "democratic_foundation", "printing_press", "enlightenment"],
      color: "#a855f7", // Mystic Violet
    },
    {
      id: "most_connected",
      title: "Most Connected (Causal Hubs)",
      description: "Nodes with the highest number of historical dependencies and downstream effects.",
      position: [0, 6, 8],
      nodeIds: ["agricultural_revolution", "writing_system", "printing_press", "industrial_revolution"],
      color: "#3b82f6", // Electric Blue
    },
    {
      id: "most_unexpected",
      title: "Most Unexpected (Anomalies)",
      description: "Highly disruptive historical events that emerged with minimal obvious precedence.",
      position: [-2, -6, 12],
      nodeIds: ["code_of_hammurabi", "democratic_foundation", "enlightenment"],
      color: "#ec4899", // Vivid Pink
    },
    {
      id: "artificial_intelligence",
      title: "Artificial Intelligence Focus",
      description: "The cognitive explosion, digital minds, and the ultimate frontier of human creation.",
      position: [12, 2, 16],
      nodeIds: ["digital_revolution", "artificial_intelligence"],
      color: "#06b6d4", // Cyber Cyan
    },
  ],

  cameraTarget: [0, 0, 0],
  cameraPosition: [0, 0, 10],
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),
  setCameraPosition: (cameraPosition) => set({ cameraPosition }),

  interactionEnabled: true,
  setInteractionEnabled: (interactionEnabled) => set({ interactionEnabled }),

  searchFocused: false,
  setSearchFocused: (searchFocused) => set({ searchFocused }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  searchHistory: ["What caused the Renaissance?", "Why did Rome collapse?"],
  addSearchHistory: (query) => set((state) => {
    if (!query.trim()) return state;
    const history = state.searchHistory.filter((h) => h !== query);
    return { searchHistory: [query, ...history].slice(0, 5) };
  }),
  keystrokeTrigger: 0,
  triggerKeystroke: () => set((state) => ({ keystrokeTrigger: state.keystrokeTrigger + 1 })),

  signatureSearchPhase: 'none',
  signatureSearchTargetId: null,
  signatureSearchText: null,
  startSignatureSearch: (targetId, text) => set({
    signatureSearchPhase: 'freeze',
    signatureSearchTargetId: targetId,
    signatureSearchText: text,
    isPaused: true,
  }),
  setSignatureSearchPhase: (phase) => set({ signatureSearchPhase: phase }),

  showFullChain: false,
  setShowFullChain: (showFullChain) => set({ showFullChain }),

  // Reality Threads Simulation
  rippleActive: false,
  ripplePaused: false,
  ripplePlaybackSpeed: 1.0,
  rippleTime: 0,
  rippleActivationTimes: {},
  rippleEdgeDurations: {},
  startRipple: (startNodeId) => set((state) => {
    // Helper function for BFS propagation
    const activationTimes: Record<string, number> = {};
    const edgeDurations: Record<string, number> = {};

    state.nodes.forEach(n => {
      activationTimes[n.id] = Infinity;
    });
    activationTimes[startNodeId] = 0;

    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const currNode = state.nodes.find(n => n.id === currId);
      if (!currNode) continue;

      const currTime = activationTimes[currId];

      currNode.outgoingConsequences.forEach(targetId => {
        const targetNode = state.nodes.find(n => n.id === targetId);
        if (!targetNode) return;

        // Calculate 3D distance
        const dx = targetNode.position[0] - currNode.position[0];
        const dy = targetNode.position[1] - currNode.position[1];
        const dz = targetNode.position[2] - currNode.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Speed depends on importance (higher importance = faster travel)
        const speed = 2.0 + targetNode.importance * 2.8;
        const duration = dist / speed;

        const edgeKey = `${currId}->${targetId}`;
        edgeDurations[edgeKey] = duration;

        const arrivalTime = currTime + duration;

        if (arrivalTime < activationTimes[targetId]) {
          activationTimes[targetId] = arrivalTime;
          queue.push(targetId);
        }
      });
    }

    return {
      rippleActive: true,
      ripplePaused: false,
      ripplePlaybackSpeed: 1.0,
      rippleTime: 0,
      rippleActivationTimes: activationTimes,
      rippleEdgeDurations: edgeDurations,
      butterflyActive: false // Stop Butterfly Mode if starting Ripple
    };
  }),
  stopRipple: () => set({
    rippleActive: false,
    ripplePaused: false,
    rippleTime: 0,
    rippleActivationTimes: {},
    rippleEdgeDurations: {}
  }),
  setRipplePaused: (ripplePaused) => set({ ripplePaused }),
  setRipplePlaybackSpeed: (ripplePlaybackSpeed) => set({ ripplePlaybackSpeed }),
  setRippleTime: (rippleTime) => set({ rippleTime }),

  // Butterfly Mode Implementation
  butterflyActive: false,
  butterflyPaused: false,
  butterflyPlaybackSpeed: 1.0,
  butterflyTime: 0,
  butterflyTargetId: null,
  butterflyDisappearedNodeIds: new Set(),
  butterflyUncertainNodeIds: new Set(),
  butterflyAlternativeEdges: [],

  startButterfly: (targetId) => set((state) => {
    const nodes = state.nodes;
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return {};

    // 1. Find all "roots" (nodes that have no incoming causes)
    const roots = nodes.filter(n => n.incomingCauses.length === 0).map(n => n.id);

    // 2. Run a BFS to find all descendants of targetId (downstream consequences)
    const descendants = new Set<string>();
    const descQueue: string[] = [...targetNode.outgoingConsequences];
    while (descQueue.length > 0) {
      const currId = descQueue.shift()!;
      if (!descendants.has(currId) && currId !== targetId) {
        descendants.add(currId);
        const currNode = nodes.find(n => n.id === currId);
        if (currNode) {
          descQueue.push(...currNode.outgoingConsequences);
        }
      }
    }

    // 3. Run a BFS from all roots *without* passing through targetId to find surviving nodes
    const surviving = new Set<string>();
    const survQueue: string[] = roots.filter(rId => rId !== targetId);
    
    survQueue.forEach(rId => surviving.add(rId));

    while (survQueue.length > 0) {
      const currId = survQueue.shift()!;
      const currNode = nodes.find(n => n.id === currId);
      if (!currNode) continue;

      currNode.outgoingConsequences.forEach(nextId => {
        if (nextId !== targetId && !surviving.has(nextId)) {
          surviving.add(nextId);
          survQueue.push(nextId);
        }
      });
    }

    // 4. Categorize:
    // - Disappeared: descendants that are NOT surviving, plus target itself
    // - Uncertain: descendants that ARE surviving (they have other paths/roots)
    const disappeared = new Set<string>([targetId]);
    const uncertain = new Set<string>();

    descendants.forEach(dId => {
      if (surviving.has(dId)) {
        uncertain.add(dId);
      } else {
        disappeared.add(dId);
      }
    });

    // 5. Alternative bypass connections
    const alternativeEdges: Array<{ from: string, to: string }> = [];
    targetNode.incomingCauses.forEach(causeId => {
      targetNode.outgoingConsequences.forEach(conseqId => {
        alternativeEdges.push({ from: causeId, to: conseqId });
      });
    });

    return {
      butterflyActive: true,
      butterflyPaused: false,
      butterflyPlaybackSpeed: 1.0,
      butterflyTime: 0,
      butterflyTargetId: targetId,
      butterflyDisappearedNodeIds: disappeared,
      butterflyUncertainNodeIds: uncertain,
      butterflyAlternativeEdges: alternativeEdges,
      rippleActive: false // Stop ripple if starting butterfly
    };
  }),

  stopButterfly: () => set({
    butterflyActive: false,
    butterflyPaused: false,
    butterflyTime: 0,
    butterflyTargetId: null,
    butterflyDisappearedNodeIds: new Set(),
    butterflyUncertainNodeIds: new Set(),
    butterflyAlternativeEdges: []
  }),

  setButterflyPaused: (butterflyPaused) => set({ butterflyPaused }),
  setButterflyPlaybackSpeed: (butterflyPlaybackSpeed) => set({ butterflyPlaybackSpeed }),
  setButterflyTime: (butterflyTime) => set({ butterflyTime }),

  // Sound state
  soundEnabled: false,
  setSoundEnabled: (soundEnabled) => set(() => {
    import("../utils/sound").then(({ causalityAudio }) => {
      causalityAudio.setEnabled(soundEnabled);
    });
    return { soundEnabled };
  }),

  // Time Travel Engine State
  timelineYear: 2026,
  setTimelineYear: (timelineYear) => set({ timelineYear }),
  timelineScrubbing: false,
  setTimelineScrubbing: (timelineScrubbing) => set({ timelineScrubbing }),
  timelineSpeed: 0,
  setTimelineSpeed: (timelineSpeed) => set({ timelineSpeed }),

  // Influence Gravity System State
  influenceMode: false,
  setInfluenceMode: (influenceMode) => set({ influenceMode }),

  // Multiverse Comparison State
  compareMode: false,
  compareSourceNodeId: null,
  compareDisappearedNodeIds: new Set<string>(),
  compareUncertainNodeIds: new Set<string>(),
  compareAlternativeEdges: [],
  setCompareMode: (active, sourceNodeId = null) => set((state) => {
    if (!active || !sourceNodeId) {
      return {
        compareMode: false,
        compareSourceNodeId: null,
        compareDisappearedNodeIds: new Set<string>(),
        compareUncertainNodeIds: new Set<string>(),
        compareAlternativeEdges: []
      };
    }

    const targetNode = state.nodes.find(n => n.id === sourceNodeId);
    if (!targetNode) return {};

    // 1. Find all "roots"
    const roots = state.nodes.filter(n => n.incomingCauses.length === 0).map(n => n.id);

    // 2. Run a BFS to find all descendants of sourceNodeId
    const descendants = new Set<string>();
    const descQueue: string[] = [...targetNode.outgoingConsequences];
    while (descQueue.length > 0) {
      const currId = descQueue.shift()!;
      if (!descendants.has(currId) && currId !== sourceNodeId) {
        descendants.add(currId);
        const currNode = state.nodes.find(n => n.id === currId);
        if (currNode) {
          descQueue.push(...currNode.outgoingConsequences);
        }
      }
    }

    // 3. Run a BFS from all roots *without* passing through sourceNodeId
    const surviving = new Set<string>();
    const survQueue: string[] = roots.filter(rId => rId !== sourceNodeId);
    
    survQueue.forEach(rId => surviving.add(rId));

    while (survQueue.length > 0) {
      const currId = survQueue.shift()!;
      const currNode = state.nodes.find(n => n.id === currId);
      if (!currNode) continue;

      currNode.outgoingConsequences.forEach(nextId => {
        if (nextId !== sourceNodeId && !surviving.has(nextId)) {
          surviving.add(nextId);
          survQueue.push(nextId);
        }
      });
    }

    // 4. Categorize:
    const disappeared = new Set<string>([sourceNodeId]);
    const uncertain = new Set<string>();

    descendants.forEach(dId => {
      if (surviving.has(dId)) {
        uncertain.add(dId);
      } else {
        disappeared.add(dId);
      }
    });

    // 5. Alternative bypass connections
    const alternativeEdges: Array<{ from: string, to: string }> = [];
    targetNode.incomingCauses.forEach(causeId => {
      targetNode.outgoingConsequences.forEach(conseqId => {
        alternativeEdges.push({ from: causeId, to: conseqId });
      });
    });

    return {
      compareMode: true,
      compareSourceNodeId: sourceNodeId,
      compareDisappearedNodeIds: disappeared,
      compareUncertainNodeIds: uncertain,
      compareAlternativeEdges: alternativeEdges,
      activeNodeId: null, // clear selection on split
      showFullChain: false
    };
  }),

  // Cinematic Upgrades State
  cinematicEffects: true,
  setCinematicEffects: (cinematicEffects) => set({ cinematicEffects }),

  // The Observatory Mode State
  isPaused: false,
  setIsPaused: (isPaused) => set({ isPaused })
}));
