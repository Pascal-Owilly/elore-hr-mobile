// components/dashboard/Announcements.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  department?: string;
  read: boolean;
}

export interface AnnouncementsProps {
  announcements?: Announcement[];
  onAnnouncementPress?: (announcement: Announcement) => void;
  onViewAll?: () => void;
  title?: string;
}

export const Announcements: React.FC<AnnouncementsProps> = ({
  announcements,
  onAnnouncementPress,
  onViewAll,
  title = 'Announcements',
}) => {
  const { colors } = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="megaphone"
            type="material-community"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No announcements
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.announcementsList}>
          {announcements.map((announcement) => {
            const priorityColor = getPriorityColor(announcement.priority);

            return (
              <TouchableOpacity
                key={announcement.id}
                style={[
                  styles.announcementItem,
                  !announcement.read && styles.unreadAnnouncement,
                ]}
                onPress={() => onAnnouncementPress?.(announcement)}
                activeOpacity={0.7}
              >
                <View style={styles.announcementHeader}>
                  <View style={styles.announcementTitleContainer}>
                    {!announcement.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                    <Text
                      style={[
                        styles.announcementTitle,
                        { color: colors.text },
                        !announcement.read && styles.unreadText,
                      ]}
                      numberOfLines={1}
                    >
                      {announcement.title}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                      {announcement.priority}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.announcementContent, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {announcement.content}
                </Text>

                <View style={styles.announcementFooter}>
                  <Text style={[styles.announcementDate, { color: colors.textSecondary }]}>
                    {formatDate(announcement.date)}
                  </Text>
                  {announcement.department && (
                    <View style={[styles.departmentBadge, { backgroundColor: colors.background }]}>
                      <Text style={[styles.departmentText, { color: colors.textSecondary }]}>
                        {announcement.department}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Layout.spacing.md,
  },
  announcementsList: {
    maxHeight: 300,
  },
  announcementItem: {
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  unreadAnnouncement: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    marginHorizontal: -Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.lg,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  announcementTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Layout.spacing.xs,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  announcementContent: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Layout.spacing.xs,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementDate: {
    fontSize: 11,
  },
  departmentBadge: {
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  departmentText: {
    fontSize: 10,
  },
});