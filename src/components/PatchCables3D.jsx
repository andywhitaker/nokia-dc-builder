import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SWITCH_MODELS } from '../data/switchModels';
import { getPort3DPosition, getPort3DPositionFromPixel } from '../utils/rackHelpers';

const RACK_SPACING_X = 0.86;

export function PatchCables3D({ cableConnections = [], racks = [] }) {
  return (
    <group position={[0, 0, 0]}>
      {cableConnections.map((conn) => (
        <SingleCable key={conn.id} connection={conn} racks={racks} />
      ))}
    </group>
  );
}

function SingleCable({ connection, racks }) {
  const pulseRef = useRef();

  const curveData = useMemo(() => {
    const [fromDevId, fromPortStr] = connection.fromPortId.split(':');
    const [toDevId, toPortStr] = connection.toPortId.split(':');

    let devFrom = null;
    let fromRackIdx = 0;
    let devTo = null;
    let toRackIdx = 0;

    racks.forEach((rack, rIdx) => {
      const foundFrom = rack.items.find((it) => it.id === fromDevId);
      if (foundFrom) {
        devFrom = foundFrom;
        fromRackIdx = rIdx;
      }
      const foundTo = rack.items.find((it) => it.id === toDevId);
      if (foundTo) {
        devTo = foundTo;
        toRackIdx = rIdx;
      }
    });

    if (!devFrom || !devTo) return null;

    const modelFrom = SWITCH_MODELS[devFrom.modelId];
    const modelTo = SWITCH_MODELS[devTo.modelId];

    if (!modelFrom || !modelTo) return null;

    const portObjFrom = modelFrom.ports?.find((p) => p.id === fromPortStr);
    const portObjTo = modelTo.ports?.find((p) => p.id === toPortStr);

    let startPos;
    if (portObjFrom?.pixelRect) {
      startPos = getPort3DPositionFromPixel(devFrom.startU, modelFrom.heightU, portObjFrom.pixelRect);
    } else {
      startPos = getPort3DPosition(devFrom.startU, modelFrom.heightU, 1, 1, 1);
    }

    let endPos;
    if (portObjTo?.pixelRect) {
      endPos = getPort3DPositionFromPixel(devTo.startU, modelTo.heightU, portObjTo.pixelRect);
    } else {
      endPos = getPort3DPosition(devTo.startU, modelTo.heightU, 1, 1, 1);
    }

    const p0 = new THREE.Vector3(...startPos);
    const p3 = new THREE.Vector3(...endPos);

    // Apply Rack X Offset (0.86 spacing)
    p0.x += fromRackIdx * RACK_SPACING_X;
    p3.x += toRackIdx * RACK_SPACING_X;

    // Calculate natural cable slack arch
    const distY = Math.abs(p0.y - p3.y);
    const distX = Math.abs(p0.x - p3.x);
    const slackZ = Math.max(0.08, (distY + distX * 0.5) * 0.35);

    const p1 = p0.clone().add(new THREE.Vector3(0.01, -0.03 - distY * 0.1, slackZ));
    const p2 = p3.clone().add(new THREE.Vector3(0.01, -0.03 - distY * 0.1, slackZ));

    const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
    const geometry = new THREE.TubeGeometry(curve, 32, 0.003, 8, false);

    return { curve, geometry, p0, p3 };
  }, [connection, racks]);

  // Animate optical packet pulse along the cable
  useFrame(({ clock }) => {
    if (!pulseRef.current || !curveData) return;
    const t = (clock.getElapsedTime() * 0.8) % 1;
    const point = curveData.curve.getPointAt(t);
    pulseRef.current.position.copy(point);
  });

  if (!curveData) return null;

  const cableColor = connection.color || '#00f0ff';

  return (
    <group>
      {/* 3D Curved Patch Cable Body */}
      <mesh geometry={curveData.geometry}>
        <meshStandardMaterial
          color={cableColor}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Rubber Strain Relief Connector Boot - Start */}
      <mesh position={curveData.p0}>
        <boxGeometry args={[0.008, 0.008, 0.016]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>

      {/* Rubber Strain Relief Connector Boot - End */}
      <mesh position={curveData.p3}>
        <boxGeometry args={[0.008, 0.008, 0.016]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>

      {/* Animated Optical Signal Transmission Pulse */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
