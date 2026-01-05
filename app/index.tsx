import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@lib/providers/AuthProvider';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading indicator FIRST
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primaryBlue600} />
      </View>
    );
  }

  // Redirect if authenticated - BEFORE any other hooks
  if (isAuthenticated) {
    return <Redirect href="/app" />;
  }

  // NOW declare all hooks - they will always run in this render path
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 15 });
    logoOpacity.value = withSequence(withDelay(100, withSpring(1, { damping: 15 })));
    titleTranslateY.value = withSequence(withDelay(200, withSpring(0, { damping: 15 })));
    titleOpacity.value = withSequence(withDelay(200, withSpring(1, { damping: 15 })));
    buttonsOpacity.value = withSequence(withDelay(400, withSpring(1, { damping: 15 })));
  }, []);

  const handleGetStarted = () => router.push('/auth/login');
  const handleLogin = () => router.push('/auth/login');
  const handleRegister = () => router.push('/auth/register');

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleTranslateY.value }],
    opacity: titleOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Kenya Flag Header - Stays at top */}
      <View style={styles.flagHeader}>
        <View style={[styles.flagStrip, { backgroundColor: Colors.kenyaBlack || '#000000' }]} />
        <View style={[styles.flagStrip, { backgroundColor: Colors.kenyaRed || '#BB0000' }]} />
        <View style={[styles.flagStrip, { backgroundColor: Colors.kenyaGreen || '#006600' }]} />
        <View style={[styles.flagStrip, { backgroundColor: Colors.kenyaWhite || '#FFFFFF' }]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logoBackground}>
            <Image
              source={require('@assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.title}>Elore HR </Text>
          <Text style={styles.subtitle}>Workforce, simplified.</Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonsStyle]}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Features */}
        <Animated.View style={[styles.featuresContainer, buttonsStyle]}>
          <View style={styles.featuresRow}>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.primaryBlue100 }]}>
                <Text style={styles.featureIconText}>📍</Text>
              </View>
              <Text style={styles.featureText}>Geofenced Attendance</Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.gold100 }]}>
                <Text style={styles.featureIconText}>💰</Text>
              </View>
              <Text style={styles.featureText}>M-Pesa Payroll</Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.success100 }]}>
                <Text style={styles.featureIconText}>📄</Text>
              </View>
              <Text style={styles.featureText}>E-Sign Contracts</Text>
            </View>
          </View>

          <View style={styles.featuresRow}>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.info100 }]}>
                <Text style={styles.featureIconText}>📋</Text>
              </View>
              <Text style={styles.featureText}>Leave Management</Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.warning100 }]}>
                <Text style={styles.featureIconText}>📊</Text>
              </View>
              <Text style={styles.featureText}>Reports & Analytics</Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.violet100 }]}>
                <Text style={styles.featureIconText}>📱</Text>
              </View>
              <Text style={styles.featureText}>Offline Attendance</Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, buttonsStyle]}>
          <Text style={styles.footerText}>
            Compliant with Kenya Labor Laws & Statutory Requirements
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flagHeader: {
    height: 8,
    flexDirection: 'row',
  },
  flagStrip: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.xl,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: Layout.spacing.xl,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: Layout.borderRadius.xl,
    backgroundColor: Colors.primaryBlue50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryBlue200,
  },
  logo: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize['4xl'],
    fontWeight: 'bold',
    color: Colors.primaryBlue800,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: Layout.spacing.xl,
  },
  button: {
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primaryBlue600,
    marginBottom: Layout.spacing.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.gold500,
  },
  secondaryButtonText: {
    color: Colors.gray900,
    fontWeight: '600',
  },
  outlineButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.primaryBlue500,
  },
  outlineButtonText: {
    color: Colors.primaryBlue600,
    fontWeight: '600',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: Layout.spacing.xl,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Layout.spacing.lg,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 10,
    color: Colors.gray400,
  },
});
