import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

// ─── In-memory token cache ─────────────────────────────────────
// Avoids disk I/O (SecureStore) on every request — critical for
// 300 drivers sending GPS pings every 10 seconds.
let cachedToken = null;

export const setCachedToken = (token) => {
  cachedToken = token;
};

export const clearCachedToken = () => {
  cachedToken = null;
};

// ─── Retry configuration ───────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1s, 2s, 4s (exponential)
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryable = (error) => {
  // Network errors (no response) are retryable
  if (!error.response) return true;
  // Certain server errors are retryable
  return RETRYABLE_STATUS_CODES.includes(error.response.status);
};

// ─── Axios instance ────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — uses cached token (fast), falls back to SecureStore
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = cachedToken;
      if (!token) {
        token = await SecureStore.getItemAsync('authToken');
        if (token) cachedToken = token;
      }
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handles 401 + triggers retry on transient errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token expired or invalid — clear everywhere
        cachedToken = null;
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
        // Don't retry 401s
        return Promise.reject(error);
      }

      if (status === 403) {
        console.log('Access forbidden');
      }
    }

    // ─── Retry logic ───────────────────────────────────────────
    if (!config || config.__retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    if (!isRetryable(error)) {
      return Promise.reject(error);
    }

    config.__retryCount = (config.__retryCount || 0) + 1;
    const delay = RETRY_DELAY_MS * Math.pow(2, config.__retryCount - 1);

    console.log(
      `Retrying request (${config.__retryCount}/${MAX_RETRIES}) after ${delay}ms: ${config.url}`
    );

    await sleep(delay);
    return apiClient(config);
  }
);

export default apiClient;
