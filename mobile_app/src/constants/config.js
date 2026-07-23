// API Configuration
// Production backend server
export const API_BASE_URL = 'https://vms.jeyarama.com';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login/',
  LOGOUT: '/api/auth/logout/',
  USER_PROFILE: '/api/auth/profile/',
  
  // Dashboard
  DASHBOARD: '/api/dashboard/',
  DASHBOARD_STATS: '/api/dashboard/stats/',
  
  // Vehicles
  VEHICLES: '/api/vehicles/',
  VEHICLE_TYPES: '/api/vehicles/types/',
  VEHICLE_DETAIL: (id) => `/api/vehicles/${id}/`,
  
  // Trips
  TRIPS: '/api/trips/',
  TRIP_DETAIL: (id) => `/api/trips/${id}/`,
  START_TRIP: '/api/trips/start/',
  END_TRIP: (id) => `/api/trips/${id}/end/`,
  UPLOAD_ODOMETER_IMAGE: (id) => `/api/trips/${id}/upload-odometer-image/`,
  MY_TRIPS: '/api/trips/my-trips/',
  ONGOING_TRIPS: '/api/trips/ongoing/',
  
  // Maintenance
  MAINTENANCE: '/api/maintenance/',
  MAINTENANCE_DETAIL: (id) => `/api/maintenance/${id}/`,
  MAINTENANCE_TYPES: '/api/maintenance/types/',
  
  // Fuel
  FUEL_TRANSACTIONS: '/api/fuel/',
  FUEL_DETAIL: (id) => `/api/fuel/${id}/`,
  FUEL_STATIONS: '/api/fuel/stations/',
  
  // Documents
  DOCUMENTS: '/api/documents/',
  DOCUMENT_TYPES: '/api/documents/types/',
  EXPIRING_DOCUMENTS: '/api/documents/expiring/',
  
  // Accidents
  ACCIDENTS: '/api/accidents/',
  ACCIDENT_DETAIL: (id) => `/api/accidents/${id}/`,
  
  // Geolocation
  LOCATION_UPDATE: '/api/locations/',
  VEHICLE_LOCATION: (id) => `/api/locations/vehicle/${id}/`,
  
  // SOR (Statement of Receipt)
  SOR_LIST: '/api/sor/',
  SOR_CREATE: '/api/sor/create/',
  SOR_FORM_OPTIONS: '/api/sor/form-options/',
  SOR_DETAIL: (id) => `/api/sor/${id}/`,
  SOR_ACCEPT: (id) => `/api/sor/${id}/accept/`,
  SOR_REJECT: (id) => `/api/sor/${id}/reject/`,
  SOR_NOTIFICATIONS: '/api/sor/notifications/',
  SOR_NOTIFICATION_READ: (id) => `/api/sor/notifications/${id}/read/`,
  SOR_NOTIFICATIONS_MARK_ALL_READ: '/api/sor/notifications/mark-all-read/',

  // SOR Bundle (one trip with multiple SORs)
  SOR_BUNDLE_LIST: '/api/sor/bundle/my/',
  SOR_BUNDLE_CREATE: '/api/sor/bundle/create/',
  SOR_BUNDLE_DETAIL: (bundleId) => `/api/sor/bundle/${bundleId}/`,
  SOR_BUNDLE_ACCEPT: (bundleId) => `/api/sor/bundle/${bundleId}/accept/`,
  SOR_BUNDLE_COMPLETE_SOR: (bundleId, sorId) => `/api/sor/bundle/${bundleId}/sor/${sorId}/complete/`,

  // Personal Vehicle Staff
  PERSONAL_VEHICLES: '/api/personal-vehicles/',
  PERSONAL_VEHICLE_DETAIL: (id) => `/api/personal-vehicles/${id}/`,
  PERSONAL_VEHICLE_REIMBURSEMENT: '/api/personal-vehicles/reimbursement/',
  PERSONAL_VEHICLE_DASHBOARD: '/api/personal-vehicles/dashboard/',
  PROFILE_STATS: '/api/auth/profile/stats/',
  
  // GPS Tracking
  GPS_RECORD: '/api/gps/record/',
  GPS_BATCH: '/api/gps/batch/',
  GPS_STATUS: (tripId) => `/api/gps/status/${tripId}/`,
  GPS_FINALIZE: (tripId) => `/api/gps/finalize/${tripId}/`,
  GPS_ROUTE: (tripId) => `/api/gps/route/${tripId}/`,
};

export const APP_CONFIG = {
  APP_NAME: 'VMS Mobile',
  VERSION: '1.1.1',
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  GPS_TRACKING_INTERVAL: 10000, // 10 seconds for GPS tracking during trips
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
};
