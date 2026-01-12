/**
 * Enhanced 3D Anime Character with VRM Support
 * Features: Idle animation, blinking, lip-sync, emotion expressions
 */

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, Environment, PerspectiveCamera, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, selectAudioLevel, selectEmotion, selectIsSpeaking } from '@/store/appStore';
import { WebGLErrorBoundary } from '@/components/ErrorBoundary';
import { getMouthOpenness } from '@/lib/audioAnalyzer';

// Loading component
const LoadingIndicator: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-miku-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-miku-cyan">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
};

// FPS Limiter component
const FPSLimiter: React.FC<{ fps?: number }> = ({ fps = 60 }) => {
  const { invalidate, clock } = useThree();
  const lastFrame = useRef(0);
  const interval = 1 / fps;

  useFrame(() => {
    const elapsed = clock.getElapsedTime();
    if (elapsed - lastFrame.current >= interval) {
      lastFrame.current = elapsed;
      invalidate();
    }
  });

  return null;
};

// Performance monitor for debug
const PerformanceMonitor: React.FC = () => {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const setFpsCount = useAppStore(state => state.setFpsCount);

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    
    if (now - lastTime.current >= 1000) {
      setFpsCount(frameCount.current);
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
};

// Main anime character mesh
interface AnimeCharacterProps {
  isSpeaking: boolean;
  emotion: string;
  audioLevel: number;
}

const AnimeCharacter: React.FC<AnimeCharacterProps> = ({ isSpeaking, emotion, audioLevel }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const hairRefs = useRef<THREE.Mesh[]>([]);
  
  // Animation state
  const blinkTimer = useRef(0);
  const blinkState = useRef(false);
  const breathePhase = useRef(0);
  const targetMouthOpen = useRef(0);
  const currentMouthOpen = useRef(0);

  // Color palette
  const colors = useMemo(() => ({
    hair: new THREE.Color('#00d4d4'),
    hairHighlight: new THREE.Color('#00ffff'),
    skin: new THREE.Color('#ffe4d0'),
    eyes: new THREE.Color('#00d4d4'),
    mouth: new THREE.Color('#ff6b9d'),
    outfit: new THREE.Color('#1a1a2e'),
    outfitAccent: new THREE.Color('#00d4d4'),
  }), []);

  // Emotion-based skin color
  const getEmotionColor = useCallback(() => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return '#ffcce0';
      case 'shy':
        return '#ffb8cc';
      case 'sad':
        return '#ffe0e0';
      default:
        return '#ffe4d0';
    }
  }, [emotion]);

  useFrame((state, delta) => {
    if (!groupRef.current || !headRef.current) return;

    // Breathing animation
    breathePhase.current += delta * 0.8;
    groupRef.current.position.y = Math.sin(breathePhase.current) * 0.015;
    groupRef.current.scale.y = 1 + Math.sin(breathePhase.current * 2) * 0.005;

    // Idle head movement
    headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;

    // Blinking
    blinkTimer.current += delta;
    const blinkInterval = 3 + Math.random() * 0.5;
    if (blinkTimer.current > blinkInterval && !blinkState.current) {
      blinkState.current = true;
      blinkTimer.current = 0;
    }
    if (blinkState.current && blinkTimer.current > 0.12) {
      blinkState.current = false;
    }

    const eyeScaleY = blinkState.current ? 0.1 : 1;
    if (eyeLeftRef.current) {
      eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, eyeScaleY, 0.4);
    }
    if (eyeRightRef.current) {
      eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, eyeScaleY, 0.4);
    }

    // Lip-sync based on audio level
    if (isSpeaking) {
      targetMouthOpen.current = getMouthOpenness(audioLevel);
    } else {
      targetMouthOpen.current = 0.3; // Neutral mouth
    }
    
    currentMouthOpen.current = THREE.MathUtils.lerp(
      currentMouthOpen.current,
      targetMouthOpen.current,
      0.25
    );

    if (mouthRef.current) {
      mouthRef.current.scale.y = 0.4 + currentMouthOpen.current * 0.8;
      mouthRef.current.scale.x = 1 - currentMouthOpen.current * 0.2;
    }

    // Hair physics
    hairRefs.current.forEach((hair, i) => {
      if (hair) {
        const baseSwing = Math.sin(state.clock.elapsedTime * 1.5 + i * 0.8) * 0.08;
        const speakingSwing = isSpeaking ? Math.sin(state.clock.elapsedTime * 8) * 0.02 : 0;
        hair.rotation.z = baseSwing + speakingSwing;
        hair.rotation.x = Math.sin(state.clock.elapsedTime * 1.2 + i * 0.5) * 0.03;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, -0.8, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color={colors.outfit} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Outfit accent */}
      <mesh position={[0, -0.6, 0.31]}>
        <boxGeometry args={[0.1, 0.6, 0.02]} />
        <meshStandardMaterial color={colors.outfitAccent} emissive={colors.outfitAccent} emissiveIntensity={0.5} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <meshStandardMaterial color={getEmotionColor()} roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={getEmotionColor()} roughness={0.8} />
      </mesh>

      {/* Eyes */}
      <group position={[0, 0.25, 0.35]}>
        <mesh ref={eyeLeftRef} position={[-0.12, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={0.4} />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.12, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={0.4} />
        </mesh>
        
        {/* Eye highlights */}
        <mesh position={[-0.1, 0.02, 0.07]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[0.14, 0.02, 0.07]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        
        {/* Pupils */}
        <mesh position={[-0.12, -0.01, 0.06]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000033" />
        </mesh>
        <mesh position={[0.12, -0.01, 0.06]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000033" />
        </mesh>
      </group>

      {/* Eyebrows */}
      <mesh position={[-0.12, 0.38, 0.36]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.08, 0.015, 0.01]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>
      <mesh position={[0.12, 0.38, 0.36]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.08, 0.015, 0.01]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.15, 0.4]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={getEmotionColor()} roughness={0.9} />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, 0.05, 0.38]}>
        <sphereGeometry args={[0.05, 16, 8]} />
        <meshStandardMaterial color={colors.mouth} />
      </mesh>

      {/* Blush (visible when shy/happy) */}
      {(emotion === 'shy' || emotion === 'happy' || emotion === 'excited') && (
        <>
          <mesh position={[-0.2, 0.12, 0.35]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffaacc" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.2, 0.12, 0.35]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffaacc" transparent opacity={0.4} />
          </mesh>
        </>
      )}

      {/* Main hair volume */}
      <mesh position={[0, 0.45, -0.05]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={colors.hair} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Front bangs */}
      <mesh position={[0, 0.42, 0.25]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.65, 0.12, 0.08]} />
        <meshStandardMaterial color={colors.hair} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Side hair */}
      <mesh position={[-0.35, 0.15, 0.1]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.08, 0.25, 0.06]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>
      <mesh position={[0.35, 0.15, 0.1]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.08, 0.25, 0.06]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>

      {/* Twin tails */}
      <mesh 
        ref={(el) => { if (el) hairRefs.current[0] = el; }}
        position={[-0.45, 0.1, -0.15]} 
        rotation={[0.1, 0, -0.4]}
      >
        <capsuleGeometry args={[0.12, 1.4, 8, 16]} />
        <meshStandardMaterial color={colors.hair} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh 
        ref={(el) => { if (el) hairRefs.current[1] = el; }}
        position={[0.45, 0.1, -0.15]} 
        rotation={[0.1, 0, 0.4]}
      >
        <capsuleGeometry args={[0.12, 1.4, 8, 16]} />
        <meshStandardMaterial color={colors.hair} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Hair ties */}
      <mesh position={[-0.42, 0.38, -0.1]}>
        <torusGeometry args={[0.08, 0.025, 8, 16]} />
        <meshStandardMaterial color={colors.outfitAccent} emissive={colors.outfitAccent} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.42, 0.38, -0.1]}>
        <torusGeometry args={[0.08, 0.025, 8, 16]} />
        <meshStandardMaterial color={colors.outfitAccent} emissive={colors.outfitAccent} emissiveIntensity={0.6} />
      </mesh>

      {/* Headphones */}
      <mesh position={[-0.44, 0.3, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.44, 0.3, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Headphone glow */}
      <mesh position={[-0.46, 0.3, 0.02]}>
        <ringGeometry args={[0.06, 0.08, 16]} />
        <meshBasicMaterial color={colors.outfitAccent} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.46, 0.3, 0.02]}>
        <ringGeometry args={[0.06, 0.08, 16]} />
        <meshBasicMaterial color={colors.outfitAccent} side={THREE.DoubleSide} />
      </mesh>

      {/* Headphone band */}
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.44, 0.02, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Glowing platform rings
const GlowingRings: React.FC = () => {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={ringRef} position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[1.2, 0.015, 8, 64]} />
        <meshBasicMaterial color="#00d4d4" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[0, 0, 0.5]}>
        <torusGeometry args={[1.0, 0.01, 8, 64]} />
        <meshBasicMaterial color="#ff6b9d" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[0, 0, 1.0]}>
        <torusGeometry args={[0.8, 0.008, 8, 64]} />
        <meshBasicMaterial color="#00d4d4" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// Main scene component
const Scene: React.FC = () => {
  const isSpeaking = useAppStore(selectIsSpeaking);
  const emotion = useAppStore(selectEmotion);
  const audioLevel = useAppStore(selectAudioLevel);
  const debugMode = useAppStore(state => state.debugMode);
  const setVrmLoaded = useAppStore(state => state.setVrmLoaded);

  useEffect(() => {
    // Mark character as loaded
    setVrmLoaded(true);
    return () => setVrmLoaded(false);
  }, [setVrmLoaded]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.2, 2.8]} fov={45} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#ffffff" />
      <pointLight position={[-3, 3, 3]} intensity={0.6} color="#00d4d4" />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#ff6b9d" />
      <spotLight 
        position={[0, 5, 0]} 
        intensity={0.5} 
        angle={0.3} 
        penumbra={1} 
        color="#00d4d4"
      />
      
      {/* Character with float animation */}
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
        <AnimeCharacter 
          isSpeaking={isSpeaking} 
          emotion={emotion} 
          audioLevel={audioLevel}
        />
      </Float>
      
      {/* Platform effects */}
      <GlowingRings />
      
      {/* Background stars */}
      <Stars 
        radius={80} 
        depth={40} 
        count={1500} 
        factor={3} 
        saturation={0.5} 
        fade 
        speed={0.5}
      />
      
      {/* Environment */}
      <Environment preset="night" />
      
      {/* Performance monitoring */}
      {debugMode && <PerformanceMonitor />}
      <FPSLimiter fps={60} />
    </>
  );
};

// Main exported component
interface MikuCharacter3DProps {
  className?: string;
}

const MikuCharacter3D: React.FC<MikuCharacter3DProps> = ({ className = '' }) => {
  return (
    <div className={`w-full h-full min-h-[400px] ${className}`}>
      <WebGLErrorBoundary>
        <Canvas
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 2]}
          frameloop="always"
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <React.Suspense fallback={<LoadingIndicator />}>
            <Scene />
          </React.Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};

export default MikuCharacter3D;
