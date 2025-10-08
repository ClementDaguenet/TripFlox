import { ThemedText } from '@/components/themed-text';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Colors } from '@/constants/theme';
import { getChecklists, getJournalEntries, getTripById, getTripSteps, TripRow } from '@/contexts/db';
import { getTripShareByToken } from '@/contexts/sharing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ShareTokenScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;
  const insets = useSafeAreaInsets();

  const loadSharedTrip = useCallback(async () => {
    if (!token) {
      setError('No share token provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if the share token exists
      const share = await getTripShareByToken(token);
      if (!share) {
        setError('Invalid or expired share link');
        return;
      }

      // Check if share has expired
      if (share.expiresAt && share.expiresAt < Date.now()) {
        setError('This share link has expired');
        return;
      }

      // Load trip data
      const [tripData, stepsData, journalData, checklistsData] = await Promise.all([
        getTripById(share.tripId),
        getTripSteps(share.tripId),
        getJournalEntries(share.tripId),
        getChecklists(share.tripId)
      ]);

      setTrip(tripData);
      setSteps(stepsData);
      setJournalEntries(journalData);
      setChecklists(checklistsData);
    } catch (error) {
      console.error('Error loading shared trip:', error);
      setError('Failed to load shared trip');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadSharedTrip();
    }, [loadSharedTrip])
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderStep = ({ item, index }: { item: any; index: number }) => (
    <GlassCard key={item.id} style={styles.stepCard} blurIntensity={20}>
      <View style={styles.stepHeader}>
        <ThemedText style={[styles.stepNumber, { color: theme.text }]}>{index + 1}</ThemedText>
        <View style={styles.stepContent}>
          <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
            {item.name}
          </ThemedText>
          {item.description && (
            <ThemedText style={[styles.stepDescription, { color: theme.textSecondary }]}>
              {item.description}
            </ThemedText>
          )}
          {item.startDate && (
            <ThemedText style={[styles.stepDate, { color: theme.textTertiary }]}>
              📅 {formatDate(item.startDate)}
            </ThemedText>
          )}
        </View>
      </View>
    </GlassCard>
  );

  const renderJournalEntry = ({ item }: { item: any }) => (
    <GlassCard key={item.id} style={styles.entryCard} blurIntensity={20}>
      <ThemedText style={[styles.entryTitle, { color: theme.text }]}>
        {item.title}
      </ThemedText>
      {item.content && (
        <ThemedText style={[styles.entryContent, { color: theme.textSecondary }]}>
          {item.content}
        </ThemedText>
      )}
      <ThemedText style={[styles.entryDate, { color: theme.textTertiary }]}>
        {formatDate(item.createdAt)}
      </ThemedText>
    </GlassCard>
  );

  const renderChecklist = ({ item }: { item: any }) => (
    <GlassCard key={item.id} style={styles.checklistCard} blurIntensity={20}>
      <ThemedText style={[styles.checklistTitle, { color: theme.text }]}>
        {item.name}
      </ThemedText>
      {item.description && (
        <ThemedText style={[styles.checklistDescription, { color: theme.textSecondary }]}>
          {item.description}
        </ThemedText>
      )}
    </GlassCard>
  );

  if (loading) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <View style={styles.loadingContainer}>
            <GlassCard style={styles.loadingCard} blurIntensity={30}>
              <ThemedText style={[styles.loadingText, { color: theme.text }]}>{t('share.loadingSharedTrip')}</ThemedText>
            </GlassCard>
          </View>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <View style={styles.errorContainer}>
            <GlassCard style={styles.errorCard} blurIntensity={30}>
              <ThemedText style={[styles.errorTitle, { color: theme.text }]}>❌ Error</ThemedText>
              <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
                {error}
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.tint }]}
                onPress={loadSharedTrip}
              >
                <ThemedText style={[styles.retryButtonText, { color: theme.text }]}>{t('common.retry')}</ThemedText>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

  if (!trip) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <View style={styles.errorContainer}>
            <GlassCard style={styles.errorCard} blurIntensity={30}>
              <ThemedText style={styles.errorTitle}>{t('share.tripNotFound')}</ThemedText>
              <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
                {t('share.tripNotFoundDescription')}
              </ThemedText>
            </GlassCard>
          </View>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="medium" style={{ paddingTop: insets.top }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <ThemedText style={styles.shareIcon}>🔗</ThemedText>
              <ThemedText type="title" style={[styles.title, { color: theme.text }]}>
                {trip.title}
              </ThemedText>
              {trip.description && (
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {trip.description}
                </ThemedText>
              )}
              <View style={styles.tripDates}>
                {trip.startDate && (
                  <ThemedText style={[styles.tripDate, { color: theme.textSecondary }]}>
                    📅 {formatDate(trip.startDate)}
                  </ThemedText>
                )}
                {trip.endDate && (
                  <ThemedText style={[styles.tripDate, { color: theme.textSecondary }]}>
                    📅 {formatDate(trip.endDate)}
                  </ThemedText>
                )}
              </View>
            </View>
          </GlassCard>

          {/* Trip Steps */}
          {steps.length > 0 && (
            <GlassCard style={styles.sectionCard} blurIntensity={25}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Trip Steps ({steps.length})
              </ThemedText>
              <FlatList
                data={steps}
                renderItem={renderStep}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </GlassCard>
          )}

          {/* Journal Entries */}
          {journalEntries.length > 0 && (
            <GlassCard style={styles.sectionCard} blurIntensity={25}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Travel Journal ({journalEntries.length})
              </ThemedText>
              <FlatList
                data={journalEntries}
                renderItem={renderJournalEntry}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </GlassCard>
          )}

          {/* Checklists */}
          {checklists.length > 0 && (
            <GlassCard style={styles.sectionCard} blurIntensity={25}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Preparation Checklists ({checklists.length})
              </ThemedText>
              <FlatList
                data={checklists}
                renderItem={renderChecklist}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </GlassCard>
          )}

          {/* Download App CTA */}
          <GlassCard style={styles.ctaCard} blurIntensity={20}>
            <ThemedText style={styles.ctaTitle}>{t('share.createOwnTrips')}</ThemedText>
            <ThemedText style={[styles.ctaDescription, { color: theme.textSecondary }]}>
              {t('share.downloadDescription')}
            </ThemedText>
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: theme.tint }]}
              onPress={() => {
                // In a real app, this would open the app store
                Alert.alert(t('share.downloadApp'), t('share.downloadAppDescription'));
              }}
            >
              <ThemedText style={[styles.downloadButtonText, { color: theme.text }]}>
                📱 {t('share.downloadAppButton')}
              </ThemedText>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </AnimatedWaves>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  tripDates: {
    flexDirection: 'row',
    gap: 16,
  },
  tripDate: {
    fontSize: 14,
    opacity: 0.8,
  },
  sectionCard: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepCard: {
    marginBottom: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  stepDate: {
    fontSize: 12,
  },
  entryCard: {
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
  },
  checklistCard: {
    marginBottom: 8,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: 14,
  },
  separator: {
    height: 8,
  },
  ctaCard: {
    marginBottom: 8,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  downloadButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});