import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const Starfield: React.FC = () => {
  const starfieldRef = useRef<THREE.Points | null>(null);
  const count = 1200; // Optimal density for faint background

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Distribute stars on a shell far away (radius 40 to 80 units)
      const radius = 45 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      // Varying colors to represent different stellar temperatures
      const rand = Math.random();
      if (rand < 0.25) {
        // Hot blue-white stars
        cols[i * 3 + 0] = 0.75;
        cols[i * 3 + 1] = 0.85;
        cols[i * 3 + 2] = 1.0;
      } else if (rand < 0.45) {
        // Warm orange-yellow stars
        cols[i * 3 + 0] = 1.0;
        cols[i * 3 + 1] = 0.9;
        cols[i * 3 + 2] = 0.75;
      } else {
        // Neutral white stars
        cols[i * 3 + 0] = 0.95;
        cols[i * 3 + 1] = 0.95;
        cols[i * 3 + 2] = 0.95;
      }
    }
    return [pos, cols];
  }, [count]);

  useFrame((state) => {
    if (starfieldRef.current) {
      // Slow, majestic rotation to represent cosmic motion
      starfieldRef.current.rotation.y = state.clock.getElapsedTime() * 0.003;
      starfieldRef.current.rotation.x = state.clock.getElapsedTime() * 0.0015;
    }
  });

  return (
    <points ref={starfieldRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.35} // Faint and non-distracting
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};
