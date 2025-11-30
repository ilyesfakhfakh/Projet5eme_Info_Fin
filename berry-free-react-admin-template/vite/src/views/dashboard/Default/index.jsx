import { useEffect, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';

// project imports
import TotalIncomeDarkCard from '../../../ui-component/cards/TotalIncomeDarkCard';
import TotalIncomeLightCard from '../../../ui-component/cards/TotalIncomeLightCard';
import RolesDonut from './RolesDonut';
import UsersTrend from './UsersTrend';
import NewUsersByMonth from './NewUsersByMonth';

import { gridSpacing } from 'store/constant';
import { listUsers } from 'api/users';
import { listRoles } from 'api/roles';

// assets
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';

// ==============================|| CLEAN DASHBOARD ||============================== //

export default function Dashboard() {
  const [isLoading, setLoading] = useState(true);
  const [usersTotal, setUsersTotal] = useState(0);
  const [rolesTotal, setRolesTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchKpis() {
      try {
        const users = await listUsers({ page: 1, pageSize: 1 });
        if (mounted) setUsersTotal(Number(users?.total || 0));
      } catch (_) {}
      try {
        const roles = await listRoles();
        if (mounted) setRolesTotal(Array.isArray(roles) ? roles.length : 0);
      } catch (_) {}
      if (mounted) setLoading(false);
    }
    fetchKpis();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Grid container spacing={gridSpacing}>
      <Grid size={12}>
        <Grid container spacing={gridSpacing}>
          <Grid size={{ sm: 6, xs: 12, md: 6, lg: 6 }}>
            <TotalIncomeDarkCard isLoading={isLoading} total={rolesTotal} label={'Total Roles'} />
          </Grid>
          <Grid size={{ sm: 6, xs: 12, md: 6, lg: 6 }}>
            <TotalIncomeLightCard
              {...{
                isLoading: isLoading,
                total: usersTotal,
                label: 'Total Users',
                icon: <StorefrontTwoToneIcon fontSize="inherit" />
              }}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={12}>
        <Grid container spacing={gridSpacing}>
          <Grid size={{ xs: 12, md: 6 }}>
            <RolesDonut />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <UsersTrend />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={12}>
        <Grid container spacing={gridSpacing}>
          <Grid size={{ xs: 12 }}>
            <NewUsersByMonth />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
