import { http } from './http';

export async function listAuditLogs({ q = '', page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return http.get(`/admin/audit-logs?${params.toString()}`);
}
