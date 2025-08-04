import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

const RotatingCube: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useFrame((state) => {
    if (meshRef.current && isClient) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  if (!isClient) return null;

  return (
    <Box ref={meshRef} args={[2, 2, 2]}>
      <meshStandardMaterial
        color="#00FF7F"
        wireframe
        transparent
        opacity={0.3}
      />
    </Box>
  );
};

const FloatingCubes: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useFrame((state) => {
    if (groupRef.current && isClient) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  // Memoize cube positions to prevent recalculation on every render
  const cubePositions = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return {
          x,
          z,
          color: i % 2 === 0 ? '#00FF7F' : '#3BE8FF',
        };
      }),
    []
  );

  if (!isClient) return null;

  return (
    <group ref={groupRef}>
      {cubePositions.map((cube, i) => (
        <Box key={i} position={[cube.x, 0, cube.z]} args={[0.5, 0.5, 0.5]}>
          <meshStandardMaterial
            color={cube.color}
            wireframe
            transparent
            opacity={0.6}
          />
        </Box>
      ))}
    </group>
  );
};

export const CubeBackground: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="fixed inset-0 z-0" />;
  }

  return (
    <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00FF7F" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3BE8FF" />

        <RotatingCube />
        <FloatingCubes />

        {/* Additional decorative elements */}
        <group position={[0, 0, -5]}>
          <Box args={[8, 8, 0.1]} position={[0, 0, 0]}>
            <meshStandardMaterial
              color="#1A1D23"
              wireframe
              transparent
              opacity={0.1}
            />
          </Box>
        </group>
      </Canvas>
    </div>
  );
};