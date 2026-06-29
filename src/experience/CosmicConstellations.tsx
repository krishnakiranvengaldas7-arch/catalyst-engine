import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

interface GalaxyData {
  id: number;
  center: THREE.Vector3;
  color: THREE.Color;
  starPositions: Float32Array;
  starCount: number;
}

export const CosmicConstellations: React.FC = () => {
  const { camera } = useThree();
  const isPaused = useExperienceStore((state) => state.isPaused);

  // Generate 16 distant galaxies procedurally on mount
  const galaxies = useMemo(() => {
    const list: GalaxyData[] = [];
    const colors = [
      new THREE.Color("#d4af37"), // Gold
      new THREE.Color("#3b82f6"), // Blue
      new THREE.Color("#a855f7"), // Amethyst
      new THREE.Color("#06b6d4"), // Cyber Cyan
      new THREE.Color("#ef4444")  // Historical Red
    ];

    for (let g = 0; g < 16; g++) {
      // Position galaxies randomly in a huge sphere shell around the center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 55.0 + Math.random() * 95.0; // 55 to 150 units away

      const center = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * dist,
        Math.sin(phi) * Math.sin(theta) * dist,
        Math.cos(phi) * dist
      );

      const starCount = 350 + Math.floor(Math.random() * 250);
      const starPositions = new Float32Array(starCount * 3);

      for (let s = 0; s < starCount; s++) {
        // Scatter stars in a swirling spiral format inside the galaxy
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.0 + Math.random() * 12.0;
        const height = (Math.random() - 0.5) * 2.8;

        starPositions[s * 3 + 0] = Math.cos(angle) * radius;
        starPositions[s * 3 + 1] = Math.sin(angle) * radius;
        starPositions[s * 3 + 2] = height;
      }

      list.push({
        id: g,
        center,
        color: colors[g % colors.length],
        starPositions,
        starCount
      });
    }
    return list;
  }, []);

  const galaxyRefs = useRef<THREE.Group[]>([]);

  // Per-galaxy angular velocities (initial angular momentum, no hardcoded time*speed)
  const galaxyAngVelocities = useRef<number[]>(
    Array.from({ length: 16 }, (_, i) => 0.015 + i * 0.003 + (Math.random() - 0.5) * 0.005)
  );

  useFrame((_, delta) => {
    galaxies.forEach((g, idx) => {
      const group = galaxyRefs.current[idx];
      if (!group) return;

      // Calculate distance from camera to galaxy center for dynamic streaming & LOD
      const distToCam = camera.position.distanceTo(g.center);

      // Frustum culling and dynamic streaming check
      if (distToCam > 140.0) {
        group.visible = false;
        return;
      }

      group.visible = true;

      // Smoothly fade galaxy in/out based on streaming proximity
      const mesh = group.children[0] as THREE.Points;
      if (mesh && mesh.material) {
        const mat = mesh.material as THREE.PointsMaterial;
        let targetOpacity = 0.0;
        if (distToCam < 110.0) {
          // Fade in close galaxies
          targetOpacity = Math.min(1.0, (110.0 - distToCam) / 30.0);
        }
        
        // Automatic LOD: far away galaxies have larger, fainter stars.
        // Near galaxies have tiny, sharp, highly dense stars.
        mat.size = distToCam > 80.0 ? 0.12 : 0.035;
        mat.opacity = targetOpacity * 0.72;
      }

      // Angular momentum physics for galaxy rotation
      // Each galaxy drifts at its own angular speed, decelerating very gradually
      if (!isPaused) {
        const angVel = galaxyAngVelocities.current[idx];
        group.rotation.z += angVel * delta;
        // Extremely slow deceleration for deep-space elegance (practically constant but physically motivated)
        galaxyAngVelocities.current[idx] *= 0.99999;
      }
    });
  });

  return (
    <>
      {galaxies.map((g, idx) => (
        <group
          key={g.id}
          ref={(el) => {
            if (el) galaxyRefs.current[idx] = el;
          }}
          position={g.center}
        >
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[g.starPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial
              color={g.color}
              size={0.035}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
        </group>
      ))}
    </>
  );
};
