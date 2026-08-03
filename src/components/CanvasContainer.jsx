import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Rack3D } from './Rack3D';
import { Switch3D } from './Switch3D';
import { PatchCables3D } from './PatchCables3D';

const RACK_SPACING_X = 0.86;

export function CanvasContainer({
  racks = [],
  selectedRackIds = [],
  onSelectRack,
  selectedDeviceId,
  selectedPortId,
  cableSourcePortId,
  onSelectDevice,
  onPortClick,
  onPortHover,
  cabinetLightColor,
  cableConnections,
  viewPreset,
}) {
  const controlsRef = useRef();

  // Determine overview mode vs focus mode
  const isOverviewMode = selectedRackIds.length === 0;

  // Filter visible racks: all racks in overview mode, or only selected racks in focus mode
  const visibleRacks = isOverviewMode
    ? racks
    : racks.filter((r) => selectedRackIds.includes(r.id));

  const visibleRacksRef = useRef(visibleRacks);
  visibleRacksRef.current = visibleRacks;

  // Track active visible rack IDs key to prevent internal item moves from resetting camera
  const visibleRackIdsKey = visibleRacks.map((r) => r.id).join(',');

  // Smoothly pan camera ONLY when viewPreset, selectedRackIds, or visible rack IDs change
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    const currentVisible = visibleRacksRef.current;
    const centerX = currentVisible.length > 0 ? ((currentVisible.length - 1) * RACK_SPACING_X) / 2 : 0;

    if (viewPreset === 'FRONT') {
      controls.object.position.set(centerX, 0, 3.5);
      controls.target.set(centerX, 0, 0);
    } else if (viewPreset === 'BACK') {
      controls.object.position.set(centerX, 0, -3.5);
      controls.target.set(centerX, 0, 0);
    } else if (viewPreset === 'ISO') {
      if (!isOverviewMode && currentVisible.length === 1) {
        // Head-on view facing single selected rack directly
        controls.object.position.set(centerX, 0, 3.5);
      } else {
        // 3D Isometric overview of visible racks row
        controls.object.position.set(centerX + 2.5, 1.2, 3.2);
      }
      controls.target.set(centerX, 0, 0);
    } else if (viewPreset === 'TOP') {
      controls.object.position.set(centerX, 4.5, 0.1);
      controls.target.set(centerX, 0, 0);
    }
    controls.update();
  }, [viewPreset, selectedRackIds, isOverviewMode, visibleRackIdsKey]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [2.5, 1.2, 3.2], fov: 45, near: 0.01, far: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Dark Tech Slate Scene Background */}
        <color attach="background" args={['#090d14']} />
        <fog attach="fog" args={['#090d14', 6, 20]} />

        {/* Optimized Lighting Setup */}
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 8, 6]} intensity={1.6} />
        <directionalLight position={[-4, 4, -6]} intensity={0.6} color="#38bdf8" />
        <directionalLight position={[0, -4, 4]} intensity={0.3} color="#005aff" />

        {/* Environment map for realistic metallic reflections (frames={1} caches static HDR map) */}
        <Environment preset="city" frames={1} />

        {/* Multi-Rack Data Center Row (Floor position Y = -1.503 anchors caster wheels flush to floor) */}
        <group position={[0, 0, 0]}>
          {visibleRacks.map((rack, vIdx) => {
            const rackX = vIdx * RACK_SPACING_X;
            const isRackSelected = selectedRackIds.includes(rack.id);

            return (
              <group key={rack.id} position={[rackX, -1.503, 0]}>
                {/* 3D Rack Frame Cabinet */}
                <Rack3D
                  rackName={rack.name}
                  isSelected={isRackSelected}
                  doorClosed={isOverviewMode}
                  cabinetLightColor={cabinetLightColor}
                  totalU={rack.totalU || 42}
                />

                {/* Internal Switches & Ports (ONLY rendered when doors are OPEN / rack is focused) */}
                {!isOverviewMode &&
                  rack.items.map((item) => (
                    <Switch3D
                      key={item.id}
                      item={item}
                      isSelected={selectedDeviceId === item.id}
                      selectedPortId={selectedPortId}
                      cableSourcePortId={cableSourcePortId}
                      onSelectDevice={(id) => {
                        if (!selectedRackIds.includes(rack.id)) {
                          onSelectRack(rack.id, false);
                        }
                        onSelectDevice(id);
                      }}
                      onPortClick={onPortClick}
                      onPortHover={onPortHover}
                      totalU={rack.totalU || 42}
                    />
                  ))}
              </group>
            );
          })}

          {/* Connected 3D Patch Cables between visible racks (Anchored to floor Y = -1.503) */}
          {!isOverviewMode && (
            <group position={[0, -1.503, 0]}>
              <PatchCables3D cableConnections={cableConnections} racks={visibleRacks} />
            </group>
          )}
        </group>

        {/* Floor Grid (Position Y = -1.503: Bottom of rack caster wheels rests flush on floor grid) */}
        <Grid
          position={[0, -1.503, 0]}
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={1}
          cellColor="#1e293b"
          sectionSize={2.5}
          sectionThickness={1.5}
          sectionColor="#005aff"
          fadeDistance={16}
        />

        {/* High-Performance Single-Pass Contact Shadows on Floor */}
        <ContactShadows
          position={[0, -1.50, 0]}
          opacity={0.65}
          scale={20}
          blur={2.5}
          far={4}
          frames={1}
        />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.9}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 + 0.05}
          enablePan
        />
      </Canvas>
    </div>
  );
}
