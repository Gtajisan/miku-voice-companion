import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface MikuCharacter3DProps {
  isSpeaking: boolean;
  emotion: 'happy' | 'excited' | 'curious' | 'shy' | 'neutral';
}

// Anime-style character placeholder with geometric shapes
const AnimeCharacter: React.FC<{ isSpeaking: boolean; emotion: string }> = ({ isSpeaking, emotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  
  // Hair strands refs
  const hairRefs = useRef<THREE.Mesh[]>([]);
  
  // Blink timer
  const blinkTimer = useRef(0);
  const blinkState = useRef(false);

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

  useFrame((state, delta) => {
    if (!groupRef.current || !headRef.current) return;

    // Gentle floating/breathing animation
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;

    // Head subtle movement
    headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.7) * 0.02;
    headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.01;

    // Blinking logic
    blinkTimer.current += delta;
    if (blinkTimer.current > 3 + Math.random() * 2) {
      blinkState.current = true;
      blinkTimer.current = 0;
    }
    if (blinkState.current && blinkTimer.current > 0.15) {
      blinkState.current = false;
    }

    // Eye scale for blinking
    const eyeScaleY = blinkState.current ? 0.1 : 1;
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, eyeScaleY, 0.3);
    if (eyeRightRef.current) eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, eyeScaleY, 0.3);

    // Mouth animation when speaking
    if (mouthRef.current) {
      const targetScale = isSpeaking ? 0.8 + Math.sin(state.clock.elapsedTime * 15) * 0.3 : 0.6;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScale, 0.2);
    }

    // Hair physics-like movement
    hairRefs.current.forEach((hair, i) => {
      if (hair) {
        hair.rotation.z = Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.1;
      }
    });
  });

  // Emotion-based color modifiers
  const getEmotionColor = () => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return '#ff9ed2';
      case 'shy':
        return '#ffb3c6';
      default:
        return '#ffe4d0';
    }
  };

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, -0.8, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color={colors.outfit} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Outfit accent lines */}
      <mesh position={[0, -0.6, 0.31]}>
        <boxGeometry args={[0.1, 0.6, 0.02]} />
        <meshStandardMaterial color={colors.outfitAccent} emissive={colors.outfitAccent} emissiveIntensity={0.5} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={getEmotionColor()} roughness={0.8} />
      </mesh>

      {/* Eyes */}
      <mesh ref={eyeLeftRef} position={[-0.12, 0.25, 0.35]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={eyeRightRef} position={[0.12, 0.25, 0.35]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={0.3} />
      </mesh>

      {/* Eye highlights */}
      <mesh position={[-0.1, 0.27, 0.42]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0.14, 0.27, 0.42]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, 0.05, 0.38]}>
        <sphereGeometry args={[0.05, 16, 8]} />
        <meshStandardMaterial color={colors.mouth} />
      </mesh>

      {/* Hair - Twin tails style */}
      {/* Main hair volume */}
      <mesh position={[0, 0.45, -0.1]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color={colors.hair} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Front bangs */}
      <mesh position={[0, 0.4, 0.2]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.1]} />
        <meshStandardMaterial color={colors.hair} />
      </mesh>

      {/* Left twin tail */}
      <mesh 
        ref={(el) => { if (el) hairRefs.current[0] = el; }}
        position={[-0.4, 0.1, -0.2]} 
        rotation={[0, 0, -0.3]}
      >
        <capsuleGeometry args={[0.1, 1.2, 8, 16]} />
        <meshStandardMaterial color={colors.hair} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Right twin tail */}
      <mesh 
        ref={(el) => { if (el) hairRefs.current[1] = el; }}
        position={[0.4, 0.1, -0.2]} 
        rotation={[0, 0, 0.3]}
      >
        <capsuleGeometry args={[0.1, 1.2, 8, 16]} />
        <meshStandardMaterial color={colors.hair} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Hair ties */}
      <mesh position={[-0.4, 0.35, -0.15]}>
        <torusGeometry args={[0.08, 0.03, 8, 16]} />
        <meshStandardMaterial color={colors.outfitAccent} emissive={colors.outfitAccent} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.4, 0.35, -0.15]}>
        <torusGeometry args={[0.08, 0.03, 8, 16]} />
        <meshStandardMaterial color={colors.outfitAccent} emissive={colors.outfitAccent} emissiveIntensity={0.5} />
      </mesh>

      {/* Headphones */}
      <mesh position={[-0.42, 0.3, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.42, 0.3, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Headphone band */}
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.42, 0.02, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Glowing rings effect
const GlowingRings: React.FC = () => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={ringRef} position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.02, 8, 64]} />
        <meshBasicMaterial color="#00d4d4" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.01, 8, 64]} />
        <meshBasicMaterial color="#ff6b9d" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const MikuCharacter3D: React.FC<MikuCharacter3DProps> = ({ isSpeaking, emotion }) => {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-5, 5, 5]} intensity={0.5} color="#00d4d4" />
        <pointLight position={[0, -5, 5]} intensity={0.3} color="#ff6b9d" />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <AnimeCharacter isSpeaking={isSpeaking} emotion={emotion} />
        </Float>
        
        <GlowingRings />
        
        <Stars 
          radius={100} 
          depth={50} 
          count={2000} 
          factor={4} 
          saturation={0.5} 
          fade 
          speed={1}
        />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default MikuCharacter3D;
