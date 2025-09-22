import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import React from 'react';

export default function TripsStackLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: theme.background },
      headerTintColor: theme.text,
      headerTitleStyle: { color: theme.text },
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="new" options={{ title: 'New Trip' }} />
      <Stack.Screen name="[id]" options={{ title: 'Trip Details' }} />
      <Stack.Screen name="[id]/new-step" options={{ title: 'Add Step' }} />
      <Stack.Screen name="[id]/journal" options={{ title: 'Travel Journal' }} />
      <Stack.Screen name="[id]/journal/new-entry" options={{ title: 'New Journal Entry' }} />
      <Stack.Screen name="[id]/journal/[entryId]" options={{ title: 'Journal Entry' }} />
      <Stack.Screen name="[id]/checklists" options={{ title: 'Preparation Lists' }} />
      <Stack.Screen name="[id]/checklists/new" options={{ title: 'New Checklist' }} />
      <Stack.Screen name="[id]/checklists/[checklistId]" options={{ title: 'Checklist' }} />
      <Stack.Screen name="[id]/share" options={{ title: 'Share Trip' }} />
      <Stack.Screen name="offline" options={{ title: 'Offline Mode' }} />
    </Stack>
  );
}


