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
  Chip,
  Alert,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  DeleteSweep as DeleteSweepIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import { assetsApi } from 'api';

const ASSET_TYPES = ['STOCK', 'CRYPTO', 'FOREX', 'COMMODITY', 'INDEX', 'BOND'];

export default function AssetsTab() {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting
  const [orderBy, setOrderBy] = useState('symbol');
  const [order, setOrder] = useState('asc');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSector, setFilterSector] = useState('');
  
  // Selection for bulk operations
  const [selected, setSelected] = useState([]);
  
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    asset_type: 'STOCK',
    exchange: '',
    sector: '',
    industry: '',
    market_cap: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, searchTerm, filterType, filterStatus, filterSector, orderBy, order]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await assetsApi.getAll();
      setAssets(response || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        symbol: asset.symbol || '',
        name: asset.name || '',
        asset_type: asset.asset_type || 'STOCK',
        exchange: asset.exchange || '',
        sector: asset.sector || '',
        industry: asset.industry || '',
        market_cap: asset.market_cap || '',
        description: asset.description || '',
        is_active: asset.is_active !== undefined ? asset.is_active : true
      });
    } else {
      setEditingAsset(null);
      setFormData({
        symbol: '',
        name: '',
        asset_type: 'STOCK',
        exchange: '',
        sector: '',
        industry: '',
        market_cap: '',
        description: '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAsset(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingAsset) {
        await assetsApi.update(editingAsset.asset_id, formData);
      } else {
        await assetsApi.create(formData);
      }
      handleCloseDialog();
      fetchAssets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet asset?')) {
      try {
        await assetsApi.delete(id);
        fetchAssets();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...assets];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(asset => {
        const search = searchTerm.toLowerCase();
        return (
          asset.symbol?.toLowerCase().includes(search) ||
          asset.name?.toLowerCase().includes(search) ||
          asset.exchange?.toLowerCase().includes(search) ||
          asset.sector?.toLowerCase().includes(search)
        );
      });
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter(asset => asset.asset_type === filterType);
    }

    // Status filter
    if (filterStatus !== '') {
      filtered = filtered.filter(asset => asset.is_active === (filterStatus === 'true'));
    }

    // Sector filter
    if (filterSector) {
      filtered = filtered.filter(asset => asset.sector === filterSector);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAssets(filtered);
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

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedAssets.map(asset => asset.asset_id);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(item => item !== id);
    }

    setSelected(newSelected);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selected.length} assets?`)) {
      try {
        await Promise.all(selected.map(id => assetsApi.delete(id)));
        setSelected([]);
        fetchAssets();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Symbole', 'Nom', 'Type', 'Exchange', 'Secteur', 'Industrie', 'Market Cap', 'Statut'];
    const csvData = filteredAssets.map(asset => [
      asset.symbol,
      asset.name,
      asset.asset_type,
      asset.exchange || '',
      asset.sector || '',
      asset.industry || '',
      asset.market_cap || '',
      asset.is_active ? 'Actif' : 'Inactif'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assets-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getStats = () => {
    return {
      total: filteredAssets.length,
      active: filteredAssets.filter(a => a.is_active).length,
      inactive: filteredAssets.filter(a => !a.is_active).length,
      types: [...new Set(filteredAssets.map(a => a.asset_type))].length
    };
  };

  const getUniqueSectors = () => {
    return [...new Set(assets.map(a => a.sector).filter(Boolean))];
  };

  const stats = getStats();
  const paginatedAssets = filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                Actifs
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Inactifs
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.inactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Types
              </Typography>
              <Typography variant="h4">{stats.types}</Typography>
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
              placeholder="Rechercher assets..."
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                <MenuItem value="">Tous</MenuItem>
                {ASSET_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Secteur</InputLabel>
              <Select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                label="Secteur"
              >
                <MenuItem value="">Tous</MenuItem>
                {getUniqueSectors().map((sector) => (
                  <MenuItem key={sector} value={sector}>{sector}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Statut"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="true">Actif</MenuItem>
                <MenuItem value="false">Inactif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {selected.length > 0 && (
                <Tooltip title="Supprimer la sélection">
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleBulkDelete}
                  >
                    ({selected.length})
                  </Button>
                </Tooltip>
              )}
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchAssets}
              >
                Refresh
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={filteredAssets.length === 0}
              >
                CSV
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
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < paginatedAssets.length}
                  checked={paginatedAssets.length > 0 && selected.length === paginatedAssets.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'symbol'}
                  direction={orderBy === 'symbol' ? order : 'asc'}
                  onClick={() => handleSort('symbol')}
                >
                  <strong>Symbole</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  <strong>Nom</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'asset_type'}
                  direction={orderBy === 'asset_type' ? order : 'asc'}
                  onClick={() => handleSort('asset_type')}
                >
                  <strong>Type</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Exchange</strong></TableCell>
              <TableCell><strong>Secteur</strong></TableCell>
              <TableCell><strong>Statut</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Chargement...</TableCell>
              </TableRow>
            ) : filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Aucun asset trouvé</TableCell>
              </TableRow>
            ) : (
              paginatedAssets.map((asset) => (
                <TableRow 
                  key={asset.asset_id} 
                  hover
                  selected={selected.indexOf(asset.asset_id) !== -1}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.indexOf(asset.asset_id) !== -1}
                      onChange={() => handleSelect(asset.asset_id)}
                    />
                  </TableCell>
                  <TableCell><strong>{asset.symbol}</strong></TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>
                    <Chip label={asset.asset_type} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{asset.exchange || '-'}</TableCell>
                  <TableCell>{asset.sector || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={asset.is_active ? 'Actif' : 'Inactif'}
                      size="small"
                      color={asset.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(asset)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(asset.asset_id)}
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
        count={filteredAssets.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        labelRowsPerPage="Lignes par page:"
      />

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAsset ? 'Modifier Asset' : 'Nouvel Asset'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Symbole"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Nom"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              select
              label="Type d'Asset"
              value={formData.asset_type}
              onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
              required
              fullWidth
            >
              {ASSET_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Exchange"
              value={formData.exchange}
              onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
              fullWidth
            />
            <TextField
              label="Secteur"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              fullWidth
            />
            <TextField
              label="Industrie"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              fullWidth
            />
            <TextField
              label="Market Cap"
              type="number"
              value={formData.market_cap}
              onChange={(e) => setFormData({ ...formData, market_cap: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              select
              label="Statut"
              value={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              fullWidth
            >
              <MenuItem value="true">Actif</MenuItem>
              <MenuItem value="false">Inactif</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAsset ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
