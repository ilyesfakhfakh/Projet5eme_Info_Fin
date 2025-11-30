import { http } from './http';

export function listRoles() {
  return http.get('/roles');
}

export function getRole(id) {
  return http.get(`/roles/${id}`);
}

export function updateRole(id, { permissions }) {
  return http.put(`/roles/${id}`, { permissions });
}

export function deleteRole(id) {
  return http.del(`/roles/${id}`);
}

// Default export for compatibility with api/index.js
export default {
  listRoles,
  getRole,
  updateRole,
  deleteRole
};
