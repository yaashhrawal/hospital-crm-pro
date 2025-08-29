import axios from 'axios';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },

  async logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  async getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async validateToken() {
    try {
      const response = await api.get('/auth/validate');
      return response.data.valid;
    } catch {
      return false;
    }
  }
};

// Patient Service
export const patientService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get('/patients', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/patients', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

  async getHistory(id: string) {
    const response = await api.get(`/patients/${id}/history`);
    return response.data;
  }
};

// Doctor Service
export const doctorService = {
  async getAll() {
    const response = await api.get('/doctors');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/doctors', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/doctors/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/doctors/${id}`);
    return response.data;
  }
};

// Transaction Service
export const transactionService = {
  async getAll(params?: { patient_id?: string; date_from?: string; date_to?: string }) {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  async getDailyReport(date: string) {
    const response = await api.get(`/transactions/daily-report/${date}`);
    return response.data;
  }
};

// Bed Service
export const bedService = {
  async getAll(params?: { status?: string; department?: string }) {
    const response = await api.get('/beds', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/beds/${id}`);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/beds/${id}`, data);
    return response.data;
  },

  async assignPatient(bedId: string, patientId: string) {
    const response = await api.post(`/beds/${bedId}/assign`, { patient_id: patientId });
    return response.data;
  },

  async releasePatient(bedId: string) {
    const response = await api.post(`/beds/${bedId}/release`);
    return response.data;
  }
};

// Dashboard Service
export const dashboardService = {
  async getStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  async getRevenueData(period: 'day' | 'week' | 'month' | 'year') {
    const response = await api.get(`/dashboard/revenue/${period}`);
    return response.data;
  },

  async getOccupancyData() {
    const response = await api.get('/dashboard/occupancy');
    return response.data;
  },

  async getTransactionSummary(date?: string) {
    const response = await api.get('/dashboard/transactions', { params: { date } });
    return response.data;
  }
};

// Department Service
export const departmentService = {
  async getAll() {
    const response = await api.get('/departments');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  }
};

// Export the configured API instance
export default api;