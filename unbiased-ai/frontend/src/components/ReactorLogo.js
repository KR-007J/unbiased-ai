import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Icosahedron } from '@react-three/drei';

function Reactor() {
  const meshRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.2;
      meshRef.current.rotation.y = t * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <group scale={1.2}>
      {/* Core Node */}
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <Icosahedron ref={meshRef} args={[1, 0]}>
          <MeshDistortMaterial
            color="#00f5ff"
            speed={2}
            distort={0.4}
            radius={1}
            emissive="#00f5ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
            wireframe
          />
        </Icosahedron>
      </Float>

      {/* Orbiting Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#8b00ff" />
      </mesh>

      {/* Outer Glow */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function ReactorLogo({ size = '100px' }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Reactor />
      </Canvas>
    </div>
  );
}
