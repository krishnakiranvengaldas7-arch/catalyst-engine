import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

interface MultiverseBridgesProps {
  activePositions: THREE.Vector3[];
}

export const MultiverseBridges: React.FC<MultiverseBridgesProps> = ({ activePositions }) => {
  const compareMode = useExperienceStore((state) => state.compareMode);
  const compareDisappearedNodeIds = useExperienceStore((state) => state.compareDisappearedNodeIds);
  const nodes = useExperienceStore((state) => state.nodes);
  
  const groupRef = useRef<THREE.Group | null>(null);
  const bridgePhase = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const isPaused = useExperienceStore.getState().isPaused;

    if (!isPaused) {
      bridgePhase.current += dt;
    }

    if (groupRef.current && compareMode) {
      groupRef.current.children.forEach((child: any, idx) => {
        if (child.material) {
          // Pulse the bridges gently
          const baseVal = 0.16;
          const wave = Math.sin(bridgePhase.current * 3.5 + idx * 0.8) * 0.08;
          child.material.opacity = (baseVal + wave);
        }
      });
    }
  });

  if (!compareMode) return null;

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => {
        if (compareDisappearedNodeIds.has(node.id)) return null;

        const start = new THREE.Vector3(activePositions[i].x - 9.5, activePositions[i].y, activePositions[i].z);
        const end = new THREE.Vector3(activePositions[i].x + 9.5, activePositions[i].y, activePositions[i].z);

        return (
          <Line
            key={`bridge-${node.id}`}
            points={[start, end]}
            color="#e2e8f0" // Slate bridge thread
            lineWidth={0.5}
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        );
      })}

      {/* Holographic central space divider beam */}
      <Line
        points={[new THREE.Vector3(0, -15, -0.4), new THREE.Vector3(0, 15, -0.4)]}
        color="#d4af37" // Warped warm gold divider
        lineWidth={0.8}
        transparent
        opacity={0.15}
        depthWrite={false}
        dashed
        dashScale={5}
        dashSize={0.25}
        gapSize={0.15}
      />
    </group>
  );
};
