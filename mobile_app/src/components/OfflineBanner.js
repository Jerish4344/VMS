import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';

/**
 * OfflineBanner - shows a visible red banner when the device is offline.
 * Drivers will immediately know they have no connection.
 */
const OfflineBanner = () => {
  const { isConnected } = useNetwork();

  if (isConnected) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={16} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OfflineBanner;
