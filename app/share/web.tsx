import { ThemedText } from '@/components/themed-text';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function ShareWebScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;

  useEffect(() => {
    // Check if the app is installed by trying to open a deeplink
    const checkAppInstallation = async () => {
      try {
        const canOpen = await Linking.canOpenURL('woxtripflox://');
        setIsAppInstalled(canOpen);
      } catch (error) {
        console.error('Error checking app installation:', error);
        setIsAppInstalled(false);
      }
    };

    checkAppInstallation();
  }, []);

  const handleOpenInApp = async () => {
    try {
      const deeplink = `woxtripflox://share/${token}`;
      const canOpen = await Linking.canOpenURL(deeplink);
      
      if (canOpen) {
        await Linking.openURL(deeplink);
      } else {
        // Fallback to app store
        await Linking.openURL('https://apps.apple.com/app/woxtripflox');
      }
    } catch (error) {
      console.error('Error opening app:', error);
    }
  };

  const handleDownloadApp = async () => {
    try {
      // Try to open app store based on platform
      const appStoreUrl = 'https://apps.apple.com/app/woxtripflox';
      await Linking.openURL(appStoreUrl);
    } catch (error) {
      console.error('Error opening app store:', error);
    }
  };

  return (
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="medium">
        <View style={styles.content}>
          <GlassCard style={styles.mainCard} blurIntensity={30}>
            <View style={styles.header}>
              <ThemedText style={styles.appIcon}>🗺️</ThemedText>
              <ThemedText style={styles.appTitle}>Wox Tripflox</ThemedText>
              <ThemedText style={[styles.appSubtitle, { color: theme.textSecondary }]}>
                Your Travel Companion
              </ThemedText>
            </View>

            <View style={styles.shareContent}>
              <ThemedText style={styles.shareTitle}>
                {isAppInstalled ? 'Open in App' : 'Download App'}
              </ThemedText>
              <ThemedText style={[styles.shareDescription, { color: theme.textSecondary }]}>
                {isAppInstalled 
                  ? 'This trip was shared with you. Tap below to view it in the Wox Tripflox app.'
                  : 'This trip was shared with you. Download Wox Tripflox to view and explore this amazing travel experience.'
                }
              </ThemedText>

              {token && (
                <View style={styles.tokenContainer}>
                  <ThemedText style={[styles.tokenLabel, { color: theme.textTertiary }]}>
                    Share Token:
                  </ThemedText>
                  <ThemedText style={[styles.tokenValue, { color: theme.text }]}>
                    {token.substring(0, 8)}...
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              {isAppInstalled ? (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                  onPress={handleOpenInApp}
                >
                  <ThemedText style={[styles.primaryButtonText, { color: theme.text }]}>
                    📱 Open in App
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                  onPress={handleDownloadApp}
                >
                  <ThemedText style={[styles.primaryButtonText, { color: theme.text }]}>
                    📥 Download App
                  </ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => window.history.back()}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: theme.text }]}>
                  ← Go Back
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: theme.textTertiary }]}>
                Made with ❤️ for travelers
              </ThemedText>
            </View>
          </GlassCard>
        </View>
      </AnimatedWaves>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainCard: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  shareContent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  shareDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  tokenValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});