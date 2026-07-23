import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const maintenanceApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.MAINTENANCE, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.MAINTENANCE_DETAIL(id));
    return response.data;
  },

  getTypes: async () => {
    const response = await apiClient.get(API_ENDPOINTS.MAINTENANCE_TYPES);
    return response.data;
  },

  getScheduled: async () => {
    const response = await apiClient.get(API_ENDPOINTS.MAINTENANCE, {
      params: { status: 'scheduled' },
    });
    return response.data;
  },

  create: async (maintenanceData) => {
    const response = await apiClient.post(API_ENDPOINTS.MAINTENANCE, maintenanceData);
    return response.data;
  },

  update: async (id, maintenanceData) => {
    const response = await apiClient.patch(API_ENDPOINTS.MAINTENANCE_DETAIL(id), maintenanceData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(API_ENDPOINTS.MAINTENANCE_DETAIL(id), { status });
    return response.data;
  },
};
