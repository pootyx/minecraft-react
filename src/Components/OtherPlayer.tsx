import { useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

function OtherPlayer({ position }: { position: Vector3 }) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.6, 1.8, 0.6]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

export default OtherPlayer;
