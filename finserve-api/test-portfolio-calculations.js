const PortfolioService = require('./app/services/portfolio.service');

// Test data
const mockPortfolio = {
  portfolio_id: 'test-123',
  initial_balance: 100000,
  current_balance: 95000,
  total_value: 0,
  profit_loss: 0,
  profit_loss_percentage: 0
};

const mockPositions = [
  {
    position_id: 'pos-1',
    portfolio_id: 'test-123',
    quantity: 100,
    average_price: 50,
    current_price: 55,
    market_value: 0,
    unrealized_pl: 0,
    unrealized_pl_percentage: 0,
    is_archived: false
  },
  {
    position_id: 'pos-2',
    portfolio_id: 'test-123',
    quantity: 200,
    average_price: 25,
    current_price: 30,
    market_value: 0,
    unrealized_pl: 0,
    unrealized_pl_percentage: 0,
    is_archived: false
  }
];

console.log('🧪 Testing Portfolio Calculations...\n');

// Test position calculations
console.log('Testing position calculations:');
mockPositions.forEach((pos, index) => {
  const quantity = parseFloat(pos.quantity);
  const currentPrice = parseFloat(pos.current_price);
  const averagePrice = parseFloat(pos.average_price);

  const expectedMarketValue = quantity * currentPrice;
  const expectedUnrealizedPl = quantity * (currentPrice - averagePrice);
  const expectedUnrealizedPlPercentage = ((currentPrice - averagePrice) / averagePrice) * 100;

  console.log(`Position ${index + 1}:`);
  console.log(`  Quantity: ${quantity}, Avg Price: ${averagePrice}, Current Price: ${currentPrice}`);
  console.log(`  Expected Market Value: ${expectedMarketValue}`);
  console.log(`  Expected P&L: ${expectedUnrealizedPl} (${expectedUnrealizedPlPercentage.toFixed(2)}%)`);
  console.log('');
});

// Test portfolio calculations
console.log('Testing portfolio calculations:');
const totalPositionsValue = mockPositions.reduce((sum, pos) => {
  return sum + (parseFloat(pos.quantity) * parseFloat(pos.current_price));
}, 0);

const currentBalance = parseFloat(mockPortfolio.current_balance);
const initialBalance = parseFloat(mockPortfolio.initial_balance);

const expectedTotalValue = currentBalance + totalPositionsValue;
const expectedProfitLoss = expectedTotalValue - initialBalance;
const expectedProfitLossPercentage = initialBalance > 0 ? (expectedProfitLoss / initialBalance) * 100 : 0;

console.log(`Initial Balance: ${initialBalance}`);
console.log(`Current Balance: ${currentBalance}`);
console.log(`Positions Value: ${totalPositionsValue}`);
console.log(`Expected Total Value: ${expectedTotalValue}`);
console.log(`Expected P&L: ${expectedProfitLoss} (${expectedProfitLossPercentage.toFixed(2)}%)`);
console.log('');

// Test VaR calculation
console.log('Testing VaR calculation:');
const testReturns = [0.01, -0.005, 0.008, -0.012, 0.006, 0.003, -0.009, 0.011, -0.004, 0.007];
const portfolioValue = 100000;

// Manual VaR calculation
const mean = testReturns.reduce((sum, r) => sum + r, 0) / testReturns.length;
const variance = testReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / testReturns.length;
const stdDev = Math.sqrt(variance);
const zScore95 = 1.645; // 95% confidence
const zScore99 = 2.326; // 99% confidence

const var95 = Math.abs(stdDev * zScore95 * portfolioValue);
const var99 = Math.abs(stdDev * zScore99 * portfolioValue);

console.log(`Test Returns: [${testReturns.join(', ')}]`);
console.log(`Mean: ${mean.toFixed(4)}, StdDev: ${stdDev.toFixed(4)}`);
console.log(`Portfolio Value: ${portfolioValue}`);
console.log(`VaR 95%: ${var95.toFixed(2)} (${(var95/portfolioValue*100).toFixed(2)}%)`);
console.log(`VaR 99%: ${var99.toFixed(2)} (${(var99/portfolioValue*100).toFixed(2)}%)`);
console.log('');

// Test validation
console.log('Testing data validation:');
const validPositionData = {
  quantity: 100,
  average_price: 50,
  current_price: 55
};

const invalidPositionData = [
  { quantity: -100, average_price: 50, current_price: 55 },
  { quantity: 100, average_price: -50, current_price: 55 },
  { quantity: 100, average_price: 50, current_price: -55 }
];

console.log('Valid position data:', PortfolioService.validatePositionData(validPositionData));

invalidPositionData.forEach((data, index) => {
  const errors = PortfolioService.validatePositionData(data);
  console.log(`Invalid position data ${index + 1}:`, errors);
});

console.log('\n✅ Tests completed!');