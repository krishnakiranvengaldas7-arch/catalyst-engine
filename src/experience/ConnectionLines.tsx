import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

interface ConnectionLinesProps {
  activePositions: THREE.Vector3[];
  universe?: "A" | "B";
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ activePositions, universe }) => {
  const nodes = useExperienceStore((state) => state.nodes);
  const currentState = useExperienceStore((state) => state.currentState);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);
  const hoveredNodeId = useExperienceStore((state) => state.hoveredNodeId);
  const searchFocused = useExperienceStore((state) => state.searchFocused);
  const selectedClusterId = useExperienceStore((state) => state.selectedClusterId);
  const clusters = useExperienceStore((state) => state.clusters);
  const activeNodeId = useExperienceStore((state) => state.activeNodeId);
  const timelineYear = useExperienceStore((state) => state.timelineYear);

  // Butterfly Mode selectors
  const butterflyActive = useExperienceStore((state) => state.butterflyActive);
  const butterflyAlternativeEdges = useExperienceStore((state) => state.butterflyAlternativeEdges);

  // Comparison Mode selectors
  const compareMode = useExperienceStore((state) => state.compareMode);
  const compareDisappearedNodeIds = useExperienceStore((state) => state.compareDisappearedNodeIds);
  const compareAlternativeEdges = useExperienceStore((state) => state.compareAlternativeEdges);

  const groupRef = useRef<THREE.Group | null>(null);
  const focusOpacity = useRef(1.0);

  // Calculate smooth fade factor based on GSAP entrance progress
  // Completely invisible during loading and intro, fades in gradually from 12% to 82% of the fly-through
  const fade =
    (currentState === "loading" || currentState === "intro")
      ? 0.0
      : currentState === "explore"
      ? Math.min(Math.max((entranceProgress - 0.12) / 0.7, 0), 1)
      : 1.0;

  // Pre-calculate index pairs for connections to avoid lookup overhead in render
  const connections = useMemo(() => {
    const list: Array<{
      id: string;
      startIdx: number;
      endIdx: number;
    }> = [];

    nodes.forEach((node, startIdx) => {
      node.connections.forEach((targetId) => {
        const endIdx = nodes.findIndex((n) => n.id === targetId);
        if (endIdx !== -1) {
          list.push({
            id: `connection-${node.id}-${targetId}`,
            startIdx,
            endIdx,
          });
        }
      });
    });

    return list;
  }, [nodes]);

  // Smoothly lerp connection line opacities inside the frame loop
  const pulsePhase = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const isPaused = useExperienceStore.getState().isPaused;
    
    // Accumulate phase physically to replace time-based animations
    if (!isPaused) {
      pulsePhase.current += dt;
    }
    
    // Dim connections by 85% when search is focused
    const targetOpacity = searchFocused ? 0.15 : 1.0;
    focusOpacity.current = THREE.MathUtils.lerp(focusOpacity.current, targetOpacity, 4.5 * dt);

    // Reality Threads Simulation
    const rippleActive = useExperienceStore.getState().rippleActive;
    const rippleTime = useExperienceStore.getState().rippleTime;
    const rippleActivationTimes = useExperienceStore.getState().rippleActivationTimes;

    // Butterfly Mode States
    const butterflyActive = useExperienceStore.getState().butterflyActive;
    const butterflyTime = useExperienceStore.getState().butterflyTime;
    const butterflyDisappearedNodeIds = useExperienceStore.getState().butterflyDisappearedNodeIds;

    if (groupRef.current) {
      groupRef.current.children.forEach((child: any) => {
        if (child.material && child.userData) {
          const mat = child.material;

          // Handle alternative timeline connections
          if (child.userData.isAlternative) {
            if (butterflyActive && butterflyTime >= 7.0) {
              const f = Math.min(1.0, (butterflyTime - 7.0) / 2.0);
              const pulse = 0.35 + Math.sin(pulsePhase.current * 8.0 + child.userData.idx) * 0.15;
              mat.opacity = f * pulse * fade;
            } else if (compareMode && universe === "B") {
              // Dotted alternative lines are fully visible and pulse gently
              const pulse = 0.45 + Math.sin(pulsePhase.current * 4.0 + child.userData.idx) * 0.15;
              mat.opacity = pulse * fade;
            } else {
              mat.opacity = 0;
            }
            return;
          }

          if (child.userData.baseOpacity !== undefined) {
            const { baseOpacity, startNodeId, endNodeId, baseLineWidth } = child.userData;

            let finalOpacity = baseOpacity * focusOpacity.current * fade;
            let targetColor = child.userData.baseColor || "#d4af37";

            // Time Travel Engine birth and fade calculations for connection lines
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

            const timelineYearVal = useExperienceStore.getState().timelineYear;
            const yearStart = getNumericYear(startNodeId);
            const yearEnd = getNumericYear(endNodeId);
            
            let timelineLineFade = 0.0;
            if (timelineYearVal >= yearStart && timelineYearVal >= yearEnd) {
              const laterYear = Math.max(yearStart, yearEnd);
              const getFadeWindow = (yr: number): number => {
                if (yr < 0) return 150;
                if (yr < 1900) return 40;
                return 3;
              };
              const fadeWindow = getFadeWindow(laterYear);
              timelineLineFade = Math.min(1.0, (timelineYearVal - laterYear) / fadeWindow);
            }

            // Dim ancient connection lines as time progresses past their era
            let historyLineFade = 1.0;
            const yearsPast = timelineYearVal - Math.max(yearStart, yearEnd);
            if (yearsPast > 400 && Math.max(yearStart, yearEnd) < 1000) {
              historyLineFade = 1.0 - 0.6 * Math.min(1.0, (yearsPast - 400) / 600);
            }

            finalOpacity *= timelineLineFade * historyLineFade;

            // Influence Gravity System connection density visualization
            const influenceMode = useExperienceStore.getState().influenceMode;
            const wellIds = ["agricultural_revolution", "writing_system", "printing_press", "scientific_revolution", "industrial_revolution", "digital_revolution", "artificial_intelligence"];
            const isConnToWell = wellIds.includes(startNodeId) || wellIds.includes(endNodeId);

            if (influenceMode) {
              if (isConnToWell) {
                finalOpacity = Math.min(1.0, finalOpacity * 2.2);
                targetColor = "#fef08a"; // Glowing yellow-white
              } else {
                finalOpacity *= 0.15; // Soften other lines
              }
            }

            if (rippleActive) {
              const tA = rippleActivationTimes[startNodeId];
              const tB = rippleActivationTimes[endNodeId];
              const isConsequencePath = tA !== undefined && tB !== undefined && tA !== Infinity && tB !== Infinity && tB > tA;

              if (isConsequencePath) {
                const duration = tB - tA;
                if (rippleTime >= tB) {
                  // Fully reached and illuminated
                  finalOpacity = 0.75 * focusOpacity.current * fade;
                  targetColor = "#fcd34d"; // Glowing amber
                } else if (rippleTime >= tA) {
                  // Currently traveling
                  const u = (rippleTime - tA) / duration;
                  finalOpacity = (0.15 + u * 0.55) * focusOpacity.current * fade;
                  targetColor = "#ffffff"; // White hot front
                  // High-frequency pulsing glow
                  finalOpacity += Math.sin(pulsePhase.current * 30.0) * 0.05 * focusOpacity.current * fade;
                } else {
                  // Unreached
                  finalOpacity = 0.02 * focusOpacity.current * fade;
                }
              } else {
                // Unrelated path
                finalOpacity = 0.01 * focusOpacity.current * fade;
              }
            }

            // Apply Butterfly Mode connection line modulations
            if (butterflyActive) {
              const isCollapsed = butterflyDisappearedNodeIds.has(startNodeId) || butterflyDisappearedNodeIds.has(endNodeId);
              let bLineOpacity = 1.0;

              if (isCollapsed) {
                if (butterflyTime <= 1.5) {
                  bLineOpacity = 1.0 - (1.0 - 0.15) * (butterflyTime / 1.5);
                } else if (butterflyTime <= 3.0) {
                  bLineOpacity = 0.15;
                } else if (butterflyTime <= 5.5) {
                  const f = (5.5 - butterflyTime) / 2.5;
                  bLineOpacity = 0.15 * f;
                } else {
                  bLineOpacity = 0.0;
                }
              } else {
                if (butterflyTime <= 1.5) {
                  bLineOpacity = 1.0 - (1.0 - 0.15) * (butterflyTime / 1.5);
                } else if (butterflyTime <= 7.0) {
                  bLineOpacity = 0.15;
                } else if (butterflyTime <= 9.0) {
                  const f = (butterflyTime - 7.0) / 2.0;
                  bLineOpacity = 0.15 + 0.85 * f;
                } else {
                  bLineOpacity = 1.0;
                }
              }
              finalOpacity *= bLineOpacity;
            }

            // Apply to material
            if (mat.color) {
              mat.color.set(targetColor);
            }
            if (mat.uniforms && mat.uniforms.opacity) {
              mat.uniforms.opacity.value = finalOpacity;
            } else {
              mat.opacity = finalOpacity;
            }

            // Dynamically modulate line width
            let currentWidth = baseLineWidth || 0.8;
            if (influenceMode) {
              currentWidth = isConnToWell ? 2.2 : 0.22;
            }
            if (mat.uniforms && mat.uniforms.linewidth) {
              mat.uniforms.linewidth.value = currentWidth;
            } else if (mat.linewidth !== undefined) {
              mat.linewidth = currentWidth;
            }
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {connections.map((conn) => {
        const start = activePositions[conn.startIdx];
        const end = activePositions[conn.endIdx];

        if (!start || !end) return null;

        const startNode = nodes[conn.startIdx];
        const endNode = nodes[conn.endIdx];

        // Hide in Universe B if either node dissolved
        const isCollapsedInB = compareMode && universe === "B" && (
          compareDisappearedNodeIds.has(startNode.id) ||
          compareDisappearedNodeIds.has(endNode.id)
        );
        if (isCollapsedInB) return null;

        // Check if this connection line touches the hovered or active node
        const isConnectedToHovered = hoveredNodeId && (
          nodes[conn.startIdx].id === hoveredNodeId ||
          nodes[conn.endIdx].id === hoveredNodeId
        );

        const isConnectedToActive = activeNodeId && (
          nodes[conn.startIdx].id === activeNodeId ||
          nodes[conn.endIdx].id === activeNodeId
        );

        const isHighlighted = isConnectedToHovered || isConnectedToActive;

        const selectedCluster = clusters.find((c) => c.id === selectedClusterId);
        const isInternalClusterConn = selectedCluster && (
          selectedCluster.nodeIds.includes(nodes[conn.startIdx].id) &&
          selectedCluster.nodeIds.includes(nodes[conn.endIdx].id)
        );

        // Highlight connected paths, dim all others when a node is hovered, active, or cluster is active
        let opacity = 0.22;
        let color = "#d4af37"; // Delicate warm gold thread
        let lineWidth = 0.8;

        if (hoveredNodeId || activeNodeId) {
          if (isHighlighted) {
            opacity = 0.65;
            color = "#fcd34d"; // Glowing amber gold highlight
            lineWidth = 1.25;
          } else {
            opacity = 0.03;
          }
        } else if (selectedClusterId) {
          if (isInternalClusterConn) {
            opacity = 0.45;
            color = selectedCluster.color;
            lineWidth = 1.0;
          } else {
            opacity = 0.03;
          }
        }

        // Read Reality Threads state
        const rippleActive = useExperienceStore.getState().rippleActive;
        const rippleActivationTimes = useExperienceStore.getState().rippleActivationTimes;

        const tA = rippleActivationTimes[startNode?.id];
        const tB = rippleActivationTimes[endNode?.id];
        const isConsequencePath = rippleActive && tA !== undefined && tB !== undefined && tA !== Infinity && tB !== Infinity && tB > tA;

        let finalLineWidth = lineWidth;
        if (rippleActive) {
          finalLineWidth = isConsequencePath ? (0.6 + endNode.importance * 2.8) : 0.2;
        }

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

        const yearStart = getNumericYear(startNode.id);
        const yearEnd = getNumericYear(endNode.id);

        let initialTimelineFade = 0.0;
        if (timelineYear >= yearStart && timelineYear >= yearEnd) {
          const laterYear = Math.max(yearStart, yearEnd);
          const getFadeWindow = (yr: number): number => {
            if (yr < 0) return 150;
            if (yr < 1900) return 40;
            return 3;
          };
          const fadeWindow = getFadeWindow(laterYear);
          initialTimelineFade = Math.min(1.0, (timelineYear - laterYear) / fadeWindow);
        }

        let initialHistoryFade = 1.0;
        const yearsPastInitial = timelineYear - Math.max(yearStart, yearEnd);
        if (yearsPastInitial > 400 && Math.max(yearStart, yearEnd) < 1000) {
          initialHistoryFade = 1.0 - 0.6 * Math.min(1.0, (yearsPastInitial - 400) / 600);
        }

        const totalInitialFade = initialTimelineFade * initialHistoryFade;

        return (
          <Line
            key={conn.id}
            points={[start, end]}
            color={color}
            lineWidth={finalLineWidth}
            transparent
            opacity={opacity * fade * totalInitialFade} // Will be modulated by focusOpacity in useFrame
            depthWrite={false}
            userData={{ 
              baseOpacity: opacity,
              baseColor: color,
              baseLineWidth: lineWidth,
              startNodeId: startNode.id,
              endNodeId: endNode.id
            }}
          />
        );
      })}

      {/* Alternative Timeline Paths (Butterfly / Compare Reconnection) */}
      {((butterflyActive && butterflyAlternativeEdges.length > 0) || (compareMode && universe === "B" && compareAlternativeEdges.length > 0)) && 
        (butterflyActive ? butterflyAlternativeEdges : compareAlternativeEdges).map((edge, idx) => {
        const startNode = nodes.find((n) => n.id === edge.from);
        const endNode = nodes.find((n) => n.id === edge.to);
        if (!startNode || !endNode) return null;

        const startIdx = nodes.indexOf(startNode);
        const endIdx = nodes.indexOf(endNode);

        const start = activePositions[startIdx];
        const end = activePositions[endIdx];
        if (!start || !end) return null;

        return (
          <Line
            key={`alt-connection-${edge.from}-${edge.to}`}
            points={[start, end]}
            color="#06b6d4" // Cyber Cyan/Teal for alternative timelines
            lineWidth={1.2}
            transparent
            opacity={0} // Managed dynamically by useFrame
            depthWrite={false}
            dashed
            dashScale={4}
            dashSize={0.1}
            gapSize={0.06}
            userData={{
              isAlternative: true,
              fromId: edge.from,
              toId: edge.to,
              idx: idx
            }}
          />
        );
      })}
    </group>
  );
};
