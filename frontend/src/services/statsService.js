import api from './api';

export const statsService = {
  overview: () => api.get('/admin/stats/overview').then((r) => r.data),
  trend: (period) => api.get('/admin/stats/trend', { params: { period } }).then((r) => r.data),
  payments: () => api.get('/admin/stats/payments').then((r) => r.data),
};
