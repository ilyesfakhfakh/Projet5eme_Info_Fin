import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import IndicatorChart from '../../../components/indicators/IndicatorChart';
import IndicatorSelector from '../../../components/indicators/IndicatorSelector';
import { getAvailableIndicators } from 'api/indicatorsService';
const Indicators = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [indicators, setIndicators] = useState([]);
  const [activeIndicators, setActiveIndicators] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available indicators on component mount
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true);
        const data = await getAvailableIndicators();
        setIndicators(data);
        
        // Initialize with the first indicator by default
        if (data.length > 0) {
          setActiveIndicators([{
            ...data[0],
            id: `indicator-${Date.now()}`,
            parameters: data[0].parameters.reduce((acc, param) => ({
              ...acc,
              [param.name]: param.default
            }), {}),
            symbol: 'BTC/USD',
            timeframe: '1h',
            color: '#1976d2',
            visible: true
          }]);
        }
      } catch (err) {
        console.error('Failed to load indicators:', err);
        setError('Failed to load indicators. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleAddIndicator = (indicator) => {
    const newIndicator = {
      ...indicator,
      id: `indicator-${Date.now()}`,
      parameters: indicator.parameters.reduce((acc, param) => ({
        ...acc,
        [param.name]: param.default
      }), {}),
      symbol: 'BTC/USD',
      timeframe: '1h',
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      visible: true
    };
    
    setActiveIndicators([...activeIndicators, newIndicator]);
    setSelectedTab(activeIndicators.length); // Switch to the new tab
  };

  const handleUpdateIndicator = (id, updates) => {
    setActiveIndicators(activeIndicators.map(ind => 
      ind.id === id ? { ...ind, ...updates } : ind
    ));
  };

  const handleRemoveIndicator = (id) => {
    const newIndicators = activeIndicators.filter(ind => ind.id !== id);
    setActiveIndicators(newIndicators);
    
    // Adjust selected tab if needed
    if (selectedTab >= newIndicators.length && newIndicators.length > 0) {
      setSelectedTab(newIndicators.length - 1);
    } else if (newIndicators.length === 0) {
      setSelectedTab(0);
    }
  };

  if (loading) {
    return (
      <MainCard title="Technical Indicators">
        <Box display="flex" justifyContent="center" p={3}>
          <Typography>Loading indicators...</Typography>
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Technical Indicators">
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="error">{error}</Typography>
        </Box>
      </MainCard>
    );
  }

  return (
    <Grid container spacing={gridSpacing}>
      <Grid item xs={12} md={3} lg={2}>
        <IndicatorSelector 
          indicators={indicators} 
          onAddIndicator={handleAddIndicator} 
        />
      </Grid>
      
      <Grid item xs={12} md={9} lg={10}>
        <MainCard title="Technical Analysis Dashboard">
          {activeIndicators.length > 0 ? (
            <React.Fragment>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                {activeIndicators.map((indicator, index) => (
                  <span 
                    key={indicator.id}
                    onClick={() => setSelectedTab(index)}
                    style={{
                      padding: '10px 16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      borderBottom: selectedTab === index ? '2px solid #1976d2' : 'none',
                      color: selectedTab === index ? '#1976d2' : 'inherit',
                      fontWeight: selectedTab === index ? 'bold' : 'normal',
                      display: 'inline-block'
                    }}
                  >
                    {indicator.name} {index + 1}
                  </span>
                ))}
              </Box>
              
              {activeIndicators.map((indicator, index) => (
                <div
                  key={indicator.id}
                  hidden={selectedTab !== index}
                  id={`indicator-tabpanel-${index}`}
                  aria-labelledby={`indicator-tab-${index}`}
                >
                  <Box mt={2}>
                    <IndicatorChart
                      indicator={indicator}
                      onUpdate={(updates) => handleUpdateIndicator(indicator.id, updates)}
                      onRemove={() => handleRemoveIndicator(indicator.id)}
                    />
                  </Box>
                </div>
              ))}
            </React.Fragment>
          ) : (
            <Box p={3} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                No indicators added. Select an indicator from the sidebar to get started.
              </Typography>
            </Box>
          )}
        </MainCard>
      </Grid>
    </Grid>
  );
};

export default Indicators;
