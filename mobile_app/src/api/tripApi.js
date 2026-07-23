import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const tripApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.TRIPS, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.TRIP_DETAIL(id));
    return response.data;
  },

  getMyTrips: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.MY_TRIPS, { params });
    return response.data;
  },

  getOngoing: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ONGOING_TRIPS);
    return response.data;
  },

  // Check if user has any ongoing trips
  checkOngoingTrips: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ONGOING_TRIPS);
    const trips = response.data?.results || response.data || [];
    return trips;
  },

  // Start trip WITHOUT image - instant response
  startTrip: async (tripData) => {
    const response = await apiClient.post(API_ENDPOINTS.START_TRIP, tripData);
    return response.data;
  },

  // Upload odometer image in background (after trip starts)
  uploadOdometerImage: async (tripId, image, imageType = 'start') => {
    const formData = new FormData();
    formData.append('image_type', imageType);
    
    const imageUri = image.uri;
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });
    
    const response = await apiClient.patch(
      API_ENDPOINTS.UPLOAD_ODOMETER_IMAGE(tripId), 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  endTrip: async (id, endData) => {
    // Send end trip data without image - instant response
    const response = await apiClient.post(API_ENDPOINTS.END_TRIP(id), endData);
    return response.data;
  },

  create: async (tripData) => {
    const response = await apiClient.post(API_ENDPOINTS.TRIPS, tripData);
    return response.data;
  },

  update: async (id, tripData) => {
    const response = await apiClient.patch(API_ENDPOINTS.TRIP_DETAIL(id), tripData);
    return response.data;
  },
};
