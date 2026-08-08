import api from './api';

export const notificationService = {
  list: ({ memberId, channel, status, eventType, page = 1, perPage = 20 } = {}) =>
    api
      .get('/admin/notifications', { params: { member_id: memberId, channel, status, event_type: eventType, page, per_page: perPage } })
      .then((r) => r.data),
  counts: () => api.get('/admin/notifications/counts').then((r) => r.data),
  channelStatus: () => api.get('/admin/notifications/channel-status').then((r) => r.data),
};
