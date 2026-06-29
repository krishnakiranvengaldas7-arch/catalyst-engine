import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

const HOOK_TEMPLATES = [
  "You may also like...",
  "This event secretly changed...",
  "The forgotten origin of...",
  "The biggest ripple from this event...",
  "What if this never happened?",
  "The unexpected consequence of..."
];

export const CatalystDiscover: React.FC = () => {
  const isIdle = useExperienceStore((state) => state.isIdle);
  const nodes = useExperienceStore((state) => state.nodes);
  const setDiscoverActiveNodeId = useExperienceStore((state) => state.setDiscoverActiveNodeId);
  const setDiscoverHookText = useExperienceStore((state) => state.setDiscoverHookText);
  const setCameraTarget = useExperienceStore((state) => state.setCameraTarget);
  const setCameraPosition = useExperienceStore((state) => state.setCameraPosition);
  const startRipple = useExperienceStore((state) => state.startRipple);
  const discoverActiveNodeId = useExperienceStore((state) => state.discoverActiveNodeId);
  const discoverHookText = useExperienceStore((state) => state.discoverHookText);
  
  const [opacity, setOpacity] = useState(0);
  const transitionTimer = useRef<any>(null);
  const phaseAccumulator = useRef(0);

  const triggerDiscovery = () => {
    if (nodes.length === 0) return;

    // Pick a highly connected or important node
    const candidates = nodes.filter(n => n.importance > 0.4);
    const targetNode = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : nodes[Math.floor(Math.random() * nodes.length)];

    // Generate hook text based on relationships
    const template = HOOK_TEMPLATES[Math.floor(Math.random() * HOOK_TEMPLATES.length)];
    let text = `${template} ${targetNode.title}`;
    
    // Sometimes we point to a consequence instead
    const outEdges = targetNode.outgoingConsequences || [];
    if (outEdges.length > 0 && Math.random() > 0.5) {
      const consequenceId = outEdges[Math.floor(Math.random() * outEdges.length)];
      const consequenceNode = nodes.find(n => n.id === consequenceId);
      if (consequenceNode) {
        text = `${template} ${consequenceNode.title}`;
      }
    }

    setDiscoverActiveNodeId(targetNode.id);
    setDiscoverHookText(text);

    // Fade out old text, fade in new text
    setOpacity(0);
    setTimeout(() => setOpacity(1), 800);

    // Choreograph Camera
    const nodePos = new THREE.Vector3().fromArray(targetNode.position);
    
    // Add a cinematic offset that constantly drifts
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetDist = 4.0 + Math.random() * 3.0;
    const camPos = new THREE.Vector3(
      nodePos.x + Math.cos(offsetAngle) * offsetDist,
      nodePos.y + 1.5 + Math.random() * 1.5,
      nodePos.z + Math.sin(offsetAngle) * offsetDist
    );

    setCameraTarget(nodePos.toArray());
    setCameraPosition(camPos.toArray());

    // 30% chance to trigger a causal ripple from this node to animate the graph
    if (Math.random() > 0.7) {
      startRipple(targetNode.id);
    }

    // Schedule next discovery
    const nextDuration = 8000 + Math.random() * 6000; // 8 to 14 seconds
    transitionTimer.current = setTimeout(triggerDiscovery, nextDuration);
  };

  useEffect(() => {
    if (isIdle) {
      // Start discovery sequence immediately
      triggerDiscovery();
    } else {
      // Clean up when user returns
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      setDiscoverActiveNodeId(null);
      setDiscoverHookText(null);
      setOpacity(0);
    }
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, [isIdle]);

  useFrame((_, delta) => {
    if (isIdle) {
      phaseAccumulator.current += delta;
    }
  });

  if (!isIdle || !discoverActiveNodeId || !discoverHookText) return null;

  const targetNode = nodes.find(n => n.id === discoverActiveNodeId);
  if (!targetNode) return null;

  const position = new THREE.Vector3().fromArray(targetNode.position);
  // Float slightly above and to the side of the node
  position.y += 0.8;
  position.x += 0.5;

  return (
    <group position={position}>
      <Html
        center
        zIndexRange={[100, 0]}
        style={{
          transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: opacity,
          pointerEvents: "none",
        }}
      >
        <div className="flex flex-col items-start min-w-[280px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <span className="text-[10px] tracking-[0.25em] font-medium text-blue-300 uppercase opacity-90">
              Catalyst Discover
            </span>
          </div>
          <p className="text-xl font-light tracking-wide text-white/95 leading-relaxed drop-shadow-md">
            {discoverHookText}
          </p>
        </div>
      </Html>
    </group>
  );
};
