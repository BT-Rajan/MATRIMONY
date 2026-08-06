import api from './api';

function toFormData(fields, files = {}) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    fd.append(key, value);
  });
  Object.entries(files).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((f) => f && fd.append(`${key}[]`, f));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}

export const registrationService = {
  step1: (fields, files) =>
    api
      .post('/registration/step1', toFormData(fields, { photo: files.photo, id_proof: files.idProof, additional_photos: files.additionalPhotos }))
      .then((r) => r.data),

  step2: (fields, files) =>
    api
      .post('/registration/step2', toFormData(fields, { horoscope_document: files.horoscopeDocument }))
      .then((r) => r.data),

  step3: (fields, files) =>
    api
      .post('/registration/step3', toFormData(fields, { family_photo: files.familyPhoto }))
      .then((r) => r.data),

  step4: (fields) => api.put('/registration/step4', fields).then((r) => r.data),

  step5: (fields, files) =>
    api
      .post('/registration/step5', toFormData(fields, { receipt: files.receipt }))
      .then((r) => r.data),

  me: () => api.get('/registration/me').then((r) => r.data),
};
