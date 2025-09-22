import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { getTripShareByToken } from '@/contexts/sharing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

export default function ShareIndexScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');

  const handleShareLink = useCallback(async () => {
    if (!token) {
      // No token provided, show web page
      router.replace('/share/web');
      return;
    }

    try {
      setLoading(true);
      
      // Check if the share token exists
      const share = await getTripShareByToken(token);
      if (!share) {
        // Invalid token, show web page
        router.replace('/share/web');
        return;
      }

      // Check if share has expired
      if (share.expiresAt && share.expiresAt < Date.now()) {
        // Expired token, show web page
        router.replace('/share/web');
        return;
      }

      // Valid token, redirect to share view
      router.replace(`/share/${token}`);
    } catch (error) {
      console.error('Error handling share link:', error);
      // Error occurred, show web page
      router.replace('/share/web');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      handleShareLink();
    }, [handleShareLink])
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText>Redirecting...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
