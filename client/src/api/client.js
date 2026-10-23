import axios from 'axios';
import { mockAdapter } from './mockAdapter';

// DEMO MODE switch. When true, no request leaves the browser: every call is answered by
// mockAdapter.js with sample data from src/data/mockData.js. A yellow banner is shown.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // send the httpOnly auth cookie
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

if (USE_MOCK) api.defaults.adapter = mockAdapter;

// Tell the app when the session has ended so it can log the user out cleanly.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event('qf:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check your connection or that the backend is running.';
  return err?.message || 'Something went wrong. Please try again.';
}

export const getFieldErrors = (err) => err?.response?.data?.details?.fields || {};

// For blob downloads the error body is a Blob, so read it as text first.
export async function getBlobErrorMessage(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message || 'Download failed';
    } catch {
      return 'Download failed';
    }
  }
  return getErrorMessage(err);
}

export default api;
