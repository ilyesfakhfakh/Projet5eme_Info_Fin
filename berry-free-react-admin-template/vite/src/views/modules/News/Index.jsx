import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab
} from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import NewsArticlesTab from './NewsArticlesTab';
import EconomicEventsTab from './EconomicEventsTab';
import MarketNewsTab from './MarketNewsTab';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function NewsPage() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <MainCard title="News Management">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleChange}>
          <Tab label="News Articles" />
          <Tab label="Economic Events" />
          <Tab label="Market News" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <NewsArticlesTab />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <EconomicEventsTab />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <MarketNewsTab />
      </TabPanel>
    </MainCard>
  );
}
