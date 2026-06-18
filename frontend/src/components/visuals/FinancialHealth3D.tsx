import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface FinancialHealth3DProps {
  score: number;
  liquidez: number;
  endeudamiento: number;
}

function getHealthState(score: number): { color: string; label: string; emissive: string } {
  if (score >= 70) return { color: '#10b981', label: 'SALUDABLE', emissive: '#065f46' };
  if (score >= 40) return { color: '#f59e0b', label: 'OBSERVACIÓN', emissive: '#92400e' };
  return { color: '#ef4444', label: 'RIESGO', emissive: '#7f1d1d' };
}

function HealthSphere({ score, liquidez, endeudamiento }: FinancialHealth3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetRadius = Math.max(0.5, Math.min(2.5, score / 40));

  const { color, label, emissive } = getHealthState(score);

  useEffect(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(color);
      mat.emissive.set(emissive);
    }
  }, [color, emissive]);

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    const currentRadius = meshRef.current.geometry.parameters.radius ?? 1;
    const newRadius = currentRadius + (targetRadius - currentRadius) * delta * 2;
    meshRef.current.geometry.dispose();
    meshRef.current.geometry = new THREE.SphereGeometry(newRadius, 32, 32);

    if (!hovered) {
      groupRef.current.rotation.y += delta * 0.2;
    }

    const scale = 1 + Math.sin(Date.now() * 0.002) * 0.02;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[targetRadius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.15}
          metalness={0.3}
          roughness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>

      <pointLight
        position={[targetRadius * 1.5, targetRadius * 1.5, targetRadius * 1.5]}
        intensity={0.3}
        color={color}
      />

      {/* Anillo orbital */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -targetRadius * 1.1, 0]}>
        <ringGeometry args={[targetRadius * 1.2, targetRadius * 1.3, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {hovered && (
        <Html position={[0, targetRadius + 1.2, 0]} center distanceFactor={8}>
          <div className="min-w-[180px] rounded-lg border border-gray-200/50 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/95">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Score</span>
              <span className="text-sm font-black" style={{ color }}>{score}/100</span>
            </div>
            <div className="rounded-md px-2 py-0.5 text-center text-[10px] font-black uppercase tracking-widest mb-2" style={{ backgroundColor: color + '20', color }}>
              {label}
            </div>
            <div className="space-y-1 border-t border-gray-100 pt-2 dark:border-gray-700">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Liquidez</span>
                <span className="font-bold text-gray-900 dark:text-white">{liquidez.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Endeudamiento</span>
                <span className="font-bold text-gray-900 dark:text-white">{(endeudamiento * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial color="#1e293b" transparent opacity={0.1} />
    </mesh>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />
      <hemisphereLight args={['#ffffff', '#1e293b', 0.4]} />
    </>
  );
}

export default function FinancialHealth3D({ score, liquidez, endeudamiento }: FinancialHealth3DProps) {
  const radius = Math.max(0.5, Math.min(2.5, score / 40));
  const cameraZ = Math.max(6, radius * 3.5);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Salud Financiera 3D
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          Esfera proporcional al score financiero
        </p>
      </div>

      <div className="h-[360px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[cameraZ, cameraZ * 0.7, cameraZ]} fov={45} />
          <Lights />
          <Ground />
          <gridHelper args={[12, 12, '#334155', '#1e293b']} position={[0, 0, 0]} />
          <HealthSphere
            score={score}
            liquidez={liquidez}
            endeudamiento={endeudamiento}
          />
          <OrbitControls
            enablePan={false}
            minDistance={3}
            maxDistance={12}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-gray-400">
        <span>Score: {score}/100 · Radio proporcional al puntaje</span>
        <span>Click + arrastra para rotar · Scroll para zoom</span>
      </div>
    </section>
  );
}
