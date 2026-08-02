import React from 'react';
import { X, Activity, Cable, ShieldCheck, Cpu } from 'lucide-react';
import { SWITCH_MODELS } from '../data/switchModels';

export function PortModal({
  selectedPort,
  deviceId,
  rackItems,
  onClose,
  onStartCableWiring,
  cableSourcePortId,
}) {
  if (!selectedPort) return null;

  const device = rackItems.find((it) => it.id === deviceId);
  const model = device ? SWITCH_MODELS[device.modelId] : null;
  const fullPortId = `${deviceId}:${selectedPort.id}`;
  const isCableSource = cableSourcePortId === fullPortId;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card port-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Activity size={18} style={{ color: '#00f0ff' }} />
            <div>
              <h3>Port Telemetry: {selectedPort.id}</h3>
              <p>{device?.customName || model?.name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="stat-grid">
            <div className="stat-box">
              <span className="stat-label">Link Status</span>
              <span className={`stat-value ${selectedPort.defaultStatus === 'UP' ? 'green' : 'red'}`}>
                ● {selectedPort.defaultStatus}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Configured Speed</span>
              <span className="stat-value">{selectedPort.speed}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Port Interface</span>
              <span className="stat-value">{selectedPort.type}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Transceiver Optics</span>
              <span className="stat-value small">{selectedPort.transceiver}</span>
            </div>
          </div>

          <div className="telemetry-graph-box">
            <div className="graph-header">
              <span>Simulated Optical Power (Tx / Rx dBm)</span>
              <span className="live-indicator">LIVE TELEMETRY</span>
            </div>
            <div className="simulated-bar">
              <div className="bar-fill" style={{ width: '84%' }} />
            </div>
            <div className="graph-stats">
              <span>Tx Power: +1.2 dBm</span>
              <span>Rx Power: -3.8 dBm</span>
              <span>Errors: 0 FCS</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className={`btn-primary ${isCableSource ? 'active-source' : ''}`}
            onClick={() => onStartCableWiring(fullPortId)}
          >
            <Cable size={16} />
            {isCableSource ? 'Cancel Wiring Source' : 'Connect Cable from This Port'}
          </button>
        </div>
      </div>
    </div>
  );
}
