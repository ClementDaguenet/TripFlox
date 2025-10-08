import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientCard } from '@/components/ui/gradient-card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { createInitialTripStepIfNeeded, deleteTripStep, getTripById, getTripSteps, getUserProfile, reorderTripSteps, TripRow, TripStepRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function TripDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [steps, setSteps] = useState<TripStepRow[]>([]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [showRouteView, setShowRouteView] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Vérifier si le voyage est passé
  const isTripPast = () => {
    if (!trip?.endDate) return false;
    const today = new Date();
    const tripEndDate = new Date(trip.endDate);
    return tripEndDate < today;
  };
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

  const loadTrip = async () => {
    if (!id || !userId) return;
    const row = await getTripById(Number(id), userId);
    setTrip(row);
  };

  const loadSteps = async () => {
    if (!id) return;
    
    // Créer l'étape initiale si nécessaire
    await createInitialTripStepIfNeeded(Number(id));
    
    const tripSteps = await getTripSteps(Number(id));
    setSteps(tripSteps);
  };

  const loadData = async () => {
    await Promise.all([loadTrip(), loadSteps()]);
  };

  useEffect(() => {
    loadData();
  }, [id, userId]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [userId])
  );

  const focusOnStep = (step: TripStepRow, index: number) => {
    if (!mapRef.current || !step.lat || !step.lng) return;
    
    setSelectedStepIndex(index);
    mapRef.current.animateToRegion({
      latitude: step.lat!,
      longitude: step.lng!,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const focusOnAllSteps = () => {
    if (!mapRef.current || steps.length === 0) return;
    
    const validSteps = steps.filter(step => step.lat && step.lng);
    if (validSteps.length === 0) return;

    const minLat = Math.min(...validSteps.map(step => step.lat!));
    const maxLat = Math.max(...validSteps.map(step => step.lat!));
    const minLng = Math.min(...validSteps.map(step => step.lng!));
    const maxLng = Math.max(...validSteps.map(step => step.lng!));

    const latDelta = (maxLat - minLat) * 1.2;
    const lngDelta = (maxLng - minLng) * 1.2;

    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    });
    
    setSelectedStepIndex(null);
  };

  const getRouteCoordinates = () => {
    return steps
      .filter(step => step.lat && step.lng)
      .map(step => ({
        latitude: step.lat!,
        longitude: step.lng!,
      }));
  };

  const navigateToNextStep = () => {
    if (selectedStepIndex === null || selectedStepIndex >= steps.length - 1) return;
    const nextIndex = selectedStepIndex + 1;
    const nextStep = steps[nextIndex];
    if (nextStep) {
      focusOnStep(nextStep, nextIndex);
    }
  };

  const navigateToPreviousStep = () => {
    if (selectedStepIndex === null || selectedStepIndex <= 0) return;
    const prevIndex = selectedStepIndex - 1;
    const prevStep = steps[prevIndex];
    if (prevStep) {
      focusOnStep(prevStep, prevIndex);
    }
  };

  const handleReorderSteps = async (fromIndex: number, toIndex: number) => {
    try {
      const newSteps = [...steps];
      const [movedStep] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, movedStep);
      
      // Update order_index for all steps
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        order_index: index,
      }));
      
      setSteps(updatedSteps);
      
      // Pass only the step IDs to reorderTripSteps
      const stepIds = updatedSteps.map(step => step.id);
      await reorderTripSteps(Number(id), stepIds);
    } catch (error) {
      console.error('Error reordering steps:', error);
      Alert.alert(t('common.error'), t('tripDetails.failedToReorderSteps'));
    }
  };

  const moveStepUp = async (index: number) => {
    if (index > 0) {
      await handleReorderSteps(index, index - 1);
    }
  };

  const moveStepDown = async (index: number) => {
    if (index < steps.length - 1) {
      await handleReorderSteps(index, index + 1);
    }
  };

  const handleDeleteStep = (stepId: number, stepTitle: string) => {
    Alert.alert(
      t('tripDetails.deleteStep'),
      t('tripDetails.deleteStepConfirm', { stepTitle }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            await deleteTripStep(stepId);
            loadSteps();
          }
        }
      ]
    );
  };

  const formatDate = (dateValue: number | string) => {
    const date = new Date(typeof dateValue === 'number' ? dateValue : dateValue);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStepGradient = (index: number) => {
    const gradients = ['primary', 'secondary', 'sunset', 'ocean', 'forest', 'fire', 'night', 'aurora'];
    return gradients[index % gradients.length] as any;
  };

  const renderStep = ({ item, index }: { item: TripStepRow; index: number }) => (
    <GradientCard
      gradient={getStepGradient(index)}
      style={styles.stepCard}
      shadow="md"
      borderRadius="lg"
    >
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <ThemedText style={[styles.stepNumberText, { color: theme.text }]}>{index + 1}</ThemedText>
          </View>
          <View style={styles.stepInfo}>
            <ThemedText style={[styles.stepTitle, { color: theme.text }]} numberOfLines={2}>
              {item.name}
            </ThemedText>
            {item.description && (
              <ThemedText style={[styles.stepDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                {item.description}
              </ThemedText>
            )}
          </View>
          <View style={styles.stepActions}>
            <TouchableOpacity
              style={styles.stepActionButton}
              onPress={() => focusOnStep(item, index)}
            >
              <ThemedText style={styles.stepActionIcon}>📍</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepActionButton}
              onPress={() => handleDeleteStep(item.id, item.name)}
            >
              <ThemedText style={styles.stepActionIcon}>🗑️</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stepDetails}>
          {item.startDate && (
            <View style={styles.stepDateContainer}>
              <ThemedTextI18n 
                i18nKey="tripDetails.start" 
                style={[styles.stepDateLabel, { color: theme.textSecondary }]}
              />
              <ThemedText style={[styles.stepDateValue, { color: theme.text }]}>
                {formatDate(item.startDate)}
              </ThemedText>
            </View>
          )}
          
          {item.endDate && (
            <View style={styles.stepDateContainer}>
              <ThemedTextI18n 
                i18nKey="tripDetails.end" 
                style={[styles.stepDateLabel, { color: theme.textSecondary }]}
              />
              <ThemedText style={[styles.stepDateValue, { color: theme.text }]}>
                {formatDate(item.endDate)}
              </ThemedText>
            </View>
          )}
        </View>

        {item.lat && item.lng && (
          <View style={styles.stepLocationContainer}>
            <ThemedText style={styles.stepLocationIcon}>📍</ThemedText>
            <ThemedText style={styles.stepLocationText} numberOfLines={1}>
              {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
            </ThemedText>
          </View>
        )}

        {isReordering && (
          <View style={styles.reorderButtons}>
            <TouchableOpacity
              style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
              onPress={() => moveStepUp(index)}
              disabled={index === 0}
            >
              <ThemedText style={[styles.reorderButtonText, { color: theme.text }]}>↑</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderButton, index === steps.length - 1 && styles.reorderButtonDisabled]}
              onPress={() => moveStepDown(index)}
              disabled={index === steps.length - 1}
            >
              <ThemedText style={[styles.reorderButtonText, { color: theme.text }]}>↓</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GradientCard>
  );

  if (!trip) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <View style={styles.loadingContainer}>
            <ThemedText style={[styles.loadingText, { color: theme.text }]}>{t('tripDetails.loading')}</ThemedText>
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
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => router.push('/(app)/(tabs)/trips')}
              >
                <ThemedText style={[styles.backButtonText, { color: theme.text }]}>
                  ← Trips
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <ThemedText type="title" style={[styles.title, { color: theme.text }]}>
                  {trip.title}
                </ThemedText>
                {trip.description && (
                  <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                    {trip.description}
                  </ThemedText>
                )}
                <View style={styles.tripDates}>
                  {trip.startDate ? (
                    <ThemedText style={styles.tripDate}>
                      📅 Start: {formatDate(trip.startDate)}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.tripDate}>
                      📅 No start date
                    </ThemedText>
                  )}
                  {trip.endDate ? (
                    <ThemedText style={styles.tripDate}>
                      📅 End: {formatDate(trip.endDate)}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.tripDate}>
                      📅 No end date
                    </ThemedText>
                  )}
                </View>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </GlassCard>

          <GlassCard style={styles.mapCard} blurIntensity={25}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {t('tripDetails.tripMap')} 🗺️
            </ThemedText>
            
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: trip.lat || 0,
                  longitude: trip.lng || 0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {steps.map((step, index) => (
                  step.lat && step.lng && (
                    <Marker
                      key={step.id}
                      coordinate={{ latitude: step.lat!, longitude: step.lng! }}
                      title={step.name}
                      description={step.description || undefined}
                      pinColor={selectedStepIndex === index ? '#ff0000' : '#007AFF'}
                    />
                  )
                ))}
                
                {getRouteCoordinates().length > 1 && (
                  <Polyline
                    coordinates={getRouteCoordinates()}
                    strokeColor="#007AFF"
                    strokeWidth={3}
                  />
                )}
              </MapView>
            </View>

            <View style={styles.mapActions}>
              <GradientButton
                title={t('tripDetails.showAllSteps')}
                gradient="secondary"
                size="sm"
                onPress={focusOnAllSteps}
              />
              <GradientButton
                title={showRouteView ? t('tripDetails.hideRoute') : t('tripDetails.showRoute')}
                gradient="ocean"
                size="sm"
                onPress={() => setShowRouteView(!showRouteView)}
              />
            </View>
          </GlassCard>

          <View style={styles.actionButtons}>
            {isTripPast() ? (
              <GradientButton
                title={t('buttons.addStepEnded')}
                gradient="secondary"
                size="md"
                style={styles.actionButton}
                disabled={true}
              />
            ) : (
              <Link href={{ pathname: '/(app)/trips/[id]/new-step', params: { id: String(id) } }} asChild>
                <GradientButton
                  title={t('buttons.addStep')}
                  gradient="primary"
                  size="md"
                  style={styles.actionButton}
                />
              </Link>
            )}
            <Link href={{ pathname: '/(app)/trips/[id]/journal', params: { id: String(id) } }} asChild>
              <GradientButton
                title={t('buttons.journal')}
                gradient="sunset"
                size="md"
                style={styles.actionButton}
              />
            </Link>
            <Link href={{ pathname: '/(app)/trips/[id]/checklists', params: { id: String(id) } }} asChild>
              <GradientButton
                title={t('buttons.lists')}
                gradient="forest"
                size="md"
                style={styles.actionButton}
              />
            </Link>
            <Link href={{ pathname: '/(app)/trips/[id]/share', params: { id: String(id) } }} asChild>
              <GradientButton
                title={t('buttons.share')}
                gradient="aurora"
                size="md"
                style={styles.actionButton}
              />
            </Link>
          </View>

          <GlassCard style={styles.stepsCard} blurIntensity={20}>
            <View style={styles.stepsHeader}>
              <ThemedTextI18n 
                i18nKey="tripDetails.tripSteps" 
                i18nOptions={{ count: steps.length }}
                style={[styles.sectionTitle, { color: theme.text }]}
              />
              <TouchableOpacity
                style={[styles.reorderButton, isReordering && styles.reorderButtonActive]}
                onPress={() => setIsReordering(!isReordering)}
              >
                <ThemedText style={[styles.reorderButtonText, { color: theme.text }]}>
                  {isReordering ? t('common.done') : t('tripDetails.reorder')}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {steps.length > 0 ? (
              <FlatList
                data={steps}
                renderItem={renderStep}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.stepSeparator} />}
              />
            ) : (
              <View style={styles.emptyStepsContainer}>
                <ThemedTextI18n 
                  i18nKey="tripDetails.noStepsYet" 
                  style={[styles.emptyStepsText, { color: theme.textSecondary }]}
                />
              </View>
            )}
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
  },
  loadingText: {
    fontSize: 18,
  },

  // Header
  headerCard: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  tripDates: {
    flexDirection: 'row',
    gap: 16,
  },
  tripDate: {
    fontSize: 14,
    fontWeight: '600',
  },

  mapCard: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  mapActions: {
    flexDirection: 'row',
    gap: 12,
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
  stepsCard: {
    marginBottom: 8,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepCard: {
    marginBottom: 0,
  },
  stepContent: {
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepInfo: {
    flex: 1,
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stepActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActionIcon: {
    fontSize: 16,
  },
  stepDetails: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 24,
  },
  stepDateContainer: {
    flex: 1,
  },
  stepDateLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
  },
  stepDateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLocationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  stepLocationText: {
    fontSize: 12,
    flex: 1,
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reorderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  reorderButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepSeparator: {
    height: 12,
  },
  emptyStepsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStepsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});