import api from './http'

// 客户管理API
export const customerApi = {
  list: (params?: { page?: number; pageSize?: number; name?: string; level?: string; status?: string }) =>
    api.get('/api/sales/customer/list', { params }),
  stats: () => api.get('/api/sales/customer/stats'),
  getById: (id: number) => api.get(`/api/sales/customer/${id}`),
  create: (data: any) => api.post('/api/sales/customer', data),
  update: (id: number, data: any) => api.put(`/api/sales/customer/${id}`, data),
  delete: (id: number) => api.delete(`/api/sales/customer/${id}`),
}

// 商机管理API
export const businessApi = {
  list: (params?: { page?: number; pageSize?: number; name?: string; status?: string; priority?: string }) =>
    api.get('/api/sales/business/list', { params }),
  getById: (id: number) => api.get(`/api/sales/business/${id}`),
  create: (data: any) => api.post('/api/sales/business', data),
  update: (id: number, data: any) => api.put(`/api/sales/business/${id}`, data),
  delete: (id: number) => api.delete(`/api/sales/business/${id}`),
}

// 报价单API
export const quoteApi = {
  list: (params?: { page?: number; pageSize?: number; customer_id?: number; status?: string }) =>
    api.get('/api/sales/quote/list', { params }),
  create: (data: any) => api.post('/api/sales/quote', data),
  update: (id: number, data: any) => api.put(`/api/sales/quote/${id}`, data),
}

// 合同API
export const contractApi = {
  list: (params?: { page?: number; pageSize?: number; customer_id?: number; status?: string }) =>
    api.get('/api/sales/contract/list', { params }),
  create: (data: any) => api.post('/api/sales/contract', data),
  update: (id: number, data: any) => api.put(`/api/sales/contract/${id}`, data),
}

