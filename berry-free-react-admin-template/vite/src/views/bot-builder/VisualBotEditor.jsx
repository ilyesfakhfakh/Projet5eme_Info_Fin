import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Paper,
  Button,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  TrendingUp,
  ShoppingCart,
  Calculate,
  CompareArrows,
  Close,
  Add
} from '@mui/icons-material';

// Custom Node Components
const TriggerNode = ({ data }) => {
  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        minWidth: 200,
        boxShadow: 3,
        border: '2px solid #667eea'
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        TRIGGER
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {data.label}
      </Typography>
      <Chip
        label={`${data.condition} ${data.operator} ${data.value}`}
        size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
      />
    </Box>
  );
};

const ActionNode = ({ data }) => {
  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        minWidth: 200,
        boxShadow: 3,
        border: '2px solid #f093fb'
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        ACTION
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {data.label}
      </Typography>
      <Chip
        label={`${data.type} ${data.quantity}% ${data.symbol}`}
        size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
      />
    </Box>
  );
};

const ConditionNode = ({ data }) => {
  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: '#333',
        minWidth: 200,
        boxShadow: 3,
        border: '2px solid #fa709a'
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        CONDITION
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {data.label}
      </Typography>
      <Chip
        label={data.operator || 'AND'}
        size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}
      />
    </Box>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

const VisualBotEditor = ({ initialConfig, onSave }) => {
  const [nodes, setNodes] = useState(initialConfig?.nodes || []);
  const [edges, setEdges] = useState(initialConfig?.edges || []);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('trigger');
  const [nodeData, setNodeData] = useState({
    label: '',
    condition: 'price',
    operator: '>',
    value: 0,
    type: 'BUY',
    quantity: 10,
    symbol: 'BTC'
  });
  
  const reactFlowWrapper = useRef(null);
  const idCounter = useRef(nodes.length + 1);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#667eea', strokeWidth: 2 } }, eds)),
    []
  );

  const addNode = (type) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const createNode = () => {
    const id = `${dialogType}-${idCounter.current}`;
    idCounter.current += 1;

    let newNode = {
      id,
      type: dialogType,
      position: { x: 250, y: nodes.length * 100 },
      data: {}
    };

    if (dialogType === 'trigger') {
      newNode.data = {
        label: nodeData.label || `Trigger ${id}`,
        condition: nodeData.condition,
        operator: nodeData.operator,
        value: nodeData.value
      };
    } else if (dialogType === 'action') {
      newNode.data = {
        label: nodeData.label || `Action ${id}`,
        type: nodeData.type,
        quantity: nodeData.quantity,
        symbol: nodeData.symbol
      };
    } else if (dialogType === 'condition') {
      newNode.data = {
        label: nodeData.label || `Condition ${id}`,
        operator: nodeData.operator
      };
    }

    setNodes((nds) => [...nds, newNode]);
    setDialogOpen(false);
    
    // Reset form
    setNodeData({
      label: '',
      condition: 'price',
      operator: '>',
      value: 0,
      type: 'BUY',
      quantity: 10,
      symbol: 'BTC'
    });
  };

  const handleSave = () => {
    onSave({ nodes, edges });
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%'
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Components</Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            TRIGGERS
          </Typography>
          <List dense>
            <ListItem disablePadding>
              <ListItemButton onClick={() => addNode('trigger')}>
                <ListItemIcon>
                  <PlayArrow sx={{ color: '#667eea' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Price Trigger"
                  secondary="When price reaches..."
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => addNode('trigger')}>
                <ListItemIcon>
                  <TrendingUp sx={{ color: '#667eea' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Indicator Trigger"
                  secondary="RSI, MACD, etc."
                />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            ACTIONS
          </Typography>
          <List dense>
            <ListItem disablePadding>
              <ListItemButton onClick={() => addNode('action')}>
                <ListItemIcon>
                  <ShoppingCart sx={{ color: '#f093fb' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Buy Action"
                  secondary="Purchase asset"
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => addNode('action')}>
                <ListItemIcon>
                  <Stop sx={{ color: '#f093fb' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Sell Action"
                  secondary="Sell asset"
                />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            LOGIC
          </Typography>
          <List dense>
            <ListItem disablePadding>
              <ListItemButton onClick={() => addNode('condition')}>
                <ListItemIcon>
                  <CompareArrows sx={{ color: '#fa709a' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Condition"
                  secondary="AND / OR logic"
                />
              </ListItemButton>
            </ListItem>
          </List>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSave}
              startIcon={<Add />}
            >
              Save Configuration
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Canvas */}
      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        {!drawerOpen && (
          <Button
            variant="contained"
            size="small"
            onClick={() => setDrawerOpen(true)}
            sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}
          >
            Components
          </Button>
        )}
        
        <ReactFlow
          ref={reactFlowWrapper}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: '#f5f5f5' }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger':
                  return '#667eea';
                case 'action':
                  return '#f093fb';
                case 'condition':
                  return '#fa709a';
                default:
                  return '#eee';
              }
            }}
          />
        </ReactFlow>
      </Box>

      {/* Add Node Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Label"
              value={nodeData.label}
              onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
              fullWidth
            />
            
            {dialogType === 'trigger' && (
              <>
                <TextField
                  select
                  label="Condition"
                  value={nodeData.condition}
                  onChange={(e) => setNodeData({ ...nodeData, condition: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="volume">Volume</MenuItem>
                  <MenuItem value="rsi">RSI</MenuItem>
                  <MenuItem value="macd">MACD</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Operator"
                  value={nodeData.operator}
                  onChange={(e) => setNodeData({ ...nodeData, operator: e.target.value })}
                  fullWidth
                >
                  <MenuItem value=">">Greater than (&gt;)</MenuItem>
                  <MenuItem value="<">Less than (&lt;)</MenuItem>
                  <MenuItem value=">=">Greater or equal (&gt;=)</MenuItem>
                  <MenuItem value="<=">Less or equal (&lt;=)</MenuItem>
                  <MenuItem value="==">Equal (==)</MenuItem>
                </TextField>
                <TextField
                  label="Value"
                  type="number"
                  value={nodeData.value}
                  onChange={(e) => setNodeData({ ...nodeData, value: parseFloat(e.target.value) || 0 })}
                  fullWidth
                />
              </>
            )}

            {dialogType === 'action' && (
              <>
                <TextField
                  select
                  label="Action Type"
                  value={nodeData.type}
                  onChange={(e) => setNodeData({ ...nodeData, type: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="BUY">Buy</MenuItem>
                  <MenuItem value="SELL">Sell</MenuItem>
                </TextField>
                <TextField
                  label="Quantity (%)"
                  type="number"
                  value={nodeData.quantity}
                  onChange={(e) => setNodeData({ ...nodeData, quantity: parseFloat(e.target.value) || 0 })}
                  fullWidth
                  helperText="Percentage of capital to use"
                />
                <TextField
                  label="Symbol"
                  value={nodeData.symbol}
                  onChange={(e) => setNodeData({ ...nodeData, symbol: e.target.value })}
                  fullWidth
                  placeholder="BTC, ETH, etc."
                />
              </>
            )}

            {dialogType === 'condition' && (
              <TextField
                select
                label="Logic Operator"
                value={nodeData.operator}
                onChange={(e) => setNodeData({ ...nodeData, operator: e.target.value })}
                fullWidth
              >
                <MenuItem value="AND">AND</MenuItem>
                <MenuItem value="OR">OR</MenuItem>
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={createNode} variant="contained">
            Add Node
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisualBotEditor;
