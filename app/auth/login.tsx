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
  Image,
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
    Alert.alert('Forgot Password', 'Please contact your HR administrator');
  };

  const handleBack = () => {
    router.back();
  };

  const handleQuickFill = (type: 'admin' | 'employee') => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@company.com',
        password: 'admin123',
      });
    } else {
      setFormData({
        email: 'employee@company.com',
        password: 'employee123',
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
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="briefcase" type="feather" size={40} color={Colors.white} />
            </View>
            <Text style={styles.logoText}>Welcome</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

          </View>
          


        {/* Form Card */}
        <View style={styles.formCard}>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Icon name="mail" type="feather" size={16} color={Colors.primaryBlue500} />
              <Text style={styles.inputLabel}>Email Address</Text>
            </View>
            <View style={styles.inputContainer}>
              <Icon name="at-sign" type="feather" size={20} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.gray400}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Icon name="lock" type="feather" size={16} color={Colors.primaryBlue500} />
              <Text style={styles.inputLabel}>Password</Text>
            </View>
            <View style={styles.inputContainer}>
              <Icon name="key" type="feather" size={20} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.gray400}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
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
            <Icon name="help-circle" type="feather" size={16} color={Colors.primaryBlue500} />
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
                <Text style={styles.loginButtonText}>Sign In to Dashboard</Text>
                <Icon name="chevron-right" type="feather" size={20} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footerText}>
            © 2026 Elore HR Kenya. For assistance: hr@elorehub.co.ke
          </Text>
          <Text style={styles.versionText}>v1.0.0 • Built for Kenya</Text>
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
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.success50,
  },
  header: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryBlue600,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    ...Layout.shadow.md,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primaryBlue800,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 14,
    color: Colors.success600,
    fontWeight: '600',
    backgroundColor: Colors.success50,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Layout.spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
  quickLoginContainer: {
    marginBottom: Layout.spacing.lg,
  },
  quickLoginText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.xs,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    marginBottom: Layout.spacing.xl,
    ...Layout.shadow.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    gap: Layout.spacing.sm,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  inputGroup: {
    marginBottom: Layout.spacing.lg,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
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
    justifyContent: 'flex-end',
    marginBottom: Layout.spacing.xl,
    gap: Layout.spacing.xs,
  },
  forgotPasswordText: {
    color: Colors.primaryBlue600,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: Colors.primaryBlue600,
    paddingVertical: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.xl,
    ...Layout.shadow.sm,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
  },
  loadingIcon: {
    animation: 'spin 1s linear infinite',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
  },
  loginIcon: {
    marginRight: -4,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  socialLogin: {
    marginBottom: Layout.spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    paddingHorizontal: Layout.spacing.md,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.spacing.sm,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
    paddingTop: Layout.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Layout.spacing.sm,
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLinkText: {
    color: Colors.primaryBlue600,
    fontSize: 16,
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
  },
});

// Add this to your global styles or create a separate animation
// For simple animation, you can use:
const spinAnimation = {
  animationKeyframes: {
    '0%': { transform: [{ rotate: '0deg' }] },
    '100%': { transform: [{ rotate: '360deg' }] },
  },
  animationDuration: '1s',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
};