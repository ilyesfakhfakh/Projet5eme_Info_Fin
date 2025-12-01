import React from 'react';
import Chart from 'react-apexcharts';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

// Exposure Breakdown Chart
export const ExposureBreakdownChart = ({ data, title = "Portfolio Exposure Breakdown" }) => {
  const theme = useTheme();

  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
    },
    labels: data.map(item => item.label),
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    legend: {
      position: 'bottom',
      labels: {
        colors: theme.palette.text.primary,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `€${value.toLocaleString()}`,
      },
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const series = data.map(item => item.value);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Chart
          options={options}
          series={series}
          type="donut"
          height={300}
        />
      </CardContent>
    </Card>
  );
};

// PnL vs Limits Chart
export const PnLVsLimitsChart = ({ pnl, limits, title = "P&L vs Risk Limits" }) => {
  const theme = useTheme();

  const options = {
    chart: {
      type: 'bar',
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
      },
    },
    colors: [theme.palette.success.main, theme.palette.error.main],
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ['Current P&L', 'P&L Limit'],
      labels: {
        formatter: (value) => `€${value.toLocaleString()}`,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `€${value.toLocaleString()}`,
      },
    },
  };

  const series = [{
    name: 'Amount',
    data: [pnl, limits.pnlLimit || 0],
  }];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Chart
          options={options}
          series={series}
          type="bar"
          height={200}
        />
      </CardContent>
    </Card>
  );
};

// VaR Trend Chart
export const VaRTrendChart = ({ varData, title = "VaR Trend (95% Confidence)" }) => {
  const theme = useTheme();

  const options = {
    chart: {
      type: 'line',
      background: 'transparent',
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: [theme.palette.warning.main],
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'HH:mm',
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => `€${value.toLocaleString()}`,
      },
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy HH:mm',
      },
      y: {
        formatter: (value) => `€${value.toLocaleString()}`,
      },
    },
    markers: {
      size: 4,
      colors: [theme.palette.warning.main],
      strokeColors: theme.palette.background.paper,
      strokeWidth: 2,
    },
  };

  const series = [{
    name: 'VaR (95%)',
    data: varData.map(point => ({
      x: new Date(point.timestamp).getTime(),
      y: point.value,
    })),
  }];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Chart
          options={options}
          series={series}
          type="line"
          height={250}
        />
      </CardContent>
    </Card>
  );
};

// Stress Test Impact Chart
export const StressTestImpactChart = ({ impactData, title = "Stress Test Impact" }) => {
  const theme = useTheme();

  const options = {
    chart: {
      type: 'bar',
      background: 'transparent',
      stacked: true,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    colors: [
      theme.palette.error.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
    ],
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: impactData.map(item => item.scenario),
    },
    yaxis: {
      labels: {
        formatter: (value) => `€${value.toLocaleString()}`,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `€${value.toLocaleString()}`,
      },
    },
    legend: {
      position: 'top',
    },
  };

  const series = [
    {
      name: 'Equity Impact',
      data: impactData.map(item => item.equity || 0),
    },
    {
      name: 'Rates Impact',
      data: impactData.map(item => item.rates || 0),
    },
    {
      name: 'FX Impact',
      data: impactData.map(item => item.fx || 0),
    },
    {
      name: 'Total Impact',
      data: impactData.map(item => item.total || 0),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Chart
          options={options}
          series={series}
          type="bar"
          height={300}
        />
      </CardContent>
    </Card>
  );
};

// Risk Metrics Gauge Chart
export const RiskMetricsGauge = ({ value, maxValue, title, color = 'primary' }) => {
  const theme = useTheme();

  const options = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '70%',
          background: theme.palette.background.paper,
        },
        track: {
          background: theme.palette.grey[200],
          strokeWidth: '67%',
          margin: 0,
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: theme.palette.text.primary,
            fontSize: '13px',
          },
          value: {
            formatter: (val) => `€${val.toLocaleString()}`,
            color: theme.palette.text.primary,
            fontSize: '16px',
            show: true,
          },
        },
      },
    },
    fill: {
      colors: [theme.palette[color].main],
    },
    stroke: {
      lineCap: 'round',
    },
    labels: [title],
  };

  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const series = [Math.min(percentage, 100)];

  return (
    <Card>
      <CardContent>
        <Chart
          options={options}
          series={series}
          type="radialBar"
          height={200}
        />
      </CardContent>
    </Card>
  );
};