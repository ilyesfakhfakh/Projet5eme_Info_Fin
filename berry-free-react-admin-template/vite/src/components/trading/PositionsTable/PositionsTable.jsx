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
}));

const formatCurrency = (value, currency = 'USD') => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);
};

const formatPercentage = (value) => {
  if (value === undefined || value === null) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

const PositionsTable = ({ data = [], isLoading = false, onClosePosition }) => {
  const theme = useTheme();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No open positions
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Open Positions
        </Typography>
      </Box>
      
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small" aria-label="positions table">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Entry Price</TableCell>
              <TableCell align="right">Mark Price</TableCell>
              <TableCell align="right">Leverage</TableCell>
              <TableCell align="right">P&L</TableCell>
              <TableCell align="right">P&L %</TableCell>
              <TableCell align="right">Liquidation</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((position) => {
                const isProfit = position.unrealizedPnl >= 0;
                const isLong = position.side === 'long';
                
                return (
                  <StyledTableRow
                    key={position.id}
                    hover
                    profit={isProfit}
                  >
                    <TableCell component="th" scope="row">
                      <Box display="flex" alignItems="center">
                        {isLong ? (
                          <TrendingUpIcon 
                            color="success" 
                            fontSize="small" 
                            sx={{ mr: 1 }} 
                          />
                        ) : (
                          <TrendingDownIcon 
                            color="error" 
                            fontSize="small" 
                            sx={{ mr: 1 }} 
                          />
                        )}
                        {position.symbol}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {position.size} {position.symbol.split('/')[0]}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(position.entryPrice)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(position.markPrice)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${position.leverage}x`} 
                        size="small" 
                        color={isLong ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{
                        color: isProfit 
                          ? theme.palette.success.main 
                          : theme.palette.error.main,
                        fontWeight: 'bold',
                      }}
                    >
                      {isProfit ? '+' : ''}{formatCurrency(position.unrealizedPnl)}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{
                        color: isProfit 
                          ? theme.palette.success.main 
                          : theme.palette.error.main,
                      }}
                    >
                      {isProfit ? '+' : ''}{formatPercentage(position.unrealizedPnlPercent)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(position.liquidationPrice)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Close Position">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleClosePosition(position.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </StyledTableRow>
                );
              })}
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
      />
    </Paper>
  );
};

export default PositionsTable;
