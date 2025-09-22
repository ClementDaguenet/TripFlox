import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { insertTrip } from '@/contexts/db';
import { useThemeColor } from '@/hooks/use-theme-color';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Image, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewTripScreen() {
  const [title, setTitle] = useState('');
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
  const mapRef = useRef<MapView>(null);
  const border = useThemeColor({}, 'icon');
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    setError(null);
    if (!title) {
      setError('Title is required');
      return;
    }
    const start = startDate ? startDate.getTime() : null;
    const end = endDate ? endDate.getTime() : null;
    const tripId = await insertTrip({ title, startDate: start, endDate: end, coverUri: coverUri || null });
    
    // Update location if set
    if (lat && lng) {
      const { updateTripLocation } = await import('@/contexts/db');
      await updateTripLocation(tripId, lat, lng);
    }
    router.back();
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
      
      // Center the map on the current location
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
        
        // Center the map on the searched location
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to select a cover image!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to take a photo!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Cover Image',
      'Choose how you want to add a cover image for your trip',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
      ]
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

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
        <ThemedText type="title" style={styles.title}>New trip</ThemedText>
      {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
      <TextInput style={[styles.input, { borderColor: border, color: text }]} placeholderTextColor={border} placeholder="Title" value={title} onChangeText={setTitle} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button title={startDate ? `Start: ${startDate.toDateString()}` : 'Pick start date'} onPress={() => {
            if (Platform.OS === 'android') {
              const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
              DateTimePickerAndroid.open({
                value: startDate ?? new Date(),
                mode: 'date',
                onChange: (_: any, d?: Date) => { if (d) setStartDate(d); },
              });
            } else if (Platform.OS === 'ios') {
              setShowStart(true);
            }
          }} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Button title={endDate ? `End: ${endDate.toDateString()}` : 'Pick end date'} onPress={() => {
            if (Platform.OS === 'android') {
              const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
              DateTimePickerAndroid.open({
                value: endDate ?? new Date(),
                mode: 'date',
                onChange: (_: any, d?: Date) => { if (d) setEndDate(d); },
              });
            } else if (Platform.OS === 'ios') {
              setShowEnd(true);
            }
          }} />
        </View>
      </View>
      {Platform.OS === 'ios' && showStart ? (
        (() => {
          const RNDateTimePicker = require('@react-native-community/datetimepicker').default;
          return (
            <RNDateTimePicker value={startDate ?? new Date()} mode="date" display="inline" onChange={(_: any, d?: Date) => { if (d) setStartDate(d); setShowStart(false); }} />
          );
        })()
      ) : null}
      {Platform.OS === 'ios' && showEnd ? (
        (() => {
          const RNDateTimePicker = require('@react-native-community/datetimepicker').default;
          return (
            <RNDateTimePicker value={endDate ?? new Date()} mode="date" display="inline" onChange={(_: any, d?: Date) => { if (d) setEndDate(d); setShowEnd(false); }} />
          );
        })()
      ) : null}
          <ThemedText style={styles.label}>Cover Image</ThemedText>
          <View style={styles.imageSection}>
            {coverUri ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: coverUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.changeImageButton} onPress={showImagePicker}>
                  <ThemedText style={styles.changeImageText}>Change Image</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.imagePickerButton, { borderColor: border }]} onPress={showImagePicker}>
                <ThemedText style={styles.imagePickerIcon}>📷</ThemedText>
                <ThemedText style={[styles.imagePickerText, { color: text }]}>Add Cover Image</ThemedText>
                <ThemedText style={[styles.imagePickerSubtext, { color: border }]}>Tap to select from gallery or take a photo</ThemedText>
              </TouchableOpacity>
            )}
          </View>
      <ThemedText style={{ marginBottom: 8 }}>Choose location (tap on map or search below):</ThemedText>
      <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: border, marginBottom: 12 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
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
              title="New Trip Location"
            />
          ) : null}
        </MapView>
      </View>
      
      {/* Search and Location Controls */}
      <View style={styles.locationSection}>
        {/* Search Bar */}
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
        
        {/* Current Location Button */}
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
      
          <View style={{ height: 8 }} />
          <Button title="Save" onPress={handleSave} />
        </ScrollView>
      </ThemedView>
    );
  }

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  title: { textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backButton: { marginBottom: 12 },
  locationSection: { marginBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  searchButtonText: {
    fontSize: 16,
  },
  locationButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
      locationButtonText: {
        fontSize: 14,
        fontWeight: '500',
      },
      label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
      },
      imageSection: {
        marginBottom: 16,
      },
      imagePreview: {
        position: 'relative',
      },
      previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
      },
      changeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
      },
      changeImageText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
      },
      imagePickerButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      },
      imagePickerIcon: {
        fontSize: 48,
        marginBottom: 12,
      },
      imagePickerText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
      },
      imagePickerSubtext: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.7,
      },
    });


