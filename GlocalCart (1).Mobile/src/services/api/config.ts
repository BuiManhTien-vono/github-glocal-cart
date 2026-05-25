import { Platform } from 'react-native';

// IP của máy tính chạy Backend API
// Cần khớp giữa apiClient và imageUtils
export const API_HOST = '192.168.1.7';
export const API_PORT = '5100';

export const BASE_URL = Platform.OS === 'web'
  ? `http://localhost:${API_PORT}`
  : `http://${API_HOST}:${API_PORT}`;

export const API_URL = `${BASE_URL}/api`;
