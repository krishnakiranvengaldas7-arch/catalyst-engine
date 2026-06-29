import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";
import { useExperienceStore } from "../store/useExperienceStore";
import {
  particleVertexShader,
  particleFragmentShader,
} from "./shaders/particleShader";

export const CosmicCore: React.FC = () => {
  const currentState = useExperienceStore((state) => state.currentState);
  const setCurrentState = useExperienceStore((state) => state.setCurrentState);
  const setLoadingText = useExperienceStore((state) => state.setLoadingText);
  const hoveredNodeId = useExperienceStore((state) => state.hoveredNodeId);
  const isIdle = useExperienceStore((state) => state.isIdle);

  const groupRef = useRef<THREE.Group | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);

  // Search focus and keystroke trigger physics refs
  const focusTransition = useRef(0.0);
  const lastKeystrokeTime = useRef(0.0);
  const lastTrigger = useRef(0);

  // Scrolling physics rotation refs
  const scrollVelocity = useRef(0.0);
  const scrollOffset = useRef(0.0);

  // Track wheel scrolls to rotate the universe with physical inertia
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      scrollVelocity.current += e.deltaY * 0.0012;
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const starCount = 400; // Reduced to 400 for high performance and thermal safety
  const particleCount = 600; // Reduced to 600 for high performance and thermal safety
  const searchParticleCount = 80; // Minimalist search outline

  // --- 1. GENERATE STARFIELD DATA ---
  const starData = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const noise = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 45 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const rand = Math.random();
      if (rand < 0.25) {
        colors[i * 3 + 0] = 0.75; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
      } else if (rand < 0.45) {
        colors[i * 3 + 0] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.75;
      } else {
        colors[i * 3 + 0] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.95;
      }

      noise[i * 3 + 0] = Math.random() * 100;
      noise[i * 3 + 1] = Math.random() * 100;
      noise[i * 3 + 2] = Math.random() * 100;
    }

    return { positions, colors, noise };
  }, []);

  // --- 2. GENERATE AMBIENT PARTICLES & NEURAL CONNECTIONS ---
  const particleData = useMemo(() => {
    const galaxyPositions = new Float32Array(particleCount * 3);
    const driftPositions = new Float32Array(particleCount * 3);
    const noise = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount * 3);

    // Static node coordinates for placing local ambient star clouds
    const staticNodePositions: [number, number, number][] = [
      [-8, 2, -12],
      [-5, -2, -9],
      [-4, 3, -6],
      [-2, -3, -3],
      [0, -1, 0],
      [3, 2, 3],
      [5, 4, 6],
      [6, -2, 8],
      [8, 1, 11],
      [11, 3, 14],
      [14, -1, 18],
    ];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      // A. SWIRLING SPIRAL GALAXY GENERATION (centered at 0,0,0, face-on in XY plane)
      if (i >= particleCount - 12) {
        // The last 12 particles represent giant gaseous nebula dust clouds
        const r = Math.random() * 5.0;
        const theta = Math.random() * 2 * Math.PI;
        galaxyPositions[idx + 0] = r * Math.cos(theta);
        galaxyPositions[idx + 1] = r * Math.sin(theta);
        galaxyPositions[idx + 2] = (Math.random() - 0.5) * 1.5;
      } else if (i % 5 === 0) {
        // 20% of particles form a bright, dense, spherical central bulge
        const r = Math.pow(Math.random(), 1.3) * 1.6;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        galaxyPositions[idx + 0] = r * Math.sin(phi) * Math.cos(theta);
        galaxyPositions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        galaxyPositions[idx + 2] = r * Math.cos(phi);
      } else {
        // 80% form 3 sweeping spiral arms
        const arm = i % 3;
        const armAngle = (arm * 2 * Math.PI) / 3;
        // Radius distribution
        const r = 1.0 + Math.pow(Math.random(), 1.4) * 6.2;
        const twist = 2.4;
        const angle = armAngle + r * twist + (Math.random() - 0.5) * 0.38;
        
        galaxyPositions[idx + 0] = r * Math.cos(angle);
        galaxyPositions[idx + 1] = r * Math.sin(angle);
        // Thin disk, tapering off at the edges
        galaxyPositions[idx + 2] = (Math.random() - 0.5) * 0.35 * (1.0 - r / 7.2);
      }

      // B. EXPLORATION DRIFT POSITIONS (Distributed around timeline nodes)
      // For giant nebulas, they fade out during explore, so they can just stay at their galaxy positions
      if (i >= particleCount - 12) {
        driftPositions[idx + 0] = galaxyPositions[idx + 0];
        driftPositions[idx + 1] = galaxyPositions[idx + 1];
        driftPositions[idx + 2] = galaxyPositions[idx + 2];
      } else {
        const nodePos = staticNodePositions[i % staticNodePositions.length];
        const rDrift = 1.2 + Math.random() * 4.5;
        const thetaDrift = Math.random() * 2 * Math.PI;
        const phiDrift = Math.acos(Math.random() * 2 - 1);

        driftPositions[idx + 0] = nodePos[0] + rDrift * Math.sin(phiDrift) * Math.cos(thetaDrift);
        driftPositions[idx + 1] = nodePos[1] + rDrift * Math.sin(phiDrift) * Math.sin(thetaDrift);
        driftPositions[idx + 2] = nodePos[2] + rDrift * Math.cos(phiDrift);
      }

      // C. NOISE & SCALES
      noise[idx + 0] = Math.random() * 100;
      noise[idx + 1] = Math.random() * 100;
      noise[idx + 2] = Math.random() * 100;

      // Assign giant scales for the nebula gas clouds, small scales for bulge
      if (i >= particleCount - 12) {
        scales[i] = 15.0 + Math.random() * 10.0;
      } else {
        scales[i] = (i % 5 === 0) 
          ? Math.random() * 0.4 + 0.15 
          : Math.random() * 0.9 + 0.25;
      }

      randoms[idx + 0] = Math.random();
      randoms[idx + 1] = Math.random();
      randoms[idx + 2] = Math.random();
    }

    // Connect a subset of particles sparsely to keep neural connections clean
    const connList: Array<[number, number]> = [];
    const maxDist = 2.0; // slightly smaller to reduce initial density
    const connectCount = Math.min(particleCount, 150); // only connect first 150 particles
    for (let i = 0; i < connectCount; i++) {
      for (let j = i + 1; j < connectCount; j++) {
        const dx = galaxyPositions[i * 3 + 0] - galaxyPositions[j * 3 + 0];
        const dy = galaxyPositions[i * 3 + 1] - galaxyPositions[j * 3 + 1];
        const dz = galaxyPositions[i * 3 + 2] - galaxyPositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist) {
          connList.push([i, j]);
          if (connList.length >= 80) {
            break; // strictly cap at 80 connections to prevent CPU chokes and bomb-blast look
          }
        }
      }
      if (connList.length >= 80) {
        break;
      }
    }

    return { 
      galaxyPositions, 
      driftPositions, 
      noise, 
      scales, 
      randoms, 
      connections: connList 
    };
  }, []);

  // --- 3. PRE-CALCULATE SEARCH BAR TARGETS (Camera Space) ---
  const searchTargets = useMemo(() => {
    const targets = new Float32Array(particleCount * 3);
    // Bounding dimensions of the search bar pill-outline: width 3.2, height 0.44
    const w = 3.2;
    const h = 0.44;
    const perimeter = w * 2 + h * 2;

    for (let i = 0; i < particleCount; i++) {
      if (i < searchParticleCount) {
        const fraction = i / searchParticleCount;
        const d = fraction * perimeter;
        let tx = 0;
        let ty = 0;

        // Map linear perimeter distance to rectangle coordinate points
        if (d < w) {
          tx = -w / 2 + d;
          ty = h / 2;
        } else if (d < w + h) {
          tx = w / 2;
          ty = h / 2 - (d - w);
        } else if (d < w * 2 + h) {
          tx = w / 2 - (d - w - h);
          ty = -h / 2;
        } else {
          tx = -w / 2;
          ty = -h / 2 + (d - w * 2 - h);
        }

        // Search bar is positioned in the upper center of the screen
        // In camera space: x centered, y = 1.9, z = -4.0 (4 units down the lens)
        targets[i * 3 + 0] = tx + (Math.random() - 0.5) * 0.04;
        targets[i * 3 + 1] = ty + 1.9 + (Math.random() - 0.5) * 0.04;
        targets[i * 3 + 2] = -4.0 + (Math.random() - 0.5) * 0.15;
      }
    }
    return targets;
  }, [searchParticleCount, particleCount]);

  // Prepare line buffers
  const lineBuffers = useMemo(() => {
    const pos = new Float32Array(particleData.connections.length * 2 * 3);
    const col = new Float32Array(particleData.connections.length * 2 * 3);
    return { pos, col };
  }, [particleData.connections]);

  // Animation timeline state variables
  const animState = useMemo(
    () => ({
      globalOpacity: { value: 0 },
      neuralGrowth: { value: 0 },
      collapseProgress: { value: 0 },
      explosionProgress: { value: 0 },
      steadyStateProgress: { value: 0 },
    }),
    []
  );

  // Run cinematic loader sequence on mount
  useEffect(() => {
    if (currentState !== "loading") {
      animState.globalOpacity.value = 1.0;
      animState.steadyStateProgress.value = 1.0;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentState("intro");
      },
    });

    tl.to(animState.globalOpacity, {
      value: 1.0,
      duration: 2.5,
      ease: "power2.inOut",
    });

    tl.to(
      animState.neuralGrowth,
      { value: 1.0, duration: 4.0, ease: "power1.inOut" },
      1.5
    );

    tl.call(() => setLoadingText("Tracing Consequences"), [], 0.8);
    tl.call(() => setLoadingText(""), [], 3.2);

    tl.call(() => setLoadingText("Building Reality"), [], 3.8);
    tl.call(() => setLoadingText(""), [], 6.2);

    tl.call(() => setLoadingText("Synchronizing Causality"), [], 6.8);
    tl.call(() => setLoadingText(""), [], 9.0);

    tl.to(
      animState.collapseProgress,
      { value: 1.0, duration: 1.3, ease: "power3.in" },
      9.0
    );

    tl.to(
      animState.explosionProgress,
      { value: 1.0, duration: 2.2, ease: "power2.out" },
      10.3
    );

    tl.to(
      animState.steadyStateProgress,
      { value: 1.0, duration: 1.5, ease: "power1.inOut" },
      11.0
    );

    return () => {
      tl.kill();
    };
  }, [animState, currentState, setCurrentState, setLoadingText]);

  // Temporary vectors for frame loops
  const tempPosI = useMemo(() => new THREE.Vector3(), []);
  const tempPosJ = useMemo(() => new THREE.Vector3(), []);
  const currentParticlePos = useMemo(
    () => new Float32Array(particleCount * 3),
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = state.clock.getElapsedTime();
    const nodes = useExperienceStore.getState().nodes;

    if (
      !starsRef.current ||
      !particlesRef.current ||
      !linesRef.current ||
      !groupRef.current
    ) {
      return;
    }

    const gOp = animState.globalOpacity.value;
    const nGrowth = animState.neuralGrowth.value;
    const colP = animState.collapseProgress.value;
    const expP = animState.explosionProgress.value;
    const steadyP = animState.steadyStateProgress.value;

    const entranceP = useExperienceStore.getState().entranceProgress;
    const searchFocused = useExperienceStore.getState().searchFocused;

    // Smoothly interpolate search focus factor
    const focusTarget = searchFocused ? 1.0 : 0.0;
    focusTransition.current = THREE.MathUtils.lerp(focusTransition.current, focusTarget, 3.5 * dt);

    // Track keystroke triggers to release physical shockwaves
    const currentTrigger = useExperienceStore.getState().keystrokeTrigger;
    if (currentTrigger !== lastTrigger.current) {
      lastKeystrokeTime.current = time;
      lastTrigger.current = currentTrigger;
    }

    // Scrolling physics integration (Damped inertia)
    scrollOffset.current += scrollVelocity.current * dt;
    scrollVelocity.current = THREE.MathUtils.lerp(scrollVelocity.current, 0.0, 4.0 * dt);

    // Slow global rotation of the cosmos with mouse tilt parallax (quiets by 85% when focused)
    const speedMultiplier = 1.0 - focusTransition.current * 0.85;
    
    // Ambient evolution slowly accelerates rotation when idle
    const idleRotSpeed = isIdle ? 1.6 : 1.0;
    let targetRotX = time * 0.008 * speedMultiplier * idleRotSpeed;
    let targetRotY = (time * 0.018 + scrollOffset.current) * speedMultiplier * idleRotSpeed;

    if (currentState === "intro") {
      targetRotX += state.pointer.y * 0.22;
      targetRotY += state.pointer.x * 0.28;
    } else if (currentState === "explore") {
      // Subtly react to mouse movement at all times in explore mode (gently warps space)
      targetRotX += state.pointer.y * 0.04 * speedMultiplier;
      targetRotY += state.pointer.x * 0.06 * speedMultiplier;
    }

    // Smoothly interpolate rotation to prevent sudden jumps
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);

    // --- A. STARFIELD ANIMATION (Only calculated during loading collapse/explosion) ---
    if (currentState === "loading" && steadyP < 0.99) {
      const starGeom = starsRef.current.geometry;
      const starPosAttr = starGeom.attributes.position;
      const starPosArr = starPosAttr.array as Float32Array;

      for (let i = 0; i < starCount; i++) {
        const idx = i * 3;
        const bx = starData.positions[idx + 0];
        const by = starData.positions[idx + 1];
        const bz = starData.positions[idx + 2];

        const ox = Math.sin(time * 0.1 + starData.noise[idx + 0]) * 0.2;
        const oy = Math.cos(time * 0.08 + starData.noise[idx + 1]) * 0.2;
        const oz = Math.sin(time * 0.05 + starData.noise[idx + 2]) * 0.2;

        let rx = bx + ox;
        let ry = by + oy;
        let rz = bz + oz;

        if (expP > 0) {
          const scale =
            1.0 - Math.pow(1 - expP, 2) + 14.0 * expP * Math.pow(1 - expP, 2);
          rx = (bx * scale + ox) * (1.0 - steadyP) + (bx + ox) * steadyP;
          ry = (by * scale + oy) * (1.0 - steadyP) + (by + oy) * steadyP;
          rz = (bz * scale + oz) * (1.0 - steadyP) + (bz + oz) * steadyP;
        } else if (colP > 0) {
          const pull = 1.0 - Math.pow(colP, 3);
          rx = (bx + ox) * pull;
          ry = (by + oy) * pull;
          rz = (bz + oz) * pull;
        }

        starPosArr[idx + 0] = rx;
        starPosArr[idx + 1] = ry;
        starPosArr[idx + 2] = rz;
      }
      starPosAttr.needsUpdate = true;
    }

    // --- B. AMBIENT PARTICLES & SEARCH BAR ASSEMBLY ---
    // Update particles if loading, intro, during transition, if hovered, if search is focused, or if focus transition/keystroke ripple is active
    const keyTimeActive = (time - lastKeystrokeTime.current) < 1.2;
    
    const needsParticleUpdate =
      (currentState === "loading" && steadyP < 0.99) ||
      currentState === "intro" ||
      (currentState === "explore" && entranceP < 1.0) ||
      (hoveredNodeId !== null && currentState === "explore") ||
      (focusTransition.current > 0.001 && currentState === "explore") ||
      (keyTimeActive && currentState === "explore");

    const partGeom = particlesRef.current.geometry;
    const partPosAttr = partGeom.attributes.position;
    const partPosArr = partPosAttr.array as Float32Array;
    const partScaleAttr = partGeom.attributes.aScale;
    const partScaleArr = partScaleAttr.array as Float32Array;

    const partMat = particlesRef.current.material as THREE.ShaderMaterial;

    // Calculate search bar assembly progress: between 25% and 75% of the fly-through
    const sP =
      currentState === "explore"
        ? Math.min(Math.max((entranceP - 0.25) / 0.5, 0), 1)
        : 0;

    if (needsParticleUpdate) {
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        let pScale = particleData.scales[i];
        const gx = particleData.galaxyPositions[idx + 0];
        const gy = particleData.galaxyPositions[idx + 1];
        const gz = particleData.galaxyPositions[idx + 2];

        const driftX = particleData.driftPositions[idx + 0];
        const driftY = particleData.driftPositions[idx + 1];
        const driftZ = particleData.driftPositions[idx + 2];

        const ox = Math.sin(time * 0.2 + particleData.noise[idx + 0]) * 0.35;
        const oy = Math.cos(time * 0.15 + particleData.noise[idx + 1]) * 0.35;
        const oz = Math.sin(time * 0.12 + particleData.noise[idx + 2]) * 0.35;

        let rx = gx;
        let ry = gy;
        let rz = gz;

        if (currentState === "loading") {
          if (steadyP < 0.99) {
            if (expP > 0) {
              // Settle from big bang explosion back to galaxy positions
              const scale = 1.0 - Math.pow(1 - expP, 2) + 18.0 * expP * Math.pow(1 - expP, 2);
              const explX = gx * scale + ox * expP;
              const explY = gy * scale + oy * expP;
              const explZ = gz * scale + oz * expP;

              const settleX = gx + ox;
              const settleY = gy + oy;
              const settleZ = gz + oz;

              rx = THREE.MathUtils.lerp(explX, settleX, steadyP);
              ry = THREE.MathUtils.lerp(explY, settleY, steadyP);
              rz = THREE.MathUtils.lerp(explZ, settleZ, steadyP);
            } else if (colP > 0) {
              // Accretion disk pull inwards
              const pull = 1.0 - Math.pow(colP, 3);
              const rPlane = Math.sqrt(gx * gx + gy * gy);
              const angle = Math.atan2(gy, gx);
              const spinSpeed = 12.0 * colP * (1.0 / (rPlane + 0.3));
              const targetAngle = angle + spinSpeed;

              rx = Math.cos(targetAngle) * rPlane * pull;
              ry = Math.sin(targetAngle) * rPlane * pull;
              rz = gz * pull;
            } else {
              // Slow loading swirl
              const rPlane = Math.sqrt(gx * gx + gy * gy);
              const angle = Math.atan2(gy, gx);
              const speed = 0.3 / (rPlane + 0.5);
              const currentAngle = angle + time * speed;

              rx = rPlane * Math.cos(currentAngle) + ox;
              ry = rPlane * Math.sin(currentAngle) + oy;
              rz = gz + oz;
            }
          }
        } else if (currentState === "intro") {
          // Slow swirling galaxy in hero
          const rPlane = Math.sqrt(gx * gx + gy * gy);
          const angle = Math.atan2(gy, gx);
          const speed = 0.35 / (rPlane + 0.5);
          const currentAngle = angle + time * speed;

          rx = rPlane * Math.cos(currentAngle) + ox;
          ry = rPlane * Math.sin(currentAngle) + oy;
          rz = gz + oz;
        } else {
          // explore / timeline / detail states (during transition)
          // Differential rotation base
          const rPlane = Math.sqrt(gx * gx + gy * gy);
          const angle = Math.atan2(gy, gx);
          const speed = 0.35 / (rPlane + 0.5);
          const currentAngle = angle + time * speed;

          const swirlX = rPlane * Math.cos(currentAngle);
          const swirlY = rPlane * Math.sin(currentAngle);
          const swirlZ = gz;

          // 1. Radial Expansion (Tunnel Warp)
          const radialExpansion = 1.0 + Math.pow(entranceP, 2) * 15.0;
          const tunnelX = swirlX * radialExpansion;
          const tunnelY = swirlY * radialExpansion;
          const tunnelZ = swirlZ - Math.pow(entranceP, 1.5) * 25.0; // stretch deep along Z axis

          // 2. Settle into timeline drift positions around nodes
          const targetDriftX = driftX + ox;
          const targetDriftY = driftY + oy;
          const targetDriftZ = driftZ + oz;

          const transitionCurve = Math.pow(entranceP, 2.0); // smooth curve
          rx = THREE.MathUtils.lerp(tunnelX, targetDriftX, transitionCurve);
          ry = THREE.MathUtils.lerp(tunnelY, targetDriftY, transitionCurve);
          rz = THREE.MathUtils.lerp(tunnelZ, targetDriftZ, transitionCurve);
        }

        // --- LOCAL HOVER GRAVITY ATTRACTION ---
        // Nearby ambient particles accelerate and swirl towards the hovered historical node
        if (hoveredNodeId && currentState === "explore") {
          const hoveredNode = nodes.find((n) => n.id === hoveredNodeId);
          if (hoveredNode) {
            const hx = hoveredNode.position[0];
            const hy = hoveredNode.position[1];
            const hz = hoveredNode.position[2];

            const dx = rx - hx;
            const dy = ry - hy;
            const dz = rz - hz;
            const distToHover = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distToHover < 5.2) {
              // Gravitational pull: force increases exponentially as particles get closer
              const pullForce = Math.pow(1.0 - distToHover / 5.2, 1.8) * 0.36;
              const px = -dx / (distToHover + 0.001);
              const py = -dy / (distToHover + 0.001);
              const pz = -dz / (distToHover + 0.001);

              rx += px * pullForce;
              ry += py * pullForce;
              rz += pz * pullForce;

              // Orbital acceleration: add a fast, delicate swirling buzz around the node
              const buzzSpeed = time * 18.0 + i;
              const buzzForce = (1.0 - distToHover / 5.2) * 0.085;
              rx += Math.sin(buzzSpeed) * buzzForce;
              ry += Math.cos(buzzSpeed * 0.85) * buzzForce;
              rz += Math.sin(buzzSpeed * 1.15) * buzzForce;
            }
          }
        }

        // --- RADIAL FOCUS PUSH (Stars move away when focused) ---
        if (focusTransition.current > 0.001 && currentState === "explore") {
          const distFromCenter = Math.sqrt(rx * rx + ry * ry + rz * rz);
          // Push outward, stronger near the center where the search experience sits
          const pushForce = focusTransition.current * 3.6 * (1.0 / (distFromCenter + 0.5));
          const px = rx / (distFromCenter + 0.001);
          const py = ry / (distFromCenter + 0.001);
          const pz = rz / (distFromCenter + 0.001);

          rx += px * pushForce;
          ry += py * pushForce;
          rz += pz * pushForce;

          // Dim the scale of particles by 45% when focused
          pScale *= (1.0 - focusTransition.current * 0.45);
        }

        // --- KEYSTROKE RIPPLE WAVE ( Keystrokes ripple nearby stars ) ---
        if (keyTimeActive && currentState === "explore") {
          const waveRadius = (time - lastKeystrokeTime.current) * 14.5; // Wave expands outward
          const waveWidth = 2.0;
          const distFromCenter = Math.sqrt(rx * rx + ry * ry + rz * rz);
          const distFromWave = Math.abs(distFromCenter - waveRadius);

          if (distFromWave < waveWidth) {
            // Outward shockwave ripple that decays exponentially
            const waveForce = (1.0 - distFromWave / waveWidth) * 0.22 * Math.exp(-(time - lastKeystrokeTime.current) * 2.2);
            const px = rx / (distFromCenter + 0.001);
            const py = ry / (distFromCenter + 0.001);
            const pz = rz / (distFromCenter + 0.001);

            rx += px * waveForce;
            ry += py * waveForce;
            rz += pz * waveForce;
          }
        }

        // --- SEARCH BAR GRAVITATIONAL ASSEMBLY ---
        if (i < searchParticleCount && sP > 0) {
          tempPosI.set(
            searchTargets[idx + 0],
            searchTargets[idx + 1],
            searchTargets[idx + 2]
          );
          tempPosI.applyMatrix4(state.camera.matrixWorld);

          rx = THREE.MathUtils.lerp(rx, tempPosI.x, sP);
          ry = THREE.MathUtils.lerp(ry, tempPosI.y, sP);
          rz = THREE.MathUtils.lerp(rz, tempPosI.z, sP);

          if (sP < 0.999) {
            const swirl = Math.sin(time * 15.0 + i) * 0.15 * (1.0 - sP);
            rx += swirl;
            ry += swirl;
          } else {
            // Dissolve locked search particles as HTML search bar appears
            const fadeStart = 0.82;
            if (entranceP > fadeStart) {
              const fade = Math.max(0, 1.0 - (entranceP - fadeStart) / (1.0 - fadeStart));
              pScale *= fade;
            }
          }
        }

        // Make new particles appear and glow when idle
        if (isIdle && i % 3 === 0) {
          pScale *= (1.0 + Math.sin(time * 1.5 + i) * 0.45);
        }

        partPosArr[idx + 0] = rx;
        partPosArr[idx + 1] = ry;
        partPosArr[idx + 2] = rz;
        partScaleArr[i] = pScale;

        currentParticlePos[idx + 0] = rx;
        currentParticlePos[idx + 1] = ry;
        currentParticlePos[idx + 2] = rz;
      }
      partPosAttr.needsUpdate = true;
      partScaleAttr.needsUpdate = true;
    }

    // Update shader uniforms
    partMat.uniforms.uTime.value = time;
    partMat.uniforms.uSize.value = 18.0 * gOp * (1.0 - colP * 0.7 + expP * 0.4);

    // --- C. NEURAL FILAMENTS (Only updated during loading/intro and early explore) ---
    const needsLinesUpdate =
      (currentState === "loading" && steadyP < 0.99) ||
      currentState === "intro" ||
      (currentState === "explore" && entranceP < 0.67);

    if (needsLinesUpdate) {
      const lineGeom = linesRef.current.geometry;
      const linePosAttr = lineGeom.attributes.position;
      const linePosArr = linePosAttr.array as Float32Array;
      const lineColAttr = lineGeom.attributes.color;
      const lineColArr = lineColAttr.array as Float32Array;

      let lineIdx = 0;
      const maxLineRadius = nGrowth * 18.0;

      particleData.connections.forEach(([i, j]) => {
        const idxI = i * 3;
        const idxJ = j * 3;

        // If particle position wasn't updated this frame, read it from partPosArr
        const xi = needsParticleUpdate ? currentParticlePos[idxI + 0] : partPosArr[idxI + 0];
        const yi = needsParticleUpdate ? currentParticlePos[idxI + 1] : partPosArr[idxI + 1];
        const zi = needsParticleUpdate ? currentParticlePos[idxI + 2] : partPosArr[idxI + 2];

        const xj = needsParticleUpdate ? currentParticlePos[idxJ + 0] : partPosArr[idxJ + 0];
        const yj = needsParticleUpdate ? currentParticlePos[idxJ + 1] : partPosArr[idxJ + 1];
        const zj = needsParticleUpdate ? currentParticlePos[idxJ + 2] : partPosArr[idxJ + 2];

        linePosArr[lineIdx * 6 + 0] = xi;
        linePosArr[lineIdx * 6 + 1] = yi;
        linePosArr[lineIdx * 6 + 2] = zi;

        linePosArr[lineIdx * 6 + 3] = xj;
        linePosArr[lineIdx * 6 + 4] = yj;
        linePosArr[lineIdx * 6 + 5] = zj;

        tempPosI.set(xi, yi, zi);
        tempPosJ.set(xj, yj, zj);
        const midDist = tempPosI.add(tempPosJ).multiplyScalar(0.5).length();

        let r = 0.83;
        let g = 0.69;
        let b = 0.22;

        let lineAlpha = 0;

        // If in exploration mode, neural lines fade out to keep the workspace clean,
        // but when the user becomes idle, hidden connections gently breathe back into view
        const idleBreathe = isIdle ? (0.04 + Math.sin(time * 0.8 + (midDist * 0.5)) * 0.03) : 0.0;
        const expFade = currentState === "explore"
          ? (isIdle ? idleBreathe : Math.max(0, 1.0 - entranceP * 1.5))
          : 1.0;

        if (steadyP > 0.01) {
          lineAlpha = 0.05 * steadyP * gOp * expFade;
        } else if (midDist < maxLineRadius && colP < 0.98) {
          const fade = Math.min(1.0, (maxLineRadius - midDist) * 0.5);
          const pulse = 0.85 + Math.sin(time * 15.0 + midDist * 2.0) * 0.15;
          lineAlpha = fade * gOp * pulse * (1.0 - Math.pow(colP, 2)) * expFade;

          if (Math.sin(time * 30.0 + midDist * 10.0) > 0.9) {
            r = 0.5; g = 0.8; b = 1.0;
          }
        }

        lineColArr[lineIdx * 6 + 0] = r * lineAlpha;
        lineColArr[lineIdx * 6 + 1] = g * lineAlpha;
        lineColArr[lineIdx * 6 + 2] = b * lineAlpha;

        lineColArr[lineIdx * 6 + 3] = r * lineAlpha;
        lineColArr[lineIdx * 6 + 4] = g * lineAlpha;
        lineColArr[lineIdx * 6 + 5] = b * lineAlpha;

        lineIdx++;
      });

      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;
    }

    // --- D. BASE FADES ---
    const starMat = starsRef.current.material as THREE.PointsMaterial;
    const focusStarDim = 1.0 - focusTransition.current * 0.65;
    starMat.opacity =
      gOp * (1.0 - colP * 0.9) * (0.3 + 0.7 * (1.0 - colP)) * (0.4 + 0.6 * steadyP) * focusStarDim;
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uSize: { value: 18.0 },
    }),
    []
  );

  return (
    <group ref={groupRef}>
      {/* 1. Background Starfield */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[starData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      {/* 2. Custom Shader Drifting Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.galaxyPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-aScale"
            args={[particleData.scales, 1]}
          />
          <bufferAttribute
            attach="attributes-aRandoms"
            args={[particleData.randoms, 3]}
          />
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

      {/* 3. Neural Connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[lineBuffers.pos, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineBuffers.col, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
};
