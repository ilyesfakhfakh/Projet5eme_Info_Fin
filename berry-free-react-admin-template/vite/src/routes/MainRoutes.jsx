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

// NEW FEATURES
const ComprehensiveDashboard = Loadable(lazy(() => import('views/dashboard/ComprehensiveDashboard')));
const TradingHub = Loadable(lazy(() => import('views/pages/TradingHub')));
const Gaming = Loadable(lazy(() => import('views/pages/Gaming')));
const FinancialNews = Loadable(lazy(() => import('views/pages/FinancialNews')));

// STREAMING FEATURES
const StreamList = Loadable(lazy(() => import('views/streaming/StreamList')));
const StreamerDashboard = Loadable(lazy(() => import('views/streaming/StreamerDashboard')));
const StreamViewer = Loadable(lazy(() => import('views/streaming/StreamViewer')));

// BOT BUILDER FEATURES
const BotList = Loadable(lazy(() => import('views/bot-builder/BotList')));
const BotBuilder = Loadable(lazy(() => import('views/bot-builder/BotBuilder')));
const Backtest = Loadable(lazy(() => import('views/bot-builder/Backtest')));
const BotTemplates = Loadable(lazy(() => import('views/bot-builder/BotTemplates')));

// modules routing
const MarketPage = Loadable(lazy(() => import('views/modules/Market/Index')));
const PortfolioPage = Loadable(lazy(() => import('views/modules/Portfolio/Index')));
const NewsPage = Loadable(lazy(() => import('views/modules/News/Index')));
const RiskPage = Loadable(lazy(() => import('views/modules/Risk/Index')));
const SimulationPage = Loadable(lazy(() => import('views/modules/Simulation/Index')));
const TradingPage = Loadable(lazy(() => import('views/modules/Trading/Index')));
const AIPage = Loadable(lazy(() => import('views/modules/AI/Index')));
const LearningPage = Loadable(lazy(() => import('views/modules/Learning/Index')));

// Use the simplified working version
const IndicatorsPage = Loadable(lazy(() => import('views/modules/Indicators/TechnicalIndicatorsSimple')));

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
    // NEW FEATURES
    {
      path: 'overview',
      element: <ComprehensiveDashboard />
    },
    {
      path: 'financial-news',
      element: <FinancialNews />
    },
    {
      path: 'trading-hub',
      element: <TradingHub />
    },
    {
      path: 'administration',
      element: <Gaming />
    },
    // STREAMING ROUTES
    {
      path: 'streaming',
      children: [
        {
          path: '',
          element: <StreamList />
        },
        {
          path: 'streamer',
          element: <StreamerDashboard />
        },
        {
          path: 'watch/:streamId',
          element: <StreamViewer />
        }
      ]
    },
    // BOT BUILDER ROUTES
    {
      path: 'bot-builder',
      children: [
        {
          path: '',
          element: <BotList />
        },
        {
          path: 'templates',
          element: <BotTemplates />
        },
        {
          path: ':botId',
          element: <BotBuilder />
        },
        {
          path: ':botId/backtest',
          element: <Backtest />
        }
      ]
    },
    {
      path: 'modules',
      children: [
        { path: 'market', element: <MarketPage /> },
        { path: 'portfolio', element: <PortfolioPage /> },
        { path: 'news', element: <NewsPage /> },
        { path: 'risk', element: <RiskPage /> },
        { path: 'simulation', element: <SimulationPage /> },
        { path: 'trading', element: <TradingPage /> },
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
