import React from 'react';
import { X, Zap, Cpu, Server, Copy, Check } from 'lucide-react';
import { SWITCH_MODELS } from '../data/switchModels';
import { RACK_CONFIG } from '../utils/rackHelpers';

export function BOMModal({ rackItems, onClose }) {
  const [copied, setCopied] = React.useState(false);

  // Compute Bill of Materials metrics
  let totalWatts = 0;
  let totalWeight = 0;
  let totalUUsed = 0;
  let totalPorts25G = 0;
  let totalPorts100G = 0;
  let totalPorts400G = 0;
  let totalPorts800G = 0;

  const modelCounts = {};

  rackItems.forEach((item) => {
    const model = SWITCH_MODELS[item.modelId];
    if (!model) return;

    modelCounts[model.id] = (modelCounts[model.id] || 0) + 1;

    totalWatts += model.powerWatts || 0;
    totalWeight += model.weightKg || 0;
    totalUUsed += model.heightU || 1;

    model.ports?.forEach((p) => {
      if (p.speed.includes('25G')) totalPorts25G++;
      else if (p.speed.includes('100G')) totalPorts100G++;
      else if (p.speed.includes('400G')) totalPorts400G++;
      else if (p.speed.includes('800G')) totalPorts800G++;
    });
  });

  const totalBTU = Math.round(totalWatts * 3.41214);
  const uUtilizationPct = Math.round((totalUUsed / RACK_CONFIG.TOTAL_U) * 100);

  const handleCopyBOM = () => {
    let summaryText = `Nokia 7220 IXR Rack Specification & Bill of Materials (BOM)\n`;
    summaryText += `----------------------------------------------------\n`;
    summaryText += `Rack Utilization: ${totalUUsed}U / 42U (${uUtilizationPct}%)\n`;
    summaryText += `Total Power Consumption: ${totalWatts} Watts\n`;
    summaryText += `Heat Output: ${totalBTU} BTU/hr\n`;
    summaryText += `Total Weight: ${totalWeight.toFixed(1)} kg\n\n`;
    summaryText += `Equipment Inventory:\n`;

    Object.entries(modelCounts).forEach(([mId, count]) => {
      const model = SWITCH_MODELS[mId];
      summaryText += `- ${count}x ${model.name} (${model.heightU * count}U)\n`;
    });

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card bom-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Zap size={20} style={{ color: '#f59e0b' }} />
            <div>
              <h3>Rack Bill of Materials & Data Center Specs</h3>
              <p>Nokia 7220 IXR Power, Cooling & Port Density Summary</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top Key Metrics */}
          <div className="bom-stats-row">
            <div className="bom-stat-card">
              <span className="bom-stat-num">{totalUUsed}U / 42U</span>
              <span className="bom-stat-lbl">Rack Space Used ({uUtilizationPct}%)</span>
            </div>
            <div className="bom-stat-card">
              <span className="bom-stat-num">{totalWatts} W</span>
              <span className="bom-stat-lbl">Max Power Draw</span>
            </div>
            <div className="bom-stat-card">
              <span className="bom-stat-num">{totalBTU.toLocaleString()}</span>
              <span className="bom-stat-lbl">Heat (BTU/hr)</span>
            </div>
            <div className="bom-stat-card">
              <span className="bom-stat-num">{totalWeight.toFixed(1)} kg</span>
              <span className="bom-stat-lbl">Total Chassis Weight</span>
            </div>
          </div>

          <hr className="divider" />

          {/* Port Density Breakdown */}
          <h4>Network Fabric Port Capacity</h4>
          <div className="port-capacity-pills">
            <div className="port-pill">
              <span className="count">{totalPorts400G}</span>
              <span className="speed">400G QSFP-DD</span>
            </div>
            <div className="port-pill">
              <span className="count">{totalPorts100G}</span>
              <span className="speed">100G QSFP28</span>
            </div>
            <div className="port-pill">
              <span className="count">{totalPorts25G}</span>
              <span className="speed">25G SFP28</span>
            </div>
            {totalPorts800G > 0 && (
              <div className="port-pill purple">
                <span className="count">{totalPorts800G}</span>
                <span className="speed">800G OSFP</span>
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Detailed Item List */}
          <h4>Equipment Line Items</h4>
          <div className="bom-table">
            <div className="table-header">
              <span>Model Number</span>
              <span>Series</span>
              <span>Units</span>
              <span>Qty</span>
              <span>Total Watts</span>
            </div>
            {Object.entries(modelCounts).map(([mId, count]) => {
              const model = SWITCH_MODELS[mId];
              return (
                <div key={mId} className="table-row">
                  <span className="fw-bold">{model.name}</span>
                  <span>{model.series}</span>
                  <span>{model.heightU}U</span>
                  <span>x{count}</span>
                  <span>{model.powerWatts * count} W</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleCopyBOM}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Spec Summary'}
          </button>
        </div>
      </div>
    </div>
  );
}
