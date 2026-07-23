import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusColor = () => {
    if (type === 'vehicle') {
      switch (status?.toLowerCase()) {
        case 'available':
          return { bg: '#e8f5e9', text: colors.statusAvailable };
        case 'in_use':
        case 'in use':
          return { bg: '#e3f2fd', text: colors.statusInUse };
        case 'maintenance':
        case 'under maintenance':
          return { bg: '#fff3e0', text: colors.statusMaintenance };
        case 'retired':
          return { bg: '#f5f5f5', text: colors.statusRetired };
        default:
          return { bg: '#f5f5f5', text: colors.textSecondary };
      }
    }

    if (type === 'trip') {
      switch (status?.toLowerCase()) {
        case 'ongoing':
          return { bg: '#e3f2fd', text: colors.tripOngoing };
        case 'completed':
          return { bg: '#e8f5e9', text: colors.tripCompleted };
        case 'cancelled':
          return { bg: '#ffebee', text: colors.tripCancelled };
        default:
          return { bg: '#f5f5f5', text: colors.textSecondary };
      }
    }

    if (type === 'maintenance') {
      switch (status?.toLowerCase()) {
        case 'scheduled':
          return { bg: '#fff3e0', text: colors.warning };
        case 'in_progress':
        case 'in progress':
          return { bg: '#e3f2fd', text: colors.info };
        case 'completed':
          return { bg: '#e8f5e9', text: colors.success };
        case 'cancelled':
          return { bg: '#ffebee', text: colors.danger };
        default:
          return { bg: '#f5f5f5', text: colors.textSecondary };
      }
    }

    // Default colors
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'valid':
        return { bg: '#e8f5e9', text: colors.success };
      case 'pending':
        return { bg: '#fff3e0', text: colors.warning };
      case 'inactive':
      case 'rejected':
      case 'expired':
        return { bg: '#ffebee', text: colors.danger };
      default:
        return { bg: '#f5f5f5', text: colors.textSecondary };
    }
  };

  const { bg, text } = getStatusColor();

  const formatStatus = (s) => {
    if (!s) return 'Unknown';
    return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{formatStatus(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
