import http from './http';
export const hrApi = {
  employee: {
    list: (params: any) => http.get('/api/hr/employee/list', { params }),
    create: (data: any) => http.post('/api/hr/employee', data),
    update: (id: number, data: any) => http.put('/api/hr/employee/' + id, data),
    delete: (id: number) => http.delete('/api/hr/employee/' + id),
  },
  attendance: {
    list: (params: any) => http.get('/api/hr/attendance/list', { params }),
    create: (data: any) => http.post('/api/hr/attendance', data),
    update: (id: number, data: any) => http.put('/api/hr/attendance/' + id, data),
    delete: (id: number) => http.delete('/api/hr/attendance/' + id),
  },
  salary: {
    list: (params: any) => http.get('/api/hr/salary/list', { params }),
    create: (data: any) => http.post('/api/hr/salary', data),
    update: (id: number, data: any) => http.put('/api/hr/salary/' + id, data),
    delete: (id: number) => http.delete('/api/hr/salary/' + id),
  },
};
