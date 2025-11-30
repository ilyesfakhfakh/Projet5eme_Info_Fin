import React from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography, 
  CircularProgress 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const OrderBook = ({ data = { bids: [], asks: [] }, isLoading = false }) => {
  const theme = useTheme();
  const { bids = [], asks = [] } = data;

  const formatNumber = (num) => {
    if (!num) return '0.00';
    return parseFloat(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  const renderTable = (items, type) => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="order book">
        <TableHead>
          <TableRow>
            <TableCell>Price</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((order, index) => (
            <TableRow 
              key={`${type}-${index}`}
              sx={{ 
                '&:last-child td, &:last-child th': { border: 0 },
                backgroundColor: type === 'bids' 
                  ? 'rgba(0, 200, 83, 0.1)' 
                  : 'rgba(255, 53, 71, 0.1)'
              }}
            >
              <TableCell 
                component="th" 
                scope="row"
                sx={{ 
                  color: type === 'bids' 
                    ? theme.palette.success.main 
                    : theme.palette.error.main 
                }}
              >
                {formatNumber(order[0])}
              </TableCell>
              <TableCell align="right">{formatNumber(order[1])}</TableCell>
              <TableCell align="right">
                {formatNumber(order[0] * order[1])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Order Book
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box mb={2}>
            <Typography variant="subtitle1" color="success.main">
              Bids
            </Typography>
          </Box>
          {renderTable(bids, 'bids')}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box mb={2}>
            <Typography variant="subtitle1" color="error.main">
              Asks
            </Typography>
          </Box>
          {renderTable(asks, 'asks')}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderBook;
