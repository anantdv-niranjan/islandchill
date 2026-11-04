import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('portal_switch.js contains responsive collapsible styling and classes', () => {
  const switchJsPath = path.resolve(__dirname, '../../islandchill/public/js/portal_switch.js');
  const code = fs.readFileSync(switchJsPath, 'utf8');

  // Verify switch element id and class
  assert.ok(code.includes('islandchill-mes-switch'), 'Contains switch element id');
  assert.ok(code.includes('islandchill-switch-icon'), 'Separates icon for collapsible display');
  assert.ok(code.includes('islandchill-switch-text'), 'Separates text for collapsible display');

  // Verify CSS collapsible rules
  assert.ok(code.includes('.body-sidebar-container:not(.expanded)'), 'Supports non-expanded sidebar');
  assert.ok(code.includes('.is-collapsed'), 'Supports .is-collapsed state');
  assert.ok(code.includes('display: none !important'), 'Hides text when collapsed');
  assert.ok(code.includes('width: 34px !important'), 'Shrinks to 34px icon button when collapsed');

  // Verify dynamic collapse observer / event bindings
  assert.ok(code.includes('updateCollapsedState'), 'Contains updateCollapsedState logic');
  assert.ok(code.includes('sidebar-expand'), 'Listens for sidebar-expand events');
  assert.ok(code.includes('collapse-sidebar-link'), 'Listens for sidebar collapse toggle button');
});

test('portal_switch.js allows all operational IslandChill roles to switch to MES', () => {
  const switchJsPath = path.resolve(__dirname, '../../islandchill/public/js/portal_switch.js');
  const code = fs.readFileSync(switchJsPath, 'utf8');

  const requiredRoles = [
    'Technical Production Coordinator',
    'Production Manager',
    'Lab Technicians',
    'OHS Rep',
    'Quality Checks',
    'Supervisor',
    'Warehouse Supervisor',
    'Gardener'
  ];

  for (const role of requiredRoles) {
    assert.ok(code.includes(role), `Includes ${role} in roles list`);
  }
});
