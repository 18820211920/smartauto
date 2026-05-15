import api from './http'

// 产品管理API
export const productApi = {
  list: (params?: { page?: number; pageSize?: number; name?: string; type?: string; status?: string }) =>
    api.get('/api/rnd/product/list', { params }),
  stats: () => api.get('/api/rnd/product/stats'),
  getById: (id: number) => api.get(`/api/rnd/product/${id}`),
  create: (data: any) => api.post('/api/rnd/product', data),
  update: (id: number, data: any) => api.put(`/api/rnd/product/${id}`, data),
  delete: (id: number) => api.delete(`/api/rnd/product/${id}`),
}

// BOM管理API
export const bomApi = {
  list: (params?: { page?: number; pageSize?: number; product_id?: number; status?: string }) =>
    api.get('/api/rnd/bom/list', { params }),
  getById: (id: number) => api.get(`/api/rnd/bom/${id}`),
  create: (data: any) => api.post('/api/rnd/bom', data),
  update: (id: number, data: any) => api.put(`/api/rnd/bom/${id}`, data),
  addItem: (bomId: number, data: any) => api.post(`/api/rnd/bom/${bomId}/item`, data),
  deleteItem: (bomId: number, itemId: number) => api.delete(`/api/rnd/bom/${bomId}/item/${itemId}`),
}

// 图纸管理API
export const drawingApi = {
  list: (params?: { page?: number; pageSize?: number; product_id?: number; type?: string; status?: string }) =>
    api.get('/api/rnd/drawing/list', { params }),
  create: (data: any) => api.post('/api/rnd/drawing', data),
  updateStatus: (id: number, status: string) => api.put(`/api/rnd/drawing/${id}/status`, { status }),
}

// 设计任务API
export const taskApi = {
  list: (params?: { page?: number; pageSize?: number; product_id?: number; status?: string; priority?: string }) =>
    api.get('/api/rnd/task/list', { params }),
  stats: () => api.get('/api/rnd/task/stats'),
  getById: (id: number) => api.get(`/api/rnd/task/${id}`),
  create: (data: any) => api.post('/api/rnd/task', data),
  update: (id: number, data: any) => api.put(`/api/rnd/task/${id}`, data),
  delete: (id: number) => api.delete(`/api/rnd/task/${id}`),
}
