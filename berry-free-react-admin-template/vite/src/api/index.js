/**
 * API Services Index
 * Central export point for all API services
 */

// Core services
export { http } from './http';
export * as authApi from './auth';
export * as usersApi from './users';
export * as rolesApi from './roles';
export * as auditApi from './audit';

// Trading & Orders
export * as ordersApi from './orders';
export * as portfolioApi from './portfolio';
export * as strategiesApi from './strategies';
export * as orderBookApi from './orderBook';

// Market Data
export * as priceApi from './price';
export * as chartsApi from './charts';

// Technical Analysis
export * as technicalIndicatorsApi from './technicalIndicators';
export * as calculatorApi from './calculator';
export * as indicatorsService from './indicatorsService'; // Legacy support

// Simulation
export * as simulationApi from './simulationApi';
export * as simulationService from './simulationService'; // Legacy support

// Trading Service (legacy support)
export * as tradingService from './tradingService';

// Statistics
export * as statsApi from './stats';

// Menu
export * as menuApi from './menu';

// Import all services for default export
import * as auth from './auth';
import * as users from './users';
import * as roles from './roles';
import * as audit from './audit';
import * as orders from './orders';
import * as portfolio from './portfolio';
import * as strategies from './strategies';
import * as orderBook from './orderBook';
import * as price from './price';
import * as charts from './charts';
import * as technicalIndicators from './technicalIndicators';
import * as calculator from './calculator';
import * as simulation from './simulationApi';
import * as stats from './stats';
import * as menu from './menu';

// Default export with all services
export default {
  auth,
  users,
  roles,
  audit,
  orders,
  portfolio,
  strategies,
  orderBook,
  price,
  charts,
  technicalIndicators,
  calculator,
  simulation,
  stats,
  menu
};
