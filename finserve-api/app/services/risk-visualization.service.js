class RiskVisualizationService {
  /**
   * Generate data for VaR distribution chart
   * @param {Array} returns - Historical returns
   * @param {number} confidenceLevel - Confidence level
   * @returns {Object} Chart data
   */
  static generateVaRChartData(returns, confidenceLevel = 0.95) {
    if (!returns || returns.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sortedReturns = returns.sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varValue = -sortedReturns[varIndex];

    // Create histogram data
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const binCount = 20;
    const binWidth = (max - min) / binCount;

    const bins = Array(binCount).fill(0);
    const binLabels = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binWidth;
      const binEnd = min + (i + 1) * binWidth;
      binLabels.push(`${binStart.toFixed(3)} - ${binEnd.toFixed(3)}`);

      returns.forEach(returnVal => {
        if (returnVal >= binStart && returnVal < binEnd) {
          bins[i]++;
        }
      });
    }

    return {
      labels: binLabels,
      datasets: [{
        label: 'Return Distribution',
        data: bins,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: `VaR (${(confidenceLevel * 100).toFixed(0)}%)`,
        data: bins.map((_, index) => {
          const binStart = min + index * binWidth;
          return binStart <= -varValue ? Math.max(...bins) * 0.1 : 0;
        }),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        type: 'line'
      }]
    };
  }

  /**
   * Generate drawdown chart data
   * @param {Array} portfolioValues - Portfolio values over time
   * @returns {Object} Chart data
   */
  static generateDrawdownChartData(portfolioValues) {
    if (!portfolioValues || portfolioValues.length === 0) {
      return { labels: [], datasets: [] };
    }

    const drawdowns = [];
    let peak = portfolioValues[0];

    portfolioValues.forEach((value, index) => {
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      drawdowns.push(drawdown);
    });

    const labels = portfolioValues.map((_, index) => `Period ${index + 1}`);

    return {
      labels,
      datasets: [{
        label: 'Drawdown',
        data: drawdowns,
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        borderColor: 'rgba(255, 206, 86, 1)',
        fill: true
      }]
    };
  }

  /**
   * Generate correlation matrix heatmap data
   * @param {Array} correlationMatrix - Correlation matrix
   * @param {Array} assetNames - Names of assets
   * @returns {Object} Heatmap data
   */
  static generateCorrelationHeatmapData(correlationMatrix, assetNames = []) {
    if (!correlationMatrix || correlationMatrix.length === 0) {
      return { data: [], labels: [] };
    }

    const data = [];
    const labels = assetNames.length > 0 ? assetNames :
      correlationMatrix.map((_, index) => `Asset ${index + 1}`);

    correlationMatrix.forEach((row, i) => {
      row.forEach((correlation, j) => {
        data.push({
          x: j,
          y: i,
          v: correlation,
          label: `${labels[i]} vs ${labels[j]}: ${correlation.toFixed(3)}`
        });
      });
    });

    return {
      data,
      labels,
      min: -1,
      max: 1
    };
  }

  /**
   * Generate risk metrics time series chart
   * @param {Array} assessments - Risk assessment history
   * @returns {Object} Chart data
   */
  static generateRiskMetricsTimeSeries(assessments) {
    if (!assessments || assessments.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = assessments.map(assessment =>
      new Date(assessment.assessment_date).toLocaleDateString()
    );

    return {
      labels,
      datasets: [
        {
          label: 'Risk Score',
          data: assessments.map(a => a.risk_score),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Volatility',
          data: assessments.map(a => a.volatility),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y1'
        },
        {
          label: 'VaR (95%)',
          data: assessments.map(a => a.value_at_risk),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y1'
        },
        {
          label: 'Max Drawdown',
          data: assessments.map(a => a.max_drawdown),
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          yAxisID: 'y1'
        }
      ]
    };
  }

  /**
   * Generate stress test results chart
   * @param {Object} stressTestResults - Results from stress test
   * @returns {Object} Chart data
   */
  static generateStressTestChart(stressTestResults) {
    if (!stressTestResults || !stressTestResults.scenarios) {
      return { labels: [], datasets: [] };
    }

    const labels = stressTestResults.scenarios.map(s => s.scenarioName);

    return {
      labels,
      datasets: [{
        label: 'Portfolio Return',
        data: stressTestResults.scenarios.map(s => s.portfolioReturn),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: 'VaR Impact',
        data: stressTestResults.scenarios.map(s => s.var),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    };
  }

  /**
   * Generate risk dashboard summary data
   * @param {Object} latestAssessment - Latest risk assessment
   * @param {Array} alerts - Recent alerts
   * @param {Array} limits - Risk limits
   * @returns {Object} Dashboard data
   */
  static generateDashboardSummary(latestAssessment, alerts = [], limits = []) {
    const summary = {
      currentRisk: {
        score: latestAssessment?.risk_score || 0,
        level: this.getRiskLevel(latestAssessment?.risk_score || 0),
        volatility: latestAssessment?.volatility || 0,
        sharpeRatio: latestAssessment?.sharpe_ratio || 0,
        maxDrawdown: latestAssessment?.max_drawdown || 0,
        valueAtRisk: latestAssessment?.value_at_risk || 0
      },
      alerts: {
        total: alerts.length,
        unread: alerts.filter(a => !a.is_read).length,
        critical: alerts.filter(a => a.alert_type === 'VAR_EXCEEDED').length
      },
      limits: {
        total: limits.length,
        breached: limits.filter(l => l.alert_triggered).length
      },
      recommendations: latestAssessment?.recommendations || 'No recommendations available'
    };

    return summary;
  }

  /**
   * Get risk level description based on score
   * @param {number} score - Risk score
   * @returns {string} Risk level
   */
  static getRiskLevel(score) {
    if (score < 20) return 'Very Low';
    if (score < 40) return 'Low';
    if (score < 60) return 'Moderate';
    if (score < 80) return 'High';
    return 'Very High';
  }

  /**
   * Generate risk alerts timeline data
   * @param {Array} alerts - Risk alerts
   * @returns {Object} Timeline chart data
   */
  static generateAlertsTimeline(alerts) {
    if (!alerts || alerts.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Group alerts by date
    const alertsByDate = {};
    alerts.forEach(alert => {
      const date = new Date(alert.alert_date).toLocaleDateString();
      if (!alertsByDate[date]) {
        alertsByDate[date] = { total: 0, byType: {} };
      }
      alertsByDate[date].total++;
      alertsByDate[date].byType[alert.alert_type] = (alertsByDate[date].byType[alert.alert_type] || 0) + 1;
    });

    const labels = Object.keys(alertsByDate).sort();
    const datasets = [];

    // Create datasets for each alert type
    const alertTypes = ['VAR_EXCEEDED', 'VOLATILITY_SPIKE', 'DRAWDOWN_LIMIT', 'SHARPE_RATIO_LOW'];
    const colors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)'
    ];

    alertTypes.forEach((type, index) => {
      datasets.push({
        label: type.replace('_', ' ').toLowerCase(),
        data: labels.map(date => alertsByDate[date]?.byType[type] || 0),
        backgroundColor: colors[index],
        borderColor: colors[index].replace('0.5', '1'),
        borderWidth: 1
      });
    });

    return { labels, datasets };
  }
}

module.exports = RiskVisualizationService;