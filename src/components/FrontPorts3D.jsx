import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const noRaycast = () => null;

export const FrontPorts3D = React.memo(function FrontPorts3D({
  ports = [],
  chassisWidth,
  chassisHeight,
  heightU = 1,
  selectedPortId,
  cableSourcePortId,
  onPortClick,
  onPortHover,
  deviceId,
}) {
  const [hoveredPort, setHoveredPort] = useState(null);
  const pulseRef = useRef();

  // Pulse animation ONLY for active cable source port
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 8) * 0.12;
      pulseRef.current.scale.set(scale, scale, 1);
    }
  });

  const IMG_W = 2048;
  const IMG_H = 187 * heightU;

  return (
    <group position={[0, 0, 0.008]}>
      {ports.map((port) => {
        const portIdFull = `${deviceId}:${port.id}`;
        const isSelected = selectedPortId === portIdFull;
        const isCableSource = cableSourcePortId === portIdFull;
        const isHovered = hoveredPort === port.id;

        let posX = 0;
        let posY = 0;
        let pWidth = 0.016;
        let pHeight = 0.012;

        if (port.pixelRect) {
          const centerX = (port.pixelRect.minX + port.pixelRect.maxX) / 2;
          const centerY = (port.pixelRect.minY + port.pixelRect.maxY) / 2;
          const normX = centerX / IMG_W - 0.5;
          const normY = 0.5 - centerY / IMG_H;

          posX = normX * chassisWidth;
          posY = normY * chassisHeight;
          pWidth = ((port.pixelRect.maxX - port.pixelRect.minX) / IMG_W) * chassisWidth;
          pHeight = ((port.pixelRect.maxY - port.pixelRect.minY) / IMG_H) * chassisHeight;
        }

        let ledColor = '#10b981';
        if (port.type === 'QSFP28' || port.type === 'QSFP-DD' || port.type === 'OSFP') {
          ledColor = port.defaultStatus === 'UP' ? '#00e5ff' : '#f59e0b';
        } else if (port.type === 'SFP+' || port.type === 'SFP28') {
          ledColor = port.defaultStatus === 'UP' ? '#10b981' : '#ef4444';
        } else if (port.type === 'RJ45') {
          ledColor = '#22c55e';
        }

        const boxW = Math.max(pWidth, 0.014);
        const boxH = Math.max(pHeight, 0.01);

        const activeColor = isCableSource
          ? '#ff007f'
          : isSelected
          ? '#00f0ff'
          : isHovered
          ? '#38bdf8'
          : null;

        return (
          <group key={port.id} position={[posX, posY, 0]}>
            {/* Dedicated Pointer Hit Target Plane */}
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredPort(port.id);
                if (onPortHover) onPortHover(port);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredPort(null);
                if (onPortHover) onPortHover(null);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onPortClick) onPortClick(port, portIdFull);
              }}
            >
              <planeGeometry args={[boxW, boxH]} />
              <meshBasicMaterial
                color={activeColor || '#005aff'}
                transparent
                opacity={isCableSource ? 0.85 : isSelected ? 0.75 : isHovered ? 0.6 : 0.05}
                depthWrite={false}
              />
            </mesh>

            {/* Decorative Overlays (Ignored by raycaster) */}
            <group raycast={noRaycast}>
              {/* Glowing Wireframe Frame when Hovered, Selected, or Cable Source */}
              {activeColor && (
                <mesh ref={isCableSource ? pulseRef : null} position={[0, 0, 0.002]}>
                  <boxGeometry args={[boxW + 0.002, boxH + 0.002, 0.0005]} />
                  <meshBasicMaterial color={activeColor} wireframe transparent opacity={0.9} />
                </mesh>
              )}

              {/* Floating 3D Text Badge */}
              {(isCableSource || isHovered) && (
                <group position={[0, boxH / 2 + 0.008, 0.004]}>
                  <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[0.045, 0.014]} />
                    <meshBasicMaterial color={isCableSource ? '#ff007f' : '#0f172a'} depthWrite={false} />
                  </mesh>
                  <Text
                    position={[0, 0, 0.001]}
                    fontSize={0.0065}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="bold"
                  >
                    {isCableSource ? `SOURCE ${port.id}` : `${port.id} (${port.speed})`}
                  </Text>
                </group>
              )}

              {/* High-Performance Static LED Indicator */}
              <mesh position={[0, boxH / 2 + 0.0015, 0.002]}>
                <sphereGeometry args={[0.0015, 6, 6]} />
                <meshBasicMaterial
                  color={ledColor}
                  transparent
                  opacity={port.defaultStatus === 'UP' ? 0.95 : 0.2}
                  depthWrite={false}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
});
