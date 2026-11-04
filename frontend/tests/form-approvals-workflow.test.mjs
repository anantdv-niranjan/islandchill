import assert from 'node:assert/strict';
import test from 'node:test';

// Stage classifier function mirroring StageAuditCard / ApprovalsTab logic
function classifyRecordStage(rec) {
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

function canUserVerify(item, formPermissions, isSuperAdmin) {
  if (isSuperAdmin) return true;
  if (!formPermissions) return true;
  const formKey = item.doctype || item.formType;
  const perm = formPermissions[formKey] || formPermissions[item.doctype];
  if (perm && perm.can_verify !== undefined) return Boolean(perm.can_verify);
  return true;
}

function canUserApprove(item, formPermissions, isSuperAdmin) {
  if (isSuperAdmin) return true;
  if (!formPermissions) return true;
  const formKey = item.doctype || item.formType;
  const perm = formPermissions[formKey] || formPermissions[item.doctype];
  if (perm && perm.can_approve !== undefined) return Boolean(perm.can_approve);
  return true;
}

test('Stage 1: Newly created operational record is classified as Pending Verification', () => {
  const draftRecord = {
    id: 'CT-2026-00001',
    doctype: 'Chemical Test',
    docstatus: 0,
    workflow_state: 'Pending Verification',
    analyst: 'qa@islandchill.com',
    date: '2026-10-30',
  };
  assert.equal(classifyRecordStage(draftRecord), 'Pending Verification');
});

test('Stage 2: Verified record advances to Pending Approval', () => {
  const verifiedRecord = {
    id: 'CT-2026-00001',
    doctype: 'Chemical Test',
    docstatus: 0,
    workflow_state: 'Pending Approval',
    analyst: 'qa@islandchill.com',
    verified_by: 'Faiyaz Farad Ali',
    verification_date: '2026-10-30',
  };
  assert.equal(classifyRecordStage(verifiedRecord), 'Pending Approval');
});

test('Stage 3: Approved record is finalized and submittable (docstatus: 1)', () => {
  const approvedRecord = {
    id: 'CT-2026-00001',
    doctype: 'Chemical Test',
    docstatus: 1,
    workflow_state: 'Approved',
    analyst: 'qa@islandchill.com',
    verified_by: 'Faiyaz Farad Ali',
    approved_by: 'Suraj Saran Deo',
  };
  assert.equal(classifyRecordStage(approvedRecord), 'Approved');
});

test('Rejection: Record marked as Rejected enters Rejected queue with reason', () => {
  const rejectedRecord = {
    id: 'CT-2026-00001',
    doctype: 'Chemical Test',
    docstatus: 0,
    workflow_state: 'Rejected',
    rejection_reason: 'pH out of range',
  };
  assert.equal(classifyRecordStage(rejectedRecord), 'Rejected');
});

test('Permission guards: Verifiers can verify but cannot approve without can_approve permission', () => {
  const item = { doctype: 'Chemical Test' };
  const verifierPerms = {
    'Chemical Test': { can_view: true, can_create: false, can_verify: true, can_approve: false }
  };
  const approverPerms = {
    'Chemical Test': { can_view: true, can_create: false, can_verify: false, can_approve: true }
  };

  assert.equal(canUserVerify(item, verifierPerms, false), true);
  assert.equal(canUserApprove(item, verifierPerms, false), false);

  assert.equal(canUserVerify(item, approverPerms, false), false);
  assert.equal(canUserApprove(item, approverPerms, false), true);
});

test('Super Admin always has verification and approval permissions', () => {
  const item = { doctype: 'Chemical Test' };
  const restrictedPerms = {
    'Chemical Test': { can_view: true, can_create: false, can_verify: false, can_approve: false }
  };
  assert.equal(canUserVerify(item, restrictedPerms, true), true);
  assert.equal(canUserApprove(item, restrictedPerms, true), true);
});

test('Maintenance PM Workflow: Draft is Pending Verification, Approved by Operator is Pending Approval, Approved by Supervisor is Approved', () => {
  const draftPM = {
    id: 'DPMS-00162',
    doctype: 'Daily Preventative Maintenance Schedule',
    docstatus: 0,
    workflow_state: 'Draft',
    sign_of_the_operator: 'John Doe',
  };
  assert.equal(classifyRecordStage(draftPM), 'Pending Verification');

  const verifiedPM = {
    id: 'DPMS-00162',
    doctype: 'Daily Preventative Maintenance Schedule',
    docstatus: 0,
    workflow_state: 'Approved by Operator',
    sign_of_the_operator: 'John Doe',
    verified_by: 'Supervisor Smith',
  };
  assert.equal(classifyRecordStage(verifiedPM), 'Pending Approval');

  const approvedPM = {
    id: 'DPMS-00162',
    doctype: 'Daily Preventative Maintenance Schedule',
    docstatus: 1,
    workflow_state: 'Approved by Supervisor',
    sign_of_the_operator: 'John Doe',
    sign_of_supervisor: 'Supervisor Smith',
  };
  assert.equal(classifyRecordStage(approvedPM), 'Approved');
});

test('Sanitation and Safety records classify correctly through the 3-stage lifecycle', () => {
  const sanitPending = {
    id: 'SAN-00045',
    doctype: 'Sanitation Record',
    docstatus: 0,
    workflow_state: 'Pending Verification',
  };
  assert.equal(classifyRecordStage(sanitPending), 'Pending Verification');

  const sanitVerified = {
    id: 'SAN-00045',
    doctype: 'Sanitation Record',
    docstatus: 0,
    workflow_state: 'Pending Approval',
    verified_by: 'Inspector A',
  };
  assert.equal(classifyRecordStage(sanitVerified), 'Pending Approval');

  const sanitRejected = {
    id: 'SAN-00045',
    doctype: 'Sanitation Record',
    docstatus: 0,
    workflow_state: 'Rejected',
    rejection_reason: 'Residue found on line',
  };
  assert.equal(classifyRecordStage(sanitRejected), 'Rejected');
});

test('Rejection takes precedence over sanitation_result Pass or prior approval timestamps', () => {
  const rejectedSanit = {
    id: 'SAN-00099',
    doctype: 'Sanitation Record',
    docstatus: 0,
    sanitation_result: 'Pass', // Initial default
    workflow_state: 'Rejected',
    rejection_reason: 'Contamination detected',
  };
  assert.equal(classifyRecordStage(rejectedSanit), 'Rejected');

  const rejectedWithTimestamp = {
    id: 'DPMS-2026-00016',
    doctype: 'Daily Preventative Maintenance Schedule',
    docstatus: 0,
    status: 'Rejected',
    workflow_state: 'Rejected',
    rejection_reason: 'Pump leak not repaired',
    approvalTimestamp: '2026-11-02 05:00:00'
  };
  assert.equal(classifyRecordStage(rejectedWithTimestamp), 'Rejected');
});
