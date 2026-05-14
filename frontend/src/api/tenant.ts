import api from './http';

export const tenantApi = {
  getInfo: () => api.get('/tenant/info'),
  update: (data: any) => api.put('/tenant', data),
  list: () => api.get('/tenant/list'),
  create: (data: any) => api.post('/tenant', data),
  freeze: (id: number, action: string) => api.post('/tenant/freeze', { id, action }),
};

export const packageApi = {
  list: () => api.get('/package/list'),
  get: (id: number) => api.get(`/package/${id}`),
  all: () => api.get('/package/all'),
};