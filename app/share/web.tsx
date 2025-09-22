import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function WebShareScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Wox Tripflox
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: text }]}>
          Shared Trip
        </ThemedText>
        
        {token ? (
          <View style={styles.tokenContainer}>
            <ThemedText style={[styles.tokenLabel, { color: text }]}>
              Share Token:
            </ThemedText>
            <ThemedText style={[styles.token, { color: text }]}>
              {token}
            </ThemedText>
          </View>
        ) : null}
        
        <View style={styles.info}>
          <ThemedText style={[styles.infoText, { color: text }]}>
            To view this shared trip, please open the Wox Tripflox mobile app.
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: text }]}>
            If you don't have the app installed, you can download it from the App Store or Google Play Store.
          </ThemedText>
        </View>
        
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: text }]}>
            © 2024 Wox Tripflox. All rights reserved.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 18,
    opacity: 0.8,
  },
  tokenContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    width: '100%',
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  token: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  info: {
    marginBottom: 32,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});
