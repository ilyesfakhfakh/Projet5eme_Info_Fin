// assets
import { IconUsers, IconAlertTriangle, IconSettings, IconListDetails } from '@tabler/icons-react';

const icons = { IconUsers, IconAlertTriangle, IconSettings, IconListDetails };

// ==============================|| ADMIN MENU ITEMS ||============================== //

const admin = {
  id: 'admin',
  title: 'Administration',
  type: 'group',
  children: [
    {
      id: 'admin-users',
      title: 'Users',
      type: 'item',
      url: '/users',
      icon: icons.IconUsers,
      meta: { permission: 'users.read' }
    },
    {
      id: 'admin-audit',
      title: 'Audit Logs',
      type: 'item',
      url: '/admin/audit-logs',
      icon: icons.IconListDetails,
      meta: { permission: 'admin.audit.read' }
    },
    {
      id: 'admin-alerts',
      title: 'System Alerts',
      type: 'item',
      url: '/admin/system-alerts',
      icon: icons.IconAlertTriangle,
      meta: { permission: 'admin.alerts.read' }
    },
    {
      id: 'admin-config',
      title: 'System Config',
      type: 'item',
      url: '/admin/system-config',
      icon: icons.IconSettings,
      meta: { permission: 'admin.config.read' }
    }
  ]
};

export default admin;
