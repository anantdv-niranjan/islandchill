import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { frappe } from '../services/frappe';

/**
 * Universal Stage Classifier for Island Chill 3-Stage Workflows.
 * Stage 1: Pending Verification (docstatus: 0, initial/draft)
 * Stage 2: Pending Approval (docstatus: 0, verified by supervisor/technician)
 * Stage 3: Approved & Submitted (docstatus: 1, finalized)
 * Rejected: Non-conformance detected
 */
export function classifyRecordStage(rec) {
  if (!rec) return 'Pending Verification';

  const rawStatus = String(rec.status || '').toLowerCase();
  const rawSanitation = String(rec.sanitation_result || '').toLowerCase();
  const wfState = String(rec.workflow_state || '').toLowerCase();

  // Rejection check takes precedence over approval
  const isRejected =
    rawStatus === 'rejected' ||
    rawStatus === 'fail' ||
    rawSanitation === 'fail' ||
    rec.isRejected === true ||
    wfState.includes('rejected') ||
    Boolean((rec.rejection_reason || rec.rejectionReason) && !rec.isApproved && rec.docstatus !== 1);

  if (isRejected) return 'Rejected';

  const isApproved =
    rawStatus === 'approved' ||
    rec.isApproved === true ||
    rec.docstatus === 1 ||
    rawSanitation === 'pass' ||
    rawStatus === 'completed' ||
    rawStatus === 'closed' ||
    rawStatus === 'resolved' ||
    wfState === 'approved' ||
    wfState.includes('approved by operation manager') ||
    wfState.includes('approved by supervisor') ||
    Boolean(rec.approvalTimestamp);

  if (isApproved) return 'Approved';

  const isVerified =
    wfState === 'pending approval' ||
    wfState.includes('approved by lab') ||
    wfState.includes('approved by warehouse') ||
    wfState.includes('approved by production') ||
    wfState.includes('approved by operator') ||
    wfState.includes('approved by technical') ||
    wfState.includes('approved by quality') ||
    wfState.includes('verified') ||
    Boolean(rec.verified_by || rec.verifyed_by || rec.verified_by_supervisor || rec.verifiedBy || rec.verificationTimestamp);

  if (isVerified) return 'Pending Approval';
  return 'Pending Verification';
}

/**
 * Renders a compact status badge for table rows.
 */
export function StageStatusBadge({ record, stage: propStage, docstatus: propDocstatus, style }) {
  const stage = propStage || (record ? classifyRecordStage(record) : 'Pending Verification');
  const docstatus = propDocstatus !== undefined ? propDocstatus : (record?.docstatus);

  if (stage === 'Approved' || docstatus === 1) {
    return (
      <span
        className="badge badge-completed"
        style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '700',
          ...style
        }}
      >
        <CheckCircle2 size={11} />
        <span>Approved</span>
      </span>
    );
  }

  if (stage === 'Pending Approval') {
    return (
      <span
        style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '700',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#2563eb',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          ...style
        }}
      >
        <Clock size={11} />
        <span>Pending Approval</span>
      </span>
    );
  }

  if (stage === 'Rejected') {
    return (
      <span
        className="badge badge-failed"
        style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '700',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          ...style
        }}
      >
        <AlertTriangle size={11} />
        <span>Rejected</span>
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: '700',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: '#b45309',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        ...style
      }}
    >
      <Clock size={11} />
      <span>Pending Verification</span>
    </span>
  );
}

/**
 * 3-Stage Visual Workflow & Audit Trail Card for inspection and report modals.
 */
export function StageAuditCard({ record, onIncidentCreated }) {
  if (!record) return null;

  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentSuccess, setIncidentSuccess] = useState(null);

  const stage = classifyRecordStage(record);
  const isApproved = stage === 'Approved';
  const isVerified = stage === 'Pending Approval' || isApproved;

  // Extract Creator/Submitter
  const creator = (
    record.submitter ||
    record.analyst ||
    record.cleaner ||
    record.operator ||
    record.operator_name ||
    record.reported_by ||
    record.inspector ||
    record.requestorName ||
    record.testedBy ||
    record.sign_of_the_operator ||
    record.created_by ||
    record.owner ||
    'Operator / Chemist'
  );

  // Extract Creation Date/Time
  const createdDate = (
    record.date ||
    record.posting_date ||
    record.date_of_analysis ||
    record.fromDate ||
    record.breakdownDate ||
    (record.timestamp ? record.timestamp.split(' ')[0] : '') ||
    (record.creation ? String(record.creation).split(' ')[0] : '') ||
    '—'
  );

  const createdTime = (
    record.time ||
    record.posting_time ||
    (record.timestamp ? record.timestamp.split(' ')[1] : '') ||
    (record.creation && String(record.creation).includes(' ') ? String(record.creation).split(' ')[1].slice(0, 5) : '') ||
    ''
  );

  // Extract Verifier
  const verifier = (
    record.verified_by ||
    record.verifyed_by ||
    record.verified_by_supervisor ||
    record.verifiedBy ||
    (isVerified ? (record.sign_of_supervisor || record.supervisor || 'Operational Verifier') : null)
  );

  const verifierDate = (
    record.verification_date ||
    (record.verificationTimestamp ? record.verificationTimestamp.split(' ')[0] : '') ||
    (isVerified ? createdDate : '')
  );

  const verifierTime = (
    record.verification_time ||
    (record.verificationTimestamp ? record.verificationTimestamp.split(' ')[1] : '') ||
    ''
  );

  // Extract Approver
  const approver = (
    record.approved_by ||
    record.approvedByName ||
    record.approved_by_manager ||
    record.approved_by_fm ||
    record.approvedByMM ||
    (isApproved ? (record.supervisor_name || record.supervisor || 'Plant Manager') : null)
  );

  const approvalDate = (
    record.approval_date ||
    (record.approvalTimestamp ? record.approvalTimestamp.split(' ')[0] : '') ||
    (isApproved ? (record.timestamp ? record.timestamp.split(' ')[0] : createdDate) : '')
  );

  const approvalTime = (
    record.approval_time ||
    (record.approvalTimestamp ? record.approvalTimestamp.split(' ')[1] : '') ||
    ''
  );

  const rejectionReason = (
    record.rejection_reason ||
    record.rejectionReason ||
    record.remarks ||
    record.comments ||
    ''
  );

  const handleMarkAsIncident = async () => {
    const targetDocType = record.doctype || record.type || 'Operational Document';
    const docId = record.id || record.name;
    if (!docId) {
      alert('Cannot mark as incident: Document ID is missing.');
      return;
    }
    setIncidentLoading(true);
    try {
      const res = await frappe.markFormIncident(targetDocType, docId, `Operational Non-Conformance: ${targetDocType} - ${docId}`, rejectionReason);
      if (res?.success) {
        setIncidentSuccess(res.incident_name || 'Incident Logged');
        if (onIncidentCreated) {
          onIncidentCreated(res);
        }
      }
    } catch (err) {
      console.error('Error marking incident:', err);
      alert('Failed to create incident: ' + (err.message || 'Server error'));
    } finally {
      setIncidentLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
      {/* 3-Stage Visual Workflow Card */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            3-Stage Workflow Status & Audit Trail
          </h4>
          <StageStatusBadge stage={stage} docstatus={record.docstatus} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', position: 'relative' }}>
          {/* Stage 1: Creation */}
          <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857' }}>STAGE 1: CREATION</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-heading)' }}>{creator}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{createdDate} {createdTime}</div>
            <span className="badge badge-completed" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block' }}>
              ✓ Logged (Draft)
            </span>
          </div>

          {/* Stage 2: Verification */}
          <div style={{
            borderLeft: verifier ? '3px solid #10b981' : stage === 'Pending Verification' ? '3px solid #f59e0b' : '3px solid var(--border-color)',
            paddingLeft: '8px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: verifier ? '#047857' : '#b45309' }}>
              STAGE 2: VERIFICATION
            </div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-heading)' }}>
              {verifier || (stage === 'Pending Verification' ? 'Awaiting Verifier' : '—')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {verifierDate ? `${verifierDate} ${verifierTime}` : (stage === 'Pending Verification' ? 'Pending verifier review' : '—')}
            </div>
            {verifier ? (
              <span className="badge badge-completed" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block' }}>
                ✓ Verified
              </span>
            ) : stage === 'Pending Verification' ? (
              <span className="badge badge-progress" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309' }}>
                ⏳ Action Required
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>—</span>
            )}
          </div>

          {/* Stage 3: Approval */}
          <div style={{
            borderLeft: isApproved ? '3px solid #10b981' : '3px solid var(--border-color)',
            paddingLeft: '8px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: isApproved ? '#047857' : 'var(--text-muted)' }}>
              STAGE 3: APPROVAL
            </div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-heading)' }}>
              {approver || (isApproved ? 'Plant Approver' : 'Awaiting Approval')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {approvalDate ? `${approvalDate} ${approvalTime}` : 'Pending final sign & submission'}
            </div>
            {isApproved ? (
              <span className="badge badge-completed" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block' }}>
                ✓ Submitted (docstatus: 1)
              </span>
            ) : (
              <span className="badge badge-progress" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block' }}>
                Queued
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Alert Box */}
      {stage === 'Rejected' && (
        <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
            <AlertTriangle size={16} />
            <span>Operational Non-Conformance / Form Rejection</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '8px' }}>
            <strong>Reason for Rejection:</strong> {rejectionReason || 'Non-conformance recorded during review.'}
          </div>
          {incidentSuccess ? (
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              <span>Plant Incident ticket created successfully: {incidentSuccess}</span>
            </div>
          ) : (
            <button
              type="button"
              className="primary-btn"
              disabled={incidentLoading}
              style={{
                backgroundColor: '#b91c1c',
                borderColor: '#b91c1c',
                fontSize: '11px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={handleMarkAsIncident}
            >
              {incidentLoading ? <Loader2 size={13} className="spin" /> : <AlertTriangle size={13} />}
              <span>{incidentLoading ? 'Creating Incident...' : 'Convert to Plant Incident Ticket'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

