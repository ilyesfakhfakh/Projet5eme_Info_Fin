import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

export default function NewUsersByMonth() {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/stats/new-users-by-month`);
      if (!res.ok) throw new Error('Erreur lors du chargement des données');
      const json = await res.json();
      setData(json.data || []);
    } catch (e) {
      console.error('Error fetching new users stats:', e);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = {
    series: [{
      name: 'Nouveaux utilisateurs',
      data: data.map(d => d.count)
    }],
    options: {
      chart: {
        height: 350,
        type: 'bar',
        toolbar: {
          show: false
        }
      },
      colors: [theme.palette.primary.main],
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: data.map(d => d.month),
        labels: {
          style: {
            colors: theme.palette.text.secondary
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: theme.palette.text.secondary
          }
        }
      },
      grid: {
        borderColor: theme.palette.divider
      },
      tooltip: {
        theme: theme.palette.mode
      }
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Nouveaux utilisateurs par mois" 
        subheader="Nombre d'inscriptions mensuelles"
      />
      <CardContent>
        <Box sx={{ height: 360 }}>
          {!loading && data.length > 0 && (
            <ReactApexChart
              options={chartData.options}
              series={chartData.series}
              type="bar"
              height="100%"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}