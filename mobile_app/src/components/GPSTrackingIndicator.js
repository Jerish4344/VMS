/**
 * GPS Tracking Indicator
 * Shows a floating indicator when GPS tracking is active
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import gpsTrackingService from '../services/gpsTrackingService';

const GPSTrackingIndicator = ({ onPress }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Check tracking status periodically
    const checkTracking = () => {
      setIsTracking(gpsTrackingService.isTrackingActive());
    };

    checkTracking();
    const interval = setInterval(checkTracking, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTracking) {
      // Pulse animation when tracking
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [isTracking, pulseAnim]);

  if (!isTracking) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.indicator, { transform: [{ scale: pulseAnim }] }]}>
        <MaterialIcons name="gps-fixed" size={20} color="#fff" />
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Trip Tracking</Text>
        <Text style={styles.subText}>GPS Active</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textContainer: {
    flexDirection: 'column',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
});

export default GPSTrackingIndicator;
