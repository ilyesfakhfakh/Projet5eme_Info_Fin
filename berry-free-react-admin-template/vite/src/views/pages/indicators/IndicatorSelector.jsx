import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  InputAdornment, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Chip,
  useTheme,
  Paper,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { 
  Search as SearchIcon,
  ShowChart as ChartIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendDownIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getAvailableIndicators } from 'api/indicatorsService';

const categoryIcons = {
  'Trend': <TrendingUpIcon />,
  'Momentum': <SpeedIcon />,
  'Volatility': <TimelineIcon />,
  'Volume': <TimelineIcon />,
  'Other': <ChartIcon />
};

const IndicatorSelector = ({ indicators, onAddIndicator }) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIndicators, setFilteredIndicators] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Group indicators by category
  useEffect(() => {
    if (!indicators || indicators.length === 0) return;
    
    // Extract unique categories
    const uniqueCategories = [...new Set(indicators.map(ind => ind.category))];
    setCategories(['all', ...uniqueCategories]);
    
    // Filter indicators based on search term and active tab
    const filtered = indicators.filter(indicator => {
      const matchesSearch = 
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        activeTab === 'all' || 
        indicator.category === activeTab;
      
      return matchesSearch && matchesCategory;
    });
    
    setFilteredIndicators(filtered);
    setLoading(false);
  }, [indicators, searchTerm, activeTab]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddClick = (indicator) => {
    onAddIndicator(indicator);
  };

  const getIndicatorIcon = (category) => {
    return categoryIcons[category] || <ChartIcon />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add Indicator
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search indicators..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Paper square sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="indicator categories"
          >
            {categories.map((category) => (
              <Tab 
                key={category}
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                value={category}
                icon={category !== 'all' ? getIndicatorIcon(category) : <ChartIcon />}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            ))}
          </Tabs>
        </Paper>
        
        <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          {filteredIndicators.length > 0 ? (
            <List dense disablePadding>
              {filteredIndicators.map((indicator) => (
                <React.Fragment key={indicator.id}>
                  <ListItem 
                    disablePadding 
                    secondaryAction={
                      <Chip 
                        label="Add" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        onClick={() => handleAddClick(indicator)}
                        icon={<AddIcon />}
                        clickable
                      />
                    }
                  >
                    <ListItemButton onClick={() => handleAddClick(indicator)}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getIndicatorIcon(indicator.category)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={indicator.name}
                        secondary={
                          <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {indicator.description}
                          </Typography>
                        }
                        primaryTypographyProps={{
                          variant: 'subtitle2',
                          color: 'text.primary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box textAlign="center" p={2}>
              <Typography variant="body2" color="textSecondary">
                No indicators found. Try a different search term.
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default IndicatorSelector;
