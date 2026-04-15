import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Environment, Edges, Ring, Trail, Float } from '@react-three/drei';
import * as THREE from 'three';

const ParticleRing = ({ count = 200, radius = 4, speed = 1, color = "#00f2ff", yOffset = 0, reversed = false }) => {
  const group = useRef<THREE.Group>(null);
  const particles = Array.from({ length: count }).map((_, i) => ({
    angle: (i / count) * Math.PI * 2,
    speed: Math.random() * 0.5 + 0.5,
    distance: radius + (Math.random() - 0.5) * 0.5,
  }));

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * speed * (reversed ? -0.2 : 0.2);
    }
  });

  return (
    <group ref={group} position={[0, yOffset, 0]}>
      {particles.map((p, i) => (
        <mesh key={i} position={[Math.cos(p.angle) * p.distance, (Math.random() - 0.5) * 0.2, Math.sin(p.angle) * p.distance]}>
          <boxGeometry args={[0.05, 0.05, 0.2]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <Ring args={[radius - 0.1, radius + 0.1, 64]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </Ring>
    </group>
  );
};

const ReactorEnergy = () => {
  const sphereRef = useRef<any>(null);
  
  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={sphereRef} args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color="#002244"
          emissive="#00f2ff"
          emissiveIntensity={4}
          distort={0.4}
          speed={3}
          roughness={0.1}
          metalness={0.9}
        />
        <Edges scale={1.0} threshold={15} color="#ffffff" />
      </Sphere>
      
      {/* Outer energy shell */}
      <Sphere args={[2.2, 32, 32]}>
        <meshStandardMaterial
          color="#b600f8"
          emissive="#b600f8"
          emissiveIntensity={1}
          wireframe
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </Sphere>

      {/* Core Rings */}
      <ParticleRing count={300} radius={3.5} speed={1.5} color="#00f2ff" />
      <ParticleRing count={150} radius={4.5} speed={0.8} color="#b600f8" reversed yOffset={0.2} />
      <ParticleRing count={200} radius={5.5} speed={0.5} color="#00f2ff" yOffset={-0.2} />
    </Float>
  );
};

export const ReactorCore = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 5, 8], fov: 60 }} gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 0, 0]} intensity={10} color="#00f2ff" distance={10} />
        <spotLight position={[5, 10, 5]} angle={0.2} penumbra={1} intensity={2} color="#b600f8" />
        <spotLight position={[-5, 10, -5]} angle={0.2} penumbra={1} intensity={2} color="#00f2ff" />
        
        <ReactorEnergy />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};
