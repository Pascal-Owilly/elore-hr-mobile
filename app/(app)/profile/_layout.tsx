// app/(app)/profile/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="screen"  // Change from "index" to "screen"
        options={{ 
          headerTitle: 'Profile',
          headerShown: true 
        }}
      />
    </Stack>
  );
}