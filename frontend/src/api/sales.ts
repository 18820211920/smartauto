import api from './http'

// 客户管理API
export const customerApi = {
  list: (params?: { page?: number; pageSize?: number; name?: string; level?: string; status?: string }) =>
    api.get('/sales/customer/list', { params }),
  stats: () => api.get('/sales/customer/stats'),
  getById: (id: number) => api.get(`/sales/customer/${id}`),
  create: (data: any) => api.post('/sales/customer/create', data),
  update: (id: number, data: any) => api.put(`/sales/customer/${id}/update`, data),
  delete: (id: number) => api.delete(`/sales/customer/${id}/delete`),
}

// 商机管理API
export const businessApi = {
  list: (params?: { page?: number; pageSize?: number; name?: string; status?: string; priority?: string; stage?: string }) =>
    api.get('/sales/opportunity/list', { params }),
  stats: () => api.get('/sales/opportunity/stats'),
  getById: (id: number) => api.get(`/sales/opportunity/${id}`),
  create: (data: any) => api.post('/sales/opportunity/create', data),
  update: (id: number, data: any) => api.put(`/sales/opportunity/${id}/update`, data),
  delete: (id: number) => api.delete(`/sales/opportunity/${id}/delete`),
}

// 报价单API
export const quoteApi = {
  list: (params?: { page?: number; pageSize?: number; customer_id?: number; status?: string }) =>
    api.get('/sales/quote/list', { params }),
  stats: () => api.get('/sales/quote/stats'),
  getById: (id: number) => api.get(`/sales/quote/${id}`),
  create: (data: any) => api.post('/sales/quote/create', data),
  update: (id: number, data: any) => api.put(`/sales/quote/${id}/update`, data),
  updateStatus: (id: number, status: string) => api.put(`/sales/quote/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/sales/quote/${id}/delete`),
}

// 合同API
export const contractApi = {
  list: (params?: { page?: number; pageSize?: number; customer_id?: number; status?: string }) =>
    api.get('/sales/contract/list', { params }),
  stats: () => api.get('/sales/contract/stats'),
  getById: (id: number) => api.get(`/sales/contract/${id}`),
  create: (data: any) => api.post('/sales/contract/create', data),
  update: (id: number, data: any) => api.put(`/sales/contract/${id}/update`, data),
  delete: (id: number) => api.delete(`/sales/contract/${id}/delete`),
}

// 联系人管理API
export const contactApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; customer_id?: number }) =>
    api.get('/sales/contact/list', { params }),
  getById: (id: number) => api.get(`/sales/contact/${id}`),
  create: (data: any) => api.post('/sales/contact/create', data),
  update: (id: number, data: any) => api.put(`/sales/contact/${id}/update`, data),
  delete: (id: number) => api.delete(`/sales/contact/${id}/delete`),
}

// 项目管理API
export const projectApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string; name?: string }) =>
    api.get('/project/list', { params }),
  stats: () => api.get('/project/stats'),
  getById: (id: number) => api.get(`/project/${id}`),
  create: (data: any) => api.post('/project/create', data),
  update: (id: number, data: any) => api.put(`/project/${id}/update`, data),
  delete: (id: number) => api.delete(`/project/${id}/delete`),
};