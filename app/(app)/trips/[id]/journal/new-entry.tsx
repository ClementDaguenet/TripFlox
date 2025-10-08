import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { insertJournalEntry } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function NewJournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = theme.icon;
  const text = theme.text;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    
    try {
      if (!title.trim()) {
        setError('Title is required');
        setIsSaving(false);
        return;
      }
      
      if (!id) {
        setError('Trip ID is missing');
        setIsSaving(false);
        return;
      }

      const tripId = Number(id);
      
      if (isNaN(tripId)) {
        setError('Invalid Trip ID');
        setIsSaving(false);
        return;
      }

      await insertJournalEntry({
        tripId,
        title: title.trim(),
        content: content.trim() || null,
        entryDate: Date.now(),
        photos: photos.length > 0 ? photos : null,
      });

      Alert.alert(t('common.success'), t('newEntry.entryCreated'));
      router.back();
    } catch (err) {
      setError(t('newEntry.failedToCreate'));
      Alert.alert(t('common.error'), t('newEntry.failedToCreate'));
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('newEntry.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
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
                  i18nKey="newEntry.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="newEntry.subtitle" 
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
                  i18nKey="labels.entryTitle" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.input, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('placeholders.enterEntryTitle')}
                  placeholderTextColor={theme.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="labels.content" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.textArea, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('placeholders.writeExperience')}
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={8}
                  value={content}
                  onChangeText={setContent}
                />
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

          <GlassCard style={styles.photosCard} blurIntensity={20}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Photos (Optional)
            </ThemedText>
            
            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <View style={styles.photoContainer}>
                    <ThemedText style={styles.photoText}>📷</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <ThemedText style={[styles.removePhotoText, { color: theme.text }]}>×</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < 5 && (
                <TouchableOpacity
                  style={[styles.addPhotoButton, { borderColor: border }]}
                  onPress={pickImage}
                >
                  <ThemedText style={[styles.addPhotoText, { color: theme.textTertiary }]}>
                    + Add Photo
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>

          <GradientButton
            title={isSaving ? t('newEntry.creating') : t('newEntry.create')}
            gradient="primary"
            size="xl"
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          />
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },

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
    height: 120,
    textAlignVertical: 'top',
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },

  photosCard: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  photoText: {
    fontSize: 24,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 14,
    textAlign: 'center',
  },

  saveButton: {
    marginTop: 8,
  },
});