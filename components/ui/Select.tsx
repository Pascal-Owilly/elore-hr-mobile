// components/ui/Select.tsx - Fix to work with your theme
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';

export interface SelectItem {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  items: SelectItem[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  style?: any;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  items,
  placeholder = 'Select an option',
  error,
  disabled = false,
  searchable = false,
  style,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const selectedItem = items.find(item => item.value === value);

  const filteredItems = searchable && searchQuery 
    ? items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          { 
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border 
          },
          disabled && styles.containerDisabled,
          style,
        ]}
        onPress={() => {
          if (!disabled) {
            setModalVisible(true);
          }
        }}
        disabled={disabled}
      >
        <View style={styles.selectedContainer}>
          {selectedItem ? (
            <View style={styles.selectedContent}>
              {selectedItem.icon && (
                <Icon
                  name={selectedItem.icon}
                  type="feather"
                  size={16}
                  color={selectedItem.color || colors.text}
                  style={styles.selectedIcon}
                />
              )}
              <Text style={[styles.selectedText, { color: colors.text }]}>
                {selectedItem.label}
              </Text>
            </View>
          ) : (
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
              {placeholder}
            </Text>
          )}
        </View>
        <Icon
          name="chevron-down"
          type="feather"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Card variant="elevated" padding="md">
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {placeholder}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <Icon name="x" type="feather" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {searchable && (
                    <View style={[styles.searchContainer, { 
                      backgroundColor: colors.card,
                      borderColor: colors.border 
                    }]}>
                      <Icon name="search" type="feather" size={16} color={colors.textSecondary} />
                      <TextInput
                        ref={inputRef}
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                      />
                      {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                          <Icon name="x" type="feather" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}

                  <ScrollView style={styles.itemsList}>
                    {filteredItems.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.item,
                          value === item.value && { backgroundColor: colors.primary + '20' },
                          { borderBottomColor: colors.border }
                        ]}
                        onPress={() => handleSelect(item.value)}
                      >
                        <View style={styles.itemContent}>
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              type="feather"
                              size={16}
                              color={item.color || colors.text}
                              style={styles.itemIcon}
                            />
                          )}
                          <Text
                            style={[
                              styles.itemText,
                              { color: value === item.value ? colors.primary : colors.text },
                              value === item.value && styles.itemTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </View>
                        {value === item.value && (
                          <Icon
                            name="check"
                            type="feather"
                            size={16}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {filteredItems.length === 0 && (
                    <View style={styles.emptyState}>
                      <Icon name="search" type="feather" size={32} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                        No results found
                      </Text>
                    </View>
                  )}
                </Card>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    minHeight: 44,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  selectedContainer: {
    flex: 1,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    marginRight: Layout.spacing.sm,
  },
  selectedText: {
    fontSize: 16,
  },
  placeholder: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: Layout.spacing.sm,
    padding: 0,
  },
  itemsList: {
    maxHeight: 400,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: Layout.spacing.sm,
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  itemTextSelected: {
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: Layout.spacing.sm,
  },
});