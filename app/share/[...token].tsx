import { ThemedText } from '@/components/themed-text';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Colors } from '@/constants/theme';
import { getTripShareByToken } from '@/contexts/sharing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

export default function ShareTokenScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string[] }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;

  const handleShareLink = useCallback(async () => {
    // Extract token from the URL path array
    const shareToken = token?.[0];
    
    if (!shareToken) {
      setError('No share token provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if the share token exists
      const share = await getTripShareByToken(shareToken);
      if (!share) {
        setError('Invalid or expired share link');
        return;
      }

      // Check if share has expired
      if (share.expiresAt && share.expiresAt < Date.now()) {
        setError('This share link has expired');
        return;
      }

      // Valid token, redirect to share view
      router.replace(`/share/${shareToken}`);
    } catch (error) {
      console.error('Error handling share link:', error);
      setError('Failed to load share link');
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
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <GlassCard style={styles.loadingCard} blurIntensity={30}>
            <ThemedText style={styles.loadingText}>{t('share.loadingShareLink')}</ThemedText>
          </GlassCard>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <GlassCard style={styles.errorCard} blurIntensity={30}>
            <ThemedText style={styles.errorTitle}>❌ Error</ThemedText>
            <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
              {error}
            </ThemedText>
            <ThemedText style={[styles.errorSubtext, { color: theme.textTertiary }]}>
              Please check the link and try again.
            </ThemedText>
          </GlassCard>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="medium">
        <GlassCard style={styles.redirectCard} blurIntensity={30}>
          <ThemedText style={styles.redirectText}>{t('share.redirecting')}</ThemedText>
        </GlassCard>
      </AnimatedWaves>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  errorCard: {
    padding: 30,
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  redirectCard: {
    padding: 30,
    alignItems: 'center',
  },
  redirectText: {
    fontSize: 18,
  },
});
