import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Default development IP - standard localhost or emulator. 
// Can be customized at runtime in the app settings or login screen.
export const DEFAULT_API_URL = 'https://tasty-turkeys-behave.loca.lt/api'; // Active Cloud Tunnel for Mobile Data
// For local emulator: http://10.0.2.2:5000/api, For local WiFi: http://192.168.x.x:5000/api

const TOKEN_KEY = 'auth_token';
const API_URL_KEY = 'custom_api_url';

export const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Configure API URL dynamically
export const setBaseUrl = async (url: string) => {
  let cleanUrl = url.trim();
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl = cleanUrl.endsWith('/') ? `${cleanUrl}api` : `${cleanUrl}/api`;
  }
  apiClient.defaults.baseURL = cleanUrl;
  await SecureStore.setItemAsync(API_URL_KEY, cleanUrl);
};

export const getBaseUrl = async (): Promise<string> => {
  try {
    const saved = await SecureStore.getItemAsync(API_URL_KEY);
    if (saved) {
      apiClient.defaults.baseURL = saved;
      return saved;
    }
  } catch (e) {
    // Fallback if secure store unavailable
  }
  return apiClient.defaults.baseURL || DEFAULT_API_URL;
};

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading auth token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for logging / clean error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export const saveAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

