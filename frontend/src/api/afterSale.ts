import http from './http';
export const afterSaleApi = {
  order: {
    list: (params: any) => http.get('/after/order/list', { params }),
    create: (data: any) => http.post('/after/order', data),
    update: (id: number, data: any) => http.put('/after/order/' + id, data),
    delete: (id: number) => http.delete('/after/order/' + id),
  },
  maintenance: {
    list: (params: any) => http.get('/after/maintenance/list', { params }),
    create: (data: any) => http.post('/after/maintenance', data),
    update: (id: number, data: any) => http.put('/after/maintenance/' + id, data),
    delete: (id: number) => http.delete('/after/maintenance/' + id),
  },
};
