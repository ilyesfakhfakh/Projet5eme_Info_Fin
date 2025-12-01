# Database Migration with Risk Module

This guide explains how to migrate your existing database to include the new Risk Management module while preserving all your existing data.

## ⚠️ Important Notes

- **Backup First**: This process will create a complete backup of your current database
- **Data Preservation**: All existing data will be preserved and restored
- **Risk Module**: New risk management tables will be added
- **Downtime**: Your application will be unavailable during migration

## 🚀 Migration Steps

### Step 1: Run the Migration Script

```bash
cd finserve-api
npm run migrate:with-risk
```

This script will:
1. 📦 **Create a backup** of your current database (timestamped file)
2. 🔄 **Drop and recreate** the database with new schema
3. 🏗️ **Run migrations** to create all tables including risk tables
4. 🔄 **Restore your data** from the backup
5. 🌱 **Seed risk-specific data** (limits, scenarios, etc.)

### Step 2: Start the Server

```bash
npm start
```

### Step 3: Verify Migration

1. Check that the server starts without errors
2. Access the Risk module in your frontend
3. Verify that your existing data is intact

## 📁 What Gets Backed Up

The migration script backs up all data from:
- Users and authentication data
- Portfolios and positions
- Transactions and orders
- Market data and assets
- ALM data (if exists)
- All other application data

## 🆕 What Gets Added

New risk management tables:
- `risk_limits` - Risk limit definitions
- `risk_metrics` - Calculated risk metrics (VaR, exposures)
- `risk_alerts` - Alert history and status
- `risk_logs` - Audit trail for all risk actions
- `stress_scenarios` - Predefined stress test scenarios

## 🔧 Manual Recovery (if needed)

If something goes wrong during migration:

1. **Stop the server**
2. **Find the backup file** (format: `database_backup_YYYY-MM-DDTHH-MM-SS.sql`)
3. **Restore manually**:

```bash
mysql -u [username] -p [database_name] < database_backup_YYYY-MM-DDTHH-MM-SS.sql
```

## 🎯 Post-Migration

After successful migration:

1. **Test Risk Features**:
   - Access the Risk module in your frontend
   - Create risk limits
   - Calculate VaR
   - Run stress tests

2. **Verify Data Integrity**:
   - Check that all portfolios and positions exist
   - Verify user accounts and permissions
   - Confirm transaction history is intact

3. **Configure Risk Settings**:
   - Set up appropriate risk limits
   - Configure alert thresholds
   - Create custom stress scenarios

## 📞 Support

If you encounter any issues during migration:

1. Check the console output for error messages
2. Verify your database credentials in `.env`
3. Ensure MySQL server is running
4. Check that you have sufficient permissions

The migration script provides detailed logging to help troubleshoot any issues.