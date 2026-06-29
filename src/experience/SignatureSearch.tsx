import React, { useEffect, useRef } from "react";
import { useExperienceStore } from "../store/useExperienceStore";
import { causalityAudio } from "../utils/sound";

export const SignatureSearch: React.FC = () => {
  const signatureSearchPhase = useExperienceStore((state) => state.signatureSearchPhase);
  const setSignatureSearchPhase = useExperienceStore((state) => state.setSignatureSearchPhase);
  const signatureSearchTargetId = useExperienceStore((state) => state.signatureSearchTargetId);
  const setActiveNodeId = useExperienceStore((state) => state.setActiveNodeId);
  const startRipple = useExperienceStore((state) => state.startRipple);
  
  const phaseTimer = useRef<number | null>(null);

  useEffect(() => {
    if (signatureSearchPhase === 'freeze') {
      // Phase 1: Freeze and Silence
      useExperienceStore.setState({ isPaused: true });
      causalityAudio.stopAll();
      
      phaseTimer.current = setTimeout(() => {
        setSignatureSearchPhase('glow');
      }, 1500);
    } else if (signatureSearchPhase === 'glow') {
      // Phase 2: Searched event begins glowing
      if (signatureSearchTargetId) {
        setActiveNodeId(signatureSearchTargetId);
      }
      
      phaseTimer.current = setTimeout(() => {
        setSignatureSearchPhase('unfold');
      }, 3000);
    } else if (signatureSearchPhase === 'unfold') {
      // Phase 3: Reality unfolds
      // Unpause the engine
      useExperienceStore.setState({ isPaused: false });
      
      // Dramatic audio buildup
      causalityAudio.playSignatureBuildUp();
      
      // Start supercharged ripple
      if (signatureSearchTargetId) {
        startRipple(signatureSearchTargetId);
      }

      phaseTimer.current = setTimeout(() => {
        setSignatureSearchPhase('finish');
      }, 7000);
    } else if (signatureSearchPhase === 'finish') {
      // Phase 4: Cinematic ending text
      causalityAudio.restoreVolume();
    } else if (signatureSearchPhase === 'none') {
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    }

    return () => {
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    };
  }, [signatureSearchPhase, setSignatureSearchPhase, signatureSearchTargetId, setActiveNodeId, startRipple]);

  return null;
};
