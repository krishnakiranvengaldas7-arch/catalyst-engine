import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneManager } from "./SceneManager";
import { useAssetLoader } from "../hooks/useAssetLoader";

export const Pipeline: React.FC = () => {
  // Initialise our global asset loading tracker
  useAssetLoader();

  return (
    <div className="absolute inset-0 w-full h-full bg-black z-0 overflow-hidden">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 55,
          near: 0.1,
          far: 100,
        }}
        onCreated={({ gl }) => {
          // Set premium rendering exposure
          gl.toneMappingExposure = 1.1;
        }}
      >
        <Suspense fallback={null}>
          <SceneManager />
        </Suspense>
      </Canvas>
    </div>
  );
};
