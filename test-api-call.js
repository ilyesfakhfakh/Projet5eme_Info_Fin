const axios = require('axios');

async function testApiCall() {
  try {
    console.log('Testing API call to get yield curves...');

    const response = await axios.get('http://localhost:3200/api/v1/alm/yield-curves');

    console.log('Success! Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testApiCall();