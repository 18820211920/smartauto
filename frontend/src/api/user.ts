import api from './http';

export const userApi = {
  list: (params?: any) => api.get('/user/list', { params }),
  count: () => api.get('/user/count'),
  create: (data: any) => api.post('/user', data),
  getInfo: () => api.get('/user/info'),
  changePwd: (data: { oldPassword: string; newPassword: string }) => api.put('/user/password', data),
  freeze: (id: number) => api.post(`/user/${id}/freeze`),
};