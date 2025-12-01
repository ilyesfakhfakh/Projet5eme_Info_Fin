// assets
import { IconChartHistogram, IconBriefcase, IconNews, IconShield, IconPlaystationX, IconArrowsShuffle, IconRobot, IconBook, IconChartDots, IconCalculator } from '@tabler/icons-react';

const icons = { IconChartHistogram, IconBriefcase, IconNews, IconShield, IconPlaystationX, IconArrowsShuffle, IconRobot, IconBook, IconChartDots, IconCalculator };

// ==============================|| MODULES MENU ITEMS ||============================== //

const modules = {
  id: 'modules',
  title: 'Modules',
  type: 'group',
  children: [
    { id: 'mod-market', title: 'Market', type: 'item', url: '/modules/market', icon: icons.IconChartHistogram },
    { id: 'mod-portfolio', title: 'Portfolio', type: 'item', url: '/modules/portfolio', icon: icons.IconBriefcase },
    { id: 'mod-news', title: 'News', type: 'item', url: '/modules/news', icon: icons.IconNews },
    { id: 'mod-risk', title: 'Risk', type: 'item', url: '/modules/risk', icon: icons.IconShield },
    { id: 'mod-simulation', title: 'Simulation', type: 'item', url: '/modules/simulation', icon: icons.IconPlaystationX },
    { id: 'mod-trading', title: 'Trading', type: 'item', url: '/modules/trading', icon: icons.IconArrowsShuffle },
    { id: 'mod-alm', title: 'ALM', type: 'item', url: '/modules/alm', icon: icons.IconCalculator },
    { id: 'mod-ai', title: 'AI', type: 'item', url: '/modules/ai', icon: icons.IconRobot },
    { id: 'mod-learning', title: 'Learning', type: 'item', url: '/modules/learning', icon: icons.IconBook },
    { id: 'mod-indicators', title: 'Indicators', type: 'item', url: '/modules/indicators', icon: icons.IconChartDots }
  ]
};

export default modules;
