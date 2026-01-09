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

  // 1. Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue600} />
      </View>
    );
  }

  // 2. If already logged in, send them straight to the dashboard
  if (isAuthenticated) {
    return <Redirect href="/(app)/dashboard" />;
  }

  // Animation values
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

  // Navigation handlers
  const handleGetStarted = () => router.push('/auth/login');
  const handleLogin = () => router.push('/auth/login');
  const handleRegister = () => router.push('/auth/register');

  // Animated styles
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
      {/* Kenya Flag Header */}
      <View style={styles.flagHeader}>
        <View style={[styles.flagStrip, { backgroundColor: '#000000' }]} />
        <View style={[styles.flagStrip, { backgroundColor: '#BB0000' }]} />
        <View style={[styles.flagStrip, { backgroundColor: '#006600' }]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section - Now filling the card */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logoBackground}>
            <Image
              source={require('@assets/images/logo.png')}
              style={styles.logo}
              resizeMode="cover" // Fills the entire circular area
            />
          </View>
        </Animated.View>

        {/* Title Section */}
        {/* <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.title}>Elore HR</Text>
          <Text style={styles.subtitle}>Workforce, simplified.</Text>
        </Animated.View> */}

        {/* Buttons Section */}
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
              <Text style={styles.outlineButtonText}>Access Info</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Features Grid */}
        <Animated.View style={[styles.featuresContainer, buttonsStyle]}>
          <View style={styles.featuresRow}>
            <FeatureItem icon="📍" label="Geofenced Attendance" color={Colors.primaryBlue100} />
            <FeatureItem icon="💰" label="M-Pesa Payroll" color={Colors.gold100} />
            <FeatureItem icon="📄" label="E-Sign Contracts" color={Colors.success100} />
          </View>

          <View style={styles.featuresRow}>
            <FeatureItem icon="📋" label="Leave Management" color={Colors.info100} />
            <FeatureItem icon="📊" label="Reports & Analytics" color={Colors.warning100} />
            <FeatureItem icon="📱" label="Offline Mode" color={Colors.violet100} />
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

// Helper component for cleaner code
function FeatureItem({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: color }]}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ded3',

  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagHeader: {
    height: 6,
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
    width: 150,
    height: 150,
    borderRadius: 85, // Circular
    backgroundColor: Colors.primaryBlue50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#deab63',

    overflow: 'hidden', // Required for image to cover
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primaryBlue800,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: Layout.spacing.xl,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0056b3',
    marginBottom: Layout.spacing.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.gold500,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  outlineButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#0056b3',
  },
  outlineButtonText: {
    color: '#deab63',
    fontWeight: '700',
  },
  featuresContainer: {
    width: '100%',
    marginVertical: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 10,
    color: Colors.gray400,
    marginTop: 4,
  },
});