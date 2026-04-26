import { DoubleSide } from "three";

export function GarageLights() {
  return (
    <group>
      {/* Tight circular area light — creates a focused bright pool on the floor */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 64]} />
        <meshStandardMaterial
          emissive="#fff8f0"
          emissiveIntensity={5}
          color="#000000"
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}
