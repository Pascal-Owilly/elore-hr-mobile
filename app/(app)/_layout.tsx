// app/(app)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  // Use safe area insets to handle device overlays automatically
  const insets = useSafeAreaInsets();
  
  // Calculate bottom inset - add extra margin for more spacing
  const bottomInset = insets.bottom;
  
  // Add extra margin (20px) on top of the safe area
  const extraBottomMargin = 20;
  
  // For different platforms
  const adjustedBottomInset = Platform.select({
    ios: Math.max(bottomInset, 34) + extraBottomMargin,
    android: Math.max(bottomInset, 24) + extraBottomMargin,
    default: Math.max(bottomInset, 24) + extraBottomMargin,
  });
  
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: 45 + adjustedBottomInset,
          paddingBottom: adjustedBottomInset,
          paddingTop: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 6,
        },
        tabBarActiveTintColor: '#0056b3',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Text style={{ 
                fontSize: 28, 
                color,
                textAlign: 'center',
                lineHeight: 28,
              }}>🏠</Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Text style={{ 
                fontSize: 28, 
                color,
                textAlign: 'center',
                lineHeight: 28,
              }}>⏰</Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Text style={{ 
                fontSize: 28, 
                color,
                textAlign: 'center',
                lineHeight: 28,
              }}>💰</Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="leaves"
        options={{
          title: 'Leaves',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Text style={{ 
                fontSize: 28, 
                color,
                textAlign: 'center',
                lineHeight: 28,
              }}>📅</Text>
            </View>
          ),
        }}
      />

      {/* Contracts is already properly configured as a nested group */}
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Text style={{ 
                fontSize: 28, 
                color,
                textAlign: 'center',
                lineHeight: 28,
              }}>📄</Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Text style={{ 
                fontSize: 28, 
                color,
                textAlign: 'center',
                lineHeight: 28,
              }}>🔔</Text>
            </View>
          ),
        }}
      />

      {/* Settings Tab - includes biometric settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Text style={{ 
                fontSize: 28, 
                color,
                textAlign: 'center',
                lineHeight: 28,
              }}>⚙️</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}