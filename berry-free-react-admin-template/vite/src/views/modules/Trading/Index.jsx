import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';

const TradingPage = () => {
  console.log('TradingPage component rendering');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Component mounted');
    setIsLoading(false);
    return () => {
      console.log('Component unmounted');
    };
  }, []);

  if (isLoading) {
    return (
      <MainCard title="Trading Platform">
        <Box p={3} textAlign="center">
          <Typography>Loading trading platform...</Typography>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard title="Trading Platform">
      <Box p={3}>
        <Typography variant="h4">Trading Platform</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Welcome to the trading platform. This is a simplified version for debugging.
        </Typography>
      </Box>
    </MainCard>
  );
};

export default TradingPage;
