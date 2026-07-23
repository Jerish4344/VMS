import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { documentApi } from '../../api/documentApi';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const DocumentListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isPersonalVehicleStaff = user?.user_type === 'personal_vehicle_staff';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'expiring', label: 'Expiring Soon' },
    { key: 'expired', label: 'Expired' },
  ];

  const fetchDocuments = async () => {
    try {
      let response;
      if (filter === 'expiring') {
        response = await documentApi.getExpiring();
      } else {
        response = await documentApi.getAll();
      }
      let docs = response.results || response || [];
      
      if (filter === 'expired') {
        const today = new Date();
        docs = docs.filter(d => new Date(d.expiry_date) < today);
      }
      
      setDocuments(docs);
    } catch (error) {
      console.log('Error:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [filter])
  );

  useEffect(() => {
    setLoading(true);
    fetchDocuments();
  }, [filter]);

  const getDocumentStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: colors.danger, text: `Expired ${Math.abs(daysUntilExpiry)} days ago` };
    if (daysUntilExpiry <= 30) return { status: 'expiring', color: colors.warning, text: `Expires in ${daysUntilExpiry} days` };
    return { status: 'valid', color: colors.success, text: `Valid for ${daysUntilExpiry} days` };
  };

  const getDocumentIcon = (typeName) => {
    const name = typeName?.toLowerCase() || '';
    if (name.includes('insurance')) return 'shield-checkmark';
    if (name.includes('fitness')) return 'fitness';
    if (name.includes('pollution')) return 'leaf';
    if (name.includes('permit')) return 'card';
    if (name.includes('registration')) return 'document-text';
    return 'document';
  };

  const handleDeleteDocument = (document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.document_type?.name}" (${document.document_number})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentApi.delete(document.id);
              Alert.alert('Success', 'Document deleted successfully');
              fetchDocuments();
            } catch (error) {
              console.log('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDocumentOptions = (document) => {
    Alert.alert(
      document.document_type?.name || 'Document',
      `${document.document_number}\n${document.vehicle?.license_plate}`,
      [
        {
          text: 'Edit',
          onPress: () => navigation.navigate('EditDocument', { document }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteDocument(document),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderDocument = ({ item }) => {
    const docStatus = getDocumentStatus(item.expiry_date);
    
    return (
      <TouchableOpacity 
        activeOpacity={isPersonalVehicleStaff ? 0.7 : 1}
        onLongPress={isPersonalVehicleStaff ? () => handleDocumentOptions(item) : undefined}
      >
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${docStatus.color}15` }]}>
              <Ionicons name={getDocumentIcon(item.document_type?.name)} size={24} color={docStatus.color} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.docType}>{item.document_type?.name}</Text>
              <Text style={styles.docNumber}>{item.document_number}</Text>
            </View>
            {isPersonalVehicleStaff ? (
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => handleDocumentOptions(item)}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <StatusBadge status={docStatus.status} />
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.footerText}>{item.vehicle?.license_plate}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={14} color={docStatus.color} />
              <Text style={[styles.footerText, { color: docStatus.color }]}>{docStatus.text}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingScreen message="Loading documents..." />;

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, isPersonalVehicleStaff && { paddingBottom: 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDocuments} />}
        ListEmptyComponent={
          <EmptyState 
            icon="document-text-outline" 
            title="No Documents" 
            message={isPersonalVehicleStaff ? "No documents yet. Tap + to add your vehicle documents" : "No documents found for the selected filter"} 
          />
        }
      />

      {/* Floating Action Button for Personal Vehicle Staff */}
      {isPersonalVehicleStaff && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddDocument')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.textOnPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.background },
  filterButtonActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.textOnPrimary },
  listContent: { padding: 16 },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerInfo: { flex: 1 },
  docType: { fontSize: 16, fontWeight: '600', color: colors.text },
  docNumber: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  moreButton: { padding: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 13, color: colors.textSecondary },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
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

export default DocumentListScreen;
