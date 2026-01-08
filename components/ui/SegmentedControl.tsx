// components/ui/SegmentedControl.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Layout } from '@/constants/Layout';

const THEME_COLORS = {
  primaryBlue: '#0056b3',
  white: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  borderLight: '#e5e7eb',
  background: '#f9fafb',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
};

interface Segment {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
}

export function SegmentedControl({
  segments,
  selectedValue,
  onValueChange,
  style,
}: SegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => {
        const isSelected = segment.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;
        
        return (
          <TouchableOpacity
            key={segment.value}
            style={[
              styles.segment,
              isFirst && styles.segmentFirst,
              isLast && styles.segmentLast,
              isSelected && styles.segmentSelected,
            ]}
            onPress={() => onValueChange(segment.value)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              isSelected && styles.segmentTextSelected,
            ]}>
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: THEME_COLORS.gray100,
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentFirst: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  segmentLast: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  segmentSelected: {
    backgroundColor: THEME_COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLORS.textSecondary,
  },
  segmentTextSelected: {
    color: THEME_COLORS.primaryBlue,
    fontWeight: '600',
  },
});