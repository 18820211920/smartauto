import http from './http';

export const productionApi = {
  // 工单管理
  workorder: {
    list: (params: any) => http.get('/api/prod/workorder/list', { params }),
    get: (id: number) => http.get('/api/prod/workorder/' + id),
    create: (data: any) => http.post('/api/prod/workorder', data),
    update: (id: number, data: any) => http.put('/api/prod/workorder/' + id, data),
    delete: (id: number) => http.delete('/api/prod/workorder/' + id),
  },
  // 工序管理
  process: {
    list: (params: any) => http.get('/api/prod/process/list', { params }),
    create: (data: any) => http.post('/api/prod/process', data),
    update: (id: number, data: any) => http.put('/api/prod/process/' + id, data),
  },
  // 报工管理
  report: {
    list: (params: any) => http.get('/api/prod/report/list', { params }),
    create: (data: any) => http.post('/api/prod/report', data),
    approve: (id: number, data: any) => http.put('/api/prod/report/' + id + '/approve', data),
  },
  // 排产管理
  schedule: {
    list: (params: any) => http.get('/api/prod/schedule/list', { params }),
    create: (data: any) => http.post('/api/prod/schedule', data),
    update: (id: number, data: any) => http.put('/api/prod/schedule/' + id, data),
  },
  // 统计
  stats: () => http.get('/api/prod/stats'),
};
