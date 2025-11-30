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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
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

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatCurrency = (value, currency = 'USD') => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);
};

const formatQuantity = (value) => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
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
  const [filters, setFilters] = useState({
    type: '',
    side: '',
    status: '',
    search: '',
    ...initialFilters
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleResetFilters = () => {
    const newFilters = {
      type: '',
      side: '',
      status: '',
      search: '',
    };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const filteredData = data.filter((trade) => {
    return (
      (filters.type === '' || trade.type === filters.type) &&
      (filters.side === '' || trade.side === filters.side) &&
      (filters.status === '' || trade.status === filters.status) &&
      (filters.search === '' || 
        trade.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        trade.symbol.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'filled':
        return 'success';
      case 'canceled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'filled':
        return <CheckCircleOutlineIcon fontSize="small" />;
      case 'canceled':
        return <CancelIcon fontSize="small" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" gutterBottom>
          Trading History
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} size="small" sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={onExport} size="small" sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filters">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)} 
              size="small"
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {showFilters && (
        <Box p={2} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by ID or symbol"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="market">Market</MenuItem>
                  <MenuItem value="limit">Limit</MenuItem>
                  <MenuItem value="stop">Stop</MenuItem>
                  <MenuItem value="stop_limit">Stop Limit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Side</InputLabel>
                <Select
                  value={filters.side}
                  onChange={(e) => handleFilterChange('side', e.target.value)}
                  label="Side"
                >
                  <MenuItem value="">All Sides</MenuItem>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="filled">Filled</MenuItem>
                  <MenuItem value="canceled">Canceled</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3} display="flex" justifyContent="flex-end">
              <Button 
                size="small" 
                onClick={handleResetFilters}
                disabled={!Object.values(filters).some(Boolean)}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small" aria-label="trading history">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date/Time</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((trade) => {
                const isBuy = trade.side === 'buy';
                const isFilled = trade.status === 'filled';
                
                return (
                  <StyledTableRow key={trade.id} hover>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {trade.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateTime(trade.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>
                      <Chip 
                        label={trade.type} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {isBuy ? (
                          <TrendingUpIcon 
                            color="success" 
                            fontSize="small" 
                            sx={{ mr: 0.5 }} 
                          />
                        ) : (
                          <TrendingDownIcon 
                            color="error" 
                            fontSize="small" 
                            sx={{ mr: 0.5 }} 
                          />
                        )}
                        <Typography 
                          variant="body2" 
                          color={isBuy ? 'success.main' : 'error.main'}
                          textTransform="capitalize"
                        >
                          {trade.side}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(trade.price)}
                    </TableCell>
                    <TableCell align="right">
                      {formatQuantity(trade.amount)} {trade.symbol.split('/')[0]}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(trade.price * trade.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(trade.status)}
                        label={trade.status}
                        color={getStatusColor(trade.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!isFilled && (
                        <Tooltip title="Cancel Order">
                          <IconButton size="small" color="error">
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </StyledTableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No trading history found
                  </Typography>
                  {Object.values(filters).some(Boolean) && (
                    <Button 
                      size="small" 
                      onClick={handleResetFilters}
                      sx={{ mt: 1 }}
                    >
                      Clear filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TradingHistory;
