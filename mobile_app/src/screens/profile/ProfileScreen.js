import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows } from '../../constants/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/axios';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, isSORUser } = useAuth();
  const [stats, setStats] = useState({ total_trips: 0, total_distance: 0, total_fuel_entries: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/auth/profile/stats/');
      setStats(response.data);
    } catch (error) {
      console.log('Error fetching profile stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, showBadge, badgeColor = colors.danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.menuRight}>
        {showBadge && <View style={[styles.badge, { backgroundColor: badgeColor }]} />}
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );

  const getUserTypeDisplay = () => {
    const types = {
      admin: 'Administrator',
      manager: 'Manager',
      vehicle_manager: 'Vehicle Manager',
      driver: 'Employee',
      personal_vehicle_staff: 'Personal Vehicle Staff',
      generator_user: 'Generator User',
      sor_team: 'SOR Team',
      sor_head: 'SOR Head',
    };
    return types[user?.user_type] || 'User';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>
          {user?.first_name && user?.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user?.username || 'User'}
        </Text>
        <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getUserTypeDisplay()}</Text>
        </View>
      </Card>

      {/* Quick Stats - hidden for SOR users */}
      {!isSORUser && (
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            {loadingStats ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.statValue}>{stats.total_trips}</Text>
            )}
            <Text style={styles.statLabel}>Trips</Text>
          </Card>
          <Card style={styles.statCard}>
            {loadingStats ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.statValue}>{stats.total_distance}</Text>
            )}
            <Text style={styles.statLabel}>KM</Text>
          </Card>
          <Card style={styles.statCard}>
            {loadingStats ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.statValue}>{stats.total_fuel_entries}</Text>
            )}
            <Text style={styles.statLabel}>Fuel</Text>
          </Card>
        </View>
      )}

      {/* Menu Items - Documents, Vehicles, Trips hidden for SOR users */}
      {!isSORUser && (
        <Card style={styles.menuCard}>
          <MenuItem
            icon="document-text-outline"
            title="Documents"
            subtitle="View expiring documents"
            onPress={() => navigation.navigate('Documents')}
            showBadge
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="car-outline"
            title="My Vehicles"
            subtitle={user?.user_type === 'personal_vehicle_staff' ? 'View personal vehicles' : 'View assigned vehicles'}
            onPress={() => {
              if (user?.user_type === 'personal_vehicle_staff') {
                navigation.navigate('MyVehicle', { screen: 'MyVehicleList' });
              } else {
                navigation.navigate('Vehicles', { screen: 'VehicleList' });
              }
            }}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="time-outline"
            title="Trip History"
            subtitle="View all your trips"
            onPress={() => navigation.navigate('Trips', { screen: 'TripList' })}
          />
        </Card>
      )}

      <Card style={styles.menuCard}>
        <MenuItem
          icon="settings-outline"
          title="Settings"
          subtitle="App preferences"
          onPress={() => Alert.alert('Settings', 'Settings page coming soon')}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Get assistance"
          onPress={() => Alert.alert('Help', 'Contact jaison@jeyarama.com')}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="information-circle-outline"
          title="About"
          subtitle="Version 1.1.3"
          onPress={() => Alert.alert('About', 'VMS Mobile v1.1.3\nVehicle Management System')}
        />
      </Card>

      {/* Sign Out */}
      <Button
        title="Sign Out"
        variant="outline"
        onPress={handleLogout}
        icon={<Ionicons name="log-out-outline" size={20} color={colors.danger} />}
        style={styles.logoutButton}
        textStyle={{ color: colors.danger }}
      />

      <Text style={styles.versionText}>VMS Mobile v1.1.3</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  profileCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 16 },
  avatarContainer: { marginBottom: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', ...shadows.medium,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.textOnPrimary },
  userName: { fontSize: 22, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  roleBadge: { backgroundColor: `${colors.primary}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 12 },
  roleText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  menuCard: { marginBottom: 16, padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${colors.primary}10`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  menuSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { width: 8, height: 8, borderRadius: 4 },
  menuDivider: { height: 1, backgroundColor: colors.divider, marginLeft: 68 },
  logoutButton: { marginTop: 8, borderColor: colors.danger },
  versionText: { textAlign: 'center', fontSize: 12, color: colors.textLight, marginTop: 24 },
});

export default ProfileScreen;
