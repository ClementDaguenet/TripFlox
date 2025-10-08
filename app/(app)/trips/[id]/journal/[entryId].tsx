import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { deleteJournalEntry, deleteJournalMedia, getJournalEntryById, getJournalMedia, getTripSteps, JournalEntryRow, JournalMediaRow, TripStepRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function JournalEntryDetailScreen() {
  const { t } = useTranslation();
  const { id, entryId } = useLocalSearchParams<{ id: string; entryId: string }>();
  const [entry, setEntry] = useState<JournalEntryRow | null>(null);
  const [media, setMedia] = useState<JournalMediaRow[]>([]);
  const [steps, setSteps] = useState<TripStepRow[]>([]);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    if (!entryId) return;
    
    try {
      const [entryData, mediaData, stepsData] = await Promise.all([
        getJournalEntryById(Number(entryId)),
        getJournalMedia(Number(entryId)),
        getTripSteps(Number(id))
      ]);
      
      setEntry(entryData);
      setMedia(mediaData);
      setSteps(stepsData);
    } catch (error) {
      console.error('Error loading journal entry data:', error);
    }
  }, [entryId, id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStepName = (stepId: number | null) => {
    if (!stepId) return 'General';
    const step = steps.find(s => s.id === stepId);
    return step?.name || 'Unknown Step';
  };

  const handleDeleteEntry = () => {
    Alert.alert(
      t('journalEntry.deleteEntry'),
      t('journalEntry.deleteEntryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteJournalEntry(Number(entryId));
              router.back();
            } catch (error) {
              Alert.alert(t('journalEntry.error'), t('journalEntry.failedToDeleteEntry'));
            }
          }
        }
      ]
    );
  };

  const handleDeleteMedia = (mediaId: number, mediaType: string) => {
    Alert.alert(
      t('journalEntry.deleteMedia'),
      t('journalEntry.deleteMediaConfirm', { type: mediaType }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteJournalMedia(mediaId);
              loadData();
            } catch (error) {
              Alert.alert(t('journalEntry.error'), t('journalEntry.failedToDeleteMedia'));
            }
          }
        }
      ]
    );
  };

  const renderPhoto = ({ item }: { item: JournalMediaRow }) => (
    <View style={styles.mediaContainer}>
      <Image source={{ uri: item.uri }} style={styles.photo} />
      {item.caption ? (
        <ThemedText style={[styles.mediaCaption, { color: text }]}>{item.caption}</ThemedText>
      ) : null}
      <TouchableOpacity 
        style={styles.deleteMediaButton}
        onPress={() => handleDeleteMedia(item.id, 'photo')}
      >
        <ThemedText style={[styles.deleteMediaText, { color: theme.text }]}>×</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (!entry) {
    return (
      <ThemedView style={styles.container}>
        <ThemedTextI18n i18nKey="journalEntry.loading" />
      </ThemedView>
    );
  }

  const photos = media.filter(m => m.type === 'photo');
  const audios = media.filter(m => m.type === 'audio');

  const renderAudio = ({ item }: { item: JournalMediaRow }) => (
    <View style={[styles.audioContainer, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <View style={styles.audioInfo}>
        <ThemedText style={styles.audioIcon}>🎵</ThemedText>
        <View style={styles.audioDetails}>
          <ThemedTextI18n 
            i18nKey="journalEntry.audioRecording" 
            style={[styles.audioTitle, { color: text }]}
          />
          {item.caption ? (
            <ThemedText style={[styles.audioCaption, { color: text }]}>{item.caption}</ThemedText>
          ) : null}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteMediaButton}
        onPress={() => handleDeleteMedia(item.id, 'audio')}
      >
        <ThemedText style={[styles.deleteMediaText, { color: theme.text }]}>×</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedTextI18n i18nKey="journalEntry.back" type="link" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={[styles.title, { color: text }]}>
              {entry.title}
            </ThemedText>
            <ThemedText style={[styles.step, { color: theme.tint }]}>
              {getStepName(entry.stepId)}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEntry}>
            <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateContainer}>
          <ThemedText style={[styles.date, { color: text }]}>
            {formatDate(entry.entryDate)}
          </ThemedText>
          <ThemedText style={[styles.time, { color: text }]}>
            {formatTime(entry.entryDate)}
          </ThemedText>
        </View>
        
        {entry.content ? (
          <View style={styles.contentContainer}>
            <ThemedText style={[styles.content, { color: text }]}>
              {entry.content}
            </ThemedText>
          </View>
        ) : null}
        
        {photos.length > 0 ? (
          <View style={styles.mediaSection}>
            <ThemedTextI18n 
              i18nKey="journalEntry.photos" 
              i18nOptions={{ count: photos.length }}
              type="subtitle" 
              style={[styles.mediaSectionTitle, { color: text }]}
            />
            <FlatList
              data={photos}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderPhoto}
              horizontal
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaList}
            />
          </View>
        ) : null}
        
        {audios.length > 0 ? (
          <View style={styles.mediaSection}>
            <ThemedTextI18n 
              i18nKey="journalEntry.audioNotes" 
              i18nOptions={{ count: audios.length }}
              type="subtitle" 
              style={[styles.mediaSectionTitle, { color: text }]}
            />
            <View style={styles.audioList}>
              {audios.map((audio) => renderAudio({ item: audio }))}
            </View>
          </View>
        ) : null}
        
        {media.length === 0 ? (
          <View style={styles.emptyMediaState}>
            <ThemedText style={styles.emptyMediaIcon}>📷</ThemedText>
            <ThemedTextI18n 
              i18nKey="journalEntry.noMedia" 
              style={[styles.emptyMediaText, { color: text }]}
            />
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  step: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    opacity: 0.7,
  },
  contentContainer: {
    marginBottom: 24,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  mediaSection: {
    marginBottom: 24,
  },
  mediaSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mediaList: {
    paddingRight: 16,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  mediaCaption: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },
  deleteMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteMediaText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioList: {
    gap: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  audioInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  audioDetails: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  audioCaption: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyMediaState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMediaIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyMediaText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
