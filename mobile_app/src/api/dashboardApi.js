import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD_STATS);
    return response.data;
  },

  getDashboard: async () => {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD);
    return response.data;
  },
};
