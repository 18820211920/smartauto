import api from './http';

export const roleApi = {
  list: () => api.get('/role/list'),
  permissions: (roleId: number) => api.get(`/role/${roleId}/permissions`),
  dataScope: (roleId: number) => api.get(`/role/${roleId}/data-scope`),
};