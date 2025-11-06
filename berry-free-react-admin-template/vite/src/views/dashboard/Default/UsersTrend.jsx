import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import MainCard from 'ui-component/cards/MainCard';
import { listUsers } from 'api/users';

function groupByMonth(items) {
  const map = new Map();
  items.forEach((u) => {
    const ts = u.created_at ? new Date(u.created_at) : null;
    if (!ts) return;
    const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  const keys = Array.from(map.keys()).sort();
  return { labels: keys, data: keys.map((k) => map.get(k)) };
}

export default function UsersTrend() {
  const theme = useTheme();
  const [series, setSeries] = useState([{ name: 'New Users', data: [] }]);
  const [labels, setLabels] = useState([]);

  const color = theme.vars.palette.success.main;

  useEffect(() => {
    async function load() {
      try {
        const res = await listUsers({ page: 1, pageSize: 200 });
        const users = Array.isArray(res?.data) ? res.data : [];
        const { labels: l, data } = groupByMonth(users);
        setLabels(l);
        setSeries([{ name: 'New Users', data }]);
      } catch (_) {}
    }
    load();
  }, []);

  const options = {
    chart: { toolbar: { show: false } },
    xaxis: { categories: labels, labels: { style: { colors: theme.vars.palette.text.primary } } },
    yaxis: { labels: { style: { colors: theme.vars.palette.text.primary } } },
    stroke: { curve: 'smooth', width: 3 },
    colors: [color],
    dataLabels: { enabled: false },
    grid: { borderColor: theme.vars.palette.divider }
  };

  return (
    <MainCard title="New users by month">
      <Chart type="line" options={options} series={series} height={320} />
    </MainCard>
  );
}
