import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors } from '../constants/colors';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  iconColor = colors.primary,
  trend,
  trendValue,
  onPress,
}) => {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        {trend && (
          <View style={[
            styles.trendContainer, 
            { backgroundColor: trend === 'up' ? '#e8f5e9' : '#ffebee' }
          ]}>
            <Ionicons 
              name={trend === 'up' ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend === 'up' ? colors.success : colors.danger} 
            />
            <Text style={[
              styles.trendValue,
              { color: trend === 'up' ? colors.success : colors.danger }
            ]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default StatCard;
