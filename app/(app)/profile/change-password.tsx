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
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { THEME_COLORS } from '@/constants/theme';
import { Layout } from '@/constants/Layout';
import { changePassword } from '@/lib/services/authService';

const ChangePasswordScreen = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    old_password?: string;
    new_password?: string;
    confirm_password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.old_password.trim()) {
      newErrors.old_password = 'Current password is required';
    }

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

const handleSubmit = async () => {
  if (!validateForm()) return;

  setLoading(true);
  try {
    await changePassword({
      old_password: formData.old_password,
      new_password: formData.new_password,
      confirm_password: formData.confirm_password,
    });

    Alert.alert(
      'Success',
      'Your password has been changed successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            setFormData({
              old_password: '',
              new_password: '',
              confirm_password: '',
            });
            router.back();
          },
        },
      ]
    );
  } catch (error: any) {
    console.error('Change password error:', error);
    
    // Handle specific error messages
    let errorMessage = error.message || 'Failed to change password. Please try again.';
    
    // You can add more specific error handling here
    if (errorMessage.includes('Old password is incorrect')) {
      errorMessage = 'Your current password is incorrect. Please try again.';
    } else if (errorMessage.includes('Authentication')) {
      errorMessage = 'Your session has expired. Please log in again.';
      // Optionally redirect to login
      // router.replace('/auth/login');
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setLoading(false);
  }
};

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
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
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={THEME_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* User Info */}
        <View style={styles.userInfoCard}>
          <View style={styles.userAvatar}>
            <Feather name="user" size={32} color={THEME_COLORS.primaryBlue} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, errors.old_password && styles.inputError]}
                placeholder="Enter your current password"
                value={formData.old_password}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, old_password: text }));
                  if (errors.old_password) setErrors(prev => ({ ...prev, old_password: undefined }));
                }}
                secureTextEntry={!showPassword.old}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => togglePasswordVisibility('old')}
              >
                <Feather
                  name={showPassword.old ? 'eye-off' : 'eye'}
                  size={20}
                  color={THEME_COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.old_password && (
              <Text style={styles.errorText}>{errors.old_password}</Text>
            )}
          </View>

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

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Changing Password...</Text>
            ) : (
              <>
                <Feather name="lock" size={20} color={THEME_COLORS.white} />
                <Text style={styles.submitButtonText}>Change Password</Text>
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
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.white,
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  formContainer: {
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
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
  passwordInputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: THEME_COLORS.white,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    paddingRight: 50,
    fontSize: 16,
    color: THEME_COLORS.textPrimary,
  },
  inputError: {
    borderColor: THEME_COLORS.danger,
    borderWidth: 1.5,
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
  requirementsCard: {
    backgroundColor: THEME_COLORS.gray50,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME_COLORS.gray200,
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
});

export default ChangePasswordScreen;