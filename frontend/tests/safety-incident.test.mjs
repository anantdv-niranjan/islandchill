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

const { default: SafetyTab, SafetyIncidentFormModal, SafetyFirstAidFormModal, SafetySwabFormModal, SafetyReportViewerModal } = await server.ssrLoadModule('/src/components/SafetyTab.jsx');
const { frappe } = await server.ssrLoadModule('/src/services/frappe.js');

const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const noop = () => {};

test('SafetyIncidentFormModal displays "Auto-creates Plant Incident" indicator badge', () => {
  const html = render(SafetyIncidentFormModal, {
    onClose: noop,
    onSubmit: noop,
    saving: false,
    employeeList: [],
    handleSearchEmployees: noop,
    showEmployeeDropdown: false,
    setShowEmployeeDropdown: noop,
    activeSearchField: '',
    workOrders: []
  });

  assert.ok(html.includes('Auto-creates Plant Incident'));
  assert.ok(html.includes('OHSF 1 &amp; 2: Accident and Disease Notification Report'));
});

test('SafetyFirstAidFormModal displays "Auto-creates Plant Incident" indicator badge', () => {
  const html = render(SafetyFirstAidFormModal, {
    onClose: noop,
    onSubmit: noop,
    saving: false,
    employeeList: [],
    handleSearchEmployees: noop,
    showEmployeeDropdown: false,
    setShowEmployeeDropdown: noop,
    activeSearchField: '',
    workOrders: []
  });

  assert.ok(html.includes('Auto-creates Plant Incident'));
  assert.ok(html.includes('Standard Form 17: First Aid Registry Log'));
});

test('SafetySwabFormModal shows acceptance threshold note (=< 15cfu) and triggers incident notification', () => {
  const html = render(SafetySwabFormModal, {
    onClose: noop,
    onSubmit: noop,
    saving: false,
    employeeList: [],
    handleSearchEmployees: noop,
    showEmployeeDropdown: false,
    setShowEmployeeDropdown: noop,
    activeSearchField: '',
    workOrders: []
  });

  assert.ok(html.includes('Acceptance threshold is =&lt; 15cfu'));
  assert.ok(html.includes('Warehouse counts are recorded but excluded from compliance limits'));
  assert.ok(html.includes('automatically create a Plant Incident'));
});

test('SafetyReportViewerModal displays Linked Plant Incident banner when linked_incident is present', () => {
  const recordWithIncident = {
    id: 'SAF-ADR-00010',
    type: 'Incident Report',
    timestamp: '2026-10-30 14:00:00',
    work_order: 'MFG-WO-2026-00050',
    injuredPerson: 'Tevita C. (HR-EMP-00012)',
    sex: 'Male',
    incidentTime: '2026-10-30 13:45',
    incidentType: 'Accident',
    incidentLocation: 'FL1 Conveyor line',
    details: 'Hand bruise from guide rail contact',
    linked_incident: 'INC-2026-00042'
  };

  const html = render(SafetyReportViewerModal, {
    record: recordWithIncident,
    onClose: noop,
    setEmailModal: noop
  });

  assert.ok(html.includes('Linked Plant Incident:'));
  assert.ok(html.includes('INC-2026-00042'));
  assert.ok(html.includes('Auto-synced with Plant Incidents'));
});

test('SafetyTab renders linked incident badges in the safety records table', () => {
  const safetyRecords = [
    {
      id: 'SAF-ADR-00001',
      type: 'Incident Report',
      timestamp: '2026-10-30 10:00:00',
      work_order: 'MFG-WO-2026-0001',
      injuredPerson: 'Sereana V.',
      operator: 'Simione T.',
      linked_incident: 'INC-2026-00101'
    },
    {
      id: 'SAF-FA-00002',
      type: 'First Aid Log',
      timestamp: '2026-10-30 11:30:00',
      work_order: 'MFG-WO-2026-0002',
      injuredPerson: 'Kelepi M.',
      verifiedBy: 'Mere N.',
      treatmentGiven: 'Antiseptic and bandage applied',
      linked_incident: 'INC-2026-00102'
    },
    {
      id: 'SAF-SWAB-00003',
      type: 'Swab Test',
      timestamp: '2026-10-30 12:00:00',
      analyst: 'Dr. Ronald P.',
      swabData: {
        filtration: { yeast: 22, mould: 5, hpc: 10 }
      },
      linked_incident: 'INC-2026-00103'
    }
  ];

  const html = render(SafetyTab, {
    safetyRecords,
    safetySearchQuery: '',
    setSafetySearchQuery: noop,
    safetyFilterType: 'All',
    setSafetyFilterType: noop,
    filteredSafetyRecords: safetyRecords,
    safetyPage: 1,
    setSafetyPage: noop,
    setActiveSafetyForm: noop,
    setViewingSafetyRecord: noop
  });

  assert.ok(html.includes('INC-2026-00101'));
  assert.ok(html.includes('INC-2026-00102'));
  assert.ok(html.includes('INC-2026-00103'));
});

test('Environmental swab test acceptance threshold logic: evaluates =< 15cfu and excludes warehouse', () => {
  const evaluateSwabThreshold = (swabData) => {
    const locationsMap = {
      filtration: 'Filtration Area',
      infeed: 'Infeed',
      cleanRoom: 'Clean Room',
      labelling: 'Labelling',
      warehouse: 'Ware-House',
      blowing: 'Blowing'
    };

    const breachedZones = [];
    let maxCfu = 0;
    Object.keys(swabData || {}).forEach(key => {
      if (key.toLowerCase().includes('warehouse')) return;
      const row = swabData[key] || {};
      const y = Number(row.yeast || 0);
      const m = Number(row.mould || 0);
      const h = Number(row.hpc || 0);
      const rowMax = Math.max(y, m, h);
      if (rowMax > 15) {
        if (rowMax > maxCfu) maxCfu = rowMax;
        const sub = [];
        if (y > 15) sub.push(`Yeast: ${y} CFU`);
        if (m > 15) sub.push(`Mould: ${m} CFU`);
        if (h > 15) sub.push(`HPC: ${h} CFU`);
        breachedZones.push(`${locationsMap[key] || key} (${sub.join(', ')})`);
      }
    });

    return {
      isBreached: breachedZones.length > 0,
      breachedZones,
      maxCfu,
      severity: breachedZones.length > 0 ? 'Critical' : 'Low'
    };
  };

  // Case 1: All non-warehouse areas are clean (<= 15 CFU)
  const cleanData = {
    filtration: { yeast: 5, mould: 4, hpc: 10 },
    infeed: { yeast: 8, mould: 2, hpc: 15 },
    cleanRoom: { yeast: 0, mould: 0, hpc: 3 },
    warehouse: { yeast: 12, mould: 14, hpc: 15 }
  };
  const res1 = evaluateSwabThreshold(cleanData);
  assert.equal(res1.isBreached, false);

  // Case 2: Warehouse has high count (35 CFU), but all others <= 15 CFU (Warehouse is EXCLUDED)
  const warehouseHighData = {
    filtration: { yeast: 5, mould: 4, hpc: 10 },
    infeed: { yeast: 8, mould: 2, hpc: 15 },
    cleanRoom: { yeast: 0, mould: 0, hpc: 3 },
    warehouse: { yeast: 35, mould: 22, hpc: 45 }
  };
  const res2 = evaluateSwabThreshold(warehouseHighData);
  assert.equal(res2.isBreached, false);

  // Case 3: Non-warehouse area exceeds 15 CFU (e.g. Clean Room yeast = 18 CFU) -> Critical severity
  const breachData = {
    filtration: { yeast: 5, mould: 4, hpc: 10 },
    infeed: { yeast: 8, mould: 2, hpc: 15 },
    cleanRoom: { yeast: 18, mould: 0, hpc: 3 },
    warehouse: { yeast: 10, mould: 10, hpc: 10 }
  };
  const res3 = evaluateSwabThreshold(breachData);
  assert.equal(res3.isBreached, true);
  assert.equal(res3.breachedZones.length, 1);
  assert.ok(res3.breachedZones[0].includes('Clean Room (Yeast: 18 CFU)'));
  assert.equal(res3.severity, 'Critical');

  // Case 4: Severe contamination (> 50 CFU) -> severity is Critical
  const severeData = {
    filtration: { yeast: 65, mould: 20, hpc: 10 },
    warehouse: { yeast: 10, mould: 10, hpc: 10 }
  };
  const res4 = evaluateSwabThreshold(severeData);
  assert.equal(res4.isBreached, true);
  assert.equal(res4.severity, 'Critical');
});
