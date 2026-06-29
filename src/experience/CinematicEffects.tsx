import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { useExperienceStore } from "../store/useExperienceStore";

export const CinematicEffects: React.FC = () => {
  const { gl, scene, camera, size } = useThree();
  const cinematicEffects = useExperienceStore((state) => state.cinematicEffects);

  const composer = useMemo(() => {
    const comp = new EffectComposer(gl);
    comp.addPass(new RenderPass(scene, camera));

    // Subtle Bloom for glowing halos and cause-and-effect waves
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.35,  // strength
      0.28,  // radius
      0.80   // threshold
    );
    comp.addPass(bloomPass);

    // Vignette & Chromatic Aberration Custom Shader Pass
    const customShader = {
      uniforms: {
        tDiffuse: { value: null },
        uChromaticOffset: { value: 0.0018 },
        uVignetteDarkness: { value: 0.98 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uChromaticOffset;
        uniform float uVignetteDarkness;
        varying vec2 vUv;

        void main() {
          // Chromatic aberration (rgb channel separation on edges)
          vec4 col;
          col.r = texture2D(tDiffuse, vUv + vec2(uChromaticOffset, 0.0)).r;
          col.g = texture2D(tDiffuse, vUv).g;
          col.b = texture2D(tDiffuse, vUv - vec2(uChromaticOffset, 0.0)).b;
          col.a = texture2D(tDiffuse, vUv).a;

          // Vignette (dim edges for camera depth focus)
          vec2 uv = vUv - 0.5;
          float len = length(uv);
          float vignette = smoothstep(0.85, 0.42, len * uVignetteDarkness);
          col.rgb *= vignette;

          gl_FragColor = col;
        }
      `
    };
    
    const shaderPass = new ShaderPass(customShader);
    comp.addPass(shaderPass);

    return comp;
  }, [gl, scene, camera, size]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  useFrame(() => {
    if (cinematicEffects) {
      gl.autoClear = false;
      composer.render();
    }
  }, 1); // priority 1 overrides standard canvas rendering loop when active

  return null;
};
