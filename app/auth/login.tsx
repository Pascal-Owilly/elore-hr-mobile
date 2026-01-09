import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@lib/providers/AuthProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

// Custom colors with your palette
const Colors = {
  cream: '#e9ded3',
  primaryBlue: '#0056b3',
  gold: '#deab63',
  white: '#ffffff',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  borderLight: '#e0e0e0',
  background: '#f8f9fa',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  gray50: '#f8f9fa',
  gray100: '#e9ecef',
  gray200: '#dee2e6',
  gray300: '#ced4da',
  gray400: '#adb5bd',
  gray500: '#6c757d',
  primaryBlue50: 'rgba(0, 86, 179, 0.05)',
  primaryBlue100: 'rgba(0, 86, 179, 0.1)',
  primaryBlue200: 'rgba(0, 86, 179, 0.2)',
  primaryBlue600: '#0056b3',
  primaryBlue800: '#003d82',
  success50: 'rgba(40, 167, 69, 0.1)',
  success100: 'rgba(40, 167, 69, 0.2)',
  success600: '#28a745',
  success800: '#1e7e34',
  error50: 'rgba(220, 53, 69, 0.1)',
  error200: 'rgba(220, 53, 69, 0.2)',
  error600: '#dc3545',
  error700: '#c82333',
};

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login, biometricLogin, biometricInfo, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberBiometric, setRememberBiometric] = useState(false);

  const handleBiometricLogin = async () => {
    const result = await biometricLogin();
    
    if (!result.success) {
      Alert.alert('Biometric Login Failed', result.error || 'Unable to login with biometrics. Please use email and password.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const result = await login(formData.email, formData.password, rememberBiometric);
    
    if (result.success) {
      console.log('Login successful');
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/reset-password');
  };

  const handleRequestAccess = () => {
    Alert.alert(
      'Request Access',
      'Please contact your HR department or system administrator to request access to the HR System.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Contact HR', 
          onPress: () => {
            // You could add email functionality here
            // Linking.openURL('mailto:hr@company.com?subject=HR System Access Request')
          }
        }
      ]
    );
  };

  const handleQuickFill = (type: 'admin' | 'employee') => {
    if (type === 'admin') {
      setFormData({
        email: 'owillypascal@gmail.com',
        password: 'kkkk1111',
      });
    } else {
      setFormData({
        email: 'kennedy@gmail.com',
        password: 'kkkk1111',
      });
    }
  };

  const getBiometricIcon = () => {
    switch (biometricInfo.type) {
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

  const getBiometricText = () => {
    switch (biometricInfo.type) {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Modern Background Design */}
        <View style={styles.background}>
          <View style={styles.topCircle} />
          <View style={styles.bottomCircle} />
          <View style={styles.designLine} />
          <View style={styles.designLine2} />
        </View>

        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="briefcase" type="feather" size={36} color={Colors.white} />
            </View>
            <Text style={styles.logoText}>Elore HR Kenya</Text>
            <Text style={styles.subtitle}>Employee Portal</Text>
          </View>
        </View>

        {/* Quick Login Buttons - Only shown in development */}
        {__DEV__ && (
          <View style={styles.quickLoginContainer}>
            <Text style={styles.quickLoginText}>Demo Accounts (Development Only)</Text>
            <View style={styles.quickLoginButtons}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => handleQuickFill('admin')}
              >
                <Icon name="shield" type="feather" size={16} color={Colors.primaryBlue} />
                <Text style={styles.quickButtonText}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, styles.quickButtonEmployee]}
                onPress={() => handleQuickFill('employee')}
              >
                <Icon name="user" type="feather" size={16} color={Colors.gold} />
                <Text style={[styles.quickButtonText, styles.quickButtonTextEmployee]}>Employee</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Biometric Quick Access - Subtle option at top */}
        {biometricInfo.enabled && (
          <TouchableOpacity
            style={styles.biometricQuickAccess}
            onPress={handleBiometricLogin}
            disabled={isLoading}
          >
            <View style={styles.biometricQuickContent}>
              <Icon 
                name={getBiometricIcon()} 
                type="material" 
                size={22} 
                color={Colors.primaryBlue} 
              />
              <Text style={styles.biometricQuickText}>
                Login with {getBiometricText()}
              </Text>
            </View>
            <Icon name="chevron-right" type="feather" size={18} color={Colors.primaryBlue} />
          </TouchableOpacity>
        )}

        {/* Main Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Secure Login</Text>
            <Text style={styles.formSubtitle}>
              Enter your credentials to access Elore HR portal
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Icon name="mail" type="feather" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor={Colors.textTertiary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" type="feather" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textTertiary}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  type="feather"
                  size={18}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Biometric Option - For enabling if not already enabled */}
          {biometricInfo.available && !biometricInfo.enabled && (
            <TouchableOpacity
              style={styles.biometricOption}
              onPress={() => setRememberBiometric(!rememberBiometric)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberBiometric && styles.checkboxChecked]}>
                {rememberBiometric && (
                  <Icon name="check" type="feather" size={12} color={Colors.white} />
                )}
              </View>
              <Icon 
                name={getBiometricIcon()} 
                type="material" 
                size={16} 
                color={rememberBiometric ? Colors.primaryBlue : Colors.textTertiary} 
              />
              <Text style={[styles.biometricOptionText, rememberBiometric && styles.biometricOptionTextActive]}>
                Enable {getBiometricText()} for faster login
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity 
              onPress={handleForgotPassword} 
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Small biometric button for quick access */}
            {biometricInfo.enabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isLoading}
              >
                <Icon name={getBiometricIcon()} type="material" size={18} color={Colors.primaryBlue} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Icon name="loader" type="feather" size={20} color={Colors.white} style={styles.loadingIcon} />
                <Text style={styles.loginButtonText}>Signing in...</Text>
              </View>
            ) : (
              <View style={styles.loginContainer}>
                <Icon name="log-in" type="feather" size={20} color={Colors.white} />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Icon name="shield-check" type="feather" size={16} color={Colors.success} />
            <Text style={styles.securityText}>
              Your login is protected with enterprise-grade security
            </Text>
          </View>
        </View>

        {/* Access Request Section */}
        <View style={styles.accessContainer}>
          <Text style={styles.accessTitle}>Need Access?</Text>
          <Text style={styles.accessText}>
            Contact your HR department to request access to the portal
          </Text>
          <TouchableOpacity 
            style={styles.accessButton}
            onPress={handleRequestAccess}
            activeOpacity={0.8}
          >
            <Icon name="user-plus" type="feather" size={16} color={Colors.primaryBlue} />
            <Text style={styles.accessButtonText}>Request Access</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Company privacy policy information')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity onPress={() => Alert.alert('Terms', 'Terms of service for company HR system')}>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity onPress={() => Alert.alert('Support', 'Contact IT support for assistance')}>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footerText}>
            © 2026 Elore HR Kenya • v1.0.0 • Secure HR Portal
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topCircle: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.primaryBlue50,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -200,
    left: -150,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(222, 171, 99, 0.05)',
  },
  designLine: {
    position: 'absolute',
    top: '30%',
    right: 0,
    width: 100,
    height: 2,
    backgroundColor: Colors.primaryBlue200,
    transform: [{ rotate: '-45deg' }],
  },
  designLine2: {
    position: 'absolute',
    bottom: '30%',
    left: 0,
    width: 80,
    height: 2,
    backgroundColor: Colors.primaryBlue200,
    transform: [{ rotate: '45deg' }],
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  quickLoginContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  quickLoginText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primaryBlue50,
    borderWidth: 1,
    borderColor: Colors.primaryBlue200,
  },
  quickButtonEmployee: {
    backgroundColor: 'rgba(222, 171, 99, 0.1)',
    borderColor: 'rgba(222, 171, 99, 0.2)',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  quickButtonTextEmployee: {
    color: Colors.gold,
  },
  biometricQuickAccess: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.primaryBlue200,
  },
  biometricQuickContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  biometricQuickText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formHeader: {
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 50,
  },
  passwordToggle: {
    paddingHorizontal: 16,
  },
  biometricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  biometricOptionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  biometricOptionTextActive: {
    color: Colors.primaryBlue,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  forgotPassword: {
    paddingVertical: 6,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primaryBlue,
  },
  biometricButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.primaryBlue50,
    borderWidth: 1,
    borderColor: Colors.primaryBlue200,
  },
  loginButton: {
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray400,
    shadowColor: Colors.gray400,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingIcon: {
    animationKeyframes: {
      '0%': { transform: [{ rotate: '0deg' }] },
      '100%': { transform: [{ rotate: '360deg' }] },
    },
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    backgroundColor: Colors.success50,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.success100,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success,
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  accessContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  accessTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  accessText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBlue200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accessButtonText: {
    color: Colors.primaryBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLink: {
    color: Colors.primaryBlue,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  footerSeparator: {
    color: Colors.gray400,
    fontSize: 10,
  },
  footerText: {
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
});