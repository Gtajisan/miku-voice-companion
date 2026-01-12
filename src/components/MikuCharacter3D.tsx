import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, Environment, PerspectiveCamera, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, selectAudioLevel, selectEmotion, selectIsSpeaking } from '@/store/appStore';
import { WebGLErrorBoundary } from '@/components/ErrorBoundary';
import { getMouthOpenness } from '@/lib/audioAnalyzer';

const LoadingIndicator: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-center p-6 bg-black/60 backdrop-blur-xl rounded-3xl border border-miku-cyan/40 shadow-[0_0_30px_rgba(0,212,212,0.3)]">
        <div className="w-16 h-16 border-4 border-miku-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg text-miku-cyan font-black tracking-widest uppercase">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
};

const AnimeCharacter: React.FC<{ isSpeaking: boolean; emotion: string; audioLevel: number }> = ({ isSpeaking, emotion, audioLevel }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const hairRefs = useRef<THREE.Mesh[]>([]);
  
  const blinkTimer = useRef(0);
  const blinkState = useRef(false);
  const breathePhase = useRef(0);
  const targetMouthOpen = useRef(0);
  const currentMouthOpen = useRef(0);

  const colors = useMemo(() => ({
    hair: new THREE.Color('#00d4d4'),
    skin: new THREE.Color('#ffe4d0'),
    eyes: new THREE.Color('#00d4d4'),
    mouth: new THREE.Color('#ff6b9d'),
    outfit: new THREE.Color('#1a1a2e'),
    outfitAccent: new THREE.Color('#00d4d4'),
  }), []);

  const getEmotionColor = useCallback(() => {
    switch (emotion) {
      case 'happy': case 'excited': return '#ffcce0';
      case 'shy': return '#ffb8cc';
      case 'annoyed': return '#ff9999';
      case 'sad': return '#e0e0ff';
      default: return '#ffe4d0';
    }
  }, [emotion]);

  useFrame((state, delta) => {
    if (!groupRef.current || !headRef.current) return;

    // Breathing - Fluid & Organic
    breathePhase.current += delta * 1.5;
    groupRef.current.position.y = Math.sin(breathePhase.current) * 0.03;
    groupRef.current.scale.x = 1 + Math.sin(breathePhase.current * 0.8) * 0.008;

    // Head movement - Emotional feedback
    const headTilt = (emotion === 'funny' || emotion === 'curious') ? Math.sin(state.clock.elapsedTime * 2) * 0.12 + 0.2 : 0;
    const headNod = isSpeaking ? Math.sin(state.clock.elapsedTime * 12) * 0.02 : 0;
    
    headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.04 + headNod;
    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, Math.sin(state.clock.elapsedTime * 0.4) * 0.03 + headTilt, 0.15);

    // Blinking logic
    blinkTimer.current += delta;
    if (blinkTimer.current > 4 + Math.random() * 3 && !blinkState.current) {
      blinkState.current = true;
      blinkTimer.current = 0;
    }
    if (blinkState.current && blinkTimer.current > 0.15) {
      blinkState.current = false;
    }
    
    const eyeScaleY = blinkState.current ? 0.02 : (emotion === 'annoyed' ? 0.65 : 1);
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, eyeScaleY, 0.4);
    if (eyeRightRef.current) eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, eyeScaleY, 0.4);

    // Lip-sync refinement
    targetMouthOpen.current = isSpeaking ? getMouthOpenness(audioLevel) : 0.05;
    currentMouthOpen.current = THREE.MathUtils.lerp(currentMouthOpen.current, targetMouthOpen.current, 0.4);
    if (mouthRef.current) {
        mouthRef.current.scale.y = 0.15 + currentMouthOpen.current * 2.2;
        mouthRef.current.scale.x = 1.1 - currentMouthOpen.current * 0.4;
    }

    // Hair physics - High quality motion
    hairRefs.current.forEach((hair, i) => {
      if (hair) {
        const energy = (emotion === 'happy' || emotion === 'excited') ? 0.25 : 0.1;
        const talkEnergy = isSpeaking ? 0.05 : 0;
        hair.rotation.z = Math.sin(state.clock.elapsedTime * 2 + i) * (energy + talkEnergy);
        hair.rotation.x = Math.cos(state.clock.elapsedTime * 1.5 + i * 0.7) * 0.06;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Improved Character Geometry with smoothing */}
      <mesh position={[0, -0.8, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 16, 32]} />
        <meshStandardMaterial color={colors.outfit} metalness={0.5} roughness={0.4} />
      </mesh>
      
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 32]} />
        <meshStandardMaterial color={getEmotionColor()} roughness={0.7} />
      </mesh>

      <mesh ref={headRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.4, 64, 64]} />
        <meshStandardMaterial color={getEmotionColor()} roughness={0.7} />
      </mesh>

      <group position={[0, 0.25, 0.35]}>
        <mesh ref={eyeLeftRef} position={[-0.12, 0, 0]}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.12, 0, 0]}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={0.6} />
        </mesh>
      </group>

      <mesh ref={mouthRef} position={[0, 0.05, 0.38]}>
        <sphereGeometry args={[0.05, 32, 16]} />
        <meshStandardMaterial color={colors.mouth} />
      </mesh>

      {(emotion === 'shy' || emotion === 'happy' || emotion === 'excited') && (
        <group position={[0, 0.12, 0.35]}>
          <mesh position={[-0.22, 0, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#ff99cc" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.22, 0, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#ff99cc" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      <mesh position={[0, 0.45, -0.05]}>
        <sphereGeometry args={[0.48, 64, 64]} />
        <meshStandardMaterial color={colors.hair} metalness={0.3} roughness={0.4} />
      </mesh>

      <mesh ref={(el) => { if (el) hairRefs.current[0] = el; }} position={[-0.45, 0.1, -0.15]} rotation={[0.1, 0, -0.4]}>
        <capsuleGeometry args={[0.12, 1.4, 16, 32]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>

      <mesh ref={(el) => { if (el) hairRefs.current[1] = el; }} position={[0.45, 0.1, -0.15]} rotation={[0.1, 0, 0.4]}>
        <capsuleGeometry args={[0.12, 1.4, 16, 32]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>
    </group>
  );
};

const Scene: React.FC = () => {
  const isSpeaking = useAppStore(selectIsSpeaking);
  const emotion = useAppStore(selectEmotion);
  const audioLevel = useAppStore(selectAudioLevel);
  const setVrmLoaded = useAppStore(state => state.setVrmLoaded);

  useEffect(() => { setVrmLoaded(true); return () => setVrmLoaded(false); }, [setVrmLoaded]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.2, 2.7]} fov={45} />
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[-5, 5, 5]} intensity={1.5} color="#00ffff" />
      <pointLight position={[0, -2, 4]} intensity={0.8} color="#ff00ff" />
      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.8}>
        <AnimeCharacter isSpeaking={isSpeaking} emotion={emotion} audioLevel={audioLevel} />
      </Float>
      <Stars radius={150} depth={80} count={4000} factor={7} saturation={0.8} fade speed={2} />
      <Environment preset="night" />
    </>
  );
};

const MikuCharacter3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full h-full min-h-[400px] relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-transparent to-black/20 ${className}`}>
      <WebGLErrorBoundary>
        <Canvas 
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }} 
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 45 }}
        >
          <React.Suspense fallback={<LoadingIndicator />}><Scene /></React.Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};

export default MikuCharacter3D;
