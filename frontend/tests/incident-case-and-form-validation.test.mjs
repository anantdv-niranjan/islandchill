import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = await createServer({
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: { ignored: ['**'] } },
  appType: 'custom'
});
after(() => server.close());

const { normalizeIncidentStatus } = await server.ssrLoadModule('/src/components/IncidentsTab.jsx');
const { frappe } = await server.ssrLoadModule('/src/services/frappe.js');

test('normalizeIncidentStatus correctly normalizes lowercase status values to Title Case', () => {
  // Frappe Select fields strictly require exact title case options:
  // "Open", "Acknowledged", "Pending", "Resolved", "Closed"
  assert.equal(normalizeIncidentStatus('resolved'), 'Resolved');
  assert.equal(normalizeIncidentStatus('Resolved'), 'Resolved');
  assert.equal(normalizeIncidentStatus('open'), 'Open');
  assert.equal(normalizeIncidentStatus('Open'), 'Open');
  assert.equal(normalizeIncidentStatus('acknowledged'), 'Acknowledged');
  assert.equal(normalizeIncidentStatus('Acknowledged'), 'Acknowledged');
  assert.equal(normalizeIncidentStatus('pending'), 'Pending');
  assert.equal(normalizeIncidentStatus('Pending'), 'Pending');
  assert.equal(normalizeIncidentStatus('closed'), 'Closed');
  assert.equal(normalizeIncidentStatus('Closed'), 'Closed');
  assert.equal(normalizeIncidentStatus(null), 'Open');
  assert.equal(normalizeIncidentStatus(undefined), 'Open');
  assert.equal(normalizeIncidentStatus(''), 'Open');
});

test('DocType json for Microbiological Analysis of Primary Raw Materials defines analyst as reqd: 1', () => {
  const doctypePath = path.resolve(
    __dirname,
    '../../../erpnext/erpnext/manufacturing/doctype/microbiological_analysis_of_primary_raw_materials/microbiological_analysis_of_primary_raw_materials.json'
  );

  assert.ok(fs.existsSync(doctypePath), 'DocType JSON file must exist');
  const jsonContent = JSON.parse(fs.readFileSync(doctypePath, 'utf-8'));
  const analystField = jsonContent.fields.find(f => f.fieldname === 'analyst');

  assert.ok(analystField, 'analyst field must exist in fields array');
  assert.equal(analystField.fieldtype, 'Link');
  assert.equal(analystField.options, 'Employee');
  assert.equal(analystField.reqd, 1, 'analyst field must have reqd: 1');
});

test('extractEmployeeId rejects placeholder names like Supervisor, Manager, Analyst, Operator', () => {
  const extractEmployeeId = (val) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (['Supervisor', 'Manager', 'Analyst', 'Operator', 'Admin'].includes(trimmed)) return '';
    const match = trimmed.match(/\(([^)]+)\)/);
    return match ? match[1] : trimmed;
  };

  assert.equal(extractEmployeeId('Supervisor'), '');
  assert.equal(extractEmployeeId('Manager'), '');
  assert.equal(extractEmployeeId('Analyst'), '');
  assert.equal(extractEmployeeId('Operator'), '');
  assert.equal(extractEmployeeId('Admin'), '');
  assert.equal(extractEmployeeId('John Doe (HR-EMP-0002)'), 'HR-EMP-0002');
  assert.equal(extractEmployeeId('HR-EMP-0003'), 'HR-EMP-0003');
});

test('Form 9 Chemical Test payload does not set verified_by to non-existent Supervisor', () => {
  const formDataFromUI = {
    test_date: '2026-10-30',
    sample_source: 'FL1',
    line: 'FL1',
    ph: 7.2,
    tds: 110,
    // Form 9 creation form omits verified_by because verification is done in Stage 2
    verified_by: undefined
  };

  const extractEmployeeId = (val) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (['Supervisor', 'Manager', 'Analyst', 'Operator', 'Admin'].includes(trimmed)) return '';
    const match = trimmed.match(/\(([^)]+)\)/);
    return match ? match[1] : trimmed;
  };

  const payload = {
    test_date: formDataFromUI.test_date,
    line: formDataFromUI.line,
    verified_by: extractEmployeeId(formDataFromUI.verified_by) || undefined
  };

  assert.equal(payload.verified_by, undefined, 'verified_by must be undefined when not provided');
  assert.notEqual(payload.verified_by, 'Supervisor', 'verified_by must NEVER be "Supervisor"');
});

test('FrappeService updateIncidentInvestigation and createIncident sanitize status to Title Case', async () => {
  let capturedPayload = null;
  const originalCall = frappe.callIslandChillMethod.bind(frappe);
  const originalConn = frappe.connection;

  try {
    frappe.connection = { isLive: true, connected: true, url: 'http://localhost:8000' };
    frappe.getConnectionSettings = () => ({ isLive: true, connected: true, url: 'http://localhost:8000' });

    frappe.callIslandChillMethod = async (method, payload) => {
      capturedPayload = { method, payload };
      return { success: true, name: 'INC-2026-00099' };
    };

    // 1. updateIncidentInvestigation with lowercase 'resolved'
    await frappe.updateIncidentInvestigation({
      incidentId: 'INC-2026-00099',
      status: 'resolved',
      rootCause: 'O-ring failure',
      correctiveAction: 'Replaced O-ring'
    });

    assert.ok(capturedPayload, 'callIslandChillMethod should be invoked');
    assert.equal(capturedPayload.method, 'update_incident_investigation');
    assert.equal(capturedPayload.payload.status, 'Resolved', 'Status must be sanitized to Title Case "Resolved"');

    // 2. createIncident with lowercase 'resolved'
    await frappe.createIncident({
      incident_title: 'Test Incident',
      status: 'resolved'
    });

    assert.equal(capturedPayload.method, 'create_incident');
    assert.equal(capturedPayload.payload.data.status, 'Resolved', 'createIncident status must be Title Case "Resolved"');
  } finally {
    frappe.callIslandChillMethod = originalCall;
    frappe.connection = originalConn;
    delete frappe.getConnectionSettings;
  }
});
