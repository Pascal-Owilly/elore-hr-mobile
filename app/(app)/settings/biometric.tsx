import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@lib/providers/AuthProvider';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';
import { biometricService } from '@lib/services/BiometricService';

export default function BiometricSettingsScreen() {
  const { biometricInfo, disableBiometric } = useAuth();
  const [biometricStatus, setBiometricStatus] = useState(biometricInfo);

  useEffect(() => {
    updateBiometricStatus();
  }, []);

  const updateBiometricStatus = async () => {
    const status = await biometricService.hasBiometricCapability();
    setBiometricStatus(status);
  };

  const handleDisableBiometric = async () => {
    const success = await disableBiometric();
    if (success) {
      await updateBiometricStatus();
    }
  };

  const getBiometricIcon = () => {
    switch (biometricStatus.type) {
      case 'fingerprint':
        return 'fingerprint';
      case 'face':
        return 'face-recognition';
      case 'iris':
        return 'eye';
      default:
        return 'fingerprint';
    }
  };

  const getBiometricName = () => {
    switch (biometricStatus.type) {
      case 'fingerprint':
        return 'Fingerprint';
      case 'face':
        return 'Face ID';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name={getBiometricIcon()} type="material" size={60} color={Colors.primaryBlue600} />
        <Text style={styles.title}>{getBiometricName()} Settings</Text>
        <Text style={styles.subtitle}>
          Manage your biometric login preferences
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={styles.statusIndicator}>
            <Icon 
              name={biometricStatus.available ? 'check-circle' : 'x-circle'} 
              type="feather" 
              size={20} 
              color={biometricStatus.available ? Colors.success600 : Colors.error600} 
            />
            <Text style={[
              styles.statusText,
              biometricStatus.available ? styles.statusActive : styles.statusInactive
            ]}>
              {biometricStatus.available ? 'Available' : 'Not Available'}
            </Text>
          </View>
          
          {biometricStatus.enabled && (
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledBadgeText}>ENABLED</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Icon name="device" type="feather" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {biometricStatus.available 
                ? `Your device supports ${getBiometricName()}`
                : 'Your device does not support biometric authentication'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="shield" type="feather" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Biometric credentials are stored securely on your device only
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="lock" type="feather" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Biometric data never leaves your device and is not shared
            </Text>
          </View>
        </View>

        {biometricStatus.enabled ? (
          <>
            <TouchableOpacity
              style={styles.disableButton}
              onPress={handleDisableBiometric}
            >
              <Icon name="fingerprint-off" type="material" size={20} color={Colors.error600} />
              <Text style={styles.disableButtonText}>Disable {getBiometricName()} Login</Text>
            </TouchableOpacity>
            
            <View style={styles.note}>
              <Icon name="info" type="feather" size={14} color={Colors.textSecondary} />
              <Text style={styles.noteText}>
                Disabling will remove your saved credentials. You'll need to enter your password next time.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.notEnabledContainer}>
            <Icon name="fingerprint" type="material" size={40} color={Colors.gray400} />
            <Text style={styles.notEnabledText}>
              {biometricStatus.available 
                ? `${getBiometricName()} login is not enabled`
                : `${getBiometricName()} is not available on this device`}
            </Text>
            <Text style={styles.notEnabledSubtext}>
              You can enable it from the login screen after signing in with your password
            </Text>
          </View>
        )}
      </View>

      <View style={styles.securityCard}>
        <Text style={styles.securityTitle}>Security Information</Text>
        <View style={styles.securityList}>
          <View style={styles.securityItem}>
            <Icon name="check-circle" type="feather" size={16} color={Colors.success600} />
            <Text style={styles.securityItemText}>
              Biometric authentication uses your device's secure enclave
            </Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name="check-circle" type="feather" size={16} color={Colors.success600} />
            <Text style={styles.securityItemText}>
              Your credentials are encrypted and stored locally
            </Text>
          </View>
          <View style={styles.securityItem}>
            <Icon name="check-circle" type="feather" size={16} color={Colors.success600} />
            <Text style={styles.securityItemText}>
              Each biometric scan requires your explicit approval
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    margin: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    ...Layout.shadow.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusActive: {
    color: Colors.success700,
  },
  statusInactive: {
    color: Colors.error700,
  },
  enabledBadge: {
    backgroundColor: Colors.success100,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  enabledBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success700,
  },
  infoSection: {
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.lg,
    backgroundColor: Colors.error50,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error200,
  },
  disableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error700,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
    padding: Layout.spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.md,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notEnabledContainer: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  notEnabledText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Layout.spacing.lg,
    textAlign: 'center',
  },
  notEnabledSubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  securityCard: {
    backgroundColor: Colors.white,
    margin: Layout.spacing.lg,
    marginTop: 0,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    ...Layout.shadow.md,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.lg,
  },
  securityList: {
    gap: Layout.spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
  },
  securityItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});