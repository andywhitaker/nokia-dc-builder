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
  Grid,
  ChevronLeft,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { CABLE_COLOR_PALETTE } from '../App';
import { sortRacksByGridX } from '../utils/rackHelpers';

export function Header({
  racks = [],
  rows = [],
  selectedRowId = 'ALL',
  onSelectRow,
  selectedRackIds = [],
  onSelectRack,
  onAddRack,
  currentView = 'ISO',
  onSelectView,
  mainViewMode = 'ELEVATION',
  onChangeMainViewMode,
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
  const [paletteOpen, setPaletteOpen] = useState(false);

  const menuRef = useRef(null);
  const paletteRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Close dropdown menu & color popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine active row in 3D Elevation (Strict single-select, no 'ALL' option)
  const activeElevationRowId = rows.some((r) => r.id === selectedRowId)
    ? selectedRowId
    : rows[0]?.id || 'ALL';

  // Filter visible racks by selected row, sorted left-to-right matching floor grid
  const currentActiveRowId = mainViewMode === 'ELEVATION' ? activeElevationRowId : selectedRowId;
  const filteredRacks = sortRacksByGridX(
    currentActiveRowId === 'ALL'
      ? racks
      : racks.filter((r) => r.rowId === currentActiveRowId)
  );

  // Scroll rack badges left/right
  const handleScrollRacks = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'LEFT' ? -180 : 180;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <header className="header-container">
      {/* PRIMARY TOP HEADER BAR */}
      <div className="header-top-bar">
        {/* Top-Left: Logo Anchored to Far Left + View Mode Switcher */}
        <div className="brand-group">
          <div className="brand-logo">
            <Layers size={22} className="brand-icon" />
          </div>
          <h1 className="brand-title">
            <span>NOKIA</span> DC Builder
          </h1>

          {/* View Mode Switcher (Anchored right next to logo) */}
          <div className="view-mode-toggle">
            <button
              className={`mode-toggle-btn ${mainViewMode === 'ELEVATION' ? 'active' : ''}`}
              onClick={() => onChangeMainViewMode('ELEVATION')}
              title="3D Rack Elevation View"
            >
              <Server size={14} /> 3D Elevation
            </button>
            <button
              className={`mode-toggle-btn ${mainViewMode === 'FLOOR_PLAN' ? 'active' : ''}`}
              onClick={() => onChangeMainViewMode('FLOOR_PLAN')}
              title="Data Center Overhead Floor Plan View"
            >
              <Grid size={14} /> Floor Plan
            </button>
          </div>
        </div>

        {/* Top-Right: Contextual Actions */}
        <div className="header-actions">
          {/* 3D ELEVATION SPECIFIC CONTROLS */}
          {mainViewMode === 'ELEVATION' && (
            <>
              {/* Compact Single-Row Dropdown Selector (No "All Rows" option) */}
              {rows.length > 0 && (
                <div className="header-row-dropdown-group" title="Select single row to view in 3D Elevation">
                  <span className="dropdown-label">Row:</span>
                  <select
                    className="header-row-dropdown"
                    value={activeElevationRowId}
                    onChange={(e) => onSelectRow(e.target.value)}
                  >
                    {rows.map((rw) => {
                      const count = racks.filter((r) => r.rowId === rw.id).length;
                      return (
                        <option key={rw.id} value={rw.id}>
                          {rw.name} ({count} racks)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="view-presets">
                <button
                  className={`preset-btn ${currentView === 'FRONT' ? 'active' : ''}`}
                  onClick={() => onSelectView('FRONT')}
                  title="Front View (0°)"
                >
                  <Eye size={14} /> Front
                </button>
                <button
                  className={`preset-btn ${currentView === 'BACK' ? 'active' : ''}`}
                  onClick={() => onSelectView('BACK')}
                  title="Rear View (180° - PSUs & Fans)"
                >
                  <RotateCcw size={14} /> Rear
                </button>
                <button
                  className={`preset-btn ${currentView === 'ISO' ? 'active' : ''}`}
                  onClick={() => onSelectView('ISO')}
                  title="3D Perspective View"
                >
                  <Boxes size={14} /> 3D Iso
                </button>
              </div>

              {/* Compact Color Picker Popover Trigger for Wiring Mode */}
              {cableModeActive && (
                <div className="header-cable-picker-wrapper" ref={paletteRef}>
                  <button
                    className="cable-color-trigger-btn"
                    onClick={() => setPaletteOpen(!paletteOpen)}
                    title="Active Cable Color (Click to change)"
                  >
                    <span
                      className="active-color-swatch"
                      style={{ backgroundColor: activeCableColor }}
                    />
                    <Palette size={13} />
                  </button>

                  {paletteOpen && (
                    <div className="cable-color-popover-menu">
                      <div className="popover-title">Active Cable Color</div>
                      <div className="popover-colors-grid">
                        {CABLE_COLOR_PALETTE.map((c) => (
                          <button
                            key={c.hex}
                            className={`popover-color-dot ${activeCableColor === c.hex ? 'active' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => {
                              setActiveCableColor(c.hex);
                              setPaletteOpen(false);
                            }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className={`action-btn cable-btn ${cableModeActive ? 'active' : ''}`}
                onClick={onToggleCableMode}
                title="Interactive Port-to-Port Cable Wiring Mode"
              >
                <Cable size={15} /> Wiring Mode
              </button>
            </>
          )}

          {/* Shared Action Tools */}
          <button className="action-btn" onClick={onOpenBOM} title="Bill of Materials & Specs">
            <Zap size={15} /> Specs & BOM ({totalItemsCount})
          </button>

          <div className="file-io-group">
            <button className="icon-btn" onClick={onExportJSON} title="Export Rack Layout (JSON)">
              <FileDown size={16} />
            </button>
            <label className="icon-btn" title="Import Rack Layout (JSON)">
              <FileUp size={16} />
              <input
                type="file"
                accept=".json"
                onChange={onImportJSON}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* 3-Dots Action Menu */}
          <div className="header-menu-container" ref={menuRef}>
            <button
              className={`icon-btn menu-btn ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              title="More Options"
            >
              <MoreVertical size={16} />
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
      </div>

      {/* DEDICATED SUB-BAR: ONLY RENDERED IN 3D ELEVATION VIEW */}
      {mainViewMode === 'ELEVATION' && (
        <div className="rack-selector-subbar">
          <button
            className="rack-scroll-arrow left"
            onClick={() => handleScrollRacks('LEFT')}
            title="Scroll Racks Left"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="rack-badges-scroll-container" ref={scrollContainerRef}>
            <button
              className={`rack-badge-btn ${isOverviewMode ? 'active' : ''}`}
              onClick={() => onSelectRack(null)}
              title="Show All Racks in Active Row"
            >
              <LayoutGrid size={13} /> Overview ({filteredRacks.length})
            </button>

            {filteredRacks.map((r) => {
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
          </div>

          <button
            className="rack-scroll-arrow right"
            onClick={() => handleScrollRacks('RIGHT')}
            title="Scroll Racks Right"
          >
            <ChevronRight size={15} />
          </button>

          <button
            className="rack-badge-btn add-rack-btn"
            onClick={onAddRack}
            title="Add New Rack Frame (Placed to the Right in Active Row)"
          >
            <Plus size={13} /> Add Rack
          </button>
        </div>
      )}
    </header>
  );
}
