const fetch = require('node-fetch');

async function testRiskAssessment() {
  const portfolioId = 'baa8f4bf-f07f-4672-96f6-ee497a6e5eb2'; // klnlj portfolio

  console.log('Testing risk assessment for portfolio:', portfolioId);

  try {
    const response = await fetch('http://localhost:3200/api/v1/risk/assessment/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add basic auth or skip auth for testing
      },
      body: JSON.stringify({ portfolio_id: portfolioId })
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('Risk assessment successful!');
      console.log('Risk metrics calculated:');
      if (result.data && result.data.details && result.data.details.risk_metrics) {
        Object.entries(result.data.details.risk_metrics).forEach(([key, value]) => {
          console.log(`  ${key}: ${value.value ? value.value.toFixed(4) : 'N/A'} (${value.calculation_method})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('API call failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testRiskAssessment();