import {
  FlaskConical,
  FileText,
  BarChart2,
  Eye,
  Wine,
  Truck,
  Sparkles,
  Flame,
  Package,
  Search,
  FileEdit,
  Thermometer,
  Scale,
  Radio,
  Container,
  TrendingUp,
  Factory,
  Megaphone,
  ClipboardList,
  Check,
  X,
  Loader2,
  Trash2,
  User,
  AlertTriangle,
  Lock,
  Globe,
  Printer,
  Mail,
  PenTool,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Microscope,
  Building
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { frappe } from '../services/frappe';
import { LabMetadataFields, LabFieldControl, LabTableSections } from './LabMetadataFields';
import { getLabTableFields, getLabRowDefaults, normalizeLabField } from './labFieldMetadata';
import { LabSignatureValue } from './LabSignatureField';
import { createLabLinkLoader } from './labLinkOptions';
import Badge from './ui/Badge';
import { StageStatusBadge, StageAuditCard } from './StageAuditCard';

const loadLabLinkOptions = createLabLinkLoader(frappe);

export * from './LaboratoryFormModal';
export { default as LaboratoryFormModal } from './LaboratoryFormModal';

const LAB_STATUS_COLOR = {
  'Draft': '#f59e0b',
  'In Progress': '#3b82f6',
  'Completed': '#10b981',
  'Cancelled': '#ef4444',
  'Stopped': '#6b7280'
};

export function LabWOSelectorPopup({ workOrders, onSelect, onClose }) {
  const [searchQ, setSearchQ] = useState('');
  const [liveWOs, setLiveWOs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const conn = frappe.getConnectionSettings();
    if (conn.isLive) {
      setLoading(true);
      frappe.getWorkOrderDashboard({ limit: 100, status: 'All' })
        .then(res => {
          if (res && res.data) {
            setLiveWOs(res.data);
          }
        })
        .catch(err => console.warn('Failed to refresh Lab WO selector list:', err))
        .finally(() => setLoading(false));
    }
  }, []);

  const sourceWOs = liveWOs.length > 0 ? liveWOs : (workOrders || []);
  const activeWOs = sourceWOs.filter(wo => (wo.status || '').toLowerCase() !== 'completed');

  const filtered = activeWOs.filter(wo =>
    !searchQ ||
    (wo.id || '').toLowerCase().includes(searchQ.toLowerCase()) ||
    (wo.productName || wo.product || wo.item || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-panel" style={{ width: '680px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Select Work Order for Laboratory QA</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose an active Work Order to automatically pre-fill into all 24 QA test forms</span>
          </div>
          {onClose && <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} onClick={onClose}><X size={18} /></button>}
        </div>
        <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Search */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><Search size={14} /></span>
            <input
              className="form-input"
              style={{ paddingLeft: '36px', height: '40px', width: '100%' }}
              placeholder="Search active Work Order ID or Item..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              autoFocus
            />
          </div>

          {/* Option to clear selection / show all */}
          <div
            onClick={() => onSelect(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              marginBottom: '14px',
              borderRadius: '8px',
              border: '1px dashed var(--accent)',
              backgroundColor: 'rgba(251, 191, 36, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.14)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.06)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={18} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)' }}>No Work Order (General / Manual Entry)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fill test forms without a pre-linked Work Order</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)' }}>Clear Selection ›</span>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
              Loading active Work Orders...
            </div>
          )}

          {/* List of active Work Orders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(wo => {
              const statusColor = LAB_STATUS_COLOR[wo.status] || '#6b7280';
              const line = wo.lineNo || wo.custom_production_line || wo.production_line || 'Filling Line';
              return (
                <div
                  key={wo.id}
                  onClick={() => onSelect(wo)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-heading)' }}>{wo.id}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                      }}>
                        {wo.status}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--primary, #2563eb)'
                      }}>
                        {line}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {wo.productName || wo.product || wo.item}
                      {wo.qty ? ` • Qty: ${wo.qty}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="primary-btn"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(wo);
                    }}
                  >
                    Select WO
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active Work Orders found matching &quot;{searchQ}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const LAB_FORM_TYPE_MAP = {
  form1: 'Form 1 (Micro raw)',
  form9: 'Form 9 (Chemical)',
  form11: 'Form 11 (Micro water)',
  form21: 'Form 21 (Taste/Visual)',
  form35: 'Form 35: Gold Stone Rum & Cola',
  form36: 'Form 36 (Bourbon/Cola)',
  form16: 'Form 16 (Container Loading Inspection)',
  form105: 'Form 105 (CSD RTD Line Start Sensory Evaluation)',
  form86: 'Form 86: Incubator Temperature Record',
  form88: 'Form 88: Weight Check Checklist',
  form103: 'Form 103 (Silver Log)',
  form104: 'Form 104 (Seam Checklist Form)',
  form12: 'Form 12 (Autoclave Record)',
  form85: 'Form 12 (Autoclave Record)',
  form13: 'Form 13 (Media Preparation Record)',
  form64: 'Form 64 (Rinse-Off Test for Raw Materials)',
  form72: 'Form 72 (Library Sample Record)',
  form47: 'Form 47 (Traceability of products)',
  form39: 'Form 39 (Induction)',
  form83: 'Form 83 (Microbiological Analysis)',
  form84: 'Form 84 (Sanitation)',
  form34: 'Form 34: Monitoring',
  form100: 'Form 100: Production Record Form',
  form69: 'Form 69: Mock Product Recall',
  form70: 'Form 70: Recall Review'
};

export default function LaboratoryTab({
  laboratoryRecords,
  labSearchQuery,
  setLabSearchQuery,
  labFilterType,
  setLabFilterType,
  filteredLabRecords,
  labPage,
  setLabPage,
  labViewMode,
  setLabViewMode,
  setActiveLabForm,
  setViewingLabRecord,
  selectedLabWO,
  setSelectedLabWO,
  workOrders,
  formPermissions = null
}) {
  const [showWOSelector, setShowWOSelector] = useState(false);
  const [woOnlyFilter, setWoOnlyFilter] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [checklistSearch, setChecklistSearch] = useState('');

  // Active records dynamically scoped to selected Work Order (or all records if none selected)
  const activeRecords = selectedLabWO
    ? laboratoryRecords.filter(r => (r.work_order && r.work_order === selectedLabWO.id) || (r.workOrder && r.workOrder === selectedLabWO.id))
    : laboratoryRecords;

  const getLabTotalTests = () => activeRecords.length;

  const getLabMicroCompliance = () => {
    const microRecords = activeRecords.filter(r => r.type && (r.type.includes('Micro') || r.type.includes('Form 1') || r.type.includes('Form 11') || r.type.includes('Form 83')));
    if (microRecords.length === 0) return 100;
    let passed = 0;
    microRecords.forEach(r => {
      if (r.type === 'Form 1 (Micro raw)') {
        const allAbsent = r.sampleRows?.every(row =>
          String(row.tcc || '').toLowerCase().includes('absent') || String(row.tcc || '').toLowerCase().includes('neg') ||
          String(row.ecoli || '').toLowerCase().includes('absent') || String(row.ecoli || '').toLowerCase().includes('neg')
        );
        if (allAbsent) passed++;
      } else if (r.type === 'Form 11 (Micro water)') {
        const allAbsent = r.sampleRows?.every(row => {
          const tccPassed = !row.tcc || String(row.tcc).toLowerCase().includes('absent') || String(row.tcc).toLowerCase().includes('neg') || String(row.tcc) === '';
          const ecoliPassed = !row.ecoli || String(row.ecoli).toLowerCase().includes('absent') || String(row.ecoli).toLowerCase().includes('neg') || String(row.ecoli) === '';
          const hpcPassed = Number(row.hpc1 || 0) < 100 && Number(row.hpc2 || 0) < 100;
          return tccPassed && ecoliPassed && hpcPassed;
        });
        if (allAbsent) passed++;
      } else {
        passed++;
      }
    });
    return Math.round((passed / microRecords.length) * 100);
  };

  const getLabChemCompliance = () => {
    const chemRecords = activeRecords.filter(r => r.type && (r.type.includes('Chemical') || r.type.includes('Form 9')));
    if (chemRecords.length === 0) return 100;
    let passed = 0;
    chemRecords.forEach(r => {
      const rawPhVal = Number(r.rawPh || 7.0);
      const rawTdsVal = Number(r.rawTds || 100);
      const prodPhVal = Number(r.prodPh || 7.2);
      const prodTdsVal = Number(r.prodTds || 120);

      const rawPassed = rawPhVal >= 6.5 && rawPhVal <= 8.5 && rawTdsVal >= 50 && rawTdsVal <= 500;
      const prodPassed = prodPhVal >= 6.5 && prodPhVal <= 8.5 && prodTdsVal >= 50 && prodTdsVal <= 500;
      if (rawPassed && prodPassed) passed++;
    });
    return Math.round((passed / chemRecords.length) * 100);
  };

  const microCompliance = getLabMicroCompliance();
  const chemCompliance = getLabChemCompliance();

  const handleSelectWO = (wo) => {
    if (setSelectedLabWO) setSelectedLabWO(wo);
    setShowWOSelector(false);
  };

  // Records filtered by WO if woOnlyFilter is active
  const displayedRecords = woOnlyFilter && selectedLabWO
    ? filteredLabRecords.filter(r => (r.work_order && r.work_order === selectedLabWO.id) || (r.workOrder && r.workOrder === selectedLabWO.id))
    : filteredLabRecords;

  const LAB_TEMPLATES = [
    { id: 'form1', icon: FileText, name: 'Form 1: Raw Materials Micro', desc: 'Microbiological analysis of primary packaging raw materials (Preforms, Closures, BIB bags).' },
    { id: 'form9', icon: BarChart2, name: 'Form 9: Chemical Test', desc: 'pH, TDS levels check for Raw/Product Water, post-CIP levels, and conductivity calibration.' },
    { id: 'form11', icon: FlaskConical, name: 'Form 11: Water Micro', desc: 'Cultivate SPC Agar incubation, TCC and E-Coli counts for Silver Ion, BH, and 0.45um Filter.' },
    { id: 'form21', icon: Eye, name: 'Form 21: Taste & Visual', desc: 'Log 4h/36h/72h taste properties and 5d/10d/30d visual particle shelf-life checks.' },
    { id: 'form35', icon: Wine, name: 'Form 35: Gold Stone Rum & Cola', desc: 'Tank batch records, ingredients checklist (Ethanol, Rum/Lemon/Cola flavours), Brix mixer %, alcohol test, and pH levels.' },
    { id: 'form36', icon: Wine, name: 'Form 36: Bourbon Whiskey & Cola', desc: 'Tank batch records, ingredients checklist, Brix % checks, alcohol test, and gas pressure.' },
    { id: 'form16', icon: Truck, name: 'Form 16: Container Loading Inspection', desc: 'Container loading inspection log, cleanliness, damage, seals, shipping line, and cargo verification.' },
    { id: 'form105', icon: FlaskConical, name: 'Form 105: CSD RTD Line Start Sensory Evaluation', desc: 'CSD & RTD line start sensory evaluation log, appearance, aroma, taste, carbonation, and overall quality check.' },
    { id: 'form83', icon: Microscope, name: 'Form 83: Microbiological Analysis', desc: 'Microbiological analysis log sheet for raw materials, water, and finished products.' },
    { id: 'form84', icon: Sparkles, name: 'Form 84: Sanitation', desc: 'Sanitation check log sheet for equipment, line CIP, and plant cleanliness.' },
    { id: 'form12', icon: Flame, name: 'Form 12: Autoclave Record', desc: 'Autoclave sterilization log, pressure, temperature, cycle duration, and indicator checks.' },
    { id: 'form13', icon: FlaskConical, name: 'Form 13: Media Preparation Record', desc: 'Media and culture agar preparation log, lot/batch numbers, sterilization temp, pH checks, and sterility verification.' },
    { id: 'form64', icon: FlaskConical, name: 'Form 64: Rinse-Off Test for Raw Materials', desc: 'Rinse-off microbiological testing log for preforms, closures, bottles, and raw material contact surfaces.' },
    { id: 'form72', icon: Package, name: 'Form 72: Library Sample Record', desc: 'Retention library sample log, bottle size, batch codes, storage location, shelf life, and periodic evaluation.' },
    { id: 'form47', icon: Search, name: 'Form 47: Traceability of products', desc: 'Product batch traceability log, raw material lot numbers, water source batch, line assignment, and dispatch tracking.' },
    { id: 'form39', icon: FileEdit, name: 'Form 39: Induction', desc: 'Employee, visitor, and contractor site safety & hygiene induction log and verification.' },
    { id: 'form86', icon: Thermometer, name: 'Form 86: Incubator Temperature Record', desc: 'Record incubator daily temp & check times for Incubator No. 1 and Incubator No. 2.' },
    { id: 'form88', icon: Scale, name: 'Form 88: Weight Check Checklist', desc: 'Execute and log weight checks for finished products (twice daily frequency).' },
    { id: 'form103', icon: Radio, name: 'Form 103: Silver Photometer Log', desc: 'Daily photometer readings for Silver Ion (spec >10ppb) and standard calibration tests.' },
    { id: 'form104', icon: Container, name: 'Form 104: Seam Checklist Form', desc: 'Can seam inspection checklist, cover/body thickness, countersink, overlap %, seam height and visual check.' },
    { id: 'form34', icon: TrendingUp, name: 'Form 34: Monitoring', desc: 'Monitoring log sheet for quality checks, parameters, and process control points.' },
    { id: 'form100', icon: Factory, name: 'Form 100: Production Record Form', desc: 'Daily production batch logs, line speeds, shift metrics, and output counts.' },
    { id: 'form69', icon: Megaphone, name: 'Form 69: Mock Product Recall', desc: 'Mock product recall exercise details, traceability, recovery %, and incident log.' },
    { id: 'form70', icon: FileEdit, name: 'Form 70: Recall Review', desc: 'Post-recall review meeting findings, root cause, resolution actions, and cost analysis.' }
  ];

  // Check logs per template for the active scope
  const getLogsForTemplate = (tpl) => {
    return activeRecords.filter(r =>
      r.templateId === tpl.id ||
      r.type === tpl.name ||
      (LAB_FORM_TYPE_MAP[tpl.id] && r.type === LAB_FORM_TYPE_MAP[tpl.id]) ||
      (r.type && r.type.toLowerCase().includes(tpl.id.toLowerCase()))
    );
  };

  const completedCount = LAB_TEMPLATES.filter(t => getLogsForTemplate(t).length > 0).length;
  const pendingCount = Math.max(0, LAB_TEMPLATES.length - completedCount);

  // Filtered templates for search & status tab
  const filteredTemplates = LAB_TEMPLATES.filter(tpl => {
    if (formPermissions && formPermissions[tpl.id] && formPermissions[tpl.id].can_view === false) {
      return false;
    }
    const logs = getLogsForTemplate(tpl);
    const isCompleted = logs.length > 0;
    if (checklistFilter === 'completed' && !isCompleted) return false;
    if (checklistFilter === 'pending' && isCompleted) return false;

    if (checklistSearch) {
      const q = checklistSearch.toLowerCase();
      return (tpl.name || '').toLowerCase().includes(q) || (tpl.desc || '').toLowerCase().includes(q) || tpl.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="maintenance-tab-container">
      {/* WO Selector Modal */}
      {showWOSelector && (
        <LabWOSelectorPopup
          workOrders={workOrders || []}
          onSelect={handleSelectWO}
          onClose={() => setShowWOSelector(false)}
        />
      )}

      <div className="tab-title-desc">
        <h2>Laboratory & Quality Control</h2>
        <p>Log and review raw materials microbiological status, chemical properties, water micro-compliance, and visual taste inspections.</p>
      </div>

      {/* Global Work Order Context Banner at Head of Laboratory Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        marginBottom: '20px',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        backgroundColor: selectedLabWO ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-secondary)',
        borderLeft: selectedLabWO ? '5px solid var(--accent)' : '5px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ClipboardList size={22} />
          <div>
            {selectedLabWO ? (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Work Order for Laboratory QA Testing
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-heading)' }}>
                  {selectedLabWO.id}
                  <span style={{ fontWeight: '500', color: 'var(--text-muted)', marginLeft: '10px' }}>
                    — {selectedLabWO.productName || selectedLabWO.product || selectedLabWO.item}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: `${LAB_STATUS_COLOR[selectedLabWO.status] || '#6b7280'}20`,
                    color: LAB_STATUS_COLOR[selectedLabWO.status] || '#6b7280',
                  }}>
                    {selectedLabWO.status}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--primary, #2563eb)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    {selectedLabWO.lineNo || selectedLabWO.custom_production_line || selectedLabWO.production_line || 'Filling Line'}
                  </span>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-heading)' }}>
                  All Laboratory Forms (No Work Order Selected)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Select an active Work Order to automatically pre-fill the Work Order field and align cards dynamically with the selected batch.
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedLabWO && (
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
              onClick={() => {
                if (setSelectedLabWO) setSelectedLabWO(null);
              }}
              title="Clear selected Work Order"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            className="primary-btn"
            style={{ padding: '7px 16px', fontSize: '12px', fontWeight: '700' }}
            onClick={() => setShowWOSelector(true)}
          >
            {selectedLabWO ? '⟳ Change Work Order' : '+ Select Work Order'}
          </button>
        </div>
      </div>

      {/* Lab Dashboard metrics (Dynamically Aligned with Selected Work Order) */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL QUALITY TESTS</span>
            <FlaskConical size={20} />
          </div>
          <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0' }}>{getLabTotalTests()}</div>
          <span style={{ fontSize: '11px', color: selectedLabWO ? 'var(--accent)' : 'var(--text-muted)', fontWeight: selectedLabWO ? '600' : '400' }}>
            {selectedLabWO ? `Logged for ${selectedLabWO.id}` : 'Logged across all parameters'}
          </span>
        </div>

        <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>MICRO COMPLIANCE</span>
            <Microscope size={20} />
          </div>
          <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: microCompliance < 90 ? 'var(--danger)' : 'var(--success)' }}>
            {microCompliance}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {selectedLabWO ? `${completedCount} of 22 forms submitted` : 'Target: 100% Absent E-Coli'}
          </span>
        </div>

        <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>CHEMICAL COMPLIANCE</span>
            <TrendingDown size={20} />
          </div>
          <div className="metric-value" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0', color: chemCompliance < 90 ? 'var(--danger)' : 'var(--success)' }}>
            {chemCompliance}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {selectedLabWO ? `Batch specs for ${selectedLabWO.id}` : 'pH (6.5-8.5) & TDS spec'}
          </span>
        </div>

        <div className="metric-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>LAST TEST LOGGED</span>
            <Microscope size={20} />
          </div>
          <div className="metric-value" style={{ fontSize: '13px', fontWeight: '800', margin: '14px 0 10px 0', color: 'var(--accent)' }}>
            {activeRecords[0] ? activeRecords[0].timestamp.split(' ')[1] || activeRecords[0].timestamp : (selectedLabWO ? 'No logs yet' : 'No entries')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {activeRecords[0] ? `Date: ${activeRecords[0].timestamp.split(' ')[0]}` : (selectedLabWO ? `Awaiting logs for ${selectedLabWO.id}` : 'N/A')}
          </span>
        </div>
      </div>

      {/* Lab Forms action sheets grid (Dynamically Aligned with Selected Work Order) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>
              Available Daily Quality Checklists
              {selectedLabWO && (
                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--accent)', marginLeft: '8px' }}>
                  ({completedCount} completed • {pendingCount} pending for {selectedLabWO.id})
                </span>
              )}
            </h3>

            {/* Quick status tabs */}
            {selectedLabWO && (
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: checklistFilter === 'all' ? '700' : '500',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: checklistFilter === 'all' ? 'var(--bg-card)' : 'transparent',
                    color: checklistFilter === 'all' ? 'var(--text-heading)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setChecklistFilter('all')}
                >
                  All ({LAB_TEMPLATES.length})
                </button>
                <button
                  type="button"
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: checklistFilter === 'pending' ? '700' : '500',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: checklistFilter === 'pending' ? 'var(--bg-card)' : 'transparent',
                    color: checklistFilter === 'pending' ? 'var(--warning)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setChecklistFilter('pending')}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: checklistFilter === 'completed' ? '700' : '500',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: checklistFilter === 'completed' ? 'var(--bg-card)' : 'transparent',
                    color: checklistFilter === 'completed' ? 'var(--success)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setChecklistFilter('completed')}
                >
                  Logged ({completedCount})
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '180px', height: '32px', fontSize: '11px' }}
              placeholder="Filter checklists..."
              value={checklistSearch}
              onChange={e => setChecklistSearch(e.target.value)}
            />
            <button
              type="button"
              className="secondary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
              onClick={() => setLabViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            >
              {labViewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
          </div>
        </div>

        {labViewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {filteredTemplates.map(tpl => {
              const logs = getLogsForTemplate(tpl);
              const isDoneForWO = selectedLabWO && logs.length > 0;

              return (
                <div
                  key={tpl.id}
                  className="template-card"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: isDoneForWO ? '4px solid var(--success)' : (selectedLabWO ? '4px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)'),
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isDoneForWO ? '0 2px 8px rgba(16, 185, 129, 0.08)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge
                        variant={isDoneForWO ? 'success' : (selectedLabWO ? 'warning' : 'primary')}
                        size="md"
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: 0,
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                      >
                        {typeof tpl.icon === 'function' || typeof tpl.icon === 'object' ? <tpl.icon size={18} /> : tpl.icon}
                      </Badge>
                      <strong style={{ fontSize: '13px', color: 'var(--text-heading)' }}>{tpl.name}</strong>
                    </div>
                  </div>

                  {/* Work Order completion tag */}
                  {selectedLabWO && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isDoneForWO ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: 'var(--success)',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          {logs.length} Logged for {selectedLabWO.id}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          color: 'var(--warning)',
                          border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                          Pending for {selectedLabWO.id}
                        </span>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1, margin: '2px 0' }}>{tpl.desc}</p>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: isDoneForWO ? 'var(--success)' : 'var(--text-muted)', fontWeight: isDoneForWO ? '700' : '400' }}>
                      {logs.length > 0 ? `${logs.length} logged` : '0 entries'}
                    </span>
                    {(!formPermissions || !formPermissions[tpl.id] || formPermissions[tpl.id].can_create !== false) ? (
                      <button
                        className="primary-btn"
                        style={{
                          fontSize: '11px',
                          padding: '6px 12px',
                          backgroundColor: isDoneForWO ? 'var(--success)' : undefined
                        }}
                        onClick={() => setActiveLabForm(tpl.id)}
                      >
                        {isDoneForWO ? `Logged • + Add` : 'Fill Form'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                        View Only
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                  <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>Icon</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '240px' }}>Form Title / Template</th>
                  {selectedLabWO && <th style={{ padding: '8px', textAlign: 'left', width: '160px' }}>WO Status</th>}
                  <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map(tpl => {
                  const logs = getLogsForTemplate(tpl);
                  const isDoneForWO = selectedLabWO && logs.length > 0;

                  return (
                    <tr key={tpl.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <Badge
                          variant={isDoneForWO ? 'success' : (selectedLabWO ? 'warning' : 'primary')}
                          size="sm"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            display: 'inline-flex'
                          }}
                        >
                          {typeof tpl.icon === 'function' || typeof tpl.icon === 'object' ? <tpl.icon size={15} /> : tpl.icon}
                        </Badge>
                      </td>
                      <td style={{ padding: '8px', fontWeight: '700' }}>{tpl.name}</td>
                      {selectedLabWO && (
                        <td style={{ padding: '8px' }}>
                          {isDoneForWO ? (
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)' }}>
                              {logs.length} Logged
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--warning)' }}>
                              Pending
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{tpl.desc}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {(!formPermissions || !formPermissions[tpl.id] || formPermissions[tpl.id].can_create !== false) ? (
                          <button
                            className="primary-btn"
                            style={{
                              fontSize: '11px',
                              padding: '4px 10px',
                              backgroundColor: isDoneForWO ? 'var(--success)' : undefined
                            }}
                            onClick={() => setActiveLabForm(tpl.id)}
                          >
                            {isDoneForWO ? `Logged • + Add` : 'Fill Form'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '3px 6px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lab Logs register list */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Laboratory Quality Control Register</h3>
            {selectedLabWO && (
              <button
                type="button"
                className="secondary-btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '20px',
                  backgroundColor: woOnlyFilter ? 'var(--accent)' : 'transparent',
                  color: woOnlyFilter ? '#000' : 'var(--text-muted)',
                  borderColor: woOnlyFilter ? 'var(--accent)' : 'var(--border-color)'
                }}
                onClick={() => setWoOnlyFilter(prev => !prev)}
              >
                {woOnlyFilter ? `Filtered: ${selectedLabWO.id}` : `Filter by ${selectedLabWO.id}`}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '220px', height: '32px', fontSize: '12px' }}
              placeholder="Search log by Analyst/ID..."
              value={labSearchQuery}
              onChange={(e) => setLabSearchQuery(e.target.value)}
            />
            <select
              className="form-input"
              style={{ width: '180px', height: '32px', fontSize: '12px' }}
              value={labFilterType}
              onChange={(e) => setLabFilterType(e.target.value)}
            >
              <option value="All">All Form Types</option>
              <option value="Form 1 (Micro raw)">Form 1 (Micro raw)</option>
              <option value="Form 9 (Chemical)">Form 9 (Chemical)</option>
              <option value="Form 11 (Micro water)">Form 11 (Micro water)</option>
              <option value="Form 21 (Taste/Visual)">Form 21 (Taste/Visual)</option>
              <option value="Form 16 (Container Loading Inspection)">Form 16 (Container Loading Inspection)</option>
              <option value="Form 105 (CSD RTD Line Start Sensory Evaluation)">Form 105 (CSD RTD Line Start Sensory Evaluation)</option>
              <option value="Form 104 (Seam Checklist Form)">Form 104 (Seam Checklist Form)</option>
            </select>
          </div>
        </div>

        {displayedRecords.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            {woOnlyFilter && selectedLabWO
              ? `No quality control checks logged for Work Order ${selectedLabWO.id} yet.`
              : 'No quality control checks found. Select a form card above to submit a new test log.'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Log ID</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Work Order</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Form Template</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Analyst</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Workflow Status</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Specification</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Submitted</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRecords.slice((labPage - 1) * 20, labPage * 20).map((rec) => {
                    let compliancePass = true;
                    if (rec.type === 'Form 1 (Micro raw)') {
                      compliancePass = rec.sampleRows?.every(row =>
                        String(row.tcc).toLowerCase().includes('absent') && String(row.ecoli).toLowerCase().includes('absent')
                      );
                    } else if (rec.type === 'Form 11 (Micro water)') {
                      compliancePass = rec.sampleRows?.every(row =>
                        (!row.tcc || String(row.tcc).toLowerCase().includes('absent')) &&
                        (!row.ecoli || String(row.ecoli).toLowerCase().includes('absent')) &&
                        Number(row.hpc1 || 0) < 100
                      );
                    } else if (rec.type === 'Form 9 (Chemical)') {
                      const rPh = Number(rec.rawPh || 7.0);
                      const pPh = Number(rec.prodPh || 7.2);
                      compliancePass = rPh >= 6.5 && rPh <= 8.5 && pPh >= 6.5 && pPh <= 8.5;
                    }

                    const recWO = rec.work_order || rec.workOrder || '';

                    return (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ fontWeight: '700', padding: '10px' }}>{rec.id}</td>
                        <td style={{ padding: '10px' }}>
                          {recWO ? (
                            <span style={{
                              fontWeight: '700',
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: 'var(--primary, #2563eb)',
                              border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>
                              {recWO}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <strong>{rec.type}</strong>
                        </td>
                        <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={13} style={{ color: 'var(--text-muted)' }} />{rec.analyst || rec.tested_by || rec.prepared_by || rec.operator || 'Not Specified'}</td>
                        <td style={{ padding: '10px' }}>
                          <StageStatusBadge record={rec} />
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${compliancePass ? 'badge-completed' : 'badge-failed'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {compliancePass ? 'Within Specification' : 'Action Required'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{rec.timestamp}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => setViewingLabRecord(rec)}
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
              <button
                type="button"
                className="secondary-btn"
                disabled={labPage === 1}
                onClick={() => setLabPage(prev => Math.max(1, prev - 1))}
              >
                ◀ Previous
              </button>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>
                Page {labPage} of {Math.max(1, Math.ceil(displayedRecords.length / 20))}
              </span>
              <button
                type="button"
                className="secondary-btn"
                disabled={labPage === Math.max(1, Math.ceil(displayedRecords.length / 20))}
                onClick={() => setLabPage(prev => Math.min(Math.max(1, Math.ceil(displayedRecords.length / 20)), prev + 1))}
              >
                Next ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}