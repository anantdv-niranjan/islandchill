import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Maintenance Tab Cancelled Work Order Lockdown', () => {
  const maintTabPath = path.join(__dirname, '../src/components/MaintenanceTab.jsx');
  const modalPath = path.join(__dirname, '../src/components/DailyMaintenanceChecklistModal.jsx');
  const appPath = path.join(__dirname, '../src/App.jsx');

  it('MaintenanceTab.jsx detects cancelled status on current selected work order', () => {
    const content = fs.readFileSync(maintTabPath, 'utf8');
    assert.ok(
      content.includes("isWoCancelled = currentMaintWO?.status === 'Cancelled'"),
      'MaintenanceTab must detect if current selected Work Order is Cancelled'
    );
  });

  it('MaintenanceTab.jsx disables Fill Checklist in both Grid View and List View when WO is Cancelled', () => {
    const content = fs.readFileSync(maintTabPath, 'utf8');
    assert.ok(
      content.includes('disabled={doneForWO || isWoCancelled}'),
      'Fill Checklist button must be disabled when WO is Cancelled'
    );
    assert.ok(
      content.includes("isWoCancelled ? 'Cancelled' : 'Fill Checklist'"),
      'Button label must reflect Cancelled state'
    );
    assert.ok(
      content.includes("isWoCancelled ? 'Not Required (Cancelled)' : 'Pending'"),
      'Status badge must reflect Cancelled state'
    );
  });

  it('MaintenanceTab.jsx disables Breakdown, Weight Check, and PM Request forms when WO is Cancelled', () => {
    const content = fs.readFileSync(maintTabPath, 'utf8');
    assert.ok(
      content.includes("disabled={isWoCancelled}") &&
      content.includes("Regular checks, breakdowns, and PM requests cannot be filled for this Work Order"),
      'Regular-breakdown buttons and warning banner must be active when WO is Cancelled'
    );
  });

  it('WOSelectorPopup filters out Cancelled work orders from selection list', () => {
    const content = fs.readFileSync(maintTabPath, 'utf8');
    assert.ok(
      content.includes("s !== 'completed' && s !== 'cancelled'"),
      'WOSelectorPopup must exclude Cancelled work orders'
    );
  });

  it('DailyMaintenanceChecklistModal filters out Cancelled work orders and rejects submission', () => {
    const content = fs.readFileSync(modalPath, 'utf8');
    assert.ok(
      content.includes(".filter(wo => (wo.status || '').toLowerCase() !== 'cancelled')"),
      'Modal select dropdown must filter out Cancelled work orders'
    );
    assert.ok(
      content.includes("woObj?.status === 'Cancelled'"),
      'Modal handleSubmit must reject submission if work order is Cancelled'
    );
  });

  it('App.jsx guards maintenance save handlers against Cancelled work orders', () => {
    const content = fs.readFileSync(appPath, 'utf8');
    assert.ok(
      content.includes("handleSaveCommonMaintenance") &&
      content.includes("Maintenance checklists cannot be filled for cancelled work orders"),
      'handleSaveCommonMaintenance must guard against Cancelled work orders'
    );
    assert.ok(
      content.includes("handleSaveMaintForm") &&
      content.includes("Maintenance forms cannot be submitted for cancelled work orders"),
      'handleSaveMaintForm must guard against Cancelled work orders'
    );
  });
});
