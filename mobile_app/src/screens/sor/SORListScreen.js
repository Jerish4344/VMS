import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { sorApi } from '../../api/sorApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { sorEvents, SOR_EVENTS } from '../../utils/eventEmitter';
import { useAuth } from '../../context/AuthContext';

const SORListScreen = () => {
  const navigation = useNavigation();
  const { isSORUser, isDriver } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sorList, setSorList] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ];

  const fetchSORs = useCallback(async () => {
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await sorApi.getAll(params);
      setSorList(response.results || response || []);
    } catch (error) {
      console.log('Error fetching SORs:', error);
      setSorList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSORs();
    }, [fetchSORs])
  );

  useEffect(() => {
    setLoading(true);
    fetchSORs();
  }, [fetchSORs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSORs();
  };

  const handleAccept = async (id) => {
    Alert.alert(
      'Accept SOR',
      'Are you sure you want to accept this SOR? A trip will be started automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await sorApi.accept(id);
              Alert.alert('Success', 'SOR accepted and trip started!');
              sorEvents.emit(SOR_EVENTS.SOR_UPDATED);
              fetchSORs();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to accept SOR');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (id) => {
    Alert.alert(
      'Reject SOR',
      'Are you sure you want to reject this SOR?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await sorApi.reject(id);
              Alert.alert('Success', 'SOR rejected.');
              sorEvents.emit(SOR_EVENTS.SOR_UPDATED);
              fetchSORs();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to reject SOR');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'driver_accepted':
        return colors.info;
      case 'in_progress':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'rejected':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const renderSOR = ({ item }) => (
    <Card
      style={styles.sorCard}
      onPress={() =>
        item.bundle_id
          ? navigation.navigate('BundleDetail', { bundleId: item.bundle_id })
          : navigation.navigate('SORDetail', { sorId: item.id })
      }
    >
      <View style={styles.sorHeader}>
        <View style={styles.sorInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sorId}>SOR #{item.id}</Text>
            {item.bundle_id ? (
              <View style={{
                marginLeft: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: colors.primary + '22',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  BUNDLE
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sorValue}>{formatCurrency(item.goods_value)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status_display}
          </Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeIconContainer}>
          <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, { backgroundColor: colors.danger }]} />
        </View>
        <View style={styles.routeDetails}>
          <Text style={styles.routeText} numberOfLines={1}>{item.from_location}</Text>
          <Text style={styles.routeText} numberOfLines={1}>{item.to_location}</Text>
        </View>
      </View>

      <View style={styles.sorMeta}>
        {item.vehicle && (
          <View style={styles.metaItem}>
            <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.vehicle.license_plate}</Text>
          </View>
        )}
        {item.distance_km && (
          <View style={styles.metaItem}>
            <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.distance_km} km</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      {isDriver && item.status === 'pending' && !item.bundle_id && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <Ionicons name="close-circle" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {isDriver && item.status === 'pending' && item.bundle_id && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('BundleDetail', { bundleId: item.bundle_id })}
          >
            <Ionicons name="albums" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Open Bundle</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  if (loading) {
    return <LoadingScreen message="Loading SOR entries..." />;
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          data={tabs}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === item.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.key && styles.activeTabText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* SOR List */}
      <FlatList
        data={sorList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSOR}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No SOR Entries"
            message={`No ${activeTab === 'all' ? '' : activeTab} SOR entries found.`}
          />
        }
      />

      {/* FAB for SOR users to create new SOR */}
      {isSORUser && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            Alert.alert(
              'Create SOR',
              'What do you want to create?',
              [
                { text: 'Single SOR', onPress: () => navigation.navigate('CreateSOR') },
                {
                  text: 'Bundle SOR (multi-drop)',
                  onPress: () => navigation.navigate('CreateBundleSOR'),
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            )
          }
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sorCard: {
    marginBottom: 12,
    padding: 16,
  },
  sorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sorInfo: {
    flex: 1,
  },
  sorId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sorValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 4,
  },
  routeIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
  },
  routeDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  sorMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
});

export default SORListScreen;
