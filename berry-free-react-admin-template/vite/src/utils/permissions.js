export function hasPermission(user, permissionKey) {
  if (!permissionKey) return true;
  if (!user) return false;

  // Direct permissions array on user
  const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
  if (userPerms.includes(permissionKey)) return true;

  // Admin role shortcut
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (roles.some((r) => (r?.name || r?.role_name || '').toUpperCase() === 'ADMIN')) return true;

  // Role-based permissions
  const rolePerms = roles.flatMap((r) => (Array.isArray(r?.permissions) ? r.permissions : []));
  if (rolePerms.includes(permissionKey)) return true;

  return false;
}

export function filterMenuByPermissions(menuGroup, user) {
  if (!menuGroup || !Array.isArray(menuGroup.children)) return menuGroup;

  const children = menuGroup.children
    .map((item) => filterItem(item, user))
    .filter((x) => !!x);

  return { ...menuGroup, children };
}

function filterItem(item, user) {
  const need = item?.meta?.permission;
  if (need && !hasPermission(user, need)) return null;

  if (item.type === 'collapse' || item.type === 'group') {
    const children = Array.isArray(item.children) ? item.children.map((c) => filterItem(c, user)).filter(Boolean) : [];
    if (children.length === 0 && !item.url) return null;
    return { ...item, children };
  }

  return item;
}
