import React, { useState, useMemo, useEffect } from 'react';
import './IncidentsTab.css';
import { frappe } from '../services/frappe';
import {
  ArrowLeft,
  Search,
  TriangleAlert,
  Clock,
  Eye,
  Pen,
  ClipboardCheck,
  Plus,
  X,
  CheckCircle2,
  AlertOctagon,
  Factory,
  Save,
  ShieldAlert,
  Wrench,
  FlaskConical,
  PackageX,
  Droplets,
  Activity,
  Timer,
  AlertCircle,
  Hourglass,
  ListFilter,
  Info,
  CircleDot,
  Tag,
  Layers,
  Link2,
  FileText,
  Calendar,
  User,
  Package,
  Sliders,
  RefreshCw,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { LabReportViewerModal } from './LaboratoryTab';
import { SafetyReportViewerModal } from './SafetyTab';
import { MaintenanceReportViewerModal } from './MaintenanceTab';
import { CleaningRecordDetailModal } from './CleaningTab';

export const getFrappeDocUrl = (doctype, name) => {
  if (!doctype) return null;
  const slug = doctype.toLowerCase().replace(/ /g, '-');
  if (name) {
    return `/app/${slug}/${encodeURIComponent(name)}`;
  }
  return `/app/${slug}`;
};

export const mapApiIncident = (inc) => {
  const dtNum = Number(inc.downtime_minutes) || Number(inc.downtimeMinutes) || 0;
  const rejNum = Number(inc.units_rejected) || Number(inc.unitsRejected) || 0;
  const id = inc.name || inc.id;
  const rawTime = inc.reported_time || inc.time || '';
  const time = rawTime && rawTime.length >= 16 ? rawTime.slice(11, 16) : (rawTime || '08:00');
  const date = rawTime && rawTime.length >= 10 ? rawTime.slice(0, 10) : '';

  return {
    id,
    name: inc.name || id,
    category: inc.category || 'Process Deviation',
    severity: (inc.severity || 'medium').toLowerCase(),
    status: (inc.status || 'open').toLowerCase(),
    investigationStatus: inc.investigation_status || inc.investigationStatus || 'Pending',
    investigation_status: inc.investigation_status || inc.investigationStatus || 'Pending',
    description: inc.description || inc.incident_title || 'Plant incident logged',
    incident_title: inc.incident_title || inc.description,
    time,
    date,
    reported_time: inc.reported_time,
    line: inc.production_line || inc.line || 'FL1',
    production_line: inc.production_line || inc.line || 'FL1',
    work_order: inc.work_order || inc.workOrder || '',
    workOrder: inc.work_order || inc.workOrder || '',
    production_item: inc.production_item || '',
    batch_no: inc.batch_no || '',
    downtime: dtNum > 0 ? `${dtNum} min downtime` : null,
    downtimeMinutes: dtNum,
    unitsRejected: rejNum,
    units_rejected: rejNum,
    rootCause: inc.root_cause_analysis || inc.rootCause || '',
    root_cause_analysis: inc.root_cause_analysis || inc.rootCause || '',
    correctiveAction: inc.corrective_action || inc.correctiveAction || '',
    corrective_action: inc.corrective_action || inc.correctiveAction || '',
    reportedBy: inc.reported_by || inc.reportedBy || '',
    reported_by: inc.reported_by || inc.reportedBy || '',
    detection_type: inc.detection_type || 'Direct Entry',
    source_doctype: inc.source_doctype || '',
    source_name: inc.source_name || '',
    resolved_by: inc.resolved_by || '',
    resolution_date: inc.resolution_date || ''
  };
};

export const normalizeIncidentStatus = (stat) => {
  if (!stat) return 'Open';
  const s = String(stat).trim().toLowerCase();
  if (s === 'open') return 'Open';
  if (s === 'acknowledged') return 'Acknowledged';
  if (s === 'pending') return 'Pending';
  if (s === 'resolved') return 'Resolved';
  if (s === 'closed') return 'Closed';
  return stat.charAt(0).toUpperCase() + stat.slice(1);
};

const INITIAL_INCIDENTS = [
  {
    id: 'INC-2025-001',
    category: 'Equipment Fault',
    severity: 'high',
    status: 'acknowledged',
    investigationStatus: 'Pending',
    description: 'Can seamer misalignment detected — 3 rejected units',
    time: '09:15',
    line: 'FL4',
    downtime: '7 min downtime',
    downtimeMinutes: 7,
    unitsRejected: 3,
    rootCause: 'Can guide plate vibration caused slight angular tilt during seaming rotation.',
    correctiveAction: 'Calibrate seamer chuck alignment and retighten fastening brackets.',
    reportedBy: 'Devendra K. (Operator FL4)'
  },
  {
    id: 'INC-2025-002',
    category: 'Quality Alert',
    severity: 'critical',
    status: 'open',
    investigationStatus: 'Pending',
    description: 'pH reading 8.1 exceeds max limit 7.5 on FL1',
    time: '10:05',
    line: 'FL1',
    downtime: null,
    downtimeMinutes: 0,
    unitsRejected: 0,
    rootCause: 'Under investigation — raw water feed fluctuation observed after sand filter backwash.',
    correctiveAction: 'Dosing pump adjustment requested; line held for QA supervisor re-test.',
    reportedBy: 'Kavita S. (Lab Analyst)'
  },
  {
    id: 'INC-2025-003',
    category: 'Material Shortage',
    severity: 'medium',
    status: 'open',
    investigationStatus: 'Pending',
    description: '330ml labels running low — 2000 remaining',
    time: '08:30',
    line: 'FL2',
    downtime: null,
    downtimeMinutes: 0,
    unitsRejected: 0,
    rootCause: 'Warehouse requisition delayed; roll pallet held in staging area.',
    correctiveAction: 'Expedite internal transfer from Extra Goods Warehouse - CWFPL.',
    reportedBy: 'Sanjay M. (Line Supervisor)'
  },
  {
    id: 'INC-2025-004',
    category: 'Cleaning Required',
    severity: 'low',
    status: 'resolved',
    investigationStatus: 'Resolved',
    description: 'FL3 post-CIP verification pending',
    time: '07:00',
    line: 'FL3',
    downtime: '60 min downtime',
    downtimeMinutes: 60,
    unitsRejected: 0,
    rootCause: 'Scheduled CIP sanitization cycle required ATP swab validation prior to production restart.',
    correctiveAction: 'Swab results verified clear (<10 RLU). Production clearance granted.',
    reportedBy: 'Priya N. (QC Officer)'
  },
  {
    id: 'INC-2025-005',
    category: 'Safety',
    severity: 'high',
    status: 'open',
    investigationStatus: 'Pending',
    description: 'Emergency stop triggered on FL3 — conveyor jam',
    time: '09:45',
    line: 'FL3',
    downtime: null,
    downtimeMinutes: 0,
    unitsRejected: 0,
    rootCause: 'Bottle accumulation sensor failed to trigger slow-down relay.',
    correctiveAction: 'Optical sensor cleaned and tested. Safety interlock functional.',
    reportedBy: 'Carlos M. (Line Lead)'
  }
];

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Equipment Fault':
      return Wrench;
    case 'Quality Alert':
      return FlaskConical;
    case 'Material Shortage':
      return PackageX;
    case 'Cleaning Required':
      return Droplets;
    case 'Safety':
      return ShieldAlert;
    case 'Process Deviation':
      return Activity;
    default:
      return TriangleAlert;
  }
};

const getSeverityIcon = (sev) => {
  switch (sev?.toLowerCase()) {
    case 'critical':
      return AlertOctagon;
    case 'high':
      return TriangleAlert;
    case 'medium':
      return AlertCircle;
    case 'low':
      return Info;
    default:
      return TriangleAlert;
  }
};

const getStatusIcon = (stat) => {
  switch (stat?.toLowerCase()) {
    case 'open':
      return CircleDot;
    case 'acknowledged':
      return Clock;
    case 'pending':
      return Hourglass;
    case 'resolved':
      return CheckCircle2;
    default:
      return ListFilter;
  }
};

export default function IncidentsTab({
  safetyRecords = [],
  setSafetyRecords,
  onBack = () => {},
  onNavigate = () => {},
  setSelectedWOId,
  workOrders = []
}) {
  const [incidents, setIncidents] = useState(() => {
    const conn = frappe.getConnectionSettings?.() || frappe.connection || {};
    if (conn.isLive || conn.connected) {
      return [];
    }
    // Fallback mock incidents only when offline or disconnected
    if (safetyRecords && safetyRecords.length > 0) {
      const mappedSafety = safetyRecords.map((r, idx) => ({
        id: r.id || r.name || `INC-REC-${idx + 1}`,
        category: r.incident_type || r.type || 'Safety',
        severity: (r.severity || 'high').toLowerCase(),
        status: (r.status || 'open').toLowerCase(),
        investigationStatus: r.investigation_status || (r.status === 'Resolved' ? 'Resolved' : 'Pending'),
        description: r.details || r.description || r.title || 'Workplace incident logged',
        time: r.incidentTime || '08:00',
        line: r.incidentLocation || r.line || 'FL1',
        downtime: r.downtime ? `${r.downtime} min downtime` : null,
        downtimeMinutes: Number(r.downtime) || 0,
        unitsRejected: Number(r.unitsRejected) || 0,
        rootCause: r.rootCause || '',
        correctiveAction: r.correctiveAction || '',
        reportedBy: r.injuredPerson || r.operator || 'Operator',
        source_doctype: r.source_doctype || r.doctype || (r.incident_type || r.type ? (r.type || r.incident_type) : ''),
        source_name: r.source_name || r.name || r.id || ''
      }));
      return [...INITIAL_INCIDENTS, ...mappedSafety];
    }
    return INITIAL_INCIDENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'open' | 'acknowledged' | 'pending' | 'resolved'
  const [loading, setLoading] = useState(false);
  const [savingIncident, setSavingIncident] = useState(false);

  const fetchLiveIncidents = async () => {
    try {
      setLoading(true);
      const apiIncidents = await frappe.getIncidents({ limit: 200 });
      if (Array.isArray(apiIncidents)) {
        setIncidents(apiIncidents.map(mapApiIncident));
      }
    } catch (err) {
      console.warn('[IncidentsTab] Failed to load live incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveIncidents();
  }, []);
  
  // Modals state
  const [viewingIncident, setViewingIncident] = useState(null);
  const [investigatingIncident, setInvestigatingIncident] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // In-app Source Record Viewer Modal state
  const [activeSourceModal, setActiveSourceModal] = useState(null); // { type, record, rawDoc, doctype, name, meta }
  const [loadingSourceRecord, setLoadingSourceRecord] = useState(false);

  // Helper to resolve and open source records in the frontend
  const handleOpenSourceRecord = async (doctype, name) => {
    if (!doctype) return;
    const cleanDocType = String(doctype).trim();
    const cleanName = String(name || '').trim();

    // Automatically close incident view modal so it does not block source record
    setViewingIncident(null);

    // 1. Work Order navigation
    if (cleanDocType.toLowerCase() === 'work order') {
      if (setSelectedWOId && cleanName) {
        setSelectedWOId(cleanName);
      }
      if (onNavigate) {
        onNavigate('work-orders');
      }
      return;
    }

    // 2. Fetch the source record from ERPNext / local
    setLoadingSourceRecord(true);
    let docData = null;
    try {
      if (cleanName) {
        const res = await frappe.makeRequest('GET', cleanDocType, cleanName);
        if (res?.data) {
          docData = res.data;
        } else if (res && !res.exception) {
          docData = res;
        }
      }
    } catch (err) {
      console.warn(`[IncidentsTab] Direct fetch for ${cleanDocType} ${cleanName} failed:`, err);
    } finally {
      setLoadingSourceRecord(false);
    }

    // Build normalized record for specialized or generic viewer
    const recordPayload = {
      ...(docData || {}),
      id: cleanName || docData?.name || `${cleanDocType} Record`,
      name: cleanName || docData?.name,
      doctype: cleanDocType,
      type: cleanDocType,
      timestamp: docData?.creation || docData?.posting_date || docData?.date || ''
    };

    // Classify which modal viewer fits best:
    const lowerDoc = cleanDocType.toLowerCase();

    // A. Cleaning & Sanitation DocTypes
    const cleaningDocs = [
      'cleaning of toilets',
      'toilet cleaning purpose',
      'cleaning of dining room',
      'dining room cleaning purpose',
      'factory floor',
      'factory floor cleaning',
      'factory floor cleaning purpose',
      'cleaning of lab and office',
      'lab and office cleaning purpose',
      'balance check or callibration',
      'balance check or calibration',
      'equipment sanitation and cip',
      'outside perimeter cleaning',
      'sanitation record',
      'cip checklist'
    ];
    if (cleaningDocs.some(cd => lowerDoc.includes(cd) || cd.includes(lowerDoc))) {
      setActiveSourceModal({
        kind: 'cleaning',
        record: recordPayload,
        doctype: cleanDocType,
        name: cleanName
      });
      return;
    }

    // B. Safety DocTypes
    const safetyDocs = [
      'accident and disease notification report',
      'incident report',
      'standard form 17 for first aid',
      'first aid log',
      'enviromental swab test',
      'environmental swab test',
      'swab test',
      'induction',
      'induction log',
      'standard form 37'
    ];
    if (safetyDocs.some(sd => lowerDoc.includes(sd) || sd.includes(lowerDoc))) {
      // Normalize type name for SafetyReportViewerModal
      let safetyType = cleanDocType;
      if (lowerDoc.includes('accident') || lowerDoc.includes('disease')) safetyType = 'Incident Report';
      else if (lowerDoc.includes('first aid')) safetyType = 'First Aid Log';
      else if (lowerDoc.includes('swab')) safetyType = 'Swab Test';
      else if (lowerDoc.includes('induction')) safetyType = 'Induction Log';

      setActiveSourceModal({
        kind: 'safety',
        record: { ...recordPayload, type: safetyType },
        doctype: cleanDocType,
        name: cleanName
      });
      return;
    }

    // C. Maintenance DocTypes
    const maintDocs = [
      'daily preventative maintenance schedule',
      'preventive maintenance schedule',
      'preventative maintenance schedule',
      'preventive maintenance request',
      'machine breakdown'
    ];
    if (maintDocs.some(md => lowerDoc.includes(md) || md.includes(lowerDoc))) {
      setActiveSourceModal({
        kind: 'maintenance',
        record: recordPayload,
        doctype: cleanDocType,
        name: cleanName
      });
      return;
    }

    // D. QC / Laboratory DocTypes (Chemical Test, Micro Analysis, Weight Check, etc.)
    const labDocs = [
      'chemical test',
      'microbiological',
      'microbiologiocal',
      'raw and product water',
      'taste test',
      'tank record',
      'autoclave',
      'media preparation',
      'incubator temperature',
      'silver photometer',
      'seam checklist',
      'weight check',
      'hourly weight check',
      'for weight check checklist',
      'retain sample',
      'customer complaint',
      'recall review',
      'library sample',
      'rinse-off',
      'traceability',
      'container loading',
      'sensory evaluation'
    ];
    if (labDocs.some(ld => lowerDoc.includes(ld))) {
      setActiveSourceModal({
        kind: 'laboratory',
        record: recordPayload,
        doctype: cleanDocType,
        name: cleanName
      });
      return;
    }

    // E. Generic fallback modal for any other DocType (with full Frappe fields inspection)
    setActiveSourceModal({
      kind: 'generic',
      record: recordPayload,
      doctype: cleanDocType,
      name: cleanName
    });
  };

  // New incident form states based on Plant Incident DocType proposal
  const [newNamingSeries, setNewNamingSeries] = useState('INC-.YYYY.-.#####');
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Equipment Fault');
  const [newSeverity, setNewSeverity] = useState('High');
  const [newStatus, setNewStatus] = useState('Open');
  const [newInvestigationStatus, setNewInvestigationStatus] = useState('Pending');

  // Context & Tracing
  const [newLine, setNewLine] = useState('FL1');
  const [newWorkOrder, setNewWorkOrder] = useState('');
  const [newProductionItem, setNewProductionItem] = useState('');
  const [newBatchNo, setNewBatchNo] = useState('');
  const [newReportedTime, setNewReportedTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [newReportedBy, setNewReportedBy] = useState('Administrator');

  // Polymorphic Source Link
  const [newDetectionType, setNewDetectionType] = useState('Manual Flag');
  const [newSourceDoctype, setNewSourceDoctype] = useState('Chemical Test');
  const [newSourceName, setNewSourceName] = useState('');

  // Impact Metrics
  const [newDowntime, setNewDowntime] = useState('');
  const [newUnitsRejected, setNewUnitsRejected] = useState('');

  // RCA & CAPA
  const [newDescription, setNewDescription] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newCorrectiveAction, setNewCorrectiveAction] = useState('');
  const [newResolvedBy, setNewResolvedBy] = useState('');
  const [newResolutionDate, setNewResolutionDate] = useState('');

  const resetNewForm = () => {
    setNewIncidentTitle('');
    setNewCategory('Equipment Fault');
    setNewSeverity('High');
    setNewStatus('Open');
    setNewInvestigationStatus('Pending');
    setNewLine('FL1');
    setNewWorkOrder('');
    setNewProductionItem('');
    setNewBatchNo('');
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setNewReportedTime(d.toISOString().slice(0, 16));
    setNewReportedBy('Administrator');
    setNewDetectionType('Manual Flag');
    setNewSourceDoctype('Chemical Test');
    setNewSourceName('');
    setNewDowntime('');
    setNewUnitsRejected('');
    setNewDescription('');
    setNewRootCause('');
    setNewCorrectiveAction('');
    setNewResolvedBy('');
    setNewResolutionDate('');
  };

  const handleSelectWorkOrder = (woId) => {
    setNewWorkOrder(woId);
    const foundWO = (workOrders || []).find(w => (w.id || w.name || w.work_order) === woId);
    if (foundWO) {
      if (foundWO.productName || foundWO.production_item || foundWO.item_name || foundWO.product) {
        setNewProductionItem(foundWO.productName || foundWO.production_item || foundWO.item_name || foundWO.product);
      }
      if (foundWO.lineNo || foundWO.custom_production_line) {
        const rawLine = foundWO.lineNo || foundWO.custom_production_line;
        const shortLine = rawLine.includes('Line 1') ? 'FL1'
          : rawLine.includes('Line 2') ? 'FL2'
          : rawLine.includes('FL3') ? 'FL3'
          : rawLine.includes('FL4') ? 'FL4'
          : rawLine.includes('FL5') ? 'FL5'
          : rawLine.includes('FL6') ? 'FL6'
          : rawLine.includes('FL7') ? 'FL7'
          : rawLine;
        setNewLine(shortLine);
      }
      if (foundWO.batch_no || foundWO.batchNo) {
        setNewBatchNo(foundWO.batch_no || foundWO.batchNo);
      }
    }
  };

  // Counts
  const counts = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const acknowledged = incidents.filter(i => (i.status || '').toLowerCase() === 'acknowledged').length;
    const pending = incidents.filter(i => (i.status || '').toLowerCase() === 'pending').length;
    const resolved = incidents.filter(i => (i.status || '').toLowerCase() === 'resolved').length;
    return { total, open, acknowledged, pending, resolved };
  }, [incidents]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // Status filter
      if (statusFilter !== 'All' && inc.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (inc.category || '').toLowerCase().includes(q) || (inc.incident_title || '').toLowerCase().includes(q);
        const matchDesc = (inc.description || '').toLowerCase().includes(q);
        const matchLine = (inc.line || inc.production_line || '').toLowerCase().includes(q);
        const matchId = (inc.id || '').toLowerCase().includes(q);
        const matchSev = (inc.severity || '').toLowerCase().includes(q);
        const matchWO = (inc.work_order || '').toLowerCase().includes(q);
        const matchItem = (inc.production_item || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLine && !matchId && !matchSev && !matchWO && !matchItem) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, statusFilter, searchQuery]);

  // Handle Save Investigation/Edit
  const handleSaveInvestigation = async (updated) => {
    const dt = Number(updated.downtimeMinutes) || 0;
    const rej = Number(updated.unitsRejected) || 0;
    const cleanStatus = normalizeIncidentStatus(updated.status);

    try {
      await frappe.updateIncidentInvestigation({
        incidentId: updated.name || updated.id,
        status: cleanStatus,
        investigationStatus: updated.investigationStatus || updated.investigation_status,
        rootCause: updated.rootCause || updated.root_cause_analysis,
        correctiveAction: updated.correctiveAction || updated.corrective_action,
        downtimeMinutes: dt,
        unitsRejected: rej,
        resolvedBy: updated.resolved_by,
        resolutionDate: updated.resolution_date
      });
    } catch (err) {
      console.error('[IncidentsTab] Error saving investigation to Frappe:', err);
    }

    setIncidents(prev => prev.map(inc => (inc.id === updated.id || inc.name === updated.id ? { ...updated, status: cleanStatus.toLowerCase() } : inc)));
    setInvestigatingIncident(null);
    if (viewingIncident && (viewingIncident.id === updated.id || viewingIncident.name === updated.id)) {
      setViewingIncident({ ...updated, status: cleanStatus.toLowerCase() });
    }
    fetchLiveIncidents();
  };

  // Handle Create New Incident (Plant Incident DocType)
  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!newIncidentTitle.trim() && !newDescription.trim()) return;

    setSavingIncident(true);
    const yr = new Date().getFullYear();
    const countIndex = incidents.length + 1;
    const tempId = `INC-${yr}-${String(countIndex).padStart(5, '0')}`;
    const dtNum = Number(newDowntime) || 0;
    const rejNum = Number(newUnitsRejected) || 0;

    const payload = {
      naming_series: newNamingSeries,
      incident_title: newIncidentTitle.trim() || newDescription.trim().slice(0, 60),
      category: newCategory,
      severity: newSeverity,
      status: newStatus,
      investigation_status: newInvestigationStatus,
      investigationStatus: newInvestigationStatus,
      line: newLine,
      production_line: newLine,
      work_order: newWorkOrder,
      workOrder: newWorkOrder,
      production_item: newProductionItem,
      batch_no: newBatchNo,
      detection_type: newDetectionType,
      source_doctype: newSourceDoctype,
      source_name: newSourceName,
      downtime_minutes: dtNum,
      units_rejected: rejNum,
      description: newDescription.trim() || newIncidentTitle.trim(),
      root_cause_analysis: newRootCause,
      corrective_action: newCorrectiveAction,
      reported_time: newReportedTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
      reported_by: newReportedBy || 'Operator',
      resolved_by: newResolvedBy,
      resolution_date: newResolutionDate
    };

    let createdRecord = {
      ...payload,
      id: tempId,
      name: tempId,
      severity: newSeverity.toLowerCase(),
      status: newStatus.toLowerCase(),
      time: newReportedTime ? newReportedTime.slice(11, 16) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      downtime: dtNum > 0 ? `${dtNum} min downtime` : null,
      downtimeMinutes: dtNum,
      unitsRejected: rejNum,
      rootCause: newRootCause,
      correctiveAction: newCorrectiveAction
    };

    try {
      const saved = await frappe.createIncident(payload);
      if (saved && (saved.name || saved.id)) {
        createdRecord = mapApiIncident(saved);
      }
    } catch (err) {
      console.error('[IncidentsTab] Error persisting incident to Frappe:', err);
    }

    setIncidents(prev => [createdRecord, ...prev.filter(i => i.id !== createdRecord.id)]);
    setSavingIncident(false);
    setShowNewModal(false);
    resetNewForm();
    fetchLiveIncidents();
  };

  return (
    <div className="incidents-container">

      {/* Header */}
      <div className="incidents-header">
        <div className="incidents-header-left">
          <button className="incidents-back-btn" onClick={onBack} title="Back to Dashboard">
            <ArrowLeft size={18} />
          </button>
          <div className="incidents-header-titles">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1>Incidents</h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                Live Plant Incident
              </span>
            </div>
            <p>Investigation, root cause analysis & resolution tracking</p>
          </div>
        </div>

        <div className="incidents-header-actions">
          <button
            className="incidents-btn-refresh"
            onClick={fetchLiveIncidents}
            title="Refresh incidents from Frappe"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'incidents-spin' : ''} />
          </button>
          <button className="incidents-btn-new" onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> Log Incident
          </button>
        </div>
      </div>

      {/* 5 Status Metric Cards */}
      <div className="incidents-stats-grid">
        <div
          className={`incidents-stat-card ${statusFilter === 'All' ? 'active' : ''}`}
          onClick={() => setStatusFilter('All')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ListFilter size={14} style={{ color: 'var(--text-muted, #6b7280)' }} />
            <p className="incidents-stat-val" style={{ color: 'var(--text-heading, #111827)' }}>{counts.total}</p>
          </div>
          <p className="incidents-stat-lbl">Total</p>
        </div>

        <div
          className={`incidents-stat-card ${statusFilter === 'open' ? 'active' : ''}`}
          onClick={() => setStatusFilter('open')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <AlertCircle size={14} style={{ color: '#ef4444' }} />
            <p className="incidents-stat-val" style={{ color: '#ef4444' }}>{counts.open}</p>
          </div>
          <p className="incidents-stat-lbl">Open</p>
        </div>

        <div
          className={`incidents-stat-card ${statusFilter === 'acknowledged' ? 'active' : ''}`}
          onClick={() => setStatusFilter('acknowledged')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Clock size={14} style={{ color: '#d97706' }} />
            <p className="incidents-stat-val" style={{ color: '#d97706' }}>{counts.acknowledged}</p>
          </div>
          <p className="incidents-stat-lbl">Acknowledged</p>
        </div>

        <div
          className={`incidents-stat-card ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Hourglass size={14} style={{ color: '#7c3aed' }} />
            <p className="incidents-stat-val" style={{ color: '#7c3aed' }}>{counts.pending}</p>
          </div>
          <p className="incidents-stat-lbl">Pending</p>
        </div>

        <div
          className={`incidents-stat-card ${statusFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('resolved')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} style={{ color: '#10b981' }} />
            <p className="incidents-stat-val" style={{ color: '#10b981' }}>{counts.resolved}</p>
          </div>
          <p className="incidents-stat-lbl">Resolved</p>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="incidents-filter-bar">
        <div className="incidents-search-box">
          <Search size={16} className="incidents-search-icon" />
          <input
            type="text"
            className="incidents-search-input"
            placeholder="Search incidents by category, line, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="incidents-tabs">
          {['All', 'Open', 'Acknowledged', 'Pending', 'Resolved'].map((tab) => {
            const key = tab.toLowerCase();
            const count = key === 'all' ? counts.total : counts[key] || 0;
            const isActive = (tab === 'All' && statusFilter === 'All') || (statusFilter.toLowerCase() === key);
            const TabIcon = getStatusIcon(key);

            return (
              <button
                key={tab}
                className={`incidents-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab === 'All' ? 'All' : key)}
              >
                <TabIcon size={12} />
                {tab}
                <span className="incidents-tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Incidents List */}
      <div className="incidents-list">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((inc) => {
            const sev = (inc.severity || 'medium').toLowerCase();
            const stat = (inc.status || 'open').toLowerCase();
            const isResolved = stat === 'resolved';
            const CategoryIcon = getCategoryIcon(inc.category);
            const SevIcon = getSeverityIcon(inc.severity);
            const StatIcon = getStatusIcon(inc.status);

            return (
              <div key={inc.id} className="incident-card">
                <div className="incident-card-main">
                  {/* Category icon box with severity color */}
                  <div className={`incident-icon-box ${sev}`}>
                    <CategoryIcon size={18} />
                  </div>

                  <div className="incident-content">
                    {/* Header Row: ID, Title, Badges */}
                    <div className="incident-header-row">
                      <span className="incident-id-tag">{inc.id}</span>
                      <h3 className="incident-title">{inc.incident_title || inc.description?.slice(0, 60) || inc.category}</h3>
                      <span className="incident-badge badge-category">
                        <CategoryIcon size={10} />
                        {inc.category}
                      </span>
                      <span className={`incident-badge badge-sev-${sev}`}>
                        <SevIcon size={10} />
                        {inc.severity}
                      </span>
                      <span className={`incident-badge badge-status-${stat}`}>
                        <StatIcon size={10} />
                        {inc.status}
                      </span>
                      {inc.detection_type && (
                        <span className="incident-badge badge-detection-type">
                          <Tag size={10} />
                          {inc.detection_type}
                        </span>
                      )}
                      {inc.investigationStatus && (
                        <span className={`incident-badge ${isResolved ? 'badge-investigation-resolved' : 'badge-investigation-pending'}`}>
                          {isResolved ? <CheckCircle2 size={10} /> : <Hourglass size={10} />}
                          Investigation: {inc.investigationStatus}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="incident-desc">{inc.description}</p>

                    {/* Meta Row: Time, Line, Work Order, Production Item, Source Link, Downtime, Units Rejected */}
                    <div className="incident-meta-row">
                      <span className="incident-meta-item">
                        <Clock size={12} /> {inc.date ? `${inc.date} ${inc.time}` : inc.time}
                      </span>
                      <span className="incident-meta-item" style={{ fontWeight: 600 }}>
                        <Factory size={12} /> {inc.line}
                      </span>
                      {inc.work_order && (
                        <span className="incident-meta-item">
                          <FileText size={12} /> {inc.work_order}
                        </span>
                      )}
                      {inc.production_item && (
                        <span className="incident-meta-item">
                          <Package size={12} /> {inc.production_item}
                        </span>
                      )}
                      {inc.source_doctype && (() => {
                        const targetUrl = getFrappeDocUrl(inc.source_doctype, inc.source_name);
                        return (
                          <span
                            className="incident-meta-item incident-meta-source"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenSourceRecord(inc.source_doctype, inc.source_name)}
                              title="Open source record in Island Chill"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                color: 'inherit',
                                font: 'inherit',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              <Link2 size={12} /> {inc.source_doctype}{inc.source_name ? `: ${inc.source_name}` : ''}
                            </button>
                            {targetUrl && (
                              <a
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in Frappe Desk"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: 'inherit',
                                  opacity: 0.6,
                                  marginLeft: '2px'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </span>
                        );
                      })()}
                      {inc.downtime && (
                        <span className="incident-meta-item incident-meta-highlight-warn">
                          <Timer size={12} /> {inc.downtime}
                        </span>
                      )}
                      {inc.unitsRejected > 0 && (
                        <span className="incident-meta-item incident-meta-highlight-danger">
                          <PackageX size={12} /> {inc.unitsRejected} units rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="incident-actions">
                  <button
                    className="incident-btn-view"
                    onClick={() => setViewingIncident(inc)}
                    title="View details"
                  >
                    <Eye size={13} /> View
                  </button>

                  <button
                    className="incident-btn-primary"
                    onClick={() => setInvestigatingIncident(inc)}
                    title="Investigate / Edit Incident"
                  >
                    {isResolved ? (
                      <>
                        <Pen size={12} /> Edit
                      </>
                    ) : (
                      <>
                        <ClipboardCheck size={13} /> Investigate
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : loading && incidents.length === 0 ? (
          <div className="incidents-empty">
            <RefreshCw size={36} className="incidents-spin" color="var(--accent, #f59e0b)" style={{ margin: '0 auto 10px' }} />
            <h3>Loading Plant Incidents...</h3>
            <p>Fetching real-time records from Frappe ERPNext...</p>
          </div>
        ) : (
          <div className="incidents-empty">
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 8px' }} />
            <h3>No incidents found</h3>
            <p>There are no incidents matching the selected filter.</p>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewingIncident && (
        <div className="incident-modal-backdrop" onClick={() => setViewingIncident(null)}>
          <div className="incident-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="incident-modal-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="#d97706" />
                  {viewingIncident.id} — {viewingIncident.category}
                </h3>
              </div>
              <button className="incident-modal-close" onClick={() => setViewingIncident(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="incident-modal-body">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`incident-badge badge-sev-${viewingIncident.severity}`}>
                  Severity: {viewingIncident.severity}
                </span>
                <span className={`incident-badge badge-status-${viewingIncident.status}`}>
                  Status: {viewingIncident.status}
                </span>
                <span className="incident-badge badge-investigation-pending">
                  Investigation: {viewingIncident.investigationStatus || 'Pending'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-heading, #111827)' }}>Issue Description:</strong>
                <p style={{ margin: 0, color: 'var(--text-main, #374151)', lineHeight: 1.5 }}>{viewingIncident.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'block' }}>Production Line</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-heading, #111827)' }}>{viewingIncident.line || viewingIncident.production_line || 'FL1'}</strong>
                </div>
                {viewingIncident.work_order && (
                  <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', padding: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'block' }}>Work Order</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-heading, #111827)' }}>{viewingIncident.work_order}</strong>
                  </div>
                )}
                {viewingIncident.production_item && (
                  <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', padding: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'block' }}>Production Item</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-heading, #111827)' }}>{viewingIncident.production_item}</strong>
                  </div>
                )}
                {viewingIncident.batch_no && (
                  <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', padding: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'block' }}>Batch No</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-heading, #111827)' }}>{viewingIncident.batch_no}</strong>
                  </div>
                )}
                <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'block' }}>Reported Time</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-heading, #111827)' }}>{viewingIncident.time || viewingIncident.reported_time}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'block' }}>Downtime Impact</span>
                  <strong style={{ fontSize: '13px', color: viewingIncident.downtime || viewingIncident.downtimeMinutes ? '#d97706' : '#10b981' }}>
                    {viewingIncident.downtime || (viewingIncident.downtimeMinutes ? `${viewingIncident.downtimeMinutes} min downtime` : '0 min')}
                  </strong>
                </div>
                {viewingIncident.source_doctype && (() => {
                  const targetUrl = getFrappeDocUrl(viewingIncident.source_doctype, viewingIncident.source_name);
                  const labelText = `${viewingIncident.source_doctype}: ${viewingIncident.source_name || viewingIncident.detection_type || 'Flagged'}`;
                  return (
                    <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', padding: '10px', gridColumn: '1 / -1', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'block', marginBottom: '4px' }}>Source Record</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenSourceRecord(viewingIncident.source_doctype, viewingIncident.source_name)}
                          title="Open record in Island Chill"
                          disabled={loadingSourceRecord}
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#0284c7',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            maxWidth: '100%',
                            minWidth: 0,
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          {loadingSourceRecord ? (
                            <Loader2 size={13} className="spin" style={{ flexShrink: 0 }} />
                          ) : (
                            <Link2 size={13} style={{ flexShrink: 0 }} />
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                            {labelText}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            background: 'rgba(2, 132, 199, 0.12)',
                            color: '#0284c7',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginLeft: '4px'
                          }}>
                            View in App
                          </span>
                        </button>

                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in ERPNext Desk"
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted, #6b7280)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '3px 7px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color, #e5e7eb)',
                              backgroundColor: '#f8fafc'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                              e.currentTarget.style.color = 'var(--text-heading, #111827)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
                            }}
                          >
                            <span>Frappe Desk</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {viewingIncident.unitsRejected > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#dc2626' }}>
                  <strong>Defect Impact:</strong> {viewingIncident.unitsRejected} units rejected from batch.
                </div>
              )}

              <div className="incident-form-group">
                <label>Root Cause Analysis</label>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)', color: viewingIncident.rootCause || viewingIncident.root_cause_analysis ? 'var(--text-main, #374151)' : 'var(--text-muted, #6b7280)' }}>
                  {viewingIncident.rootCause || viewingIncident.root_cause_analysis || 'Root cause investigation not yet documented.'}
                </div>
              </div>

              <div className="incident-form-group">
                <label>Corrective & Preventive Action (CAPA)</label>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)', color: viewingIncident.correctiveAction || viewingIncident.corrective_action ? 'var(--text-main, #374151)' : 'var(--text-muted, #6b7280)' }}>
                  {viewingIncident.correctiveAction || viewingIncident.corrective_action || 'CAPA measures pending supervisor sign-off.'}
                </div>
              </div>

              {(viewingIncident.resolved_by || viewingIncident.resolution_date) && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#047857', fontSize: '12px' }}>
                  <strong>Resolution:</strong> {viewingIncident.resolved_by ? `Signed off by ${viewingIncident.resolved_by}` : 'Resolved'}
                  {viewingIncident.resolution_date ? ` on ${viewingIncident.resolution_date}` : ''}
                </div>
              )}

              {viewingIncident.reportedBy && (
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #6b7280)' }}>
                  Logged by: <strong>{viewingIncident.reportedBy}</strong>
                </p>
              )}
            </div>

            <div className="incident-modal-footer">
              <button className="incident-btn-cancel" onClick={() => setViewingIncident(null)}>
                Close
              </button>
              <button
                className="incident-btn-primary"
                onClick={() => {
                  setInvestigatingIncident(viewingIncident);
                  setViewingIncident(null);
                }}
              >
                <Pen size={13} /> Update / Investigate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVESTIGATION / EDIT MODAL */}
      {investigatingIncident && (
        <InvestigationModal
          incident={investigatingIncident}
          onClose={() => setInvestigatingIncident(null)}
          onSave={handleSaveInvestigation}
        />
      )}

      {/* NEW INCIDENT MODAL (Plant Incident DocType) */}
      {showNewModal && (
        <div className="incident-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="incident-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="incident-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} color="var(--accent, #f59e0b)" />
                <div>
                  <h3 style={{ margin: 0 }}>Log New Plant Incident</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)' }}>
                    Plant Incident DocType • Context Tracing & Polymorphic Source Link
                  </span>
                </div>
              </div>
              <button className="incident-modal-close" onClick={() => setShowNewModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIncident}>
              <div className="incident-modal-body">

                {/* 1. Key Information */}
                <div>
                  <div className="incident-section-title">
                    <Tag size={14} /> Key Information
                  </div>
                  <div className="incident-form-row-2">
                    <div className="incident-form-group">
                      <label>Naming Series</label>
                      <select
                        className="incident-form-control"
                        value={newNamingSeries}
                        onChange={(e) => setNewNamingSeries(e.target.value)}
                      >
                        <option value="INC-.YYYY.-.#####">INC-.YYYY.-.##### (e.g. INC-2026-00012)</option>
                      </select>
                    </div>

                    <div className="incident-form-group">
                      <label>
                        Incident Title <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="incident-form-control"
                        placeholder="Brief summary (e.g., pH reading 8.1 on Line 1)"
                        required
                        value={newIncidentTitle}
                        onChange={(e) => setNewIncidentTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="incident-form-row-4" style={{ marginTop: '12px' }}>
                    <div className="incident-form-group">
                      <label>Category</label>
                      <select
                        className="incident-form-control"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      >
                        <option value="Equipment Fault">Equipment Fault</option>
                        <option value="Quality Alert">Quality Alert</option>
                        <option value="Material Shortage">Material Shortage</option>
                        <option value="Cleaning Required">Cleaning Required</option>
                        <option value="Safety">Safety</option>
                        <option value="Process Deviation">Process Deviation</option>
                      </select>
                    </div>

                    <div className="incident-form-group">
                      <label>Severity</label>
                      <select
                        className="incident-form-control"
                        value={newSeverity}
                        onChange={(e) => setNewSeverity(e.target.value)}
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div className="incident-form-group">
                      <label>Status</label>
                      <select
                        className="incident-form-control"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="Acknowledged">Acknowledged</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div className="incident-form-group">
                      <label>Investigation Status</label>
                      <select
                        className="incident-form-control"
                        value={newInvestigationStatus}
                        onChange={(e) => setNewInvestigationStatus(e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Context & Tracing */}
                <div>
                  <div className="incident-section-title">
                    <Layers size={14} /> Context & Tracing
                  </div>
                  <div className="incident-form-row-2">
                    <div className="incident-form-group">
                      <label>Production Line</label>
                      <select
                        className="incident-form-control"
                        value={newLine}
                        onChange={(e) => setNewLine(e.target.value)}
                      >
                        <option value="FL1">FL1 - Water Line A</option>
                        <option value="FL2">FL2 - Water Line B</option>
                        <option value="FL3">FL3 - CSD Line A</option>
                        <option value="FL4">FL4 - RTD Line</option>
                        <option value="FL5">FL5 - CSD Line B</option>
                        <option value="FL6">FL6 - Soda Water Line</option>
                        <option value="FL7">FL7 - Canning Line</option>
                        <option value="Water Treatment">Water Treatment</option>
                        <option value="Utilities">Utilities</option>
                      </select>
                    </div>

                    <div className="incident-form-group">
                      <label>Linked Work Order</label>
                      <select
                        className="incident-form-control"
                        value={newWorkOrder}
                        onChange={(e) => handleSelectWorkOrder(e.target.value)}
                      >
                        <option value="">-- Select Work Order --</option>
                        {(workOrders || []).map((wo) => {
                          const woId = typeof wo === 'string' ? wo : (wo.id || wo.name || wo.work_order || '');
                          const desc = typeof wo === 'object' && (wo.productName || wo.production_item || wo.product) ? ` (${wo.productName || wo.production_item || wo.product})` : '';
                          return <option key={woId} value={woId}>{woId}{desc}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="incident-form-row-2" style={{ marginTop: '12px' }}>
                    <div className="incident-form-group">
                      <label>Production Item</label>
                      <input
                        type="text"
                        className="incident-form-control"
                        placeholder="e.g. Island Water — 500ml PET"
                        value={newProductionItem}
                        onChange={(e) => setNewProductionItem(e.target.value)}
                      />
                    </div>

                    <div className="incident-form-group">
                      <label>Batch No</label>
                      <input
                        type="text"
                        className="incident-form-control"
                        placeholder="e.g. BAT-2026-0042"
                        value={newBatchNo}
                        onChange={(e) => setNewBatchNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="incident-form-row-2" style={{ marginTop: '12px' }}>
                    <div className="incident-form-group">
                      <label>Reported Time</label>
                      <input
                        type="datetime-local"
                        className="incident-form-control"
                        value={newReportedTime}
                        onChange={(e) => setNewReportedTime(e.target.value)}
                      />
                    </div>

                    <div className="incident-form-group">
                      <label>Reported By</label>
                      <input
                        type="text"
                        className="incident-form-control"
                        placeholder="User or operator logging incident"
                        value={newReportedBy}
                        onChange={(e) => setNewReportedBy(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Polymorphic Source Link */}
                <div>
                  <div className="incident-section-title">
                    <Link2 size={14} /> Polymorphic Source Link
                  </div>
                  <div className="incident-form-row-3">
                    <div className="incident-form-group">
                      <label>Detection Type</label>
                      <select
                        className="incident-form-control"
                        value={newDetectionType}
                        onChange={(e) => setNewDetectionType(e.target.value)}
                      >
                        <option value="Manual Flag">Manual Flag</option>
                        <option value="Automated Rule">Automated Rule</option>
                        <option value="Direct Entry">Direct Entry</option>
                      </select>
                    </div>

                    <div className="incident-form-group">
                      <label>Source DocType</label>
                      <select
                        className="incident-form-control"
                        value={newSourceDoctype}
                        onChange={(e) => setNewSourceDoctype(e.target.value)}
                      >
                        <option value="Chemical Test">Chemical Test</option>
                        <option value="Accident and Disease Notification Report">Accident and Disease Notification Report</option>
                        <option value="Standard Form 17 For First Aid">Standard Form 17 For First Aid</option>
                        <option value="Enviromental Swab Test">Enviromental Swab Test</option>
                        <option value="Microbiological Analysis of Primary Raw Materials">Microbiological Analysis of Primary Raw Materials</option>
                        <option value="Microbiological Analysis">Microbiological Analysis</option>
                        <option value="Autoclave Record">Autoclave Record</option>
                        <option value="Media Preparation Record">Media Preparation Record</option>
                        <option value="For Weight Check Checklist">For Weight Check Checklist</option>
                        <option value="Gold Stone Rum and Cola">Gold Stone Rum and Cola</option>
                        <option value="Incubator Temperature Record">Incubator Temperature Record</option>
                        <option value="Cleaning of Toilets">Cleaning of Toilets</option>
                        <option value="Outside Perimeter Cleaning">Outside Perimeter Cleaning</option>
                        <option value="Factory Floor Cleaning">Factory Floor Cleaning</option>
                        <option value="CIP Checklist">CIP Checklist</option>
                        <option value="Sanitation Record">Sanitation Record</option>
                        <option value="Daily Preventative Maintenance Schedule">Daily Preventative Maintenance Schedule</option>
                        <option value="Preventive Maintenance Request">Preventive Maintenance Request</option>
                        <option value="Work Order">Work Order</option>
                        <option value="Quality Inspection">Quality Inspection</option>
                        <option value="Direct Entry">Direct Entry</option>
                      </select>
                    </div>

                    <div className="incident-form-group">
                      <label>Source Document Name</label>
                      <input
                        type="text"
                        className="incident-form-control"
                        placeholder="e.g. CHEM-TEST-2026-0081"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Impact Metrics */}
                <div>
                  <div className="incident-section-title">
                    <Timer size={14} /> Impact Metrics
                  </div>
                  <div className="incident-form-row-2">
                    <div className="incident-form-group">
                      <label>Downtime (minutes)</label>
                      <input
                        type="number"
                        min="0"
                        className="incident-form-control"
                        placeholder="Total line stoppage in minutes"
                        value={newDowntime}
                        onChange={(e) => setNewDowntime(e.target.value)}
                      />
                    </div>

                    <div className="incident-form-group">
                      <label>Units Rejected</label>
                      <input
                        type="number"
                        min="0"
                        className="incident-form-control"
                        placeholder="Defective bottles/cans produced"
                        value={newUnitsRejected}
                        onChange={(e) => setNewUnitsRejected(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. RCA & CAPA */}
                <div>
                  <div className="incident-section-title">
                    <FileText size={14} /> RCA & CAPA
                  </div>
                  <div className="incident-form-group">
                    <label>
                      Deviation Description <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
                    </label>
                    <textarea
                      rows={2}
                      className="incident-form-control"
                      placeholder="Detailed description of deviation, symptoms, observations..."
                      required
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>

                  <div className="incident-form-row-2" style={{ marginTop: '12px' }}>
                    <div className="incident-form-group">
                      <label>Root Cause Analysis (RCA)</label>
                      <textarea
                        rows={2}
                        className="incident-form-control"
                        placeholder="5-Whys / Root cause analysis findings..."
                        value={newRootCause}
                        onChange={(e) => setNewRootCause(e.target.value)}
                      />
                    </div>

                    <div className="incident-form-group">
                      <label>Corrective Action (CAPA)</label>
                      <textarea
                        rows={2}
                        className="incident-form-control"
                        placeholder="Corrective & Preventative Action (CAPA)..."
                        value={newCorrectiveAction}
                        onChange={(e) => setNewCorrectiveAction(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="incident-form-row-2" style={{ marginTop: '12px' }}>
                    <div className="incident-form-group">
                      <label>Resolved By</label>
                      <input
                        type="text"
                        className="incident-form-control"
                        placeholder="QA Lead or Maintenance Supervisor"
                        value={newResolvedBy}
                        onChange={(e) => setNewResolvedBy(e.target.value)}
                      />
                    </div>

                    <div className="incident-form-group">
                      <label>Resolution Date</label>
                      <input
                        type="date"
                        className="incident-form-control"
                        value={newResolutionDate}
                        onChange={(e) => setNewResolutionDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="incident-modal-footer">
                <button
                  type="button"
                  className="incident-btn-cancel"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="incident-btn-primary" disabled={savingIncident}>
                  <Save size={14} /> {savingIncident ? 'Submitting...' : 'Submit Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP SOURCE RECORD VIEWER MODALS */}
      {activeSourceModal && (() => {
        const { kind, record, doctype, name } = activeSourceModal;
        const handleClose = () => setActiveSourceModal(null);

        return (
          <div style={{ position: 'relative', zIndex: 10050 }}>
            {kind === 'laboratory' && (
              <LabReportViewerModal
                record={record}
                onClose={handleClose}
              />
            )}

            {kind === 'safety' && (
              <SafetyReportViewerModal
                record={record}
                onClose={handleClose}
              />
            )}

            {kind === 'maintenance' && (
              <MaintenanceReportViewerModal
                record={record}
                onClose={handleClose}
              />
            )}

            {kind === 'cleaning' && (
              <CleaningRecordDetailModal
                record={record}
                onClose={handleClose}
              />
            )}

            {kind === 'generic' && (
              <GenericDocViewerModal
                doctype={doctype}
                name={name}
                record={record}
                onClose={handleClose}
              />
            )}
          </div>
        );
      })()}

    </div>
  );
}

// Sub-component: Generic Document Viewer Modal for any Frappe DocType
function GenericDocViewerModal({ doctype, name, record, onClose }) {
  const [doc, setDoc] = useState(record || null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [metaRes, liveDoc] = await Promise.allSettled([
          frappe.getDocTypeMeta(doctype),
          name ? frappe.makeRequest('GET', doctype, name) : null
        ]);
        if (!mounted) return;
        if (metaRes.status === 'fulfilled' && metaRes.value) {
          setMeta(metaRes.value);
        }
        if (liveDoc?.status === 'fulfilled' && (liveDoc.value?.data || liveDoc.value)) {
          setDoc(liveDoc.value.data || liveDoc.value);
        }
      } catch (err) {
        console.warn('[GenericDocViewerModal] Error loading doc/meta:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [doctype, name]);

  const activeDoc = doc || record || {};
  const targetUrl = getFrappeDocUrl(doctype, name);

  // Filter out internal and hidden fields
  const fields = (meta?.fields || []).filter(f => {
    if (f.hidden === 1) return false;
    if (['Section Break', 'Column Break', 'Fold', 'Tab Break'].includes(f.fieldtype)) return false;
    return true;
  });

  return (
    <div className="incident-modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="incident-modal-panel" style={{ maxWidth: '800px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        <div className="incident-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary, #0284c7)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{doctype}: {name || 'Document Record'}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)' }}>Source Document Details</span>
            </div>
          </div>
          <button className="incident-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="incident-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
              <Loader2 size={20} className="spin" style={{ display: 'inline-block', marginBottom: '8px' }} />
              <div>Loading record details...</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Document</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{name || activeDoc.name}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>DocType</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{doctype}</strong>
                </div>
                {activeDoc.creation && (
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Creation Date</span>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{String(activeDoc.creation).slice(0, 19).replace('T', ' ')}</strong>
                  </div>
                )}
              </div>

              {fields.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {fields.map(f => {
                    const val = activeDoc[f.fieldname];
                    if (val === undefined || val === null || val === '') return null;
                    const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                    return (
                      <div key={f.fieldname} style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>{f.label || f.fieldname}</span>
                        <strong style={{ fontSize: '12px', color: '#111827', wordBreak: 'break-word' }}>{displayVal}</strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {Object.entries(activeDoc)
                    .filter(([k]) => !['doctype', 'modified_by', 'owner', 'docstatus', 'idx'].includes(k))
                    .map(([k, val]) => {
                      if (val === undefined || val === null || val === '') return null;
                      const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                      return (
                        <div key={k} style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>{k.replace(/_/g, ' ')}</span>
                          <strong style={{ fontSize: '12px', color: '#111827', wordBreak: 'break-word' }}>{displayVal}</strong>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="incident-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '12px',
                  color: '#0284c7',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Open in Frappe Desk</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <button type="button" className="incident-btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-component for Investigation / Edit
function InvestigationModal({ incident, onClose, onSave }) {
  const [status, setStatus] = useState(normalizeIncidentStatus(incident.status));
  const [investigationStatus, setInvestigationStatus] = useState(incident.investigationStatus || incident.investigation_status || 'Pending');
  const [rootCause, setRootCause] = useState(incident.rootCause || incident.root_cause_analysis || '');
  const [correctiveAction, setCorrectiveAction] = useState(incident.correctiveAction || incident.corrective_action || '');
  const [downtimeMinutes, setDowntimeMinutes] = useState(incident.downtimeMinutes || 0);
  const [unitsRejected, setUnitsRejected] = useState(incident.unitsRejected || incident.units_rejected || 0);
  const [resolvedBy, setResolvedBy] = useState(incident.resolved_by || '');
  const [resolutionDate, setResolutionDate] = useState(incident.resolution_date || (String(incident.status).toLowerCase() === 'resolved' ? new Date().toISOString().slice(0, 10) : ''));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const dt = Number(downtimeMinutes) || 0;
    const rej = Number(unitsRejected) || 0;
    const cleanStatus = normalizeIncidentStatus(status);

    await onSave({
      ...incident,
      status: cleanStatus,
      investigationStatus,
      investigation_status: investigationStatus,
      rootCause,
      root_cause_analysis: rootCause,
      correctiveAction,
      corrective_action: correctiveAction,
      downtimeMinutes: dt,
      downtime: dt > 0 ? `${dt} min downtime` : null,
      unitsRejected: rej,
      units_rejected: rej,
      resolved_by: resolvedBy,
      resolution_date: resolutionDate
    });
    setSaving(false);
  };

  return (
    <div className="incident-modal-backdrop" onClick={onClose}>
      <div className="incident-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="incident-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={18} color="var(--accent, #f59e0b)" />
            <h3 style={{ margin: 0 }}>Investigate Incident — {incident.id}</h3>
          </div>
          <button className="incident-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="incident-modal-body">
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)' }}>
              <strong style={{ fontSize: '13px', color: 'var(--text-heading, #111827)' }}>
                {incident.incident_title || incident.category} • {incident.line || incident.production_line}
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-main, #374151)' }}>{incident.description}</p>
            </div>

            <div className="incident-form-row-2">
              <div className="incident-form-group">
                <label>Resolution Status</label>
                <select
                  className="incident-form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="Acknowledged">Acknowledged</option>
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="incident-form-group">
                <label>Investigation State</label>
                <select
                  className="incident-form-control"
                  value={investigationStatus}
                  onChange={(e) => setInvestigationStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="incident-form-row-2">
              <div className="incident-form-group">
                <label>Total Downtime (minutes)</label>
                <input
                  type="number"
                  min="0"
                  className="incident-form-control"
                  value={downtimeMinutes}
                  onChange={(e) => setDowntimeMinutes(e.target.value)}
                />
              </div>

              <div className="incident-form-group">
                <label>Defective Units</label>
                <input
                  type="number"
                  min="0"
                  className="incident-form-control"
                  value={unitsRejected}
                  onChange={(e) => setUnitsRejected(e.target.value)}
                />
              </div>
            </div>

            <div className="incident-form-group">
              <label>Root Cause Analysis (RCA)</label>
              <textarea
                rows={3}
                className="incident-form-control"
                placeholder="Identify root cause (mechanical wear, operator deviation, electrical spike, etc.)..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
              />
            </div>

            <div className="incident-form-group">
              <label>Corrective & Preventive Action (CAPA)</label>
              <textarea
                rows={3}
                className="incident-form-control"
                placeholder="Document actions taken to eliminate recurrence..."
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
              />
            </div>

            <div className="incident-form-row-2">
              <div className="incident-form-group">
                <label>Resolved By</label>
                <input
                  type="text"
                  className="incident-form-control"
                  placeholder="QA Lead or Maintenance Supervisor"
                  value={resolvedBy}
                  onChange={(e) => setResolvedBy(e.target.value)}
                />
              </div>

              <div className="incident-form-group">
                <label>Resolution Date</label>
                <input
                  type="date"
                  className="incident-form-control"
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="incident-modal-footer">
            <button type="button" className="incident-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="incident-btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Investigation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
