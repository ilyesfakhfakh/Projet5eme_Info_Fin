import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, useTheme, Card, CardContent, Divider } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { getPortfolioData } from 'api/portfolioService';

const Portfolio = () => {
  const theme = useTheme();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const data = await getPortfolioData();
        setPortfolioData(data);
      } catch (err) {
        console.error('Failed to load portfolio data:', err);
        setError('Failed to load portfolio data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  if (loading) {
    return (
      <MainCard title="Portfolio">
        <Box display="flex" justifyContent="center" p={3}>
          <Typography>Loading portfolio data...</Typography>
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Portfolio">
        <Box p={3} color="error.main">
          <Typography>{error}</Typography>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard title="Portfolio Overview">
      <Grid container spacing={gridSpacing}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Balance
              </Typography>
              <Typography variant="h4">
                ${portfolioData?.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Available: ${portfolioData?.availableBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  In Orders: ${portfolioData?.inOrders?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Asset Allocation
              </Typography>
              <Grid container spacing={2}>
                {portfolioData?.assets?.map((asset) => (
                  <Grid item xs={6} sm={4} key={asset.symbol}>
                    <Box mb={1}>
                      <Typography variant="subtitle2">{asset.symbol}</Typography>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          {asset.amount} {asset.symbol.split('/')[0]}
                        </Typography>
                        <Typography variant="body2">
                          ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Box width="100%" height={4} bgcolor="divider" mt={0.5}>
                        <Box 
                          width={`${(asset.value / portfolioData.totalValue) * 100}%`} 
                          height="100%" 
                          bgcolor="primary.main"
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <Box>
                {portfolioData?.recentTransactions?.map((tx, index) => (
                  <Box key={index} mb={index < portfolioData.recentTransactions.length - 1 ? 2 : 0}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2">
                          {tx.type === 'buy' ? 'Buy' : 'Sell'} {tx.amount} {tx.symbol}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(tx.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body1" 
                        color={tx.type === 'buy' ? 'success.main' : 'error.main'}
                      >
                        {tx.type === 'buy' ? '+' : '-'}${tx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    {index < portfolioData.recentTransactions.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default Portfolio;
