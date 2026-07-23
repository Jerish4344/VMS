/**
 * GPS Tracking Service
 * Handles background GPS tracking during trips.
 * 
 * Uses expo-task-manager + expo-location background location so tracking
 * continues even when the phone is locked or the app is swiped from recents.
 * A persistent Android foreground-service notification keeps the process alive.
 *
 * Flow:
 *  1. Trip starts  → startTracking(tripId)
 *  2. Background task fires location updates → buffered & sent to server
 *  3. Trip ends    → stopTracking()
 *  4. App reopens  → initialize() resumes if a trip was still ongoing
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import api from '../api/axios';
import { API_ENDPOINTS, APP_CONFIG } from '../constants/config';

const LOCATION_BUFFER_KEY = 'gps_location_buffer';
const TRACKING_STATE_KEY = 'gps_tracking_state';
const LAST_LOCATION_KEY = 'gps_last_valid_location';
const BACKGROUND_LOCATION_TASK = 'background-location-task';

// ──────────────────────────────────────────────
// GPS Drift Filter Settings
// ──────────────────────────────────────────────
const GPS_FILTER = {
  MIN_DISTANCE_METERS: 15,      // Ignore movement less than 15 meters
  MIN_SPEED_KMH: 3,             // Ignore if speed < 3 km/h (walking pace)
  MAX_ACCURACY_METERS: 25,      // Ignore points with accuracy worse than 25m
  MIN_TIME_BETWEEN_POINTS_MS: 5000, // Minimum 5 seconds between points
};

// ──────────────────────────────────────────────
// Haversine formula to calculate distance between two GPS points
// ──────────────────────────────────────────────
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// ──────────────────────────────────────────────
// Check if a location point should be accepted (filters GPS drift)
// ──────────────────────────────────────────────
async function shouldAcceptLocation(newLoc) {
  try {
    // Filter 1: Accuracy check - reject inaccurate readings
    if (newLoc.coords.accuracy && newLoc.coords.accuracy > GPS_FILTER.MAX_ACCURACY_METERS) {
      console.log(`GPS filtered: accuracy ${newLoc.coords.accuracy}m > ${GPS_FILTER.MAX_ACCURACY_METERS}m`);
      return { accept: false, reason: 'poor_accuracy' };
    }

    // Get last valid location
    const lastLocRaw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    if (!lastLocRaw) {
      // First point - always accept
      return { accept: true, reason: 'first_point' };
    }

    const lastLoc = JSON.parse(lastLocRaw);

    // Filter 2: Time check - don't process too frequently
    const timeDiff = newLoc.timestamp - lastLoc.timestamp;
    if (timeDiff < GPS_FILTER.MIN_TIME_BETWEEN_POINTS_MS) {
      return { accept: false, reason: 'too_soon' };
    }

    // Filter 3: Distance check - ignore tiny movements (GPS drift)
    const distance = calculateDistance(
      lastLoc.latitude, lastLoc.longitude,
      newLoc.coords.latitude, newLoc.coords.longitude
    );

    if (distance < GPS_FILTER.MIN_DISTANCE_METERS) {
      // Check if speed indicates actual movement
      const speedKmh = newLoc.coords.speed ? newLoc.coords.speed * 3.6 : 0;
      if (speedKmh < GPS_FILTER.MIN_SPEED_KMH) {
        console.log(`GPS filtered: distance ${distance.toFixed(1)}m < ${GPS_FILTER.MIN_DISTANCE_METERS}m, speed ${speedKmh.toFixed(1)}km/h`);
        return { accept: false, reason: 'gps_drift' };
      }
    }

    return { accept: true, reason: 'valid_movement', distance };
  } catch (error) {
    console.log('Error in shouldAcceptLocation:', error);
    return { accept: true, reason: 'error_fallback' }; // Accept on error to avoid losing data
  }
}

// ──────────────────────────────────────────────
// Save the last valid location
// ──────────────────────────────────────────────
async function saveLastLocation(loc) {
  try {
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: loc.timestamp,
    }));
  } catch (error) {
    console.log('Error saving last location:', error);
  }
}

// ──────────────────────────────────────────────
// Register the background task at module level
// (must be top-level, outside any component/class)
// ──────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log('Background location task error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    // Retrieve the current trip id from persisted state
    try {
      const savedState = await AsyncStorage.getItem(TRACKING_STATE_KEY);
      if (!savedState) return;
      const { tripId } = JSON.parse(savedState);
      if (!tripId) return;

      for (const loc of locations) {
        // Apply drift filter
        const filterResult = await shouldAcceptLocation(loc);
        if (!filterResult.accept) {
          console.log(`Background GPS point filtered: ${filterResult.reason}`);
          continue;
        }

        const locationData = {
          trip_id: tripId,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          speed: loc.coords.speed ? loc.coords.speed * 3.6 : null, // m/s → km/h
          altitude: loc.coords.altitude,
          heading: loc.coords.heading,
          battery_level: null,
          timestamp: new Date(loc.timestamp).toISOString(),
        };

        // Save as last valid location
        await saveLastLocation(loc);

        try {
          await api.post(API_ENDPOINTS.GPS_RECORD, locationData);
        } catch (sendErr) {
          // If server returns 401, the auth token has expired.
          // Stop tracking to avoid an endless loop of failed sends.
          if (sendErr.response && sendErr.response.status === 401) {
            console.log('Background task received 401 — auth expired, stopping tracking');
            try {
              await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
              await AsyncStorage.removeItem(TRACKING_STATE_KEY);
              await AsyncStorage.removeItem(LAST_LOCATION_KEY);
            } catch (_) {}
            return; // exit the task entirely
          }
          // Buffer failed sends for later sync
          console.log('Background send failed, buffering:', sendErr.message);
          try {
            const raw = await AsyncStorage.getItem(LOCATION_BUFFER_KEY);
            const buffer = raw ? JSON.parse(raw) : [];
            buffer.push(locationData);
            await AsyncStorage.setItem(LOCATION_BUFFER_KEY, JSON.stringify(buffer));
          } catch (_) { /* storage full, drop point */ }
        }
      }
    } catch (err) {
      console.log('Background task handler error:', err);
    }
  }
});

class GPSTrackingService {
  constructor() {
    this.isTracking = false;
    this.currentTripId = null;
    this.trackingInterval = null;
    this.locationBuffer = [];
    this.appStateSubscription = null;
    this.locationSubscription = null;
    this.isBackgroundSupported = false;

    // Listen to app state changes to sync buffer when app returns
    this.setupAppStateListener();
  }

  // ───── App-state listener ─────
  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        await this.checkAndResumeTracking();
      }
    });
  }

  // ───── Check & resume on app relaunch ─────
  async checkAndResumeTracking() {
    try {
      const savedState = await AsyncStorage.getItem(TRACKING_STATE_KEY);
      if (savedState) {
        const { tripId, isTracking } = JSON.parse(savedState);

        if (isTracking && tripId && !this.isTracking) {
          console.log('Resuming GPS tracking for trip:', tripId);
          await this.resumeTracking(tripId);
        }
      }
    } catch (error) {
      console.log('Error checking tracking state:', error);
    }
  }

  /**
   * Initialize – call once from App.js on mount.
   * Resumes tracking if a trip was still ongoing.
   */
  async initialize() {
    await this.checkAndResumeTracking();
  }

  // ───── Permissions ─────
  async requestPermissions() {
    try {
      // Step 1: Request foreground permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        return { granted: false, message: 'Location permission denied' };
      }

      // Step 2: Request background permission ("Allow all the time")
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        this.isBackgroundSupported = backgroundStatus === 'granted';
        console.log('Background location permission:', backgroundStatus);
        
        // REQUIRE "Allow all the time" - reject if not granted
        if (backgroundStatus !== 'granted') {
          return { 
            granted: false, 
            backgroundDenied: true,
            message: 'Background location permission required. Please select "Allow all the time" to enable trip tracking when the app is closed or phone is locked.' 
          };
        }
      } catch (bgError) {
        console.log('Background permission not available:', bgError.message);
        this.isBackgroundSupported = false;
        return { 
          granted: false, 
          backgroundDenied: true,
          message: 'Background location is required for trip tracking. Please enable it in Settings.' 
        };
      }

      return { granted: true, backgroundEnabled: this.isBackgroundSupported };
    } catch (error) {
      console.log('Permission request error:', error.message);
      return { granted: false, message: error.message };
    }
  }

  // ───── Start tracking ─────
  async startTracking(tripId) {
    if (this.isTracking) {
      console.log('GPS tracking already active');
      return { success: false, message: 'Tracking already active' };
    }

    try {
      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        console.log('Location permission denied:', permissions.message);
        return { success: false, message: permissions.message };
      }

      this.currentTripId = tripId;
      this.isTracking = true;
      this.locationBuffer = [];

      // Clear last location so first point is always accepted
      await AsyncStorage.removeItem(LAST_LOCATION_KEY);

      await this.saveTrackingState();
      await this.loadBufferedLocations();
      await this.startLocationUpdates();

      console.log(`GPS tracking started for trip ${tripId}`);
      return {
        success: true,
        message: 'GPS tracking started',
        backgroundEnabled: this.isBackgroundSupported,
      };
    } catch (error) {
      console.log('GPS tracking start error:', error.message);
      this.isTracking = false;
      return { success: false, message: error.message };
    }
  }

  // ───── Resume (app was killed & relaunched while trip ongoing) ─────
  async resumeTracking(tripId) {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.granted) return;

      this.currentTripId = tripId;
      this.isTracking = true;

      await this.loadBufferedLocations();

      // Always stop and restart the background task to avoid stale/zombie tasks.
      // A task registered in a previous session may be stuck (e.g. expired auth token,
      // OS killed it silently, or permission was effectively downgraded).
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .catch(() => false);

      if (isRunning) {
        console.log('Stopping stale background location task before re-registering');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
      }

      await this.startLocationUpdates();

      // Sync any locations that were buffered while offline / in background
      await this.syncBufferedLocations();

      console.log(`GPS tracking resumed for trip ${tripId}`);
    } catch (error) {
      console.log('Error resuming GPS tracking:', error);
    }
  }

  // ───── Core: start location updates ─────
  async startLocationUpdates() {
    const trackingInterval = APP_CONFIG.GPS_TRACKING_INTERVAL || 10000;

    // ── 1. Background location (works when locked / swiped away) ──
    if (this.isBackgroundSupported) {
      try {
        // Stop any stale task first
        const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
          .catch(() => false);
        if (alreadyRunning) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }

        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: trackingInterval,
          distanceInterval: 10,
          deferredUpdatesInterval: trackingInterval,
          showsBackgroundLocationIndicator: true,       // iOS blue bar
          foregroundService: {                           // Android sticky notification
            notificationTitle: 'Trip in Progress',
            notificationBody: 'VMS is tracking your trip location',
            notificationColor: '#1976D2',
          },
          pausesUpdatesAutomatically: false,
          activityType: Location.ActivityType.AutomotiveNavigation,
        });
        console.log('Background location updates started');
        return; // done – no need for foreground fallback
      } catch (error) {
        console.log('Background location start failed, falling back:', error.message);
      }
    }

    // ── 2. Foreground fallback (Expo Go or permission denied) ──
    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: trackingInterval,
          distanceInterval: 10,
        },
        (location) => this.handleLocationUpdate(location),
      );
      console.log('Foreground location watching started');
    } catch (error) {
      console.log('watchPositionAsync failed, using interval:', error.message);
      this.trackingInterval = setInterval(() => this.recordLocation(), trackingInterval);
      await this.recordLocation();
    }
  }

  // ───── Handle a single location point (with drift filtering) ─────
  async handleLocationUpdate(location) {
    if (!this.isTracking || !this.currentTripId) return;

    // Apply drift filter
    const filterResult = await shouldAcceptLocation(location);
    if (!filterResult.accept) {
      console.log(`Foreground GPS point filtered: ${filterResult.reason}`);
      return;
    }

    const locationData = {
      trip_id: this.currentTripId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed ? location.coords.speed * 3.6 : null,
      altitude: location.coords.altitude,
      heading: location.coords.heading,
      battery_level: null,
      timestamp: new Date().toISOString(),
    };

    // Save as last valid location
    await saveLastLocation(location);

    this.sendLocationToServer(locationData);
  }

  // ───── Send with buffer-on-failure ─────
  async sendLocationToServer(locationData) {
    try {
      await api.post(API_ENDPOINTS.GPS_RECORD, locationData);
    } catch (error) {
      console.log('Failed to send location, buffering:', error.message);
      this.locationBuffer.push(locationData);
      await this.saveBufferedLocations();
    }
  }

  // ───── Stop tracking ─────
  // Stops local tracking immediately and syncs GPS data to server in background.
  // Returns fast so the user isn't blocked waiting for server processing.
  async stopTracking() {
    if (!this.isTracking) {
      return { success: true, message: 'Tracking was not active' };
    }

    const tripIdToFinalize = this.currentTripId;
    const bufferedLocations = [...this.locationBuffer];

    // Stop foreground subscription
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Clear interval fallback
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Stop background location task
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .catch(() => false);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('Background location task stopped');
      }
    } catch (error) {
      console.log('Error stopping background location:', error);
    }

    // Mark tracking as stopped immediately (don't wait for server)
    this.isTracking = false;
    this.currentTripId = null;
    await this.clearTrackingState();
    await AsyncStorage.removeItem(LAST_LOCATION_KEY);

    console.log('GPS tracking stopped locally');

    // Fire-and-forget: sync buffered locations + finalize session in background
    this._syncAndFinalizeInBackground(tripIdToFinalize, bufferedLocations);

    return { success: true, message: 'GPS tracking stopped' };
  }

  // ───── Background sync with retry ─────
  // Runs after stopTracking returns — syncs remaining GPS data and finalizes
  // the session on the server without blocking the UI.
  async _syncAndFinalizeInBackground(tripId, bufferedLocations, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 3000; // 3 seconds between retries

    try {
      // Step 1: Sync buffered locations
      if (bufferedLocations.length > 0) {
        await api.post(API_ENDPOINTS.GPS_BATCH, {
          trip_id: tripId,
          locations: bufferedLocations,
        });
        this.locationBuffer = [];
        await AsyncStorage.removeItem(LOCATION_BUFFER_KEY);
        console.log('Buffered locations synced in background');
      }

      // Step 2: Finalize GPS session
      if (tripId) {
        await api.post(API_ENDPOINTS.GPS_FINALIZE(tripId));
        console.log('GPS session finalized in background for trip:', tripId);
      }
    } catch (error) {
      console.log(`Background GPS sync failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          this._syncAndFinalizeInBackground(tripId, bufferedLocations, retryCount + 1);
        }, RETRY_DELAY_MS * (retryCount + 1)); // Exponential-ish backoff
      } else {
        console.log('Background GPS sync exhausted retries. Data may need manual sync.');
      }
    }
  }

  // ───── Interval-based fallback ─────
  async recordLocation() {
    if (!this.isTracking || !this.currentTripId) return;
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });
      this.handleLocationUpdate(location);
    } catch (error) {
      console.log('Error getting location:', error);
    }
  }

  // ───── Persistence helpers ─────
  async saveTrackingState() {
    try {
      await AsyncStorage.setItem(TRACKING_STATE_KEY, JSON.stringify({
        tripId: this.currentTripId,
        isTracking: true,
        startedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.log('Error saving tracking state:', error);
    }
  }

  async clearTrackingState() {
    try {
      await AsyncStorage.removeItem(TRACKING_STATE_KEY);
    } catch (error) {
      console.log('Error clearing tracking state:', error);
    }
  }

  async saveBufferedLocations() {
    try {
      await AsyncStorage.setItem(LOCATION_BUFFER_KEY, JSON.stringify(this.locationBuffer));
    } catch (error) {
      console.log('Error saving location buffer:', error);
    }
  }

  async loadBufferedLocations() {
    try {
      const buffer = await AsyncStorage.getItem(LOCATION_BUFFER_KEY);
      if (buffer) {
        this.locationBuffer = JSON.parse(buffer);
      }
    } catch (error) {
      console.log('Error loading location buffer:', error);
    }
  }

  async syncBufferedLocations() {
    if (this.locationBuffer.length === 0) return;

    try {
      await api.post(API_ENDPOINTS.GPS_BATCH, {
        trip_id: this.currentTripId,
        locations: this.locationBuffer,
      });

      this.locationBuffer = [];
      await AsyncStorage.removeItem(LOCATION_BUFFER_KEY);
      console.log('Buffered locations synced successfully');
    } catch (error) {
      console.log('Failed to sync buffered locations:', error);
    }
  }

  // ───── Status helpers ─────
  async getStatus(tripId) {
    try {
      const response = await api.get(API_ENDPOINTS.GPS_STATUS(tripId));
      return response.data;
    } catch (error) {
      console.log('Error getting GPS status:', error);
      return null;
    }
  }

  isTrackingActive() {
    return this.isTracking;
  }

  getCurrentTripId() {
    return this.currentTripId;
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

// Export singleton instance
export default new GPSTrackingService();
