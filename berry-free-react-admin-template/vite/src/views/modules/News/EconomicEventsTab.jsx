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
  Select
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Event, 
  TrendingUp, 
  TrendingDown,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { economicEventsApi } from 'api';

const IMPORTANCE_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

export default function EconomicEventsTab() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting
  const [orderBy, setOrderBy] = useState('scheduled_date');
  const [order, setOrder] = useState('desc');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterImportance, setFilterImportance] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    scheduled_date: new Date().toISOString().slice(0, 16),
    importance: 'MEDIUM',
    country: '',
    event_category: '',
    previous_value: '',
    forecast_value: '',
    actual_value: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, filterImportance, filterCountry, startDate, endDate, orderBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await economicEventsApi.getAll();
      console.log('Economic Events Response:', response);
      // L'API peut retourner différentes structures
      const eventsData = Array.isArray(response) ? response : (response?.events || response?.data || []);
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        event_name: event.event_name || '',
        description: event.description || '',
        scheduled_date: event.scheduled_date ? new Date(event.scheduled_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        importance: event.importance || 'MEDIUM',
        country: event.country || '',
        event_category: event.event_category || '',
        previous_value: event.previous_value || '',
        forecast_value: event.forecast_value || '',
        actual_value: event.actual_value || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({
        event_name: '',
        description: '',
        scheduled_date: new Date().toISOString().slice(0, 16),
        importance: 'MEDIUM',
        country: '',
        event_category: '',
        previous_value: '',
        forecast_value: '',
        actual_value: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEvent(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingEvent) {
        await economicEventsApi.update(editingEvent.event_id, formData);
      } else {
        await economicEventsApi.create(formData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement?')) {
      try {
        await economicEventsApi.delete(id);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getImportanceColor = (importance) => {
    const colors = {
      'LOW': 'default',
      'MEDIUM': 'warning',
      'HIGH': 'error'
    };
    return colors[importance] || 'default';
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '-';
    return Number(num).toFixed(2);
  };

  const getValueComparison = (actual, forecast) => {
    if (!actual || !forecast) return null;
    const diff = parseFloat(actual) - parseFloat(forecast);
    return {
      value: Math.abs(diff).toFixed(2),
      isPositive: diff >= 0
    };
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(event => {
        const search = searchTerm.toLowerCase();
        return (
          event.event_name?.toLowerCase().includes(search) ||
          event.description?.toLowerCase().includes(search) ||
          event.event_category?.toLowerCase().includes(search) ||
          event.country?.toLowerCase().includes(search)
        );
      });
    }

    // Importance filter
    if (filterImportance) {
      filtered = filtered.filter(event => event.importance === filterImportance);
    }

    // Country filter
    if (filterCountry) {
      filtered = filtered.filter(event => event.country === filterCountry);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(event => new Date(event.scheduled_date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(event => new Date(event.scheduled_date) <= new Date(endDate));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'scheduled_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
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

    setFilteredEvents(filtered);
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
    const headers = ['Événement', 'Date', 'Importance', 'Pays', 'Catégorie', 'Précédent', 'Prévision', 'Actuel'];
    const csvData = filteredEvents.map(event => [
      `"${event.event_name || ''}"`,
      new Date(event.scheduled_date).toLocaleString(),
      event.importance,
      event.country || '',
      event.event_category || '',
      event.previous_value || '',
      event.forecast_value || '',
      event.actual_value || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `economic-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getUniqueCountries = () => {
    return [...new Set(events.map(e => e.country).filter(Boolean))];
  };

  const getStats = () => {
    return {
      total: filteredEvents.length,
      low: filteredEvents.filter(e => e.importance === 'LOW').length,
      medium: filteredEvents.filter(e => e.importance === 'MEDIUM').length,
      high: filteredEvents.filter(e => e.importance === 'HIGH').length
    };
  };

  const stats = getStats();
  const paginatedEvents = filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                Total Événements
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Faible
              </Typography>
              <Typography variant="h4">{stats.low}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Moyenne
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.medium}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Haute
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.high}
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
              placeholder="Rechercher événements..."
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
              <InputLabel>Importance</InputLabel>
              <Select
                value={filterImportance}
                onChange={(e) => setFilterImportance(e.target.value)}
                label="Importance"
              >
                <MenuItem value="">Toutes</MenuItem>
                {IMPORTANCE_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Pays</InputLabel>
              <Select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                label="Pays"
              >
                <MenuItem value="">Tous</MenuItem>
                {getUniqueCountries().map((country) => (
                  <MenuItem key={country} value={country}>{country}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
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
                disabled={filteredEvents.length === 0}
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
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'event_name'}
                  direction={orderBy === 'event_name' ? order : 'asc'}
                  onClick={() => handleSort('event_name')}
                >
                  <strong>Événement</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'scheduled_date'}
                  direction={orderBy === 'scheduled_date' ? order : 'asc'}
                  onClick={() => handleSort('scheduled_date')}
                >
                  <strong>Date</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'importance'}
                  direction={orderBy === 'importance' ? order : 'asc'}
                  onClick={() => handleSort('importance')}
                >
                  <strong>Importance</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Pays</strong></TableCell>
              <TableCell><strong>Catégorie</strong></TableCell>
              <TableCell align="right"><strong>Précédent</strong></TableCell>
              <TableCell align="right"><strong>Prévision</strong></TableCell>
              <TableCell align="right"><strong>Actuel</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Chargement...</TableCell>
              </TableRow>
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Aucun événement trouvé</TableCell>
              </TableRow>
            ) : (
              paginatedEvents.map((event) => {
                const comparison = getValueComparison(event.actual_value, event.forecast_value);
                return (
                  <TableRow key={event.event_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Event fontSize="small" color="action" />
                        <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                          {event.event_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {event.scheduled_date ? new Date(event.scheduled_date).toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.importance}
                        size="small"
                        color={getImportanceColor(event.importance)}
                      />
                    </TableCell>
                    <TableCell>{event.country || '-'}</TableCell>
                    <TableCell>{event.event_category || '-'}</TableCell>
                    <TableCell align="right">{formatNumber(event.previous_value)}</TableCell>
                    <TableCell align="right">{formatNumber(event.forecast_value)}</TableCell>
                    <TableCell align="right">
                      {event.actual_value ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {formatNumber(event.actual_value)}
                          </Typography>
                          {comparison && (
                            comparison.isPositive ? (
                              <TrendingUp color="success" fontSize="small" />
                            ) : (
                              <TrendingDown color="error" fontSize="small" />
                            )
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(event)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(event.event_id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredEvents.length}
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
          {editingEvent ? 'Modifier Événement' : 'Nouvel Événement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Nom de l'Événement"
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              required
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
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                label="Date Prévue"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Importance"
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                required
                fullWidth
              >
                {IMPORTANCE_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Pays"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label="Catégorie"
              value={formData.event_category}
              onChange={(e) => setFormData({ ...formData, event_category: e.target.value })}
              fullWidth
              placeholder="ex: GDP, Unemployment, Interest Rate"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                label="Valeur Précédente"
                type="number"
                value={formData.previous_value}
                onChange={(e) => setFormData({ ...formData, previous_value: e.target.value })}
                fullWidth
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label="Prévision"
                type="number"
                value={formData.forecast_value}
                onChange={(e) => setFormData({ ...formData, forecast_value: e.target.value })}
                fullWidth
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label="Valeur Actuelle"
                type="number"
                value={formData.actual_value}
                onChange={(e) => setFormData({ ...formData, actual_value: e.target.value })}
                fullWidth
                inputProps={{ step: "0.01" }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEvent ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
