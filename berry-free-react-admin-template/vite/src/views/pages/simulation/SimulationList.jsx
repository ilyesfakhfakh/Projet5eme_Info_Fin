import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Refresh, MoreVert, BarChart, PlayArrow, Delete, Edit } from '@mui/icons-material';
import { format } from 'date-fns';
import { getSimulations, deleteSimulation } from 'api/simulationService';

const SimulationList = ({ onViewDetails, onEdit, onRun, onCreateNew }) => {
  const theme = useTheme();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSimulation, setSelectedSimulation] = useState(null);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      const data = await getSimulations();
      setSimulations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching simulations:', err);
      setError('Failed to load simulations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleMenuClick = (event, simulation) => {
    setAnchorEl(event.currentTarget);
    setSelectedSimulation(simulation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSimulation(null);
  };

  const handleDelete = async () => {
    if (!selectedSimulation) return;
    
    try {
      await deleteSimulation(selectedSimulation.id);
      await fetchSimulations();
    } catch (err) {
      console.error('Error deleting simulation:', err);
    } finally {
      handleMenuClose();
    }
  };

  const handleRun = () => {
    if (!selectedSimulation) return;
    onRun(selectedSimulation);
    handleMenuClose();
  };

  const handleEdit = () => {
    if (!selectedSimulation) return;
    onEdit(selectedSimulation);
    handleMenuClose();
  };

  const handleViewDetails = (simulation) => {
    onViewDetails(simulation);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredSimulations = simulations.filter(simulation => 
    simulation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    simulation.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    simulation.strategy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSimulations = [...filteredSimulations].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return order === 'asc' 
      ? (aValue < bValue ? -1 : 1) 
      : (aValue > bValue ? -1 : 1);
  });

  const paginatedSimulations = sortedSimulations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && simulations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography color="error">{error}</Typography>
        <Box mt={2}>
          <IconButton onClick={fetchSimulations} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Saved Simulations</Typography>
            <Box>
              <IconButton onClick={fetchSimulations} size="small" color="primary">
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search simulations..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <Box component="span" mr={1}>
                  <SearchIcon fontSize="small" color="action" />
                </Box>
              ),
            }}
          />
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell align="right">Timeframe</TableCell>
                <TableCell align="right">Profit/Loss</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdAt'}
                    direction={orderBy === 'createdAt' ? order : 'desc'}
                    onClick={() => handleRequestSort('createdAt')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSimulations.length > 0 ? (
                paginatedSimulations.map((simulation) => (
                  <TableRow 
                    key={simulation.id}
                    hover
                    onClick={() => handleViewDetails(simulation)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{simulation.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={simulation.symbol} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {simulation.strategy || 'Custom Strategy'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={simulation.timeframe || '1h'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={simulation.profitLoss >= 0 ? 'success.main' : 'error.main'}
                        fontWeight={500}
                      >
                        {simulation.profitLoss >= 0 ? '+' : ''}
                        {simulation.profitLoss?.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {' '}
                        <Typography 
                          component="span" 
                          variant="caption" 
                          color="text.secondary"
                        >
                          ({simulation.profitLossPercent?.toFixed(2)}%)
                        </Typography>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={simulation.status?.charAt(0).toUpperCase() + simulation.status?.slice(1) || 'N/A'}
                        color={getStatusColor(simulation.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {simulation.createdAt 
                          ? format(new Date(simulation.createdAt), 'MMM d, yyyy')
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, simulation)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm ? 'No matching simulations found' : 'No simulations available'}
                    </Typography>
                    {!searchTerm && (
                      <Box mt={2}>
                        <Button 
                          variant="outlined" 
                          color="primary"
                          onClick={onCreateNew}
                        >
                          Create New Simulation
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredSimulations.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSimulations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={handleRun}>
          <PlayArrow fontSize="small" sx={{ mr: 1 }} /> Run
        </MenuItem>
        <MenuItem onClick={handleViewDetails}>
          <BarChart fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default SimulationList;
