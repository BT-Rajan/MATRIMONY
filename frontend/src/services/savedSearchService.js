import api from './api';

export const savedSearchService = {
  list: () => api.get('/admin/saved-searches').then((r) => r.data),
  create: (name, filters) => api.post('/admin/saved-searches', { name, filters }).then((r) => r.data),
  remove: (id) => api.delete(`/admin/saved-searches/${id}`).then((r) => r.data),
};
