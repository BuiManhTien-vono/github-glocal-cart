import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItem } from '../../utils/secureStore';

import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:5100/api'
  : 'http://192.168.1.6:5100/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Tự động gắn JWT Token ───
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getSecureItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Khi gửi FormData (upload ảnh), set Content-Type = multipart/form-data
      // React Native networking layer sẽ tự thêm boundary
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    } catch { }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Xử lý chuẩn ApiResponse<T> ───
// Backend trả về: { success, message, data, statusCode }
// Interceptor sẽ:
//   - Success (2xx): trả về response.data (unwrap ApiResponse wrapper)
//   - Error (4xx/5xx): reject với { message, status } từ ApiResponse
apiClient.interceptors.response.use(
  (response) => {
    const apiResponse = response.data;

    // Nếu backend trả ApiResponse chuẩn → unwrap lấy .data bên trong
    if (apiResponse && typeof apiResponse.success === 'boolean' && 'data' in apiResponse) {
      // Gắn thêm _meta để screen nào cần message/success vẫn đọc được
      const result = apiResponse.data;
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        result._meta = { success: apiResponse.success, message: apiResponse.message, statusCode: apiResponse.statusCode };
      }
      return result;
    }

    // Fallback: trả nguyên data (cho trường hợp response không phải ApiResponse)
    return apiResponse;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      // Backend lỗi cũng trả ApiResponse: { success: false, message, data: null, statusCode }
      const message = data?.message || data?.error || `Lỗi từ máy chủ (${status})`;

      // Token hết hạn → logout sẽ do AuthContext xử lý
      if (status === 401) {
        if (error.config?.url?.includes('/auth/login')) {
          return Promise.reject({ message, status });
        }
        return Promise.reject({ message: 'Phiên đăng nhập hết hạn.', status: 401 });
      }

      return Promise.reject({ message, status });
    }

    if (error.code === 'ECONNABORTED') {
      console.log('[API Error] Timeout:', error.message);
      return Promise.reject({ message: 'Kết nối quá thời gian. Thử lại sau.' });
    }

    console.log('[API Error] Network/Unknown:', error.message, error.code, error.config?.url);
    return Promise.reject({ message: 'Không thể kết nối máy chủ. Kiểm tra mạng hoặc Backend.' });
  }
);

export default apiClient;
