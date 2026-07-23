import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { API_ENDPOINTS } from '../../constants/config';
import { colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const TripMapScreen = ({ route, navigation }) => {
  const { tripId, tripInfo } = route.params;
  const mapRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRouteData();
  }, [tripId]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.GPS_ROUTE(tripId));
      setRouteData(response.data);
      
      // Fit map to route after data loads
      if (response.data.has_route && response.data.route.length > 0) {
        setTimeout(() => fitMapToRoute(response.data), 500);
      }
    } catch (err) {
      console.log('Error fetching route:', err);
      setError('Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  const fitMapToRoute = (data) => {
    if (mapRef.current && data.route && data.route.length > 0) {
      const coordinates = data.route.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
      }));
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
        animated: true,
      });
    }
  };

  const getInitialRegion = () => {
    if (routeData?.route?.length > 0) {
      const firstPoint = routeData.route[0];
      return {
        latitude: firstPoint.latitude,
        longitude: firstPoint.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
    }
    // Default to a central location if no data
    return {
      latitude: 13.0827,
      longitude: 80.2707,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
  };

  const formatDistance = (km) => {
    if (!km) return 'N/A';
    return `${km.toFixed(2)} km`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading route data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRouteData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!routeData?.has_route) {
    return (
      <View style={styles.noDataContainer}>
        <Ionicons name="map-outline" size={64} color={colors.textLight} />
        <Text style={styles.noDataTitle}>No Route Data</Text>
        <Text style={styles.noDataText}>
          GPS tracking data is not available for this trip.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const routeCoordinates = routeData.route.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));

  const startPoint = routeData.route[0];
  const endPoint = routeData.route[routeData.route.length - 1];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Route Polyline */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineDashPattern={[1]}
        />

        {/* Start Marker */}
        <Marker
          coordinate={{
            latitude: startPoint.latitude,
            longitude: startPoint.longitude,
          }}
          title="Start"
          description={routeData.trip_info?.origin || 'Trip Start'}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.startMarker]}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </View>
        </Marker>

        {/* End Marker */}
        <Marker
          coordinate={{
            latitude: endPoint.latitude,
            longitude: endPoint.longitude,
          }}
          title="End"
          description={routeData.trip_info?.destination || 'Trip End'}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.endMarker]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Trip Info Overlay */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{formatDistance(routeData.gps_distance)}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color={colors.success} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>GPS Points</Text>
              <Text style={styles.infoValue}>{routeData.total_points}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tripRoute}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {routeData.trip_info?.origin || 'Start'}
            </Text>
            <Text style={styles.routeTime}>
              {formatTime(routeData.trip_info?.start_time)}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {routeData.trip_info?.destination || 'End'}
            </Text>
            <Text style={styles.routeTime}>
              {formatTime(routeData.trip_info?.end_time)}
            </Text>
          </View>
        </View>
      </View>

      {/* Center Map Button */}
      <TouchableOpacity 
        style={styles.centerButton}
        onPress={() => fitMapToRoute(routeData)}
      >
        <Ionicons name="scan-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  noDataTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  noDataText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  startMarker: {
    backgroundColor: colors.success,
  },
  endMarker: {
    backgroundColor: colors.danger,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tripRoute: {
    marginTop: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
  },
  routeTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  centerButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default TripMapScreen;
