// Test script to check controller loading
const controller = require('./finserve-api/app/controllers/alm/alm.controller');

console.log('Controller loaded:', !!controller);
console.log('getYieldCurves function:', !!controller.getYieldCurves);

// Mock request and response
const mockReq = {
  query: {}
};

const mockRes = {
  json: (data) => console.log('Response:', data),
  status: (code) => ({
    json: (data) => console.log('Error response:', code, data)
  })
};

// Try to call the function
if (controller.getYieldCurves) {
  controller.getYieldCurves(mockReq, mockRes).catch(console.error);
}