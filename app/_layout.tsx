import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@components/theme/ThemeProvider';
import { QueryProvider } from '@lib/providers/QueryProvider';
import { AuthProvider } from '@lib/providers/AuthProvider';
import { NotificationProvider } from '@lib/providers/NotificationProvider';
import { OfflineProvider } from '@lib/providers/OfflineProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

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
                    {/* Index/Home Screen */}
                    <Stack.Screen
                      name="index"
                      options={{
                        headerShown: false,
                      }}
                    />

                    {/* Modal */}
                    <Stack.Screen
                      name="modal"
                      options={{
                        presentation: 'modal',
                        title: 'Modal',
                      }}
                    />

                    {/* Tabs Navigation */}
                    <Stack.Screen
                      name="app"
                      options={{
                        headerShown: false,
                      }}
                    />

                    {/* Auth Screens - WITHOUT PARENTHESES */}
                    <Stack.Screen
                      name="auth/login"
                      options={{
                        title: 'Login',
                        headerBackTitle: 'Back',
                      }}
                    />

                    <Stack.Screen
                      name="auth/register"
                      options={{
                        title: 'Register',
                        headerBackTitle: 'Back',
                      }}
                    />

                    {/* Note: If you don't have forgot-password screen, remove or create it */}
                    {/* <Stack.Screen
                      name="auth/forgot-password"
                      options={{
                        title: 'Forgot Password',
                        headerBackTitle: 'Back',
                      }}
                    /> */}

                    {/* Remove these if you don't have them: */}
                    {/* 
                    <Stack.Screen
                      name="(app)"
                      options={{
                        headerShown: false,
                      }}
                    />
                    
                    <Stack.Screen
                      name="(admin)"
                      options={{
                        headerShown: false,
                      }}
                    />
                    */}
                  </Stack>
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