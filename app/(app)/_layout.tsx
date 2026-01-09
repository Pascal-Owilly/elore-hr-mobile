import React from 'react';
import { Tabs, router } from 'expo-router';
import { Text, Platform, TouchableOpacity, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  // Calculate safe area for bottom tabs
  const bottomSafeArea = Platform.select({
    ios: insets.bottom,
    android: Math.max(insets.bottom, 10), // Ensure minimum padding for Android gesture nav
  });

  // Show a simple menu when three dots are clicked
  const handleMorePress = () => {
    Alert.alert(
      "More Options",
      "Quick Access",
      [
        { text: "Notifications", onPress: () => router.push('/(app)/notifications') },
        { text: "Settings", onPress: () => router.push('/(app)/settings') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#e9ded3',
          borderBottomColor: '#deab63',
          borderBottomWidth: 1,
        },
        headerTitleStyle: { color: '#0056b3', fontWeight: '700' },
        headerRight: () => (
          <TouchableOpacity onPress={handleMorePress} style={{ marginRight: 20, padding: 5 }}>
            <Text style={{ fontSize: 24, color: '#0056b3', fontWeight: 'bold' }}>⋮</Text>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#e9ded3',
          borderTopColor: '#deab63',
          borderTopWidth: 2,
          // Use dynamic height calculation based on platform and safe area
          height: Platform.select({
            ios: 60 + bottomSafeArea, // Standard iOS tab height + safe area
            android: 60 + bottomSafeArea, // Same for Android
          }),
          // Ensure content is properly padded above any system UI
          paddingBottom: bottomSafeArea,
          paddingTop: 10,
          // Remove absolute positioning to work with safe areas
          position: 'relative',
        },
        tabBarActiveTintColor: '#0056b3',
        tabBarInactiveTintColor: '#8b837b',
        tabBarLabelStyle: { 
          fontSize: 10, 
          fontWeight: '700',
          marginBottom: Platform.select({
            ios: 0,
            android: 4, // Extra margin for Android to account for gesture bar
          }),
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color: focused ? '#0056b3' : '#8b837b' }}>🏠</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color: focused ? '#0056b3' : '#8b837b' }}>⏰</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color: focused ? '#0056b3' : '#8b837b' }}>💰</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="leaves"
        options={{
          title: 'Leaves',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color: focused ? '#0056b3' : '#8b837b' }}>📅</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color: focused ? '#0056b3' : '#8b837b' }}>📄</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color: focused ? '#0056b3' : '#8b837b' }}>👤</Text>
          ),
        }}
      />

      {/* Hide Utility Screens from the Bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}