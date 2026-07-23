import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/colors';
import Button from '../../components/Button';
import Card from '../../components/Card';

const PendingApprovalScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={80} color={colors.warning} />
        </View>
        
        <Text style={styles.title}>Pending Approval</Text>
        <Text style={styles.message}>
          Your account is pending approval from management. You will be notified once your request is reviewed.
        </Text>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {user?.first_name} {user?.last_name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>
              {user?.hr_designation || user?.user_type || 'Employee'}
            </Text>
          </View>
        </Card>

        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Ionicons name="hourglass-outline" size={16} color={colors.warning} />
            <Text style={styles.statusText}>Awaiting Approval</Text>
          </View>
        </View>

        <Button
          title="Sign Out"
          onPress={logout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    width: '100%',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 60,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  statusContainer: {
    marginBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  logoutButton: {
    width: '100%',
  },
});

export default PendingApprovalScreen;
