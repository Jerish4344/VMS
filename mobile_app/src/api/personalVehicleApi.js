import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const personalVehicleApi = {
  /**
   * Get dashboard stats for personal vehicle staff
   */
  getDashboardStats: async () => {
    const response = await apiClient.get(API_ENDPOINTS.PERSONAL_VEHICLE_DASHBOARD);
    return response.data;
  },

  /**
   * Get list of personal vehicles owned by the user
   */
  getVehicles: async () => {
    const response = await apiClient.get(API_ENDPOINTS.PERSONAL_VEHICLES);
    return response.data;
  },

  /**
   * Get details of a specific personal vehicle
   * @param {number} id - Vehicle ID
   */
  getVehicleDetail: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.PERSONAL_VEHICLE_DETAIL(id));
    return response.data;
  },

  /**
   * Update personal vehicle (limited fields: odometer, notes)
   * @param {number} id - Vehicle ID
   * @param {Object} data - Update data
   */
  updateVehicle: async (id, data) => {
    const response = await apiClient.patch(API_ENDPOINTS.PERSONAL_VEHICLE_DETAIL(id), data);
    return response.data;
  },

  /**
   * Get reimbursement summary and history
   */
  getReimbursement: async () => {
    const response = await apiClient.get(API_ENDPOINTS.PERSONAL_VEHICLE_REIMBURSEMENT);
    return response.data;
  },
};

export default personalVehicleApi;
