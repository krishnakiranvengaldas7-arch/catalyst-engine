import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";
import { useExperienceStore } from "../store/useExperienceStore";

export const CinematicLoader: React.FC = () => {
  const setCurrentState = useExperienceStore((state) => state.setCurrentState);
  const setLoadingText = useExperienceStore((state) => state.setLoadingText);

  const groupRef = useRef<THREE.Group | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);

  const starCount = 500;

  // 1. Generate star positions and random parameters
  const { basePositions, noiseOffsets, connections } = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const noise = new Float32Array(starCount * 3);

    // Distribute stars in a sphere
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      // Sphere radius between 3 and 10 units
      const r = 3.0 + Math.pow(Math.random(), 1.5) * 8.0;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Noise offsets for independent organic drift
      noise[i * 3 + 0] = Math.random() * 100;
      noise[i * 3 + 1] = Math.random() * 100;
      noise[i * 3 + 2] = Math.random() * 100;
    }

    // 2. Find connections (stars close to each other)
    const connList: Array<[number, number]> = [];
    const maxDist = 3.2;
    for (let i = 0; i < starCount; i++) {
      for (let j = i + 1; j < starCount; j++) {
        const dx = positions[i * 3 + 0] - positions[j * 3 + 0];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist) {
          connList.push([i, j]);
        }
      }
    }

    return {
      basePositions: positions,
      noiseOffsets: noise,
      connections: connList,
    };
  }, []);

  // 3. Prepare line buffers (2 vertices per connection)
  const { linePositions, lineColors } = useMemo(() => {
    const pos = new Float32Array(connections.length * 2 * 3);
    const col = new Float32Array(connections.length * 2 * 3);
    return { linePositions: pos, lineColors: col };
  }, [connections]);

  // 4. Animation timeline parameters (managed via GSAP refs)
  const animState = useMemo(
    () => ({
      starsOpacity: { value: 0 },
      lineGrowth: { value: 0 },
      collapseProgress: { value: 0 },
      explosionProgress: { value: 0 },
    }),
    []
  );

  // 5. Setup GSAP Cinematic Sequence on mount
  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Explode into the homepage
        setCurrentState("intro");
      },
    });

    // Sequence timing
    // Phase 1: Tiny stars gradually appear (0s - 2.5s)
    tl.to(animState.starsOpacity, {
      value: 1.0,
      duration: 2.5,
      ease: "power2.inOut",
    });

    // Phase 2: Neural connections propagate (1.5s - 5.5s)
    tl.to(
      animState.lineGrowth,
      { value: 1.0, duration: 4.0, ease: "power1.inOut" },
      1.5
    );

    // Text Sequence:
    // "Tracing Consequences"
    tl.call(() => setLoadingText("Tracing Consequences"), [], 0.8);
    tl.call(() => setLoadingText(""), [], 3.2);

    // "Building Reality"
    tl.call(() => setLoadingText("Building Reality"), [], 3.8);
    tl.call(() => setLoadingText(""), [], 6.2);

    // "Synchronizing Causality"
    tl.call(() => setLoadingText("Synchronizing Causality"), [], 6.8);
    tl.call(() => setLoadingText(""), [], 9.0);

    // Phase 3: Starfield collapses to single point (9.0s - 10.2s)
    tl.to(
      animState.collapseProgress,
      { value: 1.0, duration: 1.2, ease: "power4.in" },
      9.0
    );

    // Phase 4: Explosion (10.4s - 12.2s)
    tl.to(
      animState.explosionProgress,
      { value: 1.0, duration: 1.8, ease: "power3.out" },
      10.4
    );

    return () => {
      tl.kill();
    };
  }, [animState, setCurrentState, setLoadingText]);

  // Temporary vectors for math inside useFrame (reused to avoid GC thrashing)
  const tempPosI = useMemo(() => new THREE.Vector3(), []);
  const tempPosJ = useMemo(() => new THREE.Vector3(), []);
  const currentPositions = useMemo(() => new Float32Array(starCount * 3), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!pointsRef.current || !linesRef.current || !groupRef.current) return;

    // Slow global rotation
    groupRef.current.rotation.y = time * 0.04;
    groupRef.current.rotation.x = time * 0.015;

    const op = animState.starsOpacity.value;
    const growth = animState.lineGrowth.value;
    const colP = animState.collapseProgress.value;
    const expP = animState.explosionProgress.value;

    const pointsGeom = pointsRef.current.geometry;
    const posAttr = pointsGeom.attributes.position;
    const posArray = posAttr.array as Float32Array;

    const linesGeom = linesRef.current.geometry;
    const linePosAttr = linesGeom.attributes.position;
    const linePosArray = linePosAttr.array as Float32Array;
    const lineColorAttr = linesGeom.attributes.color;
    const lineColorArray = lineColorAttr.array as Float32Array;

    // --- PHYSICS SIMULATION ---
    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const bx = basePositions[idx + 0];
      const by = basePositions[idx + 1];
      const bz = basePositions[idx + 2];

      // Organic drift offset
      const ox = Math.sin(time * 0.3 + noiseOffsets[idx + 0]) * 0.15;
      const oy = Math.cos(time * 0.25 + noiseOffsets[idx + 1]) * 0.15;
      const oz = Math.sin(time * 0.2 + noiseOffsets[idx + 2]) * 0.15;

      const driftX = bx + ox;
      const driftY = by + oy;
      const driftZ = bz + oz;

      let rx = driftX;
      let ry = driftY;
      let rz = driftZ;

      // Handle collapse and explosion physics
      if (expP > 0) {
        // Damped polynomial explosion shockwave curve: 0 -> peak (~2.8) -> 1
        const scale =
          1.0 - Math.pow(1 - expP, 2) + 16.0 * expP * Math.pow(1 - expP, 2);
        // Seamlessly blend organic drift back in during the explosion settle phase
        rx = bx * scale + ox * expP;
        ry = by * scale + oy * expP;
        rz = bz * scale + oz * expP;
      } else if (colP > 0) {
        // Exponential pull towards (0,0,0)
        const pull = 1.0 - Math.pow(colP, 4);
        rx = driftX * pull;
        ry = driftY * pull;
        rz = driftZ * pull;
      }

      posArray[idx + 0] = rx;
      posArray[idx + 1] = ry;
      posArray[idx + 2] = rz;

      // Cache positions for line rendering
      currentPositions[idx + 0] = rx;
      currentPositions[idx + 1] = ry;
      currentPositions[idx + 2] = rz;
    }
    posAttr.needsUpdate = true;

    // --- NEURAL NETWORK CONNECTIONS ---
    let lineIdx = 0;
    const maxLineRadius = growth * 18.0; // Spreading wave radius

    connections.forEach(([i, j]) => {
      const idxI = i * 3;
      const idxJ = j * 3;

      const xi = currentPositions[idxI + 0];
      const yi = currentPositions[idxI + 1];
      const zi = currentPositions[idxI + 2];

      const xj = currentPositions[idxJ + 0];
      const yj = currentPositions[idxJ + 1];
      const zj = currentPositions[idxJ + 2];

      // Endpoints of the connection segment
      linePosArray[lineIdx * 6 + 0] = xi;
      linePosArray[lineIdx * 6 + 1] = yi;
      linePosArray[lineIdx * 6 + 2] = zi;

      linePosArray[lineIdx * 6 + 3] = xj;
      linePosArray[lineIdx * 6 + 4] = yj;
      linePosArray[lineIdx * 6 + 5] = zj;

      // Calculate midpoint distance from center to trigger the neural propagation wave
      tempPosI.set(xi, yi, zi);
      tempPosJ.set(xj, yj, zj);
      const midDist = tempPosI.add(tempPosJ).multiplyScalar(0.5).length();

      // Golden color filament
      const r = 0.83;
      const g = 0.69;
      const b = 0.22;

      // Determine visibility based on neural propagation wave
      let lineAlpha = 0;
      if (midDist < maxLineRadius && colP < 0.98) {
        // Fade in lines after the wave passes, fade out completely during final collapse
        const fade = Math.min(1.0, (maxLineRadius - midDist) * 0.5);
        lineAlpha = fade * op * (1.0 - Math.pow(colP, 2));
      }

      // Write colors (black if inactive, glowing gold if active)
      lineColorArray[lineIdx * 6 + 0] = r * lineAlpha;
      lineColorArray[lineIdx * 6 + 1] = g * lineAlpha;
      lineColorArray[lineIdx * 6 + 2] = b * lineAlpha;

      lineColorArray[lineIdx * 6 + 3] = r * lineAlpha;
      lineColorArray[lineIdx * 6 + 4] = g * lineAlpha;
      lineColorArray[lineIdx * 6 + 5] = b * lineAlpha;

      lineIdx++;
    });

    linePosAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;

    // --- PARTICLE MATERIAL PROPERTIES ---
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = op * (1.0 - colP * 0.9); // Dim slightly right before collapse
    mat.size = 0.07 * (colP > 0 ? 1.0 - colP * 0.6 : 1.0 + expP * 0.5);
  });

  return (
    <group ref={groupRef}>
      {/* 3D Neural Connection Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          linewidth={1}
        />
      </lineSegments>

      {/* 3D Stars */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(starCount * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#fef08a" // Pale yellow stars
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};
