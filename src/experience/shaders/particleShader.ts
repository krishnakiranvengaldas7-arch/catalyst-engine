export const particleVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  
  attribute float aScale;
  attribute vec3 aRandoms;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec3 pos = position;
    
    // Scale the drift down for giant nebula clouds to keep them stable
    float driftScale = aScale > 3.0 ? 0.1 : aScale;
    pos.x += sin(uTime * 0.15 + aRandoms.x * 100.0) * 0.4 * driftScale;
    pos.y += cos(uTime * 0.11 + aRandoms.y * 100.0) * 0.4 * driftScale;
    pos.z += sin(uTime * 0.08 + aRandoms.z * 100.0) * 0.4 * driftScale;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation: scale by distance
    gl_PointSize = uSize * aScale * uPixelRatio * (300.0 / -mvPosition.z);
    
    // Pass beautiful cosmic color palette to fragment shader
    if (aRandoms.x < 0.55) {
      vColor = vec3(0.95, 0.80, 0.50); // Deep Amber Gold
    } else if (aRandoms.x < 0.78) {
      vColor = vec3(0.35, 0.55, 1.0);  // Cosmic Sapphire Blue
    } else {
      vColor = vec3(0.65, 0.35, 1.0);  // Astral Purple
    }
    
    // Fade out if too close to camera
    float edgeAlpha = smoothstep(-25.0, -1.0, mvPosition.z);
    
    // Giant particles represent nebula gas clouds: make them extremely soft and faint
    if (aScale > 3.0) {
      vAlpha = edgeAlpha * 0.055; 
    } else {
      vAlpha = edgeAlpha;
    }
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    
    // Soft radial glow profile
    float strength = 0.05 / dist;
    strength = pow(strength, 1.4);
    
    float alpha = smoothstep(0.5, 0.08, dist) * strength;
    
    gl_FragColor = vec4(vColor, alpha * 0.55 * vAlpha);
  }
`;
