import React, { useState, useMemo, useEffect } from 'react';
import { frappe } from '../services/frappe';
import { classifyRecordStage } from './StageAuditCard';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Trash2,
  Clock,
  Zap,
  RefreshCw,
  Globe,
  Microscope,
  BroomSparklesIcon,
  ShieldAlert,
  Wrench,
  Search,
  X,
  FileText,
  Clock3,
  Check,
  Eye,
  Printer,
  PenLine,
  ArrowRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';

/**
 * Robust Date Normalizer
 * Handles ISO strings ('2026-10-01T...'), 'YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', etc.
 */
const normalizeDateStr = (rawDate) => {
  if (!rawDate) return '';
  const str = String(rawDate).trim().split(' ')[0].split('T')[0];
  if (!str) return '';

  // Match DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-');
    return `${y}-${m}-${d}`;
  }
  // Match DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Try Date constructor
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return str;
};

/**
 * ApprovalsTab Component
 * Dedicated 3-Stage Form Approvals Desk for Island Chill Bottling Operations (Option B).
 * 
 * Workflow Stages:
 *  Stage 1 (Create): Operator/Chemist creates form -> Saved in 'Pending Verification' (docstatus: 0).
 *  Stage 2 (Verify): Verifier reviews form in Approvals Desk -> Advances to 'Pending Approval'.
 *  Stage 3 (Approve): Approver / Manager signs & submits -> 'Approved' (docstatus: 1).
 *  Rejection: Marks record as 'Rejected', with direct action to create a Plant Incident.
 */
export default function ApprovalsTab({
  laboratoryRecords = [],
  setLaboratoryRecords,
  cleaningRecords = [],
  setCleaningRecords,
  safetyRecords = [],
  setSafetyRecords,
  maintenanceRecords = [],
  setMaintenanceRecords,
  workOrders = [],
  setWorkOrders,
  currentUser = 'Supervisor',
  currentUserRole = 'System Manager',
  isLoggedIn = false,
  formPermissions = null,
  isSuperAdmin = true,
  onRefreshAll
}) {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPastDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. DATE RANGE STATE (Defaults to All Records)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState('all'); // 'today' | '7days' | '30days' | 'all'
  const [liveCurrentTime, setLiveCurrentTime] = useState(new Date().toLocaleTimeString());

  // 2. WORKFLOW QUEUE FILTER (Defaults to 'Pending Verification')
  const [statusFilter, setStatusFilter] = useState('Pending Verification');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'laboratory' | 'cleaning' | 'safety' | 'maintenance'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWoFilter, setSelectedWoFilter] = useState('all');
  const [requireWoOnly, setRequireWoOnly] = useState(false);

  // Batch & Action State
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [inspectingItem, setInspectingItem] = useState(null);
  const [verifyingItem, setVerifyingItem] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [electronicSign, setElectronicSign] = useState(currentUser || 'Supervisor');

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Date Presets Handler
  const handleDatePreset = (preset) => {
    setActiveDatePreset(preset);
    const today = getTodayStr();
    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === '7days') {
      setFromDate(getPastDateStr(7));
      setToDate(today);
    } else if (preset === '30days') {
      setFromDate(getPastDateStr(30));
      setToDate(today);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  // Helper to extract Work Order ID from diverse records
  const extractWorkOrder = (rec) => {
    if (!rec) return '';
    const val = (
      rec.work_order ||
      rec.workOrder ||
      rec.woId ||
      rec.work_order_id ||
      rec.details?.work_order ||
      rec.details?.workOrder ||
      (typeof rec.batchNo === 'string' && rec.batchNo.startsWith('MFG-') ? rec.batchNo : '') ||
      ''
    );
    return typeof val === 'string' ? val.trim() : String(val);
  };

  // Permission Check Helpers (Configured via tabIslandChill Role Form Item - Zero Hardcoded Roles)
  const canUserVerify = (item) => {
    if (isSuperAdmin) return true;
    if (formPermissions) {
      const keys = [item.doctype, item.formType, item.rawRecord?.doctype, item.rawRecord?.type, item.raw?.doctype, item.type].filter(Boolean);
      for (const k of keys) {
        const perm = formPermissions[k];
        if (perm && perm.can_verify !== undefined) return Boolean(perm.can_verify);
      }
      // If specific form is not explicitly defined in formPermissions, check if user has general verify permissions
      const allPerms = Object.values(formPermissions);
      if (allPerms.length > 0) {
        return allPerms.some(p => p.can_verify);
      }
    }
    return false;
  };

  const canUserApprove = (item) => {
    if (isSuperAdmin) return true;
    if (formPermissions) {
      const keys = [item.doctype, item.formType, item.rawRecord?.doctype, item.rawRecord?.type, item.raw?.doctype, item.type].filter(Boolean);
      for (const k of keys) {
        const perm = formPermissions[k];
        if (perm && perm.can_approve !== undefined) return Boolean(perm.can_approve);
      }
      // If specific form is not explicitly defined in formPermissions, check if user has general approve permissions
      const allPerms = Object.values(formPermissions);
      if (allPerms.length > 0) {
        return allPerms.some(p => p.can_approve);
      }
    }
    return false;
  };

  // 3. UNIFIED RECORD NORMALIZATION (Strict Work Order Link)
  const allNormalizedRecords = useMemo(() => {
    const list = [];

    // --- Laboratory Records ---
    (laboratoryRecords || []).forEach((rec, idx) => {
      const wo = extractWorkOrder(rec);
      if (requireWoOnly && !wo) return;

      const stage = classifyRecordStage(rec);
      const isApproved = stage === 'Approved';
      const isVerified = stage === 'Pending Approval' || isApproved;
      const dateStr = normalizeDateStr(rec.date || rec.date_of_analysis || (rec.timestamp ? rec.timestamp.split(' ')[0] : '') || rec.creation);
      const uniqueId = rec.id || rec.name || `LAB-${idx}-${dateStr}`;

      list.push({
        id: uniqueId,
        doctype: rec.doctype || rec.type || 'Microbiological Analysis of Primary Raw Materials',
        module: 'laboratory',
        moduleLabel: 'Laboratory QA',
        moduleIcon: Microscope,
        moduleColor: '#8b5cf6',
        formType: rec.type || rec.formName || 'QA Laboratory Inspection',
        title: rec.type || 'Laboratory QA Test Record',
        workOrder: wo || 'N/A',
        date: dateStr,
        time: rec.time || (rec.timestamp ? rec.timestamp.split(' ')[1] : '') || '',
        submitter: rec.analyst || rec.operator || rec.chemist || rec.testedBy || rec.user || rec.created_by || 'Lab Chemist',
        verified_by: isVerified ? (rec.verified_by || rec.verifyed_by || rec.verified_by_supervisor || 'Verifier') : null,
        verification_date: rec.verification_date || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[0] : ''),
        verification_time: rec.verification_time || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[1] : ''),
        approver: isApproved ? (rec.approved_by || rec.supervisor || rec.approved_by_manager || 'Manager') : null,
        approvalTimestamp: rec.approvalTimestamp || (isApproved ? rec.timestamp : null),
        stage,
        status: stage,
        remarks: rec.remarks || rec.notes || rec.rejectionReason || rec.comments || '',
        rejection_reason: rec.rejection_reason || rec.rejectionReason || '',
        referenceNo: wo || rec.batchNo || rec.sampleId || '',
        rawRecord: rec
      });
    });

    // --- Cleaning & Sanitation Records ---
    (cleaningRecords || []).forEach((rec, idx) => {
      const wo = extractWorkOrder(rec);
      if (requireWoOnly && !wo) return;

      const stage = classifyRecordStage(rec);
      const isApproved = stage === 'Approved';
      const isVerified = stage === 'Pending Approval' || isApproved;
      const dateStr = normalizeDateStr(rec.posting_date || rec.date || (rec.timestamp ? rec.timestamp.split(' ')[0] : '') || rec.creation);
      const uniqueId = rec.id || rec.name || `CS-${idx}-${dateStr}`;

      list.push({
        id: uniqueId,
        doctype: rec.doctype || rec.type || 'Cleaning of Toilets',
        module: 'cleaning',
        moduleLabel: 'Cleaning & Sanitation',
        moduleIcon: BroomSparklesIcon,
        moduleColor: '#06b6d4',
        formType: rec.type || 'Cleaning & Sanitation Form',
        title: rec.type || 'Facility Sanitation Log',
        workOrder: wo || 'N/A',
        date: dateStr,
        time: rec.posting_time || rec.time || (rec.timestamp ? rec.timestamp.split(' ')[1] : '') || '',
        submitter: rec.cleaner || rec.operator_name || rec.duties_performed_by || rec.performed_by_operator || rec.created_by || 'Sanitation Staff',
        verified_by: isVerified ? (rec.verified_by || rec.verified_by_supervisor || rec.supervisor_name || 'Supervisor') : null,
        verification_date: rec.verification_date || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[0] : ''),
        verification_time: rec.verification_time || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[1] : ''),
        approver: isApproved ? (rec.approved_by || rec.supervisor || rec.supervisor_name || 'Facility Manager') : null,
        approvalTimestamp: rec.approvalTimestamp || (isApproved ? rec.timestamp : null),
        stage,
        status: stage,
        remarks: rec.remarks || rec.comments || rec.details?.comments || '',
        rejection_reason: rec.rejection_reason || rec.rejectionReason || '',
        referenceNo: wo || rec.area || '',
        rawRecord: rec
      });
    });

    // --- Health & Safety Records ---
    (safetyRecords || []).forEach((rec, idx) => {
      const wo = extractWorkOrder(rec);
      if (requireWoOnly && !wo) return;

      const stage = classifyRecordStage(rec);
      const isApproved = stage === 'Approved';
      const isVerified = stage === 'Pending Approval' || isApproved;
      const dateStr = normalizeDateStr(rec.date || (rec.timestamp ? rec.timestamp.split(' ')[0] : '') || rec.creation);
      const uniqueId = rec.id || rec.name || `SAF-${idx}-${dateStr}`;

      list.push({
        id: uniqueId,
        doctype: rec.doctype || 'Incident Log',
        module: 'safety',
        moduleLabel: 'Health & Safety',
        moduleIcon: ShieldAlert,
        moduleColor: '#f59e0b',
        formType: rec.type || 'Safety Audit Record',
        title: rec.type || 'HSE Incident & Audit Log',
        workOrder: wo || 'N/A',
        date: dateStr,
        time: rec.time || (rec.timestamp ? rec.timestamp.split(' ')[1] : '') || '',
        submitter: rec.reported_by || rec.inspector || rec.officer || rec.submittedBy || rec.created_by || 'Safety Officer',
        verified_by: isVerified ? (rec.verified_by || rec.supervisor || 'HSE Verifier') : null,
        verification_date: rec.verification_date || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[0] : ''),
        verification_time: rec.verification_time || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[1] : ''),
        approver: isApproved ? (rec.approved_by || rec.approvedByName || 'HSE Manager') : null,
        approvalTimestamp: rec.approvalTimestamp || (isApproved ? rec.timestamp : null),
        stage,
        status: stage,
        remarks: rec.remarks || rec.description || rec.rejectionReason || '',
        rejection_reason: rec.rejection_reason || rec.rejectionReason || '',
        referenceNo: wo || rec.location || '',
        rawRecord: rec
      });
    });

    // --- Maintenance Records ---
    (maintenanceRecords || []).forEach((rec, idx) => {
      const wo = extractWorkOrder(rec);
      if (requireWoOnly && !wo) return;

      const stage = classifyRecordStage(rec);
      const isApproved = stage === 'Approved';
      const isVerified = stage === 'Pending Approval' || isApproved;
      const dateStr = normalizeDateStr(rec.date || rec.fromDate || rec.breakdownDate || rec.creation);
      const uniqueId = rec.id || rec.name || `MNT-${idx}-${dateStr}`;

      list.push({
        id: uniqueId,
        doctype: rec.doctype || 'Daily Preventative Maintenance Schedule',
        module: 'maintenance',
        moduleLabel: 'Maintenance & PM',
        moduleIcon: Wrench,
        moduleColor: '#3b82f6',
        formType: rec.type || rec.templateTitle || rec.title || 'Preventive Maintenance Form',
        title: `${rec.equipment ? `[${rec.equipment}] ` : ''}${rec.type || rec.templateTitle || 'Equipment Maintenance'}`,
        workOrder: wo || 'N/A',
        date: dateStr,
        time: rec.time || rec.breakdownTime || '',
        submitter: rec.operator || rec.operatorDisplay || rec.technician || rec.requestorName || rec.created_by || 'Maintenance Tech',
        verified_by: isVerified ? (rec.verified_by || rec.supervisor || 'Maintenance Supervisor') : null,
        verification_date: rec.verification_date || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[0] : ''),
        verification_time: rec.verification_time || (rec.verificationTimestamp ? rec.verificationTimestamp.split(' ')[1] : ''),
        approver: isApproved ? (rec.approved_by || rec.approvedByFM || rec.approvedByMM || 'Plant Manager') : null,
        approvalTimestamp: rec.approvalTimestamp || (isApproved ? rec.timestamp : null),
        stage,
        status: stage,
        remarks: rec.remarks || rec.breakdownDesc || rec.overallComments || '',
        rejection_reason: rec.rejection_reason || rec.rejectionReason || '',
        referenceNo: wo || rec.equipment || '',
        rawRecord: rec
      });
    });

    return list.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [laboratoryRecords, cleaningRecords, safetyRecords, maintenanceRecords, requireWoOnly]);

  // 4. DATE-RANGE FILTERED RECORDS
  const dateScopedRecords = useMemo(() => {
    return allNormalizedRecords.filter(item => {
      if (!fromDate && !toDate) return true;
      if (!item.date) return false;
      const itemDate = item.date;
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  }, [allNormalizedRecords, fromDate, toDate]);

  // 5. DYNAMIC 4-STAGE KPI STATS CARDS
  const metrics = useMemo(() => {
    let pendingVerificationCount = 0;
    let pendingApprovalCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    const categoryCounts = {
      laboratory: { pendingVerif: 0, pendingAppr: 0, total: 0 },
      cleaning: { pendingVerif: 0, pendingAppr: 0, total: 0 },
      safety: { pendingVerif: 0, pendingAppr: 0, total: 0 },
      maintenance: { pendingVerif: 0, pendingAppr: 0, total: 0 }
    };

    dateScopedRecords.forEach(item => {
      if (item.stage === 'Pending Verification') pendingVerificationCount++;
      else if (item.stage === 'Pending Approval') pendingApprovalCount++;
      else if (item.stage === 'Approved') approvedCount++;
      else if (item.stage === 'Rejected') rejectedCount++;

      if (categoryCounts[item.module]) {
        categoryCounts[item.module].total++;
        if (item.stage === 'Pending Verification') categoryCounts[item.module].pendingVerif++;
        if (item.stage === 'Pending Approval') categoryCounts[item.module].pendingAppr++;
      }
    });

    return {
      total: dateScopedRecords.length,
      pendingVerification: pendingVerificationCount,
      pendingApproval: pendingApprovalCount,
      approved: approvedCount,
      rejected: rejectedCount,
      categoryCounts
    };
  }, [dateScopedRecords]);

  // 6. Table Filtered Records
  const filteredRecords = useMemo(() => {
    return dateScopedRecords.filter(item => {
      if (activeCategory !== 'all' && item.module !== activeCategory) {
        return false;
      }

      if (statusFilter !== 'all') {
        if (item.stage !== statusFilter) return false;
      }

      if (selectedWoFilter !== 'all' && item.workOrder !== selectedWoFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchType = (item.formType || '').toLowerCase().includes(q);
        const matchSubmitter = (item.submitter || '').toLowerCase().includes(q);
        const matchApprover = (item.approver || '').toLowerCase().includes(q);
        const matchVerifier = (item.verified_by || '').toLowerCase().includes(q);
        const matchWo = (item.workOrder || '').toLowerCase().includes(q);
        return matchId || matchTitle || matchType || matchSubmitter || matchApprover || matchVerifier || matchWo;
      }

      return true;
    });
  }, [dateScopedRecords, activeCategory, statusFilter, selectedWoFilter, searchQuery]);

  // Available Work Orders for quick dropdown
  const availableWorkOrders = useMemo(() => {
    const set = new Set();
    (workOrders || []).forEach(wo => {
      const id = wo.name || wo.id;
      if (id) set.add(id);
    });
    dateScopedRecords.forEach(r => {
      if (r.workOrder && r.workOrder !== 'N/A') set.add(r.workOrder);
    });
    return Array.from(set).sort();
  }, [dateScopedRecords, workOrders]);

  // Canonical DocType and Document Name resolver
  const getRecordDocTypeAndName = (item) => {
    if (!item) return { doctype: '', name: '' };
    const raw = item.rawRecord || {};
    let name = raw.name || item.id || item.name || '';
    let doctype = raw.doctype || item.doctype || item.formType || '';

    // ID prefix detection for 100% accurate Frappe DocType resolution
    if (name.startsWith('CT-') || name.startsWith('CHEM-')) {
      doctype = 'Chemical Test';
    } else if (name.startsWith('DPMS-') || name.startsWith('MNT-')) {
      doctype = 'Daily Preventative Maintenance Schedule';
    } else if (name.startsWith('MON-')) {
      doctype = 'Monitoring';
    } else if (name.startsWith('COT-') || name.startsWith('TOIL-')) {
      doctype = 'Cleaning of Toilets';
    } else if (name.startsWith('CDR-') || name.startsWith('DIN-')) {
      doctype = 'Cleaning of Dining Room';
    } else if (name.startsWith('CLO-') || name.startsWith('OFF-')) {
      doctype = 'Cleaning of Lab and Office';
    } else if (name.startsWith('FF-') || name.startsWith('FLR-')) {
      doctype = 'Factory Floor';
    } else if (name.startsWith('OPCT-') || name.startsWith('PER-')) {
      doctype = 'Outside Perimeter Cleaning Table';
    } else if (name.startsWith('MARPW-')) {
      doctype = 'Microbiologiocal Analysis Raw and Product Water';
    } else if (name.startsWith('MARPM-') || name.startsWith('MAPRM-')) {
      doctype = 'Microbiological Analysis of Primary Raw Materials';
    } else if (name.startsWith('SPL-') || name.startsWith('SILV-')) {
      doctype = 'Silver Photometer Log';
    } else if (name.startsWith('SCF-') || name.startsWith('SEAM-')) {
      doctype = 'Seam Checklist Form';
    } else if (name.startsWith('CIP-')) {
      doctype = 'CIP CHECKLIST';
    } else if (name.startsWith('WMF-')) {
      doctype = 'Water Monitoring Form';
    } else if (name.startsWith('MB-') || name.startsWith('BRK-')) {
      doctype = 'Machine Breakdown';
    } else if (name.startsWith('INC-')) {
      doctype = 'Plant Incident';
    } else {
      const lower = String(doctype || item.title || '').toLowerCase();
      if (lower.includes('chemical')) doctype = 'Chemical Test';
      else if (lower.includes('preventative') || lower.includes('preventive') || lower.includes('maintenance')) doctype = 'Daily Preventative Maintenance Schedule';
      else if (lower.includes('monitoring')) doctype = 'Monitoring';
      else if (lower.includes('toilet')) doctype = 'Cleaning of Toilets';
      else if (lower.includes('dining')) doctype = 'Cleaning of Dining Room';
      else if (lower.includes('lab and office') || lower.includes('lab & office')) doctype = 'Cleaning of Lab and Office';
      else if (lower.includes('factory floor')) doctype = 'Factory Floor';
      else if (lower.includes('perimeter')) doctype = 'Outside Perimeter Cleaning Table';
      else if (lower.includes('raw and product water')) doctype = 'Microbiologiocal Analysis Raw and Product Water';
      else if (lower.includes('primary raw')) doctype = 'Microbiological Analysis of Primary Raw Materials';
      else if (lower.includes('breakdown')) doctype = 'Machine Breakdown';
    }

    return { doctype, name };
  };

  // Helper to update specific record across React state and LocalStorage
  const updateRecordState = (item, updates, lsKey) => {
    const setterMap = {
      laboratory: setLaboratoryRecords,
      cleaning: setCleaningRecords,
      safety: setSafetyRecords,
      maintenance: setMaintenanceRecords
    };
    const setter = setterMap[item.module];
    if (setter) {
      setter(prev => {
        const updated = prev.map(r => {
          if (
            r === item.rawRecord ||
            (r.id && (r.id === item.id || r.id === item.name)) ||
            (r.name && (r.name === item.id || r.name === item.name)) ||
            (item.rawRecord?.name && (r.name === item.rawRecord.name || r.id === item.rawRecord.name))
          ) {
            return {
              ...r,
              ...updates
            };
          }
          return r;
        });
        if (lsKey) {
          try {
            localStorage.setItem(lsKey, JSON.stringify(updated));
          } catch (e) {
            console.warn('LocalStorage save failed:', e);
          }
        }
        return updated;
      });
    }
  };

  // STAGE 2: VERIFY ACTION (Moves from Pending Verification -> Pending Approval)
  const handleVerify = async (item, notes = '') => {
    if (!canUserVerify(item)) {
      showToast('You do not have permission to verify this form.', 'error');
      return;
    }

    setIsProcessing(true);
    const verifierName = electronicSign || currentUser || 'Verifier';
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const todayDate = nowTimestamp.split(' ')[0];
    const nowTime = nowTimestamp.split(' ')[1];

    const { doctype, name } = getRecordDocTypeAndName(item);

    try {
      await frappe.verifyForm(doctype, name, notes);

      const updates = {
        workflow_state: 'Pending Approval',
        status: 'Pending Approval',
        verified_by: verifierName,
        verification_date: todayDate,
        verification_time: nowTime,
        verificationTimestamp: nowTimestamp,
        verificationNotes: notes
      };

      const lsKeyMap = {
        laboratory: 'fiji_laboratory_records',
        safety: 'fiji_safety_records',
        maintenance: 'fiji_maintenance_records',
        cleaning: 'fiji_cleaning_records'
      };

      updateRecordState(item, updates, lsKeyMap[item.module]);

      if (onRefreshAll) {
        try {
          await onRefreshAll();
        } catch (e) {
          console.warn('onRefreshAll failed after verify:', e);
        }
      }

      showToast(`Form "${name}" verified! Advanced to Pending Approval.`, 'success');
      setInspectingItem(null);
      setVerifyingItem(null);
      setVerificationNotes('');
    } catch (err) {
      console.error('Error verifying record:', err);
      showToast(`Failed to verify form: ${err.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // STAGE 3: APPROVE & SUBMIT ACTION (Submits document to docstatus: 1)
  const handleApprove = async (item, notes = '') => {
    if (!canUserApprove(item)) {
      showToast('You do not have permission to approve this form.', 'error');
      return;
    }

    setIsProcessing(true);
    const approverName = electronicSign || currentUser || 'Approver';
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const todayDate = nowTimestamp.split(' ')[0];
    const nowTime = nowTimestamp.split(' ')[1];

    const { doctype, name } = getRecordDocTypeAndName(item);

    try {
      await frappe.approveForm(doctype, name, notes);

      const updates = {
        docstatus: 1,
        status: 'Approved',
        isApproved: true,
        isRejected: false,
        workflow_state: 'Approved',
        approved_by: approverName,
        approval_date: todayDate,
        approval_time: nowTime,
        approvalTimestamp: nowTimestamp,
        approvalNotes: notes
      };

      const lsKeyMap = {
        laboratory: 'fiji_laboratory_records',
        safety: 'fiji_safety_records',
        maintenance: 'fiji_maintenance_records',
        cleaning: 'fiji_cleaning_records'
      };

      updateRecordState(item, updates, lsKeyMap[item.module]);

      if (onRefreshAll) {
        try {
          await onRefreshAll();
        } catch (e) {
          console.warn('onRefreshAll failed after approve:', e);
        }
      }

      showToast(`Form "${name}" Approved & Submitted (docstatus: 1)!`, 'success');
      setInspectingItem(null);
      setApprovalNotes('');
    } catch (err) {
      console.error('Error approving record:', err);
      showToast(`Failed to approve form: ${err.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // REJECT ACTION
  const handleReject = async (item, reason = '') => {
    if (item.stage === 'Approved') {
      showToast('Approved forms are finalized and cannot be rejected.', 'error');
      return;
    }

    const finalReason = reason.trim() || 'Non-conformance detected during review';

    setIsProcessing(true);
    const rejectorName = electronicSign || currentUser || 'Supervisor';
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const { doctype, name } = getRecordDocTypeAndName(item);

    try {
      await frappe.rejectForm(doctype, name, finalReason);

      const updates = {
        workflow_state: 'Rejected',
        status: 'Rejected',
        sanitation_result: 'Fail',
        isRejected: true,
        isApproved: false,
        rejection_reason: finalReason,
        rejectionReason: finalReason,
        rejected_by: rejectorName,
        approvalTimestamp: null,
        rejectionTimestamp: nowTimestamp
      };

      const lsKeyMap = {
        laboratory: 'fiji_laboratory_records',
        safety: 'fiji_safety_records',
        maintenance: 'fiji_maintenance_records',
        cleaning: 'fiji_cleaning_records'
      };

      updateRecordState(item, updates, lsKeyMap[item.module]);

      if (onRefreshAll) {
        try {
          await onRefreshAll();
        } catch (e) {
          console.warn('onRefreshAll failed after reject:', e);
        }
      }

      showToast(`Form "${name}" marked as Rejected.`, 'info');
      setRejectingItem(null);
      setRejectionReason('');
      setInspectingItem(null);
    } catch (err) {
      console.error('Error rejecting record:', err);
      showToast(`Failed to reject form: ${err.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // MARK AS PLANT INCIDENT (Links rejected form directly to Plant Incident)
  const handleMarkAsIncident = async (item) => {
    setIsProcessing(true);
    const { doctype, name } = getRecordDocTypeAndName(item);

    try {
      const title = `Quality / Form Rejection: ${item.title || doctype} (${name})`;
      const desc = `Operational record ${name} (${doctype}) was rejected during quality review.\nReason: ${item.rejection_reason || item.remarks || 'Non-conformance detected'}\nWork Order: ${item.workOrder}\nSubmitted By: ${item.submitter}`;
      
      const res = await frappe.markFormIncident(doctype, name, title, desc);
      const incId = res?.incident_name || 'INC-NEW';
      showToast(`Plant Incident ${incId} created and linked to ${name}!`, 'success');
      setInspectingItem(null);
    } catch (err) {
      console.error('Failed to create Plant Incident:', err);
      showToast(`Failed to mark incident: ${err.message || err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Select Handlers
  const handleSelectAll = e => {
    if (e.target.checked) {
      const ids = filteredRecords
        .filter(r => r.stage === statusFilter)
        .map(r => r.id);
      setSelectedItemIds(ids);
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelect = id => {
    setSelectedItemIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Unified Batch Action (Batch Verify or Batch Approve based on active tab)
  const handleBatchAction = async () => {
    if (selectedItemIds.length === 0) return;
    setIsProcessing(true);

    const itemsToProcess = filteredRecords.filter(r => selectedItemIds.includes(r.id));
    let successCount = 0;

    for (const item of itemsToProcess) {
      const { doctype, name } = getRecordDocTypeAndName(item);
      try {
        if (statusFilter === 'Pending Verification') {
          if (canUserVerify(item)) {
            await frappe.verifyForm(doctype, name, 'Batch Verified');
            updateRecordState(item, { workflow_state: 'Pending Approval', status: 'Pending Approval', verified_by: electronicSign }, null);
            successCount++;
          }
        } else if (statusFilter === 'Pending Approval') {
          if (canUserApprove(item)) {
            await frappe.approveForm(doctype, name, 'Batch Approved');
            updateRecordState(item, { docstatus: 1, workflow_state: 'Approved', status: 'Approved', approved_by: electronicSign }, null);
            successCount++;
          }
        }
      } catch (e) {
        console.warn(`Failed batch action on ${name || item.id}:`, e);
      }
    }

    if (onRefreshAll) {
      try {
        await onRefreshAll();
      } catch (e) {
        console.warn('onRefreshAll failed after batch action:', e);
      }
    }

    setIsProcessing(false);
    setShowBatchModal(false);
    setSelectedItemIds([]);
    showToast(`Batch completed for ${successCount} forms!`, 'success');
  };

  // Purge Unlinked Forms
  const handlePurgeUnlinkedForms = () => {
    let purgedCount = 0;
    const filterFn = r => Boolean(extractWorkOrder(r));

    if (setLaboratoryRecords) {
      setLaboratoryRecords(prev => {
        const kept = prev.filter(filterFn);
        purgedCount += prev.length - kept.length;
        localStorage.setItem('fiji_laboratory_records', JSON.stringify(kept));
        return kept;
      });
    }
    if (setCleaningRecords) {
      setCleaningRecords(prev => {
        const kept = prev.filter(filterFn);
        purgedCount += prev.length - kept.length;
        return kept;
      });
    }
    if (setSafetyRecords) {
      setSafetyRecords(prev => {
        const kept = prev.filter(filterFn);
        purgedCount += prev.length - kept.length;
        localStorage.setItem('fiji_safety_records', JSON.stringify(kept));
        return kept;
      });
    }
    if (setMaintenanceRecords) {
      setMaintenanceRecords(prev => {
        const kept = prev.filter(filterFn);
        purgedCount += prev.length - kept.length;
        localStorage.setItem('fiji_maintenance_records', JSON.stringify(kept));
        return kept;
      });
    }

    showToast(`Successfully purged ${purgedCount} unlinked forms!`, 'success');
    setShowPurgeModal(false);
  };

  return (
    <div className="approvals-desk" style={{ padding: '20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            backgroundColor: notification.type === 'error' ? '#ef4444' : notification.type === 'info' ? '#3b82f6' : '#10b981',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {notification.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Date Filter & Control Bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          borderLeft: '4px solid var(--accent, #f59e0b)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase' }}>
              Date Range:
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="form-input"
              style={{ width: '135px', padding: '6px 8px', fontSize: '12px', height: '34px', margin: 0 }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="form-input"
              style={{ width: '135px', padding: '6px 8px', fontSize: '12px', height: '34px', margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'all', label: 'All Dates' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                className={activeDatePreset === p.id ? 'primary-btn' : 'secondary-btn'}
                style={{ fontSize: '11px', padding: '4px 10px', height: '32px' }}
                onClick={() => handleDatePreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', marginLeft: '8px' }}>
            <input
              type="checkbox"
              checked={requireWoOnly}
              onChange={e => setRequireWoOnly(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Work Order Linked Only</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="secondary-btn"
            style={{ fontSize: '11px', padding: '4px 10px', height: '32px', color: '#b91c1c', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowPurgeModal(true)}
            title="Clean legacy mock forms without a Work Order"
          >
            <Trash2 size={13} />
            <span>Purge Unlinked</span>
          </button>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <strong style={{ color: 'var(--text-heading)', fontFamily: 'var(--mono)' }}>{liveCurrentTime}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Signer:</label>
            <input
              type="text"
              value={electronicSign}
              onChange={e => setElectronicSign(e.target.value)}
              className="form-input"
              style={{ width: '130px', padding: '4px 8px', fontSize: '12px', height: '32px', margin: 0, fontWeight: '700' }}
            />
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="wo-tab-header" style={{ marginBottom: '20px' }}>
        <div className="tab-title-desc">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary, #2563eb)' }} />
            <span>Form Approvals Desk (3-Stage Workflow)</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Stage 1: Creation & Auto-Capture → Stage 2: Quality Verification → Stage 3: Manager Approval & Submit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {selectedItemIds.length > 0 && (
            <button
              className="primary-btn"
              onClick={() => setShowBatchModal(true)}
              style={{
                backgroundColor: statusFilter === 'Pending Verification' ? '#f59e0b' : '#10b981',
                borderColor: statusFilter === 'Pending Verification' ? '#f59e0b' : '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={14} />
              <span>
                {statusFilter === 'Pending Verification' ? 'Batch Verify' : 'Batch Approve'} ({selectedItemIds.length})
              </span>
            </button>
          )}

          {onRefreshAll && (
            <button className="secondary-btn" onClick={onRefreshAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4-STAGE KPI STATS CARDS */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}
      >
        {/* Stage 1 -> 2: Pending Verification Card */}
        <div
          className="card"
          onClick={() => setStatusFilter('Pending Verification')}
          style={{
            padding: '16px',
            cursor: 'pointer',
            border: statusFilter === 'Pending Verification' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
            backgroundColor: statusFilter === 'Pending Verification' ? '#fffbeb' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>
              ⏳ Pending Verification
            </span>
            <span className="badge badge-progress" style={{ fontSize: '10px' }}>Stage 2</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#b45309', lineHeight: 1.1 }}>
            {metrics.pendingVerification}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Requires Verifier review
          </div>
        </div>

        {/* Stage 2 -> 3: Pending Approval Card */}
        <div
          className="card"
          onClick={() => setStatusFilter('Pending Approval')}
          style={{
            padding: '16px',
            cursor: 'pointer',
            border: statusFilter === 'Pending Approval' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            backgroundColor: statusFilter === 'Pending Approval' ? '#eff6ff' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' }}>
              ⚖️ Pending Approval
            </span>
            <span className="badge badge-qc" style={{ fontSize: '10px' }}>Stage 3</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1d4ed8', lineHeight: 1.1 }}>
            {metrics.pendingApproval}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Verified, awaiting manager sign-off
          </div>
        </div>

        {/* Stage 3: Approved / Submitted Card */}
        <div
          className="card"
          onClick={() => setStatusFilter('Approved')}
          style={{
            padding: '16px',
            cursor: 'pointer',
            border: statusFilter === 'Approved' ? '2px solid #10b981' : '1px solid var(--border-color)',
            backgroundColor: statusFilter === 'Approved' ? '#ecfdf5' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
              ✅ Approved & Submitted
            </span>
            <span className="badge badge-completed" style={{ fontSize: '10px' }}>docstatus: 1</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#047857', lineHeight: 1.1 }}>
            {metrics.approved}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Finalized in ERPNext
          </div>
        </div>

        {/* Rejected Card */}
        <div
          className="card"
          onClick={() => setStatusFilter('Rejected')}
          style={{
            padding: '16px',
            cursor: 'pointer',
            border: statusFilter === 'Rejected' ? '2px solid #ef4444' : '1px solid var(--border-color)',
            backgroundColor: statusFilter === 'Rejected' ? '#fef2f2' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase' }}>
              ❌ Rejected
            </span>
            <span className="badge badge-danger" style={{ fontSize: '10px' }}>Flagged</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#b91c1c', lineHeight: 1.1 }}>
            {metrics.rejected}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Actionable / Mark as Incident
          </div>
        </div>

        {/* Total Queue Card */}
        <div
          className="card"
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '16px',
            cursor: 'pointer',
            border: statusFilter === 'all' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase' }}>
              Total Forms
            </span>
            <span className="badge badge-qc" style={{ fontSize: '10px' }}>All</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Total forms in active scope
          </div>
        </div>
      </div>

      {/* Module Category Filters */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {[
          { id: 'all', label: 'All Modules', icon: Globe, count: metrics.total, pending: metrics.pendingVerification + metrics.pendingApproval },
          { id: 'laboratory', label: 'Laboratory QA', icon: Microscope, count: metrics.categoryCounts.laboratory?.total || 0, pending: (metrics.categoryCounts.laboratory?.pendingVerif || 0) + (metrics.categoryCounts.laboratory?.pendingAppr || 0) },
          { id: 'cleaning', label: 'Cleaning & Sanitation', icon: BroomSparklesIcon, count: metrics.categoryCounts.cleaning?.total || 0, pending: (metrics.categoryCounts.cleaning?.pendingVerif || 0) + (metrics.categoryCounts.cleaning?.pendingAppr || 0) },
          { id: 'safety', label: 'Health & Safety', icon: ShieldAlert, count: metrics.categoryCounts.safety?.total || 0, pending: (metrics.categoryCounts.safety?.pendingVerif || 0) + (metrics.categoryCounts.safety?.pendingAppr || 0) },
          { id: 'maintenance', label: 'Maintenance & PM', icon: Wrench, count: metrics.categoryCounts.maintenance?.total || 0, pending: (metrics.categoryCounts.maintenance?.pendingVerif || 0) + (metrics.categoryCounts.maintenance?.pendingAppr || 0) }
        ].map(cat => {
          const IconComp = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? 'primary-btn' : 'secondary-btn'}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              {IconComp && <IconComp size={15} />}
              <span>{cat.label}</span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.08)', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                {cat.count}
              </span>
              {cat.pending > 0 && (
                <span style={{ backgroundColor: '#f59e0b', color: '#ffffff', padding: '1px 5px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>
                  {cat.pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Search & Dropdown Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by Form ID, Work Order, Submitter, Title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '32px', margin: 0, height: '36px' }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'inline-flex' }}>
            <Search size={15} />
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {availableWorkOrders.length > 0 && (
          <select
            value={selectedWoFilter}
            onChange={e => setSelectedWoFilter(e.target.value)}
            className="form-input"
            style={{ width: '180px', margin: 0, height: '36px', fontSize: '12px' }}
          >
            <option value="all">All Work Orders ({availableWorkOrders.length})</option>
            {availableWorkOrders.map(wo => (
              <option key={wo} value={wo}>{wo}</option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: '200px', margin: 0, height: '36px', fontSize: '12px', fontWeight: '600' }}
        >
          <option value="all">All Queue Stages</option>
          <option value="Pending Verification">⏳ Pending Verification</option>
          <option value="Pending Approval">⚖️ Pending Approval</option>
          <option value="Approved">✅ Approved (Submitted)</option>
          <option value="Rejected">❌ Rejected</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
              <FileCheck2 size={40} style={{ strokeWidth: 1.5, opacity: 0.6 }} />
            </div>
            <h3 style={{ fontSize: '15px', color: 'var(--text-heading)', margin: '0 0 4px 0' }}>
              No forms found in "{statusFilter}"
            </h3>
            <p style={{ fontSize: '12px', margin: 0 }}>
              Adjust date range, module tabs or status filter to view other records.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedItemIds.length > 0 &&
                        selectedItemIds.length === filteredRecords.filter(r => r.stage === statusFilter).length
                      }
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '700' }}>FORM & MODULE</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '700' }}>WORK ORDER</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '700' }}>TITLE / SPECIFICATION</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '700' }}>SUBMITTED BY</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '700' }}>WORKFLOW STAGE</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '700' }}>AUDIT TRAIL</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '700', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item, idx) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const isPendingVerif = item.stage === 'Pending Verification';
                  const isPendingAppr = item.stage === 'Pending Approval';
                  const isApproved = item.stage === 'Approved';
                  const isRejected = item.stage === 'Rejected';

                  return (
                    <tr
                      key={`${item.module}-${item.id}-${idx}`}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isSelected ? '#eff6ff' : idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '10px 12px' }}>
                        {(isPendingVerif || isPendingAppr) ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Module & Form ID */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-flex', color: item.moduleColor }}>
                            {item.moduleIcon && typeof item.moduleIcon !== 'string' ? (
                              <item.moduleIcon size={16} />
                            ) : (
                              item.moduleIcon
                            )}
                          </span>
                          <div>
                            <strong style={{ color: 'var(--text-heading)' }}>{item.id}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.moduleLabel}</div>
                          </div>
                        </div>
                      </td>

                      {/* Work Order */}
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: '600', color: 'var(--info)', fontSize: '11px' }}>
                          {item.workOrder || 'N/A'}
                        </span>
                      </td>

                      {/* Title */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.date} {item.time}</div>
                      </td>

                      {/* Submitter (Stage 1 Creator) */}
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{item.submitter}</span>
                      </td>

                      {/* Workflow Stage Badge */}
                      <td style={{ padding: '10px 12px' }}>
                        {isPendingVerif ? (
                          <span className="badge badge-progress" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock3 size={11} />
                            <span>Pending Verification</span>
                          </span>
                        ) : isPendingAppr ? (
                          <span className="badge badge-qc" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                            <ShieldCheck size={11} />
                            <span>Pending Approval</span>
                          </span>
                        ) : isApproved ? (
                          <span className="badge badge-completed" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={11} />
                            <span>Approved (docstatus: 1)</span>
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <X size={11} />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Audit Trail Details */}
                      <td style={{ padding: '10px 12px', fontSize: '11px' }}>
                        {isApproved && item.approver ? (
                          <div>
                            <strong style={{ color: 'var(--text-heading)' }}>Approved by: {item.approver}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.approvalTimestamp || 'Submitted'}</div>
                          </div>
                        ) : isPendingAppr && item.verified_by ? (
                          <div>
                            <span style={{ color: '#1d4ed8', fontWeight: '600' }}>Verified by: {item.verified_by}</span>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.verification_date} {item.verification_time}</div>
                          </div>
                        ) : isRejected ? (
                          <div style={{ color: '#b91c1c' }}>
                            <strong>Reason:</strong> {item.rejection_reason || 'Non-conformance'}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Created, awaiting verification</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setInspectingItem(item)}
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>

                          {/* Stage 2 Action: Verify */}
                          {isPendingVerif && (
                            <button
                              type="button"
                              className="primary-btn"
                              style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#f59e0b', borderColor: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              disabled={isProcessing || !canUserVerify(item)}
                              title={!canUserVerify(item) ? 'Verification restricted to designated verifier' : 'Verify and advance form'}
                              onClick={() => {
                                setVerifyingItem(item);
                                setVerificationNotes('');
                              }}
                            >
                              <ShieldCheck size={12} />
                              <span>Verify</span>
                            </button>
                          )}

                          {/* Stage 3 Action: Approve & Submit */}
                          {isPendingAppr && (
                            <button
                              type="button"
                              className="primary-btn"
                              style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              disabled={isProcessing || !canUserApprove(item)}
                              title={!canUserApprove(item) ? 'Approval restricted to manager' : 'Approve and submit document'}
                              onClick={() => handleApprove(item)}
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Reject Button (Only for Pending records) */}
                          {(isPendingVerif || isPendingAppr) && (
                            <button
                              type="button"
                              className="danger-btn"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingItem(item);
                                setRejectionReason('');
                              }}
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          )}

                          {/* Rejected Action: Mark as Incident */}
                          {isRejected && (
                            <button
                              type="button"
                              className="secondary-btn"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#b91c1c', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              disabled={isProcessing}
                              onClick={() => handleMarkAsIncident(item)}
                            >
                              <AlertTriangle size={12} />
                              <span>Mark Incident</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* INSPECTION & AUDIT TRAIL MODAL */}
      {/* ========================================================================= */}
      {inspectingItem && (
        <div className="modal-backdrop" onClick={() => setInspectingItem(null)}>
          <div className="modal-panel" style={{ width: '800px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-flex', color: inspectingItem.moduleColor }}>
                  {inspectingItem.moduleIcon && typeof inspectingItem.moduleIcon !== 'string' ? (
                    <inspectingItem.moduleIcon size={22} />
                  ) : (
                    inspectingItem.moduleIcon
                  )}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-heading)' }}>
                    {inspectingItem.title} ({inspectingItem.id})
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {inspectingItem.moduleLabel} • Work Order: <strong style={{ color: 'var(--info)' }}>{inspectingItem.workOrder}</strong>
                  </div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} onClick={() => setInspectingItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-content" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* 3-Stage Visual Workflow Card */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase' }}>
                  3-Stage Workflow Status & Audit Trail
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', position: 'relative' }}>
                  {/* Stage 1: Creation */}
                  <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857' }}>STAGE 1: CREATION</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-heading)' }}>{inspectingItem.submitter}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{inspectingItem.date} {inspectingItem.time}</div>
                    <span className="badge badge-completed" style={{ fontSize: '9px', marginTop: '4px' }}>Logged</span>
                  </div>

                  {/* Stage 2: Verification */}
                  <div style={{ borderLeft: inspectingItem.verified_by ? '3px solid #10b981' : inspectingItem.stage === 'Pending Verification' ? '3px solid #f59e0b' : '3px solid var(--border-color)', paddingLeft: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: inspectingItem.verified_by ? '#047857' : '#b45309' }}>STAGE 2: VERIFICATION</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-heading)' }}>
                      {inspectingItem.verified_by || 'Awaiting Verifier'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {inspectingItem.verification_date ? `${inspectingItem.verification_date} ${inspectingItem.verification_time}` : 'Pending review'}
                    </div>
                    {inspectingItem.verified_by ? (
                      <span className="badge badge-completed" style={{ fontSize: '9px', marginTop: '4px' }}>Verified</span>
                    ) : (
                      <span className="badge badge-progress" style={{ fontSize: '9px', marginTop: '4px' }}>Action Required</span>
                    )}
                  </div>

                  {/* Stage 3: Approval */}
                  <div style={{ borderLeft: inspectingItem.stage === 'Approved' ? '3px solid #10b981' : '3px solid var(--border-color)', paddingLeft: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: inspectingItem.stage === 'Approved' ? '#047857' : 'var(--text-muted)' }}>STAGE 3: APPROVAL</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-heading)' }}>
                      {inspectingItem.approver || 'Awaiting Approval'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {inspectingItem.approvalTimestamp || 'Pending final sign'}
                    </div>
                    {inspectingItem.stage === 'Approved' ? (
                      <span className="badge badge-completed" style={{ fontSize: '9px', marginTop: '4px' }}>Submitted (docstatus: 1)</span>
                    ) : (
                      <span className="badge badge-progress" style={{ fontSize: '9px', marginTop: '4px' }}>Queued</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Alert if Rejected */}
              {inspectingItem.stage === 'Rejected' && (
                <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                    <AlertTriangle size={16} />
                    <span>Quality / Verification Non-Conformance Flag</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                    <strong>Rejection Reason:</strong> {inspectingItem.rejection_reason || inspectingItem.remarks || 'No detailed reason provided.'}
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ backgroundColor: '#b91c1c', borderColor: '#b91c1c', fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleMarkAsIncident(inspectingItem)}
                    >
                      <AlertTriangle size={13} />
                      <span>Convert to Plant Incident Ticket</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Parameters & Submitted Data */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', margin: '0 0 8px 0', color: 'var(--text-heading)' }}>Operational Parameters & Test Data</h4>
                <div style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', maxHeight: '280px', overflowY: 'auto', fontSize: '12px' }}>
                  {Object.entries(inspectingItem.rawRecord || {})
                    .filter(([k]) => !['rawRecord', 'details'].includes(k))
                    .map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</span>
                        <strong style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '65%', wordBreak: 'break-all' }}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
                        </strong>
                      </div>
                    ))}
                </div>
              </div>

              {/* Verification / Approval Notes input when pending */}
              {inspectingItem.stage !== 'Approved' && inspectingItem.stage !== 'Rejected' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    Quality Remarks / Review Comments:
                  </label>
                  <textarea
                    rows={2}
                    value={approvalNotes}
                    onChange={e => setApprovalNotes(e.target.value)}
                    placeholder="Enter review remarks or sign-off notes..."
                    className="form-input"
                    style={{ width: '100%', margin: 0 }}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="secondary-btn" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} />
                <span>Print Report</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Reject action if pending */}
                {(inspectingItem.stage === 'Pending Verification' || inspectingItem.stage === 'Pending Approval') && (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => {
                      setRejectingItem(inspectingItem);
                      setRejectionReason('');
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                )}

                {/* Stage 2: Verify Button */}
                {inspectingItem.stage === 'Pending Verification' && (
                  <button
                    type="button"
                    className="primary-btn"
                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    disabled={isProcessing || !canUserVerify(inspectingItem)}
                    onClick={() => handleVerify(inspectingItem, approvalNotes)}
                  >
                    <ShieldCheck size={14} />
                    <span>Confirm Verification</span>
                  </button>
                )}

                {/* Stage 3: Approve Button */}
                {inspectingItem.stage === 'Pending Approval' && (
                  <button
                    type="button"
                    className="primary-btn"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    disabled={isProcessing || !canUserApprove(inspectingItem)}
                    onClick={() => handleApprove(inspectingItem, approvalNotes)}
                  >
                    <Check size={14} />
                    <span>Approve & Submit (docstatus: 1)</span>
                  </button>
                )}

                <button type="button" className="secondary-btn" onClick={() => setInspectingItem(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY CONFIRMATION MODAL */}
      {verifyingItem && (
        <div className="modal-backdrop" onClick={() => setVerifyingItem(null)}>
          <div className="modal-panel" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '14px', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} />
                <span>Verify Form: {verifyingItem.id}</span>
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} onClick={() => setVerifyingItem(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-content">
              <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: 0 }}>
                You are verifying operational document <strong>{verifyingItem.id}</strong> ({verifyingItem.title}).
                This will advance the record to <strong>Pending Approval</strong>.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Verifier Remarks (Optional):</label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  placeholder="Verification checklist passed, ready for manager sign-off..."
                  className="form-input"
                  style={{ width: '100%', margin: 0 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={() => setVerifyingItem(null)}>Cancel</button>
              <button
                type="button"
                className="primary-btn"
                style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                disabled={isProcessing}
                onClick={() => handleVerify(verifyingItem, verificationNotes)}
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingItem && (
        <div className="modal-backdrop" onClick={() => setRejectingItem(null)}>
          <div className="modal-panel" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '14px', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} />
                <span>Reject Form: {rejectingItem.id}</span>
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} onClick={() => setRejectingItem(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-content">
              <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: 0 }}>
                Please specify the non-conformance or required corrective actions:
              </p>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="E.g., pH reading out of spec, retest required..."
                className="form-input"
                style={{ width: '100%', margin: 0 }}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={() => setRejectingItem(null)}>Cancel</button>
              <button
                type="button"
                className="danger-btn"
                disabled={isProcessing}
                onClick={() => handleReject(rejectingItem, rejectionReason)}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH ACTION MODAL */}
      {showBatchModal && (
        <div className="modal-backdrop" onClick={() => setShowBatchModal(false)}>
          <div className="modal-panel" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '14px', color: statusFilter === 'Pending Verification' ? '#b45309' : '#047857', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} />
                <span>
                  {statusFilter === 'Pending Verification' ? 'Batch Verify' : 'Batch Approve'} ({selectedItemIds.length} Forms)
                </span>
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} onClick={() => setShowBatchModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-content">
              <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: 0 }}>
                You are about to electronically {statusFilter === 'Pending Verification' ? 'verify' : 'approve & submit'} <strong>{selectedItemIds.length}</strong> Work Order forms.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Signer Identity:</label>
                <input
                  type="text"
                  value={electronicSign}
                  onChange={e => setElectronicSign(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', margin: 0 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={() => setShowBatchModal(false)}>Cancel</button>
              <button
                type="button"
                className="primary-btn"
                style={{
                  backgroundColor: statusFilter === 'Pending Verification' ? '#f59e0b' : '#10b981',
                  borderColor: statusFilter === 'Pending Verification' ? '#f59e0b' : '#10b981'
                }}
                disabled={isProcessing}
                onClick={handleBatchAction}
              >
                Confirm Batch Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURGE CONFIRMATION MODAL */}
      {showPurgeModal && (
        <div className="modal-backdrop" onClick={() => setShowPurgeModal(false)}>
          <div className="modal-panel" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '14px', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} />
                <span>Purge Unlinked Forms</span>
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} onClick={() => setShowPurgeModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-content">
              <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: 0 }}>
                Are you sure you want to permanently delete all unlinked forms (forms without an associated Work Order)?
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                This will retain valid Work Order linked forms only and remove legacy mock/dummy records.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={() => setShowPurgeModal(false)}>Cancel</button>
              <button
                type="button"
                className="danger-btn"
                onClick={handlePurgeUnlinkedForms}
              >
                Yes, Purge Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
