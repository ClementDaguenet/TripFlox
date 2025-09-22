import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { deleteTripStep, getTripById, getTripSteps, reorderTripSteps, TripRow, TripStepRow, updateTripLocation } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width } = Dimensions.get('window');

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [steps, setSteps] = useState<TripStepRow[]>([]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [showRouteView, setShowRouteView] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const mapRef = useRef<MapView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = useThemeColor({}, 'icon');
  const text = useThemeColor({}, 'text');

  const loadTrip = async () => {
    if (!id) return;
    const row = await getTripById(Number(id));
    setTrip(row);
  };

  const loadSteps = async () => {
    if (!id) return;
    const tripSteps = await getTripSteps(Number(id));
    setSteps(tripSteps);
  };

  const loadData = async () => {
    await Promise.all([loadTrip(), loadSteps()]);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [id])
  );

  const onMapPress = async (e: any) => {
    if (!id) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    await updateTripLocation(Number(id), latitude, longitude);
    setTrip(prev => prev ? { ...prev, lat: latitude, lng: longitude } : prev);
  };

  const handleDeleteStep = (stepId: number, stepName: string) => {
    Alert.alert(
      'Delete Step',
      `Are you sure you want to delete "${stepName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteTripStep(stepId);
            loadSteps();
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'No date set';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const focusOnStep = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step || !step.lat || !step.lng) return;

    setSelectedStepIndex(stepIndex);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: step.lat,
        longitude: step.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const focusOnAllSteps = () => {
    const stepsWithLocation = steps.filter(step => step.lat && step.lng);
    if (stepsWithLocation.length === 0) return;

    if (mapRef.current) {
      const coordinates = stepsWithLocation.map(step => ({
        latitude: step.lat!,
        longitude: step.lng!,
      }));

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
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
    if (selectedStepIndex === null) {
      if (steps.length > 0) {
        focusOnStep(0);
      }
    } else if (selectedStepIndex < steps.length - 1) {
      focusOnStep(selectedStepIndex + 1);
    }
  };

  const navigateToPreviousStep = () => {
    if (selectedStepIndex === null) {
      if (steps.length > 0) {
        focusOnStep(steps.length - 1);
      }
    } else if (selectedStepIndex > 0) {
      focusOnStep(selectedStepIndex - 1);
    }
  };

  const handleReorderSteps = async (newOrder: TripStepRow[]) => {
    if (!id) return;
    
    try {
      const stepIds = newOrder.map(step => step.id);
      await reorderTripSteps(Number(id), stepIds);
      setSteps(newOrder);
    } catch (error) {
      Alert.alert('Error', 'Failed to reorder steps. Please try again.');
    }
  };

  const moveStepUp = (index: number) => {
    if (index > 0) {
      const newSteps = [...steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      setSteps(newSteps);
      handleReorderSteps(newSteps);
    }
  };

  const moveStepDown = (index: number) => {
    if (index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      setSteps(newSteps);
      handleReorderSteps(newSteps);
    }
  };

  const initialRegion = {
    latitude: trip?.lat ?? 48.8566, // default Paris
    longitude: trip?.lng ?? 2.3522,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="link">← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Loading trip...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="link">← Back</ThemedText>
        </TouchableOpacity>
        
        <ThemedText type="title" style={styles.title}>{trip.title}</ThemedText>
        
        {/* Trip Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: text }]}>Start Date</ThemedText>
            <ThemedText style={[styles.infoValue, { color: text }]}>{formatDate(trip.startDate)}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: text }]}>End Date</ThemedText>
            <ThemedText style={[styles.infoValue, { color: text }]}>{formatDate(trip.endDate)}</ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Link href={{ pathname: '/(app)/trips/[id]/new-step', params: { id: String(id) } }} asChild>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.tint }]}>
              <ThemedText style={styles.actionButtonText}>+ Add Step</ThemedText>
            </TouchableOpacity>
          </Link>
          <Link href={{ pathname: '/(app)/trips/[id]/journal', params: { id: String(id) } }} asChild>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ff8c00' }]}>
              <ThemedText style={styles.actionButtonText}>📖 Journal</ThemedText>
            </TouchableOpacity>
          </Link>
          <Link href={{ pathname: '/(app)/trips/[id]/checklists', params: { id: String(id) } }} asChild>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}>
              <ThemedText style={styles.actionButtonText}>✅ Lists</ThemedText>
            </TouchableOpacity>
          </Link>
          <Link href={{ pathname: '/(app)/trips/[id]/share', params: { id: String(id) } }} asChild>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}>
              <ThemedText style={styles.actionButtonText}>🔗 Share</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <View style={styles.mapHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
              Trip Map
            </ThemedText>
            <View style={styles.mapControls}>
              <TouchableOpacity 
                style={[styles.mapControlButton, { backgroundColor: theme.tint }]}
                onPress={() => setShowRouteView(!showRouteView)}
              >
                <ThemedText style={styles.mapControlText}>
                  {showRouteView ? '📍 Points' : '🛣️ Route'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.mapControlButton, { backgroundColor: theme.tint }]}
                onPress={focusOnAllSteps}
              >
                <ThemedText style={styles.mapControlText}>🔍 All</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[styles.mapContainer, { borderColor: theme.icon }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              onPress={onMapPress}
            >
              {trip?.lat != null && trip?.lng != null ? (
                <Marker
                  coordinate={{ latitude: trip.lat, longitude: trip.lng }}
                  title={trip.title || 'Trip Location'}
                  pinColor="#ff6b6b"
                />
              ) : null}
              {steps.map((step, index) => {
                if (step.lat && step.lng) {
                  const isSelected = selectedStepIndex === index;
                  return (
                    <Marker
                      key={step.id}
                      coordinate={{ latitude: step.lat, longitude: step.lng }}
                      title={`${index + 1}. ${step.name}`}
                      description={step.description || undefined}
                      pinColor={isSelected ? "#ff6b6b" : theme.tint}
                      onPress={() => focusOnStep(index)}
                    />
                  );
                }
                return null;
              })}
              {showRouteView && getRouteCoordinates().length > 1 ? (
                <Polyline
                  coordinates={getRouteCoordinates()}
                  strokeColor={theme.tint}
                  strokeWidth={3}
                  lineDashPattern={[5, 5]}
                />
              ) : null}
            </MapView>
          </View>
          
          {/* Navigation Controls */}
          {steps.length > 0 ? (
            <View style={styles.navigationControls}>
              <TouchableOpacity 
                style={[styles.navButton, { backgroundColor: selectedStepIndex === 0 ? theme.icon : theme.tint }]}
                onPress={navigateToPreviousStep}
                disabled={selectedStepIndex === 0}
              >
                <ThemedText style={styles.navButtonText}>← Previous</ThemedText>
              </TouchableOpacity>
              
              <View style={styles.stepIndicator}>
                <ThemedText style={[styles.stepIndicatorText, { color: text }]}>
                  {selectedStepIndex !== null ? `${selectedStepIndex + 1} / ${steps.length}` : 'Select Step'}
                </ThemedText>
              </View>
              
              <TouchableOpacity 
                style={[styles.navButton, { backgroundColor: selectedStepIndex === steps.length - 1 ? theme.icon : theme.tint }]}
                onPress={navigateToNextStep}
                disabled={selectedStepIndex === steps.length - 1}
              >
                <ThemedText style={styles.navButtonText}>Next →</ThemedText>
              </TouchableOpacity>
            </View>
          ) : null}
          
          <ThemedText style={[styles.mapHint, { color: text }]}>
            {showRouteView 
              ? 'Route view shows the path between steps. Tap markers to focus on specific steps.'
              : 'Tap on the map to set the trip location. Steps with locations are shown as markers.'
            }
          </ThemedText>
        </View>

        {/* Steps List - Moved after map */}
        <View style={styles.section}>
          <View style={styles.stepsHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
              Trip Steps ({steps.length})
            </ThemedText>
            {steps.length > 1 ? (
              <TouchableOpacity 
                style={[styles.reorderButton, { backgroundColor: isReordering ? '#ff6b6b' : theme.tint }]}
                onPress={() => setIsReordering(!isReordering)}
              >
                <ThemedText style={styles.reorderButtonText}>
                  {isReordering ? '✓ Done' : '↕️ Reorder'}
                </ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {steps.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyIcon}>🗺️</ThemedText>
              <ThemedText style={[styles.emptyTitle, { color: text }]}>No steps yet</ThemedText>
              <ThemedText style={[styles.emptyText, { color: text }]}>Add your first step to start planning your journey!</ThemedText>
            </View>
          ) : (
            <View style={styles.stepsList}>
              {steps.map((step, index) => (
                <View key={step.id} style={[styles.stepCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumber}>
                      <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
                    </View>
                    <View style={styles.stepInfo}>
                      <ThemedText style={[styles.stepName, { color: text }]}>{step.name}</ThemedText>
                      {step.description ? (
                        <ThemedText style={[styles.stepDescription, { color: text }]}>{step.description}</ThemedText>
                      ) : null}
                    </View>
                    <View style={styles.stepActions}>
                      {isReordering ? (
                        <View style={styles.reorderControls}>
                          <TouchableOpacity 
                            style={[styles.reorderButton, { backgroundColor: index === 0 ? theme.icon : theme.tint }]}
                            onPress={() => moveStepUp(index)}
                            disabled={index === 0}
                          >
                            <ThemedText style={styles.reorderButtonText}>↑</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.reorderButton, { backgroundColor: index === steps.length - 1 ? theme.icon : theme.tint }]}
                            onPress={() => moveStepDown(index)}
                            disabled={index === steps.length - 1}
                          >
                            <ThemedText style={styles.reorderButtonText}>↓</ThemedText>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                      <TouchableOpacity 
                        style={styles.deleteStepButton}
                        onPress={() => handleDeleteStep(step.id, step.name)}
                      >
                        <ThemedText style={styles.deleteStepIcon}>🗑️</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {(step.startDate || step.endDate) ? (
                    <View style={styles.stepDates}>
                      {step.startDate ? (
                        <View style={styles.stepDateItem}>
                          <ThemedText style={[styles.stepDateLabel, { color: text }]}>Start</ThemedText>
                          <ThemedText style={[styles.stepDateValue, { color: text }]}>{formatDate(step.startDate)}</ThemedText>
                        </View>
                      ) : null}
                      {step.endDate ? (
                        <View style={styles.stepDateItem}>
                          <ThemedText style={[styles.stepDateLabel, { color: text }]}>End</ThemedText>
                          <ThemedText style={[styles.stepDateValue, { color: text }]}>{formatDate(step.endDate)}</ThemedText>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  
                  {step.lat && step.lng ? (
                    <View style={styles.stepLocation}>
                      <ThemedText style={styles.locationIcon}>📍</ThemedText>
                      <ThemedText style={[styles.locationText, { color: text }]}>Location set</ThemedText>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, padding: 16 },
  backButton: { marginBottom: 12 },
  title: { marginBottom: 20, textAlign: 'center' },
  
  // Trip Info
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  
      // Action Buttons
      actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
      },
      actionButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
      actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
      },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  
  // Steps List
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reorderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reorderButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepsList: {
    gap: 12,
  },
  stepCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: '#6c47ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderControls: {
    flexDirection: 'row',
    gap: 4,
  },
  deleteStepButton: {
    padding: 8,
  },
  deleteStepIcon: {
    fontSize: 16,
  },
  
  // Step Dates
  stepDates: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  stepDateItem: {
    flex: 1,
  },
  stepDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 4,
  },
  stepDateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Step Location
  stepLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.7,
  },
  
  // Map
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapControls: {
    flexDirection: 'row',
    gap: 8,
  },
  mapControlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapControlText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  mapHint: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  
  // Navigation Controls
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
  },
});


