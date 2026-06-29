import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

interface SpacetimeGridProps {
  activePositions: THREE.Vector3[];
}

export const SpacetimeGrid: React.FC<SpacetimeGridProps> = ({ activePositions }) => {
  const influenceMode = useExperienceStore((state) => state.influenceMode);
  const nodes = useExperienceStore((state) => state.nodes);

  const gridRef = useRef<THREE.Mesh | null>(null);
  const modeActiveRef = useRef(0.0);

  // Shader uniforms
  const uniforms = useMemo(() => {
    // Initialize 11 wells
    const wells = Array.from({ length: 11 }).map(() => new THREE.Vector3());
    const influences = new Float32Array(11);
    
    // Fill influences
    nodes.forEach((node, i) => {
      if (i < 11) {
        influences[i] = node.influenceScore;
      }
    });

    return {
      uWells: { value: wells },
      uInfluences: { value: influences },
      uActive: { value: 0.0 },
      uTime: { value: 0.0 }
    };
  }, [nodes]);

  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);
    const isPaused = useExperienceStore.getState().isPaused;
    if (!isPaused) {
      elapsedRef.current += dt;
    }
    const time = elapsedRef.current;

    // Smoothly transition uActive based on influenceMode
    modeActiveRef.current = THREE.MathUtils.lerp(
      modeActiveRef.current,
      influenceMode ? 1.0 : 0.0,
      3.5 * dt
    );
    uniforms.uActive.value = modeActiveRef.current;
    uniforms.uTime.value = time;

    // Sync current active node coordinates to shader uniforms
    for (let i = 0; i < nodes.length; i++) {
      if (i < 11 && activePositions[i] && uniforms.uWells.value[i]) {
        uniforms.uWells.value[i].copy(activePositions[i]);
      }
    }
  });

  // Custom vertex and fragment shaders for grid bending
  const vertexShader = `
    uniform vec3 uWells[11];
    uniform float uInfluences[11];
    uniform float uActive;
    uniform float uTime;
    varying float vDistortion;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      float totalDistortion = 0.0;

      // Calculate gravitational well deformation in 3D
      for (int i = 0; i < 11; i++) {
        vec3 wellPos = uWells[i];
        float influence = uInfluences[i];

        float dist = distance(pos.xy, wellPos.xy);
        
        // Funnel-shaped gravity well (cap distance to avoid infinite spike)
        float pull = (influence / 100.0) * 3.5 / (dist * dist + 1.5);
        totalDistortion += pull;
      }

      // Displace Z backwards dynamically to create a curvature indentation
      pos.z -= totalDistortion * uActive;

      vDistortion = totalDistortion * uActive;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    varying float vDistortion;
    varying vec2 vUv;
    uniform float uActive;
    uniform float uTime;

    void main() {
      if (uActive < 0.001) discard;

      // Base grid alpha (faint sheet)
      float alpha = 0.04 + vDistortion * 0.15;
      
      // Color shifts from deep space blue/teal to warm copper-gold in warped regions
      vec3 baseColor = vec3(0.08, 0.14, 0.25);
      vec3 gravityColor = vec3(0.85, 0.65, 0.22);
      vec3 finalColor = mix(baseColor, gravityColor, clamp(vDistortion * 0.22, 0.0, 1.0));

      // Add a very subtle light breathing wave along the grid
      float pulse = 0.9 + sin(uTime * 1.5 + vUv.x * 12.0) * 0.1;
      
      gl_FragColor = vec4(finalColor * pulse, alpha * uActive);
    }
  `;

  return (
    <mesh ref={gridRef} position={[0, 0, -0.5]}>
      <planeGeometry args={[52, 38, 48, 48]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        wireframe
      />
    </mesh>
  );
};
