import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonAppDir = path.resolve(__dirname, '../../islandchill');

describe('Maintenance Operational Incident Marker Integration', () => {
  it('custom_field.json defines incident fields for DPMS, PM Request, and Machine Breakdown', () => {
    const customFieldsPath = path.join(pythonAppDir, 'fixtures/custom_field.json');
    const content = fs.readFileSync(customFieldsPath, 'utf8');
    const customFields = JSON.parse(content);

    const targetDoctypes = [
      'Daily Preventative Maintenance Schedule',
      'Preventive Maintenance Request',
      'Machine Breakdown'
    ];

    for (const dt of targetDoctypes) {
      const dtFields = customFields.filter(f => f.dt === dt);
      const fieldnames = dtFields.map(f => f.fieldname);

      assert.ok(fieldnames.includes('is_incident'), `${dt} must have is_incident field`);
      assert.ok(fieldnames.includes('incident_severity'), `${dt} must have incident_severity field`);
      assert.ok(fieldnames.includes('incident_note'), `${dt} must have incident_note field`);
      assert.ok(fieldnames.includes('linked_incident'), `${dt} must have linked_incident field`);
    }
  });

  it('hooks.py registers process_maintenance_incident for all maintenance doctypes', () => {
    const hooksPath = path.join(pythonAppDir, 'hooks.py');
    const content = fs.readFileSync(hooksPath, 'utf8');

    const expectedDoctypes = [
      'Daily Preventative Maintenance Schedule',
      'Preventive Maintenance Request',
      'Machine Breakdown',
      'Weight Check',
      'Hourly Weight Check Form'
    ];

    for (const dt of expectedDoctypes) {
      assert.ok(
        content.includes(`"${dt}"`) || content.includes(`'${dt}'`),
        `hooks.py must contain doc_events entry for ${dt}`
      );
    }
    assert.ok(
      content.includes('process_maintenance_incident'),
      'hooks.py must reference process_maintenance_incident hook handler'
    );
  });

  it('manufacturing.py create_daily_pm_schedule and create_cleaning_sanitation_log support incident fields', () => {
    const mfgPath = path.join(pythonAppDir, 'api/manufacturing.py');
    const content = fs.readFileSync(mfgPath, 'utf8');

    assert.ok(
      content.includes('def create_daily_pm_schedule(') &&
      content.includes('is_incident=0') &&
      content.includes('incident_severity=None') &&
      content.includes('incident_note=None'),
      'create_daily_pm_schedule must accept incident parameters'
    );
    assert.ok(
      content.includes("'Machine Breakdown'") &&
      content.includes('create_cleaning_sanitation_log'),
      'create_cleaning_sanitation_log must support Machine Breakdown'
    );
  });

  it('incident_engine.py routes maintenance categories and links incidents', () => {
    const enginePath = path.join(pythonAppDir, 'api/incident_engine.py');
    const content = fs.readFileSync(enginePath, 'utf8');

    assert.ok(
      content.includes('def process_maintenance_incident('),
      'incident_engine.py must define process_maintenance_incident'
    );
    assert.ok(
      content.includes('Quality Alert') && content.includes('Equipment Fault'),
      'incident_engine.py must classify into Quality Alert and Equipment Fault'
    );
  });

  it('IncidentMarkerSection.jsx exists and exports a reusable component', () => {
    const compPath = path.join(__dirname, '../src/components/IncidentMarkerSection.jsx');
    assert.ok(fs.existsSync(compPath), 'IncidentMarkerSection.jsx component file must exist');
    const content = fs.readFileSync(compPath, 'utf8');
    assert.ok(content.includes('export default function IncidentMarkerSection'), 'Must default export IncidentMarkerSection');
    assert.ok(content.includes('Operational Incident & Deviation'), 'Must render Operational Incident & Deviation title');
    assert.ok(content.includes('#f59e0b') || content.includes('amber'), 'Must use amber accent theme');
  });

  it('MaintenanceTab.jsx embeds IncidentMarkerSection and filters duplicate incident fields', () => {
    const maintTabPath = path.join(__dirname, '../src/components/MaintenanceTab.jsx');
    const content = fs.readFileSync(maintTabPath, 'utf8');

    assert.ok(content.includes('IncidentMarkerSection'), 'MaintenanceTab.jsx must import and use IncidentMarkerSection');
    assert.ok(content.includes('INCIDENT_FIELD_NAMES'), 'MaintenanceTab.jsx must define INCIDENT_FIELD_NAMES filter set');
    assert.ok(content.includes('<IncidentMarkerSection'), 'Must render IncidentMarkerSection in modals');
  });

  it('DailyMaintenanceChecklistModal.jsx embeds IncidentMarkerSection', () => {
    const modalPath = path.join(__dirname, '../src/components/DailyMaintenanceChecklistModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.ok(content.includes('IncidentMarkerSection'), 'DailyMaintenanceChecklistModal must import IncidentMarkerSection');
    assert.ok(content.includes('<IncidentMarkerSection'), 'DailyMaintenanceChecklistModal must render IncidentMarkerSection');
  });
});
