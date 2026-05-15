import http from './http';

export const purchaseApi = {
  // 供应商管理
  supplier: {
    list: (params: any) => http.get('/api/purchase/supplier/list', { params }),
    get: (id: number) => http.get('/api/purchase/supplier/' + id),
    create: (data: any) => http.post('/api/purchase/supplier', data),
    update: (id: number, data: any) => http.put('/api/purchase/supplier/' + id, data),
    delete: (id: number) => http.delete('/api/purchase/supplier/' + id),
  },
  // 采购申请
  request: {
    list: (params: any) => http.get('/api/purchase/request/list', { params }),
    get: (id: number) => http.get('/api/purchase/request/' + id),
    create: (data: any) => http.post('/api/purchase/request', data),
    update: (id: number, data: any) => http.put('/api/purchase/request/' + id, data),
    delete: (id: number) => http.delete('/api/purchase/request/' + id),
  },
  // 采购订单
  order: {
    list: (params: any) => http.get('/api/purchase/order/list', { params }),
    get: (id: number) => http.get('/api/purchase/order/' + id),
    create: (data: any) => http.post('/api/purchase/order', data),
    update: (id: number, data: any) => http.put('/api/purchase/order/' + id, data),
    delete: (id: number) => http.delete('/api/purchase/order/' + id),
  },
  // 采购入库
  receive: {
    list: (params: any) => http.get('/api/purchase/receive/list', { params }),
    get: (id: number) => http.get('/api/purchase/receive/' + id),
    create: (data: any) => http.post('/api/purchase/receive', data),
    update: (id: number, data: any) => http.put('/api/purchase/receive/' + id, data),
    delete: (id: number) => http.delete('/api/purchase/receive/' + id),
  },
};
