import http from './http';
export const logisticsApi = {
  delivery: {
    list: (params: any) => http.get('/logis/delivery/list', { params }),
    get: (id: number) => http.get('/logis/delivery/' + id),
    create: (data: any) => http.post('/logis/delivery', data),
    update: (id: number, data: any) => http.put('/logis/delivery/' + id, data),
    delete: (id: number) => http.delete('/logis/delivery/' + id),
  },
  installation: {
    list: (params: any) => http.get('/logis/installation/list', { params }),
    create: (data: any) => http.post('/logis/installation', data),
    update: (id: number, data: any) => http.put('/logis/installation/' + id, data),
    delete: (id: number) => http.delete('/logis/installation/' + id),
  },
};
