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
    if (num === undefined || num === null) return '0.00';
    return parseFloat(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  const renderTable = (items, isBid = false) => {
    if (isLoading) {
      return (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 200
        }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          height: '100%', 
          bgcolor: 'background.paper',
          overflow: 'auto',
          minHeight: 300
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Price</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((order, index) => {
                const price = parseFloat(order.price || 0);
                const quantity = parseFloat(order.quantity || 0);
                const total = price * quantity;
                const depth = isBid 
                  ? (price / (bids[0]?.price || 1)) * 100
                  : (price / (asks[asks.length - 1]?.price || 1)) * 100;
                
                return (
                  <TableRow 
                    key={`${isBid ? 'bid' : 'ask'}-${index}`}
                    sx={{
                      background: isBid
                        ? `linear-gradient(to left, ${theme.palette.success.light}15 ${depth}%, transparent ${depth}%)`
                        : `linear-gradient(to left, ${theme.palette.error.light}15 ${depth}%, transparent ${depth}%)`,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        color: isBid ? theme.palette.success.main : theme.palette.error.main,
                        fontWeight: 500
                      }}
                    >
                      {formatNumber(price)}
                    </TableCell>
                    <TableCell align="right">{formatNumber(quantity)}</TableCell>
                    <TableCell align="right">{formatNumber(total)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No {isBid ? 'bids' : 'asks'} available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2,
      p: 2,
      bgcolor: 'background.default',
      borderRadius: 1
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Order Book
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2, 
        flex: 1, 
        overflow: 'hidden',
        minHeight: 400
      }}>
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: 0 // Fix for flexbox overflow
        }}>
          <Typography 
            variant="subtitle2" 
            color="success.main" 
            sx={{ 
              fontWeight: 600, 
              mb: 1,
              px: 1
            }}
          >
            Bids (Buy Orders)
          </Typography>
          {renderTable(bids, true)}
        </Box>
        
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: 0 // Fix for flexbox overflow
        }}>
          <Typography 
            variant="subtitle2" 
            color="error.main" 
            sx={{ 
              fontWeight: 600, 
              mb: 1,
              px: 1
            }}
          >
            Asks (Sell Orders)
          </Typography>
          {renderTable(asks, false)}
        </Box>
      </Box>
    </Box>
  );
};

export default OrderBook;
