import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: { ignored: ['**'] } }, appType: 'custom' });
after(() => server.close());
const { LabMetadataFields, isCreateOmittedField } = await server.ssrLoadModule('/src/components/LabMetadataFields.jsx');
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const noop = () => {};

test('isCreateOmittedField correctly omits linked_incident, signatures, and supervisor approval controls', () => {
  assert.equal(isCreateOmittedField({ fieldname: 'linked_incident', fieldtype: 'Link' }), true);
  assert.equal(isCreateOmittedField({ fieldname: 'signature', fieldtype: 'Signature' }), true);
  assert.equal(isCreateOmittedField({ fieldname: 'approved_by', fieldtype: 'Link' }), true);
  assert.equal(isCreateOmittedField({ fieldname: 'is_incident', fieldtype: 'Check' }), false);
  assert.equal(isCreateOmittedField({ fieldname: 'incident_severity', fieldtype: 'Select' }), false);
  assert.equal(isCreateOmittedField({ fieldname: 'incident_note', fieldtype: 'Small Text' }), false);
});

test('LabMetadataFields renders incident section with amber theme and respects depends_on for severity and note', () => {
  const fields = [
    { fieldname: 'sample_id', fieldtype: 'Data', label: 'Sample ID' },
    { fieldname: 'incident_section', fieldtype: 'Section Break', label: 'Operational Incident & Deviation' },
    { fieldname: 'is_incident', fieldtype: 'Check', label: 'Flag as Operational Incident / Deviation' },
    { fieldname: 'incident_severity', fieldtype: 'Select', label: 'Incident Severity', options: 'Critical\nHigh\nMedium\nLow', depends_on: 'eval:doc.is_incident == 1' },
    { fieldname: 'incident_note', fieldtype: 'Small Text', label: 'Incident / Deviation Note', depends_on: 'eval:doc.is_incident == 1' },
    { fieldname: 'linked_incident', fieldtype: 'Link', label: 'Linked Incident', options: 'Plant Incident' }
  ];

  // 1. When is_incident = 0 (unflagged)
  const unflaggedHtml = render(LabMetadataFields, {
    fields,
    formData: { sample_id: 'SMP-01', is_incident: 0 },
    onChange: noop,
    isCreateMode: true
  });

  assert.ok(unflaggedHtml.includes('Operational Incident &amp; Deviation'));
  assert.ok(unflaggedHtml.includes('Flag as Operational Incident / Deviation'));
  // Severity and note should NOT be visible when unflagged
  assert.ok(!unflaggedHtml.includes('Incident Severity'));
  assert.ok(!unflaggedHtml.includes('Incident / Deviation Note'));
  // linked_incident should be omitted in create mode
  assert.ok(!unflaggedHtml.includes('Linked Incident'));

  // 2. When is_incident = 1 (flagged)
  const flaggedHtml = render(LabMetadataFields, {
    fields,
    formData: { sample_id: 'SMP-01', is_incident: 1, incident_severity: 'High', incident_note: 'Contamination detected' },
    onChange: noop,
    isCreateMode: true
  });

  assert.ok(flaggedHtml.includes('Operational Incident &amp; Deviation'));
  assert.ok(flaggedHtml.includes('Flag as Operational Incident / Deviation'));
  // Severity and note MUST be visible when flagged
  assert.ok(flaggedHtml.includes('Incident Severity'));
  assert.ok(flaggedHtml.includes('Incident / Deviation Note'));
  assert.ok(flaggedHtml.includes('Contamination detected'));
  // Amber active border color applied
  assert.ok(flaggedHtml.includes('#f59e0b'));
});
