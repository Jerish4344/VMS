import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const documentApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS, { params });
    return response.data;
  },

  getTypes: async () => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENT_TYPES);
    return response.data;
  },

  getExpiring: async () => {
    const response = await apiClient.get(API_ENDPOINTS.EXPIRING_DOCUMENTS);
    return response.data;
  },

  getByVehicle: async (vehicleId) => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS, {
      params: { vehicle: vehicleId },
    });
    return response.data;
  },

  create: async (documentData, file) => {
    const formData = new FormData();
    
    Object.keys(documentData).forEach(key => {
      formData.append(key, documentData[key]);
    });
    
    if (file) {
      const filename = file.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `application/${match[1]}` : 'application/pdf';
      
      formData.append('file', {
        uri: file.uri,
        name: filename,
        type,
      });
    }
    
    const response = await apiClient.post(API_ENDPOINTS.DOCUMENTS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id, documentData, file) => {
    const formData = new FormData();
    
    Object.keys(documentData).forEach(key => {
      if (documentData[key] !== undefined && documentData[key] !== null) {
        formData.append(key, documentData[key]);
      }
    });
    
    if (file) {
      const filename = file.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri: file.uri,
        name: filename,
        type,
      });
    }
    
    const response = await apiClient.patch(`${API_ENDPOINTS.DOCUMENTS}${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.DOCUMENTS}${id}/`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${API_ENDPOINTS.DOCUMENTS}${id}/`);
    return response.data;
  },
};
