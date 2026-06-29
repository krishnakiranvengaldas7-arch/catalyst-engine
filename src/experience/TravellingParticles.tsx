import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore, type HistoricalNode } from "../store/useExperienceStore";
import { causalityAudio } from "../utils/sound";

interface TravellingParticlesProps {
  nodes: HistoricalNode[];
  activePositions: THREE.Vector3[];
  universe?: "A" | "B";
}

export const TravellingParticles: React.FC<TravellingParticlesProps> = ({
  nodes,
  activePositions,
  universe,
}) => {
  const pointsRef = useRef<THREE.Points | null>(null);
  const currentState = useExperienceStore((state) => state.currentState);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);
  const hoveredNodeId = useExperienceStore((state) => state.hoveredNodeId);
  const searchFocused = useExperienceStore((state) => state.searchFocused);
  const activeNodeId = useExperienceStore((state) => state.activeNodeId);

  const focusOpacity = useRef(1.0);

  // 1. Build connection flows (pairs of start/end node indices)
  const flows = useMemo(() => {
    const list: Array<{
      startIdx: number;
      endIdx: number;
      speed: number;
      phase: number;
    }> = [];

    nodes.forEach((node, startIdx) => {
      node.connections.forEach((targetId) => {
        const endIdx = nodes.findIndex((n) => n.id === targetId);
        if (endIdx !== -1) {
          // Spawn 35 staggered particles per connection to show dense flow
          for (let p = 0; p < 35; p++) {
            list.push({
              startIdx,
              endIdx,
              speed: 0.12 + Math.random() * 0.08, // Slow, elegant base flow
              phase: p / 35, // Staggered start phase
            });
          }
        }
      });
    });

    return list;
  }, [nodes]);

  const particleCount = flows.length;
  
  // Allocate position and color buffers
  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const colors = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);

  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;

    const dt = Math.min(delta, 0.1);
    const isPaused = useExperienceStore.getState().isPaused;
    if (!isPaused) {
      elapsedRef.current += dt;
    }
    const time = elapsedRef.current;

    const pointsGeom = pointsRef.current.geometry;
    const posAttr = pointsGeom.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const colAttr = pointsGeom.attributes.color;
    const colArray = colAttr.array as Float32Array;

    // Global fade factor based on experience state
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const entranceP = entranceProgress;
    
    let globalFade = 1.0;
    if (currentState === "loading" || currentState === "intro") {
      globalFade = 0.0;
    } else if (currentState === "explore" && entranceP < 1.0) {
      // Fade in during the entrance reveal
      globalFade = Math.min(Math.max((entranceP - 0.15) / 0.7, 0), 1);
    }

    // Smoothly fade out travelling pulses by 85% when search is focused
    const targetOpacity = searchFocused ? 0.15 : 1.0;
    focusOpacity.current = THREE.MathUtils.lerp(focusOpacity.current, targetOpacity, 4.5 * dt);

    mat.opacity = 0.85 * globalFade * focusOpacity.current;

    // Read Reality Threads simulation state
    const rippleActive = useExperienceStore.getState().rippleActive;
    const rippleTime = useExperienceStore.getState().rippleTime;
    const rippleActivationTimes = useExperienceStore.getState().rippleActivationTimes;

    // Update coordinates and colors for each traveling light pulse
    flows.forEach((flow, i) => {
      const idx = i * 3;
      const startVec = activePositions[flow.startIdx];
      const endVec = activePositions[flow.endIdx];

      if (!startVec || !endVec) return;

      const p = i % 35; // particle index on this connection
      const startNode = nodes[flow.startIdx];
      const endNode = nodes[flow.endIdx];

      const compareMode = useExperienceStore.getState().compareMode;
      const compareDisappearedNodeIds = useExperienceStore.getState().compareDisappearedNodeIds;
      const isCollapsed = compareMode && universe === "B" && (
        compareDisappearedNodeIds.has(startNode.id) ||
        compareDisappearedNodeIds.has(endNode.id)
      );

      if (isCollapsed) {
        colArray[idx + 0] = 0;
        colArray[idx + 1] = 0;
        colArray[idx + 2] = 0;
        return;
      }

      let x = startVec.x;
      let y = startVec.y;
      let z = startVec.z;

      let r = 0.0;
      let g = 0.0;
      let b = 0.0; // Hidden by default

      if (rippleActive) {
        const tA = rippleActivationTimes[startNode.id];
        const tB = rippleActivationTimes[endNode.id];
        const isConsequencePath = tA !== undefined && tB !== undefined && tA !== Infinity && tB !== Infinity && tB > tA;

        if (isConsequencePath) {
          // Major consequences produce thicker flowing streams (more particles), minor produce delicate strands
          let maxParticles = Math.round(8 + endNode.importance * 27); // Between 8 and 35
          
          const sigPhase = useExperienceStore.getState().signatureSearchPhase;
          if (sigPhase === 'unfold' || sigPhase === 'finish') {
            maxParticles = 35; // Max out every stream for an overwhelming cinematic flood
          }
          
          if (p < maxParticles) {
            const duration = tB - tA;
            // Spaced out delays: staggering particles along the path
            const delay = (p / maxParticles) * duration;
            const localTime = rippleTime - tA - delay;

            if (localTime >= 0) {
              // Loop phase to create a continuous flowing stream after the wave front passes
              const u = (localTime / duration) % 1.0;
              
              x = THREE.MathUtils.lerp(startVec.x, endVec.x, u);
              y = THREE.MathUtils.lerp(startVec.y, endVec.y, u);
              z = THREE.MathUtils.lerp(startVec.z, endVec.z, u);

              // Weaving wave offset
              const dirX = endVec.x - startVec.x;
              const dirY = endVec.y - startVec.y;
              const dirZ = endVec.z - startVec.z;
              const lenVal = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

              if (lenVal > 0.1) {
                const nx = -dirY / lenVal;
                const ny = dirX / lenVal;
                // Minor consequences weave more delicately, major streams are thicker
                const weaveAmp = 0.035 + (1.0 - endNode.importance) * 0.04;
                const wave = Math.sin(time * 15.0 + u * Math.PI * 6.0) * weaveAmp;
                x += nx * wave;
                y += ny * wave;
              }

              // Base warm gold color
              r = 0.95;
              g = 0.78;
              b = 0.35;

              // Sparkle shimmer
              const sparkle = 0.7 + Math.sin(time * 30.0 + i) * 0.3;
              r *= sparkle;
              g *= sparkle;
              b *= sparkle;

              // White-hot wave front for the leading particles
              if (u > 0.9) {
                r = 1.0;
                g = 0.95;
                b = 0.85;
              }
            }
          }
        }
      } else {
        // Steady-state exploration mode (only show 3 particles per connection)
        if (p < 3) {
          // Time Travel active connection check
          const getNumericYear = (nodeId: string): number => {
            switch (nodeId) {
              case "agricultural_revolution": return -3000;
              case "rise_of_cities": return -2500;
              case "writing_system": return -2000;
              case "code_of_hammurabi": return -1750;
              case "democratic_foundation": return -508;
              case "printing_press": return 1440;
              case "scientific_revolution": return 1543;
              case "enlightenment": return 1700;
              case "industrial_revolution": return 1760;
              case "digital_revolution": return 1969;
              case "artificial_intelligence": return 2026;
              default: return 2026;
            }
          };

          const timelineYear = useExperienceStore.getState().timelineYear;
          const timelineScrubbing = useExperienceStore.getState().timelineScrubbing;

          const yearStart = getNumericYear(startNode.id);
          const yearEnd = getNumericYear(endNode.id);
          const isConnectionActive = timelineYear >= yearStart && timelineYear >= yearEnd;

          // Check if this path is connected to the hovered or active node
          const isConnectedToHovered = hoveredNodeId && (
            nodes[flow.startIdx].id === hoveredNodeId ||
            nodes[flow.endIdx].id === hoveredNodeId
          );

          const isConnectedToActive = activeNodeId && (
            nodes[flow.startIdx].id === activeNodeId ||
            nodes[flow.endIdx].id === activeNodeId
          );

          const isHighlighted = isConnectedToHovered || isConnectedToActive;

          // Phase increment (Longer paths move slower, shorter paths zip faster)
          const dx = endVec.x - startVec.x;
          const dy = endVec.y - startVec.y;
          const dz = endVec.z - startVec.z;
          const pathLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const lengthSpeedFactor = pathLength > 0.1 ? (1.6 / pathLength) : 1.0;

          // Accelerate particles during scrubbing for time-travel warp effect, freeze if paused
          const speedMultiplier = isPaused ? 0.0 : (isHighlighted ? 2.5 : 1.0);
          const scrubSpeedMultiplier = timelineScrubbing ? 4.8 : 1.0;
          
          // Recreate continuous looping phase for steady-state
          flow.phase += flow.speed * lengthSpeedFactor * speedMultiplier * scrubSpeedMultiplier * dt;
          if (flow.phase > 1.0) {
            flow.phase -= 1.0;
          }

          const u = flow.phase;

          x = THREE.MathUtils.lerp(startVec.x, endVec.x, u);
          y = THREE.MathUtils.lerp(startVec.y, endVec.y, u);
          z = THREE.MathUtils.lerp(startVec.z, endVec.z, u);

          const dirX = endVec.x - startVec.x;
          const dirY = endVec.y - startVec.y;
          const dirZ = endVec.z - startVec.z;
          const lenVal = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

          if (lenVal > 0.1) {
            const nx = -dirY / lenVal;
            const ny = dirX / lenVal;
            const wave = Math.sin(time * 12.0 + u * Math.PI * 4.0) * 0.06;
            x += nx * wave;
            y += ny * wave;
          }

          // Only render particles if the connection is historically active
          if (isConnectionActive) {
            r = 0.85;
            g = 0.70;
            b = 0.22;

            if (isHighlighted) {
              r = 1.0;
              g = 0.88;
              b = 0.45;
            }
          } else {
            r = 0.0;
            g = 0.0;
            b = 0.0;
          }

          if (hoveredNodeId || activeNodeId) {
            if (isHighlighted) {
              r = 1.0;
              g = 0.88;
              b = 0.40;
              // Sparkle shimmer
              const sparkle = 0.7 + Math.sin(time * 25.0 + i) * 0.3;
              r *= sparkle;
              g *= sparkle;
              b *= sparkle;
            } else {
              r = 0.04;
              g = 0.03;
              b = 0.01;
            }
          }
        }
      }

      // Apply Butterfly Mode particle modulations
      const butterflyActive = useExperienceStore.getState().butterflyActive;
      const butterflyTime = useExperienceStore.getState().butterflyTime;
      const butterflyDisappearedNodeIds = useExperienceStore.getState().butterflyDisappearedNodeIds;

      if (butterflyActive) {
        const isCollapsed = butterflyDisappearedNodeIds.has(startNode.id) || butterflyDisappearedNodeIds.has(endNode.id);
        let pFade = 1.0;
        if (isCollapsed) {
          if (butterflyTime <= 3.0) {
            pFade = Math.max(0, 1.0 - butterflyTime / 3.0);
          } else {
            pFade = 0;
          }
        } else {
          if (butterflyTime <= 7.0) {
            pFade = 0.15;
          } else if (butterflyTime <= 9.0) {
            const f = (butterflyTime - 7.0) / 2.0;
            pFade = 0.15 + 0.85 * f;
          } else {
            pFade = 1.0;
          }
        }
        r *= pFade;
        g *= pFade;
        b *= pFade;
      }

      posArray[idx + 0] = x;
      posArray[idx + 1] = y;
      posArray[idx + 2] = z;

      colArray[idx + 0] = r;
      colArray[idx + 1] = g;
      colArray[idx + 2] = b;

      // Faint spatial audio feedback
      if (Math.random() < 0.00015) {
        causalityAudio.playSpatialParticle();
      }
    });

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.095}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};
