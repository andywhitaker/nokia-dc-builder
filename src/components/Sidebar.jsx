import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sliders,
  Server,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Edit2,
  GripVertical,
  Layers,
  ArrowRightLeft,
  LayoutGrid,
} from 'lucide-react';
import { SWITCH_MODELS } from '../data/switchModels';
import { CABLE_COLOR_PALETTE } from '../App';
import {
  RACK_CONFIG,
  findAvailableSlot,
  moveItemU,
  compactRackFromTop,
  checkRackCollision,
  reorderRackItemsByDrag,
  resizeRackTotalU,
  sortRacksByGridX,
  reorderRowRacksInSlots,
} from '../utils/rackHelpers';

export function Sidebar({
  racks,
  setRacks,
  rows = [],
  setRows,
  selectedRowId,
  selectedRackIds = [],
  onSelectRack,
  onAddRack,
  selectedDeviceId,
  onSelectDevice,
  doorOpen,
  setDoorOpen,
  cabinetLightColor,
  setCabinetLightColor,
  cableConnections,
  setCableConnections,
  activeCableColor,
  setActiveCableColor,
}) {
  const [activeTab, setActiveTab] = useState('ELEVATION');
  const [selectedModelId, setSelectedModelId] = useState('IXR-D2L');
  const [customHostname, setCustomHostname] = useState('');
  const [targetU, setTargetU] = useState('');
  const [notification, setNotification] = useState(null);

  // Active Rack ID being edited in the side panel
  const [activeEditingRackId, setActiveEditingRackId] = useState(null);

  // Sync activeEditingRackId when selectedRackIds updates
  const effectiveRackId =
    selectedRackIds.includes(activeEditingRackId)
      ? activeEditingRackId
      : selectedRackIds[0] || null;

  const activeRack = racks.find((r) => r.id === effectiveRackId) || null;
  const rackItems = activeRack ? activeRack.items : [];
  const activeTotalU = activeRack?.totalU || 42;

  // Editable U Unit states
  const [editingUItemId, setEditingUItemId] = useState(null);
  const [editingUValue, setEditingUValue] = useState('');

  // Editable Switch Name states
  const [editingNameItemId, setEditingNameItemId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Editable Rack Name states
  const [editingRackId, setEditingRackId] = useState(null);
  const [editingRackValue, setEditingRackValue] = useState('');

  // Drag and Drop states for switch cards
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);

  // Drag and Drop states for rack cards in Overview mode
  const [draggedRackCardId, setDraggedRackCardId] = useState(null);
  const [dragOverRackCardId, setDragOverRackCardId] = useState(null);

  // Track recent swapped card IDs for animation feedback
  const [swappedCardIds, setSwappedCardIds] = useState([]);

  // Compute displayed racks for current row, sorted left-to-right matching floor grid coordinates
  const displayRacks = useMemo(() => {
    const list = selectedRowId && selectedRowId !== 'ALL'
      ? racks.filter((r) => r.rowId === selectedRowId)
      : racks;
    return sortRacksByGridX(list);
  }, [racks, selectedRowId]);

  const showNotification = (msg, type = 'SUCCESS') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const triggerSwapAnimation = (ids) => {
    setSwappedCardIds(ids);
    setTimeout(() => setSwappedCardIds([]), 800);
  };

  // Helper to update items in active editing rack
  const setRackItems = (newItemsOrFn) => {
    if (!effectiveRackId) return;
    setRacks((prevRacks) =>
      prevRacks.map((r) => {
        if (r.id !== effectiveRackId) return r;
        const updatedItems = typeof newItemsOrFn === 'function' ? newItemsOrFn(r.items) : newItemsOrFn;
        return { ...r, items: updatedItems };
      })
    );
  };

  // Resize active rack capacity (totalU), moving switches down if needed or throwing error if too small
  const handleUpdateRackTotalU = (newTotalU) => {
    if (!effectiveRackId || isNaN(newTotalU) || newTotalU < 1 || newTotalU > 60) return;

    if (newTotalU === activeTotalU) return;

    const res = resizeRackTotalU(rackItems, newTotalU);
    if (res.invalid) {
      showNotification(res.reason, 'ERROR');
      return;
    }

    setRacks((prev) =>
      prev.map((r) => {
        if (r.id !== effectiveRackId) return r;
        return { ...r, totalU: newTotalU, items: res.items };
      })
    );
    triggerSwapAnimation(res.items.map((it) => it.id));
    showNotification(`Updated ${activeRack?.name} capacity to ${newTotalU}U!`, 'SUCCESS');
  };

  // Move Rack left/right in row order, shuffling grid positions on the floor layout!
  const handleMoveRack = (rackId, dir) => {
    const updated = reorderRowRacksInSlots(racks, rackId, dir);
    setRacks(updated);
    showNotification('Reordered data center racks on floor layout', 'SUCCESS');
  };

  // Drag and Drop handlers for Rack cards in Overview mode
  const handleRackCardDragStart = (e, rackId) => {
    setDraggedRackCardId(rackId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', rackId);
  };

  const handleRackCardDragOver = (e, rackId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverRackCardId !== rackId) {
      setDragOverRackCardId(rackId);
    }
  };

  const handleRackCardDrop = (e, targetRackId) => {
    e.preventDefault();
    const id = draggedRackCardId || e.dataTransfer.getData('text/plain');
    setDraggedRackCardId(null);
    setDragOverRackCardId(null);

    if (!id || id === targetRackId) return;

    const targetIdx = displayRacks.findIndex((r) => r.id === targetRackId);
    if (targetIdx >= 0) {
      const updated = reorderRowRacksInSlots(racks, id, targetIdx);
      setRacks(updated);
      showNotification('Reordered data center racks on floor layout', 'SUCCESS');
    }
  };

  // Save renamed rack name
  const handleSaveRackName = (rackId) => {
    const newName = editingRackValue.trim();
    if (newName) {
      setRacks((prev) =>
        prev.map((r) => (r.id === rackId ? { ...r, name: newName } : r))
      );
      showNotification(`Renamed to "${newName}"`, 'SUCCESS');
    }
    setEditingRackId(null);
  };

  // Delete an empty rack
  const handleDeleteRack = (rackId) => {
    if (racks.length <= 1) {
      showNotification('Cannot delete the only rack frame', 'ERROR');
      return;
    }
    const target = racks.find((r) => r.id === rackId);
    if (target && target.items.length > 0) {
      if (!confirm(`Rack "${target.name}" contains ${target.items.length} switches. Remove rack and switches?`)) {
        return;
      }
    }
    setRacks(racks.filter((r) => r.id !== rackId));
    if (selectedRackIds.includes(rackId)) {
      onSelectRack(null);
    }
    showNotification('Rack removed from data center row', 'SUCCESS');
  };

  // Add new switch to active selected rack
  const handleAddDevice = (modelKey = selectedModelId) => {
    if (!effectiveRackId) {
      showNotification('Select a rack first to add switches', 'ERROR');
      return;
    }

    const model = SWITCH_MODELS[modelKey];
    if (!model) return;

    let desiredU = parseInt(targetU, 10);
    if (isNaN(desiredU)) {
      desiredU = findAvailableSlot(rackItems, model.heightU, activeTotalU);
    } else {
      const check = checkRackCollision(rackItems, desiredU, model.heightU, null, activeTotalU);
      if (check.invalid) {
        showNotification(check.reason || 'Rack Unit in Use', 'ERROR');
        return;
      }
    }

    if (!desiredU) {
      showNotification('Rack Unit in Use', 'ERROR');
      return;
    }

    const newId = `inst-${model.id.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const defaultName = customHostname.trim() || model.name;

    const newItem = {
      id: newId,
      modelId: model.id,
      startU: desiredU,
      customName: defaultName,
      status: 'ACTIVE',
    };

    const updated = [...rackItems, newItem].sort((a, b) => b.startU - a.startU);
    setRackItems(updated);
    onSelectDevice(newId);
    setCustomHostname('');
    setTargetU('');
    triggerSwapAnimation([newId]);
    showNotification(`Added ${model.name} at U${desiredU}!`, 'SUCCESS');
  };

  // Move switch UP or DOWN with Swap behavior & animation
  const handleMove = (id, dir) => {
    const updated = moveItemU(rackItems, id, dir, activeTotalU);
    const affectedSwapped = updated.filter((it) => {
      const old = rackItems.find((o) => o.id === it.id);
      return old && old.startU !== it.startU;
    }).map((it) => it.id);

    setRackItems(updated);
    if (affectedSwapped.length > 0) {
      triggerSwapAnimation(affectedSwapped);
    }
  };

  // Drag and Drop Event Handlers for Switches
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItemId !== id) {
      setDragOverItemId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const id = draggedItemId || e.dataTransfer.getData('text/plain');
    setDraggedItemId(null);
    setDragOverItemId(null);

    if (!id || id === targetId) return;

    const updated = reorderRackItemsByDrag(rackItems, id, targetId, activeTotalU);
    setRackItems(updated);
    triggerSwapAnimation([id, targetId]);
    showNotification('Reordered rack switches', 'SUCCESS');
  };

  // Change individual connected cable color
  const handleUpdateCableColor = (cableId, newColor) => {
    setCableConnections((prev) =>
      prev.map((c) => (c.id === cableId ? { ...c, color: newColor } : c))
    );
  };

  // Auto compact all devices from top down in active rack
  const handleCompact = () => {
    const compacted = compactRackFromTop(rackItems, activeTotalU);
    setRackItems(compacted);
    showNotification(`Rack items compacted from U${activeTotalU} down!`, 'SUCCESS');
  };

  // Delete switch item
  const handleDelete = (id) => {
    setRackItems(rackItems.filter((it) => it.id !== id));
    setCableConnections(cableConnections.filter((c) => !c.fromPortId.startsWith(id) && !c.toPortId.startsWith(id)));
    if (selectedDeviceId === id) onSelectDevice(null);
    showNotification('Device removed from rack.', 'SUCCESS');
  };

  // Submit direct U number edit for an item
  const handleSaveUEdit = (itemId) => {
    const item = rackItems.find((it) => it.id === itemId);
    if (!item) return;

    const model = SWITCH_MODELS[item.modelId] || { heightU: 1 };
    const newU = parseInt(editingUValue, 10);

    if (isNaN(newU) || newU < 1 || newU + model.heightU - 1 > activeTotalU) {
      showNotification('Rack Unit in Use', 'ERROR');
      setEditingUItemId(null);
      return;
    }

    if (newU === item.startU) {
      setEditingUItemId(null);
      return;
    }

    const check = checkRackCollision(rackItems, newU, model.heightU, itemId, activeTotalU);
    if (check.invalid) {
      showNotification(check.reason || 'Rack Unit in Use', 'ERROR');
      return;
    }

    const updated = rackItems
      .map((it) => (it.id === itemId ? { ...it, startU: newU } : it))
      .sort((a, b) => b.startU - a.startU);

    setRackItems(updated);
    setEditingUItemId(null);
    triggerSwapAnimation([itemId]);
    showNotification(`Moved switch to U${newU}`, 'SUCCESS');
  };

  // Submit direct switch name edit
  const handleSaveNameEdit = (itemId) => {
    const newName = editingNameValue.trim();
    if (!newName) {
      setEditingNameItemId(null);
      return;
    }

    setRackItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, customName: newName } : it))
    );
    setEditingNameItemId(null);
    showNotification(`Renamed switch to "${newName}"`, 'SUCCESS');
  };

  const sortedItems = [...rackItems].sort((a, b) => b.startU - a.startU);

  return (
    <aside className="sidebar-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`toast-notification ${notification.type.toLowerCase()}`}>
          {notification.type === 'ERROR' ? (
            <AlertCircle size={16} style={{ color: '#ef4444' }} />
          ) : (
            <CheckCircle size={16} style={{ color: '#10b981' }} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sidebar Navigation Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === 'ELEVATION' ? 'active' : ''}`}
          onClick={() => setActiveTab('ELEVATION')}
        >
          <Server size={15} /> Rack Order
        </button>
        <button
          className={`tab-btn ${activeTab === 'CATALOG' ? 'active' : ''}`}
          onClick={() => setActiveTab('CATALOG')}
        >
          <Plus size={15} /> Add Switch
        </button>
        <button
          className={`tab-btn ${activeTab === 'CABINET' ? 'active' : ''}`}
          onClick={() => setActiveTab('CABINET')}
        >
          <Sliders size={15} /> Cabinet & Wiring
        </button>
      </div>

      {/* TAB 1: RACK ELEVATION / OVERVIEW MODE */}
      {activeTab === 'ELEVATION' && (
        <div className="tab-content">
          {/* MODE A: OVERVIEW MODE (NO RACKS SELECTED) -> CLOSED CABINETS */}
          {selectedRackIds.length === 0 ? (
            <div>
              <div className="tab-header">
                <div>
                  <h3>Data Center Overview (Closed Cabinets)</h3>
                  <p className="tab-desc">Drag or use arrows to re-order racks on the floor plan layout.</p>
                </div>
                <button className="sm-btn" onClick={onAddRack} title="Add new rack frame">
                  + Add Rack
                </button>
              </div>

              <div className="elevation-list">
                {displayRacks.map((r, rIdx) => {
                  const totalUUsed = r.items.reduce((acc, it) => {
                    const m = SWITCH_MODELS[it.modelId] || { heightU: 1 };
                    return acc + (m.heightU || 1);
                  }, 0);
                  const isEditingRack = editingRackId === r.id;
                  const rackMaxU = r.totalU || 42;
                  const isDraggingRackCard = draggedRackCardId === r.id;
                  const isDragOverRackCard = dragOverRackCardId === r.id;

                  return (
                    <div
                      key={r.id}
                      draggable={true}
                      onDragStart={(e) => handleRackCardDragStart(e, r.id)}
                      onDragOver={(e) => handleRackCardDragOver(e, r.id)}
                      onDragLeave={() => setDragOverRackCardId(null)}
                      onDrop={(e) => handleRackCardDrop(e, r.id)}
                      className={`elevation-card rack-row-card ${isDraggingRackCard ? 'dragging' : ''} ${isDragOverRackCard ? 'drag-over' : ''}`}
                      onClick={(e) => onSelectRack(r.id, e.shiftKey)}
                    >
                      <div className="drag-handle" title="Drag to re-order rack in row">
                        <GripVertical size={16} className="drag-icon" />
                      </div>

                      <div className="card-info" onClick={(e) => e.stopPropagation()}>
                        {isEditingRack ? (
                          <input
                            type="text"
                            autoFocus
                            className="device-name-input"
                            value={editingRackValue}
                            onChange={(e) => setEditingRackValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRackName(r.id);
                              if (e.key === 'Escape') setEditingRackId(null);
                            }}
                            onBlur={() => handleSaveRackName(r.id)}
                          />
                        ) : (
                          <div
                            className="device-name-wrapper"
                            onClick={() => {
                              setEditingRackId(r.id);
                              setEditingRackValue(r.name);
                            }}
                            title="Click to rename rack"
                          >
                            <h4 className="device-name">{r.name} ({rackMaxU}U)</h4>
                            <Edit2 size={11} className="name-edit-icon" />
                          </div>
                        )}
                        <p className="device-model">
                          {r.items.length} Switches ({totalUUsed}U / {rackMaxU}U Occupied)
                        </p>
                      </div>

                      {/* Row Reorder Controls */}
                      <div className="reorder-controls" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="reorder-btn"
                          disabled={rIdx === 0}
                          onClick={() => handleMoveRack(r.id, 'UP')}
                          title="Move Rack Left in Row"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          className="reorder-btn"
                          disabled={rIdx === displayRacks.length - 1}
                          onClick={() => handleMoveRack(r.id, 'DOWN')}
                          title="Move Rack Right in Row"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          className="reorder-btn danger"
                          onClick={() => handleDeleteRack(r.id)}
                          title="Remove Rack Frame"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* MODE B: FOCUS MODE -> SINGLE OR MULTI-RACK SELECTED */
            <div>
              <div className="tab-header">
                <div>
                  <div className="rack-title-row">
                    <h3>{activeRack?.name} ({activeTotalU}U)</h3>
                  </div>
                  <p className="tab-desc">
                    {selectedRackIds.length > 1
                      ? `Viewing ${activeRack?.name} (${selectedRackIds.length} racks active in 3D)`
                      : `Top-to-bottom U elevation list for ${activeRack?.name}.`}
                  </p>
                </div>
                <div className="elevation-tools">
                  <button className="sm-btn" onClick={handleCompact} title={`Snap all devices to U${activeTotalU} top slots`}>
                    Snap Top
                  </button>
                  <button
                    className="sm-btn danger"
                    onClick={() => {
                      if (confirm(`Clear all devices from ${activeRack?.name}?`)) {
                        setRackItems([]);
                      }
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Multi-Rack Side Panel Filter Pill Selector (Ordered left-to-right matching row order) */}
              {selectedRackIds.length > 1 && (
                <div className="multi-rack-selector-pills">
                  {sortRacksByGridX(racks.filter((r) => selectedRackIds.includes(r.id))).map((rObj) => (
                    <button
                      key={rObj.id}
                      className={`rack-pill-btn ${effectiveRackId === rObj.id ? 'active' : ''}`}
                      onClick={() => setActiveEditingRackId(rObj.id)}
                      title={`View ${rObj.name} switches in side panel`}
                    >
                      {rObj.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="elevation-list">
                {sortedItems.length === 0 ? (
                  <div className="empty-rack-state">
                    <p>Rack is empty.</p>
                    <button className="btn-primary" onClick={() => setActiveTab('CATALOG')}>
                      + Add Switch to {activeRack?.name}
                    </button>
                  </div>
                ) : (
                  sortedItems.map((item) => {
                    const model = SWITCH_MODELS[item.modelId] || {};
                    const endU = item.startU + (model.heightU || 1) - 1;
                    const isSelected = selectedDeviceId === item.id;
                    const isNokia7220 = model.series === '7220 IXR Line';
                    const isEditingThisU = editingUItemId === item.id;
                    const isEditingThisName = editingNameItemId === item.id;
                    const isSwappingAnim = swappedCardIds.includes(item.id);
                    const isDragging = draggedItemId === item.id;
                    const isDragOver = dragOverItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={() => setDragOverItemId(null)}
                        onDrop={(e) => handleDrop(e, item.id)}
                        className={`elevation-card ${isSelected ? 'selected' : ''} ${
                          isNokia7220 ? 'nokia-card' : ''
                        } ${isSwappingAnim ? 'swapping-card-anim' : ''} ${
                          isDragging ? 'dragging' : ''
                        } ${isDragOver ? 'drag-over' : ''}`}
                        onClick={() => onSelectDevice(item.id)}
                      >
                        {/* Drag Handle Icon */}
                        <div className="drag-handle" title="Drag to re-order switch">
                          <GripVertical size={14} className="drag-icon" />
                        </div>

                        {/* Editable U Badge Component */}
                        <div
                          className={`u-badge editable ${isEditingThisU ? 'editing' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUItemId(item.id);
                            setEditingUValue(item.startU.toString());
                          }}
                          title="Click to edit U position directly"
                        >
                          {isEditingThisU ? (
                            <input
                              type="number"
                              min="1"
                              max={activeTotalU}
                              autoFocus
                              className="u-inline-input"
                              value={editingUValue}
                              onChange={(e) => setEditingUValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveUEdit(item.id);
                                if (e.key === 'Escape') setEditingUItemId(null);
                              }}
                              onBlur={() => handleSaveUEdit(item.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <>
                              <div className="u-number-display">
                                <span>U{item.startU === endU ? item.startU : `${endU}-${item.startU}`}</span>
                                <Edit2 size={10} className="edit-icon" />
                              </div>
                              <small>{model.heightU}U</small>
                            </>
                          )}
                        </div>

                        {/* Interactive Switch Hostname / Name Display */}
                        <div className="card-info" onClick={(e) => e.stopPropagation()}>
                          {isEditingThisName ? (
                            <input
                              type="text"
                              autoFocus
                              className="device-name-input"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNameEdit(item.id);
                                if (e.key === 'Escape') setEditingNameItemId(null);
                              }}
                              onBlur={() => handleSaveNameEdit(item.id)}
                            />
                          ) : (
                            <div
                              className="device-name-wrapper"
                              onClick={() => {
                                setEditingNameItemId(item.id);
                                setEditingNameValue(item.customName || model.name);
                              }}
                              title="Click to edit switch hostname"
                            >
                              <h4 className="device-name">{item.customName || model.name}</h4>
                              <Edit2 size={11} className="name-edit-icon" />
                            </div>
                          )}
                          <p className="device-model">{model.name}</p>
                        </div>

                        {/* Reorder Buttons (UP / DOWN) */}
                        <div className="reorder-controls" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="reorder-btn"
                            onClick={() => handleMove(item.id, 'UP')}
                            title="Move Up 1U (Swap if occupied)"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            className="reorder-btn"
                            onClick={() => handleMove(item.id, 'DOWN')}
                            title="Move Down 1U (Swap if occupied)"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            className="reorder-btn danger"
                            onClick={() => handleDelete(item.id)}
                            title="Remove Switch"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SWITCH CATALOG & ADD MENU */}
      {activeTab === 'CATALOG' && (
        <div className="tab-content">
          <h3>Add Switch to {activeRack ? activeRack.name : 'Rack'} ({activeTotalU}U)</h3>
          <p className="tab-desc">Select device or rack accessory</p>

          {/* Multi-Rack Side Panel Selector Pills in Add Switch Tab (Ordered left-to-right matching row order) */}
          {selectedRackIds.length > 1 && (
            <div className="multi-rack-selector-pills">
              {racks
                .filter((r) => selectedRackIds.includes(r.id))
                .map((rObj) => (
                  <button
                    key={rObj.id}
                    className={`rack-pill-btn ${effectiveRackId === rObj.id ? 'active' : ''}`}
                    onClick={() => setActiveEditingRackId(rObj.id)}
                  >
                    {rObj.name}
                  </button>
                ))}
            </div>
          )}

          <div className="catalog-grid">
            {Object.values(SWITCH_MODELS).map((model) => (
              <div
                key={model.id}
                className={`catalog-card ${selectedModelId === model.id ? 'active' : ''}`}
                onClick={() => setSelectedModelId(model.id)}
              >
                <div className="model-header">
                  <span className="model-name">{model.name}</span>
                  <span className="u-tag">{model.heightU}U</span>
                </div>
                <p className="model-desc">{model.description}</p>
                <div className="model-specs">
                  <span>⚡ {model.powerWatts}W</span>
                  <span>🔌 {model.ports?.length || 0} Ports</span>
                </div>
              </div>
            ))}
          </div>

          <div className="add-form">
            <div className="form-group">
              <label>Custom Hostname / Tag (Optional)</label>
              <input
                type="text"
                placeholder="e.g. dc1-spine-sw01"
                value={customHostname}
                onChange={(e) => setCustomHostname(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Start U Slot (Leave blank for auto-top U{activeTotalU})</label>
              <input
                type="number"
                min="1"
                max={activeTotalU}
                placeholder={`Auto top slot (U${activeTotalU})`}
                value={targetU}
                onChange={(e) => setTargetU(e.target.value)}
              />
            </div>

            <button className="btn-primary" onClick={() => handleAddDevice()}>
              <Plus size={16} /> Add {SWITCH_MODELS[selectedModelId]?.name} to {activeRack ? activeRack.name : 'Rack'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: CABINET & WIRING SETTINGS */}
      {activeTab === 'CABINET' && (
        <div className="tab-content">
          <h3>Cabinet & Visual Controls</h3>

          {/* Dynamic Rack Capacity (Total Us) Control */}
          <div className="setting-card col">
            <div className="setting-label">
              <span>Cabinet Height ({activeRack ? activeRack.name : 'Active Rack'})</span>
              <small>Set total U capacity for cabinet (Default: 42U)</small>
            </div>
            
            <div className="u-capacity-control-row">
              <div className="u-capacity-input-wrap">
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="u-capacity-input"
                  value={activeTotalU}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) handleUpdateRackTotalU(val);
                  }}
                />
                <span className="u-suffix">Rack Units</span>
              </div>

              <div className="u-preset-buttons">
                {[12, 24, 42, 48, 52].map((presetU) => (
                  <button
                    key={presetU}
                    className={`preset-u-btn ${activeTotalU === presetU ? 'active' : ''}`}
                    onClick={() => handleUpdateRackTotalU(presetU)}
                  >
                    {presetU}U
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="setting-card">
            <div className="setting-label">
              <span>Interior Cabinet LED Light</span>
              <small>Data Center Accent Lighting</small>
            </div>
            <div className="color-picker-row">
              {['#00f0ff', '#005aff', '#a855f7', '#10b981', '#f59e0b'].map((hex) => (
                <button
                  key={hex}
                  className={`color-dot ${cabinetLightColor === hex ? 'selected' : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setCabinetLightColor(hex)}
                />
              ))}
            </div>
          </div>

          {/* Active Patch Cable Drawing Color */}
          <div className="setting-card col">
            <div className="setting-label">
              <span>Active Patch Cable Color</span>
              <small>Color applied to new cable connections</small>
            </div>
            <div className="color-picker-grid">
              {CABLE_COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch-btn ${activeCableColor === c.hex ? 'active' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setActiveCableColor(c.hex)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <hr className="divider" />

          <h3>Connected Patch Cables ({cableConnections.length})</h3>
          <div className="cables-list">
            {cableConnections.length === 0 ? (
              <p className="empty-text">No patch cables connected. Enable Wiring Mode in header to add cables.</p>
            ) : (
              cableConnections.map((cable) => (
                <div key={cable.id} className="cable-item">
                  <div className="cable-info-col">
                    <div className="cable-label">{cable.fromPortId} ➔ {cable.toPortId}</div>
                    
                    <div className="cable-swatch-row">
                      {CABLE_COLOR_PALETTE.map((cp) => (
                        <button
                          key={cp.hex}
                          className={`mini-color-dot ${cable.color === cp.hex ? 'active' : ''}`}
                          style={{ backgroundColor: cp.hex }}
                          onClick={() => handleUpdateCableColor(cable.id, cp.hex)}
                          title={`Change cable color to ${cp.label}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className="sm-btn danger icon-only"
                    onClick={() =>
                      setCableConnections(cableConnections.filter((c) => c.id !== cable.id))
                    }
                    title="Disconnect Cable"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
