import api from './api';

export const authService = {
  loginMember: (payload) => api.post('/auth/member/login', payload).then((r) => r.data),
  loginAdmin: (payload) => api.post('/auth/admin/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};
