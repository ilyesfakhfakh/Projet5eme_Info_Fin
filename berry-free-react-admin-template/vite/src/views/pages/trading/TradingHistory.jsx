import React, { useState } from 'react';
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
  TablePagination,
  Chip,
  useTheme,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';

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

const formatDateTime = (dateString) => {
  if (!dateString) return '--';
  try {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  } catch (e) {
    return '--';
  }
};

const formatCurrency = (value, currency = 'USD') => {
  if (value === undefined || value === null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatQuantity = (value) => {
  if (value === undefined || value === null) return '--';
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  });
};

const TradingHistory = ({ 
  data = [], 
  isLoading = false, 
  onRefresh,
  onExport,
  onFilterChange,
  initialFilters = {}
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    side: '',
    ...initialFilters,
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // In a real app, you would debounce this and call an API
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  // Apply filters and search
  const filteredData = data
    .filter((trade) => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.orderId.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = !filters.status || trade.status === filters.status;
      
      // Type filter
      const matchesType = !filters.type || trade.type === filters.type;
      
      // Side filter
      const matchesSide = !filters.side || trade.side === filters.side;
      
      return matchesSearch && matchesStatus && matchesType && matchesSide;
    });

  // Pagination
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Status chip color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'filled':
        return 'success';
      case 'canceled':
      case 'rejected':
        return 'error';
      case 'pending':
      case 'new':
        return 'warning';
      case 'partially_filled':
        return 'info';
      default:
        return 'default';
    }
  };

  // Side chip color
  const getSideColor = (side) => {
    return side?.toLowerCase() === 'buy' ? 'success' : 'error';
  };

  if (isLoading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
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
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Trade History
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search trades..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="filled">Filled</MenuItem>
              <MenuItem value="partially_filled">Partially Filled</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="market">Market</MenuItem>
              <MenuItem value="limit">Limit</MenuItem>
              <MenuItem value="stop">Stop</MenuItem>
              <MenuItem value="stop_limit">Stop Limit</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Side</InputLabel>
            <Select
              value={filters.side}
              label="Side"
              onChange={(e) => handleFilterChange('side', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="buy">Buy</MenuItem>
              <MenuItem value="sell">Sell</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <Button
                variant="outlined"
                size="small"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                sx={{ minWidth: 'auto' }}
              >
                <span style={{ display: { xs: 'none', sm: 'inline' } }}>Refresh</span>
              </Button>
            </Tooltip>
            
            <Tooltip title="Export">
              <Button
                variant="outlined"
                size="small"
                onClick={handleExport}
                startIcon={<DownloadIcon />}
                sx={{ minWidth: 'auto' }}
              >
                <span style={{ display: { xs: 'none', sm: 'inline' } }}>Export</span>
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date/Time</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No trade history found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((trade) => (
                <StyledTableRow 
                  key={`${trade.id || trade.orderId}-${trade.timestamp}`}
                  hover
                >
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateTime(trade.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {trade.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={trade.side?.toUpperCase()}
                      size="small"
                      color={getSideColor(trade.side)}
                      variant="outlined"
                      sx={{ 
                        minWidth: 60,
                        fontWeight: 500,
                        backgroundColor: 
                          trade.side?.toLowerCase() === 'buy' 
                            ? theme.palette.success.light + '33' 
                            : trade.side?.toLowerCase() === 'sell' 
                              ? theme.palette.error.light + '33' 
                              : 'transparent'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" textTransform="capitalize">
                      {trade.type?.replace('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(trade.price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatQuantity(trade.quantity)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(trade.cost || trade.price * trade.quantity)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={trade.status?.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(trade.status)}
                      sx={{ 
                        textTransform: 'capitalize',
                        minWidth: 100,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color="primary"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {trade.orderId?.substring(0, 6)}...
                    </Typography>
                  </TableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      />
    </Paper>
  );
};

export default TradingHistory;
