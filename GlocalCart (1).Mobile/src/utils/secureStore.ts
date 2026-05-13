import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Tiện ích lưu trữ bảo mật cho ứng dụng Mobile.
 * Hỗ trợ fallback về AsyncStorage khi chạy trên nền tảng Web.
 */

export const setSecureItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`[SecureStore] Error setting item for key ${key}:`, error);
  }
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`[SecureStore] Error getting item for key ${key}:`, error);
    return null;
  }
};

export const removeSecureItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`[SecureStore] Error removing item for key ${key}:`, error);
  }
};
