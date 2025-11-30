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
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, TrendingUp, TrendingDown } from '@mui/icons-material';
import { assetsApi, realtimeQuotesApi } from 'api';

export default function RealtimeQuotesTab() {
  const [quotes, setQuotes] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [formData, setFormData] = useState({
    asset_id: '',
    bid_price: '',
    ask_price: '',
    last_price: '',
    volume: '',
    timestamp: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await realtimeQuotesApi.getAll();
      setQuotes(response || []);
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

  const handleOpenDialog = (quote = null) => {
    if (quote) {
      setEditingQuote(quote);
      setFormData({
        asset_id: quote.asset_id || '',
        bid_price: quote.bid_price || '',
        ask_price: quote.ask_price || '',
        last_price: quote.last_price || '',
        volume: quote.volume || '',
        timestamp: quote.timestamp ? new Date(quote.timestamp).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
      });
    } else {
      setEditingQuote(null);
      setFormData({
        asset_id: '',
        bid_price: '',
        ask_price: '',
        last_price: '',
        volume: '',
        timestamp: new Date().toISOString().slice(0, 16)
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuote(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingQuote) {
        await realtimeQuotesApi.update(editingQuote.quote_id, formData);
      } else {
        await realtimeQuotesApi.create(formData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quote?')) {
      try {
        await realtimeQuotesApi.delete(id);
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
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(num);
  };

  const getSpread = (bid, ask) => {
    if (!bid || !ask) return '-';
    const spread = (ask - bid).toFixed(6);
    return `$${spread}`;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Quote
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Asset</strong></TableCell>
              <TableCell align="right"><strong>Bid</strong></TableCell>
              <TableCell align="right"><strong>Ask</strong></TableCell>
              <TableCell align="right"><strong>Spread</strong></TableCell>
              <TableCell align="right"><strong>Last Price</strong></TableCell>
              <TableCell align="right"><strong>Volume</strong></TableCell>
              <TableCell><strong>Timestamp</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Chargement...</TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Aucun quote trouvé</TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.quote_id} hover>
                  <TableCell>{getAssetName(quote.asset_id)}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`$${formatNumber(quote.bid_price)}`}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`$${formatNumber(quote.ask_price)}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {getSpread(quote.bid_price, quote.ask_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${formatNumber(quote.last_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatNumber(quote.volume)}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {quote.timestamp ? new Date(quote.timestamp).toLocaleString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(quote)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(quote.quote_id)}
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

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuote ? 'Modifier Quote' : 'Nouveau Quote'}
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
                label="Prix Bid (Achat)"
                type="number"
                value={formData.bid_price}
                onChange={(e) => setFormData({ ...formData, bid_price: e.target.value })}
                required
                fullWidth
                inputProps={{ step: "0.000001" }}
              />
              <TextField
                label="Prix Ask (Vente)"
                type="number"
                value={formData.ask_price}
                onChange={(e) => setFormData({ ...formData, ask_price: e.target.value })}
                required
                fullWidth
                inputProps={{ step: "0.000001" }}
              />
            </Box>
            <TextField
              label="Dernier Prix"
              type="number"
              value={formData.last_price}
              onChange={(e) => setFormData({ ...formData, last_price: e.target.value })}
              required
              fullWidth
              inputProps={{ step: "0.000001" }}
            />
            <TextField
              label="Volume"
              type="number"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              fullWidth
            />
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
            {editingQuote ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
