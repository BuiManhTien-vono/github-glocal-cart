import { Platform } from "react-native";

// Web runs on the same computer as the API, so localhost is correct there.
// Expo Go on a physical phone must use the backend computer's Wi-Fi IPv4 address.
const LAN_API_HOST = "192.168.1.10";

export const API_HOST = Platform.OS === "web" ? "localhost" : LAN_API_HOST;
export const API_PORT = "5100";

export const BASE_URL = `http://${API_HOST}:${API_PORT}`;

export const API_URL = `${BASE_URL}/api`;

if (__DEV__) {
  console.log(`[Config] Using API_URL: ${API_URL}`);
  console.log(`[Config] BASE_URL: ${BASE_URL}`);
  console.log(`[Config] Platform: ${Platform.OS}`);
}
