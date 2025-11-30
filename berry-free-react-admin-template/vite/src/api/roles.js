import { http } from './http';

/**
 * Roles API Service
 * Provides methods for role management
 */

// List all roles
export function listRoles() {
  return http.get('/roles');
}

// Get a specific role by ID
export function getRole(id) {
  return http.get(`/roles/${id}`);
}

// Create a new role
export function createRole(roleData) {
  return http.post('/roles', roleData);
}

// Update a role
export function updateRole(id, { permissions }) {
  return http.put(`/roles/${id}`, { permissions });
}

// Delete a role
export function deleteRole(id) {
  return http.del(`/roles/${id}`);
}

export default {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
};
