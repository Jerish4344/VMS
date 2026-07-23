import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { sorApi } from '../../api/sorApi';
import { colors } from '../../constants/colors';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { sorEvents, SOR_EVENTS } from '../../utils/eventEmitter';

const BundleListScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bundles, setBundles] = useState([]);

  const fetchBundles = useCallback(async () => {
    try {
      const res = await sorApi.getBundles();
      setBundles(res?.bundles || []);
    } catch (e) {
      console.log('Bundles fetch error:', e);
      setBundles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBundles();
    }, [fetchBundles])
  );

  useFocusEffect(
    useCallback(() => {
      const unsub = sorEvents.on(SOR_EVENTS.SOR_UPDATED, fetchBundles);
      return () => unsub();
    }, [fetchBundles])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBundles();
  };

  const renderItem = ({ item }) => {
    const completed = (item.sors || []).filter((s) => s.status === 'completed').length;
    const total = item.count || (item.sors || []).length;
    const inProgress = !!item.any_active;
    const allDone = !!item.all_completed;
    const headerColor = allDone
      ? colors.success
      : inProgress
      ? colors.primary
      : colors.warning;

    return (
      <Card
        style={styles.card}
        onPress={() =>
          navigation.navigate('BundleDetail', { bundleId: item.bundle_id })
        }
      >
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: headerColor }]} />
          <Text style={styles.title}>SOR Bundle</Text>
          <View style={[styles.pill, { backgroundColor: headerColor + '22' }]}>
            <Text style={[styles.pillText, { color: headerColor }]}>
              {allDone ? 'Completed' : inProgress ? 'In Progress' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.routeText} numberOfLines={1}>
            From: {item.from_location}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.routeText} numberOfLines={2}>
            {item.destinations}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {item.vehicle && (
            <View style={styles.metaItem}>
              <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.vehicle.license_plate}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {completed}/{total} drops
            </Text>
          </View>
          {item.trip_id ? (
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>Trip #{item.trip_id}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading bundles..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bundles}
        keyExtractor={(item) => item.bundle_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="No SOR Bundles"
            message="You have no bundled SOR assignments yet."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  routeText: { marginLeft: 6, color: colors.text, fontSize: 13, flex: 1 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 4 },
  metaText: { marginLeft: 4, fontSize: 12, color: colors.textSecondary },
});

export default BundleListScreen;
