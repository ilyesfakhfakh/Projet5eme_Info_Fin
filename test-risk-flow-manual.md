# Complete Risk Management Flow Test - Manual Steps

Follow these steps to test the complete risk management system:

## Step 1: Create a Test Portfolio

**Using the Frontend:**
1. Go to Portfolio Management
2. Click "Create Portfolio"
3. Fill in:
   - Name: `Test Risk Portfolio`
   - Description: `Testing risk calculations`
   - Currency: EUR

**Expected Result:** Portfolio created with ID (copy this ID)

## Step 2: Add Positions to Portfolio

**Using the Frontend:**
1. Go to the portfolio you just created
2. Click "Add Position"
3. Add these positions:

   **Position 1:**
   - Symbol: AAPL
   - Quantity: 100
   - Entry Price: 150.00
   - Current Price: 155.00

   **Position 2:**
   - Symbol: GOOGL
   - Quantity: 50
   - Entry Price: 2500.00
   - Current Price: 2550.00

   **Position 3:**
   - Symbol: TSLA
   - Quantity: 25
   - Entry Price: 800.00
   - Current Price: 820.00

**Expected Result:**
- Total Portfolio Value: €15,500 + €127,500 + €20,500 = **€163,500**
- P&L: €500 + €2,500 + €500 = **€3,500 profit**

## Step 3: Check Portfolio Calculations

**In Portfolio View:**
- Total Value should show: **€163,500**
- Total P&L should show: **€3,500**

## Step 4: Set Up Risk Limits

**Go to Risk Management → Limits Management tab:**

1. Click "Add Limit"
2. Create **Exposure Limit**:
   - Type: EXPOSURE
   - Value: 100,000 (this will trigger alert since portfolio > €100k)
   - Instrument: All Instruments
   - Time Horizon: Daily
   - Breach Action: Alert Only

3. Create **VaR Limit**:
   - Type: VAR
   - Value: 1,000 (reasonable VaR limit)
   - Instrument: All Instruments
   - Time Horizon: Daily
   - Breach Action: Alert Only

## Step 5: Go to Risk Dashboard Overview

**Select your test portfolio from dropdown**

**Expected Results:**

### Portfolio Exposure Section:
- Gross Long: €163,500 (all positions are long)
- Gross Short: €0
- Net Exposure: €163,500

### Risk Metrics Section:
- Should show calculated VaR (not €0.01)
- Should show Sharpe Ratio
- Should show Max Drawdown
- Click "Recalculate All" if values seem wrong

## Step 6: Check for Alerts

**In Active Alerts section:**
- Should show alerts because exposure (€163,500) > limit (€100,000)
- Alert should say something like: "EXPOSURE limit breached. Current: 163500.00, Limit: 100000.00"

## Step 7: Verify Alert Persistence

**Go to Alerts tab:**
- Should show the breach alert in history
- Status should be "ACTIVE"
- Can click "Acknowledge" to mark as read

## Step 8: Test Alert Clearing

**Modify the exposure limit:**
1. Go back to Limits Management
2. Edit the EXPOSURE limit
3. Change value to: 200,000 (higher than current exposure)
4. Save changes

**Result:** Alert should disappear since exposure (163,500) < limit (200,000)

## Step 9: Test Position Changes

**Add another position:**
1. Go back to portfolio
2. Add position:
   - Symbol: MSFT
   - Quantity: 75
   - Entry Price: 300.00
   - Current Price: 310.00

**Result:**
- Portfolio value increases by €23,250 (75 × 310)
- New total: €186,750

**Go back to Risk Dashboard:**
- Exposure should update to €186,750
- If exposure > limit, new alert should appear
- Click "Recalculate All" to refresh risk metrics

## Step 10: Test Stress Testing

**Go to Stress Testing tab:**
1. Select a stress scenario from dropdown
2. Click "Run Stress Test"
3. Should show P&L impact breakdown

## Summary of What Should Work:

✅ **Portfolio Creation** - Creates portfolio successfully
✅ **Position Addition** - Adds positions and calculates values
✅ **Portfolio Calculations** - Shows correct total value and P&L
✅ **Risk Limits** - Can create exposure and VaR limits
✅ **Risk Assessment** - Calculates VaR, Sharpe, Max Drawdown
✅ **Alert Generation** - Creates alerts when limits breached
✅ **Alert Management** - Can acknowledge and view alerts
✅ **Real-time Updates** - Values update when positions change
✅ **Stress Testing** - Can run scenario analysis

## Troubleshooting:

**If no alerts appear:**
- Check that limits are set lower than current exposure
- Click "Refresh" button in risk dashboard
- Check browser console for errors

**If risk metrics show €0.01:**
- Click "Recalculate All" button
- Check that portfolio has positions with prices

**If exposure doesn't update:**
- Refresh the risk dashboard
- Check that positions were added correctly

**If stress test fails:**
- Ensure a scenario is selected before clicking "Run Stress Test"

This complete flow demonstrates that the risk management system is working properly with real calculations, dynamic alerts, and proper portfolio exposure tracking.