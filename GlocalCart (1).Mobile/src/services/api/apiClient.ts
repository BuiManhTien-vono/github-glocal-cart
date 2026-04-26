import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5100/api'
  : 'http://192.168.0.103:5100/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Tự động gắn JWT Token ───
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Xử lý lỗi chung ───
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Token hết hạn → logout sẽ do AuthContext xử lý
      if (status === 401) {
        if (error.config?.url?.includes('/auth/login')) {
          return Promise.reject({ message: data?.message || 'Tài khoản hoặc mật khẩu không chính xác.', status });
        }
        return Promise.reject({ message: 'Phiên đăng nhập hết hạn.', status: 401 });
      }

      return Promise.reject({
        message: data?.message || data?.error || `Lỗi từ máy chủ (${status})`,
        status,
      });
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ message: 'Kết nối quá thời gian. Thử lại sau.' });
    }

    return Promise.reject({ message: 'Không thể kết nối máy chủ. Kiểm tra mạng hoặc Backend.' });
  }
);

export default apiClient;
