import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import AssetsTab from './AssetsTab';
import MarketDataTab from './MarketDataTab';
import HistoricalDataTab from './HistoricalDataTab';
import RealtimeQuotesTab from './RealtimeQuotesTab';
import PriceAlertsTab from './PriceAlertsTab';
import MarketChart from './MarketChart';
import { assetsApi, marketDataApi } from 'api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MarketPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [assets, setAssets] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchMarketData();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await assetsApi.getAll();
      setAssets(response || []);
      if (response && response.length > 0) {
        setSelectedAsset(response[0].asset_id);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  };

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await marketDataApi.getAll();
      setMarketData(response || []);
    } catch (err) {
      console.error('Error fetching market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.asset_id === assetId);
    return asset ? `${asset.symbol} - ${asset.name}` : 'Asset';
  };

  const filteredData = selectedAsset 
    ? marketData.filter(d => d.asset_id === selectedAsset)
    : marketData;

  return (
    <MainCard title="Market Management">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Assets" />
          <Tab label="Market Data" />
          <Tab label="Charts" />
          <Tab label="Historical Data" />
          <Tab label="Realtime Quotes" />
          <Tab label="Price Alerts" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <AssetsTab />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <MarketDataTab />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sélectionner un Asset</InputLabel>
              <Select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                label="Sélectionner un Asset"
              >
                {assets.map((asset) => (
                  <MenuItem key={asset.asset_id} value={asset.asset_id}>
                    {asset.symbol} - {asset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <MarketChart 
          data={filteredData} 
          assetName={getAssetName(selectedAsset)}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <HistoricalDataTab />
      </TabPanel>

      <TabPanel value={currentTab} index={4}>
        <RealtimeQuotesTab />
      </TabPanel>

      <TabPanel value={currentTab} index={5}>
        <PriceAlertsTab />
      </TabPanel>
    </MainCard>
  );
}
