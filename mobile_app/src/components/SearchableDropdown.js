import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const SearchableDropdown = ({
  label,
  data = [],
  selectedItem,
  onSelect,
  placeholder = 'Select an item',
  searchPlaceholder = 'Search...',
  renderItem,
  displayValue,
  keyExtractor = (item) => item.id?.toString(),
  searchKeys = ['name'],
  error,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = key.split('.').reduce((obj, k) => obj?.[k], item);
        return value?.toString().toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  const handleSelect = (item) => {
    onSelect(item);
    setModalVisible(false);
    setSearchQuery('');
  };

  const defaultRenderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        selectedItem?.id === item.id && styles.itemSelected,
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[
        styles.itemText,
        selectedItem?.id === item.id && styles.itemTextSelected,
      ]}>
        {item.name || item.label || item.title}
      </Text>
      {selectedItem?.id === item.id && (
        <Ionicons name="checkmark" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.selector,
          error && styles.selectorError,
          disabled && styles.selectorDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectorText,
          !selectedItem && styles.placeholderText,
        ]}>
          {selectedItem 
            ? (displayValue 
                ? displayValue(selectedItem) 
                : selectedItem.license_plate || selectedItem.name || selectedItem.label || 'Selected')
            : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? colors.textLight : colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{label || 'Select'}</Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textLight}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={keyExtractor}
            renderItem={renderItem ? ({ item }) => (
              <TouchableOpacity
                style={[
                  styles.itemContainer,
                  selectedItem?.id === item.id && styles.itemSelected,
                ]}
                onPress={() => handleSelect(item)}
              >
                {renderItem(item, selectedItem?.id === item.id)}
              </TouchableOpacity>
            ) : defaultRenderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorError: {
    borderColor: colors.danger,
  },
  selectorDisabled: {
    backgroundColor: colors.background,
    opacity: 0.7,
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textLight,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
  itemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
});

export default SearchableDropdown;
