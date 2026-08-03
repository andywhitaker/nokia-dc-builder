import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasContainer } from './components/CanvasContainer';
import { FloorPlanContainer } from './components/FloorPlanContainer';
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

const DEFAULT_ROWS = [
  { id: 'row-a', name: 'Row A (Spine & Core)', color: '#00f0ff', rowIndex: 2 },
  { id: 'row-b', name: 'Row B (Leaf Switches)', color: '#005aff', rowIndex: 6 },
];

const DEFAULT_RACKS = [
  {
    id: 'rack-1',
    name: 'Rack 1',
    rowId: 'row-a',
    gridX: 2,
    gridY: 2,
    totalU: 42,
    items: INITIAL_RACK_ITEMS,
  },
  {
    id: 'rack-2',
    name: 'Rack 2',
    rowId: 'row-a',
    gridX: 3,
    gridY: 2,
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

  // Primary View Mode: 'ELEVATION' | 'FLOOR_PLAN'
  const [mainViewMode, setMainViewMode] = useState('ELEVATION');

  // Named Data Center Rows State
  const [rows, setRows] = useState(() => savedState?.rows || DEFAULT_ROWS);
  
  // Default selectedRowId to first row ('row-a') on initial visit instead of 'ALL'
  const [selectedRowId, setSelectedRowId] = useState(() => savedState?.selectedRowId || 'row-a');

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
        rows,
        selectedRowId,
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
  }, [rows, selectedRowId, racks, selectedRackIds, cableConnections, activeCableColor, cabinetLightColor]);

  // Reset Everything handler
  const handleConfirmResetAll = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setRows(DEFAULT_ROWS);
    setSelectedRowId('row-a');
    setRacks(DEFAULT_RACKS);
    setSelectedRackIds(['rack-1']);
    setSelectedDeviceId('inst-d2l-1');
    setCableConnections(DEFAULT_CABLE_CONNECTIONS);
    setActiveCableColor('#00f0ff');
    setCabinetLightColor('#00f0ff');
    setCableModeActive(false);
    setCableSourcePortId(null);
  };

  // Row selection handler: automatically defaults back to Overview button mode when switching rows!
  const handleSelectRow = useCallback((rowId) => {
    setSelectedRowId(rowId);
    setSelectedRackIds([]); // Reset to Overview Mode for the newly selected row
    setSelectedDeviceId(null);
  }, []);

  // Performance-optimized handleSelectRack with useCallback
  const handleSelectRack = useCallback((rackId, isShiftPressed = false) => {
    if (!rackId) {
      setSelectedRackIds([]);
      setSelectedDeviceId(null);
      return;
    }

    setSelectedRackIds((prevSelected) => {
      if (isShiftPressed) {
        if (prevSelected.includes(rackId)) {
          return prevSelected.filter((id) => id !== rackId);
        } else {
          return [...prevSelected, rackId];
        }
      } else {
        if (prevSelected.length === 1 && prevSelected[0] === rackId) {
          return []; // Deselect on second click
        } else {
          return [rackId];
        }
      }
    });
    setSelectedDeviceId(null);
  }, []);

  // Add a new rack frame placed directly to the RIGHT of the last rack in the active row
  const handleAddRack = useCallback(() => {
    const newRackId = `rack-${Date.now().toString().slice(-4)}`;

    setRacks((prevRacks) => {
      const nextNum = prevRacks.length + 1;
      let activeRow = rows.find((r) => r.id === selectedRowId) || rows[0];
      const racksInRow = activeRow ? prevRacks.filter((r) => r.rowId === activeRow.id) : [];

      let newX = 0;
      let newY = activeRow ? activeRow.rowIndex : 2;

      if (racksInRow.length > 0) {
        const maxGridX = Math.max(...racksInRow.map((r) => (r.gridX !== undefined ? r.gridX : 0)));
        newX = Math.min(15, maxGridX + 1);
        newY = racksInRow[0].gridY !== undefined ? racksInRow[0].gridY : newY;
      } else {
        newX = 0;
      }

      const newRack = {
        id: newRackId,
        name: `Rack ${nextNum}`,
        rowId: activeRow ? activeRow.id : null,
        gridX: newX,
        gridY: newY,
        totalU: 42,
        items: [],
      };

      return [...prevRacks, newRack];
    });

    setSelectedRackIds((prevSelected) => {
      if (prevSelected.length === 0) return [];
      if (prevSelected.length === 1) return [newRackId];
      return [...prevSelected, newRackId];
    });
  }, [rows, selectedRowId]);

  // Total switches count across all racks
  const totalItemsCount = useMemo(() => {
    return racks.reduce((acc, r) => acc + r.items.length, 0);
  }, [racks]);

  // Memoized switch items for modals
  const allRackItems = useMemo(() => {
    return racks.flatMap((r) => r.items);
  }, [racks]);

  // Memoized visible racks for 3D view (Filters strictly by selectedRowId)
  const visible3DRacks = useMemo(() => {
    return selectedRowId === 'ALL'
      ? racks
      : racks.filter((r) => r.rowId === selectedRowId);
  }, [racks, selectedRowId]);

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
      JSON.stringify({ rows, racks, cableConnections }, null, 2)
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
          if (parsed.rows) setRows(parsed.rows);
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
        rows={rows}
        selectedRowId={selectedRowId}
        onSelectRow={handleSelectRow}
        selectedRackIds={selectedRackIds}
        onSelectRack={handleSelectRack}
        onAddRack={handleAddRack}
        currentView={viewPreset}
        onSelectView={setViewPreset}
        mainViewMode={mainViewMode}
        onChangeMainViewMode={setMainViewMode}
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
          {mainViewMode === 'ELEVATION' ? (
            <CanvasContainer
              racks={visible3DRacks}
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
          ) : (
            <FloorPlanContainer
              racks={racks}
              setRacks={setRacks}
              rows={rows}
              setRows={setRows}
              selectedRackIds={selectedRackIds}
              onSelectRack={handleSelectRack}
              onAddRack={handleAddRack}
              onSwitchToElevation={() => setMainViewMode('ELEVATION')}
              selectedRowId={selectedRowId}
              onSelectRow={handleSelectRow}
            />
          )}
        </div>

        {/* Sidebar Controls - Only rendered in 3D Elevation View */}
        {mainViewMode === 'ELEVATION' && (
          <Sidebar
            racks={racks}
            setRacks={setRacks}
            rows={rows}
            setRows={setRows}
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
            mainViewMode={mainViewMode}
          />
        )}
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
