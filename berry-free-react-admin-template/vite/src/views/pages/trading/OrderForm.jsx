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
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [orderSide, setOrderSide] = useState('buy');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [availableToSpend, setAvailableToSpend] = useState(availableBalance);

  // In a real app, you would fetch the current price from an API
  useEffect(() => {
    // Simulate price updates
    const interval = setInterval(() => {
      const mockPrice = (50000 + (Math.random() - 0.5) * 500).toFixed(2);
      setPrice(mockPrice);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calculate estimated cost when price or quantity changes
  useEffect(() => {
    const total = calculateTotal(price, quantity);
    setEstimatedCost(total);
  }, [price, quantity]);

  // Calculate available balance based on order side
  useEffect(() => {
    // In a real app, you would fetch the actual available balance for the selected asset
    setAvailableToSpend(availableBalance);
  }, [availableBalance, orderSide]);

  const formik = useFormik({
    initialValues: {
      orderType: 'market',
      orderSide: 'buy',
      quantity: '',
      limitPrice: '',
      stopPrice: '',
    },
    validationSchema: Yup.object({
      orderType: Yup.string().required('Order type is required'),
      orderSide: Yup.string().required('Order side is required'),
      quantity: Yup.number()
        .required('Quantity is required')
        .positive('Quantity must be positive')
        .test(
          'max-quantity',
          'Insufficient balance',
          (value) => {
            if (!value) return true;
            const total = calculateTotal(price, value);
            return total <= availableToSpend;
          }
        ),
      limitPrice: Yup.number()
        .when('orderType', {
          is: (type) => ['limit', 'stop_limit'].includes(type),
          then: Yup.number()
            .required('Limit price is required')
            .positive('Price must be positive'),
        }),
      stopPrice: Yup.number()
        .when('orderType', {
          is: (type) => ['stop', 'stop_limit'].includes(type),
          then: Yup.number()
            .required('Stop price is required')
            .positive('Price must be positive'),
        }),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setIsSubmitting(true);
        
        const orderData = {
          symbol: selectedAsset,
          type: values.orderType,
          side: values.orderSide,
          quantity: parseFloat(values.quantity),
          price: values.limitPrice ? parseFloat(values.limitPrice) : null,
          stopPrice: values.stopPrice ? parseFloat(values.stopPrice) : null,
        };

        // In a real app, you would call the API to place the order
        // const response = await placeOrder(orderData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Notify parent component
        if (onOrderPlaced) {
          onOrderPlaced({
            ...orderData,
            id: `order-${Date.now()}`,
            status: 'filled',
            filledQuantity: orderData.quantity,
            timestamp: new Date().toISOString(),
          });
        }
        
        // Reset form
        resetForm();
        setQuantity('');
        
        // Show success message
        // You might want to use a toast notification here
        console.log('Order placed successfully:', orderData);
      } catch (error) {
        console.error('Error placing order:', error);
        // Show error message
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleOrderTypeChange = (event) => {
    formik.setFieldValue('orderType', event.target.value);
  };

  const handleOrderSideChange = (event, newSide) => {
    if (newSide !== null) {
      formik.setFieldValue('orderSide', newSide);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
      formik.setFieldValue('quantity', value);
    }
  };

  const handlePercentageClick = (percentage) => {
    if (!price) return;
    
    const maxQuantity = availableToSpend / parseFloat(price);
    const quantity = (maxQuantity * (percentage / 100)).toFixed(8);
    setQuantity(quantity);
    formik.setFieldValue('quantity', quantity);
  };

  const isMarketOrder = formik.values.orderType === 'market';
  const isLimitOrder = formik.values.orderType === 'limit';
  const isStopOrder = formik.values.orderType === 'stop';
  const isStopLimitOrder = formik.values.orderType === 'stop_limit';
  const isBuyOrder = formik.values.orderSide === 'buy';
  
  const buttonColor = isBuyOrder ? 'success' : 'error';
  const buttonText = `${isBuyOrder ? 'Buy' : 'Sell'} ${selectedAsset.split('/')[0]}`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        New Order
      </Typography>
      
      <form onSubmit={formik.handleSubmit}>
        {/* Order Type Selection */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="order-type-label">Order Type</InputLabel>
          <Select
            labelId="order-type-label"
            id="orderType"
            name="orderType"
            value={formik.values.orderType}
            onChange={handleOrderTypeChange}
            label="Order Type"
            error={formik.touched.orderType && Boolean(formik.errors.orderType)}
          >
            <MenuItem value="market">Market</MenuItem>
            <MenuItem value="limit">Limit</MenuItem>
            <MenuItem value="stop">Stop</MenuItem>
            <MenuItem value="stop_limit">Stop-Limit</MenuItem>
          </Select>
          {formik.touched.orderType && formik.errors.orderType && (
            <FormHelperText error>{formik.errors.orderType}</FormHelperText>
          )}
        </FormControl>

        {/* Order Side Toggle */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            color={buttonColor}
            value={formik.values.orderSide}
            exclusive
            onChange={handleOrderSideChange}
            fullWidth
            size="large"
          >
            <ToggleButton 
              value="buy" 
              sx={{
                fontWeight: 600,
                '&.Mui-selected': {
                  bgcolor: 'success.light',
                  color: 'success.contrastText',
                  '&:hover': {
                    bgcolor: 'success.main',
                  },
                },
              }}
            >
              Buy / Long
            </ToggleButton>
            <ToggleButton 
              value="sell"
              sx={{
                fontWeight: 600,
                '&.Mui-selected': {
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  '&:hover': {
                    bgcolor: 'error.main',
                  },
                },
              }}
            >
              Sell / Short
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Price Inputs */}
        {!isMarketOrder && (
          <>
            {(isLimitOrder || isStopLimitOrder) && (
              <TextField
                fullWidth
                size="small"
                id="limitPrice"
                name="limitPrice"
                label="Limit Price"
                type="number"
                value={formik.values.limitPrice}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.limitPrice && Boolean(formik.errors.limitPrice)}
                helperText={formik.touched.limitPrice && formik.errors.limitPrice}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            )}
            
            {(isStopOrder || isStopLimitOrder) && (
              <TextField
                fullWidth
                size="small"
                id="stopPrice"
                name="stopPrice"
                label="Stop Price"
                type="number"
                value={formik.values.stopPrice}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.stopPrice && Boolean(formik.errors.stopPrice)}
                helperText={formik.touched.stopPrice && formik.errors.stopPrice}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            )}
          </>
        )}

        {/* Quantity Input */}
        <TextField
          fullWidth
          size="small"
          id="quantity"
          name="quantity"
          label={`Quantity (${selectedAsset.split('/')[0]})`}
          type="text"
          value={quantity}
          onChange={handleQuantityChange}
          onBlur={formik.handleBlur}
          error={formik.touched.quantity && Boolean(formik.errors.quantity)}
          helperText={
            formik.touched.quantity && formik.errors.quantity
              ? formik.errors.quantity
              : `Available: ${availableToSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedAsset.split('/')[1] || 'USD'}`
          }
          sx={{ mb: 1 }}
        />

        {/* Quick Percentage Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[25, 50, 75, 100].map((percent) => (
            <Button
              key={percent}
              variant="outlined"
              size="small"
              onClick={() => handlePercentageClick(percent)}
              sx={{ flex: 1, fontSize: '0.7rem' }}
            >
              {percent}%
            </Button>
          ))}
        </Box>

        {/* Order Summary */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 2, 
            borderRadius: 1, 
            bgcolor: 'action.hover',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {isMarketOrder ? 'Market Price' : 'Limit Price'}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {isMarketOrder 
                ? price 
                  ? `$${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
                  : 'Loading...'
                : `$${parseFloat(formik.values.limitPrice || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
              }
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {quantity || '0'} {selectedAsset.split('/')[0]}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">
              {isBuyOrder ? 'Total Cost' : 'Total Received'}
            </Typography>
            <Typography variant="subtitle1" fontWeight={600} color={isBuyOrder ? 'success.main' : 'error.main'}>
              ${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>

        {/* Submit Button */}
        <Button
          fullWidth
          type="submit"
          variant="contained"
          color={buttonColor}
          size="large"
          disabled={isSubmitting || !formik.isValid || !formik.dirty}
          sx={{
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <>{buttonText} {selectedAsset.split('/')[0]}</>
          )}
        </Button>
      </form>
    </Paper>
  );
};

export default OrderForm;
