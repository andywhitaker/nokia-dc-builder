import React from 'react';

export function RearPanel3D({ chassisWidth, chassisHeight, rearModules }) {
  if (!rearModules) {
    return (
      <group position={[0, 0, -0.002]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[chassisWidth - 0.04, chassisHeight - 0.01]} />
          <meshStandardMaterial color="#1a1e27" metalness={0.8} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  const { psuCount = 2, fanTrayCount = 5 } = rearModules;
  const psuWidth = 0.08;
  const fanWidth = 0.045;

  return (
    <group position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]}>
      {/* Rear Galvanized Metal Faceplate */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[chassisWidth - 0.04, chassisHeight - 0.01]} />
        <meshStandardMaterial color="#212735" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Power Supply Units (PSUs) on Left */}
      {Array.from({ length: psuCount }).map((_, i) => {
        const posX = -chassisWidth / 2 + 0.07 + i * (psuWidth + 0.015);
        return (
          <group key={`psu-${i}`} position={[posX, 0, 0.004]}>
            {/* PSU Housing */}
            <mesh>
              <boxGeometry args={[psuWidth, chassisHeight - 0.012, 0.008]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
            </mesh>

            {/* AC Socket */}
            <mesh position={[-0.02, -0.005, 0.005]}>
              <boxGeometry args={[0.025, 0.018, 0.006]} />
              <meshStandardMaterial color="#000000" />
            </mesh>

            {/* PSU Handle Release Lever */}
            <mesh position={[0.025, 0, 0.008]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.01, 0.0025, 8, 16]} />
              <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* PSU Status LED */}
            <mesh position={[-0.02, chassisHeight * 0.25, 0.005]}>
              <sphereGeometry args={[0.002, 8, 8]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>
        );
      })}

      {/* Fan Modules on Right */}
      {Array.from({ length: fanTrayCount }).map((_, i) => {
        const posX = chassisWidth / 2 - 0.05 - i * (fanWidth + 0.008);
        return (
          <group key={`fan-${i}`} position={[posX, 0, 0.004]}>
            {/* Fan Tray Mesh Casing */}
            <mesh>
              <boxGeometry args={[fanWidth, chassisHeight - 0.012, 0.008]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
            </mesh>

            {/* Fan Grill Ventilation Circle */}
            <mesh position={[0, 0, 0.005]}>
              <circleGeometry args={[Math.min(fanWidth, chassisHeight) * 0.35, 16]} />
              <meshBasicMaterial color="#0b0f17" />
            </mesh>

            {/* Finger Pull Loop Handle */}
            <mesh position={[0, 0, 0.008]}>
              <boxGeometry args={[fanWidth * 0.6, 0.005, 0.006]} />
              <meshStandardMaterial color="#005aff" metalness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Nokia Grounding Lug */}
      <mesh position={[0, -chassisHeight * 0.25, 0.004]}>
        <cylinderGeometry args={[0.003, 0.003, 0.006, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
      </mesh>
    </group>
  );
}
