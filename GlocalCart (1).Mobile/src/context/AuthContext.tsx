import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/api/apiClient';

// ─── Types ───
interface User {
  id: number;
  userName: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isSeller: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  finishLogin: (token: string, user: User) => Promise<void>;
}

interface RegisterData {
  userName: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ───
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isLoggedIn: false,
  });

  // Khôi phục phiên đăng nhập khi mở app
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userJson = await AsyncStorage.getItem('auth_user');
      if (token && userJson) {
        const user = JSON.parse(userJson);
        setState({ user, token, isLoading: false, isLoggedIn: true });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const finishLogin = async (token: string, user: User) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    setState({ user, token, isLoading: false, isLoggedIn: true });
  };

  const login = async (emailOrUsername: string, password: string) => {
    console.log('[Auth] Attempting login for:', emailOrUsername);
    try {
      const response = await apiClient.post('/auth/login', { email: emailOrUsername, password }) as any;
      console.log('[Auth] Login response received');
      if (!response?.token) throw new Error('Lỗi đăng nhập: Token không tồn tại');

      await finishLogin(response.token, response.user);
    } catch (error: any) {
      console.log('[Auth] Login error details:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data) as any;
    if (!response?.token) throw new Error('Lỗi đăng ký');

    // Trả về data để màn hình Register hiện Alert trước khi tự login
    return { token: response.token, user: response.user };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setState({ user: null, token: null, isLoading: false, isLoggedIn: false });
  };

  const updateUser = (user: User) => {
    setState((prev) => ({ ...prev, user }));
    AsyncStorage.setItem('auth_user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser, finishLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ───
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
