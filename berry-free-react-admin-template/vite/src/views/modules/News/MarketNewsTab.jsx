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
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Newspaper, 
  PriorityHigh,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { marketNewsApi } from 'api';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function MarketNewsTab() {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  
  // Preview dialog
  const [previewNews, setPreviewNews] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting
  const [orderBy, setOrderBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  const [formData, setFormData] = useState({
    headline: '',
    content: '',
    timestamp: new Date().toISOString().slice(0, 16),
    priority: 'LOW',
    tags: []
  });
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [news, searchTerm, filterPriority, orderBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await marketNewsApi.getAll();
      console.log('Market News Response:', response);
      // L'API peut retourner différentes structures
      const newsData = Array.isArray(response) ? response : (response?.news || response?.data || []);
      setNews(newsData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (newsItem = null) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setFormData({
        headline: newsItem.headline || '',
        content: newsItem.content || '',
        timestamp: newsItem.timestamp ? new Date(newsItem.timestamp).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        priority: newsItem.priority || 'LOW',
        tags: newsItem.tags || []
      });
      setTagsInput(Array.isArray(newsItem.tags) ? newsItem.tags.join(', ') : '');
    } else {
      setEditingNews(null);
      setFormData({
        headline: '',
        content: '',
        timestamp: new Date().toISOString().slice(0, 16),
        priority: 'LOW',
        tags: []
      });
      setTagsInput('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNews(null);
    setTagsInput('');
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        tags: tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      if (editingNews) {
        await marketNewsApi.update(editingNews.news_id, submitData);
      } else {
        await marketNewsApi.create(submitData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette news?')) {
      try {
        await marketNewsApi.delete(id);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'default',
      'MEDIUM': 'info',
      'HIGH': 'warning',
      'URGENT': 'error'
    };
    return colors[priority] || 'default';
  };

  const applyFilters = () => {
    let filtered = [...news];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(newsItem => {
        const search = searchTerm.toLowerCase();
        return (
          newsItem.headline?.toLowerCase().includes(search) ||
          newsItem.content?.toLowerCase().includes(search) ||
          (Array.isArray(newsItem.tags) && newsItem.tags.some(tag => tag.toLowerCase().includes(search)))
        );
      });
    }

    // Priority filter
    if (filterPriority) {
      filtered = filtered.filter(newsItem => newsItem.priority === filterPriority);
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

    setFilteredNews(filtered);
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

  const handlePreview = (newsItem) => {
    setPreviewNews(newsItem);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setPreviewNews(null);
  };

  const handleExportCSV = () => {
    const headers = ['Headline', 'Priorité', 'Tags', 'Date'];
    const csvData = filteredNews.map(newsItem => [
      `"${newsItem.headline?.replace(/"/g, '""') || ''}"`,
      newsItem.priority,
      Array.isArray(newsItem.tags) ? newsItem.tags.join(';') : '',
      new Date(newsItem.timestamp).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `market-news-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getStats = () => {
    return {
      total: filteredNews.length,
      low: filteredNews.filter(n => n.priority === 'LOW').length,
      medium: filteredNews.filter(n => n.priority === 'MEDIUM').length,
      high: filteredNews.filter(n => n.priority === 'HIGH').length,
      urgent: filteredNews.filter(n => n.priority === 'URGENT').length
    };
  };

  const stats = getStats();
  const paginatedNews = filteredNews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total News
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Low
              </Typography>
              <Typography variant="h4">{stats.low}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Medium
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.medium}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                High
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.high}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Urgent
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.urgent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher news..."
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
              <InputLabel>Priorité</InputLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                label="Priorité"
              >
                <MenuItem value="">Toutes</MenuItem>
                {PRIORITIES.map((priority) => (
                  <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                ))}
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
                disabled={filteredNews.length === 0}
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
                  active={orderBy === 'headline'}
                  direction={orderBy === 'headline' ? order : 'asc'}
                  onClick={() => handleSort('headline')}
                >
                  <strong>Headline</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'priority'}
                  direction={orderBy === 'priority' ? order : 'asc'}
                  onClick={() => handleSort('priority')}
                >
                  <strong>Priorité</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Tags</strong></TableCell>
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
                <TableCell colSpan={5} align="center">Chargement...</TableCell>
              </TableRow>
            ) : filteredNews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Aucune news trouvée</TableCell>
              </TableRow>
            ) : (
              paginatedNews.map((newsItem) => (
                <TableRow key={newsItem.news_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {newsItem.priority === 'URGENT' ? (
                        <PriorityHigh color="error" fontSize="small" />
                      ) : (
                        <Newspaper color="action" fontSize="small" />
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 400 }}>
                          {newsItem.headline}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
                          {newsItem.content}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={newsItem.priority}
                      size="small"
                      color={getPriorityColor(newsItem.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                      {Array.isArray(newsItem.tags) && newsItem.tags.length > 0 ? (
                        newsItem.tags.slice(0, 3).map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                      {Array.isArray(newsItem.tags) && newsItem.tags.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{newsItem.tags.length - 3}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {newsItem.timestamp ? new Date(newsItem.timestamp).toLocaleString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(newsItem)}
                      color="info"
                      title="Aperçu"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(newsItem)}
                      color="primary"
                      title="Modifier"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(newsItem.news_id)}
                      color="error"
                      title="Supprimer"
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
        count={filteredNews.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Lignes par page:"
      />

      {/* Preview Dialog */}
      <Dialog open={openPreview} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Aperçu de la News</Typography>
            <IconButton onClick={handleClosePreview} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {previewNews && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {previewNews.headline}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip 
                    label={previewNews.priority}
                    size="small"
                    color={getPriorityColor(previewNews.priority)}
                  />
                  {previewNews.priority === 'URGENT' && (
                    <Chip 
                      label="URGENT"
                      size="small"
                      color="error"
                      icon={<PriorityHigh />}
                    />
                  )}
                </Box>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  Publié le: {previewNews.timestamp ? new Date(previewNews.timestamp).toLocaleString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Contenu
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewNews.content || 'Aucun contenu disponible'}
                </Typography>
              </Box>

              {Array.isArray(previewNews.tags) && previewNews.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {previewNews.tags.map((tag, idx) => (
                      <Chip key={idx} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            handleClosePreview();
            handleOpenDialog(previewNews);
          }} startIcon={<EditIcon />}>
            Modifier
          </Button>
          <Button onClick={handleClosePreview} variant="contained">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNews ? 'Modifier News' : 'Nouvelle News'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Headline"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Contenu"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              multiline
              rows={4}
              fullWidth
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Priorité"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
                fullWidth
              >
                {PRIORITIES.map((priority) => (
                  <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Date et Heure"
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label="Tags (séparés par des virgules)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              fullWidth
              placeholder="ex: trading, forex, analysis"
              helperText="Séparez les tags par des virgules"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNews ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
