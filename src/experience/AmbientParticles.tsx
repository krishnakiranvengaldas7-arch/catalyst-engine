import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";
import {
  particleVertexShader,
  particleFragmentShader,
} from "./shaders/particleShader";

export const AmbientParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points | null>(null);

  const count = 400; // Elegant, not cluttered
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Generate random positions, scales, and phase offsets
  const [positions, scales, randoms] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    const rnd = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spread particles in a large spherical/box volume around the timeline
      pos[i * 3 + 0] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5; // Deep depth span

      // Varied scales for depth and size variety
      scl[i] = Math.random() * 0.8 + 0.2;

      // Random factors for vertex shader wave animation
      rnd[i * 3 + 0] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }

    return [pos, scl, rnd];
  }, [count]);

  // Shader uniforms memo
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uSize: { value: 20.0 }, // Base particle size
    }),
    [pixelRatio]
  );

  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    if (pointsRef.current) {
      const dt = Math.min(delta, 0.1);
      const isPaused = useExperienceStore.getState().isPaused;
      const timelineScrubbing = useExperienceStore.getState().timelineScrubbing;
      const speedMultiplier = timelineScrubbing ? 6.0 : 1.0;

      if (!isPaused) {
        elapsedRef.current += dt * speedMultiplier;
      }

      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = elapsedRef.current;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aRandoms" args={[randoms, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
