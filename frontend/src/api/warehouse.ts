import http from './http';

export const warehouseApi = {
  // 仓库管理
  warehouse: {
    list: (params: any) => http.get('/api/warehouse/warehouse/list', { params }),
    get: (id: number) => http.get('/api/warehouse/warehouse/' + id),
    create: (data: any) => http.post('/api/warehouse/warehouse', data),
    update: (id: number, data: any) => http.put('/api/warehouse/warehouse/' + id, data),
    delete: (id: number) => http.delete('/api/warehouse/warehouse/' + id),
  },
  // 物料管理
  material: {
    list: (params: any) => http.get('/api/warehouse/material/list', { params }),
    get: (id: number) => http.get('/api/warehouse/material/' + id),
    create: (data: any) => http.post('/api/warehouse/material', data),
    update: (id: number, data: any) => http.put('/api/warehouse/material/' + id, data),
    delete: (id: number) => http.delete('/api/warehouse/material/' + id),
  },
  // 库存管理
  stock: {
    list: (params: any) => http.get('/api/warehouse/stock/list', { params }),
    stats: () => http.get('/api/warehouse/stock/stats'),
    adjust: (data: any) => http.post('/api/warehouse/stock/adjust', data),
  },
  // 出库管理
  out: {
    list: (params: any) => http.get('/api/warehouse/out/list', { params }),
    create: (data: any) => http.post('/api/warehouse/out', data),
    update: (id: number, data: any) => http.put('/api/warehouse/out/' + id, data),
  },
};
