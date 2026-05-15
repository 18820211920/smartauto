import http from './http';
export const logisticsApi = {
  delivery: {
    list: (params: any) => http.get('/api/logis/delivery/list', { params }),
    get: (id: number) => http.get('/api/logis/delivery/' + id),
    create: (data: any) => http.post('/api/logis/delivery', data),
    update: (id: number, data: any) => http.put('/api/logis/delivery/' + id, data),
    delete: (id: number) => http.delete('/api/logis/delivery/' + id),
  },
  installation: {
    list: (params: any) => http.get('/api/logis/installation/list', { params }),
    create: (data: any) => http.post('/api/logis/installation', data),
    update: (id: number, data: any) => http.put('/api/logis/installation/' + id, data),
    delete: (id: number) => http.delete('/api/logis/installation/' + id),
  },
};
