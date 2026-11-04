import assert from 'node:assert/strict';
import test from 'node:test';

function computeWorkOrderOperationTabs(wo, requestedTab = 'materials') {
  const isCancelled = wo.status === 'Cancelled';
  const isRawMaterialsIssued = Boolean(
    wo.stockEntrySubmitted ||
    (wo.transferred_qty && Number(wo.transferred_qty) > 0) ||
    (wo.produced_qty && Number(wo.produced_qty) > 0) ||
    wo.status === 'Completed'
  );
  const isMaintCompleted = Boolean(wo.maintAllCompleted);
  const isBothCompleted = isRawMaterialsIssued && isMaintCompleted;

  let jobCardDisabledReason = '';
  if (isCancelled) {
    jobCardDisabledReason = 'Work Order is Cancelled.';
  } else if (!isBothCompleted) {
    if (!isRawMaterialsIssued && !isMaintCompleted) {
      jobCardDisabledReason = 'Complete both Raw Material Issue and Maintenance checklists to unlock Job Cards.';
    } else if (!isRawMaterialsIssued) {
      jobCardDisabledReason = 'Issue Raw Materials to unlock Job Cards.';
    } else {
      jobCardDisabledReason = 'Complete Maintenance checklists to unlock Job Cards.';
    }
  }

  const maintLabel = isCancelled
    ? `Maintenance (${wo.maintCompletedCount || 0}/${wo.maintTotalCount || 0})`
    : isMaintCompleted
      ? `✓ Maintenance (${wo.maintCompletedCount || 0}/${wo.maintTotalCount || 0})`
      : `Maintenance (${wo.maintCompletedCount || 0}/${wo.maintTotalCount || 0})`;
  const materialsLabel = isCancelled
    ? (isRawMaterialsIssued ? 'Raw Materials (Issued)' : 'Raw Materials')
    : (isRawMaterialsIssued ? '✓ Issue Raw Materials' : 'Issue Raw Materials');
  const jobCardLabel = isCancelled
    ? `Job Cards (${wo.jobCards?.length || 0})`
    : isBothCompleted
      ? `Job Cards (${wo.jobCards?.length || 0})`
      : `🔒 Job Cards (${wo.jobCards?.length || 0})`;

  const operationTabOptions = [
    ['materials', materialsLabel, false, ''],
    ['maintenance', maintLabel, false, ''],
    ['job-card', jobCardLabel, !isCancelled && !isBothCompleted, jobCardDisabledReason]
  ];

  const activeTab = operationTabOptions.some(([tab, , disabled]) => tab === requestedTab && !disabled)
    ? requestedTab
    : 'materials';

  return {
    isCancelled,
    isRawMaterialsIssued,
    isMaintCompleted,
    isBothCompleted,
    operationTabOptions,
    activeTab
  };
}

test('Parallel execution: Both Issue Raw Materials and Maintenance are unlocked initially', () => {
  const wo = {
    id: 'MFG-WO-2026-00001',
    status: 'Not Started',
    stockEntrySubmitted: false,
    transferred_qty: 0,
    maintAllCompleted: false,
    maintCompletedCount: 0,
    maintTotalCount: 4,
    jobCards: [{ id: 'JC-1' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'materials');
  assert.equal(result.isRawMaterialsIssued, false);
  assert.equal(result.isMaintCompleted, false);
  assert.equal(result.isBothCompleted, false);

  const [matTab, maintTab, jcTab] = result.operationTabOptions;
  // Tab 1: materials enabled
  assert.equal(matTab[0], 'materials');
  assert.equal(matTab[2], false, 'Raw materials tab should be enabled');
  assert.equal(matTab[1], 'Issue Raw Materials');

  // Tab 2: maintenance enabled (PARALLEL ACCESS!)
  assert.equal(maintTab[0], 'maintenance');
  assert.equal(maintTab[2], false, 'Maintenance tab must be enabled in parallel before raw materials');
  assert.equal(maintTab[1], 'Maintenance (0/4)');

  // Tab 3: job cards disabled until both complete
  assert.equal(jcTab[0], 'job-card');
  assert.equal(jcTab[2], true, 'Job cards must be disabled when neither is completed');
  assert.equal(jcTab[3], 'Complete both Raw Material Issue and Maintenance checklists to unlock Job Cards.');
  assert.match(jcTab[1], /🔒 Job Cards/);
});

test('Parallel execution: User can freely switch to Maintenance tab without issuing materials first', () => {
  const wo = {
    id: 'MFG-WO-2026-00002',
    status: 'Not Started',
    stockEntrySubmitted: false,
    maintAllCompleted: false,
    maintCompletedCount: 1,
    maintTotalCount: 4,
    jobCards: [{ id: 'JC-1' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'maintenance');
  assert.equal(result.activeTab, 'maintenance', 'User should be able to actively select and work on maintenance');
});

test('Parallel execution: Only Raw Materials issued leaves Job Cards locked for pending Maintenance', () => {
  const wo = {
    id: 'MFG-WO-2026-00003',
    status: 'In Process',
    stockEntrySubmitted: true,
    transferred_qty: 10,
    maintAllCompleted: false,
    maintCompletedCount: 2,
    maintTotalCount: 4,
    jobCards: [{ id: 'JC-1' }, { id: 'JC-2' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'materials');
  assert.equal(result.isRawMaterialsIssued, true);
  assert.equal(result.isMaintCompleted, false);
  assert.equal(result.isBothCompleted, false);

  const [matTab, maintTab, jcTab] = result.operationTabOptions;
  assert.equal(matTab[1], '✓ Issue Raw Materials');
  assert.equal(matTab[2], false);
  assert.equal(maintTab[1], 'Maintenance (2/4)');
  assert.equal(maintTab[2], false);
  assert.equal(jcTab[2], true);
  assert.equal(jcTab[3], 'Complete Maintenance checklists to unlock Job Cards.');
});

test('Parallel execution: Only Maintenance completed leaves Job Cards locked for pending Raw Materials', () => {
  const wo = {
    id: 'MFG-WO-2026-00004',
    status: 'Not Started',
    stockEntrySubmitted: false,
    maintAllCompleted: true,
    maintCompletedCount: 4,
    maintTotalCount: 4,
    jobCards: [{ id: 'JC-1' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'maintenance');
  assert.equal(result.isRawMaterialsIssued, false);
  assert.equal(result.isMaintCompleted, true);
  assert.equal(result.isBothCompleted, false);

  const [matTab, maintTab, jcTab] = result.operationTabOptions;
  assert.equal(matTab[2], false);
  assert.equal(maintTab[1], '✓ Maintenance (4/4)');
  assert.equal(maintTab[2], false);
  assert.equal(jcTab[2], true);
  assert.equal(jcTab[3], 'Issue Raw Materials to unlock Job Cards.');
});

test('Parallel execution: Both completed unlocks Job Cards tab and allows selection', () => {
  const wo = {
    id: 'MFG-WO-2026-00005',
    status: 'In Process',
    stockEntrySubmitted: true,
    maintAllCompleted: true,
    maintCompletedCount: 4,
    maintTotalCount: 4,
    jobCards: [{ id: 'JC-1' }, { id: 'JC-2' }, { id: 'JC-3' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'job-card');
  assert.equal(result.isRawMaterialsIssued, true);
  assert.equal(result.isMaintCompleted, true);
  assert.equal(result.isBothCompleted, true);

  const [matTab, maintTab, jcTab] = result.operationTabOptions;
  assert.equal(matTab[1], '✓ Issue Raw Materials');
  assert.equal(maintTab[1], '✓ Maintenance (4/4)');
  assert.equal(jcTab[1], 'Job Cards (3)');
  assert.equal(jcTab[2], false, 'Job cards should now be completely enabled');
  assert.equal(result.activeTab, 'job-card', 'Active tab should successfully switch to job-card');
});

test('Safe fallback: If Job Cards tab is requested while still locked, it safely falls back to materials', () => {
  const wo = {
    id: 'MFG-WO-2026-00006',
    status: 'Not Started',
    stockEntrySubmitted: false,
    maintAllCompleted: false,
    jobCards: [{ id: 'JC-1' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'job-card');
  assert.equal(result.activeTab, 'materials', 'Disabled job-card must fall back safely to materials');
});

test('Cancelled work order: Tab labels show cancelled state and allow navigation without prerequisite lock', () => {
  const wo = {
    id: 'MFG-WO-2026-00007',
    status: 'Cancelled',
    stockEntrySubmitted: false,
    transferred_qty: 0,
    maintAllCompleted: false,
    maintCompletedCount: 0,
    maintTotalCount: 4,
    jobCards: [{ id: 'JC-1' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'materials');
  assert.equal(result.isCancelled, true);
  const [matTab, maintTab, jcTab] = result.operationTabOptions;

  // Materials tab has no "Issue Raw Materials" prompt
  assert.equal(matTab[0], 'materials');
  assert.equal(matTab[1], 'Raw Materials');
  assert.equal(matTab[2], false);

  // Maintenance tab has no checkmark or completion prompt
  assert.equal(maintTab[0], 'maintenance');
  assert.equal(maintTab[1], 'Maintenance (0/4)');
  assert.equal(maintTab[2], false);

  // Job Cards tab is viewable (not locked by prerequisite), so user can view existing cards
  assert.equal(jcTab[0], 'job-card');
  assert.equal(jcTab[1], 'Job Cards (1)');
  assert.equal(jcTab[2], false, 'Job card tab should be viewable without prerequisite lock when cancelled');

  // Can switch to job-card tab freely
  const jcResult = computeWorkOrderOperationTabs(wo, 'job-card');
  assert.equal(jcResult.activeTab, 'job-card');
});

test('Cancelled work order with materials previously issued: Shows Raw Materials (Issued)', () => {
  const wo = {
    id: 'MFG-WO-2026-00008',
    status: 'Cancelled',
    stockEntrySubmitted: true,
    transferred_qty: 100,
    maintAllCompleted: true,
    maintCompletedCount: 4,
    maintTotalCount: 4,
    jobCards: [{ id: 'JC-1' }]
  };

  const result = computeWorkOrderOperationTabs(wo, 'materials');
  assert.equal(result.isCancelled, true);
  const [matTab, maintTab, jcTab] = result.operationTabOptions;

  assert.equal(matTab[1], 'Raw Materials (Issued)');
  assert.equal(maintTab[1], 'Maintenance (4/4)');
  assert.equal(jcTab[1], 'Job Cards (1)');
});


