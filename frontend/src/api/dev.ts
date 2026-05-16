import api from './http'

// 版本管理API
export const versionApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) =>
    api.get('/api/dev/version', { params }),
  getById: (id: number) => api.get('/api/dev/version/' + id),
  create: (data: any) => api.post('/api/dev/version', data),
  update: (id: number, data: any) => api.put('/api/dev/version/' + id, data),
  delete: (id: number) => api.delete('/api/dev/version/' + id),
}

// 沟通记录API
export const commApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; type?: string }) =>
    api.get('/api/dev/comm', { params }),
  getById: (id: number) => api.get('/api/dev/comm/' + id),
  create: (data: any) => api.post('/api/dev/comm', data),
  update: (id: number, data: any) => api.put('/api/dev/comm/' + id, data),
  delete: (id: number) => api.delete('/api/dev/comm/' + id),
}

// 功能确认API
export const confirmApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) =>
    api.get('/api/dev/confirm', { params }),
  getById: (id: number) => api.get('/api/dev/confirm/' + id),
  create: (data: any) => api.post('/api/dev/confirm', data),
  update: (id: number, data: any) => api.put('/api/dev/confirm/' + id, data),
  delete: (id: number) => api.delete('/api/dev/confirm/' + id),
  addCheck: (confirmId: number, data: any) => api.post('/api/dev/confirm/' + confirmId + '/check', data),
  updateCheck: (confirmId: number, checkId: number, data: any) =>
    api.put('/api/dev/confirm/' + confirmId + '/check/' + checkId, data),
  deleteCheck: (confirmId: number, checkId: number) =>
    api.delete('/api/dev/confirm/' + confirmId + '/check/' + checkId),
}

// 统计API
export const devStatsApi = {
  get: () => api.get('/api/dev/stats'),
}
