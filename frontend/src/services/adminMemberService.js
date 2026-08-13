import api from './api';

const FILTER_KEYS = [
  'search', 'registrationNumber', 'status', 'gender', 'isVerified',
  'educationId', 'occupationId', 'starId', 'rasiId', 'nativePlace', 'phone',
  'email', 'ageMin', 'ageMax', 'heightMin', 'heightMax', 'participating',
];

const CAMEL_TO_SNAKE = {
  registrationNumber: 'registration_number', isVerified: 'is_verified',
  educationId: 'education_id', occupationId: 'occupation_id',
  starId: 'star_id', rasiId: 'rasi_id', nativePlace: 'native_place',
  ageMin: 'age_min', ageMax: 'age_max', heightMin: 'height_min', heightMax: 'height_max',
};

export function toApiParams(filters) {
  const params = {};
  FILTER_KEYS.forEach((key) => {
    const value = filters[key];
    if (value === undefined || value === null || value === '') return;
    params[CAMEL_TO_SNAKE[key] || key] = value;
  });
  return params;
}

export const adminMemberService = {
  list: (filters = {}, page = 1, perPage = 20) =>
    api.get('/admin/members', { params: { ...toApiParams(filters), page, per_page: perPage } }).then((r) => r.data),

  show: (id) => api.get(`/admin/members/${id}`).then((r) => r.data),
  approve: (id) => api.post(`/admin/members/${id}/approve`).then((r) => r.data),
  reject: (id, reason) => api.post(`/admin/members/${id}/reject`, { reason }).then((r) => r.data),
  verify: (id) => api.post(`/admin/members/${id}/verify`).then((r) => r.data),
  unverify: (id) => api.post(`/admin/members/${id}/unverify`).then((r) => r.data),
  deactivate: (id) => api.post(`/admin/members/${id}/deactivate`).then((r) => r.data),
  reactivate: (id) => api.post(`/admin/members/${id}/reactivate`).then((r) => r.data),
  archive: (id) => api.post(`/admin/members/${id}/archive`).then((r) => r.data),
  remove: (id) => api.delete(`/admin/members/${id}`).then((r) => r.data),
  update: (id, fields) => api.put(`/admin/members/${id}`, fields).then((r) => r.data),

  // Streams a CSV. Uses axios (not a plain <a href>) so the Authorization
  // header goes along with the request; triggers a browser download from
  // the returned blob.
  exportCsv: async (filters = {}) => {
    const response = await api.get('/admin/members/export', {
      params: toApiParams(filters),
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
