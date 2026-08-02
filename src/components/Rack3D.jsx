import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { RACK_CONFIG } from '../utils/rackHelpers';

const noRaycast = () => null;

export const Rack3D = React.memo(function Rack3D({
  rackName = 'RACK 1',
  isSelected = false,
  doorClosed = false,
  cabinetLightColor = '#00f0ff',
  totalU = 42,
}) {
  const uHeight = RACK_CONFIG.U_HEIGHT;
  const chassisW = RACK_CONFIG.CHASSIS_WIDTH;
  const rackBodyH = totalU * uHeight;
  const rackW = chassisW + 0.09;
  const rackD = RACK_CONFIG.CHASSIS_DEPTH + 0.16;

  const halfW = rackW / 2;
  const halfD = rackD / 2;
  const postThickness = 0.025;

  // Rail canvas texture (1U..totalU badges) matching 1:1 aspect ratio
  const railTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const canvasH = totalU * 168;
    canvas.width = 128;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    // Dark slate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 128, canvasH);

    const slotH = 168;

    for (let i = 0; i < totalU; i++) {
      const uNum = i + 1;
      const yTop = (totalU - 1 - i) * slotH;
      const yCenter = yTop + slotH / 2;

      // Divider line at top boundary
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, yTop);
      ctx.lineTo(128, yTop);
      ctx.stroke();

      // Crisp non-stretched U Badge Number
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 72px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${uNum}`, 64, yCenter);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [totalU]);

  return (
    <group position={[0, 0, 0]}>
      {/* Top 3D Rack Title Banner (Highlighted when Selected) */}
      <group position={[0, 0.06 + rackBodyH + 0.12, 0]}>
        <mesh position={[0, 0, 0]} raycast={noRaycast}>
          <planeGeometry args={[0.32, 0.08]} />
          <meshBasicMaterial color={isSelected ? '#005aff' : '#0f172a'} transparent opacity={0.9} />
        </mesh>
        <Text
          position={[0, 0, 0.001]}
          fontSize={0.038}
          color={isSelected ? '#00f0ff' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {rackName} ({totalU}U)
        </Text>
      </group>

      {/* Heavy Base Pedestal */}
      <mesh position={[0, 0.03, 0]} raycast={noRaycast}>
        <boxGeometry args={[rackW + 0.04, 0.06, rackD + 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* Caster Wheels */}
      {[
        [-halfW + 0.02, -0.015, -halfD + 0.04],
        [halfW - 0.02, -0.015, -halfD + 0.04],
        [-halfW + 0.02, -0.015, halfD - 0.04],
        [halfW - 0.02, -0.015, halfD - 0.04],
      ].map((pos, idx) => (
        <mesh key={`wheel-${idx}`} position={pos} raycast={noRaycast}>
          <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
      ))}

      {/* Top Roof Cover */}
      <mesh position={[0, 0.06 + rackBodyH + 0.015, 0]} raycast={noRaycast}>
        <boxGeometry args={[rackW + 0.03, 0.03, rackD + 0.03]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* 4 Main Vertical Steel Outer Posts */}
      {[
        [-halfW, 0.06 + rackBodyH / 2, -halfD],
        [halfW, 0.06 + rackBodyH / 2, -halfD],
        [-halfW, 0.06 + rackBodyH / 2, halfD],
        [halfW, 0.06 + rackBodyH / 2, halfD],
      ].map((pos, idx) => (
        <mesh key={`post-${idx}`} position={pos} raycast={noRaycast}>
          <boxGeometry args={[postThickness, rackBodyH + 0.03, postThickness]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}

      {/* Left & Right Vertical Mounting Rails with Instanced Canvas Texture (1U..totalU Badges) */}
      {[-chassisW / 2 - 0.018, chassisW / 2 + 0.018].map((railX, rIdx) => (
        <mesh key={`rail-plane-${rIdx}`} position={[railX, 0.06 + rackBodyH / 2, RACK_CONFIG.CHASSIS_DEPTH / 2 + 0.005]} raycast={noRaycast}>
          <planeGeometry args={[0.032, rackBodyH]} />
          <meshBasicMaterial map={railTexture} transparent opacity={0.95} />
        </mesh>
      ))}

      {/* Front Closed Cabinet Door (Rendered in Overview Mode when doorClosed is true) */}
      {doorClosed && (
        <group position={[0, 0.06 + rackBodyH / 2, halfD + 0.005]} raycast={noRaycast}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[rackW - 0.01, rackBodyH, 0.006]} />
            <meshPhysicalMaterial
              color="#0f172a"
              transparent
              opacity={0.85}
              roughness={0.2}
              metalness={0.8}
              transmission={0.3}
              ior={1.5}
            />
          </mesh>
          <mesh position={[halfW - 0.05, 0, 0.006]}>
            <boxGeometry args={[0.012, 0.25, 0.015]} />
            <meshStandardMaterial color="#005aff" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Interior LED Light Strips (Rendered when selected or open) */}
      {!doorClosed && isSelected && (
        <>
          <pointLight position={[-halfW + 0.04, 0.06 + rackBodyH / 2, 0]} intensity={1.2} color={cabinetLightColor} distance={2.5} />
          <pointLight position={[halfW - 0.04, 0.06 + rackBodyH / 2, 0]} intensity={1.2} color={cabinetLightColor} distance={2.5} />
        </>
      )}

      {/* Translucent Side Glass Panels */}
      {[-halfW - 0.005, halfW + 0.005].map((panelX, pIdx) => (
        <mesh key={`side-panel-${pIdx}`} position={[panelX, 0.06 + rackBodyH / 2, 0]} raycast={noRaycast}>
          <boxGeometry args={[0.004, rackBodyH - 0.02, rackD - 0.06]} />
          <meshPhysicalMaterial
            color="#0f172a"
            transparent
            opacity={0.3}
            roughness={0.1}
            transmission={0.5}
            ior={1.5}
          />
        </mesh>
      ))}
    </group>
  );
});
