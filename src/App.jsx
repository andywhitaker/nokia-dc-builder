import React, { useState, useEffect } from 'react';
import './App.css';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasContainer } from './components/CanvasContainer';
import { PortModal } from './components/PortModal';
import { BOMModal } from './components/BOMModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { INITIAL_RACK_ITEMS, SWITCH_MODELS } from './data/switchModels';

export const CABLE_COLOR_PALETTE = [
  { hex: '#00f0ff', label: 'Cyan (OM3/OM4 100G)' },
  { hex: '#ec4899', label: 'Magenta (OM5 Uplink)' },
  { hex: '#eab308', label: 'Yellow (OS2 Single-mode)' },
  { hex: '#10b981', label: 'Green (Management)' },
  { hex: '#a855f7', label: 'Purple (Fabric)' },
  { hex: '#f97316', label: 'Orange (Multimode)' },
  { hex: '#3b82f6', label: 'Blue (Ethernet)' },
  { hex: '#ef4444', label: 'Red (Critical Link)' },
];

const LOCAL_STORAGE_KEY = 'nokia_dc_rack_builder_saved_state';

const DEFAULT_RACKS = [
  {
    id: 'rack-1',
    name: 'Rack 1',
    totalU: 42,
    items: INITIAL_RACK_ITEMS,
  },
  {
    id: 'rack-2',
    name: 'Rack 2',
    totalU: 42,
    items: [],
  },
];

const DEFAULT_CABLE_CONNECTIONS = [
  {
    id: 'cbl-1',
    fromPortId: 'inst-d3l-1:e1/1',
    toPortId: 'inst-d2l-1:e1/49',
    color: '#00f0ff',
  },
  {
    id: 'cbl-2',
    fromPortId: 'inst-d3l-1:e1/2',
    toPortId: 'inst-d2l-2:e1/49',
    color: '#ec4899',
  },
];

const loadSavedState = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load saved state from localStorage:', err);
  }
  return null;
};

export default function App() {
  const savedState = loadSavedState();

  // Multi-Rack Data Center State with LocalStorage Restoration
  const [racks, setRacks] = useState(() => savedState?.racks || DEFAULT_RACKS);
  const [selectedRackIds, setSelectedRackIds] = useState(() => savedState?.selectedRackIds || ['rack-1']);
  const [cableConnections, setCableConnections] = useState(() => savedState?.cableConnections || DEFAULT_CABLE_CONNECTIONS);
  const [activeCableColor, setActiveCableColor] = useState(() => savedState?.activeCableColor || '#00f0ff');
  const [cabinetLightColor, setCabinetLightColor] = useState(() => savedState?.cabinetLightColor || '#00f0ff');

  const [selectedDeviceId, setSelectedDeviceId] = useState('inst-d2l-1');
  const [viewPreset, setViewPreset] = useState('ISO'); // 'FRONT' | 'BACK' | 'ISO' | 'TOP'
  
  // Door controls
  const [doorOpen, setDoorOpen] = useState(false);

  const [cableModeActive, setCableModeActive] = useState(false);
  const [cableSourcePortId, setCableSourcePortId] = useState(null);

  // Modals state
  const [selectedPort, setSelectedPort] = useState(null);
  const [portModalDeviceId, setPortModalDeviceId] = useState(null);
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Automatically save state to LocalStorage on changes
  useEffect(() => {
    try {
      const stateToSave = {
        racks,
        selectedRackIds,
        cableConnections,
        activeCableColor,
        cabinetLightColor,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }, [racks, selectedRackIds, cableConnections, activeCableColor, cabinetLightColor]);

  // Reset Everything handler
  const handleConfirmResetAll = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setRacks(DEFAULT_RACKS);
    setSelectedRackIds(['rack-1']);
    setSelectedDeviceId('inst-d2l-1');
    setCableConnections(DEFAULT_CABLE_CONNECTIONS);
    setActiveCableColor('#00f0ff');
    setCabinetLightColor('#00f0ff');
    setCableModeActive(false);
    setCableSourcePortId(null);
  };

  // Handle single or Shift-click multi-rack selection
  const handleSelectRack = (rackId, isShiftPressed = false) => {
    if (!rackId) {
      setSelectedRackIds([]);
      setSelectedDeviceId(null);
      return;
    }

    if (isShiftPressed) {
      if (selectedRackIds.includes(rackId)) {
        const next = selectedRackIds.filter((id) => id !== rackId);
        setSelectedRackIds(next);
      } else {
        setSelectedRackIds([...selectedRackIds, rackId]);
      }
    } else {
      if (selectedRackIds.length === 1 && selectedRackIds[0] === rackId) {
        setSelectedRackIds([]); // Deselect on second click
      } else {
        setSelectedRackIds([rackId]);
      }
    }
    setSelectedDeviceId(null);
  };

  // Add a new rack frame to the right
  const handleAddRack = () => {
    const nextNum = racks.length + 1;
    const newRackId = `rack-${Date.now().toString().slice(-4)}`;
    const newRack = {
      id: newRackId,
      name: `Rack ${nextNum}`,
      totalU: 42,
      items: [],
    };
    setRacks((prev) => [...prev, newRack]);

    if (selectedRackIds.length === 0) {
      // Overview Mode: Keep Overview Mode active (display all closed cabinets)
    } else if (selectedRackIds.length === 1) {
      // Single Rack Focus Mode: Switch focus to the new rack
      setSelectedRackIds([newRackId]);
    } else {
      // Multi-Rack Cabling Mode: Add new rack to existing selection
      setSelectedRackIds((prev) => [...prev, newRackId]);
    }
  };

  // Total switches count across all racks
  const totalItemsCount = racks.reduce((acc, r) => acc + r.items.length, 0);

  // Collect all switch items across all racks for modals
  const allRackItems = racks.flatMap((r) => r.items);

  // Port click handler
  const handlePortClick = (portObj, fullPortId) => {
    if (cableModeActive || cableSourcePortId) {
      if (!cableSourcePortId) {
        setCableSourcePortId(fullPortId);
      } else if (cableSourcePortId === fullPortId) {
        setCableSourcePortId(null);
      } else {
        // Create cable connection using active selected color!
        const newCable = {
          id: `cable-${Date.now().toString().slice(-4)}`,
          fromPortId: cableSourcePortId,
          toPortId: fullPortId,
          color: activeCableColor,
        };
        setCableConnections([...cableConnections, newCable]);
        setCableSourcePortId(null);
      }
    } else {
      setSelectedPort(portObj);
      setPortModalDeviceId(fullPortId.split(':')[0]);
    }
  };

  // Export Rack state to JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ racks, cableConnections }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nokia_dc_rack_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Rack state from JSON file
  const handleImportJSON = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.racks) setRacks(parsed.racks);
          else if (parsed.rackItems) {
            setRacks([{ id: 'rack-1', name: 'Rack 1', totalU: 42, items: parsed.rackItems }]);
          }
          if (parsed.cableConnections) setCableConnections(parsed.cableConnections);
        } catch (err) {
          alert('Invalid JSON rack configuration file.');
        }
      };
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header
        racks={racks}
        selectedRackIds={selectedRackIds}
        onSelectRack={handleSelectRack}
        onAddRack={handleAddRack}
        currentView={viewPreset}
        onSelectView={setViewPreset}
        onOpenBOM={() => setBomModalOpen(true)}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        cableModeActive={cableModeActive}
        onToggleCableMode={() => {
          setCableModeActive(!cableModeActive);
          if (cableSourcePortId) setCableSourcePortId(null);
        }}
        activeCableColor={activeCableColor}
        setActiveCableColor={setActiveCableColor}
        totalItemsCount={totalItemsCount}
        onOpenResetModal={() => setResetModalOpen(true)}
      />

      {/* Main Viewport + Sidebar */}
      <div className="main-layout">
        <div className="canvas-wrapper">
          <CanvasContainer
            racks={racks}
            selectedRackIds={selectedRackIds}
            onSelectRack={handleSelectRack}
            selectedDeviceId={selectedDeviceId}
            selectedPortId={selectedPort ? `${portModalDeviceId}:${selectedPort.id}` : null}
            cableSourcePortId={cableSourcePortId}
            onSelectDevice={(id) => setSelectedDeviceId(id)}
            onPortClick={handlePortClick}
            onPortHover={(p) => {}}
            doorOpen={doorOpen}
            cabinetLightColor={cabinetLightColor}
            cableConnections={cableConnections}
            viewPreset={viewPreset}
          />
        </div>

        {/* Sidebar Controls */}
        <Sidebar
          racks={racks}
          setRacks={setRacks}
          selectedRackIds={selectedRackIds}
          onSelectRack={handleSelectRack}
          onAddRack={handleAddRack}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          doorOpen={doorOpen}
          setDoorOpen={setDoorOpen}
          cabinetLightColor={cabinetLightColor}
          setCabinetLightColor={setCabinetLightColor}
          cableConnections={cableConnections}
          setCableConnections={setCableConnections}
          activeCableColor={activeCableColor}
          setActiveCableColor={setActiveCableColor}
        />
      </div>

      {/* Modals */}
      {selectedPort && (
        <PortModal
          selectedPort={selectedPort}
          deviceId={portModalDeviceId}
          rackItems={allRackItems}
          onClose={() => setSelectedPort(null)}
          onStartCableWiring={(fullPortId) => {
            setCableSourcePortId(fullPortId);
            setCableModeActive(true);
            setSelectedPort(null);
          }}
          cableSourcePortId={cableSourcePortId}
        />
      )}

      {bomModalOpen && (
        <BOMModal
          rackItems={allRackItems}
          onClose={() => setBomModalOpen(false)}
        />
      )}

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmResetAll}
      />
    </div>
  );
}
