import assert from 'node:assert/strict';
import test from 'node:test';

const MES = 'IslandChill MES User';
const ADMIN = 'IslandChill Admin User';
const routing = async () => {
  return import('../src/services/portalRouting.js');
};

test('users with both roles enter MES when logging into MES portal', async () => {
  const { resolveLoginPortal } = await routing();
  assert.equal(resolveLoginPortal([MES, ADMIN]), 'mes');
});

test('single-role users enter only their assigned portal', async () => {
  const { resolveLoginPortal } = await routing();
  assert.equal(resolveLoginPortal([MES]), 'mes');
  assert.equal(resolveLoginPortal([ADMIN]), 'admin');
});

test('users without an IslandChill portal role are denied', async () => {
  const { resolveLoginPortal } = await routing();
  assert.equal(resolveLoginPortal([]), 'denied');
  assert.equal(resolveLoginPortal(undefined), 'denied');
});

test('portal switching is available for dual-role users and administrators', async () => {
  const { canSwitchPortals } = await routing();
  assert.equal(canSwitchPortals([MES, ADMIN]), true);
  assert.equal(canSwitchPortals(['Administrator']), true);
  assert.equal(canSwitchPortals(['System Manager']), true);
  assert.equal(canSwitchPortals([MES]), false);
  assert.equal(canSwitchPortals([ADMIN]), false);
  assert.equal(canSwitchPortals([]), false);
  assert.equal(canSwitchPortals(undefined), false);
});

test('portal visits route dual-role users without redirect loop', async () => {
  const { resolvePortalVisit } = await routing();
  assert.equal(resolvePortalVisit([MES, ADMIN], 'mes'), 'mes');
  assert.equal(resolvePortalVisit([MES, ADMIN], 'admin'), 'admin');
  assert.equal(resolvePortalVisit([MES, ADMIN]), 'mes');
});

test('direct IslandChill visits keep MES-capable users in MES and return admin-only users to Desk', async () => {
  const { resolvePortalVisit } = await routing();
  assert.equal(resolvePortalVisit([MES]), 'mes');
  assert.equal(resolvePortalVisit([ADMIN]), 'admin');
  assert.equal(resolvePortalVisit([ADMIN], 'admin'), 'admin');
  assert.equal(resolvePortalVisit([]), 'denied');
});
