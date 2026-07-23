import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { tripApi } from '../../api/tripApi';
import { sorApi } from '../../api/sorApi';
import { personalVehicleApi } from '../../api/personalVehicleApi';
import { colors, shadows } from '../../constants/colors';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import GPSTrackingIndicator from '../../components/GPSTrackingIndicator';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeTrips: 0,
    scheduledMaintenance: 0,
    monthlyDistance: 0,
    monthlyTrips: 0,
  });
  const [ongoingTrips, setOngoingTrips] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [sorNotifications, setSorNotifications] = useState([]);
  const [pendingSORs, setPendingSORs] = useState([]);
  const [personalVehicleStats, setPersonalVehicleStats] = useState(null);
  const [sorStats, setSorStats] = useState({ pending: 0, inProgress: 0, completed: 0, total: 0 });

  const { isAdmin, isDriver, isPersonalVehicleStaff, isSORTeam, isSORHead, isSORUser } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      // For SOR team/head users, fetch SOR-specific data only
      if (isSORUser) {
        try {
          const [pendingRes, inProgressRes, completedRes, allRes] = await Promise.all([
            sorApi.getAll({ status: 'pending' }),
            sorApi.getAll({ status: 'in_progress' }),
            sorApi.getAll({ status: 'completed' }),
            sorApi.getAll(),
          ]);
          const pendingList = pendingRes?.results || pendingRes || [];
          const inProgressList = inProgressRes?.results || inProgressRes || [];
          const completedList = completedRes?.results || completedRes || [];
          const allList = allRes?.results || allRes || [];
          setSorStats({
            pending: Array.isArray(pendingList) ? pendingList.length : 0,
            inProgress: Array.isArray(inProgressList) ? inProgressList.length : 0,
            completed: Array.isArray(completedList) ? completedList.length : 0,
            total: Array.isArray(allList) ? allList.length : 0,
          });
          setPendingSORs(pendingList.slice(0, 5));
        } catch (e) {
          console.log('SOR stats error:', e);
        }
      } else if (isPersonalVehicleStaff) {
        // For personal vehicle staff, fetch their specific stats
        try {
          const pvStats = await personalVehicleApi.getDashboardStats();
          setPersonalVehicleStats(pvStats);
          setStats({
            totalVehicles: pvStats.total_vehicles || 0,
            activeTrips: pvStats.active_trips || 0,
            scheduledMaintenance: 0,
            monthlyDistance: pvStats.monthly_distance || 0,
            monthlyTrips: pvStats.monthly_trips || 0,
            monthlyReimbursement: pvStats.monthly_reimbursement || 0,
          });
        } catch (e) {
          console.log('Personal vehicle stats error:', e);
        }
      } else {
        // Fetch real dashboard stats from API for other users
        try {
          const dashboardData = await dashboardApi.getStats();
          setStats({
            totalVehicles: dashboardData.total_vehicles || 0,
            activeTrips: dashboardData.active_trips || 0,
            scheduledMaintenance: dashboardData.scheduled_maintenance || 0,
            monthlyDistance: dashboardData.monthly_distance || 0,
            monthlyTrips: dashboardData.monthly_trips || 0,
          });
        } catch (e) {
          console.log('Dashboard stats error:', e);
          // Fallback to defaults
          setStats({
            totalVehicles: 0,
            activeTrips: 0,
            scheduledMaintenance: 0,
            monthlyDistance: 0,
            monthlyTrips: 0,
          });
        }
      }
      
      // Fetch ongoing trips based on user role (API handles filtering) - skip for SOR users
      if (!isSORUser) {
        try {
          const tripsResponse = await tripApi.getOngoing();
          setOngoingTrips(tripsResponse.results || tripsResponse || []);
        } catch (e) {
          console.log('Ongoing trips error:', e);
          setOngoingTrips([]);
        }
        
        // Fetch user's recent trips
        try {
          const myTrips = await tripApi.getMyTrips({ limit: 5 });
          setRecentTrips(myTrips.results || myTrips || []);
        } catch (e) {
          console.log('My trips error:', e);
          setRecentTrips([]);
        }
      }
      
      // Fetch SOR notifications and pending SORs for drivers
      if (user?.user_type === 'driver') {
        try {
          const notifications = await sorApi.getNotifications();
          setSorNotifications(notifications.results || notifications || []);
        } catch (e) {
          console.log('SOR notifications error:', e);
          setSorNotifications([]);
        }
        
        try {
          const pending = await sorApi.getPending();
          setPendingSORs(pending.results || pending || []);
        } catch (e) {
          console.log('Pending SORs error:', e);
          setPendingSORs([]);
        }
      }
    } catch (error) {
      console.log('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.mainContainer}>
      {/* GPS Tracking Indicator - hidden for SOR users */}
      {!isSORUser && (
        <GPSTrackingIndicator 
          onPress={() => navigation.navigate('Trips', { screen: 'TripList' })}
        />
      )}
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>
            {user?.first_name || user?.username || 'User'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {isAdmin ? 'Administrator' : isDriver ? 'Driver' : isSORTeam ? 'SOR Team' : isSORHead ? 'SOR Head' : user?.user_type?.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('More', { screen: 'Profile' })}
        >
          <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      {isSORUser ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              title="Pending"
              value={sorStats.pending}
              icon="time"
              iconColor={colors.warning}
              onPress={() => navigation.navigate('SOR')}
            />
            <StatCard
              title="In Progress"
              value={sorStats.inProgress}
              icon="car"
              iconColor={colors.info}
              onPress={() => navigation.navigate('SOR')}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Completed"
              value={sorStats.completed}
              icon="checkmark-circle"
              iconColor={colors.success}
              onPress={() => navigation.navigate('SOR')}
            />
            <StatCard
              title="Total SORs"
              value={sorStats.total}
              icon="document-text"
              iconColor={colors.primary}
              onPress={() => navigation.navigate('SOR')}
            />
          </View>
        </>
      ) : isPersonalVehicleStaff ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              title="My Vehicles"
              value={stats.totalVehicles}
              icon="car"
              iconColor={colors.primary}
              onPress={() => navigation.navigate('MyVehicle')}
            />
            <StatCard
              title="Active Trips"
              value={stats.activeTrips}
              icon="map"
              iconColor={colors.success}
              onPress={() => navigation.navigate('Trips')}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Monthly KM"
              value={stats.monthlyDistance.toLocaleString()}
              icon="speedometer"
              iconColor={colors.info}
            />
            <StatCard
              title="Reimbursement"
              value={`₹${(stats.monthlyReimbursement || 0).toLocaleString()}`}
              icon="cash"
              iconColor={colors.success}
              onPress={() => navigation.navigate('Reimbursement')}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              title={isAdmin ? "Total Vehicles" : "Available Vehicles"}
              value={stats.totalVehicles}
              icon="car"
              iconColor={colors.primary}
              onPress={() => navigation.navigate('Vehicles')}
            />
            <StatCard
              title={isAdmin ? "Active Trips" : "My Active Trips"}
              value={stats.activeTrips}
              icon="map"
              iconColor={colors.success}
              onPress={() => navigation.navigate('Trips')}
            />
          </View>
          <View style={styles.statsGrid}>
            {isAdmin && (
              <StatCard
                title="Maintenance"
                value={stats.scheduledMaintenance}
                icon="construct"
                iconColor={colors.warning}
              />
            )}
            <StatCard
              title="Monthly KM"
              value={stats.monthlyDistance.toLocaleString()}
              icon="speedometer"
              iconColor={colors.info}
            />
            {!isAdmin && (
              <StatCard
                title="My Trips"
                value={stats.monthlyTrips || 0}
                icon="navigate"
                iconColor={colors.warning}
              />
            )}
          </View>
        </>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {isSORUser ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SOR')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="list" size={24} color={colors.info} />
              </View>
              <Text style={styles.actionText}>All SORs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('More', { screen: 'Profile' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="person" size={24} color="#9c27b0" />
              </View>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Trips', { screen: 'StartTrip', initial: false })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="play-circle" size={24} color={colors.success} />
              </View>
              <Text style={styles.actionText}>Start Trip</Text>
            </TouchableOpacity>

            {isPersonalVehicleStaff ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('MyVehicle')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
                    <Ionicons name="car" size={24} color={colors.warning} />
                  </View>
                  <Text style={styles.actionText}>My Vehicle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Reimbursement')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
                    <Ionicons name="cash" size={24} color={colors.success} />
                  </View>
                  <Text style={styles.actionText}>Reimbursement</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('More', { screen: 'Documents' })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fce4ec' }]}>
                    <Ionicons name="document-text" size={24} color={colors.danger} />
                  </View>
                  <Text style={styles.actionText}>Documents</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!isDriver && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Fuel', { screen: 'AddFuel' })}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                      <Ionicons name="water" size={24} color={colors.info} />
                    </View>
                    <Text style={styles.actionText}>Add Fuel</Text>
                  </TouchableOpacity>
                )}

                {isDriver && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('SOR')}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                      <Ionicons name="document-text" size={24} color={colors.info} />
                    </View>
                    <Text style={styles.actionText}>SOR</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Vehicles')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
                    <Ionicons name="car" size={24} color={colors.warning} />
                  </View>
                  <Text style={styles.actionText}>Vehicles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('More', { screen: 'Documents' })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fce4ec' }]}>
                    <Ionicons name="document-text" size={24} color={colors.danger} />
                  </View>
                  <Text style={styles.actionText}>Documents</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {/* Pending SOR Assignments - Show for drivers and SOR users */}
      {(isDriver || isSORUser) && pendingSORs.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Pending SOR Assignments</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{pendingSORs.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('SOR')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {pendingSORs.slice(0, 2).map((sor) => (
            <Card
              key={sor.id}
              style={styles.sorCard}
              onPress={() => navigation.navigate('SOR', { 
                screen: 'SORDetail', 
                params: { sorId: sor.id } 
              })}
            >
              <View style={styles.sorHeader}>
                <View style={styles.sorInfo}>
                  <Text style={styles.sorId}>SOR #{sor.id}</Text>
                  <Text style={styles.sorValue}>
                    ₹{parseFloat(sor.goods_value).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.sorStatusBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Text style={[styles.sorStatusText, { color: colors.warning }]}>
                    Pending
                  </Text>
                </View>
              </View>
              <View style={styles.sorRoute}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={16} color={colors.success} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {sor.from_location}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.textLight} />
                <View style={styles.routePoint}>
                  <Ionicons name="flag" size={16} color={colors.danger} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {sor.to_location}
                  </Text>
                </View>
              </View>
              <View style={styles.sorMeta}>
                <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.sorMetaText}>{sor.vehicle?.license_plate}</Text>
                {sor.distance_km && (
                  <>
                    <Text style={styles.sorMetaSeparator}>•</Text>
                    <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.sorMetaText}>{sor.distance_km} km</Text>
                  </>
                )}
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Ongoing Trips - hidden for SOR users */}
      {!isSORUser && ongoingTrips.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ongoing Trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Trips')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {ongoingTrips.slice(0, 3).map((trip) => (
            <Card
              key={trip.id}
              style={styles.tripCard}
              onPress={() => navigation.navigate('Trips', { 
                screen: 'TripDetail', 
                initial: false,
                params: { tripId: trip.id } 
              })}
            >
              <View style={styles.tripHeader}>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripVehicle}>
                    {trip.vehicle?.license_plate}
                  </Text>
                  <Text style={styles.tripVehicleModel}>
                    {trip.vehicle?.make} {trip.vehicle?.model}
                  </Text>
                </View>
                <StatusBadge status={trip.status} type="trip" />
              </View>
              <View style={styles.tripRoute}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={16} color={colors.success} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {trip.origin}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.textLight} />
                <View style={styles.routePoint}>
                  <Ionicons name="flag" size={16} color={colors.danger} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {trip.destination || 'In Progress'}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Sign Out Button for drivers and SOR users */}
      {(isDriver || isSORUser) && (
        <TouchableOpacity style={styles.signOutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  roleBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  profileButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.small,
  },
  actionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  tripCard: {
    marginBottom: 8,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: {},
  tripVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tripVehicleModel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  routeText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: '500',
  },
  // SOR Styles
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sorCard: {
    marginBottom: 8,
  },
  sorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sorInfo: {},
  sorId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sorValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  sorStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sorStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sorRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sorMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sorMetaSeparator: {
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
});

export default DashboardScreen;
