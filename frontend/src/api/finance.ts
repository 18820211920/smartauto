import http from './http';
export const finApi = {
  invoice: {
    list: (params: any) => http.get('/fin/invoice/list', { params }),
    create: (data: any) => http.post('/fin/invoice', data),
    update: (id: number, data: any) => http.put('/fin/invoice/' + id, data),
    delete: (id: number) => http.delete('/fin/invoice/' + id),
  },
  payment: {
    list: (params: any) => http.get('/fin/payment/list', { params }),
    create: (data: any) => http.post('/fin/payment', data),
    update: (id: number, data: any) => http.put('/fin/payment/' + id, data),
    delete: (id: number) => http.delete('/fin/payment/' + id),
  },
  expense: {
    list: (params: any) => http.get('/fin/expense/list', { params }),
    create: (data: any) => http.post('/fin/expense', data),
    update: (id: number, data: any) => http.put('/fin/expense/' + id, data),
    delete: (id: number) => http.delete('/fin/expense/' + id),
  },
};
