import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ErrorBoundary } from 'react-error-boundary';
import { Float, OrbitControls, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';

const GlobeContent = React.memo(() => {
  const globeRef = useRef();
  const dotsRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (globeRef.current) globeRef.current.rotation.y = t * 0.1;
    if (dotsRef.current) dotsRef.current.rotation.y = t * 0.1;
  });

  const points = useMemo(() => {
    const pts = [];
    const count = 1000;
    for (let i = 0; i < count; i += 1) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 2.5;
      pts.push(
        new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi),
        ),
      );
    }
    return new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]));
  }, []);

  const hotspots = useMemo(() => ([
    { pos: [1.5, 1.5, 1.2], color: '#ff00aa', label: 'Gender Bias Scan' },
    { pos: [-1.8, 0.5, 1.5], color: '#8b00ff', label: 'Political Delta' },
    { pos: [0.5, -2, 1], color: '#ff3366', label: 'Racial Anomaly' },
  ]), []);

  return (
    <group>
      <Sphere args={[2, 64, 64]}>
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.05} />
      </Sphere>

      <Sphere ref={globeRef} args={[2.45, 32, 32]}>
        <meshBasicMaterial color="#00f5ff" wireframe transparent opacity={0.1} />
      </Sphere>

      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={points.length / 3} array={points} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#00f5ff" transparent opacity={0.6} sizeAttenuation />
      </points>

      {hotspots.map((spot, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={spot.pos}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={spot.color} />
            <pointLight distance={2} intensity={2} color={spot.color} />
          </mesh>
          <Text
            position={[spot.pos[0] * 1.2, spot.pos[1] * 1.2, spot.pos[2] * 1.2]}
            fontSize={0.1}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {spot.label}
          </Text>
        </Float>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.005, 16, 100]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.2} />
      </mesh>
    </group>
  );
});

function GlobeFallback({ message }) {
  return (
    <div style={{
      width: '100%',
      height: '500px',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-mono)',
      background: 'radial-gradient(circle at center, rgba(0,245,255,0.08), transparent 70%)',
      textAlign: 'center',
      padding: 24,
    }}>
      {message}
    </div>
  );
}

const BiasGlobe = React.memo(() => {
  const webglAvailable = typeof window !== 'undefined' && !!window.WebGLRenderingContext;

  if (!webglAvailable) {
    return <GlobeFallback message="GLOBAL BIAS MAP UNAVAILABLE ON THIS DEVICE" />;
  }

  return (
    <ErrorBoundary fallback={<GlobeFallback message="GLOBAL BIAS MAP FAILED TO LOAD" />}>
      <div style={{ width: '100%', height: '500px', cursor: 'grab' }}>
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <GlobeContent />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
});

export default BiasGlobe;
