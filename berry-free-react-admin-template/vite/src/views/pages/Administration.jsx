import { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Pagination
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Lock,
  LockOpen,
  Visibility,
  Security,
  People,
  Assignment
} from '@mui/icons-material';

// API imports
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  setUserRoles,
  toggleTwoFactorAuth,
  updateUserSecurity
} from '../../api/users';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} from '../../api/roles';
import { listAuditLogs } from '../../api/audit';
import MainCard from '../../ui-component/cards/MainCard';

// ===========================|| ADMINISTRATION ||=========================== //

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Administration = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialog, setUserDialog] = useState(false);
  const [userDetailsDialog, setUserDetailsDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'NOVICE'
  });
  const [userPagination, setUserPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  // Roles state
  const [roles, setRoles] = useState([]);
  const [roleDialog, setRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState({
    role_name: '',
    permissions: []
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [tabValue, userPagination.page, auditPagination.page]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        await loadUsers();
      } else if (tabValue === 1) {
        await loadRoles();
      } else if (tabValue === 2) {
        await loadAuditLogs();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== USER MANAGEMENT =====
  const loadUsers = async () => {
    try {
      const data = await listUsers({
        page: userPagination.page,
        pageSize: userPagination.pageSize
      });
      setUsers(data.data || []);
      setUserPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      await createUser(newUser);
      setSuccess('User created successfully!');
      setUserDialog(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        user_type: 'NOVICE'
      });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setLoading(true);
      const user = await getUser(userId);
      setSelectedUser(user);
      setUserDetailsDialog(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteUser(userId);
      setSuccess('User deleted successfully!');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleLock = async (userId, isLocked) => {
    try {
      await updateUserSecurity(userId, { is_locked: !isLocked });
      setSuccess(`User ${!isLocked ? 'locked' : 'unlocked'} successfully!`);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle2FA = async (userId, enabled) => {
    try {
      await toggleTwoFactorAuth(userId, !enabled);
      setSuccess(`2FA ${!enabled ? 'enabled' : 'disabled'} successfully!`);
      if (selectedUser && selectedUser.user_id === userId) {
        setSelectedUser({ ...selectedUser, two_factor_enabled: !enabled });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== ROLE MANAGEMENT =====
  const loadRoles = async () => {
    try {
      const data = await listRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading roles:', err);
      setRoles([]);
    }
  };

  const handleCreateRole = async () => {
    try {
      setLoading(true);
      await createRole(newRole);
      setSuccess('Role created successfully!');
      setRoleDialog(false);
      setNewRole({ role_name: '', permissions: [] });
      await loadRoles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await deleteRole(roleId);
      setSuccess('Role deleted successfully!');
      await loadRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== AUDIT LOGS =====
  const loadAuditLogs = async () => {
    try {
      const data = await listAuditLogs({
        q: auditSearch,
        page: auditPagination.page,
        pageSize: auditPagination.pageSize
      });
      setAuditLogs(data.logs || []);
      setAuditPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setAuditLogs([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  return (
    <Grid container spacing={3}>
      {/* Header */}
      <Grid item xs={12}>
        <Typography variant="h2" gutterBottom>
          Administration
        </Typography>
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}
      </Grid>

      {/* Main Content */}
      <Grid item xs={12}>
        <MainCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="User Management" icon={<People />} iconPosition="start" />
              <Tab label="Roles & Permissions" icon={<Security />} iconPosition="start" />
              <Tab label="Audit Logs" icon={<Assignment />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* USERS TAB */}
          <TabPanel value={tabValue} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h3">User Management</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setUserDialog(true)}
              >
                New User
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>2FA</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Chip label={user.user_type} size="small" /></TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Active' : 'Inactive'}
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                        />
                        {user.is_locked && <Chip label="Locked" color="error" size="small" sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                          color={user.two_factor_enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewUser(user.user_id)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={user.is_locked ? 'success' : 'warning'}
                          onClick={() => handleToggleLock(user.user_id, user.is_locked)}
                        >
                          {user.is_locked ? <LockOpen /> : <Lock />}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={Math.ceil(userPagination.total / userPagination.pageSize)}
                page={userPagination.page}
                onChange={(e, page) => setUserPagination(prev => ({ ...prev, page }))}
                color="primary"
              />
            </Box>
          </TabPanel>

          {/* ROLES TAB */}
          <TabPanel value={tabValue} index={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h3">Roles & Permissions</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setRoleDialog(true)}
              >
                New Role
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Role Name</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.role_id}>
                      <TableCell>
                        <Typography variant="h4">{role.role_name}</Typography>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(role.permissions) 
                          ? role.permissions.map((perm, i) => (
                              <Chip key={i} label={perm} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))
                          : 'No permissions'
                        }
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRole(role.role_id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No roles found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* AUDIT LOGS TAB */}
          <TabPanel value={tabValue} index={2}>
            <Box mb={3}>
              <Typography variant="h3" gutterBottom>Audit Logs</Typography>
              <TextField
                fullWidth
                placeholder="Search logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadAuditLogs()}
              />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.log_id}>
                      <TableCell>
                        {new Date(log.timestamp || log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.user?.username || log.user_id}</TableCell>
                      <TableCell><Chip label={log.action} size="small" /></TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={log.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={Math.ceil(auditPagination.total / auditPagination.pageSize)}
                page={auditPagination.page}
                onChange={(e, page) => setAuditPagination(prev => ({ ...prev, page }))}
                color="primary"
              />
            </Box>
          </TabPanel>
        </MainCard>
      </Grid>

      {/* Create User Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newUser.first_name}
                onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newUser.last_name}
                onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  value={newUser.user_type}
                  label="User Type"
                  onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                >
                  <MenuItem value="NOVICE">Novice</MenuItem>
                  <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                  <MenuItem value="EXPERT">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDetailsDialog} onClose={() => setUserDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Username</Typography>
                <Typography variant="body1">{selectedUser.username}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                <Typography variant="body1">{selectedUser.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">User Type</Typography>
                <Typography variant="body1">{selectedUser.user_type}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip
                  label={selectedUser.is_active ? 'Active' : 'Inactive'}
                  color={selectedUser.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedUser.two_factor_enabled}
                      onChange={() => handleToggle2FA(selectedUser.user_id, selectedUser.two_factor_enabled)}
                    />
                  }
                  label="Two-Factor Authentication"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Roles</Typography>
                {selectedUser.roles?.map((role, i) => (
                  <Chip key={i} label={role.role_name} size="small" sx={{ mr: 0.5 }} />
                )) || <Typography variant="body2">No roles assigned</Typography>}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={newRole.role_name}
                onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Administration;
