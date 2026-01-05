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
import { useAuth } from '@lib/providers/AuthProvider'; // CHANGED IMPORT
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout'; 
import { Icon } from '@components/ui/Icon';

export default function LoginScreen() {
  const { login, isLoading } = useAuth(); // Now uses the context hook
  const [formData, setFormData] = useState({
    email: '', // Changed from username to email
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
      // Navigation happens automatically in the hook
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={Colors.primaryBlue600} />
          </TouchableOpacity>
          <Text style={styles.title}>Login</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color={Colors.primaryBlue500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.gray400}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={Colors.primaryBlue500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
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
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={Colors.gray500}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Icon name="hourglass-empty" size={20} color={Colors.white} style={styles.loadingIcon} />
                <Text style={styles.loginButtonText}>Logging in...</Text>
              </View>
            ) : (
              <View style={styles.loginContainer}>
                <Icon name="login" size={20} color={Colors.white} style={styles.loginIcon} />
                <Text style={styles.loginButtonText}>Login</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}> Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For assistance, contact HR at hr@elorehub.co.ke
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  backButton: {
    marginRight: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.primaryBlue800,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.lg,
    backgroundColor: Colors.gray50,
  },
  inputIcon: {
    paddingHorizontal: Layout.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.textPrimary,
  },
  passwordToggle: {
    paddingHorizontal: Layout.spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Layout.spacing.lg,
  },
  forgotPasswordText: {
    color: Colors.primaryBlue600,
    fontSize: Layout.fontSize.sm,
  },
  loginButton: {
    backgroundColor: Colors.primaryBlue600,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: Layout.spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginIcon: {
    marginRight: Layout.spacing.sm,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.xl,
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: Layout.fontSize.md,
  },
  registerLink: {
    color: Colors.primaryBlue600,
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Layout.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textTertiary,
    fontSize: Layout.fontSize.sm,
    textAlign: 'center',
  },
});
