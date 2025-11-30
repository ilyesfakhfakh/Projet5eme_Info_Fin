import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Typography,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { assetsApi, historicalDataApi } from 'api';

export default function HistoricalDataTab() {
  const [historicalData, setHistoricalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingData, setEditingData] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');
  
  // Filters
  const [filterAsset, setFilterAsset] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [formData, setFormData] = useState({
    asset_id: '',
    date: new Date().toISOString().slice(0, 10),
    open_price: '',
    high_price: '',
    low_price: '',
    close_price: '',
    volume: '',
    adjusted_close: ''
  });

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [historicalData, filterAsset, startDate, endDate, orderBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await historicalDataApi.getAll();
      setHistoricalData(response || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await assetsApi.getAll();
      setAssets(response || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  };

  const handleOpenDialog = (data = null) => {
    if (data) {
      setEditingData(data);
      setFormData({
        asset_id: data.asset_id || '',
        date: data.date ? new Date(data.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        open_price: data.open_price || '',
        high_price: data.high_price || '',
        low_price: data.low_price || '',
        close_price: data.close_price || '',
        volume: data.volume || '',
        adjusted_close: data.adjusted_close || ''
      });
    } else {
      setEditingData(null);
      setFormData({
        asset_id: '',
        date: new Date().toISOString().slice(0, 10),
        open_price: '',
        high_price: '',
        low_price: '',
        close_price: '',
        volume: '',
        adjusted_close: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingData(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingData) {
        await historicalDataApi.update(editingData.history_id, formData);
      } else {
        await historicalDataApi.create(formData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette donnée historique?')) {
      try {
        await historicalDataApi.delete(id);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.asset_id === assetId);
    return asset ? `${asset.symbol} - ${asset.name}` : assetId;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const applyFilters = () => {
    let filtered = [...historicalData];

    // Asset filter
    if (filterAsset) {
      filtered = filtered.filter(data => data.asset_id === filterAsset);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(data => new Date(data.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(data => new Date(data.date) <= new Date(endDate));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'number') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredData(filtered);
    setPage(0);
  };

  const handleSort = (property) => {
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

  const handleExportCSV = () => {
    const headers = ['Asset', 'Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume'];
    const csvData = filteredData.map(data => [
      getAssetName(data.asset_id),
      new Date(data.date).toLocaleDateString(),
      data.open_price,
      data.high_price,
      data.low_price,
      data.close_price,
      data.adjusted_close,
      data.volume
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historical-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getStats = () => {
    if (filteredData.length === 0) return { total: 0, avgVolume: 0, highestClose: 0, lowestClose: 0 };
    
    const volumes = filteredData.map(d => d.volume || 0);
    const closes = filteredData.map(d => d.close_price || 0).filter(p => p > 0);
    
    return {
      total: filteredData.length,
      avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      highestClose: Math.max(...closes),
      lowestClose: Math.min(...closes)
    };
  };

  const stats = getStats();
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Records
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Avg Volume
              </Typography>
              <Typography variant="h4">{formatNumber(stats.avgVolume)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Highest Close
              </Typography>
              <Typography variant="h4" color="success.main">
                ${formatNumber(stats.highestClose)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Lowest Close
              </Typography>
              <Typography variant="h4" color="error.main">
                ${formatNumber(stats.lowestClose)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Asset</InputLabel>
              <Select
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value)}
                label="Asset"
              >
                <MenuItem value="">Tous</MenuItem>
                {assets.map((asset) => (
                  <MenuItem key={asset.asset_id} value={asset.asset_id}>
                    {asset.symbol} - {asset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Date début"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DateRangeIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Date fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
              >
                Actualiser
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={filteredData.length === 0}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nouveau
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Asset</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  <strong>Date</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'open_price'}
                  direction={orderBy === 'open_price' ? order : 'asc'}
                  onClick={() => handleSort('open_price')}
                >
                  <strong>Open</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'high_price'}
                  direction={orderBy === 'high_price' ? order : 'asc'}
                  onClick={() => handleSort('high_price')}
                >
                  <strong>High</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'low_price'}
                  direction={orderBy === 'low_price' ? order : 'asc'}
                  onClick={() => handleSort('low_price')}
                >
                  <strong>Low</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'close_price'}
                  direction={orderBy === 'close_price' ? order : 'asc'}
                  onClick={() => handleSort('close_price')}
                >
                  <strong>Close</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right"><strong>Adj Close</strong></TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'volume'}
                  direction={orderBy === 'volume' ? order : 'asc'}
                  onClick={() => handleSort('volume')}
                >
                  <strong>Volume</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Chargement...</TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Aucune donnée trouvée</TableCell>
              </TableRow>
            ) : (
              paginatedData.map((data) => (
                <TableRow key={data.history_id} hover>
                  <TableCell>{getAssetName(data.asset_id)}</TableCell>
                  <TableCell>
                    {data.date ? new Date(data.date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell align="right">${formatNumber(data.open_price)}</TableCell>
                  <TableCell align="right">${formatNumber(data.high_price)}</TableCell>
                  <TableCell align="right">${formatNumber(data.low_price)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${formatNumber(data.close_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">${formatNumber(data.adjusted_close)}</TableCell>
                  <TableCell align="right">{formatNumber(data.volume)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(data)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(data.history_id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Lignes par page:"
      />

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingData ? 'Modifier Donnée Historique' : 'Nouvelle Donnée Historique'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Asset"
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              required
              fullWidth
            >
              {assets.map((asset) => (
                <MenuItem key={asset.asset_id} value={asset.asset_id}>
                  {asset.symbol} - {asset.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Prix d'Ouverture"
                type="number"
                value={formData.open_price}
                onChange={(e) => setFormData({ ...formData, open_price: e.target.value })}
                fullWidth
              />
              <TextField
                label="Prix Haut"
                type="number"
                value={formData.high_price}
                onChange={(e) => setFormData({ ...formData, high_price: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Prix Bas"
                type="number"
                value={formData.low_price}
                onChange={(e) => setFormData({ ...formData, low_price: e.target.value })}
                fullWidth
              />
              <TextField
                label="Prix de Clôture"
                type="number"
                value={formData.close_price}
                onChange={(e) => setFormData({ ...formData, close_price: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Prix Ajusté"
              type="number"
              value={formData.adjusted_close}
              onChange={(e) => setFormData({ ...formData, adjusted_close: e.target.value })}
              fullWidth
            />
            <TextField
              label="Volume"
              type="number"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingData ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
