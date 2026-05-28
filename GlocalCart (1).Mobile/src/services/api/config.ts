import { Platform } from "react-native";

// IP của máy tính chạy Backend API
// Cần khớp giữa apiClient và imageUtils
// CÁCH TÌMA IP: chạy `ipconfig` trên Windows hoặc `ifconfig` trên Mac/Linux
// Tìm "IPv4 Address" hoặc "inet addr" (không phải 127.0.0.1 hoặc ::1)
export const API_HOST = "192.168.1.6"; // IP của máy Backend
export const API_PORT = "5100";

export const BASE_URL = `http://${API_HOST}:${API_PORT}`;

export const API_URL = `${BASE_URL}/api`;

// Debug: Log the URL being used
if (__DEV__) {
  console.log(`[Config] Using API_URL: ${API_URL}`);
  console.log(`[Config] BASE_URL: ${BASE_URL}`);
  console.log(`[Config] Platform: ${Platform.OS}`);
}
