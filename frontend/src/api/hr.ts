import http from './http';
export const hrApi = {
  employee: {
    list: (params: any) => http.get('/hr/employee/list', { params }),
    create: (data: any) => http.post('/hr/employee', data),
    update: (id: number, data: any) => http.put('/hr/employee/' + id, data),
    delete: (id: number) => http.delete('/hr/employee/' + id),
  },
  attendance: {
    list: (params: any) => http.get('/hr/attendance/list', { params }),
    create: (data: any) => http.post('/hr/attendance', data),
    update: (id: number, data: any) => http.put('/hr/attendance/' + id, data),
    delete: (id: number) => http.delete('/hr/attendance/' + id),
  },
  salary: {
    list: (params: any) => http.get('/hr/salary/list', { params }),
    create: (data: any) => http.post('/hr/salary', data),
    update: (id: number, data: any) => http.put('/hr/salary/' + id, data),
    delete: (id: number) => http.delete('/hr/salary/' + id),
  },
};
