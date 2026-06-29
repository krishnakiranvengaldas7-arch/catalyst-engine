import { useEffect } from "react";
import * as THREE from "three";
import { useExperienceStore } from "../store/useExperienceStore";

export const useAssetLoader = () => {
  const setLoadingProgress = useExperienceStore(
    (state) => state.setLoadingProgress
  );
  const setLoaded = useExperienceStore((state) => state.setLoaded);

  useEffect(() => {
    // Hook into Three.js global DefaultLoadingManager
    THREE.DefaultLoadingManager.onStart = (_url, itemsLoaded, itemsTotal) => {
      setLoaded(false);
      setLoadingProgress((itemsLoaded / itemsTotal) * 100);
    };

    THREE.DefaultLoadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      setLoadingProgress(progress);
    };

    THREE.DefaultLoadingManager.onLoad = () => {
      setLoadingProgress(100);
      setLoaded(true);
    };

    THREE.DefaultLoadingManager.onError = (url) => {
      console.error(`Error loading asset: ${url}`);
    };

    return () => {
      // Clean up handlers by resetting to no-ops
      THREE.DefaultLoadingManager.onStart = () => {};
      THREE.DefaultLoadingManager.onProgress = () => {};
      THREE.DefaultLoadingManager.onLoad = () => {};
      THREE.DefaultLoadingManager.onError = () => {};
    };
  }, [setLoadingProgress, setLoaded]);
};
