import api from './api';

export const masterService = {
  list: (slug, { search, parentId, page = 1, perPage = 20 } = {}) =>
    api
      .get(`/masters/${slug}`, { params: { search, parent_id: parentId, page, per_page: perPage } })
      .then((r) => r.data),

  create: (slug, payload) => api.post(`/masters/${slug}`, payload).then((r) => r.data),

  update: (slug, id, payload) => api.put(`/masters/${slug}/${id}`, payload).then((r) => r.data),

  remove: (slug, id) => api.delete(`/masters/${slug}/${id}`).then((r) => r.data),

  // Fetch ALL active rows of a simple/hierarchical master, for use as a
  // <Select> options source (e.g. Religion list when creating a Caste).
  // Uses a large per_page rather than a separate "options" endpoint.
  options: (slug, parentId) =>
    api
      .get(`/masters/${slug}`, { params: { per_page: 500, parent_id: parentId } })
      .then((r) => r.data.data.items),
};
