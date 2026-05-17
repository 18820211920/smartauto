import api from './http'

// 采购管理API - 已对齐后端路由
export const purchaseApi = {
  // 供应商管理
  supplier: {
    list: (params?: any) => api.get('/pur/supplier/list', { params }),
    stats: () => api.get('/pur/supplier/stats'),
    get: (id: number) => api.get(`/pur/supplier/${id}`),
    create: (data: any) => api.post('/pur/supplier/create', data),
    update: (id: number, data: any) => api.put(`/pur/supplier/${id}/update`, data),
    delete: (id: number) => api.delete(`/pur/supplier/${id}/delete`),
  },
  // 采购申请
  request: {
    list: (params?: any) => api.get('/pur/request/list', { params }),
    stats: () => api.get('/pur/request/stats'),
    get: (id: number) => api.get(`/pur/request/${id}`),
    create: (data: any) => api.post('/pur/request/create', data),
    update: (id: number, data: any) => api.put(`/pur/request/${id}/update`, data),
    delete: (id: number) => api.delete(`/pur/request/${id}/delete`),
  },
  // 采购订单
  order: {
    list: (params?: any) => api.get('/pur/order/list', { params }),
    stats: () => api.get('/pur/order/stats'),
    get: (id: number) => api.get(`/pur/order/${id}`),
    create: (data: any) => api.post('/pur/order/create', data),
    update: (id: number, data: any) => api.put(`/pur/order/${id}/update`, data),
    delete: (id: number) => api.delete(`/pur/order/${id}/delete`),
  },
  // 采购入库
  receive: {
    list: (params?: any) => api.get('/pur/receive/list', { params }),
    get: (id: number) => api.get(`/pur/receive/${id}`),
    create: (data: any) => api.post('/pur/receive/create', data),
    update: (id: number, data: any) => api.put(`/pur/receive/${id}/update`, data),
  },
}