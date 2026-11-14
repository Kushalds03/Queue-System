import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/index.js';
import { authApi } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    organization?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('queueflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('queueflow_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('queueflow_token');
    localStorage.removeItem('queueflow_user');
    setToken(null);
    setUser(null);
  }, []);

  // Listen to unauthorized event from API interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  // Verify session on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('queueflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem('queueflow_user', JSON.stringify(response.user));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out');
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [logout]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    if (res.success && res.token && res.user) {
      localStorage.setItem('queueflow_token', res.token);
      localStorage.setItem('queueflow_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    organization?: string;
  }) => {
    const res = await authApi.register(data);
    if (res.success && res.token && res.user) {
      localStorage.setItem('queueflow_token', res.token);
      localStorage.setItem('queueflow_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updated };
      localStorage.setItem('queueflow_user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
