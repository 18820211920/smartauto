import api from './http'

// 仓库管理API - 已对齐后端路由 /api/wh/*
export const warehouseApi = {
  // 仓库管理
  warehouse: {
    list: (params?: any) => api.get('/wh/warehouse/list', { params }),
    stats: () => api.get('/wh/warehouse/stats'),
    get: (id: number) => api.get(`/wh/warehouse/${id}`),
    create: (data: any) => api.post('/wh/warehouse/create', data),
    update: (id: number, data: any) => api.put(`/wh/warehouse/${id}/update`, data),
    delete: (id: number) => api.delete(`/wh/warehouse/${id}/delete`),
  },
  // 物料管理
  material: {
    list: (params?: any) => api.get('/wh/material/list', { params }),
    stats: () => api.get('/wh/material/stats'),
    get: (id: number) => api.get(`/wh/material/${id}`),
    create: (data: any) => api.post('/wh/material/create', data),
    update: (id: number, data: any) => api.put(`/wh/material/${id}/update`, data),
    delete: (id: number) => api.delete(`/wh/material/${id}/delete`),
  },
  // 库存管理
  stock: {
    list: (params?: any) => api.get('/wh/stock/list', { params }),
    stats: () => api.get('/wh/stock/stats'),
    check: () => api.get('/wh/stock/check'),
    adjust: (data: any) => api.post('/wh/stock/adjust', data),
  },
  // 入库管理
  instock: {
    list: (params?: any) => api.get('/wh/instock/list', { params }),
    stats: () => api.get('/wh/instock/stats'),
    get: (id: number) => api.get(`/wh/instock/${id}`),
    create: (data: any) => api.post('/wh/instock/create', data),
    update: (id: number, data: any) => api.put(`/wh/instock/${id}/update`, data),
  },
  // 出库管理
  outstock: {
    list: (params?: any) => api.get('/wh/outstock/list', { params }),
    stats: () => api.get('/wh/outstock/stats'),
    get: (id: number) => api.get(`/wh/outstock/${id}`),
    create: (data: any) => api.post('/wh/outstock/create', data),
    update: (id: number, data: any) => api.put(`/wh/outstock/${id}/update`, data),
  },
}

// 导出快捷方法
export const whStats = () => api.get('/wh/stats')
export const whStockCheck = () => api.get('/wh/stock/check')