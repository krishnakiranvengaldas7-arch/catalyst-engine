import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

export interface ConstellationDef {
  id: string;
  name: string;
  nodeIds: string[];
  color: string;
  icon: string; // unicode glyph
}

// Master constellation definitions mapping nodes to thematic groups
export const CONSTELLATIONS: ConstellationDef[] = [
  {
    id: "ancient_foundations",
    name: "Ancient Foundations",
    nodeIds: ["agricultural_revolution", "rise_of_cities", "writing_system", "code_of_hammurabi"],
    color: "#d4af37",
    icon: "\u26B1",
  },
  {
    id: "governance_philosophy",
    name: "Governance & Philosophy",
    nodeIds: ["democratic_foundation", "enlightenment", "code_of_hammurabi"],
    color: "#a855f7",
    icon: "\u2696",
  },
  {
    id: "knowledge_revolution",
    name: "Knowledge Revolution",
    nodeIds: ["printing_press", "scientific_revolution", "enlightenment"],
    color: "#3b82f6",
    icon: "\uD83D\uDCD6",
  },
  {
    id: "industrial_age",
    name: "Industrial Age",
    nodeIds: ["industrial_revolution", "scientific_revolution"],
    color: "#ef4444",
    icon: "\u2699",
  },
  {
    id: "digital_frontier",
    name: "Digital Frontier",
    nodeIds: ["digital_revolution", "artificial_intelligence"],
    color: "#06b6d4",
    icon: "\u25C8",
  },
];

interface ConstellationGroupProps {
  constellation: ConstellationDef;
  activePositions: THREE.Vector3[];
  nodes: { id: string }[];
  visibility: number; // 0..1
}

const ConstellationGroup: React.FC<ConstellationGroupProps> = ({
  constellation,
  activePositions,
  nodes,
  visibility,
}) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const dustRef = useRef<THREE.Points | null>(null);
  const outlineRef = useRef<THREE.Line | null>(null);

  // Compute member indices
  const memberIndices = useMemo(() => {
    return constellation.nodeIds
      .map((id) => nodes.findIndex((n) => n.id === id))
      .filter((idx) => idx !== -1);
  }, [constellation.nodeIds, nodes]);

  // Generate ambient dust around the constellation
  const dustPositions = useMemo(() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 4.0;
      const height = (Math.random() - 0.5) * 3.0;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = height;
    }
    return pos;
  }, []);

  // Compute center and outline geometry each frame
  useFrame((_state, delta) => {
    if (memberIndices.length === 0) return;
    const dt = Math.min(delta, 0.1);

    // Calculate gravitational center
    const center = new THREE.Vector3();
    let validCount = 0;
    memberIndices.forEach((idx) => {
      if (activePositions[idx]) {
        center.add(activePositions[idx]);
        validCount++;
      }
    });
    if (validCount > 0) center.divideScalar(validCount);

    // Position group at center
    if (groupRef.current) {
      groupRef.current.position.lerp(center, 4.0 * dt);
    }

    // Build convex hull outline from member positions (sorted by angle from center)
    if (outlineRef.current && memberIndices.length >= 2) {
      const points: THREE.Vector3[] = memberIndices.map((idx) => {
        if (!activePositions[idx]) return new THREE.Vector3();
        return new THREE.Vector3().subVectors(activePositions[idx], center);
      });

      // Sort by angle around center for clean polygon
      points.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

      // Expand slightly outward for a halo border effect
      const expanded = points.map((p) => {
        const dir = p.clone().normalize();
        return p.clone().addScaledVector(dir, 0.6);
      });

      // Close the loop
      if (expanded.length > 0) {
        expanded.push(expanded[0].clone());
      }

      const geom = outlineRef.current.geometry as THREE.BufferGeometry;
      const posArr = new Float32Array(expanded.length * 3);
      expanded.forEach((v, i) => {
        posArr[i * 3] = v.x;
        posArr[i * 3 + 1] = v.y;
        posArr[i * 3 + 2] = v.z;
      });
      geom.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
      geom.setDrawRange(0, expanded.length);
      geom.computeBoundingSphere();
    }

    // Slowly rotate dust
    if (dustRef.current) {
      dustRef.current.rotation.z += 0.008 * dt;
    }
  });

  if (memberIndices.length === 0 || visibility < 0.01) return null;

  const color = new THREE.Color(constellation.color);

  return (
    <group ref={groupRef}>
      {/* Constellation outline */}
      <line ref={outlineRef as any}>
        <bufferGeometry />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.18 * visibility}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* Ambient constellation dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.04}
          transparent
          opacity={0.22 * visibility}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Constellation label */}
      <Html
        distanceFactor={12}
        position={[0, 2.2, 0]}
        center
        style={{
          opacity: visibility,
          transition: "opacity 0.6s ease",
          pointerEvents: "none",
        }}
      >
        <div className="flex flex-col items-center select-none text-center">
          <span
            className="text-xl mb-1"
            style={{ color: constellation.color, filter: `drop-shadow(0 0 8px ${constellation.color}66)` }}
          >
            {constellation.icon}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.35em] font-serif"
            style={{
              color: constellation.color,
              textShadow: `0 0 12px ${constellation.color}44`,
            }}
          >
            {constellation.name}
          </span>
        </div>
      </Html>

      {/* Soft gravitational center glow */}
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08 * visibility}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ─── Main Constellation Engine ───

interface ConstellationEngineProps {
  activePositions: THREE.Vector3[];
}

export const ConstellationEngine: React.FC<ConstellationEngineProps> = ({ activePositions }) => {
  const { camera } = useThree();
  const nodes = useExperienceStore((state) => state.nodes);
  const currentState = useExperienceStore((state) => state.currentState);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);

  // Compute constellation visibility based on camera distance to world center
  // Far away = constellations fully visible, close = dissolved
  const visibilityRef = useRef(0);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);
    const camDist = camera.position.length();

    // Constellations begin appearing at distance 12, fully visible at 22+
    const targetVis = currentState === "explore" && entranceProgress > 0.5
      ? THREE.MathUtils.clamp((camDist - 12.0) / 10.0, 0, 1)
      : 0;

    visibilityRef.current = THREE.MathUtils.lerp(visibilityRef.current, targetVis, 3.0 * dt);
  });

  if (currentState === "loading" || currentState === "intro") return null;

  return (
    <>
      {CONSTELLATIONS.map((c) => (
        <ConstellationGroup
          key={c.id}
          constellation={c}
          activePositions={activePositions}
          nodes={nodes}
          visibility={visibilityRef.current}
        />
      ))}
    </>
  );
};
