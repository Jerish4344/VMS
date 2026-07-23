import apiClient from './axios';
import { API_ENDPOINTS } from '../constants/config';

export const sorApi = {
  /**
   * Get list of SOR entries for the logged-in user
   * @param {Object} params - Query parameters (status, etc.)
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.SOR_LIST, { params });
    return response.data;
  },

  /**
   * Get form options (vehicles, drivers, locations) for creating SOR
   */
  getFormOptions: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SOR_FORM_OPTIONS);
    return response.data;
  },

  /**
   * Create a new SOR entry
   * @param {Object} data - SOR data
   */
  create: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.SOR_CREATE, data);
    return response.data;
  },

  /**
   * Get pending SOR entries for the driver
   */
  getPending: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SOR_LIST, { 
      params: { status: 'pending' } 
    });
    return response.data;
  },

  /**
   * Get details of a specific SOR
   * @param {number} id - SOR ID
   */
  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.SOR_DETAIL(id));
    return response.data;
  },

  /**
   * Accept a pending SOR and start the trip
   * @param {number} id - SOR ID
   */
  accept: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.SOR_ACCEPT(id));
    return response.data;
  },

  /**
   * Reject a pending SOR
   * @param {number} id - SOR ID
   */
  reject: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.SOR_REJECT(id));
    return response.data;
  },

  /**
   * Get unread SOR notifications for the logged-in driver
   */
  getNotifications: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SOR_NOTIFICATIONS);
    return response.data;
  },

  /**
   * Mark a specific notification as read
   * @param {number} id - Notification ID
   */
  markNotificationRead: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.SOR_NOTIFICATION_READ(id));
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead: async () => {
    const response = await apiClient.post(API_ENDPOINTS.SOR_NOTIFICATIONS_MARK_ALL_READ);
    return response.data;
  },

  // ----- SOR Bundle (one trip, many SORs) -----

  /**
   * List all bundles where the logged-in driver has at least one SOR
   */
  getBundles: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SOR_BUNDLE_LIST);
    return response.data;
  },

  /**
   * Create a new SOR bundle (SOR team / SOR head only)
   * @param {Object} payload - { vehicle_id, driver_id, from_location, items: [...] }
   */
  createBundle: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.SOR_BUNDLE_CREATE, payload);
    return response.data;
  },

  /**
   * Get one bundle: header + ordered SORs
   * @param {string} bundleId - UUID
   */
  getBundle: async (bundleId) => {
    const response = await apiClient.get(API_ENDPOINTS.SOR_BUNDLE_DETAIL(bundleId));
    return response.data;
  },

  /**
   * Accept a bundle: creates one shared trip and starts it
   * @param {string} bundleId - UUID
   */
  acceptBundle: async (bundleId) => {
    const response = await apiClient.post(API_ENDPOINTS.SOR_BUNDLE_ACCEPT(bundleId));
    return response.data;
  },

  /**
   * Mark one SOR inside a bundle as completed (driver arrived at that drop)
   * @param {string} bundleId - UUID
   * @param {number} sorId
   * @param {{ arrival_odometer: number, notes?: string }} payload
   */
  completeBundleSOR: async (bundleId, sorId, payload) => {
    const response = await apiClient.post(
      API_ENDPOINTS.SOR_BUNDLE_COMPLETE_SOR(bundleId, sorId),
      payload,
    );
    return response.data;
  },
};

export default sorApi;
