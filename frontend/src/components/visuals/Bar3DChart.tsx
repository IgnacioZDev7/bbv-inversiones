import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera, Edges } from '@react-three/drei';
import * as THREE from 'three';

export interface Bar3DDatum {
  name: string;
  value: number;
  /** Use instead of `value` to compute bar height (e.g. a normalized 0-100 score) when `value` itself isn't on a comparable scale. */
  heightValue?: number;
  /** Custom label text shown above the bar; falls back to `formatter(value)` when omitted. */
  displayValue?: string;
  color?: string;
  highlight?: boolean;
  badge?: string;
}

interface Bar3DChartProps {
  title?: string;
  subtitle?: string;
  data: Bar3DDatum[];
  formatter?: (v: number) => string;
  defaultColor?: string;
  highlightColor?: string;
  height?: number;
  /** Fixed denominator for height normalization instead of the auto-detected max of the dataset. */
  maxValue?: number;
}

const MIN_HEIGHT = 1;
const MAX_HEIGHT = 5.5;
const GAP = 1.5;

function Tower({
  position,
  height,
  color,
  name,
  value,
  displayValue,
  formatter,
  highlight,
  badge,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  name: string;
  value: number;
  displayValue?: string;
  formatter: (v: number) => string;
  highlight?: boolean;
  badge?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const capHeight = 0.45;

  return (
    <group position={position}>
      <mesh
        position={[0, height / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.42, 0.52, height, 4, 1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.25}
          roughness={0.45}
          flatShading
          transparent
          opacity={hovered ? 1 : 0.92}
        />
        <Edges color="white" linewidth={0.6} threshold={1} />
      </mesh>

      <mesh position={[0, height + capHeight / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.42, capHeight, 4]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} flatShading />
        <Edges color="white" linewidth={0.6} threshold={1} />
      </mesh>

      <Html position={[0, height + capHeight + 0.55, 0]} center distanceFactor={9}>
        <div className="pointer-events-none flex w-[120px] flex-col items-center text-center">
          <span className="truncate text-[10px] font-bold leading-tight text-gray-800 dark:text-white">
            {name}
          </span>
          <span className="text-sm font-black leading-tight" style={{ color }}>
            {displayValue ?? formatter(value)}
          </span>
          {highlight && badge && (
            <span className="mt-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: color }}>
              {badge}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

function Ground({ width }: { width: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width, width]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.08} />
      </mesh>
      <gridHelper args={[width, Math.round(width)]} position={[0, 0, 0]} />
    </>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-4, 6, -3]} intensity={0.3} />
    </>
  );
}

function Scene({
  data,
  formatter,
  defaultColor,
  highlightColor,
  maxValue,
}: {
  data: Bar3DDatum[];
  formatter: (v: number) => string;
  defaultColor: string;
  highlightColor: string;
  maxValue?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const bars = useMemo(() => {
    const max = maxValue ?? Math.max(...data.map((d) => Math.abs(d.heightValue ?? d.value)), 1);
    return data.map((d, i) => ({
      ...d,
      height: Math.max(MIN_HEIGHT, (Math.abs(d.heightValue ?? d.value) / max) * MAX_HEIGHT),
      x: (i - (data.length - 1) / 2) * GAP,
    }));
  }, [data, maxValue]);

  const totalWidth = Math.max(bars.length * GAP, 6);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setAutoRotate(false)}
      onPointerOut={() => setAutoRotate(true)}
    >
      <Ground width={totalWidth} />
      {bars.map((bar) => (
        <Tower
          key={bar.name}
          position={[bar.x, 0, 0]}
          height={bar.height}
          color={bar.color || (bar.highlight ? highlightColor : defaultColor)}
          name={bar.name}
          value={bar.value}
          displayValue={bar.displayValue}
          formatter={formatter}
          highlight={bar.highlight}
          badge={bar.badge}
        />
      ))}
    </group>
  );
}

export default function Bar3DChart({
  title,
  subtitle,
  data,
  formatter = (v) => v.toLocaleString('es-BO'),
  defaultColor = '#0ea5e9',
  highlightColor = '#465fff',
  height = 280,
  maxValue,
}: Bar3DChartProps) {
  if (data.length === 0) return null;

  const cameraDistance = Math.min(13, Math.max(7, data.length * 1.6));

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-2 flex items-baseline justify-between">
          {title && <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</h4>}
          {subtitle && (
            <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {subtitle}
            </span>
          )}
        </div>
      )}
      <div
        className="w-full overflow-hidden rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950"
        style={{ height }}
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[cameraDistance * 0.7, cameraDistance * 0.55, cameraDistance]} fov={42} />
          <Lights />
          <Scene data={data} formatter={formatter} defaultColor={defaultColor} highlightColor={highlightColor} maxValue={maxValue} />
          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={20}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Canvas>
      </div>
    </div>
  );
}
