import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, insertTrip } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function NewTripScreen() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [coverUri, setCoverUri] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = theme.border;
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

  // Obtenir automatiquement la position actuelle
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Demander les permissions de localisation
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        // Obtenir la position actuelle
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLat(location.coords.latitude);
        setLng(location.coords.longitude);
        
        // Centrer la carte sur la position actuelle
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.error('Error getting current location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getCurrentLocation();
  }, []);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    
    try {
      if (!userId) {
        setError('User not authenticated');
        return;
      }
      
      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      
      if (!startDate) {
        setError('Start date is required');
        return;
      }
      
      if (!endDate) {
        setError('End date is required');
        return;
      }
      
      if (startDate >= endDate) {
        setError('End date must be after start date');
        return;
      }
      
      const start = startDate.getTime();
      const end = endDate.getTime();
      
      const tripId = await insertTrip({ 
        userId,
        title: title.trim(), 
        description: description.trim() || null,
        startDate: start, 
        endDate: end, 
        coverUri: coverUri || null,
        lat: lat || null,
        lng: lng || null
      });
      
      Alert.alert(t('common.success'), t('alerts.tripCreatedSuccess'));
      router.back();
    } catch (err) {
      setError(t('alerts.failedToCreateTrip'));
      Alert.alert(t('common.error'), t('alerts.failedToCreateTrip'));
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
        Alert.alert(t('alerts.permissionDenied'), t('alerts.locationPermissionRequired'));
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
      Alert.alert(t('common.error'), t('alerts.failedToGetLocation'));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('alerts.permissionDenied'), t('alerts.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

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
                onPress={() => router.back()}
              >
                <ThemedTextI18n 
                  i18nKey="navigation.back" 
                  style={[styles.backButtonText, { color: theme.text }]}
                />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <ThemedTextI18n 
                  i18nKey="newTrip.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="newTrip.subtitle" 
                  style={[styles.subtitle, { color: theme.textSecondary }]}
                />
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </GlassCard>

          <GlassCard style={styles.formCard} blurIntensity={25}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="newTrip.tripTitle" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.input, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('placeholders.enterTripTitle')}
                  placeholderTextColor={theme.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="newTrip.tripDescription" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.textArea, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('placeholders.describeTrip')}
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
                    i18nKey="newTrip.startDate" 
                    style={[styles.inputLabel, { color: theme.text }]}
                  />
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      borderColor: border,
                      backgroundColor: theme.backgroundSecondary 
                    }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowEnd(false);
                      setShowStart(true);
                    }}
                  >
                    <ThemedText style={[styles.dateText, { color: text }]}>
                      {startDate ? formatDate(startDate) : t('newTrip.selectStartDate')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateContainer}>
                  <ThemedTextI18n 
                    i18nKey="newTrip.endDate" 
                    style={[styles.inputLabel, { color: theme.text }]}
                  />
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      borderColor: border,
                      backgroundColor: theme.backgroundSecondary 
                    }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowStart(false);
                      setShowEnd(true);
                    }}
                  >
                    <ThemedText style={[styles.dateText, { color: text }]}>
                      {endDate ? formatDate(endDate) : t('newTrip.selectEndDate')}
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

          <GlassCard style={styles.imageCard} blurIntensity={20}>
            <ThemedTextI18n 
              i18nKey="newTrip.tripCover" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImage} />
              ) : (
                <View style={[styles.imagePlaceholder, { borderColor: border }]}>
                  <ThemedTextI18n 
                    i18nKey="newTrip.tapToAddCover" 
                    style={[styles.imagePlaceholderText, { color: theme.textTertiary }]}
                  />
                </View>
              )}
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.mapCard} blurIntensity={20}>
            <ThemedTextI18n 
              i18nKey="newTrip.tripLocation" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />
            <ThemedTextI18n 
              i18nKey="newTrip.tripLocationDescription" 
              style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
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
                    title={t('newTrip.tripLocation')}
                  />
                )}
              </MapView>
              {isLoadingLocation && (
                <View style={styles.loadingOverlay}>
                  <ThemedTextI18n 
                    i18nKey="newTrip.gettingLocation" 
                    style={[styles.loadingText, { color: theme.text }]}
                  />
                </View>
              )}
            </View>
            <GradientButton
              title={isLoadingLocation ? t('newTrip.gettingLocation') : t('newTrip.updateLocation')}
              gradient="secondary"
              size="md"
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            />
          </GlassCard>

          <GradientButton
            title={isSaving ? t('newTrip.creatingTrip') : t('newTrip.createTrip')}
            gradient="primary"
            size="xl"
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          />
        </ScrollView>
      </AnimatedWaves>

      {showStart && (
        <RNDateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (selectedDate) {
              setStartDate(selectedDate);
            }
            // Fermer après 2 secondes sur iOS, immédiatement sur Android
            if (Platform.OS === 'ios') {
              setTimeout(() => {
                setShowStart(false);
              }, 2000);
            } else {
              setShowStart(false);
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
            if (selectedDate) {
              setEndDate(selectedDate);
            }
            // Fermer après 2 secondes sur iOS, immédiatement sur Android
            if (Platform.OS === 'ios') {
              setTimeout(() => {
                setShowEnd(false);
              }, 2000);
            } else {
              setShowEnd(false);
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
    minHeight: 50,
  },
  dateText: {
    fontSize: 16,
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },

  // Image
  imageCard: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    opacity: 0.8,
  },
  imageContainer: {
    alignItems: 'center',
  },
  coverImage: {
    width: width - 64,
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: width - 64,
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Map
  mapCard: {
    marginBottom: 8,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationButton: {
    marginBottom: 0,
  },

  // Save Button
  saveButton: {
    marginTop: 8,
  },
});