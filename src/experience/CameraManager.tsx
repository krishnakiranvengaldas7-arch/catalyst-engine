import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

export const CameraManager: React.FC = () => {
  const { camera, gl } = useThree();
  const currentState = useExperienceStore((state) => state.currentState);

  // Springs & physics state tracking
  const posVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const lookVelocity = useRef(new THREE.Vector3(0, 0, 0));
  
  const targetPos = useRef(new THREE.Vector3(0, 0, 10));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));

  // Reusable vector instances to prevent garbage collection allocations
  const tempAcc = useRef(new THREE.Vector3());
  const finalTargetPos = useRef(new THREE.Vector3());
  const finalTargetLook = useRef(new THREE.Vector3());

  // Physics phase accumulators to replace time * constant animations
  const breathPhase = useRef(new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10));
  const shakePhase = useRef(new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10));

  // Flying Camera and Orbit variables
  const cameraYaw = useRef(0.0);
  const cameraPitch = useRef(0.0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  // Initialize camera position on mount
  useEffect(() => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    currentLook.current.set(0, 0, 0);
  }, [camera]);

  const activeNodeId = useExperienceStore((state) => state.activeNodeId);
  const nodes = useExperienceStore((state) => state.nodes);

  const syncYawPitchFromCoords = (camPos: THREE.Vector3, target: THREE.Vector3) => {
    const diff = new THREE.Vector3().subVectors(camPos, target);
    const r = diff.length();
    if (r > 0.01) {
      cameraYaw.current = Math.atan2(diff.x, diff.z);
      cameraPitch.current = Math.asin(diff.y / r);
    }
  };

  useEffect(() => {
    if (activeNodeId) {
      const activeNode = nodes.find(n => n.id === activeNodeId);
      if (activeNode) {
        const nodePos = new THREE.Vector3().fromArray(activeNode.position);
        syncYawPitchFromCoords(camera.position, nodePos);
      }
    } else {
      syncYawPitchFromCoords(camera.position, targetLook.current);
    }
  }, [activeNodeId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        keysPressed.current[key] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        keysPressed.current[key] = false;
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevMouse.current.x;
      const deltaY = e.clientY - prevMouse.current.y;
      prevMouse.current = { x: e.clientX, y: e.clientY };

      cameraYaw.current -= deltaX * 0.0035;
      cameraPitch.current = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, cameraPitch.current - deltaY * 0.0035));
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Cinematic vertical panning instead of jarring zoom
      const scrollStrength = e.deltaY * -0.015;
      targetPos.current.y += scrollStrength;
      
      const state = useExperienceStore.getState();
      // Break node focus and special modes if user tries to scroll away
      if (state.activeNodeId) {
        state.setActiveNodeId(null);
      }
      if (state.butterflyActive) {
        state.stopButterfly();
      }
      if (state.compareMode) {
        state.setCompareMode(false, null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    gl.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("wheel", handleWheel);
    };
  }, [gl, camera]);

  useFrame((state, delta) => {
    // Clamp delta to avoid physics explosion on frame rate drops (e.g. background tab)
    const dt = Math.min(delta, 0.1);
    const time = state.clock.getElapsedTime();
    const activeNodeId = useExperienceStore.getState().activeNodeId;
    const isPaused = useExperienceStore.getState().isPaused;

    // Advance camera phase accumulators if not paused
    if (!isPaused) {
      breathPhase.current.x += 0.35 * dt;
      breathPhase.current.y += 0.28 * dt;
      breathPhase.current.z += 0.22 * dt;

      shakePhase.current.x += 4.8 * dt;
      shakePhase.current.y += 4.2 * dt;
      shakePhase.current.z += 5.2 * dt;
    }

    // 1. DETERMINE BASE PATH TARGETS
    if (currentState === "loading") {
      // Very smooth, slow cinematic push-in (dolly shot) towards the universe
      const pushProgress = Math.min(time / 12.2, 1.0);
      const easeOut = 1.0 - Math.pow(1.0 - pushProgress, 3.0);
      
      const startZ = 35.0;
      const endZ = 14.0;
      
      targetPos.current.set(
        Math.sin(breathPhase.current.x * 0.2) * 2.5,
        Math.cos(breathPhase.current.y * 0.2) * 1.5,
        THREE.MathUtils.lerp(startZ, endZ, easeOut)
      );
      targetLook.current.set(0, 0, 0);
    } else if (currentState === "intro") {
      // Cinematic slow drift in intro
      targetPos.current.set(
        Math.sin(time * 0.15) * 1.5,
        Math.cos(time * 0.12) * 0.8,
        9.0 + Math.sin(time * 0.08) * 1.0
      );
      targetLook.current.set(0, 0, 0);
    } else {
      // Exploration mode
      const entranceP = useExperienceStore.getState().entranceProgress;

      if (entranceP < 0.999) {
        // Curved Bezier flight path to the first node
        const firstNodePos = [-8, 2, -12];
        const rx = entranceP * -8.0 + Math.sin(entranceP * Math.PI) * 3.5;
        const ry = entranceP * 3.0 + Math.sin(entranceP * Math.PI) * 1.5;
        const rz = THREE.MathUtils.lerp(9.0, -7.5, entranceP);

        targetPos.current.set(rx, ry, rz);

        // Smoothly pan gaze from center of universe to the first node
        targetLook.current.set(
          entranceP * firstNodePos[0],
          entranceP * firstNodePos[1],
          entranceP * firstNodePos[2]
        );
      } else {
        const butterflyActive = useExperienceStore.getState().butterflyActive;
        const butterflyTime = useExperienceStore.getState().butterflyTime;
        const butterflyTargetId = useExperienceStore.getState().butterflyTargetId;
        const nodes = useExperienceStore.getState().nodes;

        const compareMode = useExperienceStore.getState().compareMode;
        const sigPhase = useExperienceStore.getState().signatureSearchPhase;
        const sigTargetId = useExperienceStore.getState().signatureSearchTargetId;

        if (sigPhase !== 'none' && sigTargetId) {
          const targetNode = nodes.find(n => n.id === sigTargetId);
          const center = targetNode ? new THREE.Vector3().fromArray(targetNode.position) : new THREE.Vector3();
          
          if (sigPhase === 'freeze') {
            // Lock onto the target node
            targetLook.current.copy(center);
          } else if (sigPhase === 'glow') {
            // Slowly push in to frame it
            const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
            // push in closer
            targetPos.current.copy(center).addScaledVector(dir, 3.5);
            targetPos.current.y += 0.5;
            targetLook.current.copy(center);
          } else if (sigPhase === 'unfold') {
            // Massive pullback to watch history unfold
            const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
            targetPos.current.copy(center).addScaledVector(dir, 12.0);
            targetPos.current.y += 4.0;
            targetLook.current.copy(center);
          } else if (sigPhase === 'finish') {
            // Grand cinematic wide shot
            const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
            targetPos.current.copy(center).addScaledVector(dir, 15.0);
            targetPos.current.y += 5.5;
            targetLook.current.copy(center);
          }
        } else if (compareMode) {
          targetPos.current.set(0, 0.8, 17.5);
          targetLook.current.set(0, 0, 0);
        } else if (butterflyActive && butterflyTime >= 9.0 && butterflyTargetId) {
          const targetNode = nodes.find(n => n.id === butterflyTargetId);
          const center = targetNode ? new THREE.Vector3().fromArray(targetNode.position) : new THREE.Vector3();
          const orbitTime = (butterflyTime - 9.0) * 0.18;
          const radius = 5.2;
          const ox = Math.sin(orbitTime) * radius;
          const oz = Math.cos(orbitTime) * radius;
          const oy = 1.2 + Math.cos(orbitTime * 0.5) * 0.4;

          targetPos.current.set(center.x + ox, center.y + oy, center.z + oz);
          targetLook.current.copy(center);
        } else {
          // Free Fly & Orbit Observatory Camera Calculations
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          const moveVec = new THREE.Vector3();

          if (keysPressed.current["w"] || keysPressed.current["arrowup"]) moveVec.add(forward);
          if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) moveVec.sub(forward);
          if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) moveVec.sub(right);
          if (keysPressed.current["d"] || keysPressed.current["arrowright"]) moveVec.add(right);

          if (moveVec.lengthSq() > 0) {
            const moveSpeed = 16.0 * dt; // Unreal Engine fly speed
            moveVec.normalize().multiplyScalar(moveSpeed);
            if (activeNodeId) {
              // Break focus if user flies away
              useExperienceStore.getState().setActiveNodeId(null);
            }
            targetPos.current.add(moveVec);
          }

          if (activeNodeId) {
            // Drag-orbiting around a focused event node
            const activeNode = nodes.find(n => n.id === activeNodeId);
            if (activeNode) {
              const nodePos = new THREE.Vector3().fromArray(activeNode.position);
              
              // Orbit calculations based on drag yaw/pitch rotation angles
              const radius = 4.2;
              const ox = Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current) * radius;
              const oy = Math.sin(cameraPitch.current) * radius;
              const oz = Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current) * radius;

              targetPos.current.set(nodePos.x + ox, nodePos.y + oy, nodePos.z + oz);
              targetLook.current.copy(nodePos);
            }
          } else {
            // Free flight: camera looks in the direction of drag rotation
            const dir = new THREE.Vector3(
              Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current),
              Math.sin(cameraPitch.current),
              -Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current)
            );
            targetLook.current.copy(targetPos.current).add(dir);

            // Timeline scrubbing controls override free flight look targets
            const timelineScrubbing = useExperienceStore.getState().timelineScrubbing;
            const timelineYear = useExperienceStore.getState().timelineYear;

            if (timelineScrubbing) {
              const getNumericYear = (nodeId: string): number => {
                switch (nodeId) {
                  case "agricultural_revolution": return -3000;
                  case "rise_of_cities": return -2500;
                  case "writing_system": return -2000;
                  case "code_of_hammurabi": return -1750;
                  case "democratic_foundation": return -508;
                  case "printing_press": return 1440;
                  case "scientific_revolution": return 1543;
                  case "enlightenment": return 1700;
                  case "industrial_revolution": return 1760;
                  case "digital_revolution": return 1969;
                  case "artificial_intelligence": return 2026;
                  default: return 2026;
                }
              };

              const activeNodes = nodes.filter(n => timelineYear >= getNumericYear(n.id));
              const activeCenter = new THREE.Vector3();
              if (activeNodes.length > 0) {
                activeNodes.forEach(n => activeCenter.add(new THREE.Vector3().fromArray(n.position)));
                activeCenter.divideScalar(activeNodes.length);
              } else {
                activeCenter.set(0, 0, 0);
              }

              const scrubOffset = new THREE.Vector3(1.2, 4.2, 13.5);
              targetPos.current.copy(activeCenter).add(scrubOffset);
              targetLook.current.copy(activeCenter);
            } else {
              // Idle slow orbital drift when user is inactive
              const isIdle = useExperienceStore.getState().isIdle;
              if (isIdle) {
                const orbitAngle = time * 0.04;
                targetPos.current.x += Math.sin(orbitAngle) * 0.04 * dt;
                targetPos.current.z += Math.cos(orbitAngle) * 0.04 * dt;
              }
            }
          }
        }
    }
  }

    // 2. APPLY BREATHING MOTION AND CURSOR ATTRACTION
    finalTargetPos.current.copy(targetPos.current);
    finalTargetLook.current.copy(targetLook.current);

    if (currentState === "intro" || currentState === "explore" || currentState === "timeline") {
      // Slow, organic breathing motion (Lissajous path in zero-g)
      const breathX = Math.sin(breathPhase.current.x) * 0.12 + Math.cos(breathPhase.current.x * 0.31) * 0.06;
      const breathY = Math.cos(breathPhase.current.y) * 0.08 + Math.sin(breathPhase.current.y * 0.32) * 0.04;
      const breathZ = Math.sin(breathPhase.current.z) * 0.08;

      // Handheld micro-shake (extremely subtle muscle tremor / handheld imperfection)
      const shakeX = Math.sin(shakePhase.current.x) * 0.006 + Math.cos(shakePhase.current.x * 1.56) * 0.003;
      const shakeY = Math.cos(shakePhase.current.y) * 0.005 + Math.sin(shakePhase.current.y * 1.61) * 0.004;
      const shakeZ = Math.sin(shakePhase.current.z) * 0.003;

      finalTargetPos.current.x += breathX + shakeX;
      finalTargetPos.current.y += breathY + shakeY;
      finalTargetPos.current.z += breathZ + shakeZ;

      // Cursor attraction: pull look-at target towards pointer position
      const pullStrengthX = currentState === "intro" ? 0.45 : 0.25;
      const pullStrengthY = currentState === "intro" ? 0.35 : 0.2;
      
      finalTargetLook.current.x += state.pointer.x * pullStrengthX;
      finalTargetLook.current.y += state.pointer.y * pullStrengthY;
    }

    // 3. SEMI-IMPLICIT EULER SPRING PHYSICS (Momentum & Acceleration)
    const isInitialBlast = currentState === "loading" && time >= 10.3 && time < 10.7;
    const stiffness = isInitialBlast ? 45.0 : 7.0;
    const damping = isInitialBlast ? 9.0 : 3.6;

    // A. Position spring update
    tempAcc.current.subVectors(finalTargetPos.current, camera.position).multiplyScalar(stiffness);
    posVelocity.current.addScaledVector(tempAcc.current, dt);
    posVelocity.current.multiplyScalar(Math.max(0, 1.0 - damping * dt));
    camera.position.addScaledVector(posVelocity.current, dt);

    // B. LookAt spring update
    const lookStiffness = isInitialBlast ? 45.0 : 8.5;
    const lookDamping = isInitialBlast ? 10.0 : 4.2;

    tempAcc.current.subVectors(finalTargetLook.current, currentLook.current).multiplyScalar(lookStiffness);
    lookVelocity.current.addScaledVector(tempAcc.current, dt);
    lookVelocity.current.multiplyScalar(Math.max(0, 1.0 - lookDamping * dt));
    currentLook.current.addScaledVector(lookVelocity.current, dt);

    // 4. FIELD OF VIEW TRANSITIONS (Telephoto compress focus & velocity stretch)
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCamera = camera as THREE.PerspectiveCamera;
      const targetFov = activeNodeId ? 32.0 : 48.0;
      const speed = posVelocity.current.length();
      const velocityStretch = Math.min(15.0, speed * 0.6); // warp stretch
      pCamera.fov = THREE.MathUtils.lerp(pCamera.fov, targetFov + velocityStretch, 3.5 * dt);
      pCamera.updateProjectionMatrix();
    }

    // 5. CAMERA TILT (Banking)
    const bankFactor = currentState === "intro" ? 0.08 : 0.04;
    const bankAngle = -state.pointer.x * bankFactor - posVelocity.current.x * 0.015;
    camera.up.set(Math.sin(bankAngle), Math.cos(bankAngle), 0.0).normalize();

    // Final gaze lock
    camera.lookAt(currentLook.current);
  });

  return null;
};
