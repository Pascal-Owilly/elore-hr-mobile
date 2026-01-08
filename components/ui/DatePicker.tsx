// components/ui/DatePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minimumDate?: string;
  maximumDate?: string;
  error?: string;
  disabled?: boolean;
  mode?: 'date' | 'datetime' | 'time';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  error,
  disabled = false,
  mode = 'date',
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState(
    value ? new Date(value) : new Date()
  );

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setInternalDate(selectedDate);
      
      // Format date as YYYY-MM-DD for backend
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      onChange(formattedDate);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (mode === 'date') {
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } else if (mode === 'datetime') {
      return date.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const showDatePicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const getMinDate = () => {
    return minimumDate ? new Date(minimumDate) : undefined;
  };

  const getMaxDate = () => {
    return maximumDate ? new Date(maximumDate) : undefined;
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.container,
          error && styles.containerError,
          disabled && styles.containerDisabled,
        ]}
        onPress={showDatePicker}
        disabled={disabled}
      >
        <View style={styles.content}>
          <Icon
            name="calendar"
            type="feather"
            size={16}
            color={value ? Colors.textPrimary : Colors.textSecondary}
            style={styles.icon}
          />
          <Text style={[
            styles.text,
            !value && styles.placeholder,
          ]}>
            {value ? formatDisplayDate(value) : placeholder}
          </Text>
        </View>
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {showPicker && (
        Platform.OS === 'ios' ? (
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleChange(null, internalDate);
                  setShowPicker(false);
                }}
                style={styles.doneButton}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={internalDate}
              mode={mode}
              display="spinner"
              onChange={handleChange}
              minimumDate={getMinDate()}
              maximumDate={getMaxDate()}
              style={styles.iosPicker}
            />
          </View>
        ) : (
          <DateTimePicker
            value={internalDate}
            mode={mode}
            display="default"
            onChange={handleChange}
            minimumDate={getMinDate()}
            maximumDate={getMaxDate()}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    minHeight: 44,
  },
  containerError: {
    borderColor: Colors.danger500,
  },
  containerDisabled: {
    backgroundColor: Colors.background,
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Layout.spacing.sm,
  },
  text: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger500,
    marginTop: 4,
    marginLeft: 4,
  },
  iosPickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    margin: Layout.spacing.lg,
    ...Layout.shadow.lg,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cancelButton: {
    padding: Layout.spacing.sm,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  doneButton: {
    padding: Layout.spacing.sm,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryBlue500,
  },
  iosPicker: {
    height: 200,
  },
});