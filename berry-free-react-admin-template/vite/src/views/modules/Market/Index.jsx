import MainCard from 'ui-component/cards/MainCard';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

export default function MarketPage() {
    const [name, setName] = useState('Yosri Raboudi');
  return (
    <MainCard title="Market">
      <Typography variant="body1">{name} is a placeholder for Market module. Hook charts/tables to market endpoints here.</Typography>
    </MainCard>
  );
}
