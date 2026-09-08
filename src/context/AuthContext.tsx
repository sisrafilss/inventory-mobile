import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, saveAuthToken, removeAuthToken, getAuthToken, getBaseUrl, setBaseUrl } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  serverUrl: string;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrlState] = useState<string>('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUrl = await getBaseUrl();
        setServerUrlState(currentUrl);

        const savedToken = await getAuthToken();
        if (savedToken) {
          setToken(savedToken);
          // Fetch current user details
          const res = await apiClient.get('/auth/me');
          if (res.data?.data) {
            setUser(res.data.data);
          }
        }
      } catch (e) {
        console.warn('Auto-login session expired or offline:', e);
        await removeAuthToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data?.data || res.data;
    if (receivedToken) {
      await saveAuthToken(receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
    } else {
      throw new Error('Authentication failed: No token returned');
    }
  };

  const demoLogin = async () => {
    await login('admin@inventory.local', 'SuperAdminInitialPassword123!');
  };

  const logout = async () => {
    try {
      await removeAuthToken();
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateServerUrl = async (url: string) => {
    await setBaseUrl(url);
    setServerUrlState(url);
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.data) {
        setUser(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        serverUrl,
        login,
        demoLogin,
        logout,
        updateServerUrl,
        refreshUser,
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

