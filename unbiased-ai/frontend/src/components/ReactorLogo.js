import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

function Reactor({ isActive = false }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const outerRingRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      const speed = isActive ? 1.2 : 0.2;
      meshRef.current.rotation.x = t * speed;
      meshRef.current.rotation.y = t * (speed * 1.5);
      
      // Pulse effect - more intense when active
      const pulse = isActive ? 1.1 + Math.sin(t * 10) * 0.1 : 1.0;
      meshRef.current.scale.setScalar(pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * (isActive ? 2.5 : 0.5);
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y = t * (isActive ? -1.5 : -0.3);
      outerRingRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <group scale={1.2}>
      {/* Core Neural Node */}
      <Float speed={isActive ? 10 : 2} rotationIntensity={isActive ? 4 : 1} floatIntensity={isActive ? 4 : 1}>
        <Icosahedron ref={meshRef} args={[1, 1]}>
          <MeshDistortMaterial
            color={isActive ? "#00f5ff" : "#0080ff"}
            speed={isActive ? 6 : 2}
            distort={isActive ? 0.6 : 0.3}
            radius={1}
            emissive={isActive ? "#00f5ff" : "#010820"}
            emissiveIntensity={isActive ? 2.5 : 0.5}
            transparent
            opacity={0.9}
            wireframe={!isActive}
          />
        </Icosahedron>
      </Float>

      {/* Primary Orbiting Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.5, 0.015, 16, 120]} />
        <meshBasicMaterial color={isActive ? "#00f5ff" : "#8b00ff"} transparent opacity={0.6} />
      </mesh>

      {/* Secondary Counter-Orbiting Ring */}
      <mesh ref={outerRingRef} rotation={[Math.PI / 1.5, Math.PI / 4, 0]}>
        <torusGeometry args={[1.8, 0.01, 16, 120]} />
        <meshBasicMaterial color={isActive ? "#ff00aa" : "#0080ff"} transparent opacity={0.4} />
      </mesh>

      {/* Neural Aura */}
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial 
          color={isActive ? "#00f5ff" : "#0080ff"} 
          transparent 
          opacity={isActive ? 0.2 : 0.05} 
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Dynamic Point Light - enhanced during analysis */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={isActive ? 3.0 : 0.8} 
        color={isActive ? "#00f5ff" : "#0080ff"} 
        distance={5} 
      />
    </group>
  );
}

export default function ReactorLogo({ size = '100px', isActive: propIsActive = false }) {
  // Connect to store for real-time analysis state feedback
  const storeIsAnalyzing = useStore((s) => s.isAnalyzing);
  const isActive = propIsActive || storeIsAnalyzing;
  
  return (
    <div style={{ 
      width: size, 
      height: size, 
      filter: isActive ? 'drop-shadow(0 0 30px rgba(0, 245, 255, 0.6)) drop-shadow(0 0 60px rgba(0, 245, 255, 0.3))' : 'drop-shadow(0 0 10px rgba(0, 128, 255, 0.2))',
      transition: 'filter 0.3s ease',
    }}>
      <Canvas camera={{ position: [0, 0, 4.5] }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <Reactor isActive={isActive} />
      </Canvas>
    </div>
  );
}

