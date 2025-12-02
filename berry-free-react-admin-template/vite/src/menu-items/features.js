// assets
import { IconChartLine, IconUserCog, IconLayoutDashboard, IconVideo } from '@tabler/icons-react';

// constant
const icons = { IconChartLine, IconUserCog, IconLayoutDashboard, IconVideo };

// ==============================|| NEW FEATURES MENU ITEMS ||============================== //

const features = {
  id: 'features',
  title: 'New Features',
  type: 'group',
  children: [
    {
      id: 'comprehensive',
      title: 'Overview',
      type: 'item',
      url: '/overview',
      icon: icons.IconLayoutDashboard,
      breadcrumbs: false
    },
    {
      id: 'trading-hub',
      title: 'Trading Hub',
      type: 'item',
      url: '/trading-hub',
      icon: icons.IconChartLine,
      breadcrumbs: false
    },
    {
      id: 'streaming',
      title: 'Live Streaming',
      type: 'item',
      url: '/streaming',
      icon: icons.IconVideo,
      breadcrumbs: false
    },
    {
      id: 'administration',
      title: 'Administration',
      type: 'item',
      url: '/administration',
      icon: icons.IconUserCog,
      breadcrumbs: false
    }
  ]
};

export default features;
