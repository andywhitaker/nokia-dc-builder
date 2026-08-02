import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ResetConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card danger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="danger-modal-header">
            <div className="danger-icon-badge">
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ margin: 0 }}>Reset All Data Center Layouts?</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="danger-modal-desc">
            Are you sure you want to reset everything? This will permanently delete all custom racks, switches, U height configurations, and connected patch cables.
            <br /><br />
            <span className="warning-highlight">⚠️ This action cannot be undone.</span>
          </p>

          <div className="danger-modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-danger-confirm"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Yes, Reset Everything
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
