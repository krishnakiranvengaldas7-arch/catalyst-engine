import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";
import { LightingManager } from "./LightingManager";
import { CameraManager } from "./CameraManager";
import { CosmicCore } from "./CosmicCore";
import { Atmosphere } from "./Atmosphere";
import { ConnectionLines } from "./ConnectionLines";
import { InteractiveNode } from "./InteractiveNode";
import { TravellingParticles } from "./TravellingParticles";
import { InteractiveCluster } from "./InteractiveCluster";
import { SpacetimeGrid } from "./SpacetimeGrid";
import { MultiverseBridges } from "./MultiverseBridges";
import { CinematicEffects } from "./CinematicEffects";
import { CosmicConstellations } from "./CosmicConstellations";
import { ConstellationEngine } from "./ConstellationEngine";
import { ConstellationLines } from "./ConstellationLines";
import { CatalystDiscover } from "./CatalystDiscover";
import { SignatureSearch } from "./SignatureSearch";

export const SceneManager: React.FC = () => {
  const nodes = useExperienceStore((state) => state.nodes);
  const hoveredNodeId = useExperienceStore((state) => state.hoveredNodeId);
  const currentState = useExperienceStore((state) => state.currentState);
  const selectedClusterId = useExperienceStore((state) => state.selectedClusterId);
  const hoveredClusterId = useExperienceStore((state) => state.hoveredClusterId);
  const clusters = useExperienceStore((state) => state.clusters);
  const activeNodeId = useExperienceStore((state) => state.activeNodeId);
  const showFullChain = useExperienceStore((state) => state.showFullChain);
  const compareMode = useExperienceStore((state) => state.compareMode);

  // Pre-calculate causal generations for the active node (Grandparents to Grandchildren)
  const causalGenerations = useMemo(() => {
    if (!activeNodeId) return new Map<string, number>();
    
    const generations = new Map<string, number>();
    generations.set(activeNodeId, 0);

    const activeNode = nodes.find(n => n.id === activeNodeId);
    
    // 1. Ancestors (Causes) - Up to 2 generations back
    const immediateCauses = activeNode?.incomingCauses || [];
    immediateCauses.forEach((causeId) => {
      generations.set(causeId, -1);
      const grandparents = nodes.find(n => n.id === causeId)?.incomingCauses || [];
      grandparents.forEach((grandparentId) => {
        generations.set(grandparentId, -2);
      });
    });

    // 2. Descendants (Consequences) - Up to 2 generations forward
    const immediateConseq = activeNode?.outgoingConsequences || [];
    immediateConseq.forEach((conseqId) => {
      generations.set(conseqId, 1);
      const grandchildren = nodes.find(n => n.id === conseqId)?.outgoingConsequences || [];
      grandchildren.forEach((grandchildId) => {
        generations.set(grandchildId, 2);
      });
    });

    return generations;
  }, [activeNodeId, nodes]);

  // Pre-allocate Vector3 instances for active node coordinates to prevent GC churn
  const activePositions = useMemo(() => {
    return nodes.map(() => new THREE.Vector3());
  }, [nodes]);

  // Reusable vector instances for calculations
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const mouseWorld = useMemo(() => new THREE.Vector3(), []);

  // Hover transition and gravity wave tracking refs
  const hoverTransition = useRef(0.0);
  const lastHoveredId = useRef<string | null>(null);
  const hoverStartTime = useRef(0.0);
  const lastHoveredNodePos = useRef(new THREE.Vector3());

  // Active node selection gravity wave tracking refs
  const selectStartTime = useRef(0.0);
  const lastActiveId = useRef<string | null>(null);
  const lastActiveNodePos = useRef(new THREE.Vector3());

  // Mutable base coordinate references for smooth cosmic slide transitions
  const currentBases = useRef<THREE.Vector3[]>([]);
  if (currentBases.current.length !== nodes.length) {
    currentBases.current = nodes.map((node) => new THREE.Vector3().fromArray(node.position));
  }

  // Mutable velocity references for the real-time 3D force-directed simulation
  const velocities = useRef<THREE.Vector3[]>([]);
  if (velocities.current.length !== nodes.length) {
    velocities.current = nodes.map(() => new THREE.Vector3(0, 0, 0));
  }

  const fogRef = useRef<THREE.Fog | null>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);
    const { pointer, camera } = state;

    // Reality Threads ripple simulation time increment (GPU-friendly bypass)
    const rippleActive = useExperienceStore.getState().rippleActive;
    const ripplePaused = useExperienceStore.getState().ripplePaused;
    const ripplePlaybackSpeed = useExperienceStore.getState().ripplePlaybackSpeed;
    const rippleTime = useExperienceStore.getState().rippleTime;

    if (rippleActive && !ripplePaused) {
      const nextTime = rippleTime + dt * ripplePlaybackSpeed;
      useExperienceStore.getState().setRippleTime(nextTime);
    }

    // Butterfly Mode simulation time increment (GPU-friendly bypass)
    const butterflyActive = useExperienceStore.getState().butterflyActive;
    const butterflyPaused = useExperienceStore.getState().butterflyPaused;
    const butterflyPlaybackSpeed = useExperienceStore.getState().butterflyPlaybackSpeed;
    const butterflyTime = useExperienceStore.getState().butterflyTime;

    if (butterflyActive && !butterflyPaused) {
      const nextTime = butterflyTime + dt * butterflyPlaybackSpeed;
      useExperienceStore.getState().setButterflyTime(nextTime);
    }

    // Dynamically adjust fog near and far to create a natural depth-of-field lens blur focus
    if (fogRef.current) {
      let targetFogNear = 6.0;
      let targetFogFar = 26.0;
      
      if (activeNodeId) {
        const activeNode = nodes.find(n => n.id === activeNodeId);
        if (activeNode) {
          const activePos = new THREE.Vector3().fromArray(activeNode.position);
          const dist = camera.position.distanceTo(activePos);
          
          // Lens focal depth focus pull: narrow focus range around the subject
          targetFogNear = Math.max(0.5, dist - 1.2);
          targetFogFar = dist + 3.8;
        }
      }
      
      fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, targetFogNear, 3.5 * dt);
      fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, targetFogFar, 3.5 * dt);
    }

    // 1. Calculate the mouse pointer coordinate in 3D world space
    mouseWorld.set(pointer.x * 5.0, pointer.y * 3.5, 0.0);
    mouseWorld.applyMatrix4(camera.matrixWorld);

    // Read user inactivity state for ambient evolution
    const isIdle = useExperienceStore.getState().isIdle;

    // 2. Track hover state changes to trigger the gravity ripple
    if (hoveredNodeId !== lastHoveredId.current) {
      if (hoveredNodeId) {
        // Reset gravity wave ripple timer
        hoverStartTime.current = time;
        
        // Save hovered node position
        const hoveredNode = nodes.find((n) => n.id === hoveredNodeId);
        if (hoveredNode) {
          lastHoveredNodePos.current.fromArray(hoveredNode.position);
        }
      }
      lastHoveredId.current = hoveredNodeId;
    }

    // Track active node selection changes to trigger a selection gravity ripple
    if (activeNodeId !== lastActiveId.current) {
      if (activeNodeId) {
        selectStartTime.current = time;
        const activeNode = nodes.find((n) => n.id === activeNodeId);
        if (activeNode) {
          lastActiveNodePos.current.fromArray(activeNode.position);
        }
      }
      lastActiveId.current = activeNodeId;
    }

    // Smooth inertia interpolation for the elastic neighbor attraction force
    if (hoveredNodeId && currentState === "explore") {
      hoverTransition.current = THREE.MathUtils.lerp(hoverTransition.current, 1.0, 5.0 * dt);
    } else {
      hoverTransition.current = THREE.MathUtils.lerp(hoverTransition.current, 0.0, 5.0 * dt);
    }

    // 3. Reorganize base positions dynamically based on selected discovery cluster or full chain expansion
    const selectedCluster = clusters.find((c) => c.id === selectedClusterId);
    
    // Count nodes in each generation for vertical layout distribution
    const genCounts = new Map<number, number>();
    const genIndices = new Map<string, number>();

    if (activeNodeId && showFullChain) {
      causalGenerations.forEach((gen, nodeId) => {
        const count = genCounts.get(gen) || 0;
        genIndices.set(nodeId, count);
        genCounts.set(gen, count + 1);
      });
    }

    // Pre-calculate target anchors for all nodes
    const targetBases = nodes.map((node, index) => {
      const target = new THREE.Vector3();
      if (activeNodeId && showFullChain) {
        const gen = causalGenerations.get(node.id);
        if (gen !== undefined) {
          const idx = genIndices.get(node.id) || 0;
          const count = genCounts.get(gen) || 1;
          
          // Position generations horizontally from left (causes) to right (effects)
          const posX = gen * 3.2; // Generational columns
          
          // Distribute nodes vertically within each generation shell
          const posY = count > 1 ? (idx - (count - 1) / 2) * 2.2 : 0.0;
          const posZ = Math.sin(index * 2.5) * 0.4;
          
          target.set(posX, posY, posZ);
          
          // Anchor the entire causal tree around the active node's baseline position
          const activeNode = nodes.find(n => n.id === activeNodeId);
          if (activeNode) {
            target.add(new THREE.Vector3().fromArray(activeNode.position));
          }
        } else {
          // Push unrelated background nodes away into a distant sphere centered on active node
          const angle = (index / nodes.length) * Math.PI * 2;
          const bgRadius = 14.5;
          const activeNode = nodes.find(n => n.id === activeNodeId);
          const centerPos = activeNode ? new THREE.Vector3().fromArray(activeNode.position) : new THREE.Vector3();
          
          target.set(
            centerPos.x + Math.cos(angle) * bgRadius,
            centerPos.y + Math.sin(angle) * bgRadius * 0.6,
            centerPos.z + Math.sin(angle * 1.2) * bgRadius * 0.5
          );
        }
      } else if (selectedCluster) {
        const isMember = selectedCluster.nodeIds.includes(node.id);
        if (isMember) {
          const memberIdx = selectedCluster.nodeIds.indexOf(node.id);
          const memberCount = selectedCluster.nodeIds.length;
          const angle = (memberIdx / memberCount) * Math.PI * 2 + time * 0.12;
          const orbitRadius = 2.2 + (memberIdx % 2) * 0.6;
          target.set(
            selectedCluster.position[0] + Math.cos(angle) * orbitRadius,
            selectedCluster.position[1] + Math.sin(angle) * orbitRadius * 0.4,
            selectedCluster.position[2] + Math.sin(angle * 1.3) * orbitRadius * 0.3
          );
        } else {
          const angle = (index / nodes.length) * Math.PI * 2 - time * 0.03;
          const bgRadius = 13.0 + (index % 4) * 1.5;
          target.set(
            selectedCluster.position[0] + Math.cos(angle) * bgRadius,
            selectedCluster.position[1] + Math.sin(angle) * bgRadius * 0.5,
            selectedCluster.position[2] + Math.sin(angle * 1.1) * bgRadius * 0.4
          );
        }
      } else {
        target.fromArray(node.position);
      }
      return target;
    });

    // 4. Soft-Body Force-Directed Physics Simulation
    //    Every force is physically motivated. No sine-wave overlays.
    const forceVec = new THREE.Vector3();
    const diffVec = new THREE.Vector3();
    
    // Physics coefficients tuned for locked 60 FPS organic settling
    const anchorStiffness = 4.5;        // Spring constant pulling towards layout target
    const repelRadius = 2.8;            // Soft collision avoidance radius
    const repelStrength = 9.0;          // Collision push magnitude
    const connectionRestLength = 2.0;   // Spring rest length for causal connections
    const connectionStiffness = 2.4;    // Connection spring constant
    const connectionDamping = 0.6;      // Connection velocity damping
    const simDamping = 0.82;            // Global velocity damping (0.82 = gentle deceleration)
    const thermalEnergy = 0.35;         // Ambient Brownian drift magnitude
    const neighbourCoupling = 0.12;     // Velocity coupling strength between connected nodes
    const isPaused = useExperienceStore.getState().isPaused;

    for (let i = 0; i < nodes.length; i++) {
      const posI = currentBases.current[i];
      const velI = velocities.current[i];
      
      forceVec.set(0, 0, 0);

      // A. Anchor spring force (Hooke's law pull towards target layout slot)
      diffVec.subVectors(targetBases[i], posI);
      const anchorDist = diffVec.length();
      if (anchorDist > 0.001) {
        // Non-linear stiffness: stiffer when far, softer when close (prevents oscillation)
        const adaptiveStiffness = anchorStiffness * (1.0 + anchorDist * 0.3);
        diffVec.normalize().multiplyScalar(adaptiveStiffness * anchorDist);
        forceVec.add(diffVec);
        
        // Anchor damping to prevent overshoot (critical damping approach)
        const anchorDampForce = -2.2;
        forceVec.addScaledVector(velI, anchorDampForce * Math.min(anchorDist, 1.0));
      }

      // B. Smooth collision avoidance with exponential soft-body falloff
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const posJ = currentBases.current[j];
        diffVec.subVectors(posI, posJ);
        const dist = diffVec.length();
        
        if (dist < repelRadius && dist > 0.01) {
          // Exponential falloff produces smooth, jitter-free repulsion
          const overlap = 1.0 - dist / repelRadius;
          const pushForce = repelStrength * overlap * overlap; // Quadratic for softness
          diffVec.normalize().multiplyScalar(pushForce);
          forceVec.add(diffVec);
        }
      }

      // C. Elastic connection tension (spring + damping between connected nodes)
      const nodeI = nodes[i];
      nodeI.connections.forEach((connId) => {
        const j = nodes.findIndex((n) => n.id === connId);
        if (j !== -1) {
          const posJ = currentBases.current[j];
          const velJ = velocities.current[j];
          diffVec.subVectors(posJ, posI);
          const dist = diffVec.length();
          if (dist > 0.01) {
            // Spring force: pull when stretched, push when compressed
            const displacement = dist - connectionRestLength;
            const springForce = displacement * connectionStiffness;
            const dir = diffVec.clone().normalize();
            forceVec.addScaledVector(dir, springForce);
            
            // Connection velocity damping (relative velocity along connection axis)
            const relVel = new THREE.Vector3().subVectors(velJ, velI);
            const relVelAlongAxis = relVel.dot(dir);
            forceVec.addScaledVector(dir, relVelAlongAxis * connectionDamping);
            
            // Neighbour velocity coupling (nodes inherit nearby motion)
            forceVec.addScaledVector(velJ, neighbourCoupling / (dist + 0.5));
          }
        }
      });

      // D. Influence Gravity orbit and swirl pull force
      const influenceMode = useExperienceStore.getState().influenceMode;
      const wellIds = ["agricultural_revolution", "writing_system", "printing_press", "scientific_revolution", "industrial_revolution", "digital_revolution", "artificial_intelligence"];
      if (influenceMode && !wellIds.includes(nodeI.id)) {
        let nearestWellIdx = -1;
        let minDist = Infinity;
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          if (wellIds.includes(nodes[j].id)) {
            const dist = posI.distanceTo(currentBases.current[j]);
            if (dist < minDist) {
              minDist = dist;
              nearestWellIdx = j;
            }
          }
        }

        if (nearestWellIdx !== -1) {
          const wellPos = currentBases.current[nearestWellIdx];
          const wellNode = nodes[nearestWellIdx];
          diffVec.subVectors(wellPos, posI);
          const dist = diffVec.length();
          if (dist > 0.5) {
            const gravityStrength = 3.6 * (wellNode.influenceScore / 100.0) / (dist * dist + 0.8);
            diffVec.normalize().multiplyScalar(gravityStrength);
            forceVec.add(diffVec);

            const orbitVec = new THREE.Vector3(-diffVec.y, diffVec.x, 0).normalize();
            const orbitSpeed = 1.8 / (dist + 0.5);
            forceVec.addScaledVector(orbitVec, orbitSpeed);
          }
        }
      }

      // E. Ambient thermal drift (Brownian motion — continuous gentle random force)
      //    Uses deterministic noise seeded per-node so behaviour is smooth frame-to-frame
      if (!isPaused) {
        const idleMultiplier = isIdle ? 2.2 : 1.0;
        const noisePhase = time * 0.4 + i * 7.31; // Unique phase per node
        const thermalX = (Math.sin(noisePhase * 1.17) * Math.cos(noisePhase * 0.73 + 2.1)) * thermalEnergy * idleMultiplier;
        const thermalY = (Math.cos(noisePhase * 0.89) * Math.sin(noisePhase * 1.31 + 4.7)) * thermalEnergy * idleMultiplier;
        const thermalZ = (Math.sin(noisePhase * 1.53 + 1.3) * Math.cos(noisePhase * 0.61)) * thermalEnergy * idleMultiplier * 0.7;
        forceVec.x += thermalX;
        forceVec.y += thermalY;
        forceVec.z += thermalZ;
      }

      // F. Integrate semi-implicit Euler with butterfly freeze factor
      const freezeFactor = butterflyActive ? Math.max(0, 1.0 - butterflyTime / 1.5) : 1.0;
      
      velI.addScaledVector(forceVec, dt * freezeFactor);
      velI.multiplyScalar(simDamping);
      
      // Velocity clamping to prevent explosion (max 8 units/sec)
      const speed = velI.length();
      if (speed > 8.0) {
        velI.multiplyScalar(8.0 / speed);
      }
      
      posI.addScaledVector(velI, dt * freezeFactor);

      // G. Output: active positions are the physics positions directly — no overlays
      const active = activePositions[i];
      active.copy(posI);
    }

    // 6. Apply smooth elastic attraction (pull connected nodes closer on hover)
    if (hoverTransition.current > 0.001 && lastHoveredId.current && currentState === "explore") {
      const hoveredIdx = nodes.findIndex((n) => n.id === lastHoveredId.current);
      if (hoveredIdx !== -1) {
        const hoveredPos = activePositions[hoveredIdx];

        // Find and pull all connected neighbors
        nodes.forEach((node, idx) => {
          if (idx === hoveredIdx) return;

          const isConnected =
            node.connections.includes(lastHoveredId.current!) ||
            nodes[hoveredIdx].connections.includes(node.id);

          if (isConnected) {
            // Elastically pull neighboring nodes 16% closer, scaled by the smooth hover transition
            activePositions[idx].lerp(hoveredPos, 0.16 * hoverTransition.current);
          }
        });
      }
    }

    // 7. Apply outward gravity shockwave / ripple on hover
    const rippleDuration = 1.6;
    const hoverTime = time - hoverStartTime.current;
    
    if (hoverTime < rippleDuration && lastHoveredId.current && currentState === "explore") {
      const waveRadius = hoverTime * 11.5; // Expands outward at 11.5 units per second
      const waveWidth = 2.4;
      
      activePositions.forEach((active, idx) => {
        // Skip the hovered node itself
        if (nodes[idx].id === lastHoveredId.current) return;

        const dist = active.distanceTo(lastHoveredNodePos.current);
        const distFromWave = Math.abs(dist - waveRadius);
        
        if (distFromWave < waveWidth) {
          // Soft wave profile that peaks in the center of the wave thickness
          // Exponential decay over time to keep the ripple extremely elegant and damp out
          const waveForce = (1.0 - distFromWave / waveWidth) * 0.12 * Math.exp(-hoverTime * 1.8);
          
          // Calculate push direction: away from the hovered source node
          tempVec.subVectors(active, lastHoveredNodePos.current).normalize();
          
          // Displace coordinates outward along the wave direction
          active.addScaledVector(tempVec, waveForce);
        }
      });
    }

    // 7.5 Apply outward selection gravity shockwave / ripple on node click
    const selectRippleDuration = 2.2;
    const selectTime = time - selectStartTime.current;
    
    if (selectTime < selectRippleDuration && lastActiveId.current && currentState === "explore") {
      const waveRadius = selectTime * 14.5; // Expands faster (14.5 units per second)
      const waveWidth = 3.2; // Wider wave
      
      activePositions.forEach((active, idx) => {
        // Skip the selected node itself
        if (nodes[idx].id === lastActiveId.current) return;

        const dist = active.distanceTo(lastActiveNodePos.current);
        const distFromWave = Math.abs(dist - waveRadius);
        
        if (distFromWave < waveWidth) {
          // Displace nodes outward, then pull them back slightly (sinusoidal shockwave)
          const wavePhase = (distFromWave / waveWidth) * Math.PI;
          const waveForce = Math.sin(wavePhase) * 0.35 * Math.exp(-selectTime * 1.5);
          
          // Calculate push direction
          tempVec.subVectors(active, lastActiveNodePos.current).normalize();
          
          // Displace coordinates
          active.addScaledVector(tempVec, waveForce);
        }
      });
    }

    // 8. Apply mouse space bending (local spatial warp near the pointer)
    if (currentState === "explore") {
      activePositions.forEach((active) => {
        const dist = active.distanceTo(mouseWorld);
        if (dist < 4.5) {
          const force = (1.0 - dist / 4.5) * 0.38;
          tempVec.subVectors(active, mouseWorld).normalize();
          active.addScaledVector(tempVec, force);
        }
      });
    }
  });

  return (
    <>
      {/* Cinematic deep space fog that fades elements out based on distance */}
      <fog ref={fogRef} attach="fog" args={["#000000", 6, 26]} />

      {/* Reusable Camera Controller */}
      <CameraManager />

      {/* Reusable Lighting Rig */}
      <LightingManager />

      {/* Unified Cosmic Background, Particle, and Loader Core */}
      <CosmicCore />

      {/* Advanced Atmospheric Rendering Environment */}
      <Atmosphere />

      {/* Spacetime Curvature Grid */}
      <SpacetimeGrid activePositions={activePositions} />

      {compareMode ? (
        <>
          {/* Universe A (Original) on the Left */}
          <group position={[-9.5, 0, 0]}>
            <ConnectionLines activePositions={activePositions} universe="A" />
            <TravellingParticles nodes={nodes} activePositions={activePositions} universe="A" />
            {nodes.map((node, index) => (
              <InteractiveNode
                key={`uniA-${node.id}`}
                node={node}
                activePosition={activePositions[index]}
                universe="A"
              />
            ))}
          </group>

          {/* Universe B (Altered) on the Right */}
          <group position={[9.5, 0, 0]}>
            <ConnectionLines activePositions={activePositions} universe="B" />
            <TravellingParticles nodes={nodes} activePositions={activePositions} universe="B" />
            {nodes.map((node, index) => (
              <InteractiveNode
                key={`uniB-${node.id}`}
                node={node}
                activePosition={activePositions[index]}
                universe="B"
              />
            ))}
          </group>

          {/* Elegant glowing visual bridges and space divider beam */}
          <MultiverseBridges activePositions={activePositions} />
        </>
      ) : (
        <>
          {/* Reusable Connection Lines between active coordinates */}
          <ConnectionLines activePositions={activePositions} />

          {/* Glowing cause-and-effect information pulses */}
          <TravellingParticles nodes={nodes} activePositions={activePositions} />

          {/* Discovery path celestial clusters */}
          {clusters.map((cluster) => (
            <InteractiveCluster key={cluster.id} cluster={cluster} />
          ))}

          {/* Constellation Engine: thematic group overlays that appear at macro zoom */}
          <ConstellationEngine activePositions={activePositions} />

          {/* Constellation celestial-map connection lines */}
          <ConstellationLines activePositions={activePositions} />

          {/* Dynamic Cluster-to-Node Connection Threads */}
          {clusters.map((cluster) => {
            const isClusterActive = hoveredClusterId === cluster.id || selectedClusterId === cluster.id;
            if (!isClusterActive) return null;

            return cluster.nodeIds.map((nodeId) => {
              const nodeIdx = nodes.findIndex((n) => n.id === nodeId);
              if (nodeIdx === -1) return null;

              const start = new THREE.Vector3().fromArray(cluster.position);
              const end = activePositions[nodeIdx];

              return (
                <Line
                  key={`cluster-link-${cluster.id}-${nodeId}`}
                  points={[start, end]}
                  color={cluster.color}
                  lineWidth={1.2}
                  transparent
                  opacity={(hoveredClusterId === cluster.id ? 0.38 : 0.65) * (currentState === "explore" ? 1.0 : 0.0)}
                  depthWrite={false}
                />
              );
            });
          })}

          {/* Reusable Interactive Nodes at active coordinates */}
          {nodes.map((node, index) => (
            <InteractiveNode
              key={node.id}
              node={node}
              activePosition={activePositions[index]}
            />
          ))}
        </>
      )}

      {/* Cinematic post-processing shader passes */}
      <CinematicEffects />

      {/* Infinite digital observatory constellations */}
      <CosmicConstellations />

      {/* Ambient Intelligence System */}
      <CatalystDiscover />

      {/* Cinematic Signature Search Orchestrator */}
      <SignatureSearch />
    </>
  );
};
