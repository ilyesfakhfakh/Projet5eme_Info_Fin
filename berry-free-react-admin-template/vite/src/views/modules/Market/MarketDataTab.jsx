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
  Chip,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  TrendingUp, 
  TrendingDown,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { assetsApi, marketDataApi } from 'api';

export default function MarketDataTab() {
  const [marketData, setMarketData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingData, setEditingData] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting state
  const [orderBy, setOrderBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [filterTrend, setFilterTrend] = useState(''); // 'up', 'down', ''
  
  const [formData, setFormData] = useState({
    asset_id: '',
    price: '',
    open_price: '',
    high_price: '',
    low_price: '',
    close_price: '',
    volume: '',
    change_amount: '',
    change_percentage: '',
    timestamp: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [marketData, searchTerm, filterAsset, filterTrend, orderBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await marketDataApi.getAll();
      setMarketData(response || []);
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
        price: data.close_price || '',
        open_price: data.open_price || '',
        high_price: data.high_price || '',
        low_price: data.low_price || '',
        close_price: data.close_price || '',
        volume: data.volume || '',
        change_amount: data.change || '',
        change_percentage: data.change_percent || '',
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
      });
    } else {
      setEditingData(null);
      setFormData({
        asset_id: '',
        price: '',
        open_price: '',
        high_price: '',
        low_price: '',
        close_price: '',
        volume: '',
        change_amount: '',
        change_percentage: '',
        timestamp: new Date().toISOString().slice(0, 16)
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
        await marketDataApi.update(editingData.data_id, formData);
      } else {
        await marketDataApi.create(formData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette donnée?')) {
      try {
        await marketDataApi.delete(id);
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
    let filtered = [...marketData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(data => {
        const assetName = getAssetName(data.asset_id).toLowerCase();
        return assetName.includes(searchTerm.toLowerCase());
      });
    }

    // Asset filter
    if (filterAsset) {
      filtered = filtered.filter(data => data.asset_id === filterAsset);
    }

    // Trend filter
    if (filterTrend === 'up') {
      filtered = filtered.filter(data => (data.change_percent || 0) >= 0);
    } else if (filterTrend === 'down') {
      filtered = filtered.filter(data => (data.change_percent || 0) < 0);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
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
    const headers = ['Asset', 'Prix', 'Open', 'High', 'Low', 'Volume', 'Change %', 'Date'];
    const csvData = filteredData.map(data => [
      getAssetName(data.asset_id),
      data.close_price,
      data.open_price,
      data.high_price,
      data.low_price,
      data.volume,
      data.change_percent,
      new Date(data.timestamp).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `market-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getStats = () => {
    if (filteredData.length === 0) return { total: 0, gainers: 0, losers: 0, avgChange: 0 };
    
    const gainers = filteredData.filter(d => (d.change_percent || 0) >= 0).length;
    const losers = filteredData.filter(d => (d.change_percent || 0) < 0).length;
    const avgChange = filteredData.reduce((acc, d) => acc + (d.change_percent || 0), 0) / filteredData.length;
    
    return { total: filteredData.length, gainers, losers, avgChange };
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
                Total Assets
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Gainers
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.gainers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Losers
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.losers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Avg Change
              </Typography>
              <Typography 
                variant="h4" 
                color={stats.avgChange >= 0 ? 'success.main' : 'error.main'}
              >
                {formatNumber(stats.avgChange)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher un asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtre Asset</InputLabel>
              <Select
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value)}
                label="Filtre Asset"
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
            <FormControl fullWidth size="small">
              <InputLabel>Tendance</InputLabel>
              <Select
                value={filterTrend}
                onChange={(e) => setFilterTrend(e.target.value)}
                label="Tendance"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="up">Hausse</MenuItem>
                <MenuItem value="down">Baisse</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
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
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'asset_id'}
                  direction={orderBy === 'asset_id' ? order : 'asc'}
                  onClick={() => handleSort('asset_id')}
                >
                  <strong>Asset</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'close_price'}
                  direction={orderBy === 'close_price' ? order : 'asc'}
                  onClick={() => handleSort('close_price')}
                >
                  <strong>Prix</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right"><strong>Open</strong></TableCell>
              <TableCell align="right"><strong>High</strong></TableCell>
              <TableCell align="right"><strong>Low</strong></TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'volume'}
                  direction={orderBy === 'volume' ? order : 'asc'}
                  onClick={() => handleSort('volume')}
                >
                  <strong>Volume</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'change_percent'}
                  direction={orderBy === 'change_percent' ? order : 'asc'}
                  onClick={() => handleSort('change_percent')}
                >
                  <strong>Change %</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timestamp'}
                  direction={orderBy === 'timestamp' ? order : 'asc'}
                  onClick={() => handleSort('timestamp')}
                >
                  <strong>Date</strong>
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
                <TableRow key={data.data_id} hover>
                  <TableCell>{getAssetName(data.asset_id)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${formatNumber(data.close_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">${formatNumber(data.open_price)}</TableCell>
                  <TableCell align="right">${formatNumber(data.high_price)}</TableCell>
                  <TableCell align="right">${formatNumber(data.low_price)}</TableCell>
                  <TableCell align="right">{formatNumber(data.volume)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {data.change_percent >= 0 ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color={data.change_percent >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatNumber(data.change_percent)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {data.timestamp ? new Date(data.timestamp).toLocaleDateString() : '-'}
                  </TableCell>
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
                      onClick={() => handleDelete(data.data_id)}
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
          {editingData ? 'Modifier Donnée Market' : 'Nouvelle Donnée Market'}
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
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Prix Actuel"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Prix d'Ouverture"
                type="number"
                value={formData.open_price}
                onChange={(e) => setFormData({ ...formData, open_price: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Prix Haut"
                type="number"
                value={formData.high_price}
                onChange={(e) => setFormData({ ...formData, high_price: e.target.value })}
                fullWidth
              />
              <TextField
                label="Prix Bas"
                type="number"
                value={formData.low_price}
                onChange={(e) => setFormData({ ...formData, low_price: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Prix de Clôture"
              type="number"
              value={formData.close_price}
              onChange={(e) => setFormData({ ...formData, close_price: e.target.value })}
              fullWidth
            />
            <TextField
              label="Volume"
              type="number"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              fullWidth
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Changement (Montant)"
                type="number"
                value={formData.change_amount}
                onChange={(e) => setFormData({ ...formData, change_amount: e.target.value })}
                fullWidth
              />
              <TextField
                label="Changement (%)"
                type="number"
                value={formData.change_percentage}
                onChange={(e) => setFormData({ ...formData, change_percentage: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Date et Heure"
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
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
