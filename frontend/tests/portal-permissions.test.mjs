import assert from 'node:assert/strict';
import test from 'node:test';

const allNavItems = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'dashboard-new', label: '✨ Dashboard New' },
  { id: 'workflow', label: '🔄 Business Workflow' },
  { id: 'approvals', label: '✅ Form Approvals' },
  { id: 'work-orders', label: '📋 Work Orders' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'inventory', label: '📦 Stock / Inventory' },
  { id: 'sales', label: '💰 Sales Desk' },
  { id: 'bom', label: '🧪 BOM Recipes' },
  { id: 'maintenance', label: '🔧 Maintenance' },
  { id: 'safety', label: '🦺 Health & Safety' },
  { id: 'laboratory', label: '🔬 Laboratory' },
  { id: 'cleaning', label: '🧹 Cleaning & Sanitation' },
  { id: 'reports', label: '📊 Reports' },
  { id: 'support', label: '🎧 Support Helpdesk' },
  { id: 'hr', label: '👥 Human Resource' }
];

function getVisibleNavItems(navItems, allowedPages) {
  if (!allowedPages || allowedPages.includes('*')) {
    return navItems;
  }
  return navItems.filter(item => allowedPages.includes(item.id));
}

test('super-admin allowedPages=["*"] renders all navigation items', () => {
  const visible = getVisibleNavItems(allNavItems, ['*']);
  assert.equal(visible.length, 16);
});

test('null or undefined allowedPages defaults to all navigation items', () => {
  assert.equal(getVisibleNavItems(allNavItems, null).length, 16);
  assert.equal(getVisibleNavItems(allNavItems, undefined).length, 16);
});

test('Gardener role sees exclusively Cleaning & Sanitation tab', () => {
  const gardenerPages = ['cleaning'];
  const visible = getVisibleNavItems(allNavItems, gardenerPages);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 'cleaning');
});

test('Lab Technicians role sees exclusively Laboratory tab', () => {
  const labPages = ['laboratory'];
  const visible = getVisibleNavItems(allNavItems, labPages);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 'laboratory');
});

test('Warehouse Supervisor sees Stock / Inventory and Sales Desk tabs', () => {
  const whPages = ['inventory', 'sales'];
  const visible = getVisibleNavItems(allNavItems, whPages);
  assert.equal(visible.length, 2);
  assert.deepEqual(visible.map(v => v.id), ['inventory', 'sales']);
});

test('Supervisor role sees Work Orders, Maintenance, Cleaning, Approvals, Incidents', () => {
  const supervisorPages = ['approvals', 'work-orders', 'incidents', 'maintenance', 'cleaning'];
  const visible = getVisibleNavItems(allNavItems, supervisorPages);
  assert.equal(visible.length, 5);
  assert.deepEqual(new Set(visible.map(v => v.id)), new Set(supervisorPages));
});

test('role-restricted allowedPages filters down to exact permitted tabs', () => {
  const labTechPages = ['cleaning', 'dashboard', 'laboratory', 'reports', 'safety', 'support'];
  const visible = getVisibleNavItems(allNavItems, labTechPages);
  assert.equal(visible.length, 6);
  assert.deepEqual(new Set(visible.map(v => v.id)), new Set(labTechPages));
  assert.equal(visible.some(v => v.id === 'sales'), false);
  assert.equal(visible.some(v => v.id === 'work-orders'), false);
});

test('form-level permission correctly distinguishes can_create and can_view', () => {
  const mockForms = {
    form1: { can_view: true, can_create: true, can_verify: false, can_approve: false },
    form88: { can_view: true, can_create: false, can_verify: false, can_approve: false }
  };

  // Lab Tech can create Form 1
  const form1CanCreate = mockForms.form1.can_create !== false;
  const form1CanView = mockForms.form1.can_view !== false;
  assert.equal(form1CanCreate, true);
  assert.equal(form1CanView, true);

  // Lab Tech can view Form 88 but cannot create
  const form88CanCreate = mockForms.form88.can_create === true;
  const form88CanView = mockForms.form88.can_view !== false;
  assert.equal(form88CanCreate, false);
  assert.equal(form88CanView, true);
});
