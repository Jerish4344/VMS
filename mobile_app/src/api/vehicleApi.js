import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

/**
 * Helper: fetches all pages from a paginated endpoint.
 * DRF returns { count, next, results } — this collects all results.
 */
const fetchAllPages = async (url, params = {}) => {
  let allResults = [];
  let nextUrl = null;
  let page = 1;

  // First request
  const firstResp = await apiClient.get(url, { params: { ...params, page } });
  const data = firstResp.data;

  // If response is already an array (non-paginated), return as-is
  if (Array.isArray(data)) return data;

  allResults = data.results || [];
  nextUrl = data.next;

  // Fetch remaining pages
  while (nextUrl) {
    page++;
    const resp = await apiClient.get(url, { params: { ...params, page } });
    allResults = allResults.concat(resp.data.results || []);
    nextUrl = resp.data.next;
  }

  return allResults;
};

export const vehicleApi = {
  getAll: async (params = {}) => {
    const results = await fetchAllPages(API_ENDPOINTS.VEHICLES, params);
    return { results };
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.VEHICLE_DETAIL(id));
    return response.data;
  },

  getTypes: async () => {
    const response = await apiClient.get(API_ENDPOINTS.VEHICLE_TYPES);
    return response.data;
  },

  getAvailable: async () => {
    const results = await fetchAllPages(API_ENDPOINTS.VEHICLES, { status: 'available' });
    return { results };
  },

  create: async (vehicleData) => {
    const response = await apiClient.post(API_ENDPOINTS.VEHICLES, vehicleData);
    return response.data;
  },

  update: async (id, vehicleData) => {
    const response = await apiClient.patch(API_ENDPOINTS.VEHICLE_DETAIL(id), vehicleData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(API_ENDPOINTS.VEHICLE_DETAIL(id), { status });
    return response.data;
  },
};
