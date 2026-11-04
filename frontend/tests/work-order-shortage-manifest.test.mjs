import test from 'node:test';
import assert from 'node:assert/strict';

test('maxManifestableQty correctly calculates bottleneck output across BOM items', () => {
  const quantity = 5000;
  const items = [
    { item_code: 'PET-500', required_qty: 5000, available_qty: 3000, is_sufficient: false },
    { item_code: 'CAP-28', required_qty: 5000, available_qty: 4000, is_sufficient: false },
    { item_code: 'LBL-500', required_qty: 5000, available_qty: 10000, is_sufficient: true }
  ];

  const possibleBatches = items.map(it => {
    const req = parseFloat(it.required_qty) || 1;
    const avail = Math.max(0, parseFloat(it.available_qty) || 0);
    return Math.floor((avail * quantity) / req);
  });

  const maxManifestableQty = Math.min(...possibleBatches);
  assert.equal(maxManifestableQty, 3000, 'Bottleneck item PET-500 limits production to 3000 units');
});

test('maxManifestableQty handles zero available stock gracefully', () => {
  const quantity = 1000;
  const items = [
    { item_code: 'RAW-01', required_qty: 1000, available_qty: 0, is_sufficient: false }
  ];

  const possibleBatches = items.map(it => {
    const req = parseFloat(it.required_qty) || 1;
    const avail = Math.max(0, parseFloat(it.available_qty) || 0);
    return Math.floor((avail * quantity) / req);
  });

  const maxManifestableQty = Math.min(...possibleBatches);
  assert.equal(maxManifestableQty, 0, 'Zero stock yields 0 manifestable finished goods');
});
