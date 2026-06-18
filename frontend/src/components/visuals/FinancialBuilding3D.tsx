import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { formatMoneyCompact } from '../../utils/financialMetrics';

interface FinancialBuilding3DProps {
  activo: number;
  pasivo: number;
  patrimonio: number;
  healthScore: number;
}

function getColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getLabel(score: number): string {
  if (score >= 70) return 'SALUDABLE';
  if (score >= 40) return 'OBSERVACIÓN';
  return 'RIESGO';
}

function Building({ activo, pasivo, patrimonio, healthScore }: FinancialBuilding3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const normalizedHeight = useMemo(() => {
    const h = Math.abs(patrimonio);
    if (h === 0) return 1;
    return Math.max(1, Math.min(8, Math.log10(h) - 5));
  }, [patrimonio]);

  const color = getColor(healthScore);
  const label = getLabel(healthScore);

  useFrame((_, delta) => {
    if (groupRef.current && !hovered) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <group
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh position={[0, normalizedHeight / 2, 0]} castShadow>
          <boxGeometry args={[2, normalizedHeight, 1.5]} />
          <meshStandardMaterial
            color={color}
            metalness={0.3}
            roughness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>

        <mesh position={[0, normalizedHeight + 0.15, 0]}>
          <boxGeometry args={[2.3, 0.3, 1.8]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
        </mesh>

        {Array.from({ length: Math.min(Math.floor(normalizedHeight / 2), 4) }).map((_, i) => (
          <mesh key={i} position={[0.6, 0.5 + i * 2, 0]} castShadow>
            <planeGeometry args={[0.15, 0.25]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {hovered && (
        <Html position={[0, normalizedHeight + 1.2, 0]} center distanceFactor={8}>
          <div className="min-w-[160px] rounded-lg border border-gray-200/50 bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/95">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Activo Total</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">Bs {formatMoneyCompact(activo)}</p>
            <div className="mt-1 border-t border-gray-100 dark:border-gray-700 pt-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Pasivo</span>
                <span className="font-bold text-gray-900 dark:text-white">Bs {formatMoneyCompact(pasivo)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Patrimonio</span>
                <span className="font-bold text-emerald-600">Bs {formatMoneyCompact(patrimonio)}</span>
              </div>
              <div className="mt-1 flex justify-between text-[10px]">
                <span className="text-gray-500">Score</span>
                <span className="font-bold" style={{ color }}>{healthScore}/100 · {label}</span>
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

function FloorGrid() {
  return (
    <gridHelper args={[12, 12, '#334155', '#1e293b']} position={[0, 0, 0]} />
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />
      <pointLight position={[0, 6, 0]} intensity={0.2} color={getColor(0)} />
    </>
  );
}

export default function FinancialBuildingSection({ activo, pasivo, patrimonio, healthScore }: FinancialBuilding3DProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Visualización 3D
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          Edificio financiero proporcional al patrimonio neto
        </p>
      </div>

      <div className="h-[360px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[6, 5, 6]} fov={45} />
          <Lights />
          <Ground />
          <FloorGrid />
          <Building
            activo={activo}
            pasivo={pasivo}
            patrimonio={patrimonio}
            healthScore={healthScore}
          />
          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={15}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Canvas>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-gray-400">
        <span>Altura proporcional a Bs {formatMoneyCompact(patrimonio)} de patrimonio</span>
        <span>Click + arrastra para rotar · Scroll para zoom</span>
      </div>
    </section>
  );
}
