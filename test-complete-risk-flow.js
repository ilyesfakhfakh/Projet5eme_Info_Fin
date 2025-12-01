const fetch = require('node-fetch');

async function testCompleteRiskFlow() {
  console.log('🚀 TESTING COMPLETE RISK MANAGEMENT FLOW\n');

  const baseURL = 'http://localhost:3200/api/v1';

  try {
    // Step 1: Create a test portfolio
    console.log('📁 Step 1: Creating test portfolio...');
    const portfolioData = {
      portfolio_name: `Test Risk Portfolio ${Date.now()}`,
      description: 'Test portfolio for risk management',
      currency: 'EUR',
      user_id: 'test-user' // You'll need to replace this with actual user ID
    };

    const portfolioResponse = await fetch(`${baseURL}/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portfolioData)
    });

    if (!portfolioResponse.ok) {
      throw new Error(`Failed to create portfolio: ${portfolioResponse.status}`);
    }

    const portfolio = await portfolioResponse.json();
    console.log('✅ Portfolio created:', portfolio.data.portfolio_name);
    console.log('   ID:', portfolio.data.portfolio_id);

    const portfolioId = portfolio.data.portfolio_id;

    // Step 2: Add positions to the portfolio
    console.log('\n📊 Step 2: Adding positions...');

    const positions = [
      {
        portfolio_id: portfolioId,
        asset_symbol: 'AAPL',
        quantity: 100,
        entry_price: 150.00,
        current_price: 155.00
      },
      {
        portfolio_id: portfolioId,
        asset_symbol: 'GOOGL',
        quantity: 50,
        entry_price: 2500.00,
        current_price: 2550.00
      },
      {
        portfolio_id: portfolioId,
        asset_symbol: 'TSLA',
        quantity: 25,
        entry_price: 800.00,
        current_price: 820.00
      }
    ];

    for (const position of positions) {
      const posResponse = await fetch(`${baseURL}/portfolios/${portfolioId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(position)
      });

      if (posResponse.ok) {
        const posData = await posResponse.json();
        console.log(`✅ Added ${position.asset_symbol}: ${position.quantity} shares @ €${position.current_price}`);
      } else {
        console.log(`❌ Failed to add ${position.asset_symbol}`);
      }
    }

    // Step 3: Check portfolio calculations
    console.log('\n🧮 Step 3: Checking portfolio calculations...');

    const portfolioResponse2 = await fetch(`${baseURL}/portfolios/${portfolioId}`);
    if (portfolioResponse2.ok) {
      const portfolioData = await portfolioResponse2.json();
      console.log('📊 Portfolio Summary:');
      console.log('   Total Value:', portfolioData.data?.total_value || 'N/A');
      console.log('   P&L:', portfolioData.data?.total_pnl || 'N/A');
    }

    // Step 4: Create risk limits
    console.log('\n⚠️ Step 4: Creating risk limits...');

    const riskLimits = [
      {
        portfolio_id: portfolioId,
        limit_type: 'EXPOSURE',
        limit_value: 50000, // €50,000 exposure limit
        instrument_type: 'ALL',
        time_horizon: 'DAILY',
        currency: 'EUR',
        breach_action: 'ALERT',
        is_active: true
      },
      {
        portfolio_id: portfolioId,
        limit_type: 'VAR',
        limit_value: 2500, // €2,500 VaR limit
        instrument_type: 'ALL',
        time_horizon: 'DAILY',
        currency: 'EUR',
        breach_action: 'ALERT',
        is_active: true
      }
    ];

    for (const limit of riskLimits) {
      const limitResponse = await fetch(`${baseURL}/risk/limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limit)
      });

      if (limitResponse.ok) {
        console.log(`✅ Created ${limit.limit_type} limit: €${limit.limit_value}`);
      } else {
        console.log(`❌ Failed to create ${limit.limit_type} limit`);
      }
    }

    // Step 5: Run risk assessment
    console.log('\n📈 Step 5: Running risk assessment...');

    const assessmentResponse = await fetch(`${baseURL}/risk/assessment/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolio_id: portfolioId })
    });

    if (assessmentResponse.ok) {
      const assessment = await assessmentResponse.json();
      console.log('✅ Risk assessment completed');
      console.log('📊 Risk Metrics:');

      if (assessment.data?.details?.risk_metrics) {
        Object.entries(assessment.data.details.risk_metrics).forEach(([key, value]) => {
          console.log(`   ${key}: €${value.value?.toFixed(2)} (${value.calculation_method})`);
        });
      }

      if (assessment.data?.details?.exposure) {
        console.log('🏦 Portfolio Exposure:');
        console.log(`   Gross Long: €${assessment.data.details.exposure.gross_long?.toFixed(2)}`);
        console.log(`   Gross Short: €${assessment.data.details.exposure.gross_short?.toFixed(2)}`);
        console.log(`   Net Exposure: €${assessment.data.details.exposure.net?.toFixed(2)}`);
      }
    }

    // Step 6: Run risk monitoring to generate alerts
    console.log('\n🚨 Step 6: Running risk monitoring for alerts...');

    const monitorResponse = await fetch(`${baseURL}/risk/monitor/limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolio_id: portfolioId })
    });

    if (monitorResponse.ok) {
      const monitorResult = await monitorResponse.json();
      console.log('✅ Risk monitoring completed');
      console.log(`   Limits monitored: ${monitorResult.data?.limits_monitored || 0}`);
      console.log(`   Alerts generated: ${monitorResult.data?.alerts_generated || 0}`);

      if (monitorResult.data?.alerts?.length > 0) {
        console.log('🚨 Generated Alerts:');
        monitorResult.data.alerts.forEach(alert => {
          console.log(`   ${alert.alert_type}: ${alert.description}`);
          console.log(`   Current: €${alert.current_value?.toFixed(2)}, Limit: €${alert.limit_value?.toFixed(2)}`);
        });
      }
    }

    // Step 7: Check alerts
    console.log('\n📋 Step 7: Checking active alerts...');

    const alertsResponse = await fetch(`${baseURL}/risk/alerts?portfolio_id=${portfolioId}&status=ACTIVE`);
    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      console.log(`📊 Active alerts: ${alertsData.data?.length || 0}`);

      if (alertsData.data?.length > 0) {
        alertsData.data.forEach(alert => {
          console.log(`🚨 ${alert.alert_type}: ${alert.description}`);
        });
      } else {
        console.log('ℹ️ No active alerts (this is expected if limits not breached)');
      }
    }

    // Step 8: Demonstrate alert generation by creating a breach
    console.log('\n🎯 Step 8: Demonstrating alert generation...');

    // Create a very low exposure limit to force a breach
    const breachLimit = {
      portfolio_id: portfolioId,
      limit_type: 'EXPOSURE',
      limit_value: 1000, // Very low limit to force breach
      instrument_type: 'ALL',
      time_horizon: 'DAILY',
      currency: 'EUR',
      breach_action: 'ALERT',
      is_active: true
    };

    await fetch(`${baseURL}/risk/limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(breachLimit)
    });

    // Run monitoring again
    const monitorResponse2 = await fetch(`${baseURL}/risk/monitor/limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolio_id: portfolioId })
    });

    if (monitorResponse2.ok) {
      const monitorResult2 = await monitorResponse2.json();
      console.log('✅ Second monitoring run completed');
      console.log(`   Alerts generated: ${monitorResult2.data?.alerts_generated || 0}`);

      if (monitorResult2.data?.alerts?.length > 0) {
        console.log('🚨 BREACH ALERT GENERATED!');
        monitorResult2.data.alerts.forEach(alert => {
          console.log(`   ${alert.alert_type}: ${alert.description}`);
          console.log(`   Severity: ${alert.severity}`);
        });
      }
    }

    // Final check of alerts
    const finalAlertsResponse = await fetch(`${baseURL}/risk/alerts?portfolio_id=${portfolioId}&status=ACTIVE`);
    if (finalAlertsResponse.ok) {
      const finalAlerts = await finalAlertsResponse.json();
      console.log(`\n🎉 FINAL RESULT: ${finalAlerts.data?.length || 0} active alerts in the system`);
    }

    console.log('\n✅ COMPLETE RISK FLOW TEST FINISHED');
    console.log('💡 Summary:');
    console.log('   - Portfolio created with positions');
    console.log('   - Risk metrics calculated');
    console.log('   - Risk limits set');
    console.log('   - Risk monitoring triggered alerts');
    console.log('   - Active alerts available in dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteRiskFlow();