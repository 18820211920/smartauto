import api from './http'

// 产品管理API
export const productApi = {
  list: (params?: { page?: number; pageSize?: number; name?: string; type?: string; status?: string }) =>
    api.get('/rnd/product/list', { params }),
  stats: () => api.get('/rnd/product/stats'),
  getById: (id: number) => api.get(`/rnd/product/${id}`),
  create: (data: any) => api.post('/rnd/product', data),
  update: (id: number, data: any) => api.put(`/rnd/product/${id}`, data),
  delete: (id: number) => api.delete(`/rnd/product/${id}`),
}

// BOM管理API
export const bomApi = {
  list: (params?: { page?: number; pageSize?: number; product_id?: number; status?: string }) =>
    api.get('/rnd/bom/list', { params }),
  getById: (id: number) => api.get(`/rnd/bom/${id}`),
  create: (data: any) => api.post('/rnd/bom', data),
  update: (id: number, data: any) => api.put(`/rnd/bom/${id}`, data),
  addItem: (bomId: number, data: any) => api.post(`/rnd/bom/${bomId}/item`, data),
  deleteItem: (bomId: number, itemId: number) => api.delete(`/rnd/bom/${bomId}/item/${itemId}`),
}

// 图纸管理API
export const drawingApi = {
  list: (params?: { page?: number; pageSize?: number; product_id?: number; type?: string; status?: string }) =>
    api.get('/rnd/drawing/list', { params }),
  create: (data: any) => api.post('/rnd/drawing', data),
  updateStatus: (id: number, status: string) => api.put(`/rnd/drawing/${id}/status`, { status }),
}

// 设计任务API
export const taskApi = {
  list: (params?: { page?: number; pageSize?: number; product_id?: number; status?: string; priority?: string }) =>
    api.get('/rnd/task/list', { params }),
  stats: () => api.get('/rnd/task/stats'),
  getById: (id: number) => api.get(`/rnd/task/${id}`),
  create: (data: any) => api.post('/rnd/task', data),
  update: (id: number, data: any) => api.put(`/rnd/task/${id}`, data),
  delete: (id: number) => api.delete(`/rnd/task/${id}`),
}
