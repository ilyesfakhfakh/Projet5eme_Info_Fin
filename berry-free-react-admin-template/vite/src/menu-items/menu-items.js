// assets
import { IconDashboard, IconChartLine, IconApps, IconAward, IconCertificate, IconNews } from '@tabler/icons-react';

// constant
const icons = {
  IconDashboard,
  IconChartLine,
  IconApps,
  IconAward,
  IconCertificate,
  IconNews
};

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const menuItems = {
  items: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/',
      icon: icons.IconDashboard,
      breadcrumbs: false
    },
    {
      id: 'financial-news',
      title: 'Financial News',
      type: 'item',
      url: '/financial-news',
      icon: icons.IconNews,
      breadcrumbs: true
    },
    {
      id: 'indicators',
      title: 'Technical Indicators',
      type: 'item',
      url: '/indicators',
      icon: icons.IconChartLine,
      breadcrumbs: true
    },
    {
      id: 'trading',
      title: 'Trading',
      type: 'item',
      url: '/trading',
      icon: icons.IconChartLine,
      breadcrumbs: true
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      type: 'item',
      url: '/portfolio',
      icon: icons.IconChartLine,
      breadcrumbs: true
    },
    {
      id: 'market',
      title: 'Market',
      type: 'item',
      url: '/market',
      icon: icons.IconChartLine,
      breadcrumbs: true
    },
   
  ]
};

export default menuItems;
