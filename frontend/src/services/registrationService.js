import api from './api';

function toFormData(fields, files = {}) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    fd.append(key, value);
  });
  Object.entries(files).forEach(([key, value]) => {
    if (!value) return;
    fd.append(key, value);
  });
  return fd;
}

export const registrationService = {
  register: (fields, files) =>
    api.post('/registration', toFormData(fields, { payment_screenshot: files.paymentScreenshot })).then((r) => r.data),

  me: () => api.get('/registration/me').then((r) => r.data),
};
