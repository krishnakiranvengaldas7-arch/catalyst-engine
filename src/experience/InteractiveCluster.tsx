import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useExperienceStore, type DiscoveryCluster } from "../store/useExperienceStore";
import { causalityAudio } from "../utils/sound";

interface InteractiveClusterProps {
  cluster: DiscoveryCluster;
}

export const InteractiveCluster: React.FC<InteractiveClusterProps> = ({ cluster }) => {
  const coreRef = useRef<THREE.Mesh | null>(null);
  const ringRef = useRef<THREE.Points | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  const selectedClusterId = useExperienceStore((state) => state.selectedClusterId);
  const hoveredClusterId = useExperienceStore((state) => state.hoveredClusterId);
  const currentState = useExperienceStore((state) => state.currentState);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);

  const setSelectedClusterId = useExperienceStore((state) => state.setSelectedClusterId);
  const setHoveredClusterId = useExperienceStore((state) => state.setHoveredClusterId);
  const setCameraTarget = useExperienceStore((state) => state.setCameraTarget);
  const setCameraPosition = useExperienceStore((state) => state.setCameraPosition);

  const [isHovered, setIsHovered] = useState(false);

  const isSelected = selectedClusterId === cluster.id;

  // Initialize group position on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.fromArray(cluster.position);
    }
  }, [cluster.position]);

  // Fade factor matching entranceProgress
  const fade =
    (currentState === "loading" || currentState === "intro")
      ? 0.0
      : currentState === "explore"
      ? Math.min(Math.max((entranceProgress - 0.1) / 0.75, 0), 1)
      : 1.0;

  // Time Travel Engine Selector
  const timelineYear = useExperienceStore((state) => state.timelineYear);

  // Calculate cluster birth factor based on how many member nodes are active
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

  const bornMemberCount = cluster.nodeIds.filter(id => timelineYear >= getNumericYear(id)).length;
  const totalMemberCount = cluster.nodeIds.length;
  const clusterBirthFactor = totalMemberCount > 0 ? bornMemberCount / totalMemberCount : 1.0;

  // Modulate main fade and scale by the cluster birth factor
  const clusterFade = fade * Math.min(1.0, clusterBirthFactor * 1.5);

  // Create local dust ring geometry
  const dustData = React.useMemo(() => {
    const count = 48;
    const positions = new Float32Array(count * 3);
    const radius = 1.0;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.1;
      const r = radius + (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 0] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r * 0.4; // flat ring
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    return positions;
  }, []);

  // Angular momentum physics state for cluster core and ring
  const angVelCoreCluster = React.useRef(new THREE.Vector3(
    0.015 + Math.random() * 0.03,
    0.02 + Math.random() * 0.04,
    0.01 + Math.random() * 0.02
  ));
  const angVelRingCluster = React.useRef(0.01 + Math.random() * 0.02);
  const scaleVel = React.useRef(0);
  const currentScale = React.useRef(1.0);
  const _targetScaleVec = React.useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);
    const angDamping = 0.997;

    // Angular momentum for core rotation (add gentle torque from hover/selection state)
    if (coreRef.current) {
      // Interaction injects angular energy
      if (isHovered) {
        angVelCoreCluster.current.x += 0.002 * dt;
        angVelCoreCluster.current.y += 0.003 * dt;
      }
      if (isSelected) {
        angVelCoreCluster.current.y += 0.004 * dt;
      }

      angVelCoreCluster.current.multiplyScalar(angDamping);

      coreRef.current.rotation.x += angVelCoreCluster.current.x;
      coreRef.current.rotation.y += angVelCoreCluster.current.y;
      coreRef.current.rotation.z += angVelCoreCluster.current.z;
    }

    // Ring angular momentum
    if (ringRef.current) {
      if (isHovered) angVelRingCluster.current += 0.001 * dt;
      angVelRingCluster.current *= angDamping;
      ringRef.current.rotation.z -= angVelRingCluster.current;
    }

    // Spring-damper scale physics (replaces lerp with Vector3 allocation)
    const targetScale = (isSelected ? 1.4 : isHovered ? 1.25 : 1.0) * clusterBirthFactor;
    if (groupRef.current) {
      const springK = 8.0;
      const dampK = 4.5;
      const scaleForce = (targetScale - currentScale.current) * springK - scaleVel.current * dampK;
      scaleVel.current += scaleForce * dt;
      currentScale.current += scaleVel.current * dt;
      
      _targetScaleVec.set(currentScale.current, currentScale.current, currentScale.current);
      groupRef.current.scale.copy(_targetScaleVec);
    }
  });

  const handleClick = (e: any) => {
    if (currentState === "loading" || clusterFade < 0.5) return;
    e.stopPropagation();

    // Play high-fidelity click bell
    causalityAudio.playClick();

    // Toggle selection
    if (isSelected) {
      setSelectedClusterId(null);
      // Return camera to a global overview of the timeline
      setCameraTarget([3.0, 0.0, 3.0]);
      setCameraPosition([3.0, 1.5, 11.0]);
    } else {
      setSelectedClusterId(cluster.id);
      // Smoothly fly camera to this cluster's location with a spacious, cinematic offset
      setCameraTarget(cluster.position);
      setCameraPosition([
        cluster.position[0],
        cluster.position[1] + 0.8,
        cluster.position[2] + 5.5,
      ]);
    }
  };

  const handlePointerOver = (e: any) => {
    if (currentState === "loading" || clusterFade < 0.5) return;
    e.stopPropagation();
    setIsHovered(true);
    setHoveredClusterId(cluster.id);
    document.body.style.cursor = "pointer";

    // Play crystal hover pluck
    causalityAudio.playHover();
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setIsHovered(false);
    if (hoveredClusterId === cluster.id) {
      setHoveredClusterId(null);
    }
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef}>
      {/* Orbiting celestial dust ring */}
      <points ref={ringRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustData, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={cluster.color}
          transparent
          opacity={0.35 * clusterFade}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Outer faint planetary halo */}
      <mesh>
        <torusGeometry args={[1.0, 0.008, 6, 32]} />
        <meshBasicMaterial
          color={cluster.color}
          transparent
          opacity={0.12 * clusterFade}
          wireframe
        />
      </mesh>

      {/* Central crystalline core - icosahedron geometry for premium sacred-geometric look */}
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <icosahedronGeometry args={[0.38, 0]} />
        <meshPhysicalMaterial
          color={isSelected ? "#ffffff" : cluster.color}
          emissive={cluster.color}
          emissiveIntensity={(isSelected ? 1.5 : isHovered ? 0.95 : 0.45) * clusterFade}
          roughness={0.05}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transparent
          opacity={clusterFade}
        />
      </mesh>

      {/* Glowing inner core */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial
          color={cluster.color}
          transparent
          opacity={0.3 * clusterFade}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Floating 3D HTML Label */}
      <Html
        distanceFactor={7}
        position={[0, -0.9, 0]}
        center
        style={{
          transition: "opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
          opacity: (isSelected || isHovered ? 1.0 : 0.35) * clusterFade,
          pointerEvents: "none",
        }}
      >
        <div className="flex flex-col items-center select-none text-center">
          <span
            className="text-[7.5px] uppercase tracking-[0.3em] font-serif mb-0.5"
            style={{ color: cluster.color, textShadow: `0 0 6px ${cluster.color}44` }}
          >
            DISCOVERY PATH
          </span>
          <span className="text-[12px] font-semibold whitespace-nowrap text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] font-sans">
            {cluster.title}
          </span>
        </div>
      </Html>
    </group>
  );
};
