import React from 'react';
import { AlertTriangle, Link2, ExternalLink } from 'lucide-react';

/**
 * Reusable Incident Marker Section for Operational Forms (Maintenance, Sanitation, etc.)
 * Provides a standardized way to flag operational incidents, select severity, and provide RCA notes.
 */
export default function IncidentMarkerSection({
  isIncident = false,
  severity = 'Medium',
  note = '',
  onChange = () => {},
  linkedIncident = '',
  onNavigateToIncident = null,
  readOnly = false,
  compact = false,
  checkboxLabel = 'Flag as Operational Incident / Deviation'
}) {
  const active = Boolean(isIncident);

  return (
    <div
      className="incident-marker-section"
      style={{
        border: active ? '1.5px solid #f59e0b' : '1px solid #fed7aa',
        backgroundColor: active ? 'rgba(245, 158, 11, 0.06)' : 'rgba(254, 243, 199, 0.25)',
        borderRadius: '8px',
        padding: compact ? '10px 12px' : '14px 16px',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header & Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>
            Operational Incident & Deviation
          </span>
          {active && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}
            >
              Flagged for Plant Incident
            </span>
          )}
        </div>

        {linkedIncident && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Linked:</span>
            <button
              type="button"
              onClick={() => onNavigateToIncident && onNavigateToIncident(linkedIncident)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: onNavigateToIncident ? 'pointer' : 'default'
              }}
              title="View Plant Incident details"
            >
              <Link2 size={12} />
              {linkedIncident}
              {onNavigateToIncident && <ExternalLink size={10} />}
            </button>
          </div>
        )}
      </div>

      {/* Checkbox Trigger (in edit mode) */}
      {!readOnly && (
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-main, #374151)',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => onChange('is_incident', e.target.checked ? 1 : 0)}
            style={{ width: '16px', height: '16px', accentColor: '#d97706', cursor: 'pointer' }}
          />
          <span>{checkboxLabel}</span>
        </label>
      )}

      {/* Expanded Fields when Flagged */}
      {active && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'minmax(140px, 180px) minmax(0, 1fr)', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
            {/* Severity */}
            <div style={{ minWidth: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Incident Severity *
              </label>
              {readOnly ? (
                <div style={{ fontSize: '12px', fontWeight: 700, color: severity === 'Critical' ? 'var(--danger)' : '#d97706' }}>
                  {severity}
                </div>
              ) : (
                <select
                  className="form-input"
                  value={severity}
                  onChange={(e) => onChange('incident_severity', e.target.value)}
                  style={{
                    borderColor: '#f59e0b',
                    fontWeight: 600,
                    height: '34px',
                    fontSize: '12px',
                    width: '100%',
                    boxSizing: 'border-box',
                    color: severity === 'Critical' ? '#dc2626' : (severity === 'High' ? '#ea580c' : '#d97706')
                  }}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              )}
            </div>

            {/* Note / Problem Scope */}
            <div style={{ minWidth: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Incident / Deviation Note *
              </label>
              {readOnly ? (
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', wordBreak: 'break-word' }}>{note || 'No notes provided'}</p>
              ) : (
                <textarea
                  className="form-input"
                  rows={2}
                  value={note}
                  onChange={(e) => onChange('incident_note', e.target.value)}
                  placeholder="Describe equipment fault, abnormal noise, leak, vibration, or breakdown details..."
                  style={{ minHeight: '52px', fontSize: '12px', padding: '6px 10px', borderColor: '#f59e0b', width: '100%', boxSizing: 'border-box' }}
                />
              )}
            </div>
          </div>

          {!readOnly && (
            <div style={{ fontSize: '11px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>⚡</span>
              <span>Submitting with this flag will automatically generate a linked <strong>Plant Incident</strong>.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
