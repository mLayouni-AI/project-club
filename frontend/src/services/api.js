import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 5000, // Reduced timeout to 5 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    
    // Add more descriptive error information
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - server not responding';
    } else if (error.message?.includes('Network Error')) {
      error.message = 'Network error - check if backend server is running';
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (userData) => api.post('/members/auth/signup/', userData),
  login: (credentials) => api.post('/members/auth/login/', credentials),
  me: () => api.get('/members/auth/me/'),
};

// Members endpoints
export const membersAPI = {
  getAll: () => api.get('/members/'),
  getById: (id) => api.get(`/members/${id}/`),
  create: (data) => api.post('/members/', data),
  update: (id, data) => api.put(`/members/${id}/`, data),
  delete: (id) => api.delete(`/members/${id}/`),
};

// Projects endpoints
export const projectsAPI = {
  getAll: () => api.get('/projects/'),
  getById: (id) => api.get(`/projects/${id}/`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.put(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
};



export default api;