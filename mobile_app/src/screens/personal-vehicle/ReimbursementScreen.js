import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { personalVehicleApi } from '../../api/personalVehicleApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const { width } = Dimensions.get('window');

const ReimbursementScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('current');

  const fetchReimbursement = useCallback(async () => {
    try {
      const response = await personalVehicleApi.getReimbursement();
      setData(response);
    } catch (error) {
      console.log('Error fetching reimbursement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReimbursement();
    }, [fetchReimbursement])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReimbursement();
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <LoadingScreen message="Loading reimbursement..." />;
  }

  if (!data?.has_vehicles) {
    return (
      <EmptyState
        icon="wallet-outline"
        title="No Vehicles Found"
        message="You don't have any personal vehicles registered for reimbursement."
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Current Month Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="wallet" size={28} color={colors.textOnPrimary} />
          <Text style={styles.summaryMonth}>{data.current_month?.month}</Text>
        </View>
        <Text style={styles.totalReimbursement}>
          {formatCurrency(data.current_month?.total_reimbursement)}
        </Text>
        <Text style={styles.summarySubtext}>Total Reimbursement</Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Ionicons name="car-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryStatValue}>{data.current_month?.trips_count || 0}</Text>
            <Text style={styles.summaryStatLabel}>Trips</Text>
          </View>
          <View style={styles.summaryStatDivider} />
          <View style={styles.summaryStatItem}>
            <Ionicons name="speedometer-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryStatValue}>{data.current_month?.total_distance || 0}</Text>
            <Text style={styles.summaryStatLabel}>KM</Text>
          </View>
        </View>
      </Card>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'current' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('current')}
        >
          <Text style={[styles.tabText, selectedTab === 'current' && styles.tabTextActive]}>
            Current Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'history' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'current' ? (
        /* Current Month Trips */
        <View>
          <Text style={styles.sectionTitle}>Trip-wise Breakdown</Text>
          
          {data.trips && data.trips.length > 0 ? (
            data.trips.map((trip, index) => (
              <Card key={trip.id || index} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <View style={styles.tripRoute}>
                    <Ionicons name="location" size={16} color={colors.success} />
                    <Text style={styles.tripLocation} numberOfLines={1}>
                      {trip.origin}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
                  <View style={styles.tripRoute}>
                    <Ionicons name="flag" size={16} color={colors.error} />
                    <Text style={styles.tripLocation} numberOfLines={1}>
                      {trip.destination}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tripDetails}>
                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Date</Text>
                    <Text style={styles.tripDetailValue}>{formatDate(trip.start_time)}</Text>
                  </View>
                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Distance</Text>
                    <Text style={styles.tripDetailValue}>{trip.distance} km</Text>
                  </View>
                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Rate</Text>
                    <Text style={styles.tripDetailValue}>₹{trip.reimbursement_rate}/km</Text>
                  </View>
                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Amount</Text>
                    <Text style={[styles.tripDetailValue, styles.amountValue]}>
                      {formatCurrency(trip.reimbursement_amount)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tripVehicle}>
                  <Ionicons name="car" size={14} color={colors.textSecondary} />
                  <Text style={styles.tripVehicleText}>{trip.vehicle?.license_plate}</Text>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="document-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No trips this month</Text>
              <Text style={styles.emptySubtext}>Complete trips to see reimbursement details</Text>
            </Card>
          )}
        </View>
      ) : (
        /* Monthly History */
        <View>
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          
          {data.monthly_history?.map((month, index) => (
            <Card key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyMonth}>
                  <Text style={styles.historyMonthText}>{month.month_short}</Text>
                  <Text style={styles.historyYearText}>{month.year}</Text>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyAmount}>
                    {formatCurrency(month.total_reimbursement)}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {month.trips_count} trips • {month.total_distance} km
                  </Text>
                </View>
                <View style={styles.historyArrow}>
                  {month.total_reimbursement > 0 ? (
                    <View style={styles.historyBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    </View>
                  ) : (
                    <Ionicons name="remove-circle-outline" size={20} color={colors.textLight} />
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
    marginLeft: 8,
  },
  totalReimbursement: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textOnPrimary,
    marginTop: 8,
  },
  summarySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    justifyContent: 'center',
  },
  summaryStatItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textOnPrimary,
    marginTop: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textOnPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tripCard: {
    marginBottom: 12,
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripRoute: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 6,
    flex: 1,
  },
  tripDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tripDetailItem: {
    width: '50%',
    marginBottom: 8,
  },
  tripDetailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tripDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  amountValue: {
    color: colors.success,
  },
  tripVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tripVehicleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  historyCard: {
    marginBottom: 12,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyMonth: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  historyYearText: {
    fontSize: 10,
    color: colors.primary,
  },
  historyDetails: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  historyMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyArrow: {
    marginLeft: 8,
  },
  historyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReimbursementScreen;
