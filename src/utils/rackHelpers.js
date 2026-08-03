import { SWITCH_MODELS } from '../data/switchModels';

export const RACK_CONFIG = {
  TOTAL_U: 42,
  U_HEIGHT: 0.065,     // 3D height per 1U (Matches real 1.75" ratio)
  CHASSIS_WIDTH: 0.706, // 3D width for 19" EIA rack (19" / 1.75" * 0.065 = 0.7057)
  CHASSIS_DEPTH: 0.75,  // 3D depth
  RAIL_WIDTH: 0.706,
  RACK_HEIGHT: 42 * 0.065 + 0.12, // 2.85 units height
};

// Calculate exact 3D center Y position for a device relative to rack floor base (0.06 pedestal top)
export function getDevicePositionY(startU, heightU = 1) {
  const centerU = (startU - 1) + (heightU / 2);
  return 0.06 + centerU * RACK_CONFIG.U_HEIGHT;
}

// Convert image pixel coordinates (2048x187) to 3D position vector on device faceplate
export function getPort3DPositionFromPixel(deviceStartU, deviceHeightU, pixelRect, isRear = false) {
  const devY = getDevicePositionY(deviceStartU, deviceHeightU);

  const IMG_W = 2048;
  const IMG_H = 187 * deviceHeightU; // 187px per 1U

  const centerX = (pixelRect.minX + pixelRect.maxX) / 2;
  const centerY = (pixelRect.minY + pixelRect.maxY) / 2;

  const normX = (centerX / IMG_W) - 0.5;
  const normY = 0.5 - (centerY / IMG_H);

  const posX = normX * RACK_CONFIG.CHASSIS_WIDTH;
  const posY = devY + (normY * deviceHeightU * RACK_CONFIG.U_HEIGHT);
  const posZ = isRear ? -RACK_CONFIG.CHASSIS_DEPTH / 2 - 0.01 : RACK_CONFIG.CHASSIS_DEPTH / 2 + 0.015;

  return [posX, posY, posZ];
}

// Fallback position calculation if pixel rect not defined
export function getPort3DPosition(deviceStartU, deviceHeightU, portRow, portCol, totalCols, isRear = false) {
  const devY = getDevicePositionY(deviceStartU, deviceHeightU);
  const panelWidth = RACK_CONFIG.CHASSIS_WIDTH * 0.85;
  const colSpacing = panelWidth / Math.max(totalCols, 1);
  const posX = -panelWidth / 2 + (portCol - 0.5) * colSpacing;
  const posY = devY + (portRow === 1 ? 0.012 : -0.012);
  const posZ = isRear ? -RACK_CONFIG.CHASSIS_DEPTH / 2 - 0.01 : RACK_CONFIG.CHASSIS_DEPTH / 2 + 0.015;
  return [posX, posY, posZ];
}

// Check if placing a switch at startU with heightU collides with existing items in totalU rack
export function checkRackCollision(items, startU, heightU, excludeItemId = null, totalU = 42) {
  const endU = startU + heightU - 1;
  if (startU < 1 || endU > totalU) {
    return { invalid: true, reason: `Position U${startU}-U${endU} exceeds ${totalU}U rack bounds.` };
  }

  for (const item of items) {
    if (item.id === excludeItemId) continue;
    const itemModel = SWITCH_MODELS[item.modelId];
    if (!itemModel) continue;

    const itemStart = item.startU;
    const itemEnd = item.startU + itemModel.heightU - 1;

    if (startU <= itemEnd && endU >= itemStart) {
      return {
        invalid: true,
        reason: `Conflicts with ${item.customName || itemModel.name} at U${itemStart}-U${itemEnd}`,
      };
    }
  }

  return { invalid: false };
}

// Find first available U position from top to bottom
export function findAvailableSlot(items, heightU, totalU = 42) {
  for (let u = totalU - heightU + 1; u >= 1; u--) {
    const check = checkRackCollision(items, u, heightU, null, totalU);
    if (!check.invalid) return u;
  }
  return null;
}

// Resize rack capacity (totalU):
// - When expanded, switches remain in their current RUs.
// - When shrunk, switches move ONLY if their RU exceeds the new bounds or collides with a switch pushed from above, preserving relative order and moving only as far as needed.
export function resizeRackTotalU(items, newTotalU) {
  const totalOccupiedU = items.reduce((sum, item) => {
    const model = SWITCH_MODELS[item.modelId] || { heightU: 1 };
    return sum + (model.heightU || 1);
  }, 0);

  if (totalOccupiedU > newTotalU) {
    return {
      invalid: true,
      reason: `Cannot shrink rack to ${newTotalU}U! Occupied switches require at least ${totalOccupiedU} Rack Units.`,
    };
  }

  const sorted = [...items].sort((a, b) => b.startU - a.startU);
  let currentAvailableTop = newTotalU;

  const updatedItems = sorted.map((item) => {
    const model = SWITCH_MODELS[item.modelId] || { heightU: 1 };
    const h = model.heightU || 1;
    const currentEndU = item.startU + h - 1;

    let newStartU = item.startU;
    if (currentEndU > currentAvailableTop) {
      newStartU = currentAvailableTop - h + 1;
    }

    currentAvailableTop = newStartU - 1;
    return { ...item, startU: newStartU };
  });

  return { invalid: false, items: updatedItems };
}

// Re-order rack items automatically from top to bottom without gaps
export function compactRackFromTop(items, totalU = 42) {
  const sorted = [...items].sort((a, b) => b.startU - a.startU);
  let currentU = totalU;

  const compacted = [];
  for (const item of sorted) {
    const model = SWITCH_MODELS[item.modelId];
    const height = model ? model.heightU : 1;
    const newStartU = currentU - height + 1;

    if (newStartU >= 1) {
      compacted.push({ ...item, startU: newStartU });
      currentU = newStartU - 1;
    } else {
      compacted.push(item);
    }
  }
  return compacted;
}

// Move item up or down by 1 RU: moves into empty space if free, or swaps with adjacent switch if occupied
export function moveItemU(items, itemId, direction, totalU = 42) {
  const targetItem = items.find((it) => it.id === itemId);
  if (!targetItem) return items;

  const targetModel = SWITCH_MODELS[targetItem.modelId] || { heightU: 1 };
  const targetHeight = targetModel.heightU || 1;

  if (direction === 'UP') {
    const desiredStartU = targetItem.startU + 1;
    const desiredEndU = desiredStartU + targetHeight - 1;
    if (desiredEndU > totalU) return items;

    // Check if an adjacent switch occupies desiredStartU..desiredEndU
    const collidingItem = items.find((it) => {
      if (it.id === itemId) return false;
      const m = SWITCH_MODELS[it.modelId] || { heightU: 1 };
      const itStart = it.startU;
      const itEnd = it.startU + (m.heightU || 1) - 1;
      return desiredStartU <= itEnd && desiredEndU >= itStart;
    });

    if (!collidingItem) {
      // Space is empty! Step up 1 RU
      return items.map((it) => (it.id === itemId ? { ...it, startU: desiredStartU } : it));
    } else {
      // Space is occupied! Swap positions with collidingItem
      const collidingModel = SWITCH_MODELS[collidingItem.modelId] || { heightU: 1 };
      const collidingHeight = collidingModel.heightU || 1;

      const newTargetStartU = collidingItem.startU + collidingHeight - targetHeight;
      const newCollidingStartU = targetItem.startU;

      if (newTargetStartU + targetHeight - 1 <= totalU && newCollidingStartU >= 1) {
        return items.map((it) => {
          if (it.id === targetItem.id) return { ...it, startU: newTargetStartU };
          if (it.id === collidingItem.id) return { ...it, startU: newCollidingStartU };
          return it;
        });
      }
    }
  } else if (direction === 'DOWN') {
    const desiredStartU = targetItem.startU - 1;
    if (desiredStartU < 1) return items;

    const desiredEndU = desiredStartU + targetHeight - 1;

    // Check if an adjacent switch occupies desiredStartU..desiredEndU
    const collidingItem = items.find((it) => {
      if (it.id === itemId) return false;
      const m = SWITCH_MODELS[it.modelId] || { heightU: 1 };
      const itStart = it.startU;
      const itEnd = it.startU + (m.heightU || 1) - 1;
      return desiredStartU <= itEnd && desiredEndU >= itStart;
    });

    if (!collidingItem) {
      // Space is empty! Step down 1 RU
      return items.map((it) => (it.id === itemId ? { ...it, startU: desiredStartU } : it));
    } else {
      // Space is occupied! Swap positions with collidingItem
      const collidingModel = SWITCH_MODELS[collidingItem.modelId] || { heightU: 1 };
      const collidingHeight = collidingModel.heightU || 1;

      const newTargetStartU = collidingItem.startU;
      const newCollidingStartU = collidingItem.startU + targetHeight;

      if (newTargetStartU >= 1 && newCollidingStartU + collidingHeight - 1 <= totalU) {
        return items.map((it) => {
          if (it.id === targetItem.id) return { ...it, startU: newTargetStartU };
          if (it.id === collidingItem.id) return { ...it, startU: newCollidingStartU };
          return it;
        });
      }
    }
  }

  return items;
}

// Drag and drop reordering
export function reorderRackItemsByDrag(items, draggedId, targetId, totalU = 42) {
  if (draggedId === targetId) return items;

  const draggedItem = items.find((it) => it.id === draggedId);
  const targetItem = items.find((it) => it.id === targetId);
  if (!draggedItem || !targetItem) return items;

  const draggedModel = SWITCH_MODELS[draggedItem.modelId] || { heightU: 1 };
  const draggedHeight = draggedModel.heightU || 1;

  const targetModel = SWITCH_MODELS[targetItem.modelId] || { heightU: 1 };
  const targetHeight = targetModel.heightU || 1;

  const otherItems = items.filter((it) => it.id !== draggedId);

  // 1. Check if the slot directly above targetItem is free
  const slotAboveTargetU = targetItem.startU + targetHeight;
  const slotAboveEndU = slotAboveTargetU + draggedHeight - 1;

  let canFitAbove = slotAboveEndU <= totalU;
  if (canFitAbove) {
    for (const other of otherItems) {
      const oModel = SWITCH_MODELS[other.modelId] || { heightU: 1 };
      const oStart = other.startU;
      const oEnd = other.startU + (oModel.heightU || 1) - 1;
      if (slotAboveTargetU <= oEnd && slotAboveEndU >= oStart) {
        canFitAbove = false;
        break;
      }
    }
  }

  if (canFitAbove) {
    return items.map((it) => (it.id === draggedId ? { ...it, startU: slotAboveTargetU } : it));
  }

  // 2. Slot above is NOT free. Take targetItem's position and shift target & lower switches down to make room.
  const placementU = targetItem.startU;
  const sortedOthers = [...otherItems].sort((a, b) => b.startU - a.startU);

  const itemsAtOrBelow = sortedOthers.filter((it) => it.startU <= placementU);
  const itemsAbove = sortedOthers.filter((it) => it.startU > placementU);

  const shiftedBelow = itemsAtOrBelow.map((it) => ({
    ...it,
    startU: it.startU - draggedHeight,
  }));

  const candidate = [
    ...itemsAbove,
    { ...draggedItem, startU: placementU },
    ...shiftedBelow,
  ];

  // If any shifted item overflows below U1, shift candidate stack up to fit
  const lowestU = Math.min(...candidate.map((it) => it.startU));
  if (lowestU < 1) {
    const overflowOffset = 1 - lowestU;
    const shiftUpCandidate = candidate.map((it) => ({
      ...it,
      startU: it.startU + overflowOffset,
    }));

    const highestU = Math.max(...shiftUpCandidate.map((it) => {
      const m = SWITCH_MODELS[it.modelId] || { heightU: 1 };
      return it.startU + (m.heightU || 1) - 1;
    }));

    if (highestU <= totalU) {
      return shiftUpCandidate;
    }
  } else {
    return candidate;
  }

  return items;
}

// Sort racks left-to-right matching floor plan layout coordinates
export function sortRacksByGridX(rackList) {
  return [...rackList].sort((a, b) => {
    const ax = a.gridX !== undefined ? a.gridX : 0;
    const bx = b.gridX !== undefined ? b.gridX : 0;
    if (ax !== bx) return ax - bx;
    const ay = a.gridY !== undefined ? a.gridY : 0;
    const by = b.gridY !== undefined ? b.gridY : 0;
    if (ay !== by) return ay - by;
    return a.id.localeCompare(b.id);
  });
}

// Re-order racks in a row (e.g. via 3D Elevation Rack Order tab or Sidebar):
// Shuffles racks into the row's existing floor grid column slots while keeping empty space cells untouched!
export function reorderRowRacksInSlots(allRacks, targetRackId, newIndexOrDirection) {
  const targetRack = allRacks.find((r) => r.id === targetRackId);
  if (!targetRack) return allRacks;

  const targetRowId = targetRack.rowId;

  // Filter all racks belonging to the same row (or unassigned row)
  const rowRacks = allRacks.filter((r) => r.rowId === targetRowId);
  if (rowRacks.length <= 1) return allRacks;

  // Sort existing row racks by current floor grid position (gridX)
  const sortedRowRacks = sortRacksByGridX(rowRacks);

  const currentIndex = sortedRowRacks.findIndex((r) => r.id === targetRackId);
  if (currentIndex < 0) return allRacks;

  let targetIndex = currentIndex;
  if (newIndexOrDirection === 'UP' || newIndexOrDirection === 'LEFT') {
    targetIndex = currentIndex - 1;
  } else if (newIndexOrDirection === 'DOWN' || newIndexOrDirection === 'RIGHT') {
    targetIndex = currentIndex + 1;
  } else if (typeof newIndexOrDirection === 'number') {
    targetIndex = newIndexOrDirection;
  }

  if (targetIndex < 0 || targetIndex >= sortedRowRacks.length || targetIndex === currentIndex) {
    return allRacks;
  }

  // Reorder the row racks array
  const reorderedRowRacks = [...sortedRowRacks];
  const [movedRack] = reorderedRowRacks.splice(currentIndex, 1);
  reorderedRowRacks.splice(targetIndex, 0, movedRack);

  // Extract the exact grid coordinate slots (gridX, gridY) occupied by this row, sorted by gridX
  const slots = sortedRowRacks.map((r) => ({
    gridX: r.gridX !== undefined ? r.gridX : 0,
    gridY: r.gridY !== undefined ? r.gridY : 2,
  }));

  // Re-assign each rack in reorderedRowRacks to its corresponding slot
  const updatedRowRacksMap = new Map();
  reorderedRowRacks.forEach((rack, idx) => {
    const slot = slots[idx];
    updatedRowRacksMap.set(rack.id, {
      ...rack,
      gridX: slot.gridX,
      gridY: slot.gridY,
    });
  });

  // Reconstruct allRacks array preserving original array references
  return allRacks.map((r) => {
    if (updatedRowRacksMap.has(r.id)) {
      return updatedRowRacksMap.get(r.id);
    }
    return r;
  });
}

