import http from './http';
export const finApi = {
  invoice: {
    list: (params: any) => http.get('/api/fin/invoice/list', { params }),
    create: (data: any) => http.post('/api/fin/invoice', data),
    update: (id: number, data: any) => http.put('/api/fin/invoice/' + id, data),
    delete: (id: number) => http.delete('/api/fin/invoice/' + id),
  },
  payment: {
    list: (params: any) => http.get('/api/fin/payment/list', { params }),
    create: (data: any) => http.post('/api/fin/payment', data),
    update: (id: number, data: any) => http.put('/api/fin/payment/' + id, data),
    delete: (id: number) => http.delete('/api/fin/payment/' + id),
  },
  expense: {
    list: (params: any) => http.get('/api/fin/expense/list', { params }),
    create: (data: any) => http.post('/api/fin/expense', data),
    update: (id: number, data: any) => http.put('/api/fin/expense/' + id, data),
    delete: (id: number) => http.delete('/api/fin/expense/' + id),
  },
};
