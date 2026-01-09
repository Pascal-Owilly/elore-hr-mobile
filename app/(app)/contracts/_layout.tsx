import { Stack } from 'expo-router';
import { ContractProvider } from '@/lib/contexts/ContractContext';

export default function ContractsLayout() {
  return (
    <ContractProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="[id]/sign" />
        <Stack.Screen name="create" />
      </Stack>
    </ContractProvider>
  );
}