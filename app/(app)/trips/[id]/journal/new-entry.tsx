import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { getTripSteps, insertJournalEntry, insertJournalMedia, TripStepRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewJournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [steps, setSteps] = useState<TripStepRow[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [audios, setAudios] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
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
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!id) {
      setError('Trip ID is missing');
      return;
    }

    try {
      const entryId = await insertJournalEntry({
        tripId: Number(id),
        stepId: selectedStepId,
        title: title.trim(),
        content: content.trim() || null,
        entryDate: entryDate.getTime(),
      });

      // Add photos
      for (const photoUri of photos) {
        await insertJournalMedia({
          journalEntryId: entryId,
          type: 'photo',
          uri: photoUri,
        });
      }

      // Add audios
      for (const audioUri of audios) {
        await insertJournalMedia({
          journalEntryId: entryId,
          type: 'audio',
          uri: audioUri,
        });
      }

      Alert.alert('Success', 'Journal entry created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      setError('Failed to save journal entry');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to select photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos(prev => [...prev, ...newPhotos]);
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
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Add Photos',
      'Choose how you want to add photos to your journal entry',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
      ]
    );
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onChangeDate = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || entryDate;
    setEntryDate(currentDate);
    setShowDatePicker(false);
  };

  const showMode = (currentMode: 'date' | 'time') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: entryDate,
        onChange: onChangeDate,
        mode: currentMode,
        is24Hour: true,
      });
    } else {
      setShowDatePicker(true);
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
        
        <ThemedText type="title" style={styles.title}>New Journal Entry</ThemedText>
        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
        
        {/* Title Input */}
        <TextInput
          style={[styles.input, { borderColor: border, color: text }]}
          placeholder="Entry title"
          placeholderTextColor={border}
          value={title}
          onChangeText={setTitle}
        />
        
        {/* Content Input */}
        <TextInput
          style={[styles.textArea, { borderColor: border, color: text }]}
          placeholder="Write about your day, experiences, thoughts..."
          placeholderTextColor={border}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
        />
        
        {/* Date Selection */}
        <View style={styles.dateSection}>
          <ThemedText style={[styles.label, { color: text }]}>Entry Date</ThemedText>
          <Button 
            title={`Date: ${entryDate.toDateString()}`} 
            onPress={() => showMode('date')} 
          />
        </View>
        
        {Platform.OS === 'ios' && showDatePicker ? (
          <RNDateTimePicker
            value={entryDate}
            mode="date"
            display="inline"
            onChange={onChangeDate}
          />
        ) : null}
        
        {/* Step Selection */}
        <View style={styles.stepSection}>
          <ThemedText style={[styles.label, { color: text }]}>Related Step (Optional)</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepScrollView}>
            <TouchableOpacity 
              style={[styles.stepOption, { backgroundColor: selectedStepId === null ? theme.tint : theme.background, borderColor: theme.tint }]}
              onPress={() => setSelectedStepId(null)}
            >
              <ThemedText style={[styles.stepOptionText, { color: selectedStepId === null ? 'white' : theme.tint }]}>
                General
              </ThemedText>
            </TouchableOpacity>
            {steps.map((step) => (
              <TouchableOpacity 
                key={step.id}
                style={[styles.stepOption, { backgroundColor: selectedStepId === step.id ? theme.tint : theme.background, borderColor: theme.tint }]}
                onPress={() => setSelectedStepId(step.id)}
              >
                <ThemedText style={[styles.stepOptionText, { color: selectedStepId === step.id ? 'white' : theme.tint }]}>
                  {step.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Photos Section */}
        <View style={styles.photosSection}>
          <View style={styles.photosHeader}>
            <ThemedText style={[styles.label, { color: text }]}>Photos ({photos.length})</ThemedText>
            <TouchableOpacity style={[styles.addPhotoButton, { borderColor: theme.tint }]} onPress={showImagePicker}>
              <ThemedText style={[styles.addPhotoText, { color: theme.tint }]}>+ Add Photos</ThemedText>
            </TouchableOpacity>
          </View>
          
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollView}>
              {photos.map((photoUri, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <ThemedText style={styles.removePhotoText}>×</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
        
        {/* Audio Section (Placeholder for future implementation) */}
        <View style={styles.audioSection}>
          <ThemedText style={[styles.label, { color: text }]}>Audio Notes (Coming Soon)</ThemedText>
          <View style={[styles.placeholder, { borderColor: border }]}>
            <ThemedText style={[styles.placeholderText, { color: border }]}>
              Audio recording feature will be available soon
            </ThemedText>
          </View>
        </View>
        
        <View style={{ height: 16 }} />
        <Button title="Save Entry" onPress={handleSave} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  backButton: { marginBottom: 12 },
  title: { textAlign: 'center', marginBottom: 12 },
  input: { 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateSection: {
    marginBottom: 16,
  },
  stepSection: {
    marginBottom: 16,
  },
  stepScrollView: {
    flexDirection: 'row',
  },
  stepOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  stepOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photosSection: {
    marginBottom: 16,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photosScrollView: {
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  audioSection: {
    marginBottom: 16,
  },
  placeholder: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
