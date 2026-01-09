import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      {/* Header - Stays fixed at the top */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={Colors.primaryBlue600} />
        </TouchableOpacity>
        <Text style={styles.title}>Account Access</Text>
      </View>
      
      {/* Main Content - Scrollable */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon name="shield-lock" size={60} color={Colors.primaryBlue500} />
        </View>
        
        {/* Main Message */}
        <View style={styles.messageBox}>
          <Text style={styles.messageTitle}>System Access Information</Text>
          
          <View style={styles.messageBody}>
            <View style={styles.messageRow}>
              <Icon name="info" size={20} color={Colors.primaryBlue500} style={styles.messageIcon} />
              <Text style={styles.messageText}>
                Your HR System account is automatically created during the onboarding process.
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.messageRow}>
              <Icon name="check-circle" size={20} color={Colors.success500} style={styles.messageIcon} />
              <Text style={styles.messageText}>
                Login credentials are provided by your HR department after successful onboarding.
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.messageRow}>
              <Icon name="mail" size={20} color={Colors.gold600} style={styles.messageIcon} />
              <Text style={styles.messageText}>
                You should receive your login details via email.
              </Text>
            </View>
          </View>
          
          {/* Contact Section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Need Assistance?</Text>
            <Text style={styles.contactText}>
              If you haven't received your login details or need help accessing the system, 
              please contact your HR administrator.
            </Text>
            <View style={styles.contactDetails}>
              <Text style={styles.contactDetail}>📧 hr@elorehub.co.ke</Text>
            </View>
          </View>
        </View>
        
        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/auth/login')}
        >
          <Icon name="login" size={20} color={Colors.white} style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Proceed to Login</Text>
        </TouchableOpacity>
        
        {/* Footer Note */}
        <Text style={styles.footerNote}>
          For security purposes, all account creation is managed internally by HR.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white, // Ensure header is opaque
    zIndex: 10,
  },
  backButton: {
    marginRight: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primaryBlue800,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xxl, // Added extra padding for bottom scroll room
    alignItems: 'center',
    flexGrow: 1, // Ensures content can center even if screen is large
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryBlue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    borderWidth: 2,
    borderColor: Colors.primaryBlue200,
  },
  messageBox: {
    width: '100%',
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    marginBottom: Layout.spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primaryBlue700,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  messageBody: {
    marginBottom: Layout.spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
  },
  messageIcon: {
    marginTop: 2,
    marginRight: Layout.spacing.md,
    flexShrink: 0,
  },
  messageText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Layout.spacing.lg,
  },
  contactSection: {
    backgroundColor: Colors.primaryBlue50,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBlue200,
  },
  contactTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.primaryBlue700,
    marginBottom: Layout.spacing.sm,
  },
  contactText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Layout.spacing.md,
  },
  contactDetails: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.sm,
    padding: Layout.spacing.md,
  },
  contactDetail: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
    fontFamily: 'monospace',
  },
  actionButton: {
    backgroundColor: Colors.primaryBlue600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.lg,
    width: '100%',
    marginBottom: Layout.spacing.xl,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: Layout.spacing.sm,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    maxWidth: '80%',
  },
});