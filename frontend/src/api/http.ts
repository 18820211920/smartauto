import axios from 'axios'

const api = axios.create({
  baseURL: '/smartauto-api',
  timeout: 15000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('smartauto-auth')
  if (token) {
    try {
      const stored = JSON.parse(token)
      if (stored.state?.token) {
        config.headers.Authorization = `Bearer ${stored.state.token}`
      }
    } catch (_) {}
  }
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || err.message
    return Promise.reject(new Error(msg))
  }
)

export const http = api
export default api
