import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Edit2,
  Sliders,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react';

const GRID_COLS = 16;
const GRID_ROWS = 12;

export function FloorPlanContainer({
  racks = [],
  setRacks,
  rows = [],
  setRows,
  selectedRackIds = [],
  onSelectRack,
  onAddRack,
  onSwitchToElevation,
  selectedRowId,
  onSelectRow,
}) {
  const matrixRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Marquee rectangle box selection state
  const [boxSelect, setBoxSelect] = useState(null);

  // Combine Rows modal selection state
  const [combineSelectedLabel, setCombineSelectedLabel] = useState('');
  const [combineCustomName, setCombineCustomName] = useState('');

  // Track selection of a row corridor label
  const [selectedCorridorRowId, setSelectedCorridorRowId] = useState(null);

  // Custom U Input state in top selection bar
  const [isCustomUInput, setIsCustomUInput] = useState(false);
  const [customUText, setCustomUText] = useState('');

  const [draggedRackId, setDraggedRackId] = useState(null);
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredRowCorridorIdx, setHoveredRowCorridorIdx] = useState(null);

  // Custom Right-Click Context Menu State (RACK, ROW, or MULTI_RACKS)
  const [contextMenu, setContextMenu] = useState(null);

  // App-Native Modal State
  const [modalState, setModalState] = useState({ isOpen: false });
  const [modalInputValue, setModalInputValue] = useState('');
  const [modalUValue, setModalUValue] = useState(42);

  // Shake feedback animation state for invalid row moves
  const [shakingRowId, setShakingRowId] = useState(null);

  // Selected Rack object (if exactly 1 rack is selected)
  const singleSelectedRack = selectedRackIds.length === 1
    ? racks.find((r) => r.id === selectedRackIds[0])
    : null;

  // Selected Row object (if corridor row label is selected)
  const selectedRowObj = rows.find((rw) => rw.id === selectedCorridorRowId);

  // Close context menu on global click or scroll
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu);
    };
  }, []);

  // Handle Canvas Panning & Shift+Drag Marquee Rectangle Selection
  const handleCanvasMouseDown = (e) => {
    if (
      e.target.closest('.rack-square-tile') ||
      e.target.closest('.draggable-row-label') ||
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('select') ||
      e.target.closest('.modal-backdrop')
    ) {
      return;
    }
    // Deselect corridor row and selected racks if clicking empty background
    setSelectedCorridorRowId(null);
    onSelectRack(null);
    e.preventDefault(); // Prevent browser text selection

    if (e.shiftKey) {
      // Start Marquee Rectangle Box Selection!
      if (matrixRef.current) {
        const rect = matrixRef.current.getBoundingClientRect();
        const localX = (e.clientX - rect.left) / zoomLevel;
        const localY = (e.clientY - rect.top) / zoomLevel;
        setBoxSelect({
          startX: localX,
          startY: localY,
          currentX: localX,
          currentY: localY,
          startClientX: e.clientX,
          startClientY: e.clientY,
        });
      }
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (boxSelect) {
      if (matrixRef.current) {
        const rect = matrixRef.current.getBoundingClientRect();
        const localX = (e.clientX - rect.left) / zoomLevel;
        const localY = (e.clientY - rect.top) / zoomLevel;

        const startClientX = boxSelect.startClientX;
        const startClientY = boxSelect.startClientY;

        setBoxSelect((prev) =>
          prev ? { ...prev, currentX: localX, currentY: localY } : null
        );

        // Calculate intersecting rack tiles using screen bounding rects
        const minX = Math.min(startClientX, e.clientX);
        const maxX = Math.max(startClientX, e.clientX);
        const minY = Math.min(startClientY, e.clientY);
        const maxY = Math.max(startClientY, e.clientY);

        const matchedIds = [];
        racks.forEach((r) => {
          const tileEl = document.getElementById(`rack-tile-${r.id}`);
          if (tileEl) {
            const tRect = tileEl.getBoundingClientRect();
            const intersects = !(
              tRect.right < minX ||
              tRect.left > maxX ||
              tRect.bottom < minY ||
              tRect.top > maxY
            );
            if (intersects) {
              matchedIds.push(r.id);
            }
          }
        });

        onSelectRack(matchedIds);
      }
      return;
    }

    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleCanvasMouseUp = () => {
    if (boxSelect) {
      setBoxSelect(null);
    }
    setIsPanning(false);
  };

  // Select Corridor Row Label
  const handleSelectCorridorRow = (e, rowId) => {
    e.stopPropagation();
    setSelectedCorridorRowId(rowId);
    onSelectRack(null); // Clear rack selection when selecting a row label
  };

  // Right-Click Context Menu for Rack Tile (Supports Bulk Delete, Edit Name, U Height)
  const handleRackContextMenu = (e, rackObj) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedRackIds.length > 1 && selectedRackIds.includes(rackObj.id)) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'MULTI_RACKS',
        count: selectedRackIds.length,
        ids: selectedRackIds,
      });
    } else {
      if (!selectedRackIds.includes(rackObj.id)) {
        onSelectRack(rackObj.id, false);
      }
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'RACK',
        id: rackObj.id,
        name: rackObj.name,
      });
    }
  };

  // Right-Click Context Menu for Row Label
  const handleRowContextMenu = (e, rowObj) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCorridorRowId(rowObj.id);
    onSelectRack(null);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'ROW',
      id: rowObj.id,
      name: rowObj.name,
    });
  };

  // Execute Context Menu Action using App-Native Modals
  const handleContextMenuAction = (actionType) => {
    if (!contextMenu) return;

    if (actionType === 'EDIT_NAME') {
      if (contextMenu.type === 'RACK') {
        const rackObj = racks.find((r) => r.id === contextMenu.id);
        openModal({
          type: 'EDIT_NAME',
          targetType: 'RACK',
          id: contextMenu.id,
          title: 'Edit Rack Name',
          initialValue: rackObj?.name || 'Rack 1',
        });
      } else if (contextMenu.type === 'ROW') {
        const rowObj = rows.find((r) => r.id === contextMenu.id);
        openModal({
          type: 'EDIT_NAME',
          targetType: 'ROW',
          id: contextMenu.id,
          title: 'Edit Data Center Row Name',
          initialValue: rowObj?.name || 'Row A',
        });
      }
    } else if (actionType === 'CHANGE_U') {
      const rackObj = racks.find((r) => r.id === contextMenu.id);
      openModal({
        type: 'CHANGE_U',
        targetType: 'RACK',
        id: contextMenu.id,
        title: 'Change Cabinet U Capacity',
        initialValue: rackObj?.totalU || 42,
      });
    } else if (actionType === 'DELETE') {
      if (contextMenu.type === 'MULTI_RACKS') {
        openModal({
          type: 'DELETE_CONFIRM',
          targetType: 'MULTI_RACKS',
          ids: contextMenu.ids,
          count: contextMenu.count,
          title: 'Delete Selected Racks',
          message: `Are you sure you want to delete ${contextMenu.count} selected racks from the data center floor?`,
        });
      } else if (contextMenu.type === 'RACK') {
        openModal({
          type: 'DELETE_CONFIRM',
          targetType: 'RACK',
          id: contextMenu.id,
          title: 'Delete Rack Frame',
          message: `Are you sure you want to delete "${contextMenu.name || 'this rack'}"?`,
        });
      } else if (contextMenu.type === 'ROW') {
        openModal({
          type: 'DELETE_CONFIRM',
          targetType: 'ROW',
          id: contextMenu.id,
          title: 'Delete Named Row',
          message: `Are you sure you want to delete "${contextMenu.name || 'this row'}"? (Racks in this row will remain on floor).`,
        });
      }
    }

    setContextMenu(null);
  };

  // Open App-Native Modal Helper
  const openModal = (config) => {
    setModalState({ isOpen: true, ...config });
    setModalInputValue(config.initialValue || '');
    setModalUValue(config.initialValue || 42);
  };

  // Submit App-Native Modal Action
  const handleModalSubmit = () => {
    if (!modalState.isOpen) return;

    const { type, targetType, id, ids } = modalState;

    if (type === 'EDIT_NAME') {
      const val = modalInputValue.trim();
      if (val) {
        if (targetType === 'RACK') {
          setRacks((prev) =>
            prev.map((r) => (r.id === id ? { ...r, name: val } : r))
          );
        } else if (targetType === 'ROW') {
          setRows((prev) =>
            prev.map((rw) => (rw.id === id ? { ...rw, name: val } : rw))
          );
        }
      }
    } else if (type === 'CHANGE_U') {
      const val = parseInt(modalUValue, 10);
      if (!isNaN(val) && val > 0 && val <= 60) {
        setRacks((prev) =>
          prev.map((r) => (r.id === id ? { ...r, totalU: val } : r))
        );
      }
    } else if (type === 'DELETE_CONFIRM') {
      if (targetType === 'MULTI_RACKS') {
        setRacks((prev) => prev.filter((r) => !ids.includes(r.id)));
        onSelectRack(null);
      } else if (targetType === 'RACK') {
        setRacks((prev) => prev.filter((r) => r.id !== id));
        onSelectRack(null);
      } else if (targetType === 'ROW') {
        setRows((prev) => prev.filter((rw) => rw.id !== id));
        if (selectedCorridorRowId === id) setSelectedCorridorRowId(null);
        setRacks((prev) =>
          prev.map((r) => (r.rowId === id ? { ...r, rowId: null } : r))
        );
      }
    } else if (type === 'ADD_ROW') {
      const val = modalInputValue.trim();
      if (val) {
        const rowId = `row-${Date.now().toString().slice(-4)}`;
        const colors = ['#00f0ff', '#005aff', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
        const color = colors[rows.length % colors.length];

        const targetIdx = modalState.rowIndex !== undefined ? modalState.rowIndex : 1;

        const newRowObj = {
          id: rowId,
          name: val,
          color,
          rowIndex: targetIdx,
        };

        setRows((prev) => [...prev, newRowObj]);
        setSelectedCorridorRowId(rowId);

        // Auto-bind any existing racks on this grid Y row to the new row!
        setRacks((prev) =>
          prev.map((r) => (r.gridY === targetIdx ? { ...r, rowId: rowId } : r))
        );
      }
    } else if (type === 'COMBINE_ROWS') {
      const { sourceRowObj, targetRowObj, targetRowIndex } = modalState;
      if (!sourceRowObj || !targetRowObj) return;

      const finalName =
        combineSelectedLabel === 'CUSTOM'
          ? combineCustomName.trim() || 'Combined Row'
          : combineSelectedLabel;

      // Update target row with final name and remove source row definition
      setRows((prev) =>
        prev
          .filter((rw) => rw.id !== sourceRowObj.id)
          .map((rw) =>
            rw.id === targetRowObj.id
              ? { ...rw, name: finalName, rowIndex: targetRowIndex }
              : rw
          )
      );

      // Consolidate all racks from both rows to targetRowObj.id at targetRowIndex
      setRacks((prevRacks) => {
        const mergedRacks = prevRacks.map((r) => {
          const isFromSource =
            r.rowId === sourceRowObj.id || r.gridY === sourceRowObj.rowIndex;
          const isFromTarget =
            r.rowId === targetRowObj.id || r.gridY === targetRowObj.rowIndex;
          if (isFromSource || isFromTarget) {
            return { ...r, rowId: targetRowObj.id, gridY: targetRowIndex };
          }
          return r;
        });

        // Ensure unique gridX positions for all consolidated racks on targetRowIndex
        const occupiedSlots = new Set();
        return mergedRacks.map((r) => {
          if (r.gridY !== targetRowIndex) return r;
          let newX = r.gridX !== undefined ? r.gridX : 0;
          while (occupiedSlots.has(newX) && newX < GRID_COLS) {
            newX++;
          }
          occupiedSlots.add(newX);
          return { ...r, gridX: newX };
        });
      });

      if (selectedCorridorRowId === sourceRowObj.id) {
        setSelectedCorridorRowId(targetRowObj.id);
      }
    }

    setModalState({ isOpen: false });
  };

  // CLICK on grid cell (or SHIFT+CLICK on empty grid cell to add a Rack)
  const handleCellClick = (e, col, row) => {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      const isOccupied = racks.some((r) => r.gridX === col && r.gridY === row);
      if (isOccupied) return;

      let targetRowDef = rows.find((rw) => rw.rowIndex === row);
      let targetRowId = targetRowDef ? targetRowDef.id : null;

      if (!targetRowDef) {
        const newRowId = `row-auto-${Date.now().toString().slice(-4)}`;
        const colors = ['#00f0ff', '#005aff', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
        const rowColor = colors[row % colors.length];
        const rowLetter = String.fromCharCode(65 + (row % 26));
        const autoRow = {
          id: newRowId,
          name: `Row ${rowLetter} (auto)`,
          color: rowColor,
          rowIndex: row,
          isAuto: true,
        };
        setRows((prev) => [...prev, autoRow]);
        targetRowId = newRowId;
      }

      const nextNum = racks.length + 1;
      const newRackId = `rack-${Date.now().toString().slice(-4)}`;

      const newRack = {
        id: newRackId,
        name: `Rack ${nextNum}`,
        rowId: targetRowId,
        gridX: col,
        gridY: row,
        totalU: 42,
        items: [],
      };

      setRacks((prev) => [...prev, newRack]);
    } else {
      // Normal click on an empty grid cell -> deselect any selected racks or rows!
      const rackAtCell = racks.find(
        (r) =>
          (r.gridX === col && r.gridY === row) ||
          (!r.gridX && r.gridX !== 0 && row === 1 && col === racks.indexOf(r))
      );
      if (!rackAtCell) {
        onSelectRack(null);
        setSelectedCorridorRowId(null);
      }
    }
  };

  // SHIFT+CLICK on left corridor row label to add a Named Row using App-Native Modal!
  const handleCorridorClick = (e, rIdx) => {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      const existingRow = rows.find((rw) => rw.rowIndex === rIdx);
      if (existingRow) return;

      const nextLetter = String.fromCharCode(65 + (rows.length % 26));
      openModal({
        type: 'ADD_ROW',
        rowIndex: rIdx,
        title: 'Create Named Data Center Row',
        initialValue: `Row ${nextLetter}`,
      });
    }
  };

  // Projected cell targets for all selected group members during drag
  const groupProjectedCells = React.useMemo(() => {
    if (!draggedRackId || !hoveredCell) return [];

    const draggedRack = racks.find((r) => r.id === draggedRackId);
    if (!draggedRack) return [];

    const isGroupDrag = selectedRackIds.includes(draggedRackId) && selectedRackIds.length > 1;
    const targetRacks = isGroupDrag
      ? racks.filter((r) => selectedRackIds.includes(r.id))
      : [draggedRack];

    const deltaX = hoveredCell.col - draggedRack.gridX;
    const deltaY = hoveredCell.row - draggedRack.gridY;

    return targetRacks.map((r) => ({
      rackId: r.id,
      rackName: r.name,
      totalU: r.totalU || 42,
      itemsCount: r.items.length,
      col: r.gridX + deltaX,
      row: r.gridY + deltaY,
      isPrimary: r.id === draggedRackId,
    }));
  }, [draggedRackId, hoveredCell, selectedRackIds, racks]);

  // Drag and drop rack tile on floor grid
  const handleTileDragStart = (e, rackId) => {
    e.stopPropagation();
    setDraggedRackId(rackId);
    setDraggedRowId(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', rackId);

    // If dragging an unselected rack, select it
    if (!selectedRackIds.includes(rackId)) {
      onSelectRack(rackId, false);
    }
  };

  const handleTileDragEnd = () => {
    setDraggedRackId(null);
    setHoveredCell(null);
  };

  // Drag named row label directly inside the viewport corridor up or down
  const handleRowLabelDragStart = (e, rowId) => {
    e.stopPropagation();
    setDraggedRowId(rowId);
    setDraggedRackId(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', rowId);
  };

  // Drag over grid cell
  const handleCellDragOver = (e, col, row) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!hoveredCell || hoveredCell.col !== col || hoveredCell.row !== row) {
      setHoveredCell({ col, row });
    }
  };

  // Drag over left row corridor (left of the grid)
  const handleCorridorDragOver = (e, rIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredRowCorridorIdx !== rIdx) {
      setHoveredRowCorridorIdx(rIdx);
    }
  };

  const handleCellDrop = (e, targetCol, targetRow) => {
    e.preventDefault();
    setHoveredCell(null);
    setHoveredRowCorridorIdx(null);

    // Case 1: Dragging a Row label tag to a target row index
    if (draggedRowId) {
      const sourceRowObj = rows.find((r) => r.id === draggedRowId);
      setDraggedRowId(null);

      if (!sourceRowObj) return;

      const existingRowOnTarget = rows.find(
        (rw) => rw.rowIndex === targetRow && rw.id !== sourceRowObj.id
      );

      if (existingRowOnTarget) {
        // Trigger Combine Rows Modal!
        openModal({
          type: 'COMBINE_ROWS',
          title: 'Combine Data Center Rows?',
          sourceRowObj,
          targetRowObj: existingRowOnTarget,
          targetRowIndex: targetRow,
        });
        setCombineSelectedLabel(sourceRowObj.name);
        setCombineCustomName('');
        return;
      }

      const deltaY = targetRow - sourceRowObj.rowIndex;
      if (deltaY === 0) return;

      // Update row definition index
      setRows((prev) =>
        prev.map((rw) => (rw.id === sourceRowObj.id ? { ...rw, rowIndex: targetRow } : rw))
      );

      // Move ALL racks assigned to this row along with it!
      setRacks((prev) =>
        prev.map((r) => {
          if (r.rowId !== sourceRowObj.id) return r;
          const newGridY = Math.max(0, Math.min(GRID_ROWS - 1, r.gridY + deltaY));
          return { ...r, gridY: newGridY };
        })
      );
      return;
    }

    // Case 2: Dragging a Rack tile (or multi-selected group) to a target cell
    const rackId = draggedRackId || e.dataTransfer.getData('text/plain');
    setDraggedRackId(null);

    if (!rackId) return;

    const draggedRack = racks.find((r) => r.id === rackId);
    if (!draggedRack) return;

    const isGroupDrag = selectedRackIds.includes(rackId) && selectedRackIds.length > 1;

    if (isGroupDrag) {
      const groupRacks = racks.filter((r) => selectedRackIds.includes(r.id));
      const deltaX = targetCol - draggedRack.gridX;
      const deltaY = targetRow - draggedRack.gridY;

      if (deltaX === 0 && deltaY === 0) return;

      const proposed = groupRacks.map((r) => ({
        rack: r,
        newX: r.gridX + deltaX,
        newY: r.gridY + deltaY,
      }));

      // Validation 1: Grid Bounds Check
      const isOutOfBounds = proposed.some(
        (p) => p.newX < 0 || p.newX >= GRID_COLS || p.newY < 0 || p.newY >= GRID_ROWS
      );
      if (isOutOfBounds) return; // Cancel invalid group move!

      // Validation 2: Collision Check with unselected racks
      const unselectedRacks = racks.filter((r) => !selectedRackIds.includes(r.id));
      const isColliding = proposed.some((p) =>
        unselectedRacks.some((ur) => ur.gridX === p.newX && ur.gridY === p.newY)
      );
      if (isColliding) return; // Cancel invalid group move!

      // Apply Group Move + Auto-Create Rows if needed
      let updatedRows = [...rows];
      const posMap = new Map();

      proposed.forEach((p) => {
        let rowDef = updatedRows.find((rw) => rw.rowIndex === p.newY);
        let targetRowId = rowDef ? rowDef.id : null;

        if (!rowDef) {
          const newRowId = `row-auto-${Date.now().toString().slice(-4)}-${p.newY}`;
          const colors = ['#00f0ff', '#005aff', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
          const rowColor = colors[p.newY % colors.length];
          const rowLetter = String.fromCharCode(65 + (p.newY % 26));
          rowDef = {
            id: newRowId,
            name: `Row ${rowLetter} (auto)`,
            color: rowColor,
            rowIndex: p.newY,
            isAuto: true,
          };
          updatedRows.push(rowDef);
          targetRowId = newRowId;
        }

        posMap.set(p.rack.id, {
          gridX: p.newX,
          gridY: p.newY,
          rowId: targetRowId,
        });
      });

      if (updatedRows.length !== rows.length) {
        setRows(updatedRows);
      }

      setRacks((prev) =>
        prev.map((r) => {
          if (posMap.has(r.id)) {
            return { ...r, ...posMap.get(r.id) };
          }
          return r;
        })
      );
    } else {
      // Single rack drag logic
      const isOccupied = racks.some(
        (r) => r.id !== rackId && r.gridX === targetCol && r.gridY === targetRow
      );
      if (isOccupied) return;

      let targetRowDef = rows.find((rw) => rw.rowIndex === targetRow);
      let targetRowId = targetRowDef ? targetRowDef.id : null;

      if (!targetRowDef) {
        const newRowId = `row-auto-${Date.now().toString().slice(-4)}`;
        const colors = ['#00f0ff', '#005aff', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
        const rowColor = colors[targetRow % colors.length];
        const rowLetter = String.fromCharCode(65 + (targetRow % 26));
        const autoRow = {
          id: newRowId,
          name: `Row ${rowLetter} (auto)`,
          color: rowColor,
          rowIndex: targetRow,
          isAuto: true,
        };
        setRows((prev) => [...prev, autoRow]);
        targetRowId = newRowId;
      }

      setRacks((prev) =>
        prev.map((r) => {
          if (r.id !== rackId) return r;
          return {
            ...r,
            gridX: targetCol,
            gridY: targetRow,
            rowId: targetRowId,
          };
        })
      );
    }
  };

  // App-Native Modal Triggers for Toolbar Actions
  const handleCreateRowFromToolbar = () => {
    const nextLetter = String.fromCharCode(65 + (rows.length % 26));
    openModal({
      type: 'ADD_ROW',
      rowIndex: 1,
      title: 'Create Named Data Center Row',
      initialValue: `Row ${nextLetter}`,
    });
  };

  const handlePromptDeleteRack = (rackId) => {
    const rackObj = racks.find((r) => r.id === rackId);
    openModal({
      type: 'DELETE_CONFIRM',
      targetType: 'RACK',
      id: rackId,
      title: 'Delete Rack Frame',
      message: `Are you sure you want to delete "${rackObj?.name || 'this rack'}"?`,
    });
  };

  const handlePromptDeleteRow = (rowId) => {
    const rowObj = rows.find((rw) => rw.id === rowId);
    openModal({
      type: 'DELETE_CONFIRM',
      targetType: 'ROW',
      id: rowId,
      title: 'Delete Named Row',
      message: `Are you sure you want to delete "${rowObj?.name || 'this row'}"? (Racks in this row will remain on floor).`,
    });
  };

  // Save Custom U entry from top selection bar
  const handleSaveCustomU = (rackId) => {
    const val = parseInt(customUText, 10);
    if (!isNaN(val) && val > 0 && val <= 60) {
      setRacks((prev) =>
        prev.map((r) => (r.id === rackId ? { ...r, totalU: val } : r))
      );
    }
    setIsCustomUInput(false);
  };

  // Helper to safely navigate to 3D Elevation view for a target rack
  const handleNavigateToElevation = (targetRack) => {
    if (!targetRack) {
      onSwitchToElevation();
      return;
    }
    // Automatically switch row filter to the target rack's row if different!
    if (targetRack.rowId && targetRack.rowId !== selectedRowId) {
      onSelectRow(targetRack.rowId);
    }
    onSelectRack(targetRack.id, false);
    onSwitchToElevation();
  };

  return (
    <div className="floor-plan-viewport">
      {/* Floor Plan Overhead Dynamic Toolbar (Context-Sensitive to Selection) */}
      <div className="floor-toolbar">
        {/* CASE A: SINGLE RACK SELECTED */}
        {singleSelectedRack ? (
          <div className="toolbar-selection-group">
            <div className="selection-badge rack-badge">
              <Server size={14} /> <span>Rack Selected</span>
            </div>

            <div className="toolbar-input-item">
              <label>Name:</label>
              <input
                type="text"
                className="toolbar-text-input"
                value={singleSelectedRack.name}
                onChange={(e) =>
                  setRacks((prev) =>
                    prev.map((r) => (r.id === singleSelectedRack.id ? { ...r, name: e.target.value } : r))
                  )
                }
              />
            </div>

            <div className="toolbar-input-item">
              <label>Height:</label>
              {isCustomUInput ? (
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="toolbar-text-input num"
                  style={{ width: '56px' }}
                  value={customUText}
                  onChange={(e) => setCustomUText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCustomU(singleSelectedRack.id);
                    if (e.key === 'Escape') setIsCustomUInput(false);
                  }}
                  onBlur={() => handleSaveCustomU(singleSelectedRack.id)}
                  autoFocus
                />
              ) : (
                <select
                  className="toolbar-select-input"
                  value={singleSelectedRack.totalU || 42}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomUInput(true);
                      setCustomUText((singleSelectedRack.totalU || 42).toString());
                    } else {
                      setRacks((prev) =>
                        prev.map((r) =>
                          r.id === singleSelectedRack.id ? { ...r, totalU: parseInt(e.target.value, 10) } : r
                        )
                      );
                    }
                  }}
                >
                  {(() => {
                    const defaultUs = [12, 24, 42, 48, 52];
                    const currentU = singleSelectedRack.totalU || 42;
                    const allUs = defaultUs.includes(currentU)
                      ? defaultUs
                      : [...defaultUs, currentU].sort((a, b) => a - b);
                    return allUs.map((u) => (
                      <option key={u} value={u}>
                        {u}U
                      </option>
                    ));
                  })()}
                  <option value="CUSTOM">Custom...</option>
                </select>
              )}
            </div>

            <button
              className="sm-btn danger"
              onClick={() => handlePromptDeleteRack(singleSelectedRack.id)}
              title="Delete Selected Rack"
            >
              <Trash2 size={12} /> Delete
            </button>

            <button
              className="sm-btn primary-action"
              onClick={() => handleNavigateToElevation(singleSelectedRack)}
              title="Open 3D Elevation View for this Rack"
            >
              3D View <ArrowRight size={12} />
            </button>
          </div>
        ) : selectedRackIds.length > 1 ? (
          /* CASE B: MULTIPLE RACKS SELECTED */
          <div className="toolbar-selection-group">
            <div className="selection-badge rack-badge">
              <Server size={14} /> <span>{selectedRackIds.length} Racks</span>
            </div>

            <button
              className="sm-btn danger"
              onClick={() =>
                openModal({
                  type: 'DELETE_CONFIRM',
                  targetType: 'MULTI_RACKS',
                  ids: selectedRackIds,
                  count: selectedRackIds.length,
                  title: 'Delete Selected Racks',
                  message: `Are you sure you want to delete ${selectedRackIds.length} selected racks from the data center floor?`,
                })
              }
            >
              <Trash2 size={12} /> Delete {selectedRackIds.length} Racks
            </button>
          </div>
        ) : selectedRowObj ? (
          /* CASE C: ROW LABEL SELECTED IN LEFT CORRIDOR */
          <div className="toolbar-selection-group">
            <div className="selection-badge row-badge" style={{ borderColor: selectedRowObj.color }}>
              <GripVertical size={14} style={{ color: selectedRowObj.color }} />
              <span>Row Selected</span>
            </div>

            <div className="toolbar-input-item">
              <label>Name:</label>
              <input
                type="text"
                className="toolbar-text-input"
                value={selectedRowObj.name}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((rw) => (rw.id === selectedRowObj.id ? { ...rw, name: e.target.value } : rw))
                  )
                }
              />
            </div>

            <button
              className="sm-btn danger"
              onClick={() => handlePromptDeleteRow(selectedRowObj.id)}
              title="Delete Selected Named Row"
            >
              <Trash2 size={12} /> Delete Row
            </button>
          </div>
        ) : (
          /* DEFAULT CASE: NO SELECTION -> GLOBAL TITLE BADGE */
          <div className="toolbar-left">
            <div className="floor-badge">
              <Layers size={16} /> Data Center Floor Plan
            </div>
          </div>
        )}

        {/* Global Toolbar Right Controls (Always anchored 100% inside the viewport) */}
        <div className="toolbar-right">
          <button className="toolbar-action-btn" onClick={onAddRack} title="Add New Rack Frame to Floor">
            + Add Rack Frame
          </button>
          <button
            className="toolbar-action-btn"
            onClick={handleCreateRowFromToolbar}
            title="Create Named Data Center Row"
          >
            + Add Named Row
          </button>
          <div className="zoom-controls">
            <button
              className="icon-btn sm"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="zoom-val">{Math.round(zoomLevel * 100)}%</span>
            <button
              className="icon-btn sm"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              className="icon-btn sm"
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              title="Reset Zoom & Pan"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 2D/3D Floor Grid Layout Canvas with Pan & Zoom */}
      <div
        className="floor-canvas-scroll"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          className="floor-grid-matrix"
          ref={matrixRef}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Render Marquee Selection Box Overlay */}
          {boxSelect && (
            <div
              className="box-selection-marquee"
              style={{
                left: Math.min(boxSelect.startX, boxSelect.currentX),
                top: Math.min(boxSelect.startY, boxSelect.currentY),
                width: Math.abs(boxSelect.currentX - boxSelect.startX),
                height: Math.abs(boxSelect.currentY - boxSelect.startY),
              }}
            />
          )}

          {/* Render Grid Rows and Cells */}
          {Array.from({ length: GRID_ROWS }).map((_, rIdx) => {
            // Find if any named row is mapped to this row index
            const rowDef = rows.find((rw) => rw.rowIndex === rIdx);
            const isCorridorHovered = hoveredRowCorridorIdx === rIdx;
            const isRowSelected = rowDef && selectedCorridorRowId === rowDef.id;

            return (
              <div key={`row-${rIdx}`} className="floor-grid-row">
                {/* Row Corridor Label Header directly in Viewport */}
                <div
                  className={`row-header-label ${rowDef ? 'has-def' : ''} ${isCorridorHovered ? 'corridor-drop-target' : ''}`}
                  onClick={(e) => {
                    if (rowDef) {
                      handleSelectCorridorRow(e, rowDef.id);
                    } else {
                      handleCorridorClick(e, rIdx);
                    }
                  }}
                  onDragOver={(e) => handleCorridorDragOver(e, rIdx)}
                  onDragLeave={() => setHoveredRowCorridorIdx(null)}
                  onDrop={(e) => handleCellDrop(e, 0, rIdx)}
                  title={rowDef ? 'Click to edit row in top bar. Right-click to edit name or delete.' : 'Shift+Click to create a new Named Row here.'}
                >
                  {rowDef ? (
                    <div
                      draggable
                      onDragStart={(e) => handleRowLabelDragStart(e, rowDef.id)}
                      onContextMenu={(e) => handleRowContextMenu(e, rowDef)}
                      className={`named-row-tag draggable-row-label ${isRowSelected ? 'corridor-selected' : ''} ${shakingRowId === rowDef.id ? 'shaking-invalid' : ''}`}
                      style={{ backgroundColor: shakingRowId === rowDef.id ? '#ef4444' : rowDef.color }}
                    >
                      <GripVertical size={12} className="row-label-grip" />
                      <span>{rowDef.name}</span>
                    </div>
                  ) : (
                    <span className="row-num-tag">R{rIdx + 1}</span>
                  )}
                </div>

                {/* Row Grid Cells */}
                {Array.from({ length: GRID_COLS }).map((_, cIdx) => {
                  // Find rack positioned at (cIdx, rIdx)
                  const rackAtCell = racks.find(
                    (r) =>
                      (r.gridX === cIdx && r.gridY === rIdx) ||
                      (!r.gridX && r.gridX !== 0 && rIdx === 1 && cIdx === racks.indexOf(r))
                  );

                  const isHovered =
                    hoveredCell && hoveredCell.col === cIdx && hoveredCell.row === rIdx;
                  const isSelected = rackAtCell && selectedRackIds.includes(rackAtCell.id);

                  // Find projected target entry for multi-rack floating drag preview
                  const projectedTile = groupProjectedCells.find(
                    (p) => p.col === cIdx && p.row === rIdx
                  );

                  const isGroupMemberDragging =
                    draggedRackId && rackAtCell && selectedRackIds.includes(rackAtCell.id);

                  return (
                    <div
                      key={`cell-${rIdx}-${cIdx}`}
                      className={`floor-tile-cell ${isHovered ? 'hover-cell' : ''} ${projectedTile ? 'group-projected-cell' : ''}`}
                      onClick={(e) => handleCellClick(e, cIdx, rIdx)}
                      onDragOver={(e) => handleCellDragOver(e, cIdx, rIdx)}
                      onDragLeave={() => setHoveredCell(null)}
                      onDrop={(e) => handleCellDrop(e, cIdx, rIdx)}
                      title={!rackAtCell ? 'Shift+Click to add a new Rack frame at this cell' : ''}
                    >
                      <span className="cell-coord">{cIdx + 1}</span>

                      {/* Render Projected Floating Drag Ghost Tile */}
                      {projectedTile && (
                        <div
                          className={`floating-drag-preview-tile ${projectedTile.isPrimary ? 'primary-drag' : ''}`}
                        >
                          <div className="tile-top-bar">
                            <Server size={14} className="tile-icon" />
                            <span className="tile-name">{projectedTile.rackName}</span>
                          </div>
                          <div className="tile-info">
                            <span className="tile-u">{projectedTile.totalU}U</span>
                            <span className="tile-switches">{projectedTile.itemsCount} Switches</span>
                          </div>
                        </div>
                      )}

                      {/* Render Rack Square Tile if present */}
                      {rackAtCell && (
                        <div
                          id={`rack-tile-${rackAtCell.id}`}
                          draggable
                          onDragStart={(e) => handleTileDragStart(e, rackAtCell.id)}
                          onDragEnd={handleTileDragEnd}
                          onContextMenu={(e) => handleRackContextMenu(e, rackAtCell)}
                          className={`rack-square-tile ${isSelected ? 'selected' : ''} ${isGroupMemberDragging ? 'is-group-dragging' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCorridorRowId(null);
                            onSelectRack(rackAtCell.id, e.shiftKey);
                          }}
                          onDoubleClick={() => {
                            handleNavigateToElevation(rackAtCell);
                          }}
                          title={`Click to edit in top bar. Shift+Click to multi-select. Right-click to edit/delete.`}
                        >
                          <div className="tile-top-bar">
                            <Server size={14} className="tile-icon" />
                            <span className="tile-name">{rackAtCell.name}</span>
                          </div>

                          <div className="tile-info">
                            <span className="tile-u">{rackAtCell.totalU || 42}U</span>
                            <span className="tile-switches">{rackAtCell.items.length} Switches</span>
                          </div>

                          <div className="tile-actions">
                            <button
                              className="elevate-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToElevation(rackAtCell);
                              }}
                              title="Open 3D Elevation View"
                            >
                              3D Elevation <ArrowRight size={10} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sleek Custom Right-Click Context Menu with Edit Name, U Height & Delete Options */}
      {contextMenu && (
        <div
          className="custom-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-title">
            {contextMenu.type === 'MULTI_RACKS'
              ? `${contextMenu.count} Racks Selected`
              : contextMenu.type === 'RACK'
              ? 'Rack Options'
              : 'Row Options'}
          </div>

          {/* Edit Name Option for Rack or Row */}
          {(contextMenu.type === 'RACK' || contextMenu.type === 'ROW') && (
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('EDIT_NAME')}
            >
              <Edit2 size={14} /> Edit Name
            </button>
          )}

          {/* Change U Height Option for Rack */}
          {contextMenu.type === 'RACK' && (
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('CHANGE_U')}
            >
              <Sliders size={14} /> Change U Height
            </button>
          )}

          {/* Delete Option */}
          <button
            className="context-menu-item danger"
            onClick={() => handleContextMenuAction('DELETE')}
          >
            <Trash2 size={14} /> Delete{' '}
            {contextMenu.type === 'MULTI_RACKS'
              ? `${contextMenu.count} Selected Racks`
              : contextMenu.type === 'RACK'
              ? 'Rack'
              : 'Row'}
          </button>
        </div>
      )}

      {/* APP-NATIVE CUSTOM MODAL DIALOG */}
      {modalState.isOpen && (
        <div className="modal-backdrop" onClick={() => setModalState({ isOpen: false })}>
          <div className="modal-card floor-app-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modalState.type === 'DELETE_CONFIRM' ? (
                  <AlertTriangle size={20} className="modal-icon danger" />
                ) : modalState.type === 'CHANGE_U' ? (
                  <Sliders size={20} className="modal-icon" />
                ) : (
                  <Edit2 size={20} className="modal-icon" />
                )}
                <h3>{modalState.title}</h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setModalState({ isOpen: false })}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* EDIT NAME or ADD ROW INPUT FORM */}
              {(modalState.type === 'EDIT_NAME' || modalState.type === 'ADD_ROW') && (
                <div className="native-modal-form">
                  <label className="native-modal-label">
                    {modalState.targetType === 'RACK' ? 'Rack Name:' : 'Row Name:'}
                  </label>
                  <input
                    type="text"
                    className="native-modal-input"
                    value={modalInputValue}
                    onChange={(e) => setModalInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                    autoFocus
                  />
                </div>
              )}

              {/* CHANGE U CAPACITY FORM */}
              {modalState.type === 'CHANGE_U' && (
                <div className="native-modal-form">
                  <label className="native-modal-label">Select Cabinet Height (Rack Units):</label>
                  <div className="u-preset-grid">
                    {[12, 24, 42, 48, 52].map((u) => (
                      <button
                        key={u}
                        className={`u-preset-card ${modalUValue === u ? 'active' : ''}`}
                        onClick={() => setModalUValue(u)}
                      >
                        <Server size={14} />
                        <span>{u}U</span>
                      </button>
                    ))}
                  </div>

                  <div className="native-modal-input-row" style={{ marginTop: '12px' }}>
                    <label className="native-modal-label">Custom U Capacity:</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      className="native-modal-input num"
                      value={modalUValue}
                      onChange={(e) => setModalUValue(parseInt(e.target.value, 10) || 42)}
                    />
                  </div>
                </div>
              )}

              {/* DELETE CONFIRMATION MESSAGE */}
              {modalState.type === 'DELETE_CONFIRM' && (
                <div className="native-modal-delete-message">
                  <p className="delete-message-text">{modalState.message}</p>
                  <p className="delete-subtext">This action cannot be undone.</p>
                </div>
              )}

              {/* COMBINE ROWS FORM */}
              {modalState.type === 'COMBINE_ROWS' && (
                <div className="native-modal-form">
                  <p className="delete-message-text">
                    Do you want to combine <strong>"{modalState.sourceRowObj?.name}"</strong> and <strong>"{modalState.targetRowObj?.name}"</strong> into a single row at Row {modalState.targetRowIndex + 1}?
                  </p>

                  <div style={{ marginTop: '12px' }}>
                    <label className="native-modal-label">Choose Row Label Name:</label>
                    <select
                      className="native-modal-input"
                      style={{ marginTop: '6px' }}
                      value={combineSelectedLabel}
                      onChange={(e) => setCombineSelectedLabel(e.target.value)}
                    >
                      <option value={modalState.sourceRowObj?.name}>
                        {modalState.sourceRowObj?.name}
                      </option>
                      <option value={modalState.targetRowObj?.name}>
                        {modalState.targetRowObj?.name}
                      </option>
                      <option value="CUSTOM">Custom...</option>
                    </select>
                  </div>

                  {combineSelectedLabel === 'CUSTOM' && (
                    <div style={{ marginTop: '12px' }}>
                      <label className="native-modal-label">Enter Custom Row Name:</label>
                      <input
                        type="text"
                        className="native-modal-input"
                        style={{ marginTop: '6px' }}
                        placeholder="e.g. Row A-B"
                        value={combineCustomName}
                        onChange={(e) => setCombineCustomName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="sm-btn" onClick={() => setModalState({ isOpen: false })}>
                Cancel
              </button>

              {modalState.type === 'DELETE_CONFIRM' ? (
                <button className="sm-btn danger-confirm" onClick={handleModalSubmit}>
                  <Trash2 size={14} /> Delete Immediately
                </button>
              ) : modalState.type === 'COMBINE_ROWS' ? (
                <button className="sm-btn primary-confirm" onClick={handleModalSubmit}>
                  Combine Rows
                </button>
              ) : (
                <button className="sm-btn primary-confirm" onClick={handleModalSubmit}>
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
