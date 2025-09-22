import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { getTripSteps, insertTripStep } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewStepScreen() {
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
  const mapRef = useRef<MapView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = useThemeColor({}, 'icon');
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSteps();
  }, []);

  const loadSteps = async () => {
    if (!id) return;
    const tripSteps = await getTripSteps(Number(id));
    setSteps(tripSteps);
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Step name is required');
      return;
    }
    if (!id) {
      setError('Trip ID is missing');
      return;
    }

    try {
      const nextOrder = steps.length + 1;
      await insertTripStep({
        tripId: Number(id),
        name: name.trim(),
        description: description.trim() || null,
        startDate: startDate ? startDate.getTime() : null,
        endDate: endDate ? endDate.getTime() : null,
        lat,
        lng,
        order: nextOrder,
      });
      
      Alert.alert('Success', 'Step added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      setError('Failed to save step');
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
        Alert.alert('Permission required', 'Location permission is needed to show your current position on the map.');
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
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setLat(latitude);
        setLng(longitude);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }, 1000);
        }
      } else {
        Alert.alert('No results', 'No location found for your search. Please try a different search term.');
      }
    } catch (error) {
      Alert.alert('Search error', 'Could not search for the location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const onChangeStartDate = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setStartDate(currentDate);
    setShowStart(false); // Hide picker after selection
  };

  const onChangeEndDate = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setEndDate(currentDate);
    setShowEnd(false); // Hide picker after selection
  };

  const showMode = (currentMode: 'date' | 'time', isStart: boolean) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: (isStart ? startDate : endDate) ?? new Date(),
        onChange: isStart ? onChangeStartDate : onChangeEndDate,
        mode: currentMode,
        is24Hour: true,
      });
    } else {
      if (isStart) setShowStart(true);
      else setShowEnd(true);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="link">← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Add Step</ThemedText>
        
        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
        
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Step Name *</ThemedText>
          <TextInput 
            style={[styles.input, { borderColor: border, color: text }]} 
            placeholderTextColor={border} 
            placeholder="Enter step name" 
            value={name} 
            onChangeText={setName} 
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput 
            style={[styles.input, styles.textArea, { borderColor: border, color: text }]} 
            placeholderTextColor={border} 
            placeholder="Enter step description" 
            value={description} 
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateGroup}>
            <ThemedText style={styles.label}>Start Date</ThemedText>
            <Button 
              title={startDate ? `Start: ${startDate.toDateString()}` : 'Pick start date'} 
              onPress={() => showMode('date', true)} 
            />
          </View>
          <View style={styles.dateGroup}>
            <ThemedText style={styles.label}>End Date</ThemedText>
            <Button 
              title={endDate ? `End: ${endDate.toDateString()}` : 'Pick end date'} 
              onPress={() => showMode('date', false)} 
            />
          </View>
        </View>

        {Platform.OS === 'ios' && showStart ? (
          <RNDateTimePicker 
            value={startDate ?? new Date()} 
            mode="date" 
            display="inline" 
            onChange={onChangeStartDate} 
          />
        ) : null}
        {Platform.OS === 'ios' && showEnd ? (
          <RNDateTimePicker 
            value={endDate ?? new Date()} 
            mode="date" 
            display="inline" 
            onChange={onChangeEndDate} 
          />
        ) : null}

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Location (Optional)</ThemedText>
          <ThemedText style={styles.subLabel}>Tap on map or search below to set location</ThemedText>
          <View style={[styles.mapContainer, { borderColor: border }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: lat ?? 48.8566,
                longitude: lng ?? 2.3522,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={onMapPress}
            >
              {lat && lng ? (
                <Marker
                  coordinate={{ latitude: lat, longitude: lng }}
                  title="Step Location"
                />
              ) : null}
            </MapView>
          </View>
          
          <View style={styles.locationSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { borderColor: border, color: text }]}
                placeholder="Search for a location..."
                placeholderTextColor={border}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
              />
              <TouchableOpacity 
                style={[styles.searchButton, { borderColor: border }]} 
                onPress={searchLocation}
                disabled={isSearching || !searchQuery.trim()}
              >
                <ThemedText style={[styles.searchButtonText, { color: text }]}>
                  {isSearching ? '...' : '🔍'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.locationButton, { borderColor: border }]} 
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              <ThemedText style={[styles.locationButtonText, { color: text }]}>
                {isLoadingLocation ? 'Getting location...' : '📍 Use my current location'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Add Step" onPress={handleSave} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  title: { textAlign: 'center', marginBottom: 20 },
  backButton: { marginBottom: 12 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  subLabel: { fontSize: 14, opacity: 0.7, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dateGroup: { flex: 1 },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, marginBottom: 12 },
  map: { flex: 1 },
  locationSection: { marginBottom: 12 },
  searchContainer: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  searchButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  searchButtonText: { fontSize: 16 },
  locationButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  locationButtonText: { fontSize: 14, fontWeight: '500' },
  buttonContainer: { marginTop: 20 },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
});
