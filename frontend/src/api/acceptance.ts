import http from './http';
export const acceptApi = {
  list: (params: any) => http.get('/api/v1/accept/list', { params }),
  get: (id: number) => http.get('/api/v1/accept/' + id),
  create: (data: any) => http.post('/api/v1/accept', data),
  update: (id: number, data: any) => http.put('/api/v1/accept/' + id, data),
  delete: (id: number) => http.delete('/api/v1/accept/' + id),
};
