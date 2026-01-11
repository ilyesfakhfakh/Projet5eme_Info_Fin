import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import RequireAuth from 'routes/RequireAuth';
import PermissionRoute from 'routes/PermissionRoute';
import RootRedirect from 'routes/RootRedirect';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));
const UsersList = Loadable(lazy(() => import('views/pages/users/UsersList')));
const UserProfile = Loadable(lazy(() => import('views/pages/users/UserProfile')));
// modules routing
const MarketPage = Loadable(lazy(() => import('views/modules/Market/Index')));
const RealTimeMarketPage = Loadable(lazy(() => import('views/modules/Market/RealTimeMarket')));
const PortfolioPage = Loadable(lazy(() => import('views/modules/Portfolio/Index')));
const NewsPage = Loadable(lazy(() => import('views/modules/News/Index')));
const RealTimeNewsPage = Loadable(lazy(() => import('views/modules/News/RealTimeNews')));
const RiskPage = Loadable(lazy(() => import('views/modules/Risk/Index')));
const SimulationPage = Loadable(lazy(() => import('views/modules/Simulation/Index')));
const TradingPage = Loadable(lazy(() => import('views/modules/Trading/Index')));
const AlmPage = Loadable(lazy(() => import('views/modules/ALM/Index')));
const AIPage = Loadable(lazy(() => import('views/modules/AI/Index')));
const LearningPage = Loadable(lazy(() => import('views/modules/Learning/Index')));
const IndicatorsPage = Loadable(lazy(() => import('views/modules/Indicators/Index')));
// admin placeholders
const AuditLogsPage = Loadable(lazy(() => import('views/modules/Admin/AuditLogs')));
const SystemAlertsPage = Loadable(lazy(() => import('views/modules/Admin/SystemAlerts')));
const SystemConfigPage = Loadable(lazy(() => import('views/modules/Admin/SystemConfig')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <RequireAuth>
      <MainLayout />
    </RequireAuth>
  ),
  children: [
    {
      path: '/',
      element: <RootRedirect />
    },
    {
      path: 'users',
      element: (
        <PermissionRoute permission="users.read">
          <UsersList />
        </PermissionRoute>
      )
    },
    {
      path: 'users/:id',
      element: (
        <PermissionRoute permission="users.read">
          <UserProfile />
        </PermissionRoute>
      )
    },
    {
      path: 'profile',
      element: <UserProfile isProfilePage={true} />
    },
    {
      path: 'modules',
      children: [
        { path: 'market', element: <MarketPage /> },
        { path: 'market/realtime', element: <RealTimeMarketPage /> },
        { path: 'portfolio', element: <PortfolioPage /> },
        { path: 'news', element: <NewsPage /> },
        { path: 'news/realtime', element: <RealTimeNewsPage /> },
        { path: 'risk', element: <RiskPage /> },
        { path: 'simulation', element: <SimulationPage /> },
        { path: 'trading', element: <TradingPage /> },
        { path: 'alm', element: <AlmPage /> },
        { path: 'ai', element: <AIPage /> },
        { path: 'learning', element: <LearningPage /> },
        { path: 'indicators', element: <IndicatorsPage /> }
      ]
    },
    {
      path: 'admin',
      children: [
        {
          path: 'audit-logs',
          element: (
            <PermissionRoute permission="admin.audit.read">
              <AuditLogsPage />
            </PermissionRoute>
          )
        },
        {
          path: 'system-alerts',
          element: (
            <PermissionRoute permission="admin.alerts.read">
              <SystemAlertsPage />
            </PermissionRoute>
          )
        },
        {
          path: 'system-config',
          element: (
            <PermissionRoute permission="admin.config.read">
              <SystemConfigPage />
            </PermissionRoute>
          )
        }
      ]
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    }
  ]
};

export default MainRoutes;
