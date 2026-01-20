import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5659/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Settlements API
export const settlementsApi = {
  getList: (params?: any) => api.get('/v1/settlements', { params }),
  getDetail: (id: number) => api.get(`/v1/settlements/${id}`),
  create: (data: any) => api.post('/v1/settlements', data),
  calculate: (id: number) => api.patch(`/v1/settlements/${id}/calculate`),
  confirm: (id: number) => api.patch(`/v1/settlements/${id}/confirm`),
  pay: (id: number) => api.patch(`/v1/settlements/${id}/pay`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/v1/settlements/${id}/status`, { status }),

  // 스케줄 관련 API
  getSchedule: () => api.get('/v1/settlements/schedule'),
  getAllSchedules: () => api.get('/v1/settlements/schedules'),
  createSchedule: (data: any) => api.post('/v1/settlements/schedule', data),
  updateSchedule: (id: number, data: any) =>
    api.patch(`/v1/settlements/schedule/${id}`, data),
  deleteSchedule: (id: number) => api.delete(`/v1/settlements/schedule/${id}`),

  // 수동 정산 관련 API
  createManual: (data: any) => api.post('/v1/settlements/manual', data),
  checkOverlap: (startDate: string, endDate: string) =>
    api.post('/v1/settlements/check-overlap', { startDate, endDate }),
  validateDate: (startDate: string) =>
    api.get('/v1/settlements/validate-date', { params: { startDate } }),
};

export default api;
