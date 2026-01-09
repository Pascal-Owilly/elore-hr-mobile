// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { QueryProvider } from '../lib/providers/QueryProvider';
import { AuthProvider, useAuth } from '../lib/providers/AuthProvider';
import { NotificationProvider } from '../lib/providers/NotificationProvider';
import { OfflineProvider } from '../lib/providers/OfflineProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { View, ActivityIndicator } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

// app/_layout.tsx

useEffect(() => {
  // 1. Wait until auth is loaded and navigation is ready
  if (isLoading || !rootNavigationState?.key) return;

  const inAuthGroup = segments[0] === 'auth';
  const inAppGroup = segments[0] === '(app)';
  const inAdminGroup = segments[0] === 'admin';
  const isAtRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

  if (!isAuthenticated) {
    // 2. If NOT logged in and trying to access protected groups, 
    // force them back to the landing page (app/index.tsx)
    if (inAppGroup || inAdminGroup) {
      console.log('🛡️ Unauthenticated: Redirecting to Landing Page');
      router.replace('/'); 
    }
  } else {
    // 3. If LOGGED IN and sitting on landing or auth pages, 
    // move them into the app
    if (isAtRoot || inAuthGroup) {
      console.log('✅ Authenticated: Moving to Dashboard');
      router.replace('/(app)/dashboard');
    }
  }
}, [isAuthenticated, isLoading, segments, rootNavigationState?.key]);

  if (isLoading || !rootNavigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primaryBlue600} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primaryBlue700,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: Layout.fontSize.lg,
        },
        contentStyle: {
          backgroundColor: Colors.backgroundLight,
        },
        animation: 'slide_from_right',
      }}
    >
      {/* Redirect index based on auth */}
      <Stack.Screen
        name="index"
        options={{ headerShown: true }}
      />
      
      {/* Auth Screens GROUP - REPLACE INDIVIDUAL SCREENS WITH THIS */}
      <Stack.Screen
        name="auth"
        options={{ headerShown: true }}
      />
      
      {/* App/Tabs Navigation */}
      <Stack.Screen
        name="(app)"
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          title: 'Modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('@assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <OfflineProvider>
                <NotificationProvider>
                  <RootLayoutNav />
                  <StatusBar style="light" backgroundColor={Colors.primaryBlue700} />
                </NotificationProvider>
              </OfflineProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}