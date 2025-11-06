const nodemailer = require('nodemailer');
const RiskAlert = require('../models/risk/risk-alert.model');
const RiskLimit = require('../models/risk/risk-limit.model');

class RiskAlertService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Check all active risk limits and generate alerts if thresholds are exceeded
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} currentMetrics - Current risk metrics
   */
  async checkRiskLimits(portfolioId, currentMetrics) {
    try {
      const activeLimits = await RiskLimit.findAll({
        where: {
          portfolio_id: portfolioId,
          is_active: true
        }
      });

      const alerts = [];

      for (const limit of activeLimits) {
        const alert = await this.evaluateLimit(limit, currentMetrics);
        if (alert) {
          alerts.push(alert);
          await this.createAlert(alert);
          await this.sendAlertNotification(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking risk limits:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single risk limit against current metrics
   * @param {Object} limit - Risk limit object
   * @param {Object} currentMetrics - Current risk metrics
   * @returns {Object|null} Alert object if limit exceeded, null otherwise
   */
  async evaluateLimit(limit, currentMetrics) {
    let isExceeded = false;
    let currentValue = 0;
    let alertType = '';
    let message = '';

    switch (limit.limit_type) {
      case 'DAILY_LOSS':
        currentValue = currentMetrics.dailyLoss || 0;
        isExceeded = currentValue > limit.threshold;
        alertType = 'DAILY_LOSS_EXCEEDED';
        message = `Daily loss of ${(currentValue * 100).toFixed(2)}% exceeds the limit of ${(limit.threshold * 100).toFixed(2)}%`;
        break;

      case 'POSITION_SIZE':
        currentValue = currentMetrics.positionSize || 0;
        isExceeded = currentValue > limit.threshold;
        alertType = 'POSITION_SIZE_EXCEEDED';
        message = `Position size of ${(currentValue * 100).toFixed(2)}% exceeds the limit of ${(limit.threshold * 100).toFixed(2)}%`;
        break;

      case 'CONCENTRATION':
        currentValue = currentMetrics.concentration || 0;
        isExceeded = currentValue > limit.threshold;
        alertType = 'CONCENTRATION_EXCEEDED';
        message = `Asset concentration of ${(currentValue * 100).toFixed(2)}% exceeds the limit of ${(limit.threshold * 100).toFixed(2)}%`;
        break;

      case 'VAR_LIMIT':
        currentValue = currentMetrics.valueAtRisk || 0;
        isExceeded = currentValue > limit.threshold;
        alertType = 'VAR_EXCEEDED';
        message = `Value at Risk of ${(currentValue * 100).toFixed(2)}% exceeds the limit of ${(limit.threshold * 100).toFixed(2)}%`;
        break;

      case 'VOLATILITY_LIMIT':
        currentValue = currentMetrics.volatility || 0;
        isExceeded = currentValue > limit.threshold;
        alertType = 'VOLATILITY_SPIKE';
        message = `Portfolio volatility of ${(currentValue * 100).toFixed(2)}% exceeds the limit of ${(limit.threshold * 100).toFixed(2)}%`;
        break;

      case 'DRAWDOWN_LIMIT':
        currentValue = currentMetrics.maxDrawdown || 0;
        isExceeded = currentValue > limit.threshold;
        alertType = 'DRAWDOWN_LIMIT';
        message = `Maximum drawdown of ${(currentValue * 100).toFixed(2)}% exceeds the limit of ${(limit.threshold * 100).toFixed(2)}%`;
        break;
    }

    if (isExceeded) {
      return {
        portfolio_id: limit.portfolio_id,
        alert_type: alertType,
        threshold_value: limit.threshold,
        current_value: currentValue,
        message: message,
        severity: this.determineSeverity(limit.limit_type, currentValue, limit.threshold)
      };
    }

    return null;
  }

  /**
   * Create a risk alert in the database
   * @param {Object} alertData - Alert data
   */
  async createAlert(alertData) {
    try {
      // Check if similar alert exists recently (within last hour) to avoid spam
      const recentAlert = await RiskAlert.findOne({
        where: {
          portfolio_id: alertData.portfolio_id,
          alert_type: alertData.alert_type,
          createdAt: {
            [require('sequelize').Op.gt]: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      });

      if (recentAlert) {
        console.log('Similar alert already exists, skipping...');
        return null;
      }

      const alert = await RiskAlert.create(alertData);
      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Send alert notification via email
   * @param {Object} alert - Alert object
   */
  async sendAlertNotification(alert) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('SMTP credentials not configured, skipping email notification');
        return;
      }

      const subject = `Risk Alert: ${alert.alert_type.replace('_', ' ')}`;
      const html = this.generateAlertEmailTemplate(alert);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ALERT_RECIPIENT_EMAIL || process.env.SMTP_USER,
        subject: subject,
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Alert notification sent successfully');
    } catch (error) {
      console.error('Error sending alert notification:', error);
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   * @param {Object} alert - Alert object
   */
  async sendPushNotification(alert) {
    // Placeholder for push notification implementation
    // This could integrate with services like Firebase Cloud Messaging,
    // OneSignal, or Web Push API
    console.log('Push notification would be sent:', alert.message);
  }

  /**
   * Generate HTML template for alert email
   * @param {Object} alert - Alert object
   * @returns {string} HTML email template
   */
  generateAlertEmailTemplate(alert) {
    const severityColor = this.getSeverityColor(alert.severity);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: ${severityColor}; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { padding: 20px; }
          .alert-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Risk Management Alert</h2>
            <p>${alert.alert_type.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div class="content">
            <h3>Alert Details</h3>
            <div class="alert-details">
              <p><strong>Portfolio ID:</strong> ${alert.portfolio_id}</p>
              <p><strong>Alert Type:</strong> ${alert.alert_type.replace('_', ' ')}</p>
              <p><strong>Current Value:</strong> ${(alert.current_value * 100).toFixed(2)}%</p>
              <p><strong>Threshold:</strong> ${(alert.threshold_value * 100).toFixed(2)}%</p>
              <p><strong>Severity:</strong> ${alert.severity}</p>
              <p><strong>Time:</strong> ${new Date(alert.createdAt || new Date()).toLocaleString()}</p>
            </div>
            <p><strong>Message:</strong> ${alert.message}</p>
            <p>Please review your portfolio risk exposure and take appropriate action.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Finverse Risk Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Determine alert severity based on limit type and breach magnitude
   * @param {string} limitType - Type of limit
   * @param {number} currentValue - Current value
   * @param {number} threshold - Threshold value
   * @returns {string} Severity level
   */
  determineSeverity(limitType, currentValue, threshold) {
    const breachRatio = currentValue / threshold;

    if (breachRatio > 1.5) return 'CRITICAL';
    if (breachRatio > 1.2) return 'HIGH';
    if (breachRatio > 1.1) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get color for severity level
   * @param {string} severity - Severity level
   * @returns {string} Color code
   */
  getSeverityColor(severity) {
    switch (severity) {
      case 'CRITICAL': return '#dc3545';
      case 'HIGH': return '#fd7e14';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  }

  /**
   * Get unread alerts for a portfolio
   * @param {string} portfolioId - Portfolio ID
   * @returns {Array} Unread alerts
   */
  async getUnreadAlerts(portfolioId) {
    try {
      return await RiskAlert.findAll({
        where: {
          portfolio_id: portfolioId,
          is_read: false
        },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error fetching unread alerts:', error);
      throw error;
    }
  }

  /**
   * Mark alerts as read
   * @param {Array} alertIds - Array of alert IDs
   */
  async markAlertsAsRead(alertIds) {
    try {
      await RiskAlert.update(
        { is_read: true },
        { where: { alert_id: { [require('sequelize').Op.in]: alertIds } } }
      );
    } catch (error) {
      console.error('Error marking alerts as read:', error);
      throw error;
    }
  }

  /**
   * Clean up old alerts (older than specified days)
   * @param {number} daysOld - Number of days
   */
  async cleanupOldAlerts(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedCount = await RiskAlert.destroy({
        where: {
          createdAt: { [require('sequelize').Op.lt]: cutoffDate }
        }
      });

      console.log(`Cleaned up ${deletedCount} old alerts`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
      throw error;
    }
  }
}

module.exports = RiskAlertService;