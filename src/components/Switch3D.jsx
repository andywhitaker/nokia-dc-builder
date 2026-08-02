import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { RACK_CONFIG, getDevicePositionY } from '../utils/rackHelpers';
import { SWITCH_MODELS } from '../data/switchModels';
import { FrontPorts3D } from './FrontPorts3D';
import { RearPanel3D } from './RearPanel3D';

const noRaycast = () => null;

class TextureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('Front faceplate texture failed to load, falling back to default chassis finish:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <mesh position={[0, 0, 0.001]} raycast={noRaycast}>
          <planeGeometry args={[this.props.width, this.props.height]} />
          <meshStandardMaterial color="#1a1d26" roughness={0.4} metalness={0.5} />
        </mesh>
      );
    }
    return this.props.children;
  }
}

function FrontTextureFace({ imagePath, width, height }) {
  const texture = useTexture(imagePath);
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return (
    <mesh position={[0, 0, 0.001]} raycast={noRaycast}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
}

export const Switch3D = React.memo(function Switch3D({
  item,
  isSelected,
  selectedPortId,
  cableSourcePortId,
  onSelectDevice,
  onPortClick,
  onPortHover,
  totalU = 42,
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [animatingSwap, setAnimatingSwap] = useState(false);
  const prevU = useRef(item.startU);

  const model = SWITCH_MODELS[item.modelId] || SWITCH_MODELS['IXR-D2L'];
  const heightU = model.heightU || 1;

  const chassisHeight = heightU * RACK_CONFIG.U_HEIGHT - 0.003;
  const chassisWidth = RACK_CONFIG.CHASSIS_WIDTH;
  const chassisDepth = RACK_CONFIG.CHASSIS_DEPTH;

  const targetPosY = getDevicePositionY(item.startU, heightU, totalU);
  const isAccessory = item.modelId.startsWith('BLANK') || item.modelId.startsWith('CABLE-MGR');

  // Trigger glowing swap halo animation when U position changes
  useEffect(() => {
    if (prevU.current !== item.startU) {
      prevU.current = item.startU;
      setAnimatingSwap(true);
      const timer = setTimeout(() => setAnimatingSwap(false), 750);
      return () => clearTimeout(timer);
    }
  }, [item.startU]);

  // Smooth lerp Y-position in 3D space when reordered or swapped
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetPosY,
        Math.min(delta * 14, 1)
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, targetPosY, 0]}>
      {/* Swap Pulse Wireframe Glow */}
      {animatingSwap && (
        <mesh position={[0, 0, 0]} raycast={noRaycast}>
          <boxGeometry args={[chassisWidth + 0.02, chassisHeight + 0.008, chassisDepth + 0.03]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.9} />
        </mesh>
      )}

      {/* Bounding Box Wireframe Glow when Selected or Hovered */}
      {(isSelected || hovered) && !animatingSwap && (
        <mesh position={[0, 0, 0]} raycast={noRaycast}>
          <boxGeometry args={[chassisWidth + 0.01, chassisHeight + 0.004, chassisDepth + 0.02]} />
          <meshBasicMaterial
            color={isSelected ? '#38bdf8' : '#005aff'}
            wireframe
            transparent
            opacity={isSelected ? 0.8 : 0.4}
          />
        </mesh>
      )}

      {/* Main Steel Chassis Body */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectDevice(item.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <boxGeometry args={[chassisWidth, chassisHeight, chassisDepth]} />
        <meshStandardMaterial
          color={model.color || '#161922'}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Front Faceplate Texture with Error Boundary Protection */}
      <group position={[0, 0, chassisDepth / 2 + 0.001]}>
        {model.frontImage ? (
          <TextureErrorBoundary width={chassisWidth} height={chassisHeight}>
            <React.Suspense
              fallback={
                <mesh position={[0, 0, 0.001]} raycast={noRaycast}>
                  <planeGeometry args={[chassisWidth, chassisHeight]} />
                  <meshStandardMaterial color="#1a1d26" />
                </mesh>
              }
            >
              <FrontTextureFace
                imagePath={model.frontImage}
                width={chassisWidth}
                height={chassisHeight}
              />
            </React.Suspense>
          </TextureErrorBoundary>
        ) : (
          <mesh position={[0, 0, 0.001]} raycast={noRaycast}>
            <planeGeometry args={[chassisWidth, chassisHeight]} />
            <meshStandardMaterial color="#1a1d26" />
          </mesh>
        )}

        {/* Interactive Pixel-Accurate 3D Ports & Activity LEDs */}
        {!isAccessory && (
          <FrontPorts3D
            ports={model.ports}
            chassisWidth={chassisWidth}
            chassisHeight={chassisHeight}
            heightU={heightU}
            selectedPortId={selectedPortId}
            cableSourcePortId={cableSourcePortId}
            onPortClick={onPortClick}
            onPortHover={onPortHover}
            deviceId={item.id}
          />
        )}
      </group>

      {/* Rear Panel PSUs & Fan Trays */}
      <group position={[0, 0, -chassisDepth / 2 - 0.001]} raycast={noRaycast}>
        <RearPanel3D
          chassisWidth={chassisWidth}
          chassisHeight={chassisHeight}
          rearModules={model.rearModules}
        />
      </group>
    </group>
  );
});
