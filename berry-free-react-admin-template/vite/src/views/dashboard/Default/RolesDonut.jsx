import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import MainCard from 'ui-component/cards/MainCard';
import { listUsers } from 'api/users';

export default function RolesDonut() {
  const theme = useTheme();
  const [series, setSeries] = useState([]);
  const [labels, setLabels] = useState([]);

  const colors = useMemo(
    () => [
      theme.vars.palette.primary.light,
      theme.vars.palette.secondary.light,
      theme.vars.palette.success.main,
      theme.vars.palette.orange.main,
      theme.vars.palette.error.main,
      theme.vars.palette.warning.main
    ],
    [theme.vars.palette]
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await listUsers({ page: 1, pageSize: 100 });
        const users = Array.isArray(res?.data) ? res.data : [];
        const counts = new Map();
        users.forEach((u) => {
          (u.roles || []).forEach((r) => {
            const name = r.role_name || r.name || 'NO_ROLE';
            counts.set(name, (counts.get(name) || 0) + 1);
          });
        });
        const lbls = Array.from(counts.keys());
        const vals = lbls.map((k) => counts.get(k));
        setLabels(lbls);
        setSeries(vals);
      } catch (_) {}
    }
    load();
  }, []);

  const options = {
    labels,
    legend: { position: 'bottom', labels: { colors: theme.vars.palette.text.primary } },
    colors,
    dataLabels: { enabled: true },
    stroke: { width: 1 },
    theme: { mode: 'light' }
  };

  return (
    <MainCard title="Roles distribution">
      <Chart type="donut" options={options} series={series} height={320} />
    </MainCard>
  );
}
