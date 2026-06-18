import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export type SphereStatus =
  | 'requesting'
  | 'front-countdown'
  | 'left-countdown'
  | 'right-countdown'
  | 'verifying'
  | 'success'
  | 'error'
  | 'complete';

interface BiometricProgressSphereProps {
  status: SphereStatus;
}

const COLOR_MAP: Record<SphereStatus, string> = {
  requesting: '#9CA3AF',
  'front-countdown': '#3B82F6',
  'left-countdown': '#F59E0B',
  'right-countdown': '#F59E0B',
  verifying: '#8B5CF6',
  success: '#10B981',
  complete: '#10B981',
  error: '#EF4444',
};

const LABEL_MAP: Partial<Record<SphereStatus, string>> = {
  'front-countdown': 'Frente',
  'left-countdown': 'Izquierda',
  'right-countdown': 'Derecha',
};

function SphereInner({ status }: { status: SphereStatus }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const pointsRef = useRef<THREE.Points>(null!);

  const targetColor = useMemo(() => new THREE.Color(COLOR_MAP[status]), [status]);
  const currentColor = useRef(new THREE.Color(COLOR_MAP[status]));

  const particles = useMemo(() => {
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.3;
      const height = (Math.random() - 0.5) * 1.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const glow = glowRef.current;
    const group = groupRef.current;
    if (!mesh || !glow || !group) return;
    const t = state.clock.elapsedTime;

    currentColor.current.lerp(targetColor, delta * 3);
    (mesh.material as THREE.MeshStandardMaterial).color.copy(currentColor.current);
    (glow.material as THREE.MeshBasicMaterial).color.copy(currentColor.current);

    let rotSpeed = 0.4;
    if (status === 'requesting') rotSpeed = 0.2;

    if (status === 'left-countdown') {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0.3, delta * 2);
    } else if (status === 'right-countdown') {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -0.3, delta * 2);
    } else {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, delta * 2);
    }
    group.rotation.y += delta * rotSpeed;

    const glowMat = glow.material as THREE.MeshBasicMaterial;
    const isActive = status === 'front-countdown' || status === 'left-countdown' || status === 'right-countdown';
    const targetOpacity = isActive ? 0.35 : 0;
    glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, targetOpacity, delta * 2);
    const glowScale = 1 + (1 - glowMat.opacity / 0.35) * 0.3 || 1;
    glow.scale.setScalar(glowScale);

    if (status === 'success' || status === 'complete') {
      mesh.scale.setScalar(1 + Math.sin(t * 4) * 0.04);
    } else {
      mesh.scale.setScalar(1);
    }

    if (status === 'error') {
      group.position.x = Math.sin(t * 30) * 0.03;
      group.position.y = Math.sin(t * 25 + 1) * 0.03;
    } else {
      group.position.x = THREE.MathUtils.lerp(group.position.x, 0, delta * 5);
      group.position.y = THREE.MathUtils.lerp(group.position.y, 0, delta * 5);
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * (status === 'verifying' ? 0.8 : 0.2);
    }
  });

  const label = LABEL_MAP[status];
  const isVerifying = status === 'verifying';

  return (
    <group ref={groupRef}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial color={COLOR_MAP[status]} transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color={COLOR_MAP[status]} roughness={0.3} metalness={0.6} />
      </mesh>

      {isVerifying && (
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particles, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.06} color={COLOR_MAP[status]} transparent opacity={0.7} sizeAttenuation />
        </points>
      )}

      {label && (
        <Text position={[0, -1.6, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
          {label}
        </Text>
      )}

      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} />
    </group>
  );
}

export default function BiometricProgressSphere({ status }: BiometricProgressSphereProps) {
  return (
    <div className="w-36 h-44">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <SphereInner status={status} />
        </Suspense>
      </Canvas>
    </div>
  );
}
