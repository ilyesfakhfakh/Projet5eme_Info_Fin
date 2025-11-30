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
  Chip,
  Typography,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Notifications, 
  NotificationsActive,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { assetsApi, priceAlertsApi } from 'api';

const ALERT_TYPES = ['ABOVE', 'BELOW', 'PERCENTAGE_CHANGE'];

export default function PriceAlertsTab() {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [formData, setFormData] = useState({
    asset_id: '',
    alert_type: 'ABOVE',
    target_price: '',
    is_active: true,
    message: ''
  });

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, searchTerm, filterAsset, filterType, filterStatus, orderBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await priceAlertsApi.getAll();
      setAlerts(response || []);
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

  const handleOpenDialog = (alert = null) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        asset_id: alert.asset_id || '',
        alert_type: alert.alert_type || 'ABOVE',
        target_price: alert.target_price || '',
        is_active: alert.is_active !== undefined ? alert.is_active : true,
        message: alert.message || ''
      });
    } else {
      setEditingAlert(null);
      setFormData({
        asset_id: '',
        alert_type: 'ABOVE',
        target_price: '',
        is_active: true,
        message: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAlert(null);
  };

  const handleSubmit = async () => {
    try {
      // Récupérer l'utilisateur connecté depuis localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.user_id || user?.id;

      // Ajouter le user_id aux données
      const dataToSend = {
        ...formData,
        user_id: userId
      };

      if (editingAlert) {
        await priceAlertsApi.update(editingAlert.alert_id, dataToSend);
      } else {
        await priceAlertsApi.create(dataToSend);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte?')) {
      try {
        await priceAlertsApi.delete(id);
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

  const getAlertTypeLabel = (type) => {
    const labels = {
      'ABOVE': 'Au-dessus',
      'BELOW': 'En-dessous',
      'PERCENTAGE_CHANGE': 'Changement %'
    };
    return labels[type] || type;
  };

  const getStatusColor = (alert) => {
    if (alert.is_triggered) return 'warning';
    if (alert.is_active) return 'success';
    return 'default';
  };

  const getStatusLabel = (alert) => {
    if (alert.is_triggered) return 'Déclenché';
    if (alert.is_active) return 'Actif';
    return 'Inactif';
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(alert => {
        const search = searchTerm.toLowerCase();
        return (
          getAssetName(alert.asset_id).toLowerCase().includes(search) ||
          alert.message?.toLowerCase().includes(search)
        );
      });
    }

    // Asset filter
    if (filterAsset) {
      filtered = filtered.filter(alert => alert.asset_id === filterAsset);
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter(alert => alert.alert_type === filterType);
    }

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(alert => alert.is_active && !alert.is_triggered);
    } else if (filterStatus === 'triggered') {
      filtered = filtered.filter(alert => alert.is_triggered);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(alert => !alert.is_active);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'created_at') {
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

    setFilteredAlerts(filtered);
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

  const handleToggleActive = async (alert) => {
    try {
      await priceAlertsApi.update(alert.alert_id, {
        ...alert,
        is_active: !alert.is_active
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Asset', 'Type', 'Prix Cible', 'Statut', 'Message', 'Date Création'];
    const csvData = filteredAlerts.map(alert => [
      getAssetName(alert.asset_id),
      getAlertTypeLabel(alert.alert_type),
      alert.target_price,
      getStatusLabel(alert),
      `"${alert.message || ''}"`,
      new Date(alert.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `price-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getStats = () => {
    return {
      total: filteredAlerts.length,
      active: filteredAlerts.filter(a => a.is_active && !a.is_triggered).length,
      triggered: filteredAlerts.filter(a => a.is_triggered).length,
      inactive: filteredAlerts.filter(a => !a.is_active).length
    };
  };

  const stats = getStats();
  const paginatedAlerts = filteredAlerts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                Total Alertes
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Actives
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
                Déclenchées
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.triggered}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Inactives
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.inactive}
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
              placeholder="Rechercher alertes..."
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
              <InputLabel>Asset</InputLabel>
              <Select
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value)}
                label="Asset"
              >
                <MenuItem value="">Tous</MenuItem>
                {assets.map((asset) => (
                  <MenuItem key={asset.asset_id} value={asset.asset_id}>
                    {asset.symbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                {ALERT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{getAlertTypeLabel(type)}</MenuItem>
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
                <MenuItem value="active">Actif</MenuItem>
                <MenuItem value="triggered">Déclenché</MenuItem>
                <MenuItem value="inactive">Inactif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
              >
                Refresh
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={filteredAlerts.length === 0}
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
              <TableCell><strong>Asset</strong></TableCell>
              <TableCell><strong>Type d'Alerte</strong></TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'target_price'}
                  direction={orderBy === 'target_price' ? order : 'asc'}
                  onClick={() => handleSort('target_price')}
                >
                  <strong>Prix Cible</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Statut</strong></TableCell>
              <TableCell><strong>Message</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'created_at'}
                  direction={orderBy === 'created_at' ? order : 'asc'}
                  onClick={() => handleSort('created_at')}
                >
                  <strong>Date Création</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Chargement...</TableCell>
              </TableRow>
            ) : filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Aucune alerte trouvée</TableCell>
              </TableRow>
            ) : (
              paginatedAlerts.map((alert) => (
                <TableRow key={alert.alert_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {alert.status === 'ACTIVE' ? (
                        <NotificationsActive color="primary" fontSize="small" />
                      ) : (
                        <Notifications color="disabled" fontSize="small" />
                      )}
                      {getAssetName(alert.asset_id)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getAlertTypeLabel(alert.alert_type)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${formatNumber(alert.target_price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(alert)}
                      size="small"
                      color={getStatusColor(alert)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {alert.message || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      size="small"
                      checked={alert.is_active}
                      onChange={() => handleToggleActive(alert)}
                      color="primary"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(alert)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(alert.alert_id)}
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
        count={filteredAlerts.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Lignes par page:"
      />

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAlert ? 'Modifier Alerte' : 'Nouvelle Alerte'}
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
              select
              label="Type d'Alerte"
              value={formData.alert_type}
              onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
              required
              fullWidth
            >
              {ALERT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {getAlertTypeLabel(type)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Prix Cible"
              type="number"
              value={formData.target_price}
              onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
              required
              fullWidth
              inputProps={{ step: "0.01" }}
            />
            <TextField
              select
              label="Statut"
              value={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              required
              fullWidth
            >
              <MenuItem value="true">Actif</MenuItem>
              <MenuItem value="false">Inactif</MenuItem>
            </TextField>
            <TextField
              label="Message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Message optionnel pour l'alerte"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAlert ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
