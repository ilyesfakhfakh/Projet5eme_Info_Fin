// Test script for yield curve creation
const axios = require('axios');

async function testYieldCurveCreation() {
  try {
    const payload = {
      curve_name: 'Test Curve',
      currency: 'EUR',
      curve_type: 'GOVERNMENT',
      maturity_points: [{ maturity: 1, rate: 0.04 }],
      created_by: 'dc25e004-bd97-4d59-a422-bd78851dace8'
    };

    console.log('Testing yield curve creation with payload:', payload);

    const response = await axios.post('http://localhost:3200/api/v1/alm/yield-curves', payload);

    console.log('Success! Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testYieldCurveCreation();