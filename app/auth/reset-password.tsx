import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { THEME_COLORS } from '@/constants/theme';
import { Layout } from '@/constants/Layout';
import { resetPasswordRequest, resetPasswordConfirm } from '@/lib/services/authService';

const ResetPasswordScreen = () => {
  const params = useLocalSearchParams<{ uid?: string; token?: string }>();
  const [step, setStep] = useState<'request' | 'confirm'>(
    params.uid && params.token ? 'confirm' : 'request'
  );
  const [formData, setFormData] = useState({
    email: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    new_password?: string;
    confirm_password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    const newErrors: typeof errors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: typeof errors = {};

    if (!formData.new_password.trim()) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.new_password)) {
      newErrors.new_password = 'Password must include uppercase, lowercase, and numbers';
    }

    if (!formData.confirm_password.trim()) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestReset = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await resetPasswordRequest({ email: formData.email });
      setEmailSent(true);
      Alert.alert(
        'Check Your Email',
        'If an account exists with this email, you will receive password reset instructions.'
      );
    } catch (error: any) {
      console.error('Reset request error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!validatePassword()) return;

    if (!params.uid || !params.token) {
      Alert.alert('Error', 'Invalid reset link. Please request a new reset email.');
      setStep('request');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordConfirm({
        uid: params.uid,
        token: params.token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [
          {
            text: 'Login Now',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Reset confirm error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to reset password. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 'confirm') {
                setStep('request');
              } else {
                router.back();
              }
            }}
          >
            <Feather name="arrow-left" size={24} color={THEME_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'request' ? 'Reset Password' : 'Create New Password'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Feather 
              name={step === 'request' ? 'mail' : 'lock'} 
              size={48} 
              color={THEME_COLORS.primaryBlue} 
            />
          </View>
        </View>

        {/* Step 1: Email Request */}
        {step === 'request' && (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            {emailSent ? (
              <View style={styles.successCard}>
                <Feather name="check-circle" size={48} color={THEME_COLORS.success} />
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  Check your inbox at {formData.email} for password reset instructions.
                </Text>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => {
                    setEmailSent(false);
                    handleRequestReset();
                  }}
                  disabled={loading}
                >
                  <Text style={styles.resendButtonText}>Resend Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backToLoginButton}
                  onPress={() => router.replace('/auth/login')}
                >
                  <Text style={styles.backToLoginButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, email: text }));
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleRequestReset}
                  disabled={loading}
                >
                  {loading ? (
                    <Text style={styles.submitButtonText}>Sending...</Text>
                  ) : (
                    <>
                      <Feather name="send" size={20} color={THEME_COLORS.white} />
                      <Text style={styles.submitButtonText}>Send Reset Instructions</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginLink}
                  onPress={() => router.replace('/auth/login')}
                >
                  <Feather name="arrow-left" size={16} color={THEME_COLORS.primaryBlue} />
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Step 2: Password Reset */}
        {step === 'confirm' && (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Please enter your new password below.
            </Text>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, errors.new_password && styles.inputError]}
                  placeholder="Enter new password"
                  value={formData.new_password}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, new_password: text }));
                    if (errors.new_password) setErrors(prev => ({ ...prev, new_password: undefined }));
                  }}
                  secureTextEntry={!showPassword.new}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => togglePasswordVisibility('new')}
                >
                  <Feather
                    name={showPassword.new ? 'eye-off' : 'eye'}
                    size={20}
                    color={THEME_COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.new_password ? (
                <Text style={styles.errorText}>{errors.new_password}</Text>
              ) : (
                <Text style={styles.helperText}>
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, errors.confirm_password && styles.inputError]}
                  placeholder="Confirm new password"
                  value={formData.confirm_password}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, confirm_password: text }));
                    if (errors.confirm_password) setErrors(prev => ({ ...prev, confirm_password: undefined }));
                  }}
                  secureTextEntry={!showPassword.confirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => togglePasswordVisibility('confirm')}
                >
                  <Feather
                    name={showPassword.confirm ? 'eye-off' : 'eye'}
                    size={20}
                    color={THEME_COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirm_password && (
                <Text style={styles.errorText}>{errors.confirm_password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleConfirmReset}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Resetting Password...</Text>
              ) : (
                <>
                  <Feather name="lock" size={20} color={THEME_COLORS.white} />
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Password Requirements */}
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <Feather 
                  name={formData.new_password.length >= 8 ? 'check-circle' : 'circle'} 
                  size={16} 
                  color={formData.new_password.length >= 8 ? THEME_COLORS.success : THEME_COLORS.textTertiary} 
                />
                <Text style={[
                  styles.requirementText,
                  formData.new_password.length >= 8 && styles.requirementMet
                ]}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Feather 
                  name={/(?=.*[a-z])/.test(formData.new_password) ? 'check-circle' : 'circle'} 
                  size={16} 
                  color={/(?=.*[a-z])/.test(formData.new_password) ? THEME_COLORS.success : THEME_COLORS.textTertiary} 
                />
                <Text style={[
                  styles.requirementText,
                  /(?=.*[a-z])/.test(formData.new_password) && styles.requirementMet
                ]}>
                  One lowercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Feather 
                  name={/(?=.*[A-Z])/.test(formData.new_password) ? 'check-circle' : 'circle'} 
                  size={16} 
                  color={/(?=.*[A-Z])/.test(formData.new_password) ? THEME_COLORS.success : THEME_COLORS.textTertiary} 
                />
                <Text style={[
                  styles.requirementText,
                  /(?=.*[A-Z])/.test(formData.new_password) && styles.requirementMet
                ]}>
                  One uppercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Feather 
                  name={/(?=.*\d)/.test(formData.new_password) ? 'check-circle' : 'circle'} 
                  size={16} 
                  color={/(?=.*\d)/.test(formData.new_password) ? THEME_COLORS.success : THEME_COLORS.textTertiary} 
                />
                <Text style={[
                  styles.requirementText,
                  /(?=.*\d)/.test(formData.new_password) && styles.requirementMet
                ]}>
                  One number
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer Help Text */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => Linking.openURL('mailto:support@hrsystemkenya.com')}
            >
              Contact Support
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl + 20,
    paddingBottom: Layout.spacing.lg,
    backgroundColor: THEME_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.borderLight,
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME_COLORS.textPrimary,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME_COLORS.primaryBlue,
  },
  formContainer: {
    marginHorizontal: Layout.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME_COLORS.textPrimary,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: Layout.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: Layout.spacing.sm,
  },
  input: {
    backgroundColor: THEME_COLORS.white,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    fontSize: 16,
    color: THEME_COLORS.textPrimary,
  },
  inputError: {
    borderColor: THEME_COLORS.danger,
    borderWidth: 1.5,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  errorText: {
    color: THEME_COLORS.danger,
    fontSize: 14,
    marginTop: Layout.spacing.xs,
  },
  helperText: {
    color: THEME_COLORS.textTertiary,
    fontSize: 13,
    marginTop: Layout.spacing.xs,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: THEME_COLORS.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: THEME_COLORS.gray400,
    opacity: 0.7,
  },
  submitButtonText: {
    color: THEME_COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  backToLoginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  backToLoginText: {
    color: THEME_COLORS.primaryBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
    marginTop: Layout.spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME_COLORS.success,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  successText: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    lineHeight: 24,
  },
  resendButton: {
    backgroundColor: THEME_COLORS.primaryBlue,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.md,
  },
  resendButtonText: {
    color: THEME_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
  },
  backToLoginButtonText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  requirementsCard: {
    backgroundColor: THEME_COLORS.gray50,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME_COLORS.gray200,
    marginTop: Layout.spacing.lg,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  requirementText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  requirementMet: {
    color: THEME_COLORS.success,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Layout.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
  },
  footerLink: {
    color: THEME_COLORS.primaryBlue,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;