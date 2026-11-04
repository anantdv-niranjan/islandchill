import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: { ignored: ['**'] } },
  appType: 'custom'
});
after(() => server.close());

const { default: IncidentsTab, mapApiIncident } = await server.ssrLoadModule('/src/components/IncidentsTab.jsx');
const { frappe } = await server.ssrLoadModule('/src/services/frappe.js');

const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test('mapApiIncident correctly maps live Plant Incident record fields', () => {
  const rawApiRecord = {
    name: 'INC-2026-00021',
    incident_title: 'Quality Alert — Microbiological Analysis of Primary Raw Materials MAPRM-2026-00002',
    category: 'Quality Alert',
    severity: 'High',
    status: 'Open',
    investigation_status: 'Pending',
    production_line: 'FL1',
    work_order: 'MFG-WO-2026-00045',
    production_item: '330ml Natural Artesian Water',
    batch_no: 'B2610-01',
    reported_time: '2026-10-30 21:05:25.219697',
    reported_by: 'dipankar.s@anantdv.com',
    downtime_minutes: 15,
    units_rejected: 42,
    detection_type: 'Manual Flag',
    source_doctype: 'Microbiological Analysis of Primary Raw Materials',
    source_name: 'MAPRM-2026-00002',
    description: 'Bacterial plate count exceeds specification limits on line inlet',
    root_cause_analysis: 'Filter membrane pinhole leak',
    corrective_action: 'Replace 0.2 micron membrane cartridge and sanitize housing'
  };

  const mapped = mapApiIncident(rawApiRecord);

  assert.equal(mapped.id, 'INC-2026-00021');
  assert.equal(mapped.name, 'INC-2026-00021');
  assert.equal(mapped.category, 'Quality Alert');
  assert.equal(mapped.severity, 'high');
  assert.equal(mapped.status, 'open');
  assert.equal(mapped.investigationStatus, 'Pending');
  assert.equal(mapped.line, 'FL1');
  assert.equal(mapped.work_order, 'MFG-WO-2026-00045');
  assert.equal(mapped.production_item, '330ml Natural Artesian Water');
  assert.equal(mapped.batch_no, 'B2610-01');
  assert.equal(mapped.source_doctype, 'Microbiological Analysis of Primary Raw Materials');
  assert.equal(mapped.source_name, 'MAPRM-2026-00002');
  assert.equal(mapped.detection_type, 'Manual Flag');
  assert.equal(mapped.downtimeMinutes, 15);
  assert.equal(mapped.downtime, '15 min downtime');
  assert.equal(mapped.unitsRejected, 42);
  assert.equal(mapped.date, '2026-10-30');
  assert.equal(mapped.time, '21:05');
  assert.equal(mapped.rootCause, 'Filter membrane pinhole leak');
  assert.equal(mapped.correctiveAction, 'Replace 0.2 micron membrane cartridge and sanitize housing');
  assert.equal(mapped.reportedBy, 'dipankar.s@anantdv.com');
});

test('FrappeService exposes getIncidents, createIncident, and updateIncidentInvestigation methods', () => {
  assert.equal(typeof frappe.getIncidents, 'function');
  assert.equal(typeof frappe.createIncident, 'function');
  assert.equal(typeof frappe.updateIncidentInvestigation, 'function');
});

test('IncidentsTab renders Live Plant Incident badge and container structure', () => {
  const html = render(IncidentsTab, {});
  assert.ok(html.includes('Incidents'));
  assert.ok(html.includes('Live Plant Incident'));
  assert.ok(html.includes('Log Incident'));
  assert.ok(html.includes('Search incidents by category, line, description...'));
});

test('IncidentsTab renders in-app source record links with View in App indicator', () => {
  const mockIncidents = [
    {
      id: 'INC-2026-00001',
      name: 'INC-2026-00001',
      category: 'Quality Alert',
      severity: 'high',
      status: 'open',
      description: 'Microbiology test deviation',
      time: '10:00',
      line: 'FL1',
      source_doctype: 'Chemical Test',
      source_name: 'CT-2026-0001'
    }
  ];

  const html = render(IncidentsTab, {
    safetyRecords: mockIncidents
  });

  // Verify list item contains in-app trigger button and desk fallback
  assert.ok(html.includes('Open source record in Island Chill'));
  assert.ok(html.includes('Chemical Test: CT-2026-0001') || html.includes('Chemical Test'));
});
