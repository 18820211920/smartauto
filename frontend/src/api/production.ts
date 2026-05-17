import api from './http'

// 生产管理API - 已对齐后端路由
export const productionApi = {
  // 工单管理
  workorder: {
    list: (params?: any) => api.get('/prod/workorder/list', { params }),
    stats: () => api.get('/prod/workorder/stats'),
    get: (id: number) => api.get(`/prod/workorder/${id}`),
    create: (data: any) => api.post('/prod/workorder/create', data),
    update: (id: number, data: any) => api.put(`/prod/workorder/${id}/update`, data),
    delete: (id: number) => api.delete(`/prod/workorder/${id}/delete`),
  },
  // 工序管理
  process: {
    list: (params?: any) => api.get('/prod/process/list', { params }),
    get: (id: number) => api.get(`/prod/process/${id}`),
    create: (data: any) => api.post('/prod/process/create', data),
    update: (id: number, data: any) => api.put(`/prod/process/${id}/update`, data),
    delete: (id: number) => api.delete(`/prod/process/${id}/delete`),
  },
  // 报工管理
  report: {
    list: (params?: any) => api.get('/prod/report/list', { params }),
    stats: () => api.get('/prod/report/stats'),
    get: (id: number) => api.get(`/prod/report/${id}`),
    create: (data: any) => api.post('/prod/report/create', data),
    approve: (id: number, data: any) => api.put(`/prod/report/${id}/approve`, data),
  },
  // 排产管理
  schedule: {
    list: (params?: any) => api.get('/prod/schedule/list', { params }),
    get: (id: number) => api.get(`/prod/schedule/${id}`),
    create: (data: any) => api.post('/prod/schedule/create', data),
    update: (id: number, data: any) => api.put(`/prod/schedule/${id}/update`, data),
  },
}

// 导出stats快捷方法
export const prodStats = () => api.get('/prod/stats')