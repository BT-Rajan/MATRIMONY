import api from './api';

export const adminMemberService = {
  list: ({ search, status, gender, isVerified, religionId, districtId, page = 1, perPage = 20 } = {}) =>
    api
      .get('/admin/members', {
        params: {
          search,
          status,
          gender,
          is_verified: isVerified,
          religion_id: religionId,
          district_id: districtId,
          page,
          per_page: perPage,
        },
      })
      .then((r) => r.data),

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
};
