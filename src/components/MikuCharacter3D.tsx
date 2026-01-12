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
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-miku-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-miku-cyan font-bold">{Math.round(progress)}%</p>
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
      default: return '#ffe4d0';
    }
  }, [emotion]);

  useFrame((state, delta) => {
    if (!groupRef.current || !headRef.current) return;

    // Breathing
    breathePhase.current += delta * 0.8;
    groupRef.current.position.y = Math.sin(breathePhase.current) * 0.02;

    // Head movement
    const headTilt = (emotion === 'funny' || emotion === 'curious') ? 0.2 : 0;
    headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, Math.sin(state.clock.elapsedTime * 0.3) * 0.02 + headTilt, 0.1);

    // Blinking
    blinkTimer.current += delta;
    if (blinkTimer.current > 3 + Math.random() && !blinkState.current) {
      blinkState.current = true;
      blinkTimer.current = 0;
    }
    if (blinkState.current && blinkTimer.current > 0.1) {
      blinkState.current = false;
    }
    const eyeScaleY = blinkState.current ? 0.05 : (emotion === 'annoyed' ? 0.7 : 1);
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, eyeScaleY, 0.3);
    if (eyeRightRef.current) eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, eyeScaleY, 0.3);

    // Lip-sync
    targetMouthOpen.current = isSpeaking ? getMouthOpenness(audioLevel) : 0.1;
    currentMouthOpen.current = THREE.MathUtils.lerp(currentMouthOpen.current, targetMouthOpen.current, 0.3);
    if (mouthRef.current) mouthRef.current.scale.y = 0.2 + currentMouthOpen.current * 1.5;

    // Twin tail physics
    hairRefs.current.forEach((hair, i) => {
      if (hair) {
        const bounce = (emotion === 'happy' || emotion === 'excited') ? 0.15 : 0.05;
        hair.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + i) * bounce;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.8, 0]}><capsuleGeometry args={[0.3, 0.8, 8, 16]} /><meshStandardMaterial color={colors.outfit} /></mesh>
      <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.08, 0.1, 0.15, 16]} /><meshStandardMaterial color={getEmotionColor()} /></mesh>
      <mesh ref={headRef} position={[0, 0.2, 0]}><sphereGeometry args={[0.4, 32, 32]} /><meshStandardMaterial color={getEmotionColor()} /></mesh>
      <group position={[0, 0.25, 0.35]}>
        <mesh ref={eyeLeftRef} position={[-0.12, 0, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color={colors.eyes} /></mesh>
        <mesh ref={eyeRightRef} position={[0.12, 0, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color={colors.eyes} /></mesh>
      </group>
      <mesh ref={mouthRef} position={[0, 0.05, 0.38]}><sphereGeometry args={[0.05, 16, 8]} /><meshStandardMaterial color={colors.mouth} /></mesh>
      {(emotion === 'shy' || emotion === 'happy') && (
        <group position={[0, 0.12, 0.35]}>
          <mesh position={[-0.2, 0, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ffaacc" transparent opacity={0.5} /></mesh>
          <mesh position={[0.2, 0, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ffaacc" transparent opacity={0.5} /></mesh>
        </group>
      )}
      <mesh position={[0, 0.45, -0.05]}><sphereGeometry args={[0.48, 32, 32]} /><meshStandardMaterial color={colors.hair} /></mesh>
      <mesh ref={(el) => { if (el) hairRefs.current[0] = el; }} position={[-0.45, 0.1, -0.15]} rotation={[0.1, 0, -0.4]}><capsuleGeometry args={[0.12, 1.4, 8, 16]} /><meshStandardMaterial color={colors.hair} /></mesh>
      <mesh ref={(el) => { if (el) hairRefs.current[1] = el; }} position={[0.45, 0.1, -0.15]} rotation={[0.1, 0, 0.4]}><capsuleGeometry args={[0.12, 1.4, 8, 16]} /><meshStandardMaterial color={colors.hair} /></mesh>
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
      <PerspectiveCamera makeDefault position={[0, 0.2, 2.5]} fov={45} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <AnimeCharacter isSpeaking={isSpeaking} emotion={emotion} audioLevel={audioLevel} />
      </Float>
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="city" />
    </>
  );
};

const MikuCharacter3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full h-full min-h-[400px] ${className}`}>
      <WebGLErrorBoundary>
        <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <React.Suspense fallback={<LoadingIndicator />}><Scene /></React.Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};

export default MikuCharacter3D;
