'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  isSeller: boolean;
  role: string;
  coins: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (newUser: User) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const savedToken = localStorage.getItem('glocal_token');
    const savedUser = localStorage.getItem('glocal_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('glocal_token', newToken);
    localStorage.setItem('glocal_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('glocal_token');
    localStorage.removeItem('glocal_user');
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('glocal_user', JSON.stringify(newUser));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const profile = await api.users.getProfile();
      const updatedUser = {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        phone: profile.phoneNumber,
        isSeller: profile.isSeller,
        role: profile.role,
        coins: profile.coins || 0
      };
      updateUser(updatedUser);
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      updateUser,
      refreshUser,
      isAuthenticated: !!token,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
