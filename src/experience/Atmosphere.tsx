import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- 1. NEBULA PROCEDURAL SHADER ---
const nebulaVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }
  
  void main() {
    vec2 uv = vUv * 2.0 - vec2(1.0);
    float n = fbm(uv * 1.5 + vec2(uTime * 0.012, uTime * 0.009));
    
    // Elegant color blending: deep indigo and warm dark amber
    vec3 finalColor = mix(uColorA, uColorB, n);
    
    // Soft radial falloff for seamless background integration
    float dist = length(vUv - vec2(0.5));
    float alpha = smoothstep(0.5, 0.15, dist) * n * 0.12; // Extremely faint, 12% max
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- 2. GENTLE COSMIC LIGHT RAYS SHADER ---
const rayVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rayFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  
  void main() {
    // Soft scrolling light shafts
    float ray1 = sin(vUv.x * 8.0 + uTime * 0.12) * 0.5 + 0.5;
    float ray2 = cos(vUv.x * 5.0 - uTime * 0.06) * 0.5 + 0.5;
    float rays = (ray1 * ray2 * 0.5) + (ray1 * 0.5);
    
    // Soft edge vignettes
    float verticalFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
    float horizontalFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    
    float alpha = rays * verticalFade * horizontalFade * 0.038; // 3.8% max opacity for absolute elegance
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export const Atmosphere: React.FC = () => {
  // Refs for 3D parallax dust layers
  const closeDustRef = useRef<THREE.Points | null>(null);
  const mediumDustRef = useRef<THREE.Points | null>(null);
  const farDustRef = useRef<THREE.Points | null>(null);
  
  // Refs for custom shader materials
  const nebulaMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const raysMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  // --- A. DISTANT INFINITE STARFIELD (2500 faint micro-stars) ---
  const distantStars = useMemo(() => {
    const count = 2500;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 110 + Math.random() * 80; // Deep background shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      // Distant stars are extremely faint, mostly white and light blue
      const b = 0.5 + Math.random() * 0.5;
      cols[i * 3 + 0] = b * 0.9;
      cols[i * 3 + 1] = b * 0.95;
      cols[i * 3 + 2] = b;
    }
    return { pos, cols };
  }, []);

  // --- B. LAYERED PARALLAX DUST GENERATION ---
  const dustLayers = useMemo(() => {
    const generateDust = (count: number, range: number) => {
      const pos = new Float32Array(count * 3);
      const scl = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 0] = (Math.random() - 0.5) * range;
        pos[i * 3 + 1] = (Math.random() - 0.5) * range;
        pos[i * 3 + 2] = (Math.random() - 0.5) * range - 2;
        scl[i] = 0.2 + Math.random() * 0.8;
      }
      return { pos, scl };
    };

    return {
      close: generateDust(150, 10),   // 150 particles close by
      medium: generateDust(300, 25),  // 300 medium distance
      far: generateDust(500, 50),     // 500 far distance
    };
  }, []);

  // Memos for shader uniforms
  const nebulaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color("#1e1b4b") }, // Deep cosmic indigo
    uColorB: { value: new THREE.Color("#581c87") }, // Warm cosmic purple/amber
  }), []);

  const raysUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color("#6366f1") }, // Soft starlight blue-indigo
  }), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const camera = state.camera;

    // 1. Advance shader times
    if (nebulaMaterialRef.current) {
      nebulaMaterialRef.current.uniforms.uTime.value = time;
    }
    if (raysMaterialRef.current) {
      raysMaterialRef.current.uniforms.uTime.value = time;
    }

    // 2. Apply physically-believable 3D Parallax Offsets
    // As the camera moves, nearby dust offsets quickly, far dust barely shifts
    if (closeDustRef.current) {
      closeDustRef.current.position.set(
        -camera.position.x * 0.45,
        -camera.position.y * 0.45,
        -camera.position.z * 0.45
      );
    }
    if (mediumDustRef.current) {
      mediumDustRef.current.position.set(
        -camera.position.x * 0.18,
        -camera.position.y * 0.18,
        -camera.position.z * 0.18
      );
    }
    if (farDustRef.current) {
      farDustRef.current.position.set(
        -camera.position.x * 0.04,
        -camera.position.y * 0.04,
        -camera.position.z * 0.04
      );
    }
  });

  return (
    <group>
      {/* 1. Deep Infinite Background Starfield */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[distantStars.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[distantStars.cols, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          vertexColors
          transparent
          opacity={0.16} // Extremely faint background layer
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      {/* 2. Layered Parallax Dust Particles */}
      {/* A. Close Parallax Dust (moves quickly, larger sizes) */}
      <points ref={closeDustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustLayers.close.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09 * pixelRatio}
          color="#d4af37" // Warm gold
          transparent
          opacity={0.3}
          depthWrite={false}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* B. Medium Parallax Dust (moderate movement, medium sizes) */}
      <points ref={mediumDustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustLayers.medium.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06 * pixelRatio}
          color="#a78bfa" // Soft lavender/indigo dust
          transparent
          opacity={0.24}
          depthWrite={false}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* C. Far Parallax Dust (slow movement, tiny sizes) */}
      <points ref={farDustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustLayers.far.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.045 * pixelRatio}
          color="#60a5fa" // Faint ice blue dust
          transparent
          opacity={0.18}
          depthWrite={false}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3. Volumetric Procedural Nebulae (Drifting large gas clouds) */}
      {/* Background Plate A */}
      <mesh position={[2, -1, -25]} rotation={[0, 0, 0.4]}>
        <planeGeometry args={[70, 50]} />
        <shaderMaterial
          ref={nebulaMaterialRef}
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          uniforms={nebulaUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Background Plate B (overlapping to create 3D density variations) */}
      <mesh position={[-4, 3, -28]} rotation={[0, 0, -0.6]}>
        <planeGeometry args={[80, 60]} />
        <shaderMaterial
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          uniforms={{
            uTime: nebulaUniforms.uTime,
            uColorA: { value: new THREE.Color("#4c1d95") }, // Dark violet
            uColorB: { value: new THREE.Color("#78350f") }, // Soft amber/bronze
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Gentle Moving Cosmic Light Shafts */}
      <mesh position={[0, 0, -22]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[65, 45]} />
        <shaderMaterial
          ref={raysMaterialRef}
          vertexShader={rayVertexShader}
          fragmentShader={rayFragmentShader}
          uniforms={raysUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
