import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientCard } from '@/components/ui/gradient-card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ChecklistRow, deleteChecklist, getChecklistById, getChecklists, getTripById, getUserProfile, insertChecklist, TripRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ChecklistsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [templates, setTemplates] = useState<ChecklistRow[]>([]);
  const [selectedTab, setSelectedTab] = useState<'trip' | 'templates'>('trip');
  const [userId, setUserId] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;
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
      const [tripData, tripChecklists, templateChecklists] = await Promise.all([
        getTripById(Number(id), userId),
        getChecklists(Number(id)),
        getChecklists(null)
      ]);
      
      setTrip(tripData);
      setChecklists(tripChecklists);
      setTemplates(templateChecklists.filter(c => c.isTemplate));
    } catch (error) {
      console.error('Error loading checklists data:', error);
    }
  }, [id, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteChecklist = (checklistId: number, checklistName: string) => {
    Alert.alert(
      t('checklists.deleteChecklist'),
      t('checklists.deleteChecklistConfirm', { checklistName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            await deleteChecklist(checklistId);
            loadData();
          }
        }
      ]
    );
  };

  const handleCreateFromTemplate = async (templateId: number) => {
    try {
      const template = await getChecklistById(templateId);
      if (!template) return;

      const newChecklist = {
        ...template,
        id: 0,
        tripId: Number(id),
        isTemplate: false,
        createdAt: new Date().toISOString(),
      };

      await insertChecklist(newChecklist);
      loadData();
      Alert.alert(t('common.success'), t('checklists.checklistCreatedFromTemplate'));
    } catch (error) {
      console.error('Error creating checklist from template:', error);
      Alert.alert(t('common.error'), t('checklists.failedToCreateFromTemplate'));
    }
  };

  const getChecklistGradient = (index: number) => {
    const gradients = ['primary', 'secondary', 'sunset', 'ocean', 'forest', 'fire', 'night', 'aurora'];
    return gradients[index % gradients.length] as any;
  };

  const formatDate = (dateValue: number | string) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderChecklist = ({ item, index }: { item: ChecklistRow; index: number }) => (
    <GradientCard
      gradient={getChecklistGradient(index)}
      style={styles.checklistCard}
      shadow="md"
      borderRadius="lg"
      onPress={() => router.push(`/(app)/trips/${id}/checklists/${item.id}`)}
    >
      <View style={styles.checklistContent}>
        <View style={styles.checklistHeader}>
          <View style={styles.checklistInfo}>
            <ThemedText style={[styles.checklistTitle, { color: theme.text }]} numberOfLines={2}>
              {item.name}
            </ThemedText>
            {item.description && (
              <ThemedText style={[styles.checklistDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                {item.description}
              </ThemedText>
            )}
            <ThemedText style={[styles.checklistDate, { color: theme.textSecondary }]}>
              {t('checklists.created')} {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteChecklist(item.id, item.name)}
          >
            <ThemedText style={[styles.deleteButtonText, { color: theme.text }]}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.checklistFooter}>
          <View style={styles.checklistStats}>
            <ThemedTextI18n 
              i18nKey="checklists.checklistLabel" 
              style={[styles.checklistStat, { color: theme.textSecondary }]}
            />
            {item.isTemplate && (
              <ThemedTextI18n 
                i18nKey="checklists.templateLabel" 
                style={[styles.templateBadge, { color: theme.textSecondary }]}
              />
            )}
          </View>
          <ThemedTextI18n 
            i18nKey="checklists.viewDetails" 
            style={[styles.readMoreText, { color: theme.textSecondary }]}
          />
        </View>
      </View>
    </GradientCard>
  );

  const renderEmptyState = () => (
    <GradientCard 
      gradient="aurora" 
      style={styles.emptyStateCard}
      shadow="xl"
      borderRadius="2xl"
    >
      <View style={styles.emptyStateContent}>
        <ThemedText style={styles.emptyStateIcon}>
          {selectedTab === 'trip' ? '✅' : '📋'}
        </ThemedText>
        <ThemedTextI18n 
          i18nKey={selectedTab === 'trip' ? 'checklists.noChecklistsYet' : 'checklists.noTemplatesAvailable'} 
          style={[styles.emptyStateTitle, { color: theme.text }]}
        />
        <ThemedTextI18n 
          i18nKey={selectedTab === 'trip' ? 'checklists.startOrganizing' : 'checklists.createTemplates'} 
          style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}
        />
        <Link href={`/(app)/trips/${id}/checklists/new`} asChild>
          <GradientButton
            title={selectedTab === 'trip' ? t('checklists.createFirstChecklist') : t('checklists.createTemplate')}
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
              i18nKey="checklists.loading" 
              style={[styles.loadingText, { color: theme.text }]}
            />
          </View>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

  const currentData = selectedTab === 'trip' ? checklists : templates;

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
                  i18nKey="checklists.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {trip.title}
                </ThemedText>
                <ThemedText style={[styles.checklistCount, { color: theme.textSecondary }]}>
                  {t('checklists.count', { count: currentData.length, type: selectedTab === 'trip' ? 'checklist' : 'template', plural: currentData.length !== 1 ? 's' : '' })}
                </ThemedText>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.tabCard} blurIntensity={25}>
            <View style={styles.tabButtons}>
              <TouchableOpacity
                style={[styles.tabButton, selectedTab === 'trip' && styles.tabButtonActive]}
                onPress={() => setSelectedTab('trip')}
              >
                <ThemedTextI18n 
                  i18nKey="checklists.tripLists" 
                  style={[styles.tabButtonText, { color: selectedTab === 'trip' ? theme.text : theme.textSecondary }]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, selectedTab === 'templates' && styles.tabButtonActive]}
                onPress={() => setSelectedTab('templates')}
              >
                <ThemedTextI18n 
                  i18nKey="checklists.templates" 
                  style={[styles.tabButtonText, { color: selectedTab === 'templates' ? theme.text : theme.textSecondary }]}
                />
              </TouchableOpacity>
            </View>
          </GlassCard>

          <View style={styles.actionButtons}>
            <Link href={`/(app)/trips/${id}/checklists/new`} asChild>
              <GradientButton
                title={t('checklists.newChecklist')}
                gradient="primary"
                size="md"
                style={styles.actionButton}
              />
            </Link>
            {selectedTab === 'trip' && templates.length > 0 && (
              <GradientButton
                title={t('checklists.useTemplate')}
                gradient="secondary"
                size="md"
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    t('checklists.selectTemplate'),
                    t('checklists.chooseTemplate'),
                    templates.map(template => ({
                      text: template.name,
                      onPress: () => handleCreateFromTemplate(template.id)
                    })).concat([{ text: t('common.cancel'), onPress: async () => {} }])
                  );
                }}
              />
            )}
          </View>

          {currentData.length > 0 ? (
            <FlatList
              data={currentData}
              renderItem={renderChecklist}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.checklistSeparator} />}
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
  checklistCount: {
    fontSize: 14,
    opacity: 0.7,
  },

  tabCard: {
    marginBottom: 8,
  },
  tabButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    // Color will be applied dynamically
  },

  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: (width - 44) / 2,
  },
  checklistCard: {
    marginBottom: 0,
  },
  checklistContent: {
    padding: 16,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checklistInfo: {
    flex: 1,
    marginRight: 12,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  checklistDate: {
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
  checklistFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistStats: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  checklistStat: {
    fontSize: 12,
  },
  templateBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checklistSeparator: {
    height: 12,
  },

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