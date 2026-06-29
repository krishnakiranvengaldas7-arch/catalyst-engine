import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

export const LightingManager: React.FC = () => {
  const activeNodeId = useExperienceStore((state) => state.activeNodeId);
  const hoveredNodeId = useExperienceStore((state) => state.hoveredNodeId);
  const nodes = useExperienceStore((state) => state.nodes);

  const pointLightRef = useRef<THREE.PointLight | null>(null);

  // Determine light target based on active or hovered node
  const activeNode = nodes.find(
    (n) => n.id === activeNodeId || n.id === hoveredNodeId
  );
  const targetPointLightPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetIntensity = useRef(0.5);

  if (activeNode) {
    targetPointLightPos.current.fromArray(activeNode.position);
    targetIntensity.current = 3.0; // Intensify light when focusing on a node
  } else {
    targetPointLightPos.current.set(0, 0, 2);
    targetIntensity.current = 0.8; // Default ambient intensity
  }

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);

    if (pointLightRef.current) {
      // Smoothly slide point light and interpolate intensity
      pointLightRef.current.position.lerp(targetPointLightPos.current, 3.0 * dt);
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        targetIntensity.current,
        3.0 * dt
      );
    }
  });

  return (
    <>
      {/* Subtle base ambient illumination */}
      <ambientLight intensity={0.15} />

      {/* Warm key light representing the 'fire' of human history */}
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        color="#fef08a" // Soft yellow
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00005}
      />

      {/* Cool historical depth fill light */}
      <directionalLight
        position={[-10, -10, -10]}
        intensity={0.6}
        color="#3b82f6" // Electric blue
      />

      {/* Deep purple rim light to carve shapes from the dark background */}
      <directionalLight
        position={[0, 0, -15]}
        intensity={0.8}
        color="#8b5cf6" // Amethyst purple
      />

      {/* Dynamic golden interactive light that follows user focus */}
      <pointLight
        ref={pointLightRef}
        color="#fcd34d" // Amber gold
        distance={12}
        decay={2}
        intensity={0.8}
      />
    </>
  );
};
