export const MES_ROLE = 'IslandChill MES User';
export const ADMIN_ROLE = 'IslandChill Admin User';

export function resolveLoginPortal(roles = []) {
  const isMES = roles.includes(MES_ROLE);
  const isAdmin = roles.includes(ADMIN_ROLE);

  // Users with MES access stay in MES when logging in through IslandChill portal
  if (isMES) return 'mes';
  if (isAdmin) return 'admin';
  return 'denied';
}

export function canSwitchPortals(roles = []) {
  return (
    (roles.includes(MES_ROLE) && roles.includes(ADMIN_ROLE)) ||
    roles.includes('Administrator') ||
    roles.includes('System Manager')
  );
}

export function resolvePortalVisit(roles = [], requestedPortal = 'default') {
  const isMES = roles.includes(MES_ROLE);
  const isAdmin = roles.includes(ADMIN_ROLE);

  if (requestedPortal === 'admin' && isAdmin) return 'admin';
  if (requestedPortal === 'mes' && isMES) return 'mes';
  if (isMES) return 'mes';
  if (isAdmin) return 'admin';
  return 'denied';
}
