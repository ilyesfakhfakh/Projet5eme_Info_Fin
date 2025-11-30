import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { gridSpacing } from 'store/constant';
import SimulationList from './SimulationList';
import SimulationDetail from './SimulationDetail';
import SimulationForm from './SimulationForm';
import BacktestForm from './BacktestForm';
import { getStrategyTemplates } from 'api/simulationService';

const SimulationPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for the current view mode
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'new', 'edit', 'backtest'
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [strategyTemplates, setStrategyTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parse URL to determine the current view
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const simulationId = pathParts[pathParts.length - 1];
    
    if (location.pathname.endsWith('/new')) {
      setViewMode('new');
    } else if (location.pathname.endsWith('/backtest')) {
      setViewMode('backtest');
    } else if (simulationId && simulationId !== 'simulation') {
      setViewMode('detail');
      setSelectedSimulation({ id: simulationId });
    } else {
      setViewMode('list');
      setSelectedSimulation(null);
    }
  }, [location.pathname]);
  
  // Fetch strategy templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const templates = await getStrategyTemplates();
        setStrategyTemplates(templates);
      } catch (error) {
        console.error('Error fetching strategy templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Navigation handlers
  const handleViewDetails = (simulation) => {
    navigate(`/free/modules/simulation/${simulation.id}`);
  };
  
  const handleEdit = (simulation) => {
    navigate(`/free/modules/simulation/${simulation.id}/edit`);
  };
  
  const handleRunBacktest = (simulation) => {
    navigate(`/free/modules/simulation/${simulation.id}/backtest`);
  };
  
  const handleCreateNew = () => {
    navigate('/free/modules/simulation/new');
  };
  
  const handleBackToList = () => {
    navigate('/free/modules/simulation');
  };
  
  // Render the appropriate view based on the current mode
  const renderView = () => {
    switch (viewMode) {
      case 'detail':
        return (
          <SimulationDetail 
            onBack={handleBackToList}
            onEdit={handleEdit}
            onRunBacktest={handleRunBacktest}
          />
        );
        
      case 'new':
        return (
          <SimulationForm
            strategyTemplates={strategyTemplates}
            onCancel={handleBackToList}
            onSubmitSuccess={(simulation) => {
              navigate(`/free/modules/simulation/${simulation.id}`);
            }}
          />
        );
        
      case 'edit':
        return (
          <SimulationForm
            simulation={selectedSimulation}
            strategyTemplates={strategyTemplates}
            onCancel={() => navigate(`/free/modules/simulation/${selectedSimulation?.id}`)}
            onSubmitSuccess={(updatedSimulation) => {
              navigate(`/free/modules/simulation/${updatedSimulation.id}`);
            }}
          />
        );
        
      case 'backtest':
        return (
          <BacktestForm
            simulation={selectedSimulation}
            onCancel={() => navigate(`/free/modules/simulation/${selectedSimulation?.id}`)}
            onSubmitSuccess={(results) => {
              // Navigate to the results or update the current view
              console.log('Backtest results:', results);
              navigate(`/free/modules/simulation/${selectedSimulation?.id}`);
            }}
          />
        );
        
      case 'list':
      default:
        return (
          <SimulationList
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onRun={handleRunBacktest}
            onCreateNew={handleCreateNew}
          />
        );
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth={false}>
        <Grid container spacing={gridSpacing}>
          <Grid item xs={12}>
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={3}
            >
              <Typography variant="h4">
                {viewMode === 'detail' && 'Simulation Details'}
                {viewMode === 'new' && 'New Simulation'}
                {viewMode === 'edit' && 'Edit Simulation'}
                {viewMode === 'backtest' && 'Run Backtest'}
                {viewMode === 'list' && 'Trading Simulations'}
              </Typography>
              
              {viewMode !== 'list' && (
                <Button 
                  variant="outlined" 
                  onClick={handleBackToList}
                  startIcon={<span>←</span>}
                >
                  Back to List
                </Button>
              )}
              
              {viewMode === 'list' && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleCreateNew}
                >
                  New Simulation
                </Button>
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              renderView()
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SimulationPage;
