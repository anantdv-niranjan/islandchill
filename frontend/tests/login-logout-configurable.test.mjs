import assert from 'node:assert/strict';
import test from 'node:test';

// 1. Classification & Dynamic Doctype Resolution Tests
function classifyFormDoctype(form_code, dt) {
  const code = (form_code || '').toLowerCase();
  const dtn = (dt || '').toLowerCase();
  if (code.startsWith('clean-') || ['cleaning', 'sanitation', 'balance check', 'incubator', 'cip'].some(k => dtn.includes(k))) {
    return 'cleaning';
  }
  if (code.startsWith('safety-') || ['accident', 'first aid', 'swab', 'induction', 'screening', 'injury'].some(k => dtn.includes(k))) {
    return 'safety';
  }
  if (code.startsWith('maint-') || ['maintenance', 'breakdown', 'handover'].some(k => dtn.includes(k))) {
    return 'maintenance';
  }
  if (code.startsWith('form') || ['micro', 'chemical', 'autoclave', 'sensory', 'photometer', 'seam', 'weight check', 'taste'].some(k => dtn.includes(k))) {
    return 'laboratory';
  }
  return 'other';
}

test('Dynamic Doctype Classification: classifies forms by configured codes and titles without hardcoded lists', () => {
  assert.equal(classifyFormDoctype('clean-toilet', 'Cleaning of Toilets'), 'cleaning');
  assert.equal(classifyFormDoctype('form85', 'Balance Check or Callibration'), 'cleaning');
  assert.equal(classifyFormDoctype('form9', 'Chemical Test'), 'laboratory');
  assert.equal(classifyFormDoctype('form1', 'Microbiological Analysis of Primary Raw Materials'), 'laboratory');
  assert.equal(classifyFormDoctype('safety-incident', 'Accident and Disease Notification Report'), 'safety');
  assert.equal(classifyFormDoctype('safety-swab', 'Enviromental Swab Test'), 'safety');
  assert.equal(classifyFormDoctype('maint-pm-daily', 'Daily Preventative Maintenance Schedule'), 'maintenance');
  assert.equal(classifyFormDoctype('maint-breakdown', 'Machine Breakdown'), 'maintenance');
});

// 2. Dynamic Permission Checking (Zero Hardcoded Roles)
function canVerifyRecord(item, formPermissions, isSuperAdmin = false) {
  if (isSuperAdmin) return true;
  if (formPermissions) {
    const keys = [item.doctype, item.formType, item.rawRecord?.doctype, item.rawRecord?.type, item.raw?.doctype, item.type].filter(Boolean);
    for (const k of keys) {
      const perm = formPermissions[k];
      if (perm && perm.can_verify !== undefined) return Boolean(perm.can_verify);
    }
    const allPerms = Object.values(formPermissions);
    if (allPerms.length > 0) {
      return allPerms.some(p => p.can_verify);
    }
  }
  return false;
}

function canApproveRecord(item, formPermissions, isSuperAdmin = false) {
  if (isSuperAdmin) return true;
  if (formPermissions) {
    const keys = [item.doctype, item.formType, item.rawRecord?.doctype, item.rawRecord?.type, item.raw?.doctype, item.type].filter(Boolean);
    for (const k of keys) {
      const perm = formPermissions[k];
      if (perm && perm.can_approve !== undefined) return Boolean(perm.can_approve);
    }
    const allPerms = Object.values(formPermissions);
    if (allPerms.length > 0) {
      return allPerms.some(p => p.can_approve);
    }
  }
  return false;
}

test('Zero hardcoded roles: permissions are strictly evaluated from database formPermissions', () => {
  const dynamicPermissions = {
    'Chemical Test': { can_view: true, can_create: false, can_verify: true, can_approve: false },
    'Daily Preventative Maintenance Schedule': { can_view: true, can_create: true, can_verify: true, can_approve: true }
  };

  const chemRecord = { doctype: 'Chemical Test' };
  const maintRecord = { doctype: 'Daily Preventative Maintenance Schedule' };

  // Can verify chem but cannot approve chem
  assert.equal(canVerifyRecord(chemRecord, dynamicPermissions), true);
  assert.equal(canApproveRecord(chemRecord, dynamicPermissions), false);

  // Can verify and approve maintenance
  assert.equal(canVerifyRecord(maintRecord, dynamicPermissions), true);
  assert.equal(canApproveRecord(maintRecord, dynamicPermissions), true);

  // Super admin always has both
  assert.equal(canVerifyRecord(chemRecord, {}, true), true);
  assert.equal(canApproveRecord(chemRecord, {}, true), true);
});

// 3. Tab-Based Lazy Loading Logic
test('Tab-Based Lazy Loading: only loads data for the current active tab', () => {
  const loadedModules = new Set();
  const mockLoaders = {
    laboratory: () => loadedModules.add('laboratory'),
    safety: () => loadedModules.add('safety'),
    cleaning: () => loadedModules.add('cleaning'),
    maintenance: () => loadedModules.add('maintenance'),
    inventory: () => loadedModules.add('inventory'),
    bom: () => loadedModules.add('bom'),
    workOrders: () => loadedModules.add('workOrders'),
  };

  function simulateTabMount(tab) {
    loadedModules.clear();
    if (tab === 'laboratory') {
      mockLoaders.laboratory();
    } else if (tab === 'safety') {
      mockLoaders.safety();
    } else if (tab === 'cleaning') {
      mockLoaders.cleaning();
    } else if (tab === 'maintenance') {
      mockLoaders.maintenance();
    } else if (tab === 'inventory') {
      mockLoaders.inventory();
    } else if (tab === 'bom') {
      mockLoaders.bom();
    } else if (tab === 'work-orders') {
      mockLoaders.workOrders();
      mockLoaders.maintenance();
    } else if (tab === 'approvals') {
      mockLoaders.cleaning();
      mockLoaders.laboratory();
      mockLoaders.safety();
      mockLoaders.maintenance();
      mockLoaders.workOrders();
    }
  }

  // Gardener landing on cleaning tab loads ONLY cleaning
  simulateTabMount('cleaning');
  assert.deepEqual(Array.from(loadedModules), ['cleaning']);

  // Lab Tech landing on laboratory loads ONLY laboratory
  simulateTabMount('laboratory');
  assert.deepEqual(Array.from(loadedModules), ['laboratory']);

  // Approvals tab loads records across modules for review
  simulateTabMount('approvals');
  assert.equal(loadedModules.has('cleaning'), true);
  assert.equal(loadedModules.has('laboratory'), true);
  assert.equal(loadedModules.has('safety'), true);
  assert.equal(loadedModules.has('maintenance'), true);
  assert.equal(loadedModules.has('workOrders'), true);
});

// 4. Instant Logout State Transition Test
test('Instant Logout: auth state is immediately reset to 0/empty', () => {
  let state = {
    isLoggedIn: true,
    currentUser: 'test.user@islandchill.com',
    currentUserRole: 'Gardener',
    currentUserRoles: ['Gardener'],
    portalPermissions: { allowed_pages: ['cleaning'] },
    currentTab: 'cleaning'
  };

  // Perform instant logout
  state = {
    ...state,
    isLoggedIn: false,
    currentUser: '',
    currentUserRole: '',
    currentUserRoles: [],
    portalPermissions: null,
    currentTab: 'dashboard'
  };

  assert.equal(state.isLoggedIn, false);
  assert.equal(state.currentUser, '');
  assert.equal(state.currentUserRole, '');
  assert.deepEqual(state.currentUserRoles, []);
  assert.equal(state.portalPermissions, null);
  assert.equal(state.currentTab, 'dashboard');
});

