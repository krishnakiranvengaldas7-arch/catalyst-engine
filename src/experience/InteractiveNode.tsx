import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
// Removed Html import
import * as THREE from "three";
import {
  useExperienceStore,
  type HistoricalNode,
} from "../store/useExperienceStore";
import { causalityAudio } from "../utils/sound";

interface InteractiveNodeProps {
  node: HistoricalNode;
  activePosition: THREE.Vector3;
  universe?: "A" | "B";
}

export const InteractiveNode: React.FC<InteractiveNodeProps> = ({ node, activePosition, universe }) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const ringRef = useRef<THREE.Mesh | null>(null);
  const groupPosRef = useRef<THREE.Group | null>(null);
  const pulseMeshRef = useRef<THREE.Mesh | null>(null);

  // Angular momentum physics state (no hardcoded rotation speeds)
  const angVelCore = useRef(new THREE.Vector3(
    0.02 + Math.random() * 0.06,
    0.03 + Math.random() * 0.05,
    0.01 + Math.random() * 0.03
  ));
  const angVelRing = useRef(new THREE.Vector3(
    0.04 + Math.random() * 0.08,
    0.02 + Math.random() * 0.04,
    0.015 + Math.random() * 0.03
  ));
  const prevPosition = useRef(new THREE.Vector3());
  const scaleMomentum = useRef(0);

  const activeNodeId = useExperienceStore((state) => state.activeNodeId);
  const hoveredNodeId = useExperienceStore((state) => state.hoveredNodeId);
  const currentState = useExperienceStore((state) => state.currentState);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);
  const setActiveNodeId = useExperienceStore((state) => state.setActiveNodeId);
  const setHoveredNodeId = useExperienceStore((state) => state.setHoveredNodeId);
  
  const selectedClusterId = useExperienceStore((state) => state.selectedClusterId);
  const clusters = useExperienceStore((state) => state.clusters);

  const setCameraTarget = useExperienceStore((state) => state.setCameraTarget);
  const setCameraPosition = useExperienceStore((state) => state.setCameraPosition);

  // Time Travel Engine Selector
  const timelineYear = useExperienceStore((state) => state.timelineYear);
  const influenceMode = useExperienceStore((state) => state.influenceMode);
  const compareMode = useExperienceStore((state) => state.compareMode);
  const compareDisappearedNodeIds = useExperienceStore((state) => state.compareDisappearedNodeIds);
  
  const signatureSearchPhase = useExperienceStore((state) => state.signatureSearchPhase);
  const signatureSearchTargetId = useExperienceStore((state) => state.signatureSearchTargetId);

  const [isHovered, setIsHovered] = useState(false);
  const [zoomDetail, setZoomDetail] = useState<"far" | "medium" | "close">("far");

  const isActive = activeNodeId === node.id;

  const wellIds = ["agricultural_revolution", "writing_system", "printing_press", "scientific_revolution", "industrial_revolution", "digital_revolution", "artificial_intelligence"];
  const isHighInfluence = wellIds.includes(node.id);

  const spiralParticles = React.useMemo(() => {
    const count = 75;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.45 + Math.random() * 1.35;
      positions[i * 3 + 0] = Math.cos(angle) * dist;
      positions[i * 3 + 1] = Math.sin(angle) * dist;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    return { positions };
  }, []);

  const spiralPointsRef = useRef<THREE.Points | null>(null);

  // Initialize group position on mount to prevent jumping
  useEffect(() => {
    if (groupPosRef.current) {
      groupPosRef.current.position.copy(activePosition);
    }
  }, []);

  // Calculate smooth fade factor based on GSAP entrance progress
  const fade =
    (currentState === "loading" || currentState === "intro")
      ? 0.0
      : currentState === "explore"
      ? Math.min(Math.max((entranceProgress - 0.08) / 0.77, 0), 1)
      : 1.0;

  // Check if a cluster is selected and if this node is a member
  const selectedCluster = clusters.find((c) => c.id === selectedClusterId);
  const isClusterMember = selectedCluster ? selectedCluster.nodeIds.includes(node.id) : true;

  // Dim non-member nodes to 12% opacity when a cluster is selected
  const [bOpacityState, setBOpacityState] = useState(1.0);
  const [bScaleState, setBScaleState] = useState(1.0);

  // Numeric year mapping for time travel
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

  const numericYear = getNumericYear(node.id);

  // Fade window (how fast events bloom into existence)
  const getFadeWindow = (yr: number): number => {
    if (yr < 0) return 150;     // Ancient events bloom slowly
    if (yr < 1900) return 40;   // Historical events bloom moderately
    return 3;                   // Modern events bloom instantly
  };

  const fadeWindow = getFadeWindow(numericYear);

  let timelineFade = 0.0;
  if (timelineYear >= numericYear) {
    timelineFade = Math.min(1.0, (timelineYear - numericYear) / fadeWindow);
  }

  // Ancient civilizations fade subtly as time goes far past them
  let historyFade = 1.0;
  const yearsPast = timelineYear - numericYear;
  if (yearsPast > 350 && numericYear < 1000) {
    historyFade = 1.0 - 0.65 * Math.min(1.0, (yearsPast - 350) / 600);
  }

  const totalTimelineOpacity = timelineFade * historyFade;
  const nodeOpacity = fade * (isClusterMember ? 1.0 : 0.12) * bOpacityState * totalTimelineOpacity;

  const elapsedRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const isPaused = useExperienceStore.getState().isPaused;
    if (!isPaused) {
      elapsedRef.current += dt;
    }
    const time = elapsedRef.current;

    // Elastically slide the node group container towards its active physics coordinate
    if (groupPosRef.current) {
      groupPosRef.current.position.copy(activePosition);
      
      // Calculate camera distance for intelligent detail level zooming
      const dist = state.camera.position.distanceTo(groupPosRef.current.position);
      let nextDetail: "far" | "medium" | "close" = "far";
      if (dist < 4.8) {
        nextDetail = "close";
      } else if (dist < 9.2) {
        nextDetail = "medium";
      }
      
      if (nextDetail !== zoomDetail) {
        setZoomDetail(nextDetail);
      }
    }

    // Angular momentum physics for rotations (replaces time * constant)
    // Position delta generates angular torque — moving nodes spin faster
    const posDelta = new THREE.Vector3().subVectors(activePosition, prevPosition.current);
    const posSpeed = posDelta.length();
    prevPosition.current.copy(activePosition);

    // Torque from movement: cross product of movement direction with up vector
    const torqueFactor = Math.min(posSpeed * 0.15, 0.08);
    const angDamping = 0.995; // Very slow angular deceleration for elegance

    if (meshRef.current) {
      // Apply gentle torque from position changes
      angVelCore.current.x += posDelta.y * torqueFactor;
      angVelCore.current.y += posDelta.x * torqueFactor;
      angVelCore.current.z += posDelta.z * torqueFactor * 0.3;

      // Angular damping
      angVelCore.current.multiplyScalar(angDamping);

      // Integrate angular velocity into rotation
      meshRef.current.rotation.x += angVelCore.current.x * dt;
      meshRef.current.rotation.y += angVelCore.current.y * dt;
      meshRef.current.rotation.z += angVelCore.current.z * dt;
    }
    if (ringRef.current) {
      // Ring has independent angular momentum, slightly faster
      angVelRing.current.x += posDelta.y * torqueFactor * 1.3;
      angVelRing.current.y += posDelta.x * torqueFactor * 0.8;
      angVelRing.current.z += posDelta.z * torqueFactor * 0.5;
      angVelRing.current.multiplyScalar(angDamping);

      ringRef.current.rotation.x += angVelRing.current.x * dt;
      ringRef.current.rotation.y += angVelRing.current.y * dt;
      ringRef.current.rotation.z += angVelRing.current.z * dt;
    }
    if (spiralPointsRef.current && influenceMode && isHighInfluence) {
      // Spiral particles respond to angular energy, not fixed time
      spiralPointsRef.current.rotation.z += angVelCore.current.length() * 0.8 * dt;
      // Scale breathes through spring-damper instead of Math.sin
      const targetSpiralScale = 1.0 + posSpeed * 0.3;
      const currentSpiralScale = spiralPointsRef.current.scale.x;
      const spiralScaleDelta = (targetSpiralScale - currentSpiralScale) * 3.0 * dt;
      const newScale = currentSpiralScale + spiralScaleDelta;
      spiralPointsRef.current.scale.set(newScale, newScale, newScale);
    }

    // Butterfly Mode Calculations
    const butterflyActive = useExperienceStore.getState().butterflyActive;
    const butterflyTime = useExperienceStore.getState().butterflyTime;
    const butterflyTargetId = useExperienceStore.getState().butterflyTargetId;
    const butterflyDisappearedNodeIds = useExperienceStore.getState().butterflyDisappearedNodeIds;
    const butterflyUncertainNodeIds = useExperienceStore.getState().butterflyUncertainNodeIds;

    let bScale = 1.0;
    let bOpacity = 1.0;

    if (butterflyActive) {
      if (node.id === butterflyTargetId) {
        // Target event dissolves in Phase 2
        if (butterflyTime <= 1.5) {
          bScale = 1.0;
          bOpacity = 1.0;
        } else if (butterflyTime <= 3.0) {
          const f = (3.0 - butterflyTime) / 1.5;
          bScale = f;
          bOpacity = f;
        } else {
          bScale = 0.0;
          bOpacity = 0.0;
        }
      } else if (butterflyDisappearedNodeIds.has(node.id)) {
        // Disappeared nodes collapse in Phase 3
        if (butterflyTime <= 1.5) {
          bOpacity = 1.0 - (1.0 - 0.15) * (butterflyTime / 1.5);
          bScale = 1.0;
        } else if (butterflyTime <= 3.0) {
          bOpacity = 0.15;
          bScale = 1.0;
        } else if (butterflyTime <= 5.5) {
          const f = (5.5 - butterflyTime) / 2.5;
          bScale = f;
          bOpacity = 0.15 * f;
        } else {
          bScale = 0.0;
          bOpacity = 0.0;
        }
      } else if (butterflyUncertainNodeIds.has(node.id)) {
        // Uncertain nodes dim, flicker in Phase 4, and settle as partially transparent in Phase 5
        if (butterflyTime <= 1.5) {
          bOpacity = 1.0 - (1.0 - 0.15) * (butterflyTime / 1.5);
          bScale = 1.0;
        } else if (butterflyTime <= 5.0) {
          bOpacity = 0.15;
          bScale = 1.0;
        } else if (butterflyTime <= 7.5) {
          // Flicker uncertainty phase (animated uncertainty)
          const flick = 0.2 + Math.sin(time * 75.0 + node.title.charCodeAt(0)) * 0.25;
          bOpacity = 0.15 + Math.max(0, flick);
          bScale = 0.85 + Math.sin(time * 45.0) * 0.15;
        } else if (butterflyTime <= 9.0) {
          // Rebuild: settle to partially transparent
          const f = (butterflyTime - 7.5) / 1.5;
          bOpacity = 0.35 + 0.1 * f;
          bScale = 1.0;
        } else {
          bOpacity = 0.45; // Partially transparent
          bScale = 1.0;
        }
      } else {
        // Other normal nodes dim and then rebuild back to full normal state in Phase 5
        if (butterflyTime <= 1.5) {
          bOpacity = 1.0 - (1.0 - 0.15) * (butterflyTime / 1.5);
        } else if (butterflyTime <= 7.0) {
          bOpacity = 0.15;
        } else if (butterflyTime <= 9.0) {
          const f = (butterflyTime - 7.0) / 2.0;
          bOpacity = 0.15 + 0.85 * f;
        } else {
          bOpacity = 1.0;
        }
      }

      // Smoothly update local states to trigger React re-render for labels
      if (Math.abs(bOpacityState - bOpacity) > 0.015 || Math.abs(bScaleState - bScale) > 0.015) {
        setBOpacityState(bOpacity);
        setBScaleState(bScale);
      }
    } else if (bOpacityState !== 1.0 || bScaleState !== 1.0) {
      setBOpacityState(1.0);
      setBScaleState(1.0);
    }

    // Smooth scaling interpolation (Scale down non-members when cluster is selected)
    let influenceScaleFactor = 1.0;
    if (influenceMode) {
      influenceScaleFactor = isHighInfluence ? 1.75 : 0.45;
    }

    const isUniqueToA = compareMode && universe === "A" && compareDisappearedNodeIds.has(node.id);
    let uniquePulse = 1.0;
    if (isUniqueToA) {
      // Spring-damper pulse instead of Math.sin: uses scale momentum for natural oscillation
      const pulseTarget = 1.18;
      scaleMomentum.current += (pulseTarget - uniquePulse) * 12.0 * dt;
      scaleMomentum.current *= 0.92; // Damping
      uniquePulse = 1.0 + scaleMomentum.current * 0.18;
    }

    const baseTargetScale = isActive 
      ? 1.12 
      : isClusterMember 
      ? 1.0 
      : 0.65;
    const targetScale = baseTargetScale * bScaleState * timelineFade * influenceScaleFactor * uniquePulse;
      
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        5.0 * dt
      );
    }

    // Reality Threads: Softly illuminate when reached by causal pulse, and emit shockwave
    const rippleActive = useExperienceStore.getState().rippleActive;
    const rippleTime = useExperienceStore.getState().rippleTime;
    const rippleActivationTimes = useExperienceStore.getState().rippleActivationTimes;

    let emissiveIntensityBoost = 1.0;
    let pulseScale = 0.0;
    let pulseOpacity = 0.0;

    if (rippleActive) {
      const actTime = rippleActivationTimes[node.id];
      if (actTime !== undefined && actTime !== Infinity) {
        const isActivated = rippleTime >= actTime;
        if (isActivated) {
          emissiveIntensityBoost = 2.4; // Softly illuminate
          
          const tSince = rippleTime - actTime;
          if (tSince >= 0 && tSince < 1.2) {
            pulseScale = 0.4 + tSince * 3.2; // Expanding wave front
            pulseOpacity = 0.8 * (1.0 - tSince / 1.2);
          }
        } else {
          // Dim unreached nodes to make the propagation path pop out
          emissiveIntensityBoost = 0.05;
        }
      }
    }

    // Apply emissive intensity directly to the mesh material
    let influenceEmissiveFactor = 1.0;
    if (influenceMode) {
      influenceEmissiveFactor = isHighInfluence ? 2.8 : 0.35;
    }

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      if (mat) {
        mat.emissiveIntensity = (isActive ? 1.2 : 0.28) * nodeOpacity * emissiveIntensityBoost * influenceEmissiveFactor;
      }
    }

    // Update expanding shockwave pulse ring scale and opacity
    if (pulseMeshRef.current) {
      pulseMeshRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      const pulseMat = pulseMeshRef.current.material as THREE.MeshBasicMaterial;
      if (pulseMat) {
        pulseMat.opacity = pulseOpacity * nodeOpacity;
      }
    }
  });

  const handleClick = (e: any) => {
    if (currentState === "loading" || !isClusterMember) return;
    e.stopPropagation();
    setActiveNodeId(node.id);

    // Play high-fidelity bell on click
    causalityAudio.playClick();

    // Smoothly focus camera on this node with a cinematic offset
    setCameraTarget(node.position);
    setCameraPosition([
      node.position[0],
      node.position[1] + 1.0,
      node.position[2] + 4.5,
    ]);
  };

  const handleDoubleClick = (e: any) => {
    if (currentState === "loading" || !isClusterMember) return;
    e.stopPropagation();
    setActiveNodeId(node.id);
    causalityAudio.playClick();
    setCameraTarget(node.position);
    setCameraPosition([
      node.position[0],
      node.position[1] + 0.8,
      node.position[2] + 3.2,
    ]);
  };

  const handlePointerOver = (e: any) => {
    if (currentState === "loading" || nodeOpacity < 0.3 || !isClusterMember) return;
    e.stopPropagation();
    setIsHovered(true);
    setHoveredNodeId(node.id);
    document.body.style.cursor = "pointer";

    // Play subtle glassmorphic pluck on hover
    causalityAudio.playHover();
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setIsHovered(false);
    if (hoveredNodeId === node.id) {
      setHoveredNodeId(null);
    }
    document.body.style.cursor = "auto";
  };

  // Color mapping based on category to keep the design premium
  const getCategoryColor = () => {
    if (compareMode && universe === "A" && compareDisappearedNodeIds.has(node.id)) {
      return "#f87171"; // Soft coral-red for lost node in Universe A
    }
    switch (node.category) {
      case "science":
        return "#f59e0b"; // Gold/Amber
      case "politics":
        return "#ef4444"; // Historical Red
      case "arts":
        return "#a855f7"; // Creative Purple
      case "philosophy":
        return "#3b82f6"; // Rational Blue
      default:
        return "#d4af37"; // Default Gold
    }
  };

  if (compareMode && universe === "B" && compareDisappearedNodeIds.has(node.id)) {
    return null;
  }

  const categoryColor = getCategoryColor();

  return (
    <group ref={groupPosRef}>
      {/* Swirling gravity accretion disk for highly influential nodes */}
      {influenceMode && isHighInfluence && (
        <points ref={spiralPointsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[spiralParticles.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={categoryColor}
            size={0.035}
            transparent
            opacity={0.55 * nodeOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* Delicate orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.012, 8, 48]} />
        <meshBasicMaterial
          color={categoryColor}
          transparent
          opacity={(isActive ? 0.65 : isHovered ? 0.25 : 0.15) * nodeOpacity}
          wireframe
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshPhysicalMaterial
          color={isActive || (signatureSearchTargetId === node.id && signatureSearchPhase !== 'none' && signatureSearchPhase !== 'freeze') ? "#ffffff" : categoryColor}
          emissive={signatureSearchTargetId === node.id && signatureSearchPhase !== 'none' && signatureSearchPhase !== 'freeze' ? "#ffffff" : categoryColor}
          emissiveIntensity={signatureSearchTargetId === node.id && signatureSearchPhase !== 'none' && signatureSearchPhase !== 'freeze' ? 12.0 : (isActive ? 1.0 : 0.25) * nodeOpacity}
          roughness={0.15}
          metalness={0.85}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent
          opacity={nodeOpacity}
        />
      </mesh>

      {/* Specular and edge accent light inside each node to illuminate nearby lines and dust */}
      <pointLight
        color={categoryColor}
        distance={2.5}
        intensity={(isActive ? 1.6 : isHovered ? 0.85 : 0.35) * nodeOpacity}
        decay={2.2}
      />

      {/* Reality Threads Shockwave Pulse Ring (additive blending) */}
      <mesh ref={pulseMeshRef} rotation-x={Math.PI / 2}>
        <ringGeometry args={[0.2, 0.45, 32]} />
        <meshBasicMaterial
          color={categoryColor}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Additive halo glow on active only (Halo on hover disabled) */}
      {isActive && (
        <mesh>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshBasicMaterial
            color={categoryColor}
            transparent
            opacity={0.18 * nodeOpacity}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* No HTML labels rendered in 3D - Handled by TimelineView.tsx */}
    </group>
  );
};
