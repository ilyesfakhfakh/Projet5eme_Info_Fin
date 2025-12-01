// Test requiring ALM routes
try {
  const almRoutes = require('./finserve-api/app/routes/alm/alm.routes');
  console.log('ALM routes loaded successfully');
  console.log('Routes type:', typeof almRoutes);
} catch (error) {
  console.error('Error loading ALM routes:', error);
}