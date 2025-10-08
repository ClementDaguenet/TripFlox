import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientCard } from '@/components/ui/gradient-card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { deleteJournalEntry, getJournalEntries, getTripById, getTripSteps, getUserProfile, JournalEntryRow, TripRow, TripStepRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function JournalScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [steps, setSteps] = useState<TripStepRow[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryRow[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'day' | 'step'>('all');
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { currentUserEmail } = useAuth();

  useEffect(() => {
    const loadUserId = async () => {
      if (currentUserEmail) {
        const user = await getUserProfile(currentUserEmail);
        if (user) {
          setUserId(user.id);
        }
      }
    };
    loadUserId();
  }, [currentUserEmail]);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, loadData]);

  const loadData = useCallback(async () => {
    if (!id || !userId) return;
    
    try {
      const [tripData, stepsData, entriesData] = await Promise.all([
        getTripById(Number(id), userId),
        getTripSteps(Number(id)),
        getJournalEntries(Number(id))
      ]);
      
      setTrip(tripData);
      setSteps(stepsData);
      setJournalEntries(entriesData);
    } catch (error) {
      console.error('Error loading journal data:', error);
    }
  }, [id, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteEntry = (entryId: number, entryTitle: string) => {
    Alert.alert(
      t('journal.deleteEntry'),
      t('journal.deleteEntryConfirm', { entryTitle }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            await deleteJournalEntry(entryId);
            loadData();
          }
        }
      ]
    );
  };

  const handleExportPDF = async () => {
    Alert.alert(
      t('journal.exportPDF'),
      t('journal.pdfExportSoon'),
      [{ text: t('common.ok') }]
    );
  };

  const handleExportPhotos = async () => {
    Alert.alert(
      t('journal.exportPhotos'),
      t('journal.photoExportSoon'),
      [{ text: t('common.ok') }]
    );
  };

  const getFilteredEntries = () => {
    let filtered = journalEntries;
    
    if (selectedFilter === 'day') {
      // Group by day and show only first entry of each day
      const dayGroups = new Map();
      filtered.forEach(entry => {
        const day = new Date(entry.createdAt).toDateString();
        if (!dayGroups.has(day)) {
          dayGroups.set(day, entry);
        }
      });
      filtered = Array.from(dayGroups.values());
    } else if (selectedFilter === 'step' && selectedStepId) {
      filtered = filtered.filter(entry => entry.stepId === selectedStepId);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getEntryGradient = (index: number) => {
    const gradients = ['primary', 'secondary', 'sunset', 'ocean', 'forest', 'fire', 'night', 'aurora'];
    return gradients[index % gradients.length] as any;
  };

  const formatDate = (dateValue: number | string) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderJournalEntry = ({ item, index }: { item: JournalEntryRow; index: number }) => {
    const step = steps.find(s => s.id === item.stepId);
    
    return (
      <GradientCard
        gradient={getEntryGradient(index)}
        style={styles.entryCard}
        shadow="md"
        borderRadius="lg"
        onPress={() => router.push(`/(app)/trips/${id}/journal/${item.id}`)}
      >
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <View style={styles.entryInfo}>
              <ThemedText style={[styles.entryTitle, { color: theme.text }]} numberOfLines={2}>
                {item.title}
              </ThemedText>
              <ThemedText style={[styles.entryDate, { color: theme.textSecondary }]}>
                {formatDate(item.createdAt)}
              </ThemedText>
              {step && (
                <ThemedText style={[styles.entryStep, { color: theme.textSecondary }]}>
                  📍 {step.name}
                </ThemedText>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEntry(item.id, item.title)}
            >
              <ThemedText style={[styles.deleteButtonText, { color: theme.text }]}>🗑️</ThemedText>
            </TouchableOpacity>
          </View>

          {item.content && (
            <ThemedText style={[styles.entryContent, { color: theme.text }]} numberOfLines={3}>
              {item.content}
            </ThemedText>
          )}

          <View style={styles.entryFooter}>
            <View style={styles.entryStats}>
              {false && (
                <ThemedText style={styles.entryStat}>
                  📷 0
                </ThemedText>
              )}
              {false && (
                <ThemedText style={styles.entryStat}>
                  🎵 0
                </ThemedText>
              )}
            </View>
            <ThemedTextI18n 
              i18nKey="journal.readMore" 
              style={[styles.readMoreText, { color: theme.textSecondary }]}
            />
          </View>
        </View>
      </GradientCard>
    );
  };

  const renderEmptyState = () => (
    <GradientCard 
      gradient="aurora" 
      style={styles.emptyStateCard}
      shadow="xl"
      borderRadius="2xl"
    >
      <View style={styles.emptyStateContent}>
        <ThemedText style={styles.emptyStateIcon}>📖</ThemedText>
        <ThemedTextI18n 
          i18nKey="journal.noEntriesYet" 
          style={[styles.emptyStateTitle, { color: theme.text }]}
        />
        <ThemedTextI18n 
          i18nKey="journal.startDocumenting" 
          style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}
        />
        <Link href={`/(app)/trips/${id}/journal/new-entry`} asChild>
          <GradientButton
            title={t('journal.createFirstEntry')}
            gradient="fire"
            size="lg"
            style={styles.emptyStateButton}
          />
        </Link>
      </View>
    </GradientCard>
  );

  if (!trip) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <View style={styles.loadingContainer}>
            <ThemedTextI18n 
              i18nKey="journal.loading" 
              style={[styles.loadingText, { color: theme.text }]}
            />
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
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <ThemedTextI18n 
                  i18nKey="journal.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {trip.title}
                </ThemedText>
                <ThemedText style={[styles.entryCount, { color: theme.textSecondary }]}>
                  {t('journal.entryCount', { count: journalEntries.length, plural: journalEntries.length !== 1 ? 'ies' : 'y' })}
                </ThemedText>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.filterCard} blurIntensity={25}>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('all')}
              >
                <ThemedTextI18n 
                  i18nKey="journal.all" 
                  style={[styles.filterButtonText, { color: selectedFilter === 'all' ? theme.text : theme.textSecondary }]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'day' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('day')}
              >
                <ThemedTextI18n 
                  i18nKey="journal.byDay" 
                  style={[styles.filterButtonText, { color: selectedFilter === 'day' ? theme.text : theme.textSecondary }]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'step' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('step')}
              >
                <ThemedTextI18n 
                  i18nKey="journal.byStep" 
                  style={[styles.filterButtonText, { color: selectedFilter === 'step' ? theme.text : theme.textSecondary }]}
                />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {selectedFilter === 'step' && (
            <GlassCard style={styles.stepFilterCard} blurIntensity={20}>
              <ThemedTextI18n 
                i18nKey="journal.selectStep" 
                style={[styles.stepFilterTitle, { color: theme.text }]}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.stepFilterButtons}>
                  <TouchableOpacity
                    style={[styles.stepFilterButton, selectedStepId === null && styles.stepFilterButtonActive]}
                    onPress={() => setSelectedStepId(null)}
                  >
                    <ThemedTextI18n 
                      i18nKey="journal.allSteps" 
                      style={[styles.stepFilterButtonText, selectedStepId === null && styles.stepFilterButtonTextActive]}
                    />
                  </TouchableOpacity>
                  {steps.map(step => (
                    <TouchableOpacity
                      key={step.id}
                      style={[styles.stepFilterButton, selectedStepId === step.id && styles.stepFilterButtonActive]}
                      onPress={() => setSelectedStepId(step.id)}
                    >
                      <ThemedText style={[styles.stepFilterButtonText, selectedStepId === step.id && styles.stepFilterButtonTextActive]}>
                        {step.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </GlassCard>
          )}

          <View style={styles.actionButtons}>
            <Link href={`/(app)/trips/${id}/journal/new-entry`} asChild>
              <GradientButton
                title={t('journal.newEntry')}
                gradient="primary"
                size="md"
                style={styles.actionButton}
              />
            </Link>
            <GradientButton
              title={t('journal.exportPDF')}
              gradient="secondary"
              size="md"
              style={styles.actionButton}
              onPress={handleExportPDF}
            />
            <GradientButton
              title={t('journal.exportPhotos')}
              gradient="ocean"
              size="md"
              style={styles.actionButton}
              onPress={handleExportPhotos}
            />
          </View>

          {getFilteredEntries().length > 0 ? (
            <FlatList
              data={getFilteredEntries()}
              renderItem={renderJournalEntry}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.entrySeparator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              {renderEmptyState()}
            </View>
          )}
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
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },

  // Header
  headerCard: {
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 4,
  },
  entryCount: {
    fontSize: 14,
    opacity: 0.7,
  },

  // Filters
  filterCard: {
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    // Color will be applied dynamically
  },

  stepFilterCard: {
    marginBottom: 8,
  },
  stepFilterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepFilterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  stepFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepFilterButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepFilterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepFilterButtonTextActive: {
    // Color will be applied dynamically
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: (width - 44) / 3,
  },
  entryCard: {
    marginBottom: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryInfo: {
    flex: 1,
    marginRight: 12,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  entryStep: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  entryStat: {
    fontSize: 12,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entrySeparator: {
    height: 12,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateCard: {
    marginHorizontal: 16,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    minWidth: 200,
  },
});