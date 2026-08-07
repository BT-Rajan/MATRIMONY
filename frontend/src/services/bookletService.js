import api from './api';
import { toApiParams } from './adminMemberService';

export const bookletService = {
  fetch: (filters = {}) => api.get('/admin/members/booklet', { params: toApiParams(filters) }).then((r) => r.data),
};
