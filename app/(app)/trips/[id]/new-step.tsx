import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { getTripById, getTripSteps, insertTripStep, TripRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function NewStepScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [trip, setTrip] = useState<TripRow | null>(null);
  const mapRef = useRef<MapView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = theme.border;
  const text = theme.text;
  const insets = useSafeAreaInsets();

  // Vérifier si le voyage est passé
  const isTripPast = () => {
    if (!trip?.endDate) return false;
    const today = new Date();
    const tripEndDate = new Date(trip.endDate);
    return tripEndDate < today;
  };

  useEffect(() => {
    loadSteps();
    loadTrip();
  }, []);

  const loadTrip = async () => {
    if (!id) return;
    const tripData = await getTripById(Number(id), 0); // userId pas important pour cette vérification
    setTrip(tripData);
  };

  const loadSteps = async () => {
    if (!id) return;
    const tripSteps = await getTripSteps(Number(id));
    setSteps(tripSteps);
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    
    try {
      if (!name.trim()) {
        setError(t('newStep.stepNameRequired'));
        return;
      }
      
      if (!id) {
        setError(t('newStep.tripIdMissing'));
        return;
      }

      const start = startDate ? startDate.getTime() : null;
      const end = endDate ? endDate.getTime() : null;
      const order = steps.length + 1;

      await insertTripStep({
        tripId: Number(id),
        name: name.trim(),
        description: description.trim() || null,
        startDate: start,
        endDate: end,
        lat: lat,
        lng: lng,
        order: order,
      });

      Alert.alert(t('common.success'), t('newStep.stepCreatedSuccess'));
      router.back();
    } catch (err) {
      setError(t('newStep.stepCreationFailed'));
      Alert.alert(t('common.error'), t('newStep.stepCreationFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const onMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLat(latitude);
    setLng(longitude);
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('newStep.permissionDenied'), t('newStep.locationPermissionRequired'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setLat(latitude);
      setLng(longitude);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('newStep.locationError'));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Vérifier si le voyage est passé et afficher un message d'erreur
  if (trip && isTripPast()) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium" style={{ paddingTop: insets.top }}>
          <View style={styles.errorContainer}>
            <GlassCard style={styles.errorCard} blurIntensity={20}>
              <ThemedTextI18n 
                i18nKey="newStep.cannotAddStep" 
                style={[styles.errorTitle, { color: theme.text }]}
              />
              <ThemedTextI18n 
                i18nKey="newStep.tripEndedMessage" 
                style={[styles.errorMessage, { color: theme.textSecondary }]}
              />
              <GradientButton
                title={t('newStep.backToTrip')}
                gradient="secondary"
                size="md"
                style={styles.backButton}
                onPress={() => router.back()}
              />
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
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => router.back()}
              >
                <ThemedTextI18n 
                  i18nKey="common.back" 
                  style={[styles.backButtonText, { color: theme.text }]}
                />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <ThemedTextI18n 
                  i18nKey="newStep.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="newStep.subtitle" 
                  style={[styles.subtitle, { color: theme.textSecondary }]}
                />
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </GlassCard>

          {/* Step Details Form */}
          <GlassCard style={styles.formCard} blurIntensity={25}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="newStep.stepName" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.input, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('newStep.stepNamePlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="newStep.description" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.textArea, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('newStep.descriptionPlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateContainer}>
                  <ThemedTextI18n 
                    i18nKey="newStep.startDate" 
                    style={[styles.inputLabel, { color: theme.text }]}
                  />
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      borderColor: border,
                      backgroundColor: theme.backgroundSecondary 
                    }]}
                    onPress={() => setShowStart(true)}
                  >
                    <ThemedText style={[styles.dateText, { color: text }]}>
                      {startDate ? formatDate(startDate) : t('newStep.selectStartDate')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateContainer}>
                  <ThemedTextI18n 
                    i18nKey="newStep.endDate" 
                    style={[styles.inputLabel, { color: theme.text }]}
                  />
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      borderColor: border,
                      backgroundColor: theme.backgroundSecondary 
                    }]}
                    onPress={() => setShowEnd(true)}
                  >
                    <ThemedText style={[styles.dateText, { color: text }]}>
                      {endDate ? formatDate(endDate) : t('newStep.selectEndDate')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    {error}
                  </ThemedText>
                </View>
              )}
            </View>
          </GlassCard>

          {/* Location Map */}
          <GlassCard style={styles.mapCard} blurIntensity={20}>
            <ThemedTextI18n 
              i18nKey="newStep.locationOptional" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                onPress={onMapPress}
                initialRegion={{
                  latitude: lat || 0,
                  longitude: lng || 0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {lat && lng && (
                  <Marker
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={t('newStep.stepLocation')}
                  />
                )}
              </MapView>
            </View>
            <GradientButton
              title={isLoadingLocation ? t('newStep.gettingLocation') : t('newStep.useCurrentLocation')}
              gradient="secondary"
              size="md"
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            />
          </GlassCard>

          {/* Save Button */}
          <GradientButton
            title={isSaving ? t('newStep.creatingStep') : t('newStep.createStep')}
            gradient="primary"
            size="xl"
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          />
        </ScrollView>
      </AnimatedWaves>

      {/* Date Pickers */}
      {showStart && (
        <RNDateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStart(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEnd && (
        <RNDateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEnd(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
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
    width: 60, // Same width as back button to center the content
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },

  // Form
  formCard: {
    marginBottom: 8,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateContainer: {
    flex: 1,
    gap: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorCard: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },

  // Map
  mapCard: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  locationButton: {
    marginBottom: 0,
  },

  // Save Button
  saveButton: {
    marginTop: 8,
  },
});