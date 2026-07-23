import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const fuelApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.FUEL_TRANSACTIONS, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.FUEL_DETAIL(id));
    return response.data;
  },

  getStations: async () => {
    const response = await apiClient.get(API_ENDPOINTS.FUEL_STATIONS);
    return response.data;
  },

  create: async (fuelData) => {
    const response = await apiClient.post(API_ENDPOINTS.FUEL_TRANSACTIONS, fuelData);
    return response.data;
  },

  createWithImage: async (fuelData, imageUri) => {
    const formData = new FormData();
    
    Object.keys(fuelData).forEach(key => {
      formData.append(key, fuelData[key]);
    });
    
    if (imageUri) {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('receipt_image', {
        uri: imageUri,
        name: filename,
        type,
      });
    }
    
    const response = await apiClient.post(API_ENDPOINTS.FUEL_TRANSACTIONS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id, fuelData) => {
    const response = await apiClient.patch(API_ENDPOINTS.FUEL_DETAIL(id), fuelData);
    return response.data;
  },
};
