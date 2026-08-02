import React, { useState, useRef, useEffect } from 'react';
import {
  Server,
  Plus,
  Zap,
  RotateCcw,
  Eye,
  Boxes,
  Cable,
  FileDown,
  FileUp,
  LayoutGrid,
  Layers,
  MoreVertical,
} from 'lucide-react';
import { CABLE_COLOR_PALETTE } from '../App';

export function Header({
  racks = [],
  selectedRackIds = [],
  onSelectRack,
  onAddRack,
  currentView = 'ISO',
  onSelectView,
  onOpenBOM,
  onExportJSON,
  onImportJSON,
  cableModeActive,
  onToggleCableMode,
  activeCableColor,
  setActiveCableColor,
  totalItemsCount = 0,
  onOpenResetModal,
}) {
  const isOverviewMode = selectedRackIds.length === 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header-bar">
      {/* Brand Title */}
      <div className="brand-group">
        <div className="brand-logo">
          <Layers size={22} className="brand-icon" />
        </div>
        <div>
          <h1 className="brand-title">
            <span>NOKIA</span> DC Rack Builder
          </h1>
        </div>
      </div>

      {/* Multi-Rack Selector Bar with Shift-Click Support */}
      <div className="rack-selector-bar" title="Click to select a rack. Shift-Click to select multiple racks for cross-rack cabling!">
        <span className="rack-bar-label">Racks:</span>
        <button
          className={`rack-badge-btn ${isOverviewMode ? 'active' : ''}`}
          onClick={() => onSelectRack(null)}
          title="Show All Racks (Overview Closed Cabinets)"
        >
          <LayoutGrid size={13} /> Overview
        </button>

        {racks.map((r) => {
          const isSelected = selectedRackIds.includes(r.id);
          return (
            <button
              key={r.id}
              className={`rack-badge-btn ${isSelected ? 'active' : ''}`}
              onClick={(e) => onSelectRack(r.id, e.shiftKey)}
              title={`${r.name} (Hold Shift to select multiple)`}
            >
              <Server size={13} /> {r.name}
            </button>
          );
        })}

        <button
          className="rack-badge-btn add-rack-btn"
          onClick={onAddRack}
          title="Add New Rack Frame to Data Center Row"
        >
          <Plus size={13} /> Add Rack
        </button>
      </div>

      {/* View Presets Navigation */}
      <div className="view-presets">
        <button
          className={`preset-btn ${currentView === 'FRONT' ? 'active' : ''}`}
          onClick={() => onSelectView('FRONT')}
          title="Front View (0°)"
        >
          <Eye size={15} /> Front
        </button>
        <button
          className={`preset-btn ${currentView === 'BACK' ? 'active' : ''}`}
          onClick={() => onSelectView('BACK')}
          title="Rear View (180° - PSUs & Fans)"
        >
          <RotateCcw size={15} /> Rear
        </button>
        <button
          className={`preset-btn ${currentView === 'ISO' ? 'active' : ''}`}
          onClick={() => onSelectView('ISO')}
          title="3D Perspective View"
        >
          <Boxes size={15} /> 3D Iso
        </button>
      </div>

      {/* Quick Action Tools */}
      <div className="header-actions">
        {/* Active Cable Color Palette Selector (Only visible when Wiring Mode is active) */}
        {cableModeActive && (
          <div className="header-cable-palette" title="Active Patch Cable Drawing Color">
            <span className="palette-label">Cable Color:</span>
            {CABLE_COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                className={`header-color-dot ${activeCableColor === c.hex ? 'active' : ''}`}
                style={{ backgroundColor: c.hex }}
                onClick={() => setActiveCableColor(c.hex)}
                title={c.label}
              />
            ))}
          </div>
        )}

        <button
          className={`action-btn cable-btn ${cableModeActive ? 'active' : ''}`}
          onClick={onToggleCableMode}
          title="Interactive Port-to-Port Cable Wiring Mode"
        >
          <Cable size={16} /> Wiring Mode
        </button>

        <button className="action-btn" onClick={onOpenBOM} title="Bill of Materials & Specs">
          <Zap size={16} /> Rack Specs & BOM ({totalItemsCount})
        </button>

        <div className="file-io-group">
          <button className="icon-btn" onClick={onExportJSON} title="Export Rack Layout (JSON)">
            <FileDown size={17} />
          </button>
          <label className="icon-btn" title="Import Rack Layout (JSON)">
            <FileUp size={17} />
            <input
              type="file"
              accept=".json"
              onChange={onImportJSON}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* 3-Dots Action Menu at Far Right */}
        <div className="header-menu-container" ref={menuRef}>
          <button
            className={`icon-btn menu-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            title="More Options"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="header-dropdown-menu">
              <button
                className="dropdown-item danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onOpenResetModal();
                }}
              >
                <RotateCcw size={15} /> Reset All Data
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
