import http from './http';
export const acceptApi = {
  list: (params: any) => http.get('/api/accept/list', { params }),
  get: (id: number) => http.get('/api/accept/' + id),
  create: (data: any) => http.post('/api/accept', data),
  update: (id: number, data: any) => http.put('/api/accept/' + id, data),
  delete: (id: number) => http.delete('/api/accept/' + id),
};
