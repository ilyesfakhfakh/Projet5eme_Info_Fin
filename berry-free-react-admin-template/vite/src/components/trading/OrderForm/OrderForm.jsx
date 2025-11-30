import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Divider,
  FormHelperText,
  useTheme,
  CircularProgress,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { placeOrder } from 'services/tradingService';

const orderTypes = ['market', 'limit', 'stop', 'stop_limit'];
const orderSides = ['buy', 'sell'];

export const calculateTotal = (price, quantity) => {
  if (!price || !quantity) return 0;
  return parseFloat(price) * parseFloat(quantity);
};

const OrderForm = ({ selectedAsset = 'BTC/USD', onOrderPlaced, availableBalance = 10000 }) => {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const formik = useFormik({
    initialValues: {
      type: 'market',
      side: 'buy',
      price: '',
      stopPrice: '',
      quantity: '',
      timeInForce: 'GTC',
    },
    validationSchema: Yup.object({
      type: Yup.string().oneOf(orderTypes).required('Order type is required'),
      side: Yup.string().oneOf(orderSides).required('Side is required'),
      price: Yup.number().when('type', {
        is: (type) => ['limit', 'stop_limit'].includes(type),
        then: Yup.number().required('Price is required').positive('Must be greater than 0'),
      }),
      stopPrice: Yup.number().when('type', {
        is: (type) => ['stop', 'stop_limit'].includes(type),
        then: Yup.number().required('Stop price is required').positive('Must be greater than 0'),
      }),
      quantity: Yup.number()
        .required('Quantity is required')
        .positive('Must be greater than 0')
        .test(
          'max-quantity',
          'Insufficient balance',
          function(value) {
            if (formik.values.type === 'market' || !formik.values.price) return true;
            const total = calculateTotal(formik.values.price, value);
            return total <= availableBalance;
          }
        ),
      timeInForce: Yup.string().when('type', {
        is: (type) => type !== 'market',
        then: Yup.string().required('Time in force is required'),
      }),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setIsSubmitting(true);
        setError(null);
        
        const orderData = {
          symbol: selectedAsset,
          type: values.type,
          side: values.side,
          quantity: parseFloat(values.quantity),
        };

        if (values.price) {
          orderData.price = parseFloat(values.price);
        }

        if (values.stopPrice) {
          orderData.stopPrice = parseFloat(values.stopPrice);
        }

        if (values.timeInForce) {
          orderData.timeInForce = values.timeInForce;
        }

        const result = await placeOrder(orderData);
        
        if (onOrderPlaced) {
          onOrderPlaced(result);
        }
        
        resetForm();
      } catch (err) {
        console.error('Error placing order:', err);
        setError(err.message || 'Failed to place order');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Update validation when selectedAsset changes
  useEffect(() => {
    formik.validateForm();
  }, [selectedAsset]);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          New Order
        </Typography>
        
        <form onSubmit={formik.handleSubmit}>
          <ToggleButtonGroup
            color="primary"
            value={formik.values.side}
            exclusive
            onChange={(_, value) => value && formik.setFieldValue('side', value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton 
              value="buy" 
              sx={{
                bgcolor: formik.values.side === 'buy' ? 'success.light' : 'transparent',
                color: formik.values.side === 'buy' ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: formik.values.side === 'buy' ? 'success.dark' : 'action.hover',
                },
              }}
            >
              Buy / Long
            </ToggleButton>
            <ToggleButton 
              value="sell"
              sx={{
                bgcolor: formik.values.side === 'sell' ? 'error.light' : 'transparent',
                color: formik.values.side === 'sell' ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: formik.values.side === 'sell' ? 'error.dark' : 'action.hover',
                },
              }}
            >
              Sell / Short
            </ToggleButton>
          </ToggleButtonGroup>

          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel id="order-type-label">Order Type</InputLabel>
            <Select
              labelId="order-type-label"
              id="type"
              name="type"
              value={formik.values.type}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.type && Boolean(formik.errors.type)}
              label="Order Type"
            >
              <MenuItem value="market">Market</MenuItem>
              <MenuItem value="limit">Limit</MenuItem>
              <MenuItem value="stop">Stop</MenuItem>
              <MenuItem value="stop_limit">Stop Limit</MenuItem>
            </Select>
            {formik.touched.type && formik.errors.type && (
              <FormHelperText error>{formik.errors.type}</FormHelperText>
            )}
          </FormControl>

          {['limit', 'stop_limit'].includes(formik.values.type) && (
            <TextField
              fullWidth
              margin="normal"
              id="price"
              name="price"
              label="Price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.price && Boolean(formik.errors.price)}
              helperText={formik.touched.price && formik.errors.price}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          )}

          {['stop', 'stop_limit'].includes(formik.values.type) && (
            <TextField
              fullWidth
              margin="normal"
              id="stopPrice"
              name="stopPrice"
              label="Stop Price"
              type="number"
              value={formik.values.stopPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.stopPrice && Boolean(formik.errors.stopPrice)}
              helperText={formik.touched.stopPrice && formik.errors.stopPrice}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          )}

          <TextField
            fullWidth
            margin="normal"
            id="quantity"
            name="quantity"
            label="Quantity"
            type="number"
            value={formik.values.quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.quantity && Boolean(formik.errors.quantity)}
            helperText={
              formik.touched.quantity && 
              (formik.errors.quantity || 
                (formik.values.price && `Total: $${calculateTotal(formik.values.price, formik.values.quantity).toFixed(2)}`))
            }
          />

          {formik.values.type !== 'market' && (
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel id="time-in-force-label">Time in Force</InputLabel>
              <Select
                labelId="time-in-force-label"
                id="timeInForce"
                name="timeInForce"
                value={formik.values.timeInForce}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.timeInForce && Boolean(formik.errors.timeInForce)}
                label="Time in Force"
              >
                <MenuItem value="GTC">Good Till Cancel (GTC)</MenuItem>
                <MenuItem value="IOC">Immediate or Cancel (IOC)</MenuItem>
                <MenuItem value="FOK">Fill or Kill (FOK)</MenuItem>
              </Select>
              {formik.touched.timeInForce && formik.errors.timeInForce && (
                <FormHelperText error>{formik.errors.timeInForce}</FormHelperText>
              )}
            </FormControl>
          )}

          <Box mt={3}>
            <Button
              color="primary"
              variant="contained"
              fullWidth
              type="submit"
              disabled={isSubmitting}
              sx={{
                bgcolor: formik.values.side === 'buy' ? 'success.main' : 'error.main',
                '&:hover': {
                  bgcolor: formik.values.side === 'buy' ? 'success.dark' : 'error.dark',
                },
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `${formik.values.side === 'buy' ? 'Buy' : 'Sell'} ${selectedAsset.split('/')[0]}`
              )}
            </Button>
          </Box>

          {error && (
            <Box mt={2} color="error.main">
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}

          <Box mt={2} color="text.secondary" textAlign="center">
            <Typography variant="caption">
              Available: ${availableBalance.toFixed(2)}
            </Typography>
          </Box>
        </form>
      </Box>
    </Paper>
  );
};

export default OrderForm;
