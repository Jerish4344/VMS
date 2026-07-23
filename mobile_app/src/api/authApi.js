import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const authApi = {
  login: async (username, password) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
      username,
      password,
    });
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Even if logout fails on server, we'll clear local data
      console.log('Logout API error:', error);
    }
  },

  getProfile: async () => {
    const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.patch(API_ENDPOINTS.USER_PROFILE, profileData);
    return response.data;
  },
};
