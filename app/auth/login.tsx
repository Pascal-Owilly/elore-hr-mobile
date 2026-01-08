import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@lib/providers/AuthProvider';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const result = await login(formData.email, formData.password);
    
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
        {/* Background decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomCircle} />
        
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="briefcase" type="feather" size={40} color={Colors.white} />
            </View>
            <Text style={styles.logoText}>Elore HR Kenya</Text>
            <Text style={styles.subtitle}>Employee Portal</Text>
          </View>
        </View>

        {/* Quick Login Buttons - Only shown in development */}
        {__DEV__ && (
          <View style={styles.quickLoginContainer}>
            <Text style={styles.quickLoginText}>Demo Accounts (Development Only):</Text>
            <View style={styles.quickLoginButtons}>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: Colors.primaryBlue100 }]}
                onPress={() => handleQuickFill('admin')}
              >
                <Icon name="shield" type="feather" size={16} color={Colors.primaryBlue600} />
                <Text style={[styles.quickButtonText, { color: Colors.primaryBlue700 }]}>Administrator</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: Colors.success100 }]}
                onPress={() => handleQuickFill('employee')}
              >
                <Icon name="user" type="feather" size={16} color={Colors.success600} />
                <Text style={[styles.quickButtonText, { color: Colors.success700 }]}>Employee</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Secure Login</Text>
          <Text style={styles.formSubtitle}>
            Enter your company credentials to access your HR portal
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company Email</Text>
            <View style={styles.inputContainer}>
              <Icon name="mail" type="feather" size={20} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="kennedy@gmail.com"
                placeholderTextColor={Colors.gray400}
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
              <Icon name="lock" type="feather" size={20} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.gray400}
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
                  size={20}
                  color={Colors.gray500}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Icon name="key" type="feather" size={14} color={Colors.primaryBlue600} />
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Icon name="loader" type="feather" size={20} color={Colors.white} style={styles.loadingIcon} />
                <Text style={styles.loginButtonText}>Authenticating...</Text>
              </View>
            ) : (
              <View style={styles.loginContainer}>
                <Icon name="log-in" type="feather" size={20} color={Colors.white} style={styles.loginIcon} />
                <Text style={styles.loginButtonText}>Sign In to HR Portal</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Icon name="shield" type="feather" size={16} color={Colors.success600} />
            <Text style={styles.securityText}>
              This is a secure company portal. Use only company-provided credentials.
            </Text>
          </View>
        </View>

        {/* Access Request Section */}
        <View style={styles.accessContainer}>
          <Text style={styles.accessTitle}>Need Access?</Text>
          <Text style={styles.accessText}>
            If you're an employee and don't have access, please contact your HR department.
          </Text>
          <TouchableOpacity 
            style={styles.accessButton}
            onPress={handleRequestAccess}
          >
            <Icon name="user-plus" type="feather" size={16} color={Colors.primaryBlue600} />
            <Text style={styles.accessButtonText}>Request Access</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Company privacy policy information')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity onPress={() => Alert.alert('Terms', 'Terms of service for company HR system')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity onPress={() => Alert.alert('Support', 'Contact IT support for assistance')}>
              <Text style={styles.footerLink}>IT Support</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footerText}>
            © 2026 Elore HR Kenya. Internal Use Only.
          </Text>
          <Text style={styles.footerText}>
            For HR assistance: hr@elorehub.co.ke
          </Text>
          <Text style={styles.versionText}>v1.0.0 • Secure HR Portal</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
  },
  topCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primaryBlue50,
    opacity: 0.8,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.success50,
    opacity: 0.6,
  },
  header: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryBlue600,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryBlue800,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickLoginContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderStyle: 'dashed',
  },
  quickLoginText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
    fontStyle: 'italic',
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.xs,
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: Layout.spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.white,
  },
  inputIcon: {
    paddingHorizontal: Layout.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  passwordToggle: {
    paddingHorizontal: Layout.spacing.md,
  },
  forgotPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xl,
    gap: Layout.spacing.xs,
    paddingVertical: Layout.spacing.sm,
  },
  forgotPasswordText: {
    color: Colors.primaryBlue600,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.primaryBlue600,
    paddingVertical: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.md,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray400,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
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
    gap: Layout.spacing.sm,
  },
  loginIcon: {
    marginRight: Layout.spacing.xs,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.success50,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.success200,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success800,
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  accessContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  accessText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
    lineHeight: 20,
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBlue300,
  },
  accessButtonText: {
    color: Colors.primaryBlue600,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  footerLink: {
    color: Colors.primaryBlue600,
    fontSize: 12,
    fontWeight: '500',
  },
  footerSeparator: {
    color: Colors.gray400,
    marginHorizontal: Layout.spacing.sm,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  versionText: {
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Layout.spacing.sm,
  },
});