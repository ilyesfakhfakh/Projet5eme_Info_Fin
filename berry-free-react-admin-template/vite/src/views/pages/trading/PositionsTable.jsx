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
  Chip,
  useTheme,
  CircularProgress,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const StyledTableRow = styled(TableRow)(({ theme, profit }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  borderLeft: `4px solid ${
    profit > 0 
      ? theme.palette.success.main 
      : profit < 0 
        ? theme.palette.error.main 
        : 'transparent'
  }`,
}));

const formatCurrency = (value, currency = 'USD') => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value) => {
  if (value === undefined || value === null) return 'N/A';
  return `${value >= 0 ? '+' : ''}${parseFloat(value).toFixed(2)}%`;
};

const PositionsTable = ({ data = [], isLoading = false, onClosePosition }) => {
  const theme = useTheme();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClosePosition = (positionId) => {
    if (onClosePosition) {
      onClosePosition(positionId);
    }
  };

  // Calculate pagination
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No open positions
        </Typography>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Open Positions
        </Typography>
      </Box>
      
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Entry Price</TableCell>
              <TableCell align="right">Mark Price</TableCell>
              <TableCell align="right">Liq. Price</TableCell>
              <TableCell align="right">Margin</TableCell>
              <TableCell align="right">PNL (ROE %)</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((position) => {
              const isLong = position.side === 'long';
              const pnl = position.unrealizedPnl || 0;
              const roe = position.roe || 0;
              const isProfit = pnl >= 0;
              
              return (
                <StyledTableRow 
                  key={position.id}
                  hover
                  profit={isProfit ? 1 : -1}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {isLong ? (
                        <TrendingUpIcon 
                          fontSize="small" 
                          sx={{ 
                            color: theme.palette.success.main, 
                            mr: 1 
                          }} 
                        />
                      ) : (
                        <TrendingDownIcon 
                          fontSize="small" 
                          sx={{ 
                            color: theme.palette.error.main, 
                            mr: 1 
                          }} 
                        />
                      )}
                      <Typography variant="body2" fontWeight={500}>
                        {position.symbol}
                      </Typography>
                      <Chip 
                        label={position.side.toUpperCase()} 
                        size="small" 
                        color={isLong ? 'success' : 'error'} 
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {position.size}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {position.leverage}x
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(position.entryPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(position.markPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={position.liquidationPrice ? 'text.primary' : 'text.secondary'}
                    >
                      {position.liquidationPrice 
                        ? formatCurrency(position.liquidationPrice)
                        : '--'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(position.margin)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        color={isProfit ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(pnl)}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={isProfit ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(roe)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Close Position">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleClosePosition(position.id)}
                        sx={{
                          '&:hover': {
                            backgroundColor: theme.palette.error.background,
                          },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </StyledTableRow>
              );
            })}
            
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={8} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            marginBottom: 0,
          },
        }}
      />
    </Paper>
  );
};

export default PositionsTable;
