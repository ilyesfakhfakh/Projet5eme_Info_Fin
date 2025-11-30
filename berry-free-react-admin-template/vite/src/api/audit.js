import { http } from './http';

/**
 * Audit Logs API Service
 * Provides methods for retrieving audit logs
 */

// List audit logs with pagination and search
export async function listAuditLogs({ q = '', page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return http.get(`/admin/audit-logs?${params.toString()}`);
}

// Get audit logs for a specific user
export async function getUserAuditLogs(userId, params = {}) {
  return http.get(`/users/${userId}/audit-logs`, { params });
}

export default {
  listAuditLogs,
  getUserAuditLogs
};
