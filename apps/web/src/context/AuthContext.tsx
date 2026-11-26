import React, { createContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  designation: string | null; // only set when role = 'EMPLOYEE'
  department: string | null;
  createdAt: string;
}

export interface LoginParams {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginParams) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginParams): Promise<User> => {
    const response = await apiClient.post<{ success: boolean; user: User; message: string }>(
      '/auth/login',
      credentials,
    );
    const loggedInUser = response.data.user;
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

