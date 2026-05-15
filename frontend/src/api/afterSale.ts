import http from './http';
export const afterSaleApi = {
  order: {
    list: (params: any) => http.get('/api/after/order/list', { params }),
    create: (data: any) => http.post('/api/after/order', data),
    update: (id: number, data: any) => http.put('/api/after/order/' + id, data),
    delete: (id: number) => http.delete('/api/after/order/' + id),
  },
  maintenance: {
    list: (params: any) => http.get('/api/after/maintenance/list', { params }),
    create: (data: any) => http.post('/api/after/maintenance', data),
    update: (id: number, data: any) => http.put('/api/after/maintenance/' + id, data),
    delete: (id: number) => http.delete('/api/after/maintenance/' + id),
  },
};
