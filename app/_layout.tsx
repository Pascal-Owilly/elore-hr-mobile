// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@components/theme/ThemeProvider';
import { QueryProvider } from '@lib/providers/QueryProvider';
import { AuthProvider, useAuth } from '@lib/providers/AuthProvider'; // Import useAuth
import { NotificationProvider } from '@lib/providers/NotificationProvider';
import { OfflineProvider } from '@lib/providers/OfflineProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { View, ActivityIndicator } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (isAuthenticated && inAuthGroup) {
      // If authenticated and trying to access auth screens, redirect to app
      console.log('🔄 Redirecting authenticated user to app');
      router.replace('/app'); // Or '/(app)'
    } else if (!isAuthenticated && !inAuthGroup) {
      // If not authenticated and trying to access app screens, redirect to login
      console.log('🔄 Redirecting unauthenticated user to login');
      router.replace('/auth/login');
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
        options={{ headerShown: false }}
      />
      
      {/* Auth Screens */}
      <Stack.Screen
        name="auth/login"
        options={{
          title: 'Login',
          headerBackTitle: 'Back',
          headerShown: false, // Hide header for login
        }}
      />
      
      <Stack.Screen
        name="auth/register"
        options={{
          title: 'Register',
          headerBackTitle: 'Back',
        }}
      />
      
      {/* App/Tabs Navigation */}
      <Stack.Screen
        name="app"
        options={{ headerShown: false }}
      />
      
      {/* Modal */}
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