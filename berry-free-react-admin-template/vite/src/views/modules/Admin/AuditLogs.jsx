import { useEffect, useMemo, useState } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Pagination from '@mui/material/Pagination';
import { listAuditLogs } from 'api/audit';

export default function AuditLogsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function fetchData(params = {}) {
    setLoading(true);
    setError('');
    try {
      const res = await listAuditLogs({ q, page, pageSize, ...params });
      if (Array.isArray(res)) {
        setRows(res);
        setTotal(res.length);
      } else if (res && typeof res === 'object') {
        const items = Array.isArray(res.data) ? res.data : Array.isArray(res.items) ? res.items : [];
        const count = typeof res.total === 'number' ? res.total : Array.isArray(res.data) ? res.data.length : Array.isArray(res.items) ? res.items.length : 0;
        setRows(items);
        setTotal(count);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (e) {
      setRows([]);
      setTotal(0);
      setError(e?.message || 'Failed to load audit logs');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  return (
    <MainCard title="Audit Logs">
      <Box>
        <Stack sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }} direction="row">
          <TextField size="small" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="contained" onClick={() => { setPage(1); fetchData({ page: 1 }); }}>Search</Button>
        </Stack>

        {error && (
          <Box sx={{ mb: 2, color: 'error.main' }}>{error}</Box>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && rows.length > 0 && rows.map((r) => (
                <TableRow key={r.id || `${r.timestamp}-${r.user_id || ''}`} hover>
                  <TableCell>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</TableCell>
                  <TableCell>{r.user_name || r.username || r.user_id}</TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>{r.resource || r.entity}</TableCell>
                  <TableCell>{r.ip || r.ip_address}</TableCell>
                  <TableCell>{typeof r.details === 'string' ? r.details : JSON.stringify(r.details)}</TableCell>
                </TableRow>
              ))}
              {(!loading && rows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6}>No data</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack sx={{ mt: 2, alignItems: 'center' }}>
          <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Stack>
      </Box>
    </MainCard>
  );
}
