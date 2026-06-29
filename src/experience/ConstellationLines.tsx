import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";
import { CONSTELLATIONS } from "./ConstellationEngine";

/**
 * ConstellationLines renders celestial-map-style dashed connection lines
 * between nodes within the same constellation. These lines fade in at macro
 * zoom levels and dissolve smoothly as the camera approaches individual events.
 */

interface ConstellationLinesProps {
  activePositions: THREE.Vector3[];
}

interface LineSegment {
  fromIdx: number;
  toIdx: number;
  color: THREE.Color;
}

export const ConstellationLines: React.FC<ConstellationLinesProps> = ({ activePositions }) => {
  const { camera } = useThree();
  const nodes = useExperienceStore((state) => state.nodes);
  const currentState = useExperienceStore((state) => state.currentState);
  const entranceProgress = useExperienceStore((state) => state.entranceProgress);

  const meshRef = useRef<THREE.LineSegments | null>(null);
  const visRef = useRef(0);

  // Build all segment pairs from constellation definitions
  const segments = useMemo(() => {
    const segs: LineSegment[] = [];
    const seen = new Set<string>();

    CONSTELLATIONS.forEach((c) => {
      const color = new THREE.Color(c.color);
      const indices = c.nodeIds
        .map((id) => nodes.findIndex((n) => n.id === id))
        .filter((idx) => idx !== -1);

      // Connect each consecutive pair and close the loop for a constellation shape
      for (let i = 0; i < indices.length; i++) {
        const a = indices[i];
        const b = indices[(i + 1) % indices.length];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!seen.has(key)) {
          seen.add(key);
          segs.push({ fromIdx: a, toIdx: b, color });
        }
      }
    });

    return segs;
  }, [nodes]);

  // Allocate geometry buffers
  const [posBuffer, colBuffer] = useMemo(() => {
    const pos = new Float32Array(segments.length * 6); // 2 vertices × 3 components
    const col = new Float32Array(segments.length * 6);
    return [pos, col];
  }, [segments]);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);
    const camDist = camera.position.length();

    // Same visibility curve as ConstellationEngine
    const targetVis =
      currentState === "explore" && entranceProgress > 0.5
        ? THREE.MathUtils.clamp((camDist - 12.0) / 10.0, 0, 1)
        : 0;

    visRef.current = THREE.MathUtils.lerp(visRef.current, targetVis, 3.0 * dt);

    if (!meshRef.current) return;

    const geom = meshRef.current.geometry;
    const posAttr = geom.attributes.position;
    const colAttr = geom.attributes.color;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    const vis = visRef.current;

    segments.forEach((seg, i) => {
      const base = i * 6;
      const from = activePositions[seg.fromIdx];
      const to = activePositions[seg.toIdx];

      if (from && to) {
        posArr[base] = from.x;
        posArr[base + 1] = from.y;
        posArr[base + 2] = from.z;
        posArr[base + 3] = to.x;
        posArr[base + 4] = to.y;
        posArr[base + 5] = to.z;
      }

      colArr[base] = seg.color.r * vis;
      colArr[base + 1] = seg.color.g * vis;
      colArr[base + 2] = seg.color.b * vis;
      colArr[base + 3] = seg.color.r * vis;
      colArr[base + 4] = seg.color.g * vis;
      colArr[base + 5] = seg.color.b * vis;
    });

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Update material opacity
    const mat = meshRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.28 * vis;
  });

  if (currentState === "loading" || currentState === "intro") return null;
  if (segments.length === 0) return null;

  return (
    <lineSegments ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posBuffer, 3]} />
        <bufferAttribute attach="attributes-color" args={[colBuffer, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};
